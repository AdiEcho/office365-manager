import aiohttp
from typing import List, Dict, Any, Optional
from app.services.msal_service import MSALService
from app.config import get_settings

settings = get_settings()


class GraphAPIService:
    def __init__(self, msal_service: MSALService):
        self.msal_service = msal_service
        self.base_url = settings.graph_api_endpoint
        self._token = None
    
    def get_headers(self) -> Dict[str, str]:
        if not self._token:
            self._token = self.msal_service.get_access_token()
        
        return {
            "Authorization": f"Bearer {self._token}",
            "Content-Type": "application/json"
        }
    
    async def _make_request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict[str, Any]] = None,
        params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        
        async with aiohttp.ClientSession() as session:
            async with session.request(
                method=method,
                url=url,
                headers=self.get_headers(),
                json=data,
                params=params
            ) as response:
                if response.status == 401:
                    self._token = None
                    return await self._make_request(method, endpoint, data, params)
                
                response_data = await response.json()
                
                if response.status >= 400:
                    raise Exception(f"Graph API error: {response.status} - {response_data}")
                
                return response_data
    
    async def get_users(self, filter_query: Optional[str] = None, top: int = 100) -> List[Dict[str, Any]]:
        params = {"$top": top}
        if filter_query:
            params["$filter"] = filter_query
        
        result = await self._make_request("GET", "/users", params=params)
        return result.get("value", [])
    
    async def get_user(self, user_id: str) -> Dict[str, Any]:
        return await self._make_request("GET", f"/users/{user_id}")
    
    async def create_user(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        return await self._make_request("POST", "/users", data=user_data)
    
    async def update_user(self, user_id: str, user_data: Dict[str, Any]) -> Dict[str, Any]:
        return await self._make_request("PATCH", f"/users/{user_id}", data=user_data)
    
    async def delete_user(self, user_id: str) -> None:
        await self._make_request("DELETE", f"/users/{user_id}")
    
    async def enable_user(self, user_id: str) -> Dict[str, Any]:
        return await self.update_user(user_id, {"accountEnabled": True})
    
    async def disable_user(self, user_id: str) -> Dict[str, Any]:
        return await self.update_user(user_id, {"accountEnabled": False})
    
    async def get_domains(self) -> List[Dict[str, Any]]:
        result = await self._make_request("GET", "/domains")
        return result.get("value", [])
    
    async def get_domain(self, domain_id: str) -> Dict[str, Any]:
        return await self._make_request("GET", f"/domains/{domain_id}")
    
    async def create_domain(self, domain_name: str) -> Dict[str, Any]:
        return await self._make_request("POST", "/domains", data={"id": domain_name})
    
    async def delete_domain(self, domain_id: str) -> None:
        await self._make_request("DELETE", f"/domains/{domain_id}")
    
    async def verify_domain(self, domain_id: str) -> Dict[str, Any]:
        return await self._make_request("POST", f"/domains/{domain_id}/verify")
    
    async def get_subscribed_skus(self) -> List[Dict[str, Any]]:
        result = await self._make_request("GET", "/subscribedSkus")
        return result.get("value", [])
    
    async def get_directory_roles(self) -> List[Dict[str, Any]]:
        result = await self._make_request("GET", "/directoryRoles")
        return result.get("value", [])
    
    async def get_directory_role_members(self, role_id: str) -> List[Dict[str, Any]]:
        result = await self._make_request("GET", f"/directoryRoles/{role_id}/members")
        return result.get("value", [])
    
    async def add_directory_role_member(self, role_id: str, user_id: str) -> None:
        data = {
            "@odata.id": f"{self.base_url}/directoryObjects/{user_id}"
        }
        await self._make_request("POST", f"/directoryRoles/{role_id}/members/$ref", data=data)
    
    async def remove_directory_role_member(self, role_id: str, user_id: str) -> None:
        await self._make_request("DELETE", f"/directoryRoles/{role_id}/members/{user_id}/$ref")
    
    async def get_organization(self) -> Dict[str, Any]:
        result = await self._make_request("GET", "/organization")
        orgs = result.get("value", [])
        return orgs[0] if orgs else {}
    
    async def get_onedrive_usage_report(self, period: str = "D7") -> bytes:
        endpoint = f"/reports/getOneDriveUsageAccountDetail(period='{period}')"
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=self.get_headers()) as response:
                if response.status >= 400:
                    raise Exception(f"Failed to get OneDrive report: {response.status}")
                return await response.read()
    
    async def get_exchange_usage_report(self, period: str = "D7") -> bytes:
        endpoint = f"/reports/getMailboxUsageDetail(period='{period}')"
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=self.get_headers()) as response:
                if response.status >= 400:
                    raise Exception(f"Failed to get Exchange report: {response.status}")
                return await response.read()
    
    async def search_users(self, keyword: str) -> List[Dict[str, Any]]:
        filter_query = f"startswith(displayName,'{keyword}') or startswith(userPrincipalName,'{keyword}')"
        return await self.get_users(filter_query=filter_query)
    
    async def batch_create_users(self, users_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        results = []
        for user_data in users_data:
            try:
                result = await self.create_user(user_data)
                results.append({"success": True, "data": result})
            except Exception as e:
                results.append({"success": False, "error": str(e), "data": user_data})
        return results
    
    async def check_spo_status(self) -> Dict[str, Any]:
        """
        Check SharePoint Online status by accessing site root drive permissions
        Returns: {"status": "available"|"unavailable"|"no_subscription"|"unknown", "message": str}
        """
        endpoint = "/sites/root/drive/root/permissions"
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        
        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(url, headers=self.get_headers()) as response:
                    status_code = response.status
                    
                    if status_code == 200:
                        data = await response.json()
                        value = data.get("value", [])
                        if len(value) > 0:
                            return {
                                "status": "available",
                                "message": "SharePoint Online 可用"
                            }
                        else:
                            return {
                                "status": "unavailable",
                                "message": "SharePoint Online 不可用"
                            }
                    elif status_code == 400:
                        return {
                            "status": "no_subscription",
                            "message": "无 SharePoint Online 订阅"
                        }
                    elif status_code in [404, 429, 502]:
                        return {
                            "status": "unavailable",
                            "message": "SharePoint Online 不可用"
                        }
                    else:
                        return {
                            "status": "unknown",
                            "message": f"未知状态 (HTTP {status_code})"
                        }
            except Exception as e:
                return {
                    "status": "error",
                    "message": f"检查失败: {str(e)}"
                }
    
    async def update_client_secret(self, application_id: str) -> Dict[str, Any]:
        """
        Create a new password credential for an application with expiry date of 2099-12-31
        Returns: {"client_secret": str, "key_id": str, "end_date": str}
        """
        try:
            # First, get the application object by appId (client_id)
            filter_query = f"appId eq '{application_id}'"
            apps_result = await self._make_request("GET", "/applications", params={"$filter": filter_query})
            apps = apps_result.get("value", [])
            
            if not apps or len(apps) == 0:
                raise Exception(f"Application with client_id {application_id} not found")
            
            app_object_id = apps[0]["id"]
            
            # Add new password credential with expiry date 2099-12-31
            password_credential = {
                "displayName": "O365 Manager Auto-Generated Secret",
                "endDateTime": "2099-12-31T23:59:59Z"
            }
            
            result = await self._make_request(
                "POST",
                f"/applications/{app_object_id}/addPassword",
                data={"passwordCredential": password_credential}
            )
            
            return {
                "client_secret": result.get("secretText"),
                "key_id": result.get("keyId"),
                "end_date": result.get("endDateTime")
            }
        except Exception as e:
            raise Exception(f"Failed to update client secret: {str(e)}")
