# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- GitHub Actions workflows for Backend and Frontend CI.
- `CONTRIBUTING.md` for project development guidelines.
- Proper audit logging in application submission.

### Fixed
- Completed missing application API endpoints (`list`, `get`, `update`, `submit`, `delete`).
- Optimized backend Pydantic schemas with detailed validation and examples.

### Removed
- Placeholder `TODO` implementations in `applications.py`.

## [0.1.0] - 2026-01-28
### Initial Release
- Basic FastAPI + React architecture.
- Multi-step form for insurance applications.
- File upload support.
- Email export functionality.
