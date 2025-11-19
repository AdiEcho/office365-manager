import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { roleApi, userApi } from '@/utils/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { ShieldCheck, Loader2, Users, ArrowUp, ArrowDown } from 'lucide-react'
import toast from 'react-hot-toast'

const GLOBAL_ADMIN_ROLE_ID = '62e90394-69f5-4237-9190-012177145e10'

export function Roles() {
  const queryClient = useQueryClient()
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [isPromoteOpen, setIsPromoteOpen] = useState(false)

  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await roleApi.list()
      return res.data
    },
  })

  const { data: users } = useQuery({
    queryKey: ['users-for-roles'],
    queryFn: async () => {
      const res = await userApi.list({ top: 100 })
      return res.data
    },
  })

  const { data: roleMembers, isLoading: membersLoading } = useQuery({
    queryKey: ['roleMembers', selectedRole],
    queryFn: async () => {
      if (!selectedRole) return []
      const res = await roleApi.listMembers(selectedRole)
      return res.data
    },
    enabled: !!selectedRole,
  })

  const promoteMutation = useMutation({
    mutationFn: (userId: string) => roleApi.promote(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roleMembers'] })
      setIsPromoteOpen(false)
      toast.success('用户已提升为全局管理员')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const demoteMutation = useMutation({
    mutationFn: (userId: string) => roleApi.demote(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roleMembers'] })
      toast.success('已撤销全局管理员权限')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">角色管理</h2>
        <p className="text-muted-foreground mt-2">
          管理用户的目录角色和权限
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Roles List */}
        <Card>
          <CardHeader>
            <CardTitle>目录角色</CardTitle>
          </CardHeader>
          <CardContent>
            {rolesLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : roles?.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">暂无角色信息</p>
              </div>
            ) : (
              <div className="space-y-2">
                {roles?.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRole(role.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedRole === role.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                      <div className="flex-1">
                        <div className="font-medium">{role.displayName}</div>
                        {role.description && (
                          <div className="text-sm text-muted-foreground">
                            {role.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Role Members */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>
              {selectedRole
                ? roles?.find((r) => r.id === selectedRole)?.displayName
                : '选择一个角色'}
            </CardTitle>
            {selectedRole === GLOBAL_ADMIN_ROLE_ID && (
              <Button
                size="sm"
                onClick={() => setIsPromoteOpen(true)}
              >
                <ArrowUp className="h-4 w-4 mr-1" />
                提升用户
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {!selectedRole ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-muted-foreground">
                  请从左侧选择一个角色查看成员
                </p>
              </div>
            ) : membersLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : roleMembers?.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">此角色暂无成员</p>
              </div>
            ) : (
              <div className="space-y-2">
                {roleMembers?.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{member.displayName}</div>
                      <div className="text-sm text-muted-foreground">
                        {member.userPrincipalName}
                      </div>
                    </div>
                    {selectedRole === GLOBAL_ADMIN_ROLE_ID && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (
                            confirm(
                              `确定要撤销 ${member.displayName} 的全局管理员权限吗？`
                            )
                          ) {
                            demoteMutation.mutate(member.id)
                          }
                        }}
                        disabled={demoteMutation.isPending}
                      >
                        <ArrowDown className="h-4 w-4 mr-1" />
                        撤销
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Promote Dialog */}
      <Dialog open={isPromoteOpen} onOpenChange={setIsPromoteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>提升为全局管理员</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {users?.map((user) => (
                <button
                  key={user.id}
                  onClick={() => {
                    if (
                      confirm(
                        `确定要提升 ${user.display_name} 为全局管理员吗？`
                      )
                    ) {
                      promoteMutation.mutate(user.id)
                    }
                  }}
                  disabled={promoteMutation.isPending}
                  className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <div className="font-medium">{user.display_name}</div>
                  <div className="text-sm text-muted-foreground">
                    {user.user_principal_name}
                  </div>
                </button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPromoteOpen(false)}>
              取消
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
