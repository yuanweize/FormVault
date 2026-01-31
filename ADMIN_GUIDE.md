# 🧙‍♂️ FormVault Admin & Setup Guide

**Date**: 2026-01-31
**System**: Production-Ready (Dynamic Config)

---

## 🚀 First-Run Setup
The first time you launch the application, you must create an Administrator account.

1.  **Open the App**: Navigate to `http://localhost:8000/setup` (or your Render URL).
2.  **Create Admin**: Enter a secure Username and Password.
3.  **Login**: You will be redirected to `/admin`.

---

## ⚙️ Configuration (No-Code)
You no longer need to edit Environment Variables for Storage or S3 settings.

1.  **Go to Admin**: `http://localhost:8000/admin`.
2.  **Click "System Configuration ⚙️"**.
3.  **Storage Provider**: Select `local` or `s3`.
4.  **S3 Settings** (If using S3):
    *   **Endpoint**: Use your Oracle/AWS endpoint (e.g., `https://<namespace>.compat.objectstorage.<region>.oraclecloud.com`).
    *   **Bucket**: Your bucket name.
    *   **Access Key & Secret Key**: Enter your credentials.
    *   *Note: The Secret Key is masked in the UI for security.*
5.  **Save**: The system will immediately start using the new configuration for new uploads.

---

## 🛠 Advanced / Fallback
If the Database configuration fails (or is empty), the system falls back to Environment Variables in `.env`:
*   `ADMIN_USERNAME` / `ADMIN_PASSWORD` (Auth Fallback)
*   `STORAGE_TYPE` / `S3_...` (Storage Fallback)

---

## 🆘 Troubleshooting
*   **"Redirect loop on /setup"**: Clear your browser cookies or restart the server if the DB is stuck.
*   **"S3 Upload Failed"**: Check if your `S3_ENDPOINT` includes `https://`.
*   **Admin Login Failed**: If you forgot your password and can't reset it via DB, set `ADMIN_USERNAME` and `ADMIN_PASSWORD` in `.env` to override the DB check.
