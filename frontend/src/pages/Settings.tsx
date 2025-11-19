import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '@/utils/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Key } from 'lucide-react'
import toast from 'react-hot-toast'

export function Settings() {
  const [formData, setFormData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  })

  const changePasswordMutation = useMutation({
    mutationFn: () =>
      authApi.changePassword({
        old_password: formData.old_password,
        new_password: formData.new_password,
      }),
    onSuccess: () => {
      toast.success('密码修改成功')
      setFormData({
        old_password: '',
        new_password: '',
        confirm_password: '',
      })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.old_password || !formData.new_password || !formData.confirm_password) {
      toast.error('请填写所有字段')
      return
    }

    if (formData.new_password.length < 6) {
      toast.error('新密码至少需要6个字符')
      return
    }

    if (formData.new_password !== formData.confirm_password) {
      toast.error('两次输入的新密码不一致')
      return
    }

    changePasswordMutation.mutate()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">系统设置</h2>
        <p className="text-muted-foreground mt-2">管理您的账户和安全设置</p>
      </div>

      {/* Change Password Card */}
      <Card className="max-w-2xl">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Key className="h-5 w-5 text-primary" />
            <CardTitle>修改密码</CardTitle>
          </div>
          <CardDescription>定期修改密码可以提高账户安全性</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="old_password">当前密码</Label>
              <Input
                id="old_password"
                type="password"
                placeholder="请输入当前密码"
                value={formData.old_password}
                onChange={(e) =>
                  setFormData({ ...formData, old_password: e.target.value })
                }
                disabled={changePasswordMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new_password">新密码</Label>
              <Input
                id="new_password"
                type="password"
                placeholder="请输入新密码（至少6个字符）"
                value={formData.new_password}
                onChange={(e) =>
                  setFormData({ ...formData, new_password: e.target.value })
                }
                disabled={changePasswordMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm_password">确认新密码</Label>
              <Input
                id="confirm_password"
                type="password"
                placeholder="请再次输入新密码"
                value={formData.confirm_password}
                onChange={(e) =>
                  setFormData({ ...formData, confirm_password: e.target.value })
                }
                disabled={changePasswordMutation.isPending}
              />
            </div>
            <Button
              type="submit"
              disabled={changePasswordMutation.isPending}
            >
              {changePasswordMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  修改中...
                </>
              ) : (
                '修改密码'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
