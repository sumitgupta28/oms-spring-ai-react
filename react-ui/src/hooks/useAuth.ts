import keycloak from '../keycloak'

export interface AuthUser {
  id: string
  username: string
  email: string
  roles: string[]
}

export function useAuth() {
  const tokenParsed = keycloak.tokenParsed as Record<string, unknown> | undefined
  const realmAccess = tokenParsed?.realm_access as { roles?: string[] } | undefined
  const roles: string[] = realmAccess?.roles ?? []

  const user: AuthUser | null = keycloak.authenticated
    ? {
        id: keycloak.subject ?? '',
        username: (tokenParsed?.preferred_username as string) ?? '',
        email: (tokenParsed?.email as string) ?? '',
        roles,
      }
    : null

  return {
    user,
    isAuthenticated: !!keycloak.authenticated,
    hasRole: (role: string) => roles.includes(role) || roles.includes(`ROLE_${role}`),
    isAdmin: roles.some((r) => r === 'ROLE_ADMIN' || r === 'ROLE_ADMIN'),
    isVendor: roles.some((r) => r === 'ROLE_VENDOR'),
    isCustomer: roles.some((r) => r === 'ROLE_CUSTOMER'),
    isSupport: roles.some((r) => r === 'ROLE_SUPPORT'),
    logout: () => keycloak.logout({ redirectUri: window.location.origin }),
  }
}
