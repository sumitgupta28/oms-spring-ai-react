import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { useCartStore } from '../store/cartStore'
import { orderApi } from '../api/orderApi'
import { formatCurrency } from '../utils/formatCurrency'
import { Button } from '../components/ui/Button'
import toast from 'react-hot-toast'
import { useForm } from 'react-hook-form'

interface CheckoutForm {
  shippingAddress: string
}

export function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, total } = useCartStore()
  const navigate = useNavigate()
  const [showCheckout, setShowCheckout] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<CheckoutForm>()

  const placeOrder = useMutation({
    mutationFn: (address: string) =>
      orderApi.create({
        items: items.map((i) => ({
          productId: i.productId,
          productName: i.productName,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
        shippingAddress: address,
      }),
    onSuccess: (order) => {
      clearCart()
      toast.success('Order placed successfully!')
      navigate(`/orders/${order.id}`)
    },
    onError: () => toast.error('Failed to place order. Please try again.'),
  })

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">Your cart is empty</h2>
        <p className="mt-2 text-gray-500">Add some products to get started.</p>
        <Button variant="primary" className="mt-6" onClick={() => navigate('/')}>
          Browse Catalog
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Shopping Cart</h1>

      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.productId} className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl p-4">
            <div className="h-16 w-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">📦</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{item.productName}</p>
              <p className="text-sm text-gray-500">{formatCurrency(item.unitPrice)} each</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="p-1 hover:bg-gray-100 rounded">
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
              <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="p-1 hover:bg-gray-100 rounded">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <p className="font-semibold text-gray-900 w-20 text-right">
              {formatCurrency(item.unitPrice * item.quantity)}
            </p>
            <button onClick={() => removeItem(item.productId)} className="p-1 text-red-400 hover:text-red-600">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-6 bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex justify-between text-lg font-bold text-gray-900 mb-4">
          <span>Total</span>
          <span>{formatCurrency(total())}</span>
        </div>

        {!showCheckout ? (
          <Button variant="primary" size="lg" className="w-full" onClick={() => setShowCheckout(true)}>
            Proceed to Checkout
          </Button>
        ) : (
          <form onSubmit={handleSubmit((data) => placeOrder.mutate(data.shippingAddress))}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Address</label>
              <textarea
                {...register('shippingAddress', { required: 'Address is required' })}
                rows={3}
                placeholder="Enter your full shipping address…"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              {errors.shippingAddress && (
                <p className="mt-1 text-xs text-red-500">{errors.shippingAddress.message}</p>
              )}
            </div>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              loading={placeOrder.isPending}
            >
              Place Order — {formatCurrency(total())}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
