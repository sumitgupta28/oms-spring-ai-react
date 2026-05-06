import axios from 'axios'
import axiosInstance from './axiosInstance'

export interface RegisterRequest {
  firstName: string
  lastName: string
  email: string
  password: string
}

export interface SaveAddressRequest {
  label: string
  fullName: string
  street: string
  city: string
  state: string
  zipCode: string
  country: string
  phone?: string
  isDefault: boolean
}

export interface SavePaymentMethodRequest {
  nickname?: string
  cardType: string
  lastFour: string
  expiryMonth: number
  expiryYear: number
  isDefault: boolean
}

export interface AddressResponse {
  id: string
  label: string
  fullName: string
  street: string
  city: string
  state: string
  zipCode: string
  country: string
  phone?: string
  isDefault: boolean
  createdAt: string
}

export interface PaymentMethodResponse {
  id: string
  nickname?: string
  cardType: string
  lastFour: string
  expiryMonth: number
  expiryYear: number
  isDefault: boolean
  createdAt: string
}

export interface UserResponse {
  id: string
  username: string
  email: string
  firstName: string
  lastName: string
  role: string
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED'
  emailVerified: boolean
  mfaEnabled: boolean
  joinedAt: string
  lastLoginAt: string | null
  phone?: string
  avatarUrl?: string
}

export interface UserStatsResponse {
  total: number
  active: number
  pendingVerify: number
  suspended: number
  thisMonth: number
}

export interface AdminCreateUserRequest {
  firstName: string
  lastName: string
  email: string
  role: string
}

export const userApi = {
  // Public — no auth needed
  register: (data: RegisterRequest) =>
    axios.post<{ message: string }>('/api/users/register', data).then((r) => r.data),

  forgotPassword: (email: string) =>
    axios.post<{ message: string }>('/api/users/forgot-password', { email }).then((r) => r.data),

  // Customer self-service
  getMyAddresses: () =>
    axiosInstance.get<AddressResponse[]>('/api/users/me/addresses').then((r) => r.data),

  addAddress: (data: SaveAddressRequest) =>
    axiosInstance.post<AddressResponse>('/api/users/me/addresses', data).then((r) => r.data),

  updateAddress: (id: string, data: SaveAddressRequest) =>
    axiosInstance.put<AddressResponse>(`/api/users/me/addresses/${id}`, data).then((r) => r.data),

  deleteAddress: (id: string) =>
    axiosInstance.delete(`/api/users/me/addresses/${id}`),

  setDefaultAddress: (id: string) =>
    axiosInstance.put(`/api/users/me/addresses/${id}/default`),

  getMyPaymentMethods: () =>
    axiosInstance.get<PaymentMethodResponse[]>('/api/users/me/payment-methods').then((r) => r.data),

  addPaymentMethod: (data: SavePaymentMethodRequest) =>
    axiosInstance.post<PaymentMethodResponse>('/api/users/me/payment-methods', data).then((r) => r.data),

  deletePaymentMethod: (id: string) =>
    axiosInstance.delete(`/api/users/me/payment-methods/${id}`),

  setDefaultPaymentMethod: (id: string) =>
    axiosInstance.put(`/api/users/me/payment-methods/${id}/default`),

  // Admin
  getUserStats: () =>
    axiosInstance.get<UserStatsResponse>('/api/users/stats').then((r) => r.data),

  listUsers: (params?: { status?: string; role?: string }) =>
    axiosInstance.get<UserResponse[]>('/api/users', { params }).then((r) => r.data),

  getUser: (id: string) =>
    axiosInstance.get<UserResponse>(`/api/users/${id}`).then((r) => r.data),

  createUser: (data: AdminCreateUserRequest) =>
    axiosInstance.post<{ id: string; message: string }>('/api/users', data).then((r) => r.data),

  updateUserStatus: (id: string, status: 'ACTIVE' | 'SUSPENDED') =>
    axiosInstance.put(`/api/users/${id}/status`, { status }),

  updateUserRole: (id: string, role: string) =>
    axiosInstance.put(`/api/users/${id}/roles`, { role }),
}
