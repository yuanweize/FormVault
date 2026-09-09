# FormVault

[![Frontend CI](https://github.com/yuanweize/FormVault/actions/workflows/frontend-ci.yml/badge.svg)](https://github.com/yuanweize/FormVault/actions/workflows/frontend-ci.yml)
[![Backend CI](https://github.com/yuanweize/FormVault/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/yuanweize/FormVault/actions/workflows/backend-ci.yml)
[![License: PolyForm Noncommercial 1.0.0](https://img.shields.io/badge/License-PolyForm%20Noncommercial%201.0.0-blue.svg)](LICENSE)
[![Commercial License](https://img.shields.io/badge/Commercial%20License-Available-red.svg)](COMMERCIAL-LICENSE.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2+-61DAFB.svg)](https://reactjs.org/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB.svg)](https://www.python.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED.svg)](https://www.docker.com/)

> **[中文说明文档 (Chinese Version)](README_zh.md)**
>
> 🌐 **Live Demo**: [https://pojisteni.hktse.eu.org/](https://pojisteni.hktse.eu.org/)

**FormVault** is an enterprise-grade, trust-first InsurTech SaaS platform engineered for multi-step insurance applications, high-assurance identity verification (Student ID, Passport), client-side checksum validation, AES-256-GCM encrypted document storage, and auditable email dispatch.

<div align="center">
  <img src="assets/portal_frontend.png" width="850" alt="FormVault Insurance Applicant Portal">
  <p><em>FormVault Applicant Portal — Multi-step insurance quotation, client-side document verification, and trust-first security rail</em></p>
</div>

---

## Key Features & Architecture Highlights

- **Modern InsurTech SaaS UI/UX** — Deep Obsidian Dark Mode & Crisp Alpine Light Mode, glassmorphism surfaces, and smooth focus glows.
- **Insurance Brokerage & Partner Models** — Pre-loaded with compliant Czech Republic templates (PVZP, Slavia, SV pojišťovna in CZK via České pojištění network); fully dynamic, open-source and customizable via Admin Panel.
- **Dual-Factor Application Status Tracker (`/track`)** — Instant status & timeline tracking using Reference Number and registered Email on the homepage with safe OWASP-compliant data masking.
- **Automated Submission Confirmation Email** — Instant email dispatch with tracking reference upon submission.
- **Institutional Security Rail** — Real-time TLS 1.3 active channel indicators, authenticated AES-256-GCM storage encryption, and strict RBAC isolation.
- **Stripe-Inspired Fluid Stepper** — Connected step rail with pulsing halos, completion badges, and smooth progress tracking.
- **Secure File Vault** — Client-side file signature validation, anti-tampering checksums, and encrypted local/S3 storage.
- **Real-time Form Validation** — Strict validation schema powered by `react-hook-form` and accessible error handling.
- **Automated State Persistence** — Local encrypted draft caching prevents data loss during workflow navigation.
- **Isolated Database Architecture** — Database is strictly isolated inside the container bridge network with zero public port exposure.
- **WCAG 2.1 AA Compliant Accessibility** — axe automated zero violation testing, full keyboard navigation and screen reader support.
- **Full Internationalization (i18n)** — Dynamic language switching (English, 简体中文, Español, etc.).

<div align="center">
  <img src="assets/broker_admin.png" width="850" alt="FormVault Broker Admin Operations Console">
  <p><em>FormVault Broker Admin Console — Application lifecycle auditing, applicant status transitions, and secure document inspection</em></p>
</div>

---

## Docker Compose Deployment (Recommended)

FormVault provides an out-of-the-box, production-ready `docker-compose.yml` with **full data persistence** and **collision-free dedicated ports**. It automatically pulls pre-built images directly from **GitHub Container Registry (GHCR)**, requiring zero local Node or Python toolchain.

### 1. Quick Start (Instant Launch)

```bash
# 1. Clone repository
git clone https://github.com/yuanweize/FormVault.git
cd FormVault

# 2. Copy environment template (optional, secure defaults provided)
cp .env.example .env

# 3. Launch all services (pulls images directly from GHCR)
docker compose up -d

# To build from local source instead:
# docker compose up --build -d
```

### 2. Dedicated Service Endpoints (Zero Port Collisions)

To prevent conflicts with standard ports (80, 3000, 8000, 3306), FormVault runs on dedicated high-range ports:

| Service | URL | Description |
|---|---|---|
| **Frontend Web App** | `http://localhost:9080` | Customer-facing insurance portal, curated plans & status tracker |
| **Admin Dashboard** | `http://localhost:9081/admin` | SQLAdmin management console for applications, partners & configs |
| **Setup Wizard** | `http://localhost:9081/setup` | Auto-routed first-run admin account creator |
| **Swagger API Docs** | `http://localhost:9081/docs` | Interactive OpenAPI documentation (independent toggle) |
| **Backend Health Check**| `http://localhost:9081/health` | Live service health check endpoint |
| **MySQL Database** | `Internal Bridge (3306)` | Isolated inside container network; zero host port exposure |

### 3. Default Admin Credentials

When running with default settings or Docker Compose:
- **Username**: `admin`
- **Password**: `FormVault@Admin2026!`

> [!TIP]
> - You can navigate to `http://localhost:9081/setup` to interactively create or reset an Administrator account stored in the database.
> - To customize credentials or port bindings, edit `FRONTEND_PORT`, `BACKEND_PORT`, `ADMIN_USERNAME`, and `ADMIN_PASSWORD` in `.env`.

### 4. Host Nginx Reverse Proxy Configuration (Optional)

If you have an independent Nginx / Reverse Proxy running on your host machine (e.g., 1Panel, aaPanel, Traefik, Caddy), FormVault containers **do not require any internal reverse proxying**. Simply add this minimal block to your host Nginx:

```nginx
server {
    listen 80;
    server_name your-formvault-domain.com;

    # 1. Frontend static SPA routing
    location / {
        proxy_pass http://127.0.0.1:9080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 2. Backend API requests
    location /api/ {
        proxy_pass http://127.0.0.1:9081;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 20M;
    }

    # 3. Backend Admin & Setup Wizard
    location ~ ^/(admin|setup|docs|openapi.json|redoc) {
        proxy_pass http://127.0.0.1:9081;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 5. Persistent Storage (Data Volumes)

FormVault uses dedicated Docker Named Volumes to guarantee zero data loss:

| Volume Name | Target Path | Purpose |
|---|---|---|
| `formvault_mysql_data` | `/var/lib/mysql` | MySQL database records, applications, logs |
| `formvault_uploads_data`| `/app/uploads` | Encrypted user documents (Passports, IDs) |
| `formvault_backend_data`| `/app/data` | AES-256 master encryption key & vault metadata |

---

## GitHub Actions: GHCR Automated Docker Build

FormVault includes an automated GitHub Actions workflow (`.github/workflows/docker-publish.yml`) that builds and pushes images to **GitHub Container Registry (GHCR)** on every push to `main` or semantic release tag (`v*.*.*`):
- Backend: `ghcr.io/yuanweize/formvault-backend:latest`
- Frontend: `ghcr.io/yuanweize/formvault-frontend:latest`

---

## Local Development Setup

### Prerequisites
- Node.js 18+ & npm 9+
- Python 3.11+
- MySQL 8.0+ or Docker

### 1. Backend Setup
```bash
cd backend

# Create virtualenv
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Start FastAPI dev server
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start React development server
npm start
```

---

## Comprehensive Test Suites (100% Pass Rate)

FormVault maintains strict software quality with 100% automated test coverage across frontend and backend:

### Backend Tests (239/239 PASS)
```bash
cd backend
PYTHONPATH=. ./venv/bin/pytest
# Output: 239 passed in ~3.6s
```

### Frontend Tests (20/20 Suites PASS)
```bash
cd frontend
npm test -- --watchAll=false
# Output: 20 passed, 180 tests passed
```

### Production Build Verification
```bash
cd frontend
npm run build
# Output: Compiled successfully, 0 errors
```

---

## Cloud Deployment Options

| Platform | Deployment Type | Target |
|---|---|---|
| **Docker Compose** | Full Stack (Self-Hosted / VPS) | Nginx + FastAPI + MySQL 8 |
| **Render** | Managed Cloud | `render.yaml` blueprint included |
| **Railway** | Full Stack Container | Automated detection via Dockerfile |
| **Vercel** | Frontend Static / Edge | `vercel.json` included |
| **Netlify** | Frontend JAMstack | `netlify.toml` included |

---

## License & Commercial Licensing

This software is **Source-Available** under the **[PolyForm Noncommercial License 1.0.0](LICENSE)** with a separate **[Commercial License](COMMERCIAL-LICENSE.md)** option:

- **Non-Commercial / Private Self-Hosting**: Free of charge for private, academic, educational, and non-profit evaluation.
- **Commercial Operations & Insurance Carriers**: Any commercial deployment, SaaS hosting, insurance mediation, client document intake, or enterprise workflow strictly requires a paid, executed Commercial License from **HKTSE s.r.o.** (IČO: 10858032).
- **Trademarks**: The FormVault name, logo, and visual branding are reserved under **[TRADEMARKS.md](TRADEMARKS.md)** and do not transfer with the source code license.
- **Commercial Inquiries**: Contact [licensing@hktse.eu.org](mailto:licensing@hktse.eu.org) or [insurance@hktse.eu.org](mailto:insurance@hktse.eu.org).
