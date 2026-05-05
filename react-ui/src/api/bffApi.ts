import axios from 'axios'

const bffHttp = axios.create({ withCredentials: true })

export interface UserInfo {
  id: string
  username: string
  email: string
  roles: string[]
}

export const bffApi = {
  login: (username: string, password: string) =>
    bffHttp.post<UserInfo>('/bff/login', { username, password }).then((r) => r.data),

  logout: () =>
    bffHttp.post('/bff/logout').catch(() => {/* ignore */}),

  me: () =>
    bffHttp.get<UserInfo>('/bff/me').then((r) => r.data),
}
