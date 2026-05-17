import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRoles?: string[]
  adminOnly?: boolean
}

export default function ProtectedRoute({ children, requiredRoles = [], adminOnly = false }: ProtectedRouteProps) {
  const { user, isAuthenticated } = useSelector((s: any) => s.auth)

  // Debug: Log current auth state
  useEffect(() => {
    console.log('ProtectedRoute Check:', {
      isAuthenticated,
      userExists: !!user,
      userRole: user?.role,
      requiredRoles,
      adminOnly,
      token: localStorage.getItem('token') ? 'exists' : 'missing'
    })
  }, [isAuthenticated, user, requiredRoles, adminOnly])

  // Check authentication
  if (!isAuthenticated || !user) {
    console.warn('Auth failed: Not authenticated or no user')
    return <Navigate to="/login" replace />
  }

  // Admin-only routes
  if (adminOnly && user.role !== 'ADMIN') {
    console.warn('Auth failed: Admin only but user is', user.role)
    return <Navigate to="/dashboard" replace />
  }

  // Role-based routes
  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
    console.warn('Auth failed: User role', user.role, 'not in', requiredRoles)

    // Redirect to appropriate dashboard based on role
    if (user.role === 'ADMIN') {
      return <Navigate to="/admin-dashboard" replace />
    } else if (user.role === 'MANAGER') {
      return <Navigate to="/manager-dashboard" replace />
    } else if (user.role === 'EMPLOYEE') {
      return <Navigate to="/employee-dashboard" replace />
    } else if (user.role === 'USER') {
      return <Navigate to="/user-dashboard" replace />
    }

    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
