import React from 'react'
import { Link } from 'react-router-dom'
import { Order } from '../../types/order'
import { OrderStatusBadge } from '../ui/Badge'
import { formatCurrency, formatDate } from '../../utils/formatCurrency'

interface OrderCardProps {
  order: Order
}

export function OrderCard({ order }: OrderCardProps) {
  return (
    <Link
      to={`/orders/${order.id}`}
      className="block bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs text-gray-500">Order ID</p>
          <p className="text-sm font-mono font-medium text-gray-900">{order.id.slice(0, 8)}…</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
          <p className="text-sm text-gray-700">{order.items.map((i) => i.productName).join(', ')}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-gray-900">{formatCurrency(order.totalAmount)}</p>
          <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
        </div>
      </div>
    </Link>
  )
}
