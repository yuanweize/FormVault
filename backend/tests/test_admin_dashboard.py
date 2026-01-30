"""
Tests for admin dashboard endpoints.
"""

import pytest
from datetime import datetime
from unittest.mock import Mock, patch
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.database import get_db


class TestAdminDashboard:
    """Test cases for admin dashboard endpoints."""

    @patch("app.api.v1.endpoints.admin.get_performance_stats")
    @patch("app.api.v1.endpoints.admin.get_error_summary")
    def test_get_dashboard_stats(self, mock_error_summary, mock_perf_stats, client):
        """Test getting dashboard statistics."""
        # Mock database session
        mock_db = Mock(spec=Session)
        app.dependency_overrides[get_db] = lambda: mock_db

        try:
            # Mock query results
            mock_db.query.return_value.filter.return_value.count.return_value = 10
            mock_db.query.return_value.filter.return_value.group_by.return_value.all.return_value = [
                ("submitted", 5),
                ("processed", 3),
                ("draft", 2),
            ]

            # Mock performance and error stats
            mock_perf_stats.return_value = {
                "total_queries": 100,
                "average_query_time": 0.15,
            }
            mock_error_summary.return_value = {
                "total_errors": 5,
                "errors_by_severity": {"error": 3, "warning": 2},
            }

            # Make request
            response = client.get("/api/v1/admin/dashboard?days=7")

            # Verify response
            assert response.status_code == 200
            data = response.json()

            assert "period" in data
            assert "applications" in data
            assert "files" in data
            assert "emails" in data
            assert "activity" in data
            assert "performance" in data
            assert "errors" in data
            assert "health" in data
            assert "generated_at" in data

            assert data["period"]["days"] == 7
        finally:
            app.dependency_overrides = {}

    def test_get_application_statistics(self, client):
        """Test getting detailed application statistics."""
        # Mock database session
        mock_db = Mock(spec=Session)
        app.dependency_overrides[get_db] = lambda: mock_db

        try:
            # Mock application statistics
            mock_db.query.return_value.filter.return_value.count.return_value = 25
            mock_db.query.return_value.filter.return_value.group_by.return_value.all.return_value = [
                ("health", 15),
                ("auto", 8),
                ("life", 2),
            ]

            # Make request
            response = client.get("/api/v1/admin/applications/stats?days=30")

            # Verify response
            assert response.status_code == 200
            data = response.json()

            assert "total" in data
            assert "by_status" in data
            assert "by_insurance_type" in data
            assert "by_language" in data
            assert "daily_breakdown" in data
        finally:
            app.dependency_overrides = {}

    @patch("app.api.v1.endpoints.admin.get_performance_stats")
    def test_get_performance_statistics(self, mock_get_stats, client):
        """Test getting performance statistics."""
        # Mock performance stats
        mock_stats = {
            "query_stats": {
                "SELECT * FROM applications": {"count": 50, "total_time": 2.5}
            },
            "total_queries": 50,
            "average_query_time": 0.05,
            "slow_query_threshold": 1.0,
        }
        mock_get_stats.return_value = mock_stats

        # Make request
        response = client.get("/api/v1/admin/performance/stats")

        # Verify response
        assert response.status_code == 200
        data = response.json()

        assert data == mock_stats
        mock_get_stats.assert_called_once()

    @patch("app.api.v1.endpoints.admin.reset_performance_stats")
    def test_reset_performance_statistics(self, mock_reset, client):
        """Test resetting performance statistics."""
        # Make request
        response = client.post("/api/v1/admin/performance/reset")

        # Verify response
        assert response.status_code == 200
        data = response.json()

        assert data["success"] is True
        assert "reset successfully" in data["message"]
        mock_reset.assert_called_once()

    @patch("app.api.v1.endpoints.admin.get_error_summary")
    def test_get_error_tracking_summary(self, mock_get_summary, client):
        """Test getting error tracking summary."""
        # Mock error summary
        mock_summary = {
            "total_error_types": 3,
            "total_errors": 15,
            "errors_by_severity": {"critical": 1, "error": 8, "warning": 6},
            "recent_errors": [],
            "top_errors": [],
        }
        mock_get_summary.return_value = mock_summary

        # Make request
        response = client.get("/api/v1/admin/errors/summary")

        # Verify response
        assert response.status_code == 200
        data = response.json()

        assert data == mock_summary
        mock_get_summary.assert_called_once()

    def test_get_audit_logs_basic(self, client):
        """Test getting audit logs with basic parameters."""
        mock_db = Mock(spec=Session)
        app.dependency_overrides[get_db] = lambda: mock_db

        try:
            # Mock database session and query
            mock_query = Mock()
            mock_db.query.return_value = mock_query
            mock_query.filter.return_value = mock_query
            mock_query.order_by.return_value = mock_query
            mock_query.offset.return_value = mock_query
            mock_query.limit.return_value = mock_query
            mock_query.count.return_value = 150

            # Mock audit log results
            mock_log = Mock()
            mock_log.id = 1
            mock_log.action = "application.create"
            mock_log.application_id = "app-123"
            mock_log.user_ip = "192.168.1.1"
            mock_log.user_agent = "Mozilla/5.0"
            mock_log.details = {"test": "data"}
            mock_log.created_at = datetime.utcnow()

            mock_query.all.return_value = [mock_log]

            # Make request
            response = client.get("/api/v1/admin/audit/logs?limit=50&offset=0")

            # Verify response
            assert response.status_code == 200
            data = response.json()

            assert "logs" in data
            assert "pagination" in data
            assert "filters" in data

            assert len(data["logs"]) == 1
            assert data["logs"][0]["action"] == "application.create"
            assert data["pagination"]["total"] == 150
            assert data["pagination"]["limit"] == 50
            assert data["pagination"]["offset"] == 0
        finally:
            app.dependency_overrides = {}

    def test_get_audit_logs_with_filters(self, client):
        """Test getting audit logs with filters."""
        mock_db = Mock(spec=Session)
        app.dependency_overrides[get_db] = lambda: mock_db

        try:
            # Mock database session and query
            mock_query = Mock()
            mock_db.query.return_value = mock_query
            mock_query.filter.return_value = mock_query
            mock_query.order_by.return_value = mock_query
            mock_query.offset.return_value = mock_query
            mock_query.limit.return_value = mock_query
            mock_query.count.return_value = 25
            mock_query.all.return_value = []

            # Make request with filters
            response = client.get(
                "/api/v1/admin/audit/logs"
                "?action=application"
                "&application_id=app-123"
                "&start_date=2024-01-01T00:00:00"
                "&end_date=2024-01-31T23:59:59"
            )

            # Verify response
            assert response.status_code == 200
            data = response.json()

            # Verify filters were applied
            assert data["filters"]["action"] == "application"
            assert data["filters"]["application_id"] == "app-123"
            assert data["filters"]["start_date"] is not None
            assert data["filters"]["end_date"] is not None
        finally:
            app.dependency_overrides = {}

    def test_get_audit_logs_invalid_parameters(self, client):
        """Test audit logs endpoint with invalid parameters."""
        # Test with invalid limit
        response = client.get("/api/v1/admin/audit/logs?limit=2000")
        assert response.status_code == 422

        # Test with negative offset
        response = client.get("/api/v1/admin/audit/logs?offset=-1")
        assert response.status_code == 422

    def test_dashboard_stats_database_error(self, client):
        """Test dashboard stats endpoint with database error."""
        # Mock database session that raises error
        mock_db = Mock(spec=Session)
        app.dependency_overrides[get_db] = lambda: mock_db

        try:
            mock_db.query.side_effect = Exception("Database connection failed")

            # Make request
            response = client.get("/api/v1/admin/dashboard")

            # Verify error response
            assert response.status_code == 500
            data = response.json()
            assert "Failed to generate dashboard statistics" in data["detail"]
        finally:
            app.dependency_overrides = {}

    @patch("app.api.v1.endpoints.admin.get_performance_stats")
    def test_performance_stats_error(self, mock_get_stats, client):
        """Test performance stats endpoint with error."""
        # Mock function that raises error
        mock_get_stats.side_effect = Exception("Performance monitoring failed")

        # Make request
        response = client.get("/api/v1/admin/performance/stats")

        # Verify error response
        assert response.status_code == 500
        data = response.json()
        assert "Failed to get performance statistics" in data["detail"]

    @patch("app.api.v1.endpoints.admin.reset_performance_stats")
    def test_reset_performance_stats_error(self, mock_reset, client):
        """Test reset performance stats endpoint with error."""
        # Mock function that raises error
        mock_reset.side_effect = Exception("Reset failed")

        # Make request
        response = client.post("/api/v1/admin/performance/reset")

        # Verify error response
        assert response.status_code == 500
        data = response.json()
        assert "Failed to reset performance statistics" in data["detail"]

    def test_dashboard_stats_parameter_validation(self, client):
        """Test dashboard stats parameter validation."""
        # Test with invalid days parameter (too small)
        response = client.get("/api/v1/admin/dashboard?days=0")
        assert response.status_code == 422

        # Test with invalid days parameter (too large)
        response = client.get("/api/v1/admin/dashboard?days=100")
        assert response.status_code == 422

        # Test with valid days parameter
        # We don't override DB here because client fixture provides a working (but empty) DB
        # The test checks for validation (not 422), so 200 or 500 is != 422.
        # But if it returns 200, it's safer.
        response = client.get("/api/v1/admin/dashboard?days=30")
        assert response.status_code != 422
