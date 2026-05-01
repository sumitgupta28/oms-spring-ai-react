export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'PAYMENT_FAILED'

export interface OrderItem {
  id: string
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface Order {
  id: string
  customerId: string
  status: OrderStatus
  totalAmount: number
  shippingAddress: string
  items: OrderItem[]
  createdAt: string
  updatedAt: string
}

export interface CreateOrderRequest {
  items: {
    productId: string
    productName: string
    quantity: number
    unitPrice: number
  }[]
  shippingAddress: string
}
