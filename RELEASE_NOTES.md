# 🚀 FormVault Release Notes (v1.1.0 - "Production Hardened & Compliant")

**Release Date**: September 9, 2026  
**Focus**: Compliance Architecture, Dynamic Customer Support, Showcase UI Refinement, and Commercial Protection.

---

## 🌟 Major Highlights

### 1. Crisp Live Chat Integration & Custom Placement
- **Dynamic Activation**: Seamlessly activate customer chat support by entering your Crisp Website UUID in the Admin Console.
- **Configurable Positioning**: Switch between bottom-right and bottom-left corner placement via backend settings (`crisp_position`).
- **One-Click Support Access**: Top navigation bar includes a quick Support button that instantly triggers the live chat window.
- **Admin Verification Tool**: Verify API reachability and operator availability directly from the SQLAdmin dashboard.

### 2. High-Converting Showcase & Symmetrical Grid Architecture
- **Symmetrical 3-Card Centering**: Automatically calculates grid columns (4 cols per card for 3 items) ensuring cards fill the full 12-column width with zero awkward whitespace on the right.
- **Prominent Student Special Promo Ribbon**: Separated student age criteria (`15–30 let`) into a glowing graduation-cap promotional ribbon with "Special Rate" badges.
- **Compact Baseline Pricing**: Amount, currency (`CZK`), and billing period (`/ year`) are aligned horizontally on the baseline with zero empty lines.
- **Medical Guarantee Shield**: High-assurance emerald green badge highlighting statutory 10,000,000 CZK OAMP compliance.
- **Partner Underwriters Centering**: Partner insurer cards (PVZP, Slavia, SV) also adapt dynamically to 3-column symmetrical centering.
- **Footer Deduplication**: Eliminated duplicate company links, consolidating legal disclosures into a single authoritative bottom row.

### 3. Regulatory Governance & Business Scope Gate
- **Dual Operating Modes**:
  - `LEAD_ONLY` (Default): Introducer model for collecting initial customer intent without sensitive document exposure.
  - `ASSISTED_APPLICATION`: Full digital application intake unlocked upon verified brokerage and DPA agreements.
- **Tamper-Evident SHA-256 Audit Chain**: Every administrative and application action is cryptographically chained to its parent entry, preventing backdating or silent log alterations.

### 4. Commercial Protection & PolyForm License
- **PolyForm Noncommercial 1.0.0**: Protects open-source source code from unauthorized commercial redistribution or commercial SaaS hosting.
- **Dual Licensing**: Commercial licenses available via `licensing@hktse.eu.org`.

---

## 📋 Production Verification Summary

- **Backend CI**: 261 Pytest tests passed (100% coverage across auth, schemas, encryption, and audit log chains).
- **Frontend CI**: 20 test suites / 180 tests passed; WCAG 2.1 AA compliant.
- **Docker Compose**: Running in production on `EU_Docker_108` with health checks passing.
