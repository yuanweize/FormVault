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

    from app.main import admin
    orig_admin_engine = admin.engine
    orig_admin_session_maker = admin.session_maker
    orig_view_session_makers = [getattr(v, "session_maker", None) for v in admin._views]

    admin.engine = engine
    admin.session_maker = TestSessionLocal
    for v in admin._views:
        v.session_maker = TestSessionLocal

    # Patch both engine and SessionLocal in app.database
    # db_helpers now uses database.engine directly so no separate patch needed
    with (
        patch("app.database.engine", engine),
        patch("app.database.SessionLocal", TestSessionLocal),
    ):
        yield

    admin.engine = orig_admin_engine
    admin.session_maker = orig_admin_session_maker
    for v, orig_sm in zip(admin._views, orig_view_session_makers):
        v.session_maker = orig_sm


@pytest.fixture(scope="function", autouse=True)
def setup_database_tables(engine):
    """
    Autouse fixture to create all database tables before every test and drop them after.
    Guarantees isolation and ensures endpoints that create their own sessions have tables ready.
    """
    import app.models  # noqa: F401 - Register all models with Base.metadata
    from app.database import Base
    from app.middleware.security import rate_limit_store, SecurityMiddleware
    from app.utils.performance_monitor import reset_performance_stats

    rate_limit_store.clear()
    SecurityMiddleware._override_rate_limit = None

    Base.metadata.create_all(bind=engine)
    reset_performance_stats()
    yield
    Base.metadata.drop_all(bind=engine)
    rate_limit_store.clear()
    SecurityMiddleware._override_rate_limit = None
    reset_performance_stats()


@pytest.fixture(scope="function")
def db(engine) -> Generator[Session, None, None]:
    """
    Create a clean database session for each test.
    """
    TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestSessionLocal()

    try:
        yield session
    finally:
        session.close()


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
