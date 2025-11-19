import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userApi, type UserCreate } from '@/utils/api'
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
import { Plus, Trash2, Search, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export function Users() {
  const queryClient = useQueryClient()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [formData, setFormData] = useState<UserCreate>({
    display_name: '',
    user_principal_name: '',
    mail_nickname: '',
    password: '',
    usage_location: 'CN',
    account_enabled: true,
  })

  const { data: users, isLoading } = useQuery({
    queryKey: ['users', searchKeyword],
    queryFn: async () => {
      if (searchKeyword) {
        const res = await userApi.search(searchKeyword)
        return res.data
      }
      const res = await userApi.list({ top: 100 })
      return res.data
    },
  })

  const createMutation = useMutation({
    mutationFn: (data: UserCreate) => userApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setIsCreateOpen(false)
      toast.success('用户创建成功')
      setFormData({
        display_name: '',
        user_principal_name: '',
        mail_nickname: '',
        password: '',
        usage_location: 'CN',
        account_enabled: true,
      })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => userApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('用户删除成功')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const enableMutation = useMutation({
    mutationFn: (id: string) => userApi.enable(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('用户已启用')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const disableMutation = useMutation({
    mutationFn: (id: string) => userApi.disable(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('用户已禁用')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const handleCreate = () => {
    if (
      !formData.display_name ||
      !formData.user_principal_name ||
      !formData.mail_nickname ||
      !formData.password
    ) {
      toast.error('请填写所有必填字段')
      return
    }
    createMutation.mutate(formData)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">用户管理</h2>
          <p className="text-muted-foreground mt-2">
            管理 Office 365 用户账户
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          创建用户
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <Search className="h-5 w-5 text-gray-400" />
            <Input
              placeholder="搜索用户名或邮箱..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="max-w-md"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>用户列表 ({users?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : users?.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchKeyword ? '未找到匹配的用户' : '暂无用户，请创建第一个用户'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {users?.map((user) => (
                <div
                  key={user.id}
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-semibold">{user.display_name}</h3>
                        {user.account_enabled ? (
                          <span className="flex items-center text-xs text-green-600">
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            已启用
                          </span>
                        ) : (
                          <span className="flex items-center text-xs text-red-600">
                            <XCircle className="h-4 w-4 mr-1" />
                            已禁用
                          </span>
                        )}
                      </div>
                      <div className="mt-1 space-y-1 text-sm text-muted-foreground">
                        <div>邮箱: {user.user_principal_name}</div>
                        {user.mail && <div>邮件: {user.mail}</div>}
                        {user.usage_location && (
                          <div>使用位置: {user.usage_location}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {user.account_enabled ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => disableMutation.mutate(user.id)}
                          disabled={disableMutation.isPending}
                        >
                          禁用
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => enableMutation.mutate(user.id)}
                          disabled={enableMutation.isPending}
                        >
                          启用
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (confirm(`确定要删除用户 ${user.display_name} 吗？`)) {
                            deleteMutation.mutate(user.id)
                          }
                        }}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>创建用户</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="display_name">显示名称 *</Label>
              <Input
                id="display_name"
                placeholder="张三"
                value={formData.display_name}
                onChange={(e) =>
                  setFormData({ ...formData, display_name: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="user_principal_name">用户主体名称 *</Label>
              <Input
                id="user_principal_name"
                placeholder="zhangsan@yourdomain.com"
                value={formData.user_principal_name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    user_principal_name: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="mail_nickname">邮件昵称 *</Label>
              <Input
                id="mail_nickname"
                placeholder="zhangsan"
                value={formData.mail_nickname}
                onChange={(e) =>
                  setFormData({ ...formData, mail_nickname: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">密码 *</Label>
              <Input
                id="password"
                type="password"
                placeholder="至少8位，包含大小写字母和数字"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="usage_location">使用位置</Label>
              <Input
                id="usage_location"
                placeholder="CN"
                value={formData.usage_location}
                onChange={(e) =>
                  setFormData({ ...formData, usage_location: e.target.value })
                }
              />
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
                  创建中...
                </>
              ) : (
                '创建'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
