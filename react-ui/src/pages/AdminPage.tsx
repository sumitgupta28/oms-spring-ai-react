import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Package, ClipboardList, Users } from 'lucide-react'
import { productApi } from '../api/productApi'
import { orderApi } from '../api/orderApi'
import { Order } from '../types/order'
import { ProductCard } from '../components/product/ProductCard'
import { OrderCard } from '../components/order/OrderCard'
import { Spinner } from '../components/ui/Spinner'
import { Button } from '../components/ui/Button'

type Tab = 'products' | 'orders'

export function AdminPage() {
  const [tab, setTab] = useState<Tab>('products')
  const [productPage, setProductPage] = useState(0)
  const [orderPage, setOrderPage] = useState(0)

  const products = useQuery({
    queryKey: ['admin-products', productPage],
    queryFn: () => productApi.list({ page: productPage, size: 12 }),
    enabled: tab === 'products',
  })

  const orders = useQuery({
    queryKey: ['admin-orders', orderPage],
    queryFn: () => orderApi.allOrders({ page: orderPage, size: 10 }),
    enabled: tab === 'orders',
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Manage products and orders</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit mb-8">
        {(['products', 'orders'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'products' ? <Package className="h-4 w-4" /> : <ClipboardList className="h-4 w-4" />}
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'products' && (
        <>
          {products.isLoading ? <Spinner className="py-20" /> : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.data?.content.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
              {(products.data?.totalPages ?? 0) > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  <Button variant="secondary" size="sm" disabled={products.data?.first} onClick={() => setProductPage((p) => p - 1)}>Previous</Button>
                  <Button variant="secondary" size="sm" disabled={products.data?.last} onClick={() => setProductPage((p) => p + 1)}>Next</Button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {tab === 'orders' && (
        <>
          {orders.isLoading ? <Spinner className="py-20" /> : (
            <>
              <div className="space-y-4">
                {orders.data?.content.map((o: Order) => <OrderCard key={o.id} order={o} />)}
              </div>
              {(orders.data?.totalPages ?? 0) > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  <Button variant="secondary" size="sm" disabled={orders.data?.first} onClick={() => setOrderPage((p) => p - 1)}>Previous</Button>
                  <Button variant="secondary" size="sm" disabled={orders.data?.last} onClick={() => setOrderPage((p) => p + 1)}>Next</Button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
