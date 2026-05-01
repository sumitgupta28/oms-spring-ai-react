import axiosInstance from './axiosInstance'
import { CreateOrderRequest, Order } from '../types/order'
import { PageResponse } from '../types/product'
import { Payment } from '../types/payment'

export const orderApi = {
  create: (data: CreateOrderRequest) =>
    axiosInstance.post<Order>('/api/orders', data).then((r) => r.data),

  get: (id: string) =>
    axiosInstance.get<Order>(`/api/orders/${id}`).then((r) => r.data),

  myOrders: (params?: { page?: number; size?: number }) =>
    axiosInstance.get<PageResponse<Order>>('/api/orders/my', { params }).then((r) => r.data),

  allOrders: (params?: { page?: number; size?: number }) =>
    axiosInstance.get<PageResponse<Order>>('/api/orders', { params }).then((r) => r.data),

  getPayment: (orderId: string) =>
    axiosInstance.get<Payment>(`/api/payments/order/${orderId}`).then((r) => r.data),
}
