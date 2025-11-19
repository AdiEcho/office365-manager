import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { domainApi } from '@/utils/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Plus, Trash2, CheckCircle2, XCircle, Loader2, Shield } from 'lucide-react'
import toast from 'react-hot-toast'

export function Domains() {
  const queryClient = useQueryClient()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [domainName, setDomainName] = useState('')

  const { data: domains, isLoading } = useQuery({
    queryKey: ['domains'],
    queryFn: async () => {
      const res = await domainApi.list()
      return res.data
    },
  })

  const createMutation = useMutation({
    mutationFn: (name: string) => domainApi.create(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] })
      setIsCreateOpen(false)
      setDomainName('')
      toast.success('域名添加成功，请验证域名')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const verifyMutation = useMutation({
    mutationFn: (id: string) => domainApi.verify(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] })
      toast.success('域名验证成功')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => domainApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] })
      toast.success('域名删除请求已提交，可能需要最多24小时完成')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const handleCreate = () => {
    if (!domainName) {
      toast.error('请输入域名')
      return
    }
    createMutation.mutate(domainName)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">域名管理</h2>
          <p className="text-muted-foreground mt-2">
            管理 Office 365 自定义域名
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          添加域名
        </Button>
      </div>

      {/* Domains List */}
      <Card>
        <CardHeader>
          <CardTitle>域名列表</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : domains?.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">暂无域名，请添加第一个域名</p>
            </div>
          ) : (
            <div className="space-y-3">
              {domains?.map((domain) => (
                <div
                  key={domain.id}
                  className={`p-4 border rounded-lg transition-colors ${
                    domain.is_default ? 'border-primary bg-primary/5' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-semibold text-lg">{domain.id}</h3>
                        {domain.is_default && (
                          <span className="px-2 py-1 text-xs font-medium bg-primary text-white rounded">
                            默认域名
                          </span>
                        )}
                        {domain.is_verified ? (
                          <span className="flex items-center text-xs text-green-600">
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            已验证
                          </span>
                        ) : (
                          <span className="flex items-center text-xs text-yellow-600">
                            <XCircle className="h-4 w-4 mr-1" />
                            未验证
                          </span>
                        )}
                      </div>
                      <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                        <div>认证类型: {domain.authentication_type}</div>
                        {domain.supported_services.length > 0 && (
                          <div>
                            支持的服务:{' '}
                            {domain.supported_services.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!domain.is_verified && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => verifyMutation.mutate(domain.id)}
                          disabled={verifyMutation.isPending}
                        >
                          <Shield className="h-4 w-4 mr-1" />
                          验证
                        </Button>
                      )}
                      {!domain.is_default && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            if (
                              confirm(
                                `确定要删除域名 ${domain.id} 吗？\n\n注意: 删除可能需要最多24小时完成。`
                              )
                            ) {
                              deleteMutation.mutate(domain.id)
                            }
                          }}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加域名</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="domain_name">域名</Label>
              <Input
                id="domain_name"
                placeholder="example.com"
                value={domainName}
                onChange={(e) => setDomainName(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                请确保您拥有此域名，并能够添加 DNS 记录进行验证
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  添加中...
                </>
              ) : (
                '添加'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
