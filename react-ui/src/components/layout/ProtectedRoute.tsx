import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Spinner } from '../ui/Spinner'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: string
  blockedRole?: string
}

export function ProtectedRoute({ children, requiredRole, blockedRole }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasRole, isVendor } = useAuth()

  if (isLoading) return <Spinner className="py-20" />

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (blockedRole && hasRole(blockedRole)) {
    return <Navigate to={isVendor ? '/vendor' : '/'} replace />
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
        <p className="text-gray-500">You don't have permission to view this page.</p>
      </div>
    )
  }

  return <>{children}</>
}
