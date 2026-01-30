import os
import pytest
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from fastapi.testclient import TestClient

from app.database import Base, get_db
from app.main import app

# Use the test database URL from environment or fallback to sqlite
# Note: CI sets DATABASE_URL to a MySQL instance
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./test.db")


@pytest.fixture(scope="session")
def engine():
    """Create a database engine for the test session."""
    return create_engine(DATABASE_URL, pool_pre_ping=True)


@pytest.fixture(scope="function")
def db(engine) -> Generator[Session, None, None]:
    """
    Create a clean database session for each test.
    Creates tables if they don't exist, and drops them after test to ensure isolation.
    """
    # Create tables
    Base.metadata.create_all(bind=engine)

    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = SessionLocal()

    try:
        yield session
    finally:
        session.close()
        # Clean up tables after each test to ensure fresh state
        # In a real CI with massive tests, we might use transaction rollback instead,
        # but for now this ensures correctness.
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db: Session) -> Generator[TestClient, None, None]:
    """
    Create a TestClient with overridden database dependency.
    """

    def override_get_db():
        try:
            yield db
        finally:
            pass  # Session is closed by the db fixture

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as c:
        yield c

    # Clean up overrides
    app.dependency_overrides.clear()
