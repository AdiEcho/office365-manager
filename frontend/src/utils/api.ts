import axios from 'axios'
import { useAuthStore } from '@/store/auth'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.detail || error.message || '请求失败'
    
    // If 401, clear auth and redirect to login
    if (error.response?.status === 401) {
      useAuthStore.getState().clearAuth()
      window.location.href = '/login'
    }
    
    return Promise.reject(new Error(message))
  }
)

export interface Tenant {
  id: number
  tenant_id: string
  client_id: string
  tenant_name?: string
  remarks?: string
  is_active: boolean
  is_selected: boolean
  created_at: string
  updated_at?: string
}

export interface TenantCreate {
  tenant_id: string
  client_id: string
  client_secret: string
  tenant_name?: string
  remarks?: string
}

export interface User {
  id: string
  display_name: string
  user_principal_name: string
  mail?: string
  account_enabled: boolean
  usage_location?: string
  created_datetime?: string
}

export interface UserCreate {
  display_name: string
  user_principal_name: string
  mail_nickname: string
  password: string
  usage_location?: string
  account_enabled?: boolean
}

export interface License {
  sku_id: string
  sku_part_number: string
  sku_name_cn?: string
  consumed_units: number
  enabled_units: number
  available_units: number
}

export interface Domain {
  id: string
  authentication_type: string
  is_default: boolean
  is_verified: boolean
  supported_services: string[]
}

export interface AuthUser {
  id: number
  username: string
  email?: string
  is_active: boolean
  is_superuser: boolean
  created_at: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
}

export interface SystemStatus {
  needs_initialization: boolean
  user_count: number
}

export interface ChangePasswordRequest {
  old_password: string
  new_password: string
}

// Tenant APIs
export const tenantApi = {
  list: () => api.get<{ total: number; items: Tenant[] }>('/tenants'),
  get: (id: number) => api.get<Tenant>(`/tenants/${id}`),
  create: (data: TenantCreate) => api.post<Tenant>('/tenants', data),
  update: (id: number, data: Partial<TenantCreate>) => api.put<Tenant>(`/tenants/${id}`, data),
  delete: (id: number) => api.delete(`/tenants/${id}`),
  validate: (id: number) => api.get(`/tenants/${id}/validate`),
}

// User APIs
export const userApi = {
  list: (params?: { top?: number }) => api.get<User[]>('/o365/users', { params }),
  search: (keyword: string) => api.get<User[]>('/o365/users/search', { params: { keyword } }),
  get: (id: string) => api.get<User>(`/o365/users/${id}`),
  create: (data: UserCreate) => api.post<User>('/o365/users', data),
  batchCreate: (data: UserCreate[]) => api.post<any[]>('/o365/users/batch', data),
  update: (id: string, data: Partial<User>) => api.patch<User>(`/o365/users/${id}`, data),
  delete: (id: string) => api.delete(`/o365/users/${id}`),
  enable: (id: string) => api.post<User>(`/o365/users/${id}/enable`),
  disable: (id: string) => api.post<User>(`/o365/users/${id}/disable`),
}

// License APIs
export const licenseApi = {
  list: () => api.get<License[]>('/o365/licenses'),
  listByTenant: (tenantId: number) => api.get<License[]>(`/o365/licenses/tenant/${tenantId}`),
}

// Domain APIs
export const domainApi = {
  list: () => api.get<Domain[]>('/o365/domains'),
  get: (id: string) => api.get<Domain>(`/o365/domains/${id}`),
  create: (domainName: string) => api.post<Domain>('/o365/domains', null, { params: { domain_name: domainName } }),
  verify: (id: string) => api.post<Domain>(`/o365/domains/${id}/verify`),
  delete: (id: string) => api.delete(`/o365/domains/${id}`),
}

// Role APIs
export const roleApi = {
  list: () => api.get<any[]>('/o365/roles'),
  listMembers: (roleId: string) => api.get<any[]>(`/o365/roles/${roleId}/members`),
  assign: (userId: string, roleId: string) => 
    api.post('/o365/roles/assign', { user_id: userId, role_id: roleId }),
  revoke: (userId: string, roleId: string) => 
    api.post('/o365/roles/revoke', { user_id: userId, role_id: roleId }),
  promote: (userId: string) => api.post(`/o365/roles/${userId}/promote`),
  demote: (userId: string) => api.post(`/o365/roles/${userId}/demote`),
}

// Report APIs
export const reportApi = {
  getOrganization: () => api.get<any>('/o365/reports/organization'),
  getOneDrive: (period = 'D7') => 
    api.get('/o365/reports/onedrive', { params: { period }, responseType: 'blob' }),
  getExchange: (period = 'D7') => 
    api.get('/o365/reports/exchange', { params: { period }, responseType: 'blob' }),
}

// Auth APIs
export const authApi = {
  getSystemStatus: () => api.get<SystemStatus>('/auth/system-status'),
  register: (data: RegisterRequest) => api.post<LoginResponse>('/auth/register', data),
  login: (data: LoginRequest) => api.post<LoginResponse>('/auth/login', data),
  getCurrentUser: () => api.get<AuthUser>('/auth/me'),
  changePassword: (data: ChangePasswordRequest) => api.post<{ message: string }>('/auth/change-password', data),
}

export default api
