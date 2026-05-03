import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { bffApi, UserInfo } from '../api/bffApi'

interface AuthState {
  user: UserInfo | null
  isAuthenticated: boolean
  isLoading: boolean
}

interface AuthContextValue extends AuthState {
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  hasRole: (role: string) => boolean
  isAdmin: boolean
  isVendor: boolean
  isCustomer: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  })

  useEffect(() => {
    bffApi.me()
      .then((user) => setState({ user, isAuthenticated: true, isLoading: false }))
      .catch(() => setState({ user: null, isAuthenticated: false, isLoading: false }))
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const user = await bffApi.login(username, password)
    setState({ user, isAuthenticated: true, isLoading: false })
  }, [])

  const logout = useCallback(async () => {
    await bffApi.logout()
    setState({ user: null, isAuthenticated: false, isLoading: false })
    window.location.replace('/login')
  }, [])

  const hasRole = useCallback((role: string) => {
    const roles = state.user?.roles ?? []
    return roles.includes(role) || roles.includes(`ROLE_${role}`)
  }, [state.user])

  const value: AuthContextValue = {
    ...state,
    login,
    logout,
    hasRole,
    isAdmin: state.user?.roles.includes('admin') ?? false,
    isVendor: state.user?.roles.includes('vendor') ?? false,
    isCustomer: state.user?.roles.includes('customer') ?? false,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used inside <AuthProvider>')
  return ctx
}
