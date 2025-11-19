import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { tenantApi } from '@/utils/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building2, CheckCircle2, XCircle, Loader2, Plus } from 'lucide-react'
import { TenantLicensesSummary } from '@/components/TenantLicensesSummary'

export function Dashboard() {
  const navigate = useNavigate()
  
  const { data: tenants, isLoading: tenantsLoading } = useQuery({
    queryKey: ['tenants'],
    queryFn: async () => {
      const res = await tenantApi.list()
      return res.data
    },
  })

  const activeTenants = tenants?.items.filter(t => t.is_active).length || 0
  const inactiveTenants = tenants?.items.filter(t => !t.is_active).length || 0

  const stats = [
    {
      name: '租户总数',
      value: tenants?.total || 0,
      icon: Building2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      loading: tenantsLoading,
    },
    {
      name: '启用租户',
      value: activeTenants,
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      loading: tenantsLoading,
    },
    {
      name: '禁用租户',
      value: inactiveTenants,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      loading: tenantsLoading,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">仪表板</h2>
          <p className="text-muted-foreground mt-2">
            管理和监控所有 Microsoft 365 租户
          </p>
        </div>
        {tenants?.total === 0 && (
          <Button onClick={() => navigate('/tenants')}>
            <Plus className="mr-2 h-4 w-4" />
            添加租户
          </Button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.name}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.name}
                </CardTitle>
                <div className={`${stat.bgColor} p-2 rounded-lg`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                {stat.loading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                ) : (
                  <div className="text-2xl font-bold">{stat.value}</div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Tenants Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>租户列表</CardTitle>
            <Button variant="outline" size="sm" onClick={() => navigate('/tenants')}>
              查看全部
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {tenantsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : tenants?.items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="mb-4">暂无租户</p>
              <Button onClick={() => navigate('/tenants')}>
                <Plus className="mr-2 h-4 w-4" />
                添加第一个租户
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {tenants?.items.slice(0, 6).map((tenant) => (
                <Card
                  key={tenant.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate('/tenants')}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-blue-100">
                          <Building2 className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{tenant.tenant_name || '未命名租户'}</CardTitle>
                          <div className="text-xs text-muted-foreground mt-1">{tenant.tenant_id}</div>
                        </div>
                      </div>
                      <div>
                        {tenant.is_active ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <TenantLicensesSummary tenantId={tenant.id} compact />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
