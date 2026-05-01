import React from 'react'
import { OrderStatus } from '../../types/order'

const statusStyles: Record<OrderStatus, string> = {
  PENDING:        'bg-yellow-100 text-yellow-800',
  CONFIRMED:      'bg-green-100 text-green-800',
  CANCELLED:      'bg-red-100 text-red-800',
  PAYMENT_FAILED: 'bg-red-100 text-red-800',
}

interface BadgeProps {
  status: OrderStatus
}

export function OrderStatusBadge({ status }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status]}`}>
      {status.replace('_', ' ')}
    </span>
  )
}

interface ChipProps {
  label: string
  variant?: 'default' | 'success' | 'warning' | 'danger'
}

const chipStyles = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  danger:  'bg-red-100 text-red-800',
}

export function Chip({ label, variant = 'default' }: ChipProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${chipStyles[variant]}`}>
      {label}
    </span>
  )
}
