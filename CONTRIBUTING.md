# Contributing to FormVault

First off, thank you for considering contributing to FormVault! It's people like you that make FormVault such a great tool.

## Code of Conduct

Help us keep FormVault open and inclusive. Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## How Can I Contribute?

### Reporting Bugs
* Check the existing issues to see if the bug has already been reported.
* If you can't find an open issue addressing the problem, open a new one.
* Use a clear and descriptive title.
* Describe the exact steps which reproduce the problem in as many details as possible.

### Suggesting Enhancements
* Open a new issue with the tag `enhancement`.
* Explain the project benefit of your proposed change.

### Pull Requests
1. Fork the repo and create your branch from `dev`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes (`pytest` for backend, `npm test` for frontend).
5. Make sure your code lints (`flake8`/`black` for backend, `eslint` for frontend).
6. Issue that pull request!

## Development Setup

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pytest
```

### Frontend
```bash
cd frontend
npm install
npm test
npm start
```

## Branching Strategy
- `main`: Production-ready code.
- `dev`: Active development and PR merges.
- `feature/*`: New features.
- `bugfix/*`: Bug fixes.

---

Thank you for your contribution! 🚀
