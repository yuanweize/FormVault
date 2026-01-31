# 🛡️ FormVault

[![Frontend CI](https://github.com/yuanweize/FormVault/actions/workflows/frontend-ci.yml/badge.svg)](https://github.com/yuanweize/FormVault/actions/workflows/frontend-ci.yml)
[![Backend CI](https://github.com/yuanweize/FormVault/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/yuanweize/FormVault/actions/workflows/backend-ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2+-61DAFB.svg)](https://reactjs.org/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB.svg)](https://www.python.org/)
[![ESLint](https://img.shields.io/badge/ESLint-9-4B32C3.svg)](https://eslint.org/)

> **[English Version](README.md)**

**FormVault** 是一个安全、现代的多步骤申请工作流系统，专为复杂表单提交、文档上传和验证流程设计。

---

## ✨ 核心特性

- **🔄 多步骤工作流** — 直观的步骤导航，适用于复杂数据录入
- **📁 安全文件上传** — 支持身份证、护照等文档验证及类型检查
- **✅ 实时表单验证** — 使用 `react-hook-form` 和 Zod 模式进行稳健验证
- **💾 状态持久化** — 自动保存进度到 LocalStorage，防止数据丢失
- **📱 响应式设计** — 使用 Material UI 构建，移动端/桌面端体验一致
- **♿ 无障碍访问** — 符合 WCAG 标准，提供完整 ARIA 支持
- **🌍 国际化** — 多语言支持 (i18n)

---

## 🏗️ 系统架构

```mermaid
graph TB
    subgraph Frontend["🖥️ 前端 (React 18)"]
        UI[React 组件]
        Context[Context API]
        LS[(LocalStorage)]
        UI --> Context
        Context --> LS
    end

    subgraph Backend["⚙️ 后端 (FastAPI)"]
        API[REST API 端点]
        Services[业务逻辑层]
        ORM[SQLAlchemy ORM]
        API --> Services
        Services --> ORM
    end

    subgraph Database["🗄️ 数据库"]
        MySQL[(MySQL)]
    end

    UI -->|HTTP/REST| API
    ORM --> MySQL
```

---

## 📁 项目结构

```
FormVault/
├── frontend/
│   └── src/
│       ├── components/      # 可复用 UI 组件
│       │   ├── common/      # 公共组件 (页头、页脚等)
│       │   └── forms/       # 表单专用组件
│       ├── pages/           # 路由级页面组件
│       ├── hooks/           # 自定义 React Hooks
│       ├── contexts/        # React Context 提供者
│       ├── services/        # API 客户端服务
│       ├── i18n/            # 国际化配置
│       └── types/           # TypeScript 类型定义
│
├── backend/
│   └── app/
│       ├── api/             # FastAPI 路由处理器
│       │   └── v1/endpoints/
│       ├── core/            # 配置与异常处理
│       ├── models/          # SQLAlchemy ORM 模型
│       ├── schemas/         # Pydantic 请求/响应模式
│       ├── services/        # 业务逻辑层
│       ├── middleware/      # 请求中间件
│       └── utils/           # 工具函数
│
└── .github/workflows/       # CI/CD 流水线
    ├── frontend-ci.yml
    └── backend-ci.yml
```

---

## 🛠️ 技术栈

| 层级 | 技术 |
|------|------|
| **前端** | React 18, TypeScript 5, Material UI v5, React Router v6 |
| **状态管理** | Context API + useReducer, LocalStorage 持久化 |
| **表单处理** | React Hook Form, Zod 验证 |
| **后端** | FastAPI, Python 3.11+, Uvicorn |
| **数据库** | SQLAlchemy ORM, MySQL, Alembic 迁移 |
| **测试** | Jest, React Testing Library, pytest |
| **代码质量** | ESLint 9 (Flat Config), Mypy (核心模块严格检查), Black |

---

## 🚀 快速开始

### 环境要求

- Node.js v18+
- Python 3.11+
- MySQL 8.0+

### 安装步骤

```bash
# 克隆仓库
git clone https://github.com/yuanweize/FormVault.git
cd FormVault

# 前端设置
cd frontend
npm install
npm start

# 后端设置（在另一个终端）
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# 3. 设置管理员账户
# 打开浏览器访问：
# http://localhost:8000/setup
```

---

## ☁️ 部署

### 一键部署

点击按钮即可完成全栈部署：

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/yuanweize/FormVault)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yuanweize/FormVault)

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/yuanweize/FormVault)

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/yuanweize/FormVault)

> [!IMPORTANT]
> **需要手动连接！** 部署后，您必须手动设置前端的 `REACT_APP_API_BASE_URL` 指向后端。请参阅下方步骤。

### 📋 推荐部署顺序

> [!TIP]
> **先部署后端，再部署前端。** 这样可以确保配置前端时 API URL 已就绪。

#### 第一步：部署后端 (Render/Railway)
1. 点击上方 **Render** 或 **Railway** 按钮
2. 等待构建完成（约5分钟）
3. 复制您的后端 URL（如 `https://formvault-api.onrender.com`）

#### 第二步：部署前端 (Vercel/Netlify)
1. 点击上方 **Vercel** 或 **Netlify** 按钮
2. 当提示配置环境变量时，添加：
   - `REACT_APP_API_BASE_URL` = `https://formvault-api.onrender.com`（第一步获取的后端 URL）
3. 点击部署

#### 第三步：连接前后端（关键！）
> 如果您错过了第二步，或部署时未配置环境变量：
1. 进入前端控制台 (Vercel/Netlify)
2. 导航到 **Settings** → **Environment Variables**
3. 添加：`REACT_APP_API_BASE_URL` = `https://your-backend-url.onrender.com`
4. **触发重新部署**（必须重新部署才能生效）

#### 第四步：配置后端 CORS
1. 进入后端控制台 (Render/Railway)
2. 添加/更新环境变量：
   - `CORS_ORIGINS` = `https://formvault-frontend.onrender.com`（您的前端 URL）

### 部署平台选项

| 平台 | 类型 | 部署内容 |
|------|------|----------|
| **Render** | 全栈 | 后端 API + 前端 + PostgreSQL 数据库 |
| **Vercel** | 仅前端 | React 应用（需单独配置 API URL） |
| **Railway** | 全栈 | 后端 + 前端 + 数据库 |
| **Netlify** | 仅前端 | React 应用（静态托管，支持 Functions） |

### 环境变量

| 变量 | 必填 | 来源 | 说明 |
|------|------|------|------|
| `SECRET_KEY` | 是 | 🔄 自动 (Render) / 🔧 手动 | JWT 认证签名密钥 |
| `DATABASE_URL` | 是 | 🔄 自动 (Render/Railway) | PostgreSQL 连接字符串 |
| `CORS_ORIGINS` | 是 | 🔧 手动 | 前端 URL，用于 CORS 配置（如 `https://yourapp.vercel.app`） |
| `REACT_APP_API_BASE_URL` | 是 | 🔧 手动 | 后端 API 基础 URL（如 `https://api.yourapp.com`） |

**图例：**
- 🔄 自动 — 平台自动提供
- 🔧 手动 — 需要手动配置

---

## ⚙️ 配置与管理

### 🧙‍♂️ 首次运行设置 (Setup Wizard)
本系统内置 **设置向导**，用于创建初始管理员账户。
- **地址**: `/setup` (例如 `https://your-api.com/setup`)
- **操作**: 设置您的管理员用户名和密码。

### 🔑  管理控制台 (Admin Dashboard)
访问 **后端 API 地址** 的 `/admin` 路径进入 **无代码管理面板**（例如 `https://api.yoursite.com/admin`）：
- **数据管理**: 查看、编辑、删除申请和文件。
- **系统配置**: 点击 **System Configuration** 可动态切换本地存储和 S3 存储。
- **S3 支持**: 兼容 AWS S3、Oracle Cloud 等。直接在界面输入密钥即可生效，无需重启服务。

---

## 🧪 测试与质量

### 前端
```bash
cd frontend
npm run lint      # ESLint 9 Flat Config 检查
npm test          # Jest + React Testing Library
npm run build     # 生产环境构建检查
```

### 后端
```bash
cd backend
flake8 .          # 代码检查
black --check .   # 格式检查
mypy .            # 类型检查（核心/模式模块严格模式）
pytest            # 单元与集成测试
```

---

## 🔒 质量保障

| 工具 | 用途 | 作用范围 |
|------|------|----------|
| **ESLint 9** | 代码检查 | 前端 (Flat Config) |
| **Mypy** | 类型检查 | 后端 (`app.core`, `app.schemas` 严格模式) |
| **Black** | 代码格式化 | 后端 |
| **Jest** | 单元测试 | 前端组件 |
| **pytest** | 测试 | 后端 API 与服务 |
| **双流水线 CI** | 自动化 | 前后端独立 CI 流水线 |

---

## 📄 许可证

MIT 许可证 — 详见 [LICENSE](LICENSE) 文件。

## 🤝 参与贡献

欢迎贡献！提交 PR 前请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。
