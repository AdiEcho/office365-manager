import { useQuery } from '@tanstack/react-query'
import { licenseApi } from '@/utils/api'
import { getLicenseName, formatLicenseUsage } from '@/utils/utils'
import { Award, Loader2 } from 'lucide-react'

interface TenantLicensesSummaryProps {
  tenantId: number
  compact?: boolean
}

export function TenantLicensesSummary({ tenantId, compact = false }: TenantLicensesSummaryProps) {
  const { data: licenses, isLoading, error } = useQuery({
    queryKey: ['licenses', tenantId],
    queryFn: async () => {
      try {
        const res = await licenseApi.listByTenant(tenantId)
        return res.data
      } catch {
        return []
      }
    },
    retry: false,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error || !licenses || licenses.length === 0) {
    return (
      <div className="text-center py-3 text-xs text-muted-foreground">
        暂无许可证数据
      </div>
    )
  }

  const totalEnabled = licenses.reduce((sum, lic) => sum + lic.enabled_units, 0)
  const totalConsumed = licenses.reduce((sum, lic) => sum + lic.consumed_units, 0)
  const usagePercentage = totalEnabled > 0 ? Math.round((totalConsumed / totalEnabled) * 100) : 0

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center text-muted-foreground">
            <Award className="h-3 w-3 mr-1" />
            许可证总数
          </span>
          <span className="font-medium">{licenses.length} 种</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">分配情况</span>
          <span className="font-medium">
            {totalConsumed}/{totalEnabled} ({usagePercentage}%)
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all ${
              usagePercentage >= 90 ? 'bg-red-500' : usagePercentage >= 70 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${usagePercentage}%` }}
          />
        </div>
        <div className="pt-2 space-y-1 max-h-32 overflow-y-auto">
          {licenses.slice(0, 3).map((license) => {
            const percentage = license.enabled_units > 0 
              ? Math.round((license.consumed_units / license.enabled_units) * 100) 
              : 0
            const licenseName = getLicenseName(license.sku_part_number, license.sku_name_cn)
            return (
              <div key={license.sku_id} className="text-xs">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-muted-foreground truncate max-w-[240px]" title={licenseName}>
                    {licenseName}
                  </span>
                  <span className="text-xs font-mono">
                    {license.consumed_units}/{license.enabled_units}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1">
                  <div
                    className={`h-1 rounded-full ${
                      percentage >= 90 ? 'bg-red-500' : percentage >= 70 ? 'bg-yellow-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
          {licenses.length > 3 && (
            <div className="text-xs text-muted-foreground text-center pt-1">
              还有 {licenses.length - 3} 种许可证...
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium">许可证概览</span>
        </div>
        <span className="text-xs text-muted-foreground">
          共 {licenses.length} 种许可证
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="p-2 bg-blue-50 rounded">
          <div className="text-xs text-muted-foreground">总数</div>
          <div className="text-lg font-semibold text-blue-600">{totalEnabled}</div>
        </div>
        <div className="p-2 bg-green-50 rounded">
          <div className="text-xs text-muted-foreground">已分配</div>
          <div className="text-lg font-semibold text-green-600">{totalConsumed}</div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">总体使用率</span>
          <span className="font-medium">{usagePercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              usagePercentage >= 90 ? 'bg-red-500' : usagePercentage >= 70 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${usagePercentage}%` }}
          />
        </div>
      </div>
      <div className="space-y-2">
        {licenses.map((license) => {
          const percentage = license.enabled_units > 0 
            ? Math.round((license.consumed_units / license.enabled_units) * 100) 
            : 0
          const licenseName = getLicenseName(license.sku_part_number, license.sku_name_cn)
          return (
            <div key={license.sku_id} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium truncate" title={licenseName}>
                  {licenseName}
                </span>
                <span className="text-muted-foreground font-mono">
                  {formatLicenseUsage(license.consumed_units, license.enabled_units)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    percentage >= 90 ? 'bg-red-500' : percentage >= 70 ? 'bg-yellow-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
