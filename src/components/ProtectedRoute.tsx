import React from 'react'
import { Navigate } from 'react-router'
import { useAuth } from '../contexts/AuthContext'

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen bg-background text-foreground">Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}
