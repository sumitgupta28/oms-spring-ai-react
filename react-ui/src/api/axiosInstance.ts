import axios from 'axios'
import keycloak from '../keycloak'

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  headers: { 'Content-Type': 'application/json' },
})

axiosInstance.interceptors.request.use(async (config) => {
  try {
    await keycloak.updateToken(30)
  } catch {
    keycloak.login()
  }
  if (keycloak.token) {
    config.headers.Authorization = `Bearer ${keycloak.token}`
  }
  return config
})

axiosInstance.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      keycloak.login()
    }
    return Promise.reject(err)
  }
)

export default axiosInstance
