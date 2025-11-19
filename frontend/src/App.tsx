import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Dashboard } from './pages/Dashboard'
import { Tenants } from './pages/Tenants'
import { Users } from './pages/Users'
import { Licenses } from './pages/Licenses'
import { Domains } from './pages/Domains'
import { Roles } from './pages/Roles'
import { Reports } from './pages/Reports'
import { Settings } from './pages/Settings'
import { authApi } from './utils/api'
import { useAuthStore } from './store/auth'

function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const [isCheckingStatus, setIsCheckingStatus] = useState(true)

  useEffect(() => {
    // Check system initialization status on app load
    const checkSystemStatus = async () => {
      try {
        const response = await authApi.getSystemStatus()
        if (response.data.needs_initialization) {
          // System needs initialization, redirect to register page
          if (location.pathname !== '/register') {
            navigate('/register', { replace: true })
          }
        }
      } catch (error) {
        console.error('Failed to check system status:', error)
      } finally {
        setIsCheckingStatus(false)
      }
    }

    // Only check if user is not authenticated
    if (!isAuthenticated) {
      checkSystemStatus()
    } else {
      setIsCheckingStatus(false)
    }
  }, [navigate, location.pathname, isAuthenticated])

  // Show loading state while checking
  if (isCheckingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">正在初始化系统...</p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="tenants" element={<Tenants />} />
        <Route path="tenants/:tenantId/users" element={<Users />} />
        <Route path="tenants/:tenantId/licenses" element={<Licenses />} />
        <Route path="tenants/:tenantId/domains" element={<Domains />} />
        <Route path="tenants/:tenantId/roles" element={<Roles />} />
        <Route path="tenants/:tenantId/reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}

export default App
