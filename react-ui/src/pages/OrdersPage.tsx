import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ClipboardList } from 'lucide-react'
import { orderApi } from '../api/orderApi'
import { OrderCard } from '../components/order/OrderCard'
import { Spinner } from '../components/ui/Spinner'
import { Button } from '../components/ui/Button'

export function OrdersPage() {
  const [page, setPage] = useState(0)

  const { data, isLoading, error } = useQuery({
    queryKey: ['my-orders', page],
    queryFn: () => orderApi.myOrders({ page, size: 10 }),
  })

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
        <p className="text-gray-500 mt-1">Track and manage your orders</p>
      </div>

      {isLoading ? (
        <Spinner className="py-20" />
      ) : error ? (
        <p className="text-center text-red-500 py-20">Failed to load orders.</p>
      ) : !data?.content.length ? (
        <div className="text-center py-20">
          <ClipboardList className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No orders yet.</p>
          <Button variant="primary" className="mt-4" onClick={() => window.location.href = '/'}>
            Start Shopping
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {data.content.map((order: import('../types/order').Order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
          {data.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <Button variant="secondary" size="sm" disabled={data.first} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span className="text-sm text-gray-600">Page {data.number + 1} of {data.totalPages}</span>
              <Button variant="secondary" size="sm" disabled={data.last} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
