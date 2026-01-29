"""
Database initialization script for testing environment.
This script creates the necessary tables for testing.
"""

import asyncio
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import get_settings
from app.database.session import Base
from app.models import *  # Import all models


def init_test_db():
    """Initialize the test database with required tables."""
    settings = get_settings()

    # Use the test database URL
    engine = create_engine(settings.DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    # Create all tables
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")


if __name__ == "__main__":
    init_test_db()
