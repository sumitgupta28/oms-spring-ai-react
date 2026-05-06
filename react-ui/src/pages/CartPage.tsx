import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Minus, Plus, Trash2, ShoppingBag, MapPin, CreditCard } from 'lucide-react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useCartStore } from '../store/cartStore'
import { orderApi } from '../api/orderApi'
import { userApi, AddressResponse, PaymentMethodResponse } from '../api/userApi'
import { formatCurrency } from '../utils/formatCurrency'
import { Button } from '../components/ui/Button'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import { useForm } from 'react-hook-form'

interface CheckoutForm {
  shippingAddress: string
  saveAddress: boolean
  addressLabel: string
  addressFullName: string
}

export function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, total } = useCartStore()
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [showCheckout, setShowCheckout] = useState(false)
  const [selectedAddressId, setSelectedAddressId] = useState<string | 'new'>('new')
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | 'new'>('new')

  const { register, handleSubmit, formState: { errors } } = useForm<CheckoutForm>({
    defaultValues: { saveAddress: false, addressLabel: 'Home' },
  })

  const { data: savedAddresses = [] } = useQuery({
    queryKey: ['my-addresses'],
    queryFn: userApi.getMyAddresses,
    enabled: isAuthenticated && showCheckout,
  })

  const { data: savedPayments = [] } = useQuery({
    queryKey: ['my-payment-methods'],
    queryFn: userApi.getMyPaymentMethods,
    enabled: isAuthenticated && showCheckout,
  })

  const defaultAddress = savedAddresses.find((a) => a.isDefault) ?? savedAddresses[0]
  const defaultPayment = savedPayments.find((p) => p.isDefault) ?? savedPayments[0]

  const resolvedAddressId = selectedAddressId === 'new' ? 'new' : selectedAddressId
  const selectedAddress = savedAddresses.find((a) => a.id === resolvedAddressId)

  const formatAddress = (addr: AddressResponse): string =>
    `${addr.fullName}, ${addr.street}, ${addr.city}, ${addr.state} ${addr.zipCode}, ${addr.country}`

  const placeOrder = useMutation({
    mutationFn: async (data: CheckoutForm) => {
      let shippingAddress: string
      if (selectedAddress) {
        shippingAddress = formatAddress(selectedAddress)
      } else {
        shippingAddress = data.shippingAddress
        if (data.saveAddress && isAuthenticated) {
          const parts = data.shippingAddress.split(',').map((s) => s.trim())
          await userApi.addAddress({
            label: data.addressLabel || 'Home',
            fullName: parts[0] || 'My Address',
            street: parts[1] || data.shippingAddress,
            city: parts[2] || '',
            state: parts[3] || '',
            zipCode: parts[4] || '',
            country: 'US',
            isDefault: savedAddresses.length === 0,
          }).catch(() => {/* save silently fails — don't block order */})
        }
      }
      return orderApi.create({
        items: items.map((i) => ({
          productId: i.productId,
          productName: i.productName,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
        shippingAddress,
      })
    },
    onSuccess: (order) => {
      clearCart()
      toast.success('Order placed successfully!')
      navigate(`/orders/${order.id}`)
    },
    onError: () => toast.error('Failed to place order. Please try again.'),
  })

  // Set defaults when checkout opens and saved data loads
  React.useEffect(() => {
    if (defaultAddress && selectedAddressId === 'new' && savedAddresses.length > 0) {
      setSelectedAddressId(defaultAddress.id)
    }
  }, [defaultAddress, savedAddresses.length])

  React.useEffect(() => {
    if (defaultPayment && selectedPaymentId === 'new' && savedPayments.length > 0) {
      setSelectedPaymentId(defaultPayment.id)
    }
  }, [defaultPayment, savedPayments.length])

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
          <form onSubmit={handleSubmit((data) => placeOrder.mutate(data))} className="space-y-4">

            {/* Shipping Address */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <label className="text-sm font-medium text-gray-700">Shipping Address</label>
              </div>

              {savedAddresses.length > 0 ? (
                <div className="space-y-2">
                  {savedAddresses.map((addr) => (
                    <label key={addr.id} className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${selectedAddressId === addr.id ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input
                        type="radio"
                        name="addressChoice"
                        value={addr.id}
                        checked={selectedAddressId === addr.id}
                        onChange={() => setSelectedAddressId(addr.id)}
                        className="mt-0.5"
                      />
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">{addr.label} {addr.isDefault && <span className="text-xs text-brand-600">(default)</span>}</p>
                        <p className="text-gray-600">{addr.fullName} · {addr.street}, {addr.city}, {addr.state} {addr.zipCode}</p>
                      </div>
                    </label>
                  ))}
                  <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${selectedAddressId === 'new' ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input
                      type="radio"
                      name="addressChoice"
                      value="new"
                      checked={selectedAddressId === 'new'}
                      onChange={() => setSelectedAddressId('new')}
                    />
                    <span className="text-sm font-medium text-gray-700">Enter a new address</span>
                  </label>
                </div>
              ) : null}

              {(savedAddresses.length === 0 || selectedAddressId === 'new') && (
                <div className="mt-2 space-y-2">
                  <textarea
                    {...register('shippingAddress', { required: selectedAddressId === 'new' ? 'Address is required' : false })}
                    rows={3}
                    placeholder="Enter your full shipping address…"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  {errors.shippingAddress && <p className="text-xs text-red-500">{errors.shippingAddress.message}</p>}
                  {isAuthenticated && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" {...register('saveAddress')} className="rounded text-brand-600" />
                      <span className="text-sm text-gray-600">Save this address for future orders</span>
                    </label>
                  )}
                </div>
              )}
            </div>

            {/* Payment Method */}
            {savedPayments.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-4 w-4 text-gray-500" />
                  <label className="text-sm font-medium text-gray-700">Payment Method</label>
                </div>
                <div className="space-y-2">
                  {savedPayments.map((pm) => (
                    <label key={pm.id} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${selectedPaymentId === pm.id ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input
                        type="radio"
                        name="paymentChoice"
                        value={pm.id}
                        checked={selectedPaymentId === pm.id}
                        onChange={() => setSelectedPaymentId(pm.id)}
                      />
                      <span className="text-sm text-gray-700">
                        {pm.cardType} ···· {pm.lastFour} &nbsp;·&nbsp; Exp {String(pm.expiryMonth).padStart(2,'0')}/{pm.expiryYear}
                        {pm.isDefault && <span className="ml-1 text-xs text-brand-600">(default)</span>}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

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
