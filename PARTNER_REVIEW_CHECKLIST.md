# FormVault Partner Compliance & Legal Review Checklist
**Document Reference**: `FV-LEGAL-CHK-2026-03`  
**Applicable Parties**: 
- **Platform Technology Operator**: HKTSE s.r.o. (IČO: 10858032) – Contractual Role: *Tipař* (Referral/Lead Introducer per Act No. 170/2018 Coll.) / GDPR Processor
- **Licensed Independent Broker**: České pojištění a.s. (IČO: 07399859) – Contractual Role: *Makléř* (Independent Insurance Broker per Act No. 170/2018 Coll., ČNB Reg: 250325SZF) / GDPR Controller
- **Governing Agreement Date**: 2026-03-02 (*Smlouva o obchodní spolupráci č. 2026-03-02*)

---

## 1. Executive Summary
This document serves as the formal verification and review checklist for the technical, regulatory, and legal implementation within the **FormVault** platform. It ensures complete alignment between the public software distribution, user interfaces, database models, cryptographic controls, and the bilateral agreements executed on March 2, 2026.

---

## 2. Regulatory & Contractual Role Alignment

| Requirement / Item | Legal Requirement | Technical Implementation | Review Status |
| :--- | :--- | :--- | :---: |
| **Contractual Separation of Roles** | HKTSE s.r.o. acts exclusively as a *Tipař* (referrer) providing technical infrastructure. České pojištění a.s. acts as the authorized *Makléř* (independent broker) registered with the Czech National Bank (ČNB). | System default operates under `LEAD_ONLY`. Disclaimers and footer clearly identify both legal entities with clickable links to their official websites ([hktse.eu.org](https://hktse.eu.org) & [ceskepojisteni.cz](https://ceskepojisteni.cz)). | **VERIFIED** |
| **No False Licensing Claims** | FormVault and HKTSE must **never** claim to be a "licensed insurance broker" or "underwriter". | Zero occurrences of misleading terms (`registered insurance intermediary`, `brokerage mediation`, `national insurance database`) across all public pages, API responses, and 8 localized language packs (`cs`, `en`, `de`, `es`, `fr`, `it`, `pt`, `ru`). Enforced via CI test `test_public_claims.py`. | **VERIFIED** |
| **Regulatory Feature Gate** | Under Act No. 170/2018 Coll., if no active partner verification is in place, the system must restrict itself to neutral information and basic contact referral (`LEAD_ONLY`). Entering `ASSISTED_APPLICATION` strictly requires 5 verified criteria: active cooperation agreement + active DPA + approved workflow scope + verified product version + verified form recipe. | Admin configuration in SQLAdmin allows toggling `business_scope_mode` (`LEAD_ONLY` vs `ASSISTED_APPLICATION`). Mode is stored immutably with each submitted application (`regulatory_mode_snapshot`). | **VERIFIED** |
| **GDPR Roles (DPA Alignment)** | Per the bilateral Data Processing Agreement (DPA) signed 2026-03-02, České pojištění a.s. is the **Data Controller**; HKTSE s.r.o. is the **Data Processor**. | SystemConfig models `dpa_status`, `dpa_valid_from`, and `dpa_valid_until`. `PartnerHandoffConsent` records granular client consent prior to exporting application dossiers to the broker. | **VERIFIED** |

---

## 3. Commercial Protection & Intellectual Property

| Protection Layer | Purpose & Mechanism | Files / References | Review Status |
| :--- | :--- | :--- | :---: |
| **PolyForm Noncommercial 1.0.0** | Prohibits commercial use, corporate operations, insurance mediation for fee, or SaaS hosting without a paid commercial license. | [`LICENSE`](file:///LICENSE) | **VERIFIED** |
| **Commercial Licensing Notice** | Explicit instructions and contact channels (`licensing@hktse.eu.org`) for insurance brokers, underwriters, and enterprises seeking commercial deployment. | [`COMMERCIAL-LICENSE.md`](file:///COMMERCIAL-LICENSE.md) | **VERIFIED** |
| **Trademark & Brand Protection** | Protects names, logos, domain identities, and prevents third-party insurance carriers from white-labeling the technology without authorization. | [`TRADEMARKS.md`](file:///TRADEMARKS.md) | **VERIFIED** |
| **Copyright & Legal Attribution** | Formal notice attributing intellectual property to HKTSE s.r.o. & Yuan Weize. | [`NOTICE`](file:///NOTICE) | **VERIFIED** |

---

## 4. Technical & Cryptographic Safeguards

| Feature | Technical Architecture | Compliance Benchmark | Review Status |
| :--- | :--- | :--- | :---: |
| **Tamper-Evident Hash Chain** | Every `AuditLog` row contains a strictly monotonic `sequence`, `prev_hash`, and SHA-256 `entry_hash` binding the previous log entry, timestamp, action, and payload. | Integrity cannot be forged or backdated even with direct database write access. Tested via `test_audit_log_cryptographic_hash_chain`. | **VERIFIED** |
| **AES-256-GCM File Encryption** | Customer passport scans, student ID cards, and medical declarations are encrypted with AES-256-GCM using unique per-file initialization vectors (IV) and authentication tags. | Tested in `FileStorageService` and migration script `backend/app/scripts/reencrypt_legacy_files.py`. | **VERIFIED** |
| **Role-Based Decryption Middleware** | Only authenticated administrators with explicit `DECRYPT_PII` or `AUDIT_EXPORT` permissions can decrypt sensitive personal identifiers and passport files. Company partners only access dossiers assigned to their carrier. | Row-level and object-level security verified in `backend/app/admin/views.py`. | **VERIFIED** |
| **Rate Matrix Versioning & Evidence Links** | Premium calculations, PVZP rate cards, and eligibility matrices are versioned via `ProductVersion`, `PriceBook`, and `PriceRate`, each linked to a verified `EvidenceRecord`. | Eliminates outdated or unauthorized quotes. Verifiable validity windows (`valid_from`, `valid_until`). | **VERIFIED** |
| **Production Demo Data Isolation** | Demo insurance products, sample rates, and dummy applications are strictly guarded behind `DEMO_DATA=true`. In production (`DEMO_DATA=false`), no mock records or simulated partners are seeded. | `backend/app/services/seed_service.py` | **VERIFIED** |

---

## 5. Automated Verification & Test Results

- **Public Marketing & Claim Scanner**:  
  `tests/test_public_claims.py` scans 100% of the repository (frontend, backend, documentation, locale files) to ensure 0 forbidden marketing buzzwords (`military-grade`, `hardware-grade`, `zero-knowledge`, `national insurance database`).  
  **Result**: `PASSED (0 violations detected)`.
- **Compliance & Governance Test Suite**:  
  `tests/test_compliance_governance.py` validates PolyForm license, tamper-evident hash chaining, business scope modes, and consent snapshots.  
  **Result**: `PASSED (6/6 tests passing)`.
- **Complete Backend Regression Suite**:  
  `pytest`: `261 passed, 0 failed`.
- **Frontend Quality & Accessibility Suite**:  
  `npm test`: `20 passed, 0 failed, 180 passed tests`.
- **Frontend Production Build**:  
  `npm run build`: `Compiled successfully`.

---

## 6. Sign-off & Recommendations

1. **Broker Confirmation**: České pojištění a.s. compliance officer should review the generated public disclaimer on the production domain before launching campaigns.
2. **Admin Portal Setup**: During initial deployment, the administrator can navigate to `/admin/system-configuration` to verify that `business_scope_mode` is properly aligned with current operations.
