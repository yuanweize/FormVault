# 🧙‍♂️ FormVault Administrator Operations & Configuration Guide

**Updated**: 2026-09-10  
**Status**: Production-Ready (Dynamic SQLAdmin & Compliance Gate)

---

## 1. Quick Access Endpoints

When running locally or with Docker Compose:

| Service | Dedicated Port / Path | Purpose |
|---|---|---|
| **Admin Operations Dashboard** | `http://localhost:9081/admin` | Full-stack SQLAdmin management console |
| **First-Run Setup Wizard** | `http://localhost:9081/setup` | Interactive admin account initialization |
| **Interactive OpenAPI Docs** | `http://localhost:9081/docs` | Swagger documentation for backend endpoints |
| **Backend Health Check** | `http://localhost:9081/health` | Live service health & uptime check |

> In production behind a host reverse proxy, access via your domain: `https://your-domain.com/admin` and `https://your-domain.com/setup`.

---

## 2. First-Run Setup Wizard

On initial launch, if no administrator account exists in the database:
1. Navigate to `/setup` in your browser.
2. Enter your desired **Username** and secure **Password** (min 8 characters).
3. The wizard securely hashes the password via `bcrypt` and creates the primary administrator.
4. You will be redirected to `/admin` to log in.

---

## 3. System Configuration Management (No-Code GUI)

Navigate to **Admin Console -> System Configuration ⚙️** to configure platform behavior dynamically without restarting containers:

### 3.1 Regulatory Scope Mode (`business_scope_mode`)
- **`LEAD_ONLY` (Default Safe Mode)**:
  - Ideal for introductory / referral brokers (`Tipař`).
  - Limits customer intake to basic contact & plan inquiries; disables sensitive document upload.
- **`ASSISTED_APPLICATION` (Full Intake Mode)**:
  - Enabled when an authorized brokerage agreement and DPA with a licensed broker (`Makléř`) is verified.
  - Unlocks encrypted passport and student ID document intake.
- **`REGULATED_DISTRIBUTION`**:
  - Reserved for direct underwriter distribution.

### 3.2 Crisp Live Chat Integration
- **`crisp_website_id`**: Enter your Crisp Website UUID (e.g., `168677e2-0aa6-45ec-a486-83855b18c6f4`).
- **`crisp_position`**: Choose widget screen placement:
  - `right` (default, bottom-right corner)
  - `left` (bottom-left corner)
- **Live Status Verification**: Click the **Verify Crisp ID** button directly on the dashboard to test official API connectivity and operator online status.

### 3.3 Brokerage & Legal Disclosures
- **`operator_legal_name`** & **`operator_website_url`**: Your technology platform entity (e.g., `HKTSE s.r.o.`, `https://hktse.eu.org/`).
- **`partner_name`** & **`partner_website_url`**: Your licensed intermediary partner (e.g., `České pojištění a.s.`, `https://ceskepojisteni.cz/`).
- **`relationship_status`**: Set to `VERIFIED` once commercial contracts are active.
- **`broker_legal_disclosure`**: Custom legal text displayed in the portal footer.

### 3.4 Encrypted Storage Provider
- **Provider**: Switch between `local` (AES-256-GCM encrypted disk) and `s3` (compatible with AWS S3, Oracle OCI Object Storage, Cloudflare R2, MinIO).
- **S3 Settings**:
  - `S3 Endpoint`: e.g. `https://<namespace>.compat.objectstorage.<region>.oraclecloud.com`
  - `S3 Bucket`: Bucket name
  - `Access Key` & `Secret Key`: Masked in the UI for credential protection.

---

## 4. Managing Insurance Showcase Plans & Partners

Navigate to **Insurance Plans** and **Insurance Companies** in SQLAdmin:

### 4.1 Insurance Plans (`insurance_plans`)
- **Name**: Keep clean and concise (e.g. `PVZP Komplexní PLUS`). Any trailing parenthesized text is automatically parsed.
- **Target Audience**: Specify student or visa criteria (e.g., `Student Special (15-30 let)`). If it contains "Student", the frontend automatically renders a prominent student discount promo banner 🎓.
- **Pricing & Period**: Configure `price_amount` (e.g., `12978`), `currency` (`CZK`), and `billing_period` (`year` or `month`).
- **Coverage Summary**: Specify medical coverage (e.g., `10,000,000 CZK (~400,000 EUR)`). The frontend automatically formats this into an emerald green statutory compliance shield badge.
- **Display Order & Active**: Set `is_active=1` to publish. Plans dynamically center symmetrically on the homepage whether 1, 2, 3, or 4 plans are published.

### 4.2 Insurance Companies (`insurance_companies`)
- Manage underwriter partners (PVZP, Slavia, SV pojišťovna).
- Enter rating tags, descriptions, and official portal URLs.

---

## 5. Audit Log & Cryptographic Hash Chain

Navigate to **Audit Logs**:
- Every critical security action (application submit, status update, export, configuration change) produces an immutable record.
- **`sequence`**: Monotonically increasing sequence number.
- **`prev_hash` & `entry_hash`**: Cryptographically links each log entry via SHA-256 to its immediate predecessor, guaranteeing tamper-evident auditability.

---

## 6. Troubleshooting & Recovery

| Issue | Resolution |
|---|---|
| **Forgot Admin Password** | Navigate to `/setup` on localhost or set `ADMIN_USERNAME` and `ADMIN_PASSWORD` in `.env` to override. |
| **Crisp Widget Not Displaying** | Check if `crisp_website_id` is set in System Configuration. Verify that CSP headers allow `client.crisp.chat`. |
| **S3 Connection Error** | Ensure `s3_endpoint_url` includes the protocol `https://` and bucket permissions allow `PutObject` and `GetObject`. |
| **Port Conflicts** | Modify `FRONTEND_PORT` (default `9080`) or `BACKEND_PORT` (default `9081`) in `.env`. |
