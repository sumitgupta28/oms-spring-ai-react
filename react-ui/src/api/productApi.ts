import axiosInstance from './axiosInstance'
import { CreateProductRequest, PageResponse, Product } from '../types/product'

export const productApi = {
  list: (params?: { category?: string; search?: string; page?: number; size?: number }) =>
    axiosInstance.get<PageResponse<Product>>('/api/products', { params }).then((r) => r.data),

  get: (id: string) =>
    axiosInstance.get<Product>(`/api/products/${id}`).then((r) => r.data),

  create: (data: CreateProductRequest) =>
    axiosInstance.post<Product>('/api/products', data).then((r) => r.data),

  update: (id: string, data: CreateProductRequest) =>
    axiosInstance.put<Product>(`/api/products/${id}`, data).then((r) => r.data),

  deactivate: (id: string) =>
    axiosInstance.delete(`/api/products/${id}`),

  myProducts: (params?: { page?: number; size?: number }) =>
    axiosInstance.get<PageResponse<Product>>('/api/products/vendor/mine', { params }).then((r) => r.data),

  updateInventory: (productId: string, quantity: number) =>
    axiosInstance.put(`/api/inventory/${productId}`, { quantity }).then((r) => r.data),
}
