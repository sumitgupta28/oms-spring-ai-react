export type PaymentStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED'

export interface Payment {
  id: string
  orderId: string
  amount: number
  status: PaymentStatus
  transactionRef: string | null
  failureReason: string | null
  createdAt: string
  updatedAt: string
}
