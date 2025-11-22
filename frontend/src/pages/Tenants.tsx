import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { tenantApi, licenseApi, type TenantCreate, type Tenant } from '@/utils/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Plus, Trash2, CheckCircle2, XCircle, Loader2, Edit2, Users, Award, Globe, ShieldCheck, FileText, RefreshCw, AlertCircle, Ban, HelpCircle, Key, ChevronUp, MoreHorizontal, RotateCw, Copy, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDate } from '@/utils/utils'
import { TenantLicensesSummary } from '@/components/TenantLicensesSummary'
import { Switch } from '@/components/ui/switch'

export function Tenants() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null)
  const [viewMode, setViewMode] = useState<'compact' | 'full'>(() => {
    // 从 localStorage 读取用户的视图模式选择
    const savedMode = localStorage.getItem('tenantViewMode')
    return (savedMode === 'compact' || savedMode === 'full') ? savedMode : 'full'
  })
  const [expandedTenants, setExpandedTenants] = useState<Set<number>>(new Set())
  const [isUpdateSecretOpen, setIsUpdateSecretOpen] = useState(false)
  const [updatingTenant, setUpdatingTenant] = useState<Tenant | null>(null)
  const [deleteOldSecret, setDeleteOldSecret] = useState(false)
  const [isConfigurePermissionsOpen, setIsConfigurePermissionsOpen] = useState(false)
  const [configuringTenant, setConfiguringTenant] = useState<Tenant | null>(null)
  const [consentUrl, setConsentUrl] = useState<string>('')
  const [loadingTenantIds, setLoadingTenantIds] = useState<{
    validate?: number
    checkSpo?: number
    refreshLicenses?: number
  }>({})
  const [formData, setFormData] = useState<TenantCreate>({
    tenant_id: '',
    client_id: '',
    client_secret: '',
    tenant_name: '',
    remarks: '',
  })

  // 保存视图模式到 localStorage
  useEffect(() => {
    localStorage.setItem('tenantViewMode', viewMode)
  }, [viewMode])

  const { data: tenants, isLoading } = useQuery({
    queryKey: ['tenants'],
    queryFn: async () => {
      const res = await tenantApi.list()
      return res.data
    },
  })

  const createMutation = useMutation({
    mutationFn: (data: TenantCreate) => tenantApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      setIsCreateOpen(false)
      toast.success('租户创建成功')
      setFormData({
        tenant_id: '',
        client_id: '',
        client_secret: '',
        tenant_name: '',
        remarks: '',
      })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<TenantCreate> }) =>
      tenantApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      setIsEditOpen(false)
      setEditingTenant(null)
      toast.success('租户更新成功')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => tenantApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      toast.success('租户删除成功')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const validateMutation = useMutation({
    mutationFn: (id: number) => {
      setLoadingTenantIds(prev => ({ ...prev, validate: id }))
      return tenantApi.validate(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      toast.success('租户凭据验证成功')
      setLoadingTenantIds(prev => ({ ...prev, validate: undefined }))
    },
    onError: (error: Error) => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      toast.error(error.message)
      setLoadingTenantIds(prev => ({ ...prev, validate: undefined }))
    },
  })

  const checkSpoMutation = useMutation({
    mutationFn: (id: number) => {
      setLoadingTenantIds(prev => ({ ...prev, checkSpo: id }))
      return tenantApi.checkSpoStatus(id)
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      toast.success(`SPO 状态检查完成: ${response.data.message}`)
      setLoadingTenantIds(prev => ({ ...prev, checkSpo: undefined }))
    },
    onError: (error: Error) => {
      toast.error(error.message)
      setLoadingTenantIds(prev => ({ ...prev, checkSpo: undefined }))
    },
  })

  const updateSecretMutation = useMutation({
    mutationFn: ({ id, deleteOld }: { id: number; deleteOld: boolean }) => 
      tenantApi.updateSecret(id, deleteOld),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      const detail = response.data.detail ? ` (${response.data.detail})` : ''
      toast.success(`${response.data.message}${detail}`)
      setIsUpdateSecretOpen(false)
      setUpdatingTenant(null)
      setDeleteOldSecret(false)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const configurePermissionsMutation = useMutation({
    mutationFn: (id: number) => tenantApi.configurePermissions(id),
    onSuccess: (response) => {
      toast.success(response.data.message)
      setConsentUrl(response.data.consent_url)
      // Don't close the dialog, show the consent URL instead
    },
    onError: (error: Error) => {
      toast.error(error.message)
      setIsConfigurePermissionsOpen(false)
      setConfiguringTenant(null)
    },
  })

  const refreshLicensesMutation = useMutation({
    mutationFn: (tenantId: number) => {
      setLoadingTenantIds(prev => ({ ...prev, refreshLicenses: tenantId }))
      return licenseApi.listByTenant(tenantId, true)
    },
    onSuccess: () => {
      toast.success('许可证数据已刷新')
      setLoadingTenantIds(prev => ({ ...prev, refreshLicenses: undefined }))
    },
    onError: (error: Error) => {
      toast.error(`刷新失败: ${error.message}`)
      setLoadingTenantIds(prev => ({ ...prev, refreshLicenses: undefined }))
    },
  })

  const handleUpdateSecret = (tenant: Tenant) => {
    setUpdatingTenant(tenant)
    setDeleteOldSecret(false)
    setIsUpdateSecretOpen(true)
  }

  const confirmUpdateSecret = () => {
    if (updatingTenant) {
      updateSecretMutation.mutate({ id: updatingTenant.id, deleteOld: deleteOldSecret })
    }
  }

  const handleConfigurePermissions = (tenant: Tenant) => {
    setConfiguringTenant(tenant)
    setConsentUrl('')
    setIsConfigurePermissionsOpen(true)
  }

  const confirmConfigurePermissions = () => {
    if (configuringTenant) {
      configurePermissionsMutation.mutate(configuringTenant.id)
    }
  }

  const closePermissionsDialog = () => {
    setIsConfigurePermissionsOpen(false)
    setConfiguringTenant(null)
    setConsentUrl('')
  }

  const handleCreate = () => {
    if (!formData.tenant_id || !formData.client_id || !formData.client_secret) {
      toast.error('请填写必填字段')
      return
    }
    createMutation.mutate(formData)
  }

  const handleEdit = (tenant: Tenant) => {
    setEditingTenant(tenant)
    setFormData({
      tenant_id: tenant.tenant_id,
      client_id: tenant.client_id,
      client_secret: '',
      tenant_name: tenant.tenant_name || '',
      remarks: tenant.remarks || '',
    })
    setIsEditOpen(true)
  }

  const handleUpdate = () => {
    if (!editingTenant) return
    
    const updateData: Partial<TenantCreate> = {
      tenant_name: formData.tenant_name,
      remarks: formData.remarks,
    }
    
    if (formData.client_id && formData.client_id !== editingTenant.client_id) {
      updateData.client_id = formData.client_id
    }
    
    if (formData.client_secret) {
      updateData.client_secret = formData.client_secret
    }
    
    updateMutation.mutate({ id: editingTenant.id, data: updateData })
  }

  const resetForm = () => {
    setFormData({
      tenant_id: '',
      client_id: '',
      client_secret: '',
      tenant_name: '',
      remarks: '',
    })
    setEditingTenant(null)
  }

  const toggleTenantExpansion = (tenantId: number) => {
    setExpandedTenants(prev => {
      const newSet = new Set(prev)
      if (newSet.has(tenantId)) {
        newSet.delete(tenantId)
      } else {
        newSet.add(tenantId)
      }
      return newSet
    })
  }

  const getCredentialStatusDisplay = (credentialStatus?: string) => {
    switch (credentialStatus) {
      case 'valid':
        return {
          icon: CheckCircle2,
          text: '凭据有效',
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-50 dark:bg-green-900/20'
        }
      case 'invalid':
        return {
          icon: XCircle,
          text: '凭据无效',
          color: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-50 dark:bg-red-900/20'
        }
      default:
        return {
          icon: HelpCircle,
          text: '未验证',
          color: 'text-gray-400 dark:text-gray-500',
          bgColor: 'bg-gray-50 dark:bg-gray-800'
        }
    }
  }

  const getSpoStatusDisplay = (spoStatus?: string) => {
    switch (spoStatus) {
      case 'available':
        return {
          icon: CheckCircle2,
          text: 'SPO 可用',
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-50 dark:bg-green-900/20'
        }
      case 'unavailable':
        return {
          icon: XCircle,
          text: 'SPO 不可用',
          color: 'text-yellow-600 dark:text-yellow-400',
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20'
        }
      case 'no_subscription':
        return {
          icon: Ban,
          text: '无 SPO 订阅',
          color: 'text-gray-600 dark:text-gray-400',
          bgColor: 'bg-gray-50 dark:bg-gray-900/20'
        }
      case 'error':
        return {
          icon: AlertCircle,
          text: '检查出错',
          color: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-50 dark:bg-red-900/20'
        }
      default:
        return {
          icon: HelpCircle,
          text: '未检查',
          color: 'text-gray-400 dark:text-gray-500',
          bgColor: 'bg-gray-50 dark:bg-gray-800'
        }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">租户管理</h2>
          <p className="text-muted-foreground mt-2">
            管理多个 Microsoft 365 租户
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="view-mode" className="text-sm">缩略视图</Label>
            <Switch
              id="view-mode"
              checked={viewMode === 'compact'}
              onCheckedChange={(checked) => setViewMode(checked ? 'compact' : 'full')}
            />
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            添加租户
          </Button>
        </div>
      </div>

      {/* Tenants List */}
      <Card>
        <CardHeader>
          <CardTitle>租户列表</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : tenants?.items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">暂无租户，请添加第一个租户</p>
            </div>
          ) : (
            <div className={viewMode === 'compact' ? "space-y-1" : "grid gap-6 md:grid-cols-2"}>
              {tenants?.items.map((tenant) => {
                const isExpanded = expandedTenants.has(tenant.id)
                
                if (viewMode === 'compact') {
                  const credentialDisplay = getCredentialStatusDisplay(tenant.credential_status)
                  const CredentialIcon = credentialDisplay.icon
                  const spoDisplay = getSpoStatusDisplay(tenant.spo_status)
                  const SpoIcon = spoDisplay.icon
                  
                  return (
                    <Card key={tenant.id} className="hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors border-l-4" style={{ borderLeftColor: tenant.credential_status === 'valid' ? '#16a34a' : tenant.credential_status === 'invalid' ? '#dc2626' : '#9ca3af' }}>
                      <CardContent className="py-2 px-3">
                        {/* 单行紧凑布局 */}
                        <div className="flex items-center gap-4">
                          {/* 租户信息 - 名称和ID在同一行 */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-sm truncate">
                                {tenant.tenant_name || '未命名租户'}
                              </h3>
                              <span className="text-muted-foreground">·</span>
                              <p className="text-xs text-muted-foreground font-mono truncate">
                                {tenant.tenant_id}
                              </p>
                            </div>
                          </div>

                          {/* 状态显示 - 完整文字 */}
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${credentialDisplay.bgColor} ${credentialDisplay.color}`}>
                              <CredentialIcon className="h-3 w-3 mr-1" />
                              {credentialDisplay.text}
                            </span>
                            <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${spoDisplay.bgColor} ${spoDisplay.color}`}>
                              <SpoIcon className="h-3 w-3 mr-1" />
                              {spoDisplay.text}
                            </span>
                          </div>

                          {/* 操作按钮 */}
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => validateMutation.mutate(tenant.id)}
                              disabled={loadingTenantIds.validate === tenant.id}
                              className="h-7 px-2 text-xs"
                              title="验证凭据"
                            >
                              {loadingTenantIds.validate === tenant.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <>
                                  <ShieldCheck className="h-3 w-3 mr-1" />
                                  验证
                                </>
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => checkSpoMutation.mutate(tenant.id)}
                              disabled={loadingTenantIds.checkSpo === tenant.id}
                              className="h-7 px-2 text-xs"
                              title="检查 SPO"
                            >
                              {loadingTenantIds.checkSpo === tenant.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <>
                                  <RefreshCw className="h-3 w-3 mr-1" />
                                  SPO
                                </>
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => refreshLicensesMutation.mutate(tenant.id)}
                              disabled={loadingTenantIds.refreshLicenses === tenant.id}
                              className="h-7 px-2 text-xs"
                              title="刷新许可证"
                            >
                              {loadingTenantIds.refreshLicenses === tenant.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <>
                                  <RotateCw className="h-3 w-3 mr-1" />
                                  许可证
                                </>
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleTenantExpansion(tenant.id)}
                              className="h-7 px-2"
                              title={isExpanded ? "收起" : "更多操作"}
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <MoreHorizontal className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* 展开内容 */}
                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t space-y-3">
                            {/* 详细信息 - 两列布局 */}
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                              <div>客户端 ID: <span className="font-mono text-[10px]">{tenant.client_id}</span></div>
                              {tenant.client_secret_expires_at && (
                                <div className={new Date(tenant.client_secret_expires_at) < new Date() ? 'text-red-600' : ''}>
                                  密钥过期: {formatDate(tenant.client_secret_expires_at)}
                                </div>
                              )}
                              {tenant.remarks && <div>备注: {tenant.remarks}</div>}
                              <div>创建: {formatDate(tenant.created_at)}</div>
                              {tenant.credential_checked_at && (
                                <div>凭据检查: {formatDate(tenant.credential_checked_at)}</div>
                              )}
                              {tenant.spo_checked_at && (
                                <div>SPO检查: {formatDate(tenant.spo_checked_at)}</div>
                              )}
                            </div>

                            {/* 操作按钮组 - 单行横排 */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(tenant)}
                                className="h-7 px-2 text-xs"
                              >
                                <Edit2 className="h-3 w-3 mr-1" />
                                编辑
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdateSecret(tenant)}
                                disabled={updateSecretMutation.isPending}
                                className="h-7 px-2 text-xs"
                              >
                                {updateSecretMutation.isPending ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <>
                                    <Key className="h-3 w-3 mr-1" />
                                    更新密钥
                                  </>
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleConfigurePermissions(tenant)}
                                disabled={configurePermissionsMutation.isPending}
                                className="h-7 px-2 text-xs"
                              >
                                {configurePermissionsMutation.isPending ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <>
                                    <ShieldCheck className="h-3 w-3 mr-1" />
                                    配置权限
                                  </>
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/tenants/${tenant.id}/users`)}
                                className="h-7 px-2 text-xs"
                              >
                                <Users className="h-3 w-3 mr-1" />
                                用户
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/tenants/${tenant.id}/licenses`)}
                                className="h-7 px-2 text-xs"
                              >
                                <Award className="h-3 w-3 mr-1" />
                                许可证
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/tenants/${tenant.id}/domains`)}
                                className="h-7 px-2 text-xs"
                              >
                                <Globe className="h-3 w-3 mr-1" />
                                域名
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/tenants/${tenant.id}/roles`)}
                                className="h-7 px-2 text-xs"
                              >
                                <ShieldCheck className="h-3 w-3 mr-1" />
                                角色
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/tenants/${tenant.id}/reports`)}
                                className="h-7 px-2 text-xs"
                              >
                                <FileText className="h-3 w-3 mr-1" />
                                报告
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (confirm('确定要删除此租户吗？')) {
                                    deleteMutation.mutate(tenant.id)
                                  }
                                }}
                                disabled={deleteMutation.isPending}
                                className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                删除
                              </Button>
                            </div>

                            {/* 许可证摘要 */}
                            <div className="pt-2 border-t">
                              <TenantLicensesSummary tenantId={tenant.id} compact />
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                }
                
                // 完整视图（原来的代码）
                return (
                <Card key={tenant.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle>
                          {tenant.tenant_name || '未命名租户'}
                        </CardTitle>
                        <CardDescription className="mt-2 space-y-1">
                          <div>租户 ID: {tenant.tenant_id}</div>
                          <div>客户端 ID: {tenant.client_id}</div>
                          {tenant.client_secret_expires_at && (
                            <div className={new Date(tenant.client_secret_expires_at) < new Date() ? 'text-red-600' : ''}>
                              密钥过期: {formatDate(tenant.client_secret_expires_at)}
                            </div>
                          )}
                          {tenant.remarks && <div>备注: {tenant.remarks}</div>}
                          <div>创建时间: {formatDate(tenant.created_at)}</div>
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            {(() => {
                              const credentialDisplay = getCredentialStatusDisplay(tenant.credential_status)
                              const CredentialIcon = credentialDisplay.icon
                              return (
                                <div className="flex items-center gap-2">
                                  <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${credentialDisplay.bgColor} ${credentialDisplay.color}`}>
                                    <CredentialIcon className="h-3 w-3 mr-1" />
                                    {credentialDisplay.text}
                                  </span>
                                  {tenant.credential_checked_at && (
                                    <span className="text-xs text-gray-500">
                                      {formatDate(tenant.credential_checked_at)}
                                    </span>
                                  )}
                                </div>
                              )
                            })()}
                            {(() => {
                              const spoDisplay = getSpoStatusDisplay(tenant.spo_status)
                              const SpoIcon = spoDisplay.icon
                              return (
                                <div className="flex items-center gap-2">
                                  <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${spoDisplay.bgColor} ${spoDisplay.color}`}>
                                    <SpoIcon className="h-3 w-3 mr-1" />
                                    {spoDisplay.text}
                                  </span>
                                  {tenant.spo_checked_at && (
                                    <span className="text-xs text-gray-500">
                                      {formatDate(tenant.spo_checked_at)}
                                    </span>
                                  )}
                                </div>
                              )
                            })()}
                          </div>
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(tenant)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm('确定要删除此租户吗？')) {
                              deleteMutation.mutate(tenant.id)
                            }
                          }}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => validateMutation.mutate(tenant.id)}
                        disabled={loadingTenantIds.validate === tenant.id}
                      >
                        验证凭据
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => checkSpoMutation.mutate(tenant.id)}
                        disabled={loadingTenantIds.checkSpo === tenant.id}
                      >
                        {loadingTenantIds.checkSpo === tenant.id ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            检查中...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-3 w-3 mr-1" />
                            检查 SPO
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refreshLicensesMutation.mutate(tenant.id)}
                        disabled={loadingTenantIds.refreshLicenses === tenant.id}
                      >
                        {loadingTenantIds.refreshLicenses === tenant.id ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            刷新中...
                          </>
                        ) : (
                          <>
                            <RotateCw className="h-3 w-3 mr-1" />
                            刷新许可证
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateSecret(tenant)}
                        disabled={updateSecretMutation.isPending}
                      >
                        {updateSecretMutation.isPending ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            更新中...
                          </>
                        ) : (
                          <>
                            <Key className="h-3 w-3 mr-1" />
                            更新密钥
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleConfigurePermissions(tenant)}
                        disabled={configurePermissionsMutation.isPending}
                      >
                        {configurePermissionsMutation.isPending ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            配置中...
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="h-3 w-3 mr-1" />
                            配置权限
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="pt-3 border-t">
                      <p className="text-xs font-medium text-muted-foreground mb-2">管理功能</p>
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex flex-col h-auto py-2"
                          onClick={() => navigate(`/tenants/${tenant.id}/users`)}
                        >
                          <Users className="h-4 w-4 mb-1" />
                          <span className="text-xs">用户</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex flex-col h-auto py-2"
                          onClick={() => navigate(`/tenants/${tenant.id}/licenses`)}
                        >
                          <Award className="h-4 w-4 mb-1" />
                          <span className="text-xs">许可证</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex flex-col h-auto py-2"
                          onClick={() => navigate(`/tenants/${tenant.id}/domains`)}
                        >
                          <Globe className="h-4 w-4 mb-1" />
                          <span className="text-xs">域名</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex flex-col h-auto py-2"
                          onClick={() => navigate(`/tenants/${tenant.id}/roles`)}
                        >
                          <ShieldCheck className="h-4 w-4 mb-1" />
                          <span className="text-xs">角色</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex flex-col h-auto py-2 col-span-2"
                          onClick={() => navigate(`/tenants/${tenant.id}/reports`)}
                        >
                          <FileText className="h-4 w-4 mb-1" />
                          <span className="text-xs">报告</span>
                        </Button>
                      </div>
                    </div>
                    <div className="pt-3 border-t">
                      <TenantLicensesSummary tenantId={tenant.id} compact />
                    </div>
                  </CardContent>
                </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={(open) => {
        setIsCreateOpen(open)
        if (!open) resetForm()
      }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>添加租户</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="tenant_id">租户 ID *</Label>
              <Input
                id="tenant_id"
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={formData.tenant_id}
                onChange={(e) =>
                  setFormData({ ...formData, tenant_id: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="client_id">客户端 ID *</Label>
              <Input
                id="client_id"
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={formData.client_id}
                onChange={(e) =>
                  setFormData({ ...formData, client_id: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="client_secret">客户端密钥 *</Label>
              <Input
                id="client_secret"
                type="password"
                placeholder="请输入客户端密钥"
                value={formData.client_secret}
                onChange={(e) =>
                  setFormData({ ...formData, client_secret: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tenant_name">租户名称</Label>
              <Input
                id="tenant_name"
                placeholder="我的组织"
                value={formData.tenant_name}
                onChange={(e) =>
                  setFormData({ ...formData, tenant_name: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="remarks">备注</Label>
              <Input
                id="remarks"
                placeholder="备注信息"
                value={formData.remarks}
                onChange={(e) =>
                  setFormData({ ...formData, remarks: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
            >
              取消
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  创建中...
                </>
              ) : (
                '创建'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={(open) => {
        setIsEditOpen(open)
        if (!open) resetForm()
      }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>编辑租户</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit_tenant_id">租户 ID</Label>
              <Input
                id="edit_tenant_id"
                value={formData.tenant_id}
                disabled
                className="bg-gray-100"
              />
              <p className="text-xs text-muted-foreground">租户 ID 不可修改</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_tenant_name">租户名称</Label>
              <Input
                id="edit_tenant_name"
                placeholder="我的组织"
                value={formData.tenant_name}
                onChange={(e) =>
                  setFormData({ ...formData, tenant_name: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_client_id">客户端 ID</Label>
              <Input
                id="edit_client_id"
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={formData.client_id}
                onChange={(e) =>
                  setFormData({ ...formData, client_id: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_client_secret">客户端密钥</Label>
              <Input
                id="edit_client_secret"
                type="password"
                placeholder="留空表示不修改"
                value={formData.client_secret}
                onChange={(e) =>
                  setFormData({ ...formData, client_secret: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">留空表示不修改密钥</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_remarks">备注</Label>
              <Input
                id="edit_remarks"
                placeholder="备注信息"
                value={formData.remarks}
                onChange={(e) =>
                  setFormData({ ...formData, remarks: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditOpen(false)}
            >
              取消
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  更新中...
                </>
              ) : (
                '更新'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Secret Dialog */}
      <Dialog open={isUpdateSecretOpen} onOpenChange={(open) => {
        setIsUpdateSecretOpen(open)
        if (!open) {
          setUpdatingTenant(null)
          setDeleteOldSecret(false)
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>更新客户端密钥</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                将为租户 <strong>{updatingTenant?.tenant_name || '未命名租户'}</strong> 创建一个新的客户端密钥，过期时间为 <strong>2099-12-31</strong>。
              </p>
              {updatingTenant?.client_secret_expires_at && (
                <div className={`text-sm ${new Date(updatingTenant.client_secret_expires_at) < new Date() ? 'text-red-600' : 'text-muted-foreground'}`}>
                  当前密钥过期时间: {formatDate(updatingTenant.client_secret_expires_at)}
                  {new Date(updatingTenant.client_secret_expires_at) < new Date() && ' (已过期)'}
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2 p-3 rounded-lg border bg-slate-50 dark:bg-slate-900">
              <input
                type="checkbox"
                id="delete_old_secret"
                checked={deleteOldSecret}
                onChange={(e) => setDeleteOldSecret(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="delete_old_secret" className="text-sm font-medium cursor-pointer">
                删除所有旧密钥
              </label>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-yellow-800 dark:text-yellow-200">
                  <strong>注意：</strong>
                </p>
                <ul className="mt-2 space-y-1 text-yellow-700 dark:text-yellow-300 list-disc list-inside">
                  <li>新密钥生成后将自动保存到系统</li>
                  <li>如果勾选"删除所有旧密钥"，所有现有密钥将被删除</li>
                  <li>请确保在删除前，所有使用旧密钥的服务已更新</li>
                </ul>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsUpdateSecretOpen(false)}
            >
              取消
            </Button>
            <Button
              onClick={confirmUpdateSecret}
              disabled={updateSecretMutation.isPending}
            >
              {updateSecretMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  更新中...
                </>
              ) : (
                '确认更新'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Configure Permissions Dialog */}
      <Dialog open={isConfigurePermissionsOpen} onOpenChange={(open) => {
        if (!open) closePermissionsDialog()
      }}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>配置 API 权限</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!consentUrl ? (
              <>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    将为租户 <strong>{configuringTenant?.tenant_name || '未命名租户'}</strong> 配置以下 Microsoft Graph API 权限：
                  </p>
                </div>
                
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    <strong>⚠️ 前置要求：</strong>
                  </p>
                  <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                    此操作需要应用已拥有 <strong>Application.ReadWrite.All</strong> 权限并已授予管理员同意。如果尚未配置，请先在 Azure Portal 手动添加此权限。
                  </p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-semibold">应用程序权限：</p>
                  <ul className="space-y-1.5 text-xs text-muted-foreground ml-4">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                      <div>
                        <strong className="text-foreground">User.ReadWrite.All</strong> - 用户管理（创建、删除、更新、启用/禁用用户）
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                      <div>
                        <strong className="text-foreground">Directory.ReadWrite.All</strong> - 目录读写（管理目录对象和用户属性）
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                      <div>
                        <strong className="text-foreground">Organization.Read.All</strong> - 读取组织信息和许可证数据
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                      <div>
                        <strong className="text-foreground">Reports.Read.All</strong> - 生成 OneDrive 和 Exchange 使用情况报告
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                      <div>
                        <strong className="text-foreground">RoleManagement.ReadWrite.Directory</strong> - 角色管理（提升/撤销全局管理员权限）
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                      <div>
                        <strong className="text-foreground">Domain.ReadWrite.All</strong> - 域名管理（添加、验证、删除自定义域名）
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                      <div>
                        <strong className="text-foreground">Application.ReadWrite.All</strong> - 应用配置和自动更新客户端密钥
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                      <div>
                        <strong className="text-foreground">Sites.FullControl.All</strong> - SharePoint Online 状态检查
                      </div>
                    </li>
                  </ul>
                </div>
                
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>说明：</strong>
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-blue-700 dark:text-blue-300 list-disc list-inside">
                    <li>系统将自动配置所有上述权限</li>
                    <li>权限配置后需要全局管理员进行授权同意</li>
                    <li>配置完成后会显示管理员同意链接</li>
                    <li>请使用全局管理员账户打开链接完成授权</li>
                  </ul>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">
                    ✅ 权限配置成功！
                  </p>
                  <p className="text-sm text-muted-foreground">
                    请使用全局管理员账户打开以下链接完成授权：
                  </p>
                </div>
                
                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <p className="text-xs font-mono break-all">{consentUrl}</p>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      if (!consentUrl) {
                        toast.error('授权链接为空')
                        return
                      }
                      
                      try {
                        if (navigator.clipboard && window.isSecureContext) {
                          await navigator.clipboard.writeText(consentUrl)
                          toast.success('已复制到剪贴板')
                        } else {
                          // 回退方案：使用传统的复制方法
                          const textArea = document.createElement('textarea')
                          textArea.value = consentUrl
                          textArea.style.position = 'fixed'
                          textArea.style.left = '-999999px'
                          textArea.style.top = '0'
                          document.body.appendChild(textArea)
                          textArea.focus()
                          textArea.select()
                          try {
                            const successful = document.execCommand('copy')
                            if (successful) {
                              toast.success('已复制到剪贴板')
                            } else {
                              toast.error('复制失败，请手动复制链接')
                            }
                          } catch (err) {
                            console.error('复制失败:', err)
                            toast.error('复制失败，请手动复制链接')
                          }
                          document.body.removeChild(textArea)
                        }
                      } catch (err) {
                        console.error('复制失败:', err)
                        toast.error('复制失败，请手动复制链接')
                      }
                    }}
                    className="flex-1"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    复制链接
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => window.open(consentUrl, '_blank')}
                    className="flex-1"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    在新标签页打开
                  </Button>
                </div>
                
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>注意：</strong>
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-yellow-700 dark:text-yellow-300 list-disc list-inside">
                    <li>需要使用此租户的全局管理员账户登录</li>
                    <li>授权后权限才会生效</li>
                    <li>关闭此对话框不影响已配置的权限</li>
                  </ul>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            {!consentUrl ? (
              <>
                <Button
                  variant="outline"
                  onClick={closePermissionsDialog}
                >
                  取消
                </Button>
                <Button
                  onClick={confirmConfigurePermissions}
                  disabled={configurePermissionsMutation.isPending}
                >
                  {configurePermissionsMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      配置中...
                    </>
                  ) : (
                    '确认配置'
                  )}
                </Button>
              </>
            ) : (
              <Button
                onClick={closePermissionsDialog}
                className="w-full"
              >
                关闭
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
