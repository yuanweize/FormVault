"""initial database schema

Revision ID: 001
Revises:
Create Date: 2024-01-01 00:00:00.000000

"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ### Create applications table ###
    op.create_table(
        "applications",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("reference_number", sa.String(20), nullable=False),
        sa.Column("first_name", sa.String(100), nullable=False),
        sa.Column("last_name", sa.String(100), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("phone", sa.String(20), nullable=True),
        sa.Column("address_street", sa.String(255), nullable=True),
        sa.Column("address_city", sa.String(100), nullable=True),
        sa.Column("address_state", sa.String(100), nullable=True),
        sa.Column("address_zip_code", sa.String(20), nullable=True),
        sa.Column("address_country", sa.String(100), nullable=True),
        sa.Column("date_of_birth", sa.Date(), nullable=True),
        sa.Column(
            "insurance_type",
            sa.Enum("health", "auto", "life", "travel", name="insurance_type_enum"),
            nullable=False,
        ),
        sa.Column(
            "preferred_language", sa.String(5), nullable=False, server_default="en"
        ),
        sa.Column(
            "status",
            sa.Enum(
                "draft",
                "submitted",
                "exported",
                "processed",
                name="application_status_enum",
            ),
            nullable=False,
            server_default="draft",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "idx_reference_number", "applications", ["reference_number"], unique=True
    )
    op.create_index("idx_email", "applications", ["email"], unique=False)
    op.create_index("idx_created_at", "applications", ["created_at"], unique=False)
    op.create_index("idx_status", "applications", ["status"], unique=False)

    # ### Create files table ###
    op.create_table(
        "files",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("application_id", sa.String(36), nullable=False),
        sa.Column(
            "file_type",
            sa.Enum("student_id", "passport", name="file_type_enum"),
            nullable=False,
        ),
        sa.Column("original_filename", sa.String(255), nullable=False),
        sa.Column("stored_filename", sa.String(255), nullable=False),
        sa.Column("file_size", sa.Integer(), nullable=False),
        sa.Column("mime_type", sa.String(100), nullable=False),
        sa.Column("file_hash", sa.String(64), nullable=True),
        sa.Column("upload_ip", sa.String(45), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.ForeignKeyConstraint(
            ["application_id"], ["applications.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "idx_files_application_id", "files", ["application_id"], unique=False
    )
    op.create_index("idx_file_type", "files", ["file_type"], unique=False)
    op.create_index("idx_files_created_at", "files", ["created_at"], unique=False)

    # ### Create email_exports table ###
    op.create_table(
        "email_exports",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("application_id", sa.String(36), nullable=False),
        sa.Column("recipient_email", sa.String(255), nullable=False),
        sa.Column("insurance_company", sa.String(255), nullable=True),
        sa.Column(
            "status",
            sa.Enum("pending", "sent", "failed", "retry", name="export_status_enum"),
            nullable=False,
            server_default="pending",
        ),
        sa.Column("sent_at", sa.DateTime(), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("retry_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.ForeignKeyConstraint(
            ["application_id"], ["applications.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "idx_exports_application_id", "email_exports", ["application_id"], unique=False
    )
    op.create_index("idx_exports_status", "email_exports", ["status"], unique=False)
    op.create_index(
        "idx_exports_created_at", "email_exports", ["created_at"], unique=False
    )
    op.create_index(
        "idx_recipient_email", "email_exports", ["recipient_email"], unique=False
    )

    # ### Create audit_logs table ###
    op.create_table(
        "audit_logs",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("application_id", sa.String(36), nullable=True),
        sa.Column("action", sa.String(100), nullable=False),
        sa.Column("user_ip", sa.String(45), nullable=True),
        sa.Column("user_agent", sa.Text(), nullable=True),
        sa.Column("details", sa.JSON(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.ForeignKeyConstraint(
            ["application_id"], ["applications.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "idx_audit_application_id", "audit_logs", ["application_id"], unique=False
    )
    op.create_index("idx_action", "audit_logs", ["action"], unique=False)
    op.create_index("idx_audit_created_at", "audit_logs", ["created_at"], unique=False)
    op.create_index("idx_user_ip", "audit_logs", ["user_ip"], unique=False)


def downgrade() -> None:
    # ### Drop tables in reverse order ###
    op.drop_table("audit_logs")
    op.drop_table("email_exports")
    op.drop_table("files")
    op.drop_table("applications")

    # ### Drop enum types ###
    op.execute("DROP TYPE IF EXISTS export_status_enum")
    op.execute("DROP TYPE IF EXISTS file_type_enum")
    op.execute("DROP TYPE IF EXISTS application_status_enum")
    op.execute("DROP TYPE IF EXISTS insurance_type_enum")
