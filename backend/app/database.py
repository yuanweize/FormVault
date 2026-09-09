"""
Database configuration and connection utilities for FormVault.
"""

import os
from typing import Generator

from sqlalchemy import create_engine, MetaData
from sqlalchemy.orm import sessionmaker, Session, DeclarativeBase
from sqlalchemy.pool import QueuePool

# Database configuration from environment variables
DATABASE_URL = os.getenv(
    "DATABASE_URL", "mysql+pymysql://root:password@localhost:3306/formvault"
)
DATABASE_POOL_SIZE = int(os.getenv("DATABASE_POOL_SIZE", "10"))
DATABASE_MAX_OVERFLOW = int(os.getenv("DATABASE_MAX_OVERFLOW", "20"))

# Create SQLAlchemy engine with connection pooling
connect_args = {}
engine_kwargs = {
    "pool_pre_ping": True,
    "echo": os.getenv("DEBUG", "false").lower() == "true",
}

if DATABASE_URL.startswith("sqlite"):
    from sqlalchemy.pool import StaticPool
    connect_args["check_same_thread"] = False
    engine_kwargs["poolclass"] = StaticPool
    engine_kwargs["connect_args"] = connect_args
else:
    engine_kwargs["poolclass"] = QueuePool
    engine_kwargs["pool_size"] = DATABASE_POOL_SIZE
    engine_kwargs["max_overflow"] = DATABASE_MAX_OVERFLOW
    engine_kwargs["pool_recycle"] = 3600

engine = create_engine(DATABASE_URL, **engine_kwargs)

# Create SessionLocal class for database sessions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create declarative base for models
class Base(DeclarativeBase):
    pass

# Metadata for migrations
metadata = MetaData()


def get_db() -> Generator[Session, None, None]:
    """
    Dependency function to get database session.
    Yields a database session and ensures it's closed after use.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables() -> None:
    """
    Create all tables in the database.
    Used for testing and initial setup.
    """
    Base.metadata.create_all(bind=engine)


def drop_tables() -> None:
    """
    Drop all tables in the database.
    Used for testing cleanup.
    """
    Base.metadata.drop_all(bind=engine)
