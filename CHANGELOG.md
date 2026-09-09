# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-09-09

### Added
- **Crisp Live Chat Integration**: Dynamic backend configuration via SQLAdmin (`crisp_website_id`), configurable placement (`crisp_position`: bottom-right or bottom-left), and live API connectivity verification.
- **Header Direct Support Callout**: Quick Support button on the navigation bar that directly opens the Crisp conversation modal.
- **Symmetrical Centered Plans & Partners Grid**: Dynamic responsive layout adapting to 1, 2, 3, or 4 plans/partners with equal-height cards and zero awkward white gaps.
- **Prominent Student Special Promo Ribbon**: Eye-catching graduation cap banner, special rate badges, and clean separation from core plan titles.
- **Baseline Inline Pricing**: Seamless single-line alignment of plan amounts, currency, and billing periods, completely eliminating awkward empty lines.
- **Emerald Medical Guarantee Shield**: Clean statutory compliance badge highlighting 10,000,000 CZK OAMP certification.
- **Regulatory Scope Gate**: `business_scope_mode` supporting `LEAD_ONLY` and `ASSISTED_APPLICATION` with SQLAdmin configuration controls.
- **Cryptographic Audit Hash Chain**: SHA-256 parent hashing across audit logs guaranteeing tamper resistance.
- **PolyForm Noncommercial 1.0.0 License**: Commercial protection with dual-licensing structure and official licensing channel.

### Fixed
- Fixed Nginx CSP rules to allow Crisp chat iframe rendering (`client.crisp.chat`, `*.crisp.chat`).
- Fixed production API path binding in `.env.production` to use dynamic same-origin relative URLs (`""`).
- Eliminated redundant duplicate corporate links in the footer, maintaining a clean single set of credentials in the bottom verification row.
- Standardized all SQLAdmin admin templates and dashboard widgets to 100% pure English.

---

## [1.0.0] - 2026-09-08

### Added
- **Multi-step Insurance Form**: Fluid connected step rail with real-time validation and encryption.
- **AES-256-GCM Secure File Vault**: File signature inspection and encrypted storage on Local Disk or S3.
- **Dual-Factor Status Tracker (`/track`)**: Reference number and email lookup with timeline visualization and OWASP-compliant masking.
- **SQLAdmin Management Console**: Full application lifecycle auditing, status updates, and dynamic system settings.
- **First-Run Setup Wizard**: Interactive administrator creation at `/setup`.
- **12 Languages i18n**: English, Chinese, Czech, German, Spanish, French, Italian, Portuguese, Russian, Japanese, Korean, Arabic.
- **Docker Compose Deployment**: Dedicated high-range ports (9080/9081) with zero host port collisions.
