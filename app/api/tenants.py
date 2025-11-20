from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from typing import List
from datetime import datetime
from app.database import get_db
from app.models import Tenant
from app.schemas import (
    TenantCreate, TenantUpdate, TenantResponse, 
    TenantListResponse, MessageResponse, SpoStatusResponse
)
from app.services.msal_service import MSALService
from app.services.graph_service import GraphAPIService

router = APIRouter(prefix="/api/tenants", tags=["Tenants"])


@router.get("", response_model=TenantListResponse)
async def list_tenants(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Tenant).offset(skip).limit(limit).order_by(Tenant.created_at.desc())
    )
    tenants = result.scalars().all()
    
    count_result = await db.execute(select(Tenant))
    total = len(count_result.scalars().all())
    
    return TenantListResponse(
        total=total,
        items=[TenantResponse.model_validate(t) for t in tenants]
    )


@router.get("/{tenant_id}", response_model=TenantResponse)
async def get_tenant(
    tenant_id: int,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = result.scalar_one_or_none()
    
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    return TenantResponse.model_validate(tenant)


@router.post("", response_model=TenantResponse, status_code=status.HTTP_201_CREATED)
async def create_tenant(
    tenant_data: TenantCreate,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Tenant).where(Tenant.tenant_id == tenant_data.tenant_id)
    )
    existing = result.scalar_one_or_none()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Tenant with this ID already exists"
        )
    
    new_tenant = Tenant(
        tenant_id=tenant_data.tenant_id,
        client_id=tenant_data.client_id,
        client_secret=tenant_data.client_secret,
        tenant_name=tenant_data.tenant_name,
        remarks=tenant_data.remarks
    )
    
    db.add(new_tenant)
    await db.flush()
    await db.refresh(new_tenant)
    
    return TenantResponse.model_validate(new_tenant)


@router.put("/{tenant_id}", response_model=TenantResponse)
async def update_tenant(
    tenant_id: int,
    tenant_data: TenantUpdate,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = result.scalar_one_or_none()
    
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    update_data = tenant_data.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(tenant, field, value)
    
    await db.flush()
    await db.refresh(tenant)
    
    return TenantResponse.model_validate(tenant)


@router.delete("/{tenant_id}", response_model=MessageResponse)
async def delete_tenant(
    tenant_id: int,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = result.scalar_one_or_none()
    
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    await db.delete(tenant)
    
    return MessageResponse(message="Tenant deleted successfully")


@router.get("/{tenant_id}/validate", response_model=MessageResponse)
async def validate_tenant(
    tenant_id: int,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = result.scalar_one_or_none()
    
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    msal_service = MSALService(
        tenant_id=tenant.tenant_id,
        client_id=tenant.client_id,
        client_secret=tenant.client_secret
    )
    
    validation_result = await msal_service.validate_credentials()
    checked_at = datetime.now()
    
    if not validation_result["valid"]:
        tenant.credential_status = "invalid"
        tenant.credential_message = "凭据无效"
        tenant.credential_checked_at = checked_at
        await db.flush()
        await db.refresh(tenant)
        
        raise HTTPException(
            status_code=400,
            detail=f"Invalid credentials: {validation_result.get('error')}"
        )
    
    tenant.credential_status = "valid"
    tenant.credential_message = "凭据有效"
    tenant.credential_checked_at = checked_at
    await db.flush()
    await db.refresh(tenant)
    
    return MessageResponse(
        message="Tenant credentials validated successfully"
    )


@router.get("/{tenant_id}/spo-status", response_model=SpoStatusResponse)
async def check_tenant_spo_status(
    tenant_id: int,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = result.scalar_one_or_none()
    
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    msal_service = MSALService(
        tenant_id=tenant.tenant_id,
        client_id=tenant.client_id,
        client_secret=tenant.client_secret
    )
    
    validation_result = await msal_service.validate_credentials()
    if not validation_result["valid"]:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid tenant credentials: {validation_result.get('error')}"
        )
    
    graph_service = GraphAPIService(msal_service)
    spo_result = await graph_service.check_spo_status()
    
    checked_at = datetime.now()
    tenant.spo_status = spo_result["status"]
    tenant.spo_message = spo_result["message"]
    tenant.spo_checked_at = checked_at
    
    await db.flush()
    await db.refresh(tenant)
    
    return SpoStatusResponse(
        status=spo_result["status"],
        message=spo_result["message"],
        checked_at=checked_at
    )


@router.post("/{tenant_id}/update-secret", response_model=MessageResponse)
async def update_tenant_secret(
    tenant_id: int,
    delete_old_secret: bool = False,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = result.scalar_one_or_none()
    
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    msal_service = MSALService(
        tenant_id=tenant.tenant_id,
        client_id=tenant.client_id,
        client_secret=tenant.client_secret
    )
    
    validation_result = await msal_service.validate_credentials()
    if not validation_result["valid"]:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid tenant credentials: {validation_result.get('error')}"
        )
    
    graph_service = GraphAPIService(msal_service)
    
    try:
        secret_result = await graph_service.update_client_secret(
            tenant.client_id,
            delete_old_secret=delete_old_secret
        )
        new_secret = secret_result["client_secret"]
        end_date = secret_result["end_date"]
        deletion_summary = secret_result.get("deletion_summary", "")
        
        # 更新租户密钥和过期时间
        tenant.client_secret = new_secret
        if end_date:
            from datetime import datetime
            # Parse ISO 8601 datetime string (e.g., "2099-12-31T23:59:59Z")
            tenant.client_secret_expires_at = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        
        await db.flush()
        await db.refresh(tenant)
        
        return MessageResponse(
            message=f"密钥更新成功{deletion_summary}",
            detail=f"新密钥已生成，过期时间: {end_date}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"更新密钥失败: {str(e)}"
        )


@router.post("/{tenant_id}/configure-permissions")
async def configure_tenant_permissions(
    tenant_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Configure API permissions for a tenant's application
    """
    try:
        # Get tenant
        result = await db.execute(select(Tenant).filter(Tenant.id == tenant_id))
        tenant = result.scalar_one_or_none()
        if not tenant:
            raise HTTPException(status_code=404, detail="租户未找到")
        
        # Create Graph API service for this tenant
        msal_service = MSALService(
            tenant_id=tenant.tenant_id,
            client_id=tenant.client_id,
            client_secret=tenant.client_secret
        )
        graph_service = GraphAPIService(msal_service)
        
        # Configure permissions via Graph API
        result = await graph_service.configure_application_permissions(tenant.client_id)
        
        # Generate admin consent URL
        consent_url = f"https://login.microsoftonline.com/{tenant.tenant_id}/adminconsent"
        consent_url += f"?client_id={tenant.client_id}"
        
        return {
            "success": result["success"],
            "permissions_configured": result["permissions_configured"],
            "consent_url": consent_url,
            "message": "权限配置成功，请使用管理员账户打开同意链接"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"配置权限失败: {str(e)}"
        )
