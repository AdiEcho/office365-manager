import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { tenantApi } from '@/utils/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building2, CheckCircle2, XCircle, Loader2, Plus, Settings, ExternalLink, Info, ShieldCheck, Key, FileCheck, Sparkles } from 'lucide-react'
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

  const validCredentialTenants = tenants?.items.filter(t => t.credential_status === 'valid').length || 0
  const invalidCredentialTenants = tenants?.items.filter(t => t.credential_status === 'invalid').length || 0

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
      name: '有效凭证租户',
      value: validCredentialTenants,
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      loading: tenantsLoading,
    },
    {
      name: '无效凭证租户',
      value: invalidCredentialTenants,
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
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {tenants?.items.slice(0, 9).map((tenant) => (
                <Card
                  key={tenant.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate('/tenants')}
                >
                  <CardHeader className="pb-2 pt-3 px-3">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/30">
                        <Building2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm truncate">{tenant.tenant_name || '未命名租户'}</CardTitle>
                        <div className="text-[10px] text-muted-foreground truncate">{tenant.tenant_id}</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 pb-3 px-3">
                    <TenantLicensesSummary tenantId={tenant.id} compact />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Azure AD Configuration Guide */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-600" />
            <CardTitle>Azure AD 应用配置指南</CardTitle>
          </div>
          <CardDescription>
            按照以下步骤配置 Azure AD 应用程序，以便使用本系统管理 Microsoft 365 租户
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1 */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold">
                1
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-base mb-2 flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  注册应用程序
                </h3>
                <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                  <li>登录 <a href="https://portal.azure.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">Azure Portal <ExternalLink className="h-3 w-3" /></a></li>
                  <li>前往 <a href="https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">应用注册 <ExternalLink className="h-3 w-3" /></a></li>
                  <li>点击"新注册"，填写应用信息（名称: Office 365 Manager，账户类型: 仅此组织目录）</li>
                  <li>点击"注册"</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold">
                2
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-base mb-2 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  记录应用信息
                </h3>
                <p className="text-sm text-muted-foreground">
                  记录以下信息（将在添加租户时使用）：
                </p>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground list-disc list-inside">
                  <li><strong>应用程序（客户端）ID</strong></li>
                  <li><strong>目录（租户）ID</strong></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold">
                3
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-base mb-2 flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  创建客户端密钥
                </h3>
                <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                  <li>在应用程序页面，点击"证书和密码"</li>
                  <li>点击"新客户端密码"</li>
                  <li>填写描述，选择过期时间（建议 24 个月）</li>
                  <li>点击"添加"</li>
                  <li><strong className="text-orange-600">立即复制密钥值（之后将无法再查看）</strong></li>
                </ol>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold">
                4
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
                  <FileCheck className="h-4 w-4" />
                  配置 API 权限
                </h3>
                
                <div className="space-y-4">
                  {/* 方法一：自动配置（推荐） */}
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-2 border-purple-200 dark:border-purple-800">
                    <div className="flex items-start gap-2 mb-3">
                      <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-purple-800 dark:text-purple-200 mb-1">
                          方法一：自动配置（推荐）⭐
                        </p>
                        <p className="text-xs text-purple-700 dark:text-purple-300">
                          只需手动添加一个前置权限，系统将自动配置其他所有权限
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-purple-800 dark:text-purple-200 mb-2">前置步骤（必需）：</p>
                        <ol className="space-y-1.5 text-sm text-purple-700 dark:text-purple-300 list-decimal list-inside ml-2">
                          <li>点击 <strong>"API 权限"</strong> → <strong>"添加权限"</strong> → <strong>"Microsoft Graph"</strong> → <strong>"应用程序权限"</strong></li>
                          <li>搜索并添加 <code className="bg-purple-100 dark:bg-purple-900 px-1.5 py-0.5 rounded text-xs font-mono">Application.ReadWrite.All</code> 权限</li>
                          <li>点击 <strong>"授予管理员同意"</strong> 按钮授权该权限</li>
                        </ol>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-purple-800 dark:text-purple-200 mb-2">使用系统自动配置：</p>
                        <ol className="space-y-1.5 text-sm text-purple-700 dark:text-purple-300 list-decimal list-inside ml-2" start={4}>
                          <li>在本系统中添加租户后，点击 <strong>"配置权限"</strong> 按钮</li>
                          <li>系统将自动添加所有需要的权限</li>
                          <li>使用生成的管理员同意链接完成最终授权</li>
                        </ol>
                      </div>

                      <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded border border-purple-300 dark:border-purple-700">
                        <p className="text-xs text-purple-800 dark:text-purple-200">
                          <strong>系统将自动配置：</strong> User.ReadWrite.All, Directory.ReadWrite.All, Organization.Read.All, Reports.Read.All, RoleManagement.ReadWrite.Directory, Domain.ReadWrite.All, Sites.FullControl.All
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 方法二：完全手动配置 */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-semibold text-slate-600 dark:text-slate-400">
                        或
                      </div>
                      <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">方法二：完全手动配置</h4>
                    </div>
                    
                    <p className="text-xs text-muted-foreground pl-8 mb-3">
                      适用于不想授予 Application.ReadWrite.All 权限的场景（将无法使用自动更新客户端密钥功能）
                    </p>
                    
                    <div className="pl-8 space-y-3">
                      <div>
                        <p className="text-sm font-medium mb-2">步骤：</p>
                        <ol className="space-y-1.5 text-sm text-muted-foreground list-decimal list-inside">
                          <li>点击 <strong>"API 权限"</strong> → <strong>"添加权限"</strong> → <strong>"Microsoft Graph"</strong> → <strong>"应用程序权限"</strong></li>
                          <li>根据需要的功能添加以下权限</li>
                          <li>所有权限添加完成后，点击 <strong>"授予管理员同意"</strong></li>
                          <li>确保所有权限的状态列显示绿色勾号</li>
                        </ol>
                      </div>

                      <div>
                        <p className="text-sm font-medium mb-2">核心权限（必需）：</p>
                        <div className="grid gap-2 md:grid-cols-2">
                          <div className="rounded-lg border p-2.5 bg-slate-50 dark:bg-slate-900">
                            <ul className="space-y-1 text-xs text-muted-foreground">
                              <li>• User.ReadWrite.All</li>
                              <li>• Directory.ReadWrite.All</li>
                            </ul>
                          </div>
                          <div className="rounded-lg border p-2.5 bg-slate-50 dark:bg-slate-900">
                            <ul className="space-y-1 text-xs text-muted-foreground">
                              <li>• Organization.Read.All</li>
                              <li>• Reports.Read.All</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium mb-2">高级功能（可选）：</p>
                        <div className="grid gap-2 md:grid-cols-2">
                          <div className="rounded-lg border p-2.5 bg-slate-50 dark:bg-slate-900">
                            <ul className="space-y-1 text-xs text-muted-foreground">
                              <li>• RoleManagement.ReadWrite.Directory</li>
                              <li>• Domain.ReadWrite.All</li>
                            </ul>
                          </div>
                          <div className="rounded-lg border p-2.5 bg-slate-50 dark:bg-slate-900">
                            <ul className="space-y-1 text-xs text-muted-foreground">
                              <li>• Sites.FullControl.All</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 重要提示 */}
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      <strong>⚠️ 重要：</strong>无论选择哪种方法，都必须授予管理员同意，否则应用程序无法访问 Microsoft Graph API
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Permissions Table */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-base mb-3">权限功能对照表</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold">功能</th>
                    <th className="px-4 py-2 text-left font-semibold">所需权限</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="px-4 py-2">用户管理（创建/删除/更新）</td>
                    <td className="px-4 py-2 text-muted-foreground">User.ReadWrite.All, Directory.ReadWrite.All</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">启用/禁用用户</td>
                    <td className="px-4 py-2 text-muted-foreground">User.ReadWrite.All</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">角色管理（提权/撤权）</td>
                    <td className="px-4 py-2 text-muted-foreground">RoleManagement.ReadWrite.Directory</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">域名管理</td>
                    <td className="px-4 py-2 text-muted-foreground">Domain.ReadWrite.All</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">查看许可证</td>
                    <td className="px-4 py-2 text-muted-foreground">Organization.Read.All</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">生成报告</td>
                    <td className="px-4 py-2 text-muted-foreground">Reports.Read.All</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">配置权限</td>
                    <td className="px-4 py-2 text-muted-foreground">Application.ReadWrite.All</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">更新密钥</td>
                    <td className="px-4 py-2 text-muted-foreground">Application.ReadWrite.All</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">检查 SPO 状态</td>
                    <td className="px-4 py-2 text-muted-foreground">Sites.FullControl.All</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Button */}
          <div className="border-t pt-4">
            <Button onClick={() => navigate('/tenants')} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              配置完成后，添加租户
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
