from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class TenantBase(BaseModel):
    tenant_id: str = Field(..., description="Microsoft 365 Tenant ID")
    client_id: str = Field(..., description="Azure AD Application (Client) ID")
    client_secret: str = Field(..., description="Azure AD Application Client Secret")
    tenant_name: Optional[str] = Field(None, description="Friendly name for tenant")
    remarks: Optional[str] = Field(None, description="Additional notes")


class TenantCreate(TenantBase):
    pass


class TenantUpdate(BaseModel):
    client_id: Optional[str] = None
    client_secret: Optional[str] = None
    tenant_name: Optional[str] = None
    remarks: Optional[str] = None
    is_active: Optional[bool] = None


class TenantResponse(BaseModel):
    id: int
    tenant_id: str
    client_id: str
    client_secret_expires_at: Optional[datetime] = None
    tenant_name: Optional[str] = None
    remarks: Optional[str] = None
    is_active: bool
    is_selected: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    credential_status: Optional[str] = None
    credential_message: Optional[str] = None
    credential_checked_at: Optional[datetime] = None
    spo_status: Optional[str] = None
    spo_message: Optional[str] = None
    spo_checked_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class TenantListResponse(BaseModel):
    total: int
    items: list[TenantResponse]


class UserBase(BaseModel):
    username: str
    email: Optional[EmailStr] = None


class UserCreate(UserBase):
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: Optional[str] = None
    is_active: bool
    is_superuser: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class O365UserCreate(BaseModel):
    display_name: str = Field(..., description="User display name")
    user_principal_name: str = Field(..., description="User email/UPN")
    mail_nickname: str = Field(..., description="Mail nickname")
    password: str = Field(..., min_length=8, description="Initial password")
    force_change_password: bool = Field(True, description="Force password change on first login")
    usage_location: str = Field("US", description="Usage location (e.g., US, CN)")
    account_enabled: bool = Field(True, description="Account enabled status")


class O365UserUpdate(BaseModel):
    display_name: Optional[str] = None
    account_enabled: Optional[bool] = None
    usage_location: Optional[str] = None


class O365UserResponse(BaseModel):
    id: str
    display_name: str
    user_principal_name: str
    mail: Optional[str] = None
    account_enabled: bool
    usage_location: Optional[str] = None
    created_datetime: Optional[str] = None


class O365DomainResponse(BaseModel):
    id: str
    authentication_type: str
    is_default: bool
    is_verified: bool
    supported_services: list[str]


class O365LicenseResponse(BaseModel):
    sku_id: str
    sku_part_number: str
    sku_name_cn: Optional[str] = None
    consumed_units: int
    enabled_units: int
    available_units: int
    expires_at: Optional[datetime] = None


class O365RoleAssignment(BaseModel):
    user_id: str
    role_id: str = Field(..., description="Directory role template ID (e.g., 62e90394-69f5-4237-9190-012177145e10 for Global Administrator)")


class LoginRequest(BaseModel):
    username: str
    password: str


class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, description="Username (3-50 characters)")
    email: EmailStr = Field(..., description="Email address")
    password: str = Field(..., min_length=6, description="Password (minimum 6 characters)")


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class SystemStatusResponse(BaseModel):
    needs_initialization: bool
    user_count: int


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=6, description="New password (minimum 6 characters)")


class MessageResponse(BaseModel):
    message: str
    detail: Optional[str] = None


class SpoStatusResponse(BaseModel):
    status: str = Field(..., description="SPO status: available|unavailable|no_subscription|unknown|error")
    message: str = Field(..., description="Status message")
    checked_at: datetime = Field(..., description="Time when SPO status was checked")
