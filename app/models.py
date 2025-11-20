from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text
from sqlalchemy.sql import func
from app.database import Base


class Tenant(Base):
    __tablename__ = "tenants"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    tenant_id = Column(String(100), unique=True, nullable=False, index=True)
    client_id = Column(String(100), nullable=False)
    client_secret = Column(String(200), nullable=False)
    tenant_name = Column(String(200))
    remarks = Column(Text)
    is_active = Column(Boolean, default=True)
    is_selected = Column(Boolean, default=False)
    credential_status = Column(String(50))
    credential_message = Column(String(200))
    credential_checked_at = Column(DateTime(timezone=True))
    spo_status = Column(String(50))
    spo_message = Column(String(200))
    spo_checked_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(String(100))
    updated_by = Column(String(100))


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(200))
    hashed_password = Column(String(200), nullable=False)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class TenantReport(Base):
    __tablename__ = "tenant_reports"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    tenant_id = Column(String(100), nullable=False, index=True)
    report_type = Column(String(50))
    total_users = Column(Integer, default=0)
    total_admins = Column(Integer, default=0)
    spo_available = Column(Boolean, default=False)
    report_data = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class SystemConfig(Base):
    __tablename__ = "system_config"
    
    key = Column(String(100), primary_key=True, index=True)
    value = Column(Text, nullable=False)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
