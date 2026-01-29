# 🛡️ FormVault

[![CI Status](https://github.com/yuanweize/FormVault/actions/workflows/frontend-ci.yml/badge.svg)](https://github.com/yuanweize/FormVault/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2+-61DAFB.svg)](https://reactjs.org/)
[![Python](https://img.shields.io/badge/Python-3.9+-3776AB.svg)](https://www.python.org/)

> **[中文文档 (Chinese Version)](README_zh.md)**

**FormVault** is a secure, efficient, and user-friendly multi-step application workflow system. It is designed to handle complex form submissions, document uploads, and validation processes with a modern tech stack.

## ✨ Key Features

*   **Multi-Step Workflow**: Intuitive stepper navigation for complex data entry.
*   **Secure File Uploads**: Support for ID cards, passports, and document validation.
*   **Real-time Validation**: Robust form validation using `react-hook-form` and schema validation.
*   **State Persistence**: Automatically saves progress to LocalStorage to prevent data loss.
*   **Responsive Design**: Built with Material UI (MUI) for a seamless mobile and desktop experience.
*   **Accessibility**: WCAG compliant with comprehensive ARIA support.

## 🛠️ Tech Stack

### Frontend
*   **Core**: React 18, TypeScript, Vite
*   **UI Framework**: Material UI (MUI) v5
*   **State Management**: Context API + useReducer
*   **Form Handling**: React Hook Form
*   **Routing**: React Router v6
*   **Testing**: Jest, React Testing Library, Cypress (E2E)

### Backend
*   **Framework**: FastAPI (Python 3.9+)
*   **Server**: Gunicorn / Uvicorn
*   **Database**: SQLAlchemy / PyMySQL
*   **Security**: Python-jose, Passlib, Cryptography

## 🚀 Getting Started

### Prerequisites
*   Node.js (v16+)
*   Python (v3.9+)
*   npm or yarn

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yuanweize/FormVault.git
    cd FormVault
    ```

2.  **Frontend Setup**
    ```bash
    cd frontend
    npm install
    # Start the development server
    npm start
    ```

3.  **Backend Setup**
    ```bash
    cd backend
    pip install -r requirements.txt
    # Start the backend server
    uvicorn app.main:app --reload
    ```

## 🧪 Testing

We maintain high code quality with comprehensive testing suites.

### Unit & Integration Tests (Frontend)
Run the Jest test suite:
```bash
cd frontend
npm test
```

### End-to-End Tests (Cypress)
Run Cypress tests:
```bash
cd frontend
npm run cypress:run
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.