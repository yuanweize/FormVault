"""Add Compliance Versioning and Regulatory Governance Tables

Revision ID: 003
Revises: 002
Create Date: 2026-09-09 20:00:00.000000

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Evidence Records
    op.create_table(
        'evidence_records',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('evidence_type', sa.String(length=50), nullable=False),
        sa.Column('title', sa.String(length=150), nullable=False),
        sa.Column('source_entity', sa.String(length=100), nullable=False),
        sa.Column('source_date', sa.DateTime(), nullable=True),
        sa.Column('valid_from', sa.DateTime(), nullable=True),
        sa.Column('valid_until', sa.DateTime(), nullable=True),
        sa.Column('sha256', sa.String(length=64), nullable=False),
        sa.Column('storage_reference', sa.String(length=255), nullable=True),
        sa.Column('verification_status', sa.String(length=30), server_default='HISTORICAL', nullable=False),
        sa.Column('verified_at', sa.DateTime(), nullable=True),
        sa.Column('verified_by', sa.String(length=100), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
    )
    op.create_index('ix_evidence_records_evidence_type', 'evidence_records', ['evidence_type'])
    op.create_index('ix_evidence_records_sha256', 'evidence_records', ['sha256'])
    op.create_index('ix_evidence_records_verification_status', 'evidence_records', ['verification_status'])

    # 2. Product Versions
    op.create_table(
        'product_versions',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('company_id', sa.Integer(), sa.ForeignKey('insurance_companies.id', ondelete='CASCADE'), nullable=False),
        sa.Column('product_name', sa.String(length=150), nullable=False),
        sa.Column('product_code', sa.String(length=50), nullable=False),
        sa.Column('version', sa.String(length=30), nullable=False),
        sa.Column('valid_from', sa.DateTime(), nullable=False),
        sa.Column('valid_until', sa.DateTime(), nullable=True),
        sa.Column('status', sa.String(length=30), server_default='HISTORICAL', nullable=False),
        sa.Column('evidence_id', sa.String(length=36), sa.ForeignKey('evidence_records.id', ondelete='SET NULL'), nullable=True),
        sa.Column('currency', sa.String(length=10), server_default='CZK', nullable=False),
        sa.Column('coverage_summary', sa.Text(), nullable=False),
        sa.Column('eligibility_config', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
    )
    op.create_index('ix_product_versions_product_code', 'product_versions', ['product_code'])
    op.create_index('ix_product_versions_status', 'product_versions', ['status'])

    # 3. Price Books
    op.create_table(
        'price_books',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('product_version_id', sa.Integer(), sa.ForeignKey('product_versions.id', ondelete='CASCADE'), nullable=False),
        sa.Column('book_code', sa.String(length=50), nullable=False),
        sa.Column('version', sa.String(length=30), nullable=False),
        sa.Column('effective_from', sa.DateTime(), nullable=False),
        sa.Column('effective_until', sa.DateTime(), nullable=True),
        sa.Column('status', sa.String(length=30), server_default='HISTORICAL', nullable=False),
        sa.Column('evidence_id', sa.String(length=36), sa.ForeignKey('evidence_records.id', ondelete='SET NULL'), nullable=True),
        sa.Column('source_document_name', sa.String(length=150), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
    )
    op.create_index('ix_price_books_status', 'price_books', ['status'])

    # 4. Price Rates
    op.create_table(
        'price_rates',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('price_book_id', sa.Integer(), sa.ForeignKey('price_books.id', ondelete='CASCADE'), nullable=False),
        sa.Column('plan_variant', sa.String(length=100), nullable=False),
        sa.Column('duration_months', sa.Integer(), nullable=False),
        sa.Column('min_age', sa.Integer(), server_default='0', nullable=False),
        sa.Column('max_age', sa.Integer(), server_default='99', nullable=False),
        sa.Column('target_group', sa.String(length=50), server_default='student', nullable=False),
        sa.Column('amount_czk', sa.Float(), nullable=False),
        sa.Column('extra_months_free', sa.Integer(), server_default='0', nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
    )
    op.create_index('ix_price_rates_duration_months', 'price_rates', ['duration_months'])

    # 5. Form Recipes
    op.create_table(
        'form_recipes',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('product_version_id', sa.Integer(), sa.ForeignKey('product_versions.id', ondelete='CASCADE'), nullable=False),
        sa.Column('version', sa.String(length=30), nullable=False),
        sa.Column('status', sa.String(length=30), server_default='HISTORICAL', nullable=False),
        sa.Column('schema_definition', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
    )

    # 6. Questionnaire Versions
    op.create_table(
        'questionnaire_versions',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('product_version_id', sa.Integer(), sa.ForeignKey('product_versions.id', ondelete='CASCADE'), nullable=False),
        sa.Column('version', sa.String(length=30), nullable=False),
        sa.Column('title', sa.String(length=150), nullable=False),
        sa.Column('questions_json', sa.Text(), nullable=False),
        sa.Column('is_mandatory_for_approval', sa.Boolean(), server_default=sa.text('1'), nullable=False),
        sa.Column('status', sa.String(length=30), server_default='HISTORICAL', nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
    )

    # 7. Legal Document Versions
    op.create_table(
        'legal_document_versions',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('doc_type', sa.String(length=50), nullable=False),
        sa.Column('version', sa.String(length=30), nullable=False),
        sa.Column('title', sa.String(length=150), nullable=False),
        sa.Column('content_markdown', sa.Text(), nullable=False),
        sa.Column('content_sha256', sa.String(length=64), nullable=False),
        sa.Column('status', sa.String(length=30), server_default='ACTIVE', nullable=False),
        sa.Column('effective_from', sa.DateTime(), nullable=False),
        sa.Column('effective_until', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
    )
    op.create_index('ix_legal_document_versions_doc_type', 'legal_document_versions', ['doc_type'])
    op.create_index('ix_legal_document_versions_status', 'legal_document_versions', ['status'])

    # 8. Disclosure Bundle Snapshots
    op.create_table(
        'disclosure_bundle_snapshots',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('bundle_hash', sa.String(length=64), nullable=False),
        sa.Column('terms_version_id', sa.Integer(), sa.ForeignKey('legal_document_versions.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('privacy_version_id', sa.Integer(), sa.ForeignKey('legal_document_versions.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('intermediary_disclosure_version_id', sa.Integer(), sa.ForeignKey('legal_document_versions.id', ondelete='RESTRICT'), nullable=True),
        sa.Column('bundle_json', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
    )
    op.create_index('ix_disclosure_bundle_snapshots_bundle_hash', 'disclosure_bundle_snapshots', ['bundle_hash'])

    # 9. Partner Handoff Consents
    op.create_table(
        'partner_handoff_consents',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('application_id', sa.String(length=36), nullable=False),
        sa.Column('consent_given', sa.Boolean(), server_default=sa.text('1'), nullable=False),
        sa.Column('recipient_partner_name', sa.String(length=100), nullable=False),
        sa.Column('recipient_partner_ico', sa.String(length=20), nullable=False),
        sa.Column('purpose_delineation', sa.Text(), nullable=False),
        sa.Column('dpa_reference', sa.String(length=100), nullable=True),
        sa.Column('client_ip', sa.String(length=45), nullable=True),
        sa.Column('client_user_agent', sa.Text(), nullable=True),
        sa.Column('consented_at', sa.DateTime(), nullable=False),
    )
    op.create_index('ix_partner_handoff_consents_application_id', 'partner_handoff_consents', ['application_id'])

    # 10. Privacy Requests
    op.create_table(
        'privacy_requests',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('request_type', sa.String(length=50), nullable=False),
        sa.Column('subject_email', sa.String(length=255), nullable=False),
        sa.Column('application_reference', sa.String(length=50), nullable=True),
        sa.Column('status', sa.String(length=30), server_default='PENDING', nullable=False),
        sa.Column('details', sa.Text(), nullable=True),
        sa.Column('resolution_notes', sa.Text(), nullable=True),
        sa.Column('resolved_at', sa.DateTime(), nullable=True),
        sa.Column('resolved_by', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
    )

    # 11. Security Incidents
    op.create_table(
        'security_incidents',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('incident_type', sa.String(length=50), nullable=False),
        sa.Column('severity', sa.String(length=20), server_default='LOW', nullable=False),
        sa.Column('status', sa.String(length=30), server_default='OPEN', nullable=False),
        sa.Column('summary', sa.String(length=255), nullable=False),
        sa.Column('details', sa.Text(), nullable=True),
        sa.Column('remediation_steps', sa.Text(), nullable=True),
        sa.Column('reported_by', sa.String(length=100), nullable=True),
        sa.Column('reported_at', sa.DateTime(), nullable=False),
        sa.Column('closed_at', sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table('security_incidents')
    op.drop_table('privacy_requests')
    op.drop_table('partner_handoff_consents')
    op.drop_table('disclosure_bundle_snapshots')
    op.drop_table('legal_document_versions')
    op.drop_table('questionnaire_versions')
    op.drop_table('form_recipes')
    op.drop_table('price_rates')
    op.drop_table('price_books')
    op.drop_table('product_versions')
    op.drop_table('evidence_records')
