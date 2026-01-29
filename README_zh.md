# 🛡️ FormVault

[![CI 状态](https://github.com/yuanweize/FormVault/actions/workflows/frontend-ci.yml/badge.svg)](https://github.com/yuanweize/FormVault/actions)
[![许可证: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2+-61DAFB.svg)](https://reactjs.org/)
[![Python](https://img.shields.io/badge/Python-3.9+-3776AB.svg)](https://www.python.org/)

> **[English Version (英文文档)](README.md)**

**FormVault** 是一个安全、高效且用户友好的多步骤申请流程系统。它采用现代技术栈开发，旨在处理复杂的表单提交、文件上传和验证流程。

## ✨ 核心特性

*   **多步骤工作流**：直观的分步导航，适用于复杂的数据输入。
*   **安全文件上传**：支持身份证、护照上传及文件验证。
*   **实时验证**：使用 `react-hook-form` 和模式验证提供强大的表单校验。
*   **状态持久化**：自动将进度保存到 LocalStorage，防止数据丢失。
*   **响应式设计**：基于 Material UI (MUI) 构建，适配移动端和桌面端。
*   **无障碍支持**：符合 WCAG 标准，提供完善的 ARIA 支持。

## 🛠️ 技术栈

### 前端
*   **核心**: React 18, TypeScript, Vite
*   **UI 框架**: Material UI (MUI) v5
*   **状态管理**: Context API + useReducer
*   **表单处理**: React Hook Form
*   **路由**: React Router v6
*   **测试**: Jest, React Testing Library, Cypress (E2E)

### 后端
*   **框架**: FastAPI (Python 3.9+)
*   **服务器**: Gunicorn / Uvicorn
*   **数据库**: SQLAlchemy / PyMySQL
*   **安全性**: Python-jose, Passlib, Cryptography

## 🚀 快速上手

### 环境要求
*   Node.js (v16+)
*   Python (v3.9+)
*   npm 或 yarn

### 安装步骤

1.  **克隆仓库**
    ```bash
    git clone https://github.com/yuanweize/FormVault.git
    cd FormVault
    ```

2.  **前端设置**
    ```bash
    cd frontend
    npm install
    # 启动开发服务器
    npm start
    ```

3.  **后端设置**
    ```bash
    cd backend
    pip install -r requirements.txt
    # 启动后端服务器
    uvicorn app.main:app --reload
    ```

## 🧪 测试说明

我们通过全面的测试套件保持高质量的代码。

### 单元与集成测试 (前端)
运行 Jest 测试：
```bash
cd frontend
npm test
```

### 端到端测试 (Cypress)
运行 Cypress 测试：
```bash
cd frontend
npm run cypress:run
```

## 📄 许可证

本项目采用 MIT 许可证 - 详情请参阅 [LICENSE](LICENSE) 文件。

## 🤝 参与贡献

欢迎提交 Pull Request！如有任何改进建议，请随时提出。
