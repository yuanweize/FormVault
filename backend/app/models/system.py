from sqlalchemy import Column, String, Boolean, Integer, DateTime
from datetime import datetime
from uuid import uuid4
from ..database import Base

class AdminUser(Base):
    __tablename__ = "admin_users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<AdminUser {self.username}>"

class SystemConfig(Base):
    __tablename__ = "system_config"

    id = Column(Integer, primary_key=True) # Singleton: Always ID 1
    
    # Storage Settings
    storage_provider = Column(String(20), default="local") # local, s3
    
    # S3 Settings
    s3_endpoint = Column(String(255), nullable=True)
    s3_bucket = Column(String(100), nullable=True)
    s3_region = Column(String(50), default="us-east-1")
    s3_access_key = Column(String(100), nullable=True)
    s3_secret_key = Column(String(100), nullable=True) # Should ideally be encrypted
    
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<SystemConfig {self.storage_provider}>"
