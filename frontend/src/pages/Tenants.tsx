import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { tenantApi, type TenantCreate, type Tenant } from '@/utils/api'
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
import { Plus, Trash2, CheckCircle2, XCircle, Loader2, Edit2, Users, Award, Globe, ShieldCheck, FileText, RefreshCw, AlertCircle, Ban, HelpCircle, Key } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDate } from '@/utils/utils'
import { TenantLicensesSummary } from '@/components/TenantLicensesSummary'

export function Tenants() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null)
  const [formData, setFormData] = useState<TenantCreate>({
    tenant_id: '',
    client_id: '',
    client_secret: '',
    tenant_name: '',
    remarks: '',
  })

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
    mutationFn: (id: number) => tenantApi.validate(id),
    onSuccess: () => {
      toast.success('租户凭据验证成功')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const checkSpoMutation = useMutation({
    mutationFn: (id: number) => tenantApi.checkSpoStatus(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      toast.success(`SPO 状态检查完成: ${response.data.message}`)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const updateSecretMutation = useMutation({
    mutationFn: (id: number) => tenantApi.updateSecret(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      const detail = response.data.detail ? ` (${response.data.detail})` : ''
      toast.success(`${response.data.message}${detail}`)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

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
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          添加租户
        </Button>
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
            <div className="grid gap-6 md:grid-cols-2">
              {tenants?.items.map((tenant) => (
                <Card key={tenant.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          {tenant.tenant_name || '未命名租户'}
                          {tenant.is_active ? (
                            <span className="flex items-center text-xs font-normal text-green-600">
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              启用
                            </span>
                          ) : (
                            <span className="flex items-center text-xs font-normal text-red-600">
                              <XCircle className="h-4 w-4 mr-1" />
                              禁用
                            </span>
                          )}
                        </CardTitle>
                        <CardDescription className="mt-2 space-y-1">
                          <div>租户 ID: {tenant.tenant_id}</div>
                          <div>客户端 ID: {tenant.client_id}</div>
                          {tenant.remarks && <div>备注: {tenant.remarks}</div>}
                          <div>创建时间: {formatDate(tenant.created_at)}</div>
                          {(() => {
                            const spoDisplay = getSpoStatusDisplay(tenant.spo_status)
                            const SpoIcon = spoDisplay.icon
                            return (
                              <div className="flex items-center gap-2 pt-1">
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
                        disabled={validateMutation.isPending}
                      >
                        验证凭据
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => checkSpoMutation.mutate(tenant.id)}
                        disabled={checkSpoMutation.isPending}
                      >
                        {checkSpoMutation.isPending ? (
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
                        onClick={() => {
                          if (confirm('将创建一个过期时间为2099-12-31的新密钥，成功后会替换现有密钥。确定要继续吗？')) {
                            updateSecretMutation.mutate(tenant.id)
                          }
                        }}
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
              ))}
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
    </div>
  )
}
