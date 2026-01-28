"""
Email retry service for handling failed email exports with exponential backoff.

This module provides background task functionality for retrying failed
email exports with configurable retry policies and exponential backoff.
"""

import asyncio
from datetime import datetime, timedelta
from typing import List, Optional
import structlog
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.email_export import EmailExport
from app.services.email_service import email_service
from app.core.config import get_settings

logger = structlog.get_logger(__name__)


class EmailRetryService:
    """
    Service for managing email export retries with exponential backoff.

    Provides functionality for:
    - Automatic retry of failed email exports
    - Exponential backoff delay calculation
    - Maximum retry limit enforcement
    - Background task scheduling
    """

    def __init__(self):
        """Initialize email retry service."""
        self.settings = get_settings()
        self.max_retries = 3
        self.base_delay = 60  # 1 minute base delay
        self.max_delay = 3600  # 1 hour maximum delay
        self.running = False
        self._retry_task: Optional[asyncio.Task] = None

    async def start_retry_worker(self) -> None:
        """Start the background retry worker task."""
        if self.running:
            logger.warning("Email retry worker is already running")
            return

        self.running = True
        self._retry_task = asyncio.create_task(self._retry_worker_loop())

        logger.info("Email retry worker started")

    async def stop_retry_worker(self) -> None:
        """Stop the background retry worker task."""
        if not self.running:
            return

        self.running = False

        if self._retry_task:
            self._retry_task.cancel()
            try:
                await self._retry_task
            except asyncio.CancelledError:
                pass

        logger.info("Email retry worker stopped")

    async def _retry_worker_loop(self) -> None:
        """Main retry worker loop that processes failed exports."""
        logger.info("Email retry worker loop started")

        while self.running:
            try:
                await self._process_retry_queue()

                # Wait before next check (check every 5 minutes)
                await asyncio.sleep(300)

            except asyncio.CancelledError:
                logger.info("Email retry worker cancelled")
                break
            except Exception as e:
                logger.error(
                    "Error in email retry worker loop", error=str(e), exc_info=True
                )
                # Wait before retrying the loop
                await asyncio.sleep(60)

    async def _process_retry_queue(self) -> None:
        """Process the queue of failed email exports that need retry."""
        try:
            # Get database session
            db = next(get_db())

            try:
                # Find exports that need retry
                retry_exports = self._get_exports_for_retry(db)

                if not retry_exports:
                    logger.debug("No email exports found for retry")
                    return

                logger.info("Processing email export retries", count=len(retry_exports))

                # Process each export
                for export in retry_exports:
                    await self._retry_single_export(db, export)

                # Commit all changes
                db.commit()

            finally:
                db.close()

        except Exception as e:
            logger.error("Error processing retry queue", error=str(e), exc_info=True)

    def _get_exports_for_retry(self, db: Session) -> List[EmailExport]:
        """Get email exports that are ready for retry."""

        # Calculate cutoff time for retry (exports older than their delay period)
        now = datetime.utcnow()

        # Get exports with status 'retry' that haven't exceeded max retries
        retry_exports = (
            db.query(EmailExport)
            .filter(
                EmailExport.status == "retry",
                EmailExport.retry_count < self.max_retries,
            )
            .all()
        )

        # Filter exports that are ready for retry based on delay
        ready_exports = []

        for export in retry_exports:
            delay = self._calculate_retry_delay(export.retry_count)
            retry_time = export.created_at + timedelta(seconds=delay)

            if now >= retry_time:
                ready_exports.append(export)

        return ready_exports

    def _calculate_retry_delay(self, retry_count: int) -> int:
        """Calculate retry delay with exponential backoff."""
        delay = self.base_delay * (2**retry_count)
        return min(delay, self.max_delay)

    async def _retry_single_export(self, db: Session, export: EmailExport) -> None:
        """Retry a single email export."""

        logger.info(
            "Retrying email export",
            export_id=export.id,
            application_id=export.application_id,
            retry_count=export.retry_count + 1,
            recipient=export.recipient_email,
        )

        try:
            # Attempt to send email
            success = await email_service.send_application_export(
                application=export.application,
                recipient_email=export.recipient_email,
                insurance_company=export.insurance_company,
            )

            if success:
                # Mark as sent
                export.mark_as_sent()

                # Update application status if needed
                if export.application.status == "submitted":
                    export.application.status = "exported"

                logger.info(
                    "Email export retry successful",
                    export_id=export.id,
                    application_id=export.application_id,
                    final_retry_count=export.retry_count,
                )
            else:
                # Increment retry count and check if max reached
                export.retry_count += 1

                if export.retry_count >= self.max_retries:
                    export.mark_as_failed("Maximum retry attempts reached")

                    logger.warning(
                        "Email export failed after max retries",
                        export_id=export.id,
                        application_id=export.application_id,
                        max_retries=self.max_retries,
                    )
                else:
                    export.mark_for_retry("Retry attempt failed")

                    logger.info(
                        "Email export retry failed, will retry again",
                        export_id=export.id,
                        application_id=export.application_id,
                        retry_count=export.retry_count,
                        max_retries=self.max_retries,
                    )

        except Exception as e:
            # Handle retry failure
            export.retry_count += 1

            if export.retry_count >= self.max_retries:
                export.mark_as_failed(
                    f"Maximum retry attempts reached. Last error: {str(e)}"
                )

                logger.error(
                    "Email export failed permanently after max retries",
                    export_id=export.id,
                    application_id=export.application_id,
                    error=str(e),
                    max_retries=self.max_retries,
                )
            else:
                export.mark_for_retry(f"Retry failed: {str(e)}")

                logger.error(
                    "Email export retry failed with error",
                    export_id=export.id,
                    application_id=export.application_id,
                    retry_count=export.retry_count,
                    error=str(e),
                )

    async def retry_export_manually(
        self, db: Session, export_id: str, force_retry: bool = False
    ) -> bool:
        """
        Manually retry a specific email export.

        Args:
            db: Database session
            export_id: ID of the email export to retry
            force_retry: Whether to force retry even if max retries reached

        Returns:
            bool: True if retry was successful, False otherwise
        """

        # Get the export
        export = db.query(EmailExport).filter(EmailExport.id == export_id).first()

        if not export:
            logger.warning(
                "Email export not found for manual retry", export_id=export_id
            )
            return False

        # Check if retry is allowed
        if not force_retry and export.retry_count >= self.max_retries:
            logger.warning(
                "Manual retry rejected - max retries reached",
                export_id=export_id,
                retry_count=export.retry_count,
                max_retries=self.max_retries,
            )
            return False

        # Perform retry
        try:
            await self._retry_single_export(db, export)
            db.commit()

            return export.is_sent

        except Exception as e:
            db.rollback()
            logger.error(
                "Manual retry failed", export_id=export_id, error=str(e), exc_info=True
            )
            return False

    async def get_retry_statistics(self, db: Session) -> dict:
        """Get statistics about email export retries."""

        # Count exports by status
        pending_count = (
            db.query(EmailExport).filter(EmailExport.status == "pending").count()
        )

        retry_count = (
            db.query(EmailExport).filter(EmailExport.status == "retry").count()
        )

        sent_count = db.query(EmailExport).filter(EmailExport.status == "sent").count()

        failed_count = (
            db.query(EmailExport).filter(EmailExport.status == "failed").count()
        )

        # Get exports that have been retried
        retried_exports = (
            db.query(EmailExport).filter(EmailExport.retry_count > 0).all()
        )

        total_retries = sum(export.retry_count for export in retried_exports)

        return {
            "pending_exports": pending_count,
            "retry_exports": retry_count,
            "sent_exports": sent_count,
            "failed_exports": failed_count,
            "total_exports": pending_count + retry_count + sent_count + failed_count,
            "total_retries_performed": total_retries,
            "exports_with_retries": len(retried_exports),
            "worker_running": self.running,
            "max_retries": self.max_retries,
            "base_delay_seconds": self.base_delay,
            "max_delay_seconds": self.max_delay,
        }


# Global email retry service instance
email_retry_service = EmailRetryService()
