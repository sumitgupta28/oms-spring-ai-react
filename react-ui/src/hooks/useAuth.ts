import { useAuthContext } from '../context/AuthContext'

export type { UserInfo as AuthUser } from '../api/bffApi'

export function useAuth() {
  return useAuthContext()
}
