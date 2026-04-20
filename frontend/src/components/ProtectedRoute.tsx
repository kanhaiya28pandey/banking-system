import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRoles?: string[]
  adminOnly?: boolean
}

export default function ProtectedRoute({ children, requiredRoles = [], adminOnly = false }: ProtectedRouteProps) {
  const { user, isAuthenticated } = useSelector((s: any) => s.auth)

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  // Admin-only routes
  if (adminOnly && user.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />
  }

  // Role-based routes
  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
