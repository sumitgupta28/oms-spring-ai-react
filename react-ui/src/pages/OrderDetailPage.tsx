import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react'
import { orderApi } from '../api/orderApi'
import { OrderStatusBadge } from '../components/ui/Badge'
import { Spinner } from '../components/ui/Spinner'
import { formatCurrency, formatDate } from '../utils/formatCurrency'
import { OrderStatus } from '../types/order'

const statusIcons: Record<OrderStatus, React.ReactNode> = {
  PENDING:        <Clock className="h-8 w-8 text-yellow-500" />,
  CONFIRMED:      <CheckCircle className="h-8 w-8 text-green-500" />,
  CANCELLED:      <XCircle className="h-8 w-8 text-red-500" />,
  PAYMENT_FAILED: <XCircle className="h-8 w-8 text-red-500" />,
}

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => orderApi.get(id!),
    enabled: !!id,
    // Poll every 3s while order is PENDING (waiting for saga)
    refetchInterval: (query) =>
      query.state.data?.status === 'PENDING' ? 3000 : false,
  })

  if (isLoading) return <Spinner className="py-40" />
  if (!order) return <p className="text-center py-20 text-gray-500">Order not found.</p>

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Orders
      </button>

      {/* Status card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 text-center">
        <div className="flex justify-center mb-3">{statusIcons[order.status]}</div>
        <OrderStatusBadge status={order.status} />
        <p className="mt-2 text-sm text-gray-500">
          {order.status === 'PENDING' && (
            <span className="flex items-center justify-center gap-1">
              <RefreshCw className="h-3 w-3 animate-spin" /> Processing your order…
            </span>
          )}
          {order.status === 'CONFIRMED' && 'Your order has been confirmed and will be shipped soon.'}
          {order.status === 'CANCELLED' && 'This order was cancelled. No payment was charged.'}
          {order.status === 'PAYMENT_FAILED' && 'Payment failed. Please try again.'}
        </p>
      </div>

      {/* Order info */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-4">
        <div className="flex justify-between mb-4">
          <div>
            <p className="text-xs text-gray-400">Order ID</p>
            <p className="text-sm font-mono text-gray-700">{order.id}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Placed on</p>
            <p className="text-sm text-gray-700">{formatDate(order.createdAt)}</p>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-xs text-gray-400 mb-1">Shipping Address</p>
          <p className="text-sm text-gray-700">{order.shippingAddress}</p>
        </div>

        {/* Items */}
        <div>
          <p className="text-xs text-gray-400 mb-2">Items</p>
          <div className="space-y-2">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-700">{item.productName} × {item.quantity}</span>
                <span className="font-medium text-gray-900">{formatCurrency(item.subtotal)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between font-semibold text-gray-900">
            <span>Total</span>
            <span>{formatCurrency(order.totalAmount)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
