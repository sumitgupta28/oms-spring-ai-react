import axios from 'axios'
import { bffApi } from './bffApi'

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

axiosInstance.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      await bffApi.logout()
      window.location.replace('/login')
    }
    return Promise.reject(err)
  }
)

export default axiosInstance
