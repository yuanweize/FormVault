# FormVault Insurance Portal

A secure web application for insurance application processing with document upload and automated email export functionality.

## Project Structure

```
formvault-insurance-portal/
├── frontend/                 # React TypeScript frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API service layer
│   │   ├── types/          # TypeScript type definitions
│   │   └── utils/          # Utility functions
│   ├── public/             # Static assets
│   └── package.json        # Frontend dependencies
├── backend/                 # FastAPI Python backend
│   ├── app/
│   │   ├── api/            # API route handlers
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── services/       # Business logic services
│   │   └── utils/          # Utility functions
│   ├── tests/              # Backend tests
│   ├── alembic/            # Database migrations
│   └── requirements.txt    # Backend dependencies
└── README.md               # This file
```

## Development Setup

### Prerequisites

- Node.js 16+ and npm
- Python 3.9+
- MySQL 8.0+
- Redis (optional, for session management)

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Copy environment template and configure:
   ```bash
   cp .env.template .env.local
   # Edit .env.local with your configuration
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start development server:
   ```bash
   npm start
   ```

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Copy environment template and configure:
   ```bash
   cp .env.template .env
   # Edit .env with your configuration
   ```

5. Start development server:
   ```bash
   uvicorn app.main:app --reload
   ```

## Features

- Secure personal information form submission
- File upload with validation (student ID and passport photos)
- Multi-language support (English, Chinese, Spanish)
- Responsive design for mobile and desktop
- Automated email export to insurance companies
- Comprehensive audit logging
- Security features including rate limiting and input validation

## Technology Stack

**Frontend:**
- React 18 with TypeScript
- Material-UI for components
- React Hook Form for form management
- React Router for navigation
- React-i18next for internationalization
- Axios for API communication

**Backend:**
- FastAPI with Python 3.9+
- SQLAlchemy ORM with MySQL
- Pydantic for data validation
- Alembic for database migrations
- SMTP for email functionality

## License

This project is open source and available under the MIT License.