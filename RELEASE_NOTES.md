# 🚀 FormVault Release Notes (v2.0 - "Productized")

**Date**: January 31, 2026
**Focus**: Productization, Admin UX, and Cloud Native Architecture.

---

## 🌟 Major Highlights

### 1. The Setup Wizard ("First-Run Experience")
*   **New**: A self-contained Setup Wizard (`/setup`) launches on first run.
*   **Benefit**: Create your Administrator account securely via a GUI—no more editing `.env` files or using default passwords.

### 2. No-Code Admin Dashboard
*   **Powered by**: `SQLAdmin` (Python)
*   **URL**: `/admin`
*   **Capabilities**:
    *   **User Management**: View and export applications.
    *   **System Config**: Switch between Local and S3 storage dynamically.
    *   **Audit Logs**: track security events.
*   **Zero Frontend Code**: The admin panel is generated automatically from Database Models, ensuring stability.

### 3. Dynamic Storage Engine (S3 / Local)
*   **Hybrid Mode**: The system now supports both Local Disk and Object Storage (S3/Oracle).
*   **Dynamic**: Configure keys in the Admin Panel (`System Configuration`), and the backend switches strategies immediately without a restart.
*   **Security**: S3 downloads now use **Presigned URLs** (valid for 1 hour) instead of proxying traffic through the server.

### 4. Professional "Deep Blue" Theme
*   **Frontend**: A new comprehensive Material UI Theme (`frontend/src/theme.ts`).
*   **Style**: Corporate "Deep Blue" palette, consistent `8px` rounded corners, and elevated shadows.
*   **Components**: All forms and pages now use `Paper` and `Container` wrappers for a polished look.

---

## 🛡️ Infrastructure & Security
*   **Setup Logic**: Middleware automatically redirects to setup if no admin user exists.
*   **Password Hashing**: Admin passwords are securely hashed using `bcrypt` via `passlib`.
*   **CI/CD**: Backend dependencies upgraded (`sqladmin`, `boto3`, `itsdangerous`).

---

## 🐛 Bug Fixes
*   **File Upload**: Fixed duplicate form rendering.
*   **Validation**: Enforced strict dual-file requirement (ID + Passport).
*   **Localization**: Full `i18n` support for 12 languages.

---

## 📋 Upgrade Instructions
1.  **Pull Latest Code**.
2.  **Update Deps**: `pip install -r backend/requirements.txt`.
3.  **Launch**: Visit `/setup` to create your admin account.
