import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { reportApi } from '@/utils/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Download, Loader2, Building2 } from 'lucide-react'
import toast from 'react-hot-toast'

export function Reports() {
  const [period, setPeriod] = useState('D7')

  const { data: organization, isLoading: orgLoading } = useQuery({
    queryKey: ['organization'],
    queryFn: async () => {
      try {
        const res = await reportApi.getOrganization()
        return res.data
      } catch {
        return null
      }
    },
  })

  const downloadOneDriveMutation = useMutation({
    mutationFn: (period: string) => reportApi.getOneDrive(period),
    onSuccess: (response) => {
      const blob = response.data
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `onedrive_usage_${period}_${Date.now()}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('OneDrive 报告下载成功')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const downloadExchangeMutation = useMutation({
    mutationFn: (period: string) => reportApi.getExchange(period),
    onSuccess: (response) => {
      const blob = response.data
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `exchange_usage_${period}_${Date.now()}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Exchange 报告下载成功')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const periods = [
    { value: 'D7', label: '最近 7 天' },
    { value: 'D30', label: '最近 30 天' },
    { value: 'D90', label: '最近 90 天' },
    { value: 'D180', label: '最近 180 天' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">报告中心</h2>
        <p className="text-muted-foreground mt-2">
          生成和下载 Office 365 使用报告
        </p>
      </div>

      {/* Organization Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building2 className="h-5 w-5 mr-2" />
            组织信息
          </CardTitle>
        </CardHeader>
        <CardContent>
          {orgLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : organization ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-sm text-muted-foreground">组织名称</div>
                <div className="font-medium">{organization.displayName}</div>
              </div>
              {organization.tenantType && (
                <div>
                  <div className="text-sm text-muted-foreground">租户类型</div>
                  <div className="font-medium">{organization.tenantType}</div>
                </div>
              )}
              {organization.city && (
                <div>
                  <div className="text-sm text-muted-foreground">城市</div>
                  <div className="font-medium">{organization.city}</div>
                </div>
              )}
              {organization.country && (
                <div>
                  <div className="text-sm text-muted-foreground">国家</div>
                  <div className="font-medium">{organization.country}</div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              无法获取组织信息，请确保已选择租户
            </div>
          )}
        </CardContent>
      </Card>

      {/* Period Selection */}
      <Card>
        <CardHeader>
          <CardTitle>报告周期</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {periods.map((p) => (
              <Button
                key={p.value}
                variant={period === p.value ? 'default' : 'outline'}
                onClick={() => setPeriod(p.value)}
              >
                {p.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Reports */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* OneDrive Report */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              OneDrive 使用报告
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              生成所有用户的 OneDrive 存储使用情况详细报告，包括已用空间、文件数量等信息。
            </p>
            <Button
              onClick={() => downloadOneDriveMutation.mutate(period)}
              disabled={downloadOneDriveMutation.isPending}
              className="w-full"
            >
              {downloadOneDriveMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  下载 OneDrive 报告
                </>
              )}
            </Button>
            <div className="text-xs text-muted-foreground">
              ℹ️ 报告将以 CSV 格式下载
            </div>
          </CardContent>
        </Card>

        {/* Exchange Report */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Exchange 使用报告
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              生成所有用户的邮箱使用情况详细报告，包括邮件数量、邮箱大小等信息。
            </p>
            <Button
              onClick={() => downloadExchangeMutation.mutate(period)}
              disabled={downloadExchangeMutation.isPending}
              className="w-full"
            >
              {downloadExchangeMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  下载 Exchange 报告
                </>
              )}
            </Button>
            <div className="text-xs text-muted-foreground">
              ℹ️ 报告将以 CSV 格式下载
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Note */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <FileText className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                关于报告中的用户信息
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  由于 Microsoft 的隐私策略更新，报告中的用户信息和 URL 可能会以匿名形式显示。
                  如需查看真实信息，请使用管理员账号登录{' '}
                  <a
                    href="https://admin.microsoft.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium underline"
                  >
                    Microsoft 365 管理中心
                  </a>
                  ，在"设置 → 组织设置 → 报告"中取消勾选相关隐私选项。
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
