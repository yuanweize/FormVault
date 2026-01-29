"""
Database initialization script for testing environment.
This script creates the necessary tables for testing.
"""

import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app.models import *  # Import all models


def init_test_db():
    """Initialize the test database with required tables."""
    # Use the DATABASE_URL from environment variable directly
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        print("ERROR: DATABASE_URL environment variable not set")
        sys.exit(1)

    # Create engine using the test database URL
    engine = create_engine(database_url)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    # Create all tables
    print(f"Creating database tables using: {database_url[:30]}...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")


if __name__ == "__main__":
    init_test_db()
