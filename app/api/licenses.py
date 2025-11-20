from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import json
import logging
from pathlib import Path
from app.database import get_db
from app.schemas import O365LicenseResponse
from app.services.graph_service import GraphAPIService
from app.api.o365_users import get_graph_service, get_graph_service_by_id

router = APIRouter(prefix="/api/o365/licenses", tags=["O365 Licenses"])
logger = logging.getLogger(__name__)

# Load SKU mapping
SKU_MAP_PATH = Path(__file__).parent.parent / "sku_map.json"
try:
    with open(SKU_MAP_PATH, "r", encoding="utf-8") as f:
        SKU_MAP = json.load(f)
except Exception as e:
    print(f"Warning: Failed to load sku_map.json: {e}")
    SKU_MAP = {}


def get_sku_name_cn(sku_part_number: str) -> str:
    """Get Chinese name for SKU, fallback to SKU part number if not found"""
    return SKU_MAP.get(sku_part_number, sku_part_number)


@router.get("", response_model=List[O365LicenseResponse])
async def list_licenses(
    graph_service: GraphAPIService = Depends(get_graph_service)
):
    try:
        logger.info("Fetching licenses for default tenant")
        skus = await graph_service.get_subscribed_skus()
        
        licenses = []
        for sku in skus:
            prepaid_units = sku.get("prepaidUnits", {})
            sku_part_number = sku.get("skuPartNumber")
            licenses.append(O365LicenseResponse(
                sku_id=sku.get("skuId"),
                sku_part_number=sku_part_number,
                sku_name_cn=get_sku_name_cn(sku_part_number),
                consumed_units=sku.get("consumedUnits", 0),
                enabled_units=prepaid_units.get("enabled", 0),
                available_units=prepaid_units.get("enabled", 0) - sku.get("consumedUnits", 0)
            ))
        
        logger.info(f"Successfully fetched {len(licenses)} licenses")
        return licenses
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching licenses: {str(e)}", exc_info=True)
        error_msg = str(e)
        
        # Provide more helpful error messages based on common issues
        if "Insufficient privileges" in error_msg or "Access is denied" in error_msg:
            raise HTTPException(
                status_code=403,
                detail="权限不足。请确保应用已被授予 Organization.Read.All 权限并且已授予管理员同意。"
            )
        elif "Invalid client secret" in error_msg or "AADSTS" in error_msg:
            raise HTTPException(
                status_code=401,
                detail=f"身份验证失败。请检查租户凭据是否正确。详细错误: {error_msg}"
            )
        elif "timed out" in error_msg.lower():
            raise HTTPException(
                status_code=504,
                detail="请求超时。请检查网络连接或稍后重试。"
            )
        else:
            raise HTTPException(
                status_code=500,
                detail=f"获取许可证失败: {error_msg}"
            )


@router.get("/tenant/{tenant_id}", response_model=List[O365LicenseResponse])
async def list_licenses_by_tenant(
    tenant_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get licenses for a specific tenant by ID"""
    try:
        logger.info(f"Fetching licenses for tenant ID: {tenant_id}")
        
        # Get graph service for the specific tenant
        graph_service = await get_graph_service_by_id(tenant_id, db)
        
        # Fetch subscribed SKUs
        logger.debug(f"Calling Microsoft Graph API for tenant {tenant_id}")
        skus = await graph_service.get_subscribed_skus()
        logger.debug(f"Received {len(skus)} SKUs from Graph API")
        
        licenses = []
        for sku in skus:
            prepaid_units = sku.get("prepaidUnits", {})
            sku_part_number = sku.get("skuPartNumber")
            licenses.append(O365LicenseResponse(
                sku_id=sku.get("skuId"),
                sku_part_number=sku_part_number,
                sku_name_cn=get_sku_name_cn(sku_part_number),
                consumed_units=sku.get("consumedUnits", 0),
                enabled_units=prepaid_units.get("enabled", 0),
                available_units=prepaid_units.get("enabled", 0) - sku.get("consumedUnits", 0)
            ))
        
        logger.info(f"Successfully fetched {len(licenses)} licenses for tenant {tenant_id}")
        return licenses
    except HTTPException as he:
        # Re-raise HTTPExceptions from get_graph_service_by_id
        logger.warning(f"HTTP error for tenant {tenant_id}: {he.detail}")
        raise
    except Exception as e:
        logger.error(f"Error fetching licenses for tenant {tenant_id}: {str(e)}", exc_info=True)
        error_msg = str(e)
        
        # Provide more helpful error messages based on common issues
        if "Insufficient privileges" in error_msg or "Access is denied" in error_msg:
            raise HTTPException(
                status_code=403,
                detail=f"租户 {tenant_id} 权限不足。请确保应用已被授予 Organization.Read.All 权限并且已授予管理员同意。"
            )
        elif "Invalid client secret" in error_msg or "AADSTS7000215" in error_msg:
            raise HTTPException(
                status_code=401,
                detail=f"租户 {tenant_id} 身份验证失败。客户端密钥无效或已过期，请检查租户凭据。"
            )
        elif "AADSTS700016" in error_msg:
            raise HTTPException(
                status_code=401,
                detail=f"租户 {tenant_id} 身份验证失败。应用程序 ID (Client ID) 不存在或未在该租户中注册。"
            )
        elif "AADSTS90002" in error_msg or "Tenant" in error_msg and "not found" in error_msg:
            raise HTTPException(
                status_code=404,
                detail=f"租户 {tenant_id} 的目录 ID (Tenant ID) 无效或该租户不存在。"
            )
        elif "timed out" in error_msg.lower():
            raise HTTPException(
                status_code=504,
                detail=f"获取租户 {tenant_id} 许可证超时。请检查网络连接或稍后重试。"
            )
        elif "Connection" in error_msg or "Network" in error_msg:
            raise HTTPException(
                status_code=503,
                detail=f"无法连接到 Microsoft Graph API。请检查网络连接。详细错误: {error_msg}"
            )
        else:
            raise HTTPException(
                status_code=500,
                detail=f"获取租户 {tenant_id} 许可证失败: {error_msg}"
            )
