import os

# Force SQLite in-memory for tests to ensure isolation and prevent accidental
# connection to production/dev database if DATABASE_URL is set in environment.
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

import pytest
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool, StaticPool
from fastapi.testclient import TestClient

DATABASE_URL = "sqlite:///:memory:"


@pytest.fixture(scope="session")
def engine():
    """Create a database engine for the test session."""
    connect_args = {}
    poolclass = QueuePool

    if DATABASE_URL == "sqlite:///:memory:":
        connect_args["check_same_thread"] = False
        poolclass = StaticPool

    return create_engine(
        DATABASE_URL, poolclass=poolclass, pool_pre_ping=True, connect_args=connect_args
    )


@pytest.fixture(scope="session", autouse=True)
def patch_db_objects(engine):
    """
    Patch app.database objects to ensure they use the test engine.
    This handles cases where app.database is imported before conftest.py runs,
    or where dependency overrides fail.
    """
    from unittest.mock import patch

    # Create a new SessionLocal bound to the test engine
    TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    # Patch both engine and SessionLocal in app.database
    # db_helpers now uses database.engine directly so no separate patch needed
    with (
        patch("app.database.engine", engine),
        patch("app.database.SessionLocal", TestSessionLocal),
    ):
        yield


@pytest.fixture(scope="function")
def db(engine) -> Generator[Session, None, None]:
    """
    Create a clean database session for each test.
    Creates tables if they don't exist, and drops them after test to ensure isolation.
    """
    from app.database import Base

    # Create tables
    Base.metadata.create_all(bind=engine)

    # Use the session factory that we patched (or create a new one bound to engine)
    TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestSessionLocal()

    try:
        yield session
    finally:
        session.close()
        # Clean up tables after each test to ensure fresh state
        # In a real CI with massive tests, we might use transaction rollback instead,
        # but for now this ensures correctness.
        from app.database import Base

        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db: Session) -> Generator[TestClient, None, None]:
    """
    Create a TestClient with overridden database dependency.
    """
    from app.main import app
    from app.database import get_db

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
