import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { userApi, AddressResponse, SaveAddressRequest, SavePaymentMethodRequest } from '../api/userApi'
import { AddressCard } from '../components/profile/AddressCard'
import { AddressForm } from '../components/profile/AddressForm'
import { PaymentMethodCard } from '../components/profile/PaymentMethodCard'
import { PaymentMethodForm } from '../components/profile/PaymentMethodForm'
import { Spinner } from '../components/ui/Spinner'
import toast from 'react-hot-toast'

type Tab = 'addresses' | 'payment'

export function ProfilePage() {
  const [tab, setTab] = useState<Tab>('addresses')
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [editAddress, setEditAddress] = useState<AddressResponse | null>(null)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const qc = useQueryClient()

  const { data: addresses = [], isLoading: loadingAddresses } = useQuery({
    queryKey: ['my-addresses'],
    queryFn: userApi.getMyAddresses,
  })

  const { data: paymentMethods = [], isLoading: loadingPayments } = useQuery({
    queryKey: ['my-payment-methods'],
    queryFn: userApi.getMyPaymentMethods,
  })

  const addAddress = useMutation({
    mutationFn: (data: SaveAddressRequest) => userApi.addAddress(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-addresses'] }); setShowAddressForm(false); toast.success('Address saved') },
    onError: () => toast.error('Failed to save address'),
  })

  const updateAddress = useMutation({
    mutationFn: ({ id, data }: { id: string; data: SaveAddressRequest }) => userApi.updateAddress(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-addresses'] }); setEditAddress(null); toast.success('Address updated') },
    onError: () => toast.error('Failed to update address'),
  })

  const deleteAddress = useMutation({
    mutationFn: userApi.deleteAddress,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-addresses'] }); toast.success('Address removed') },
    onError: () => toast.error('Failed to remove address'),
  })

  const setDefaultAddress = useMutation({
    mutationFn: userApi.setDefaultAddress,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-addresses'] }),
  })

  const addPayment = useMutation({
    mutationFn: (data: SavePaymentMethodRequest) => userApi.addPaymentMethod(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-payment-methods'] }); setShowPaymentForm(false); toast.success('Payment method added') },
    onError: () => toast.error('Failed to add payment method'),
  })

  const deletePayment = useMutation({
    mutationFn: userApi.deletePaymentMethod,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-payment-methods'] }); toast.success('Payment method removed') },
    onError: () => toast.error('Failed to remove payment method'),
  })

  const setDefaultPayment = useMutation({
    mutationFn: userApi.setDefaultPaymentMethod,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-payment-methods'] }),
  })

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-6 w-fit">
        {(['addresses', 'payment'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'addresses' ? 'Addresses' : 'Payment Methods'}
          </button>
        ))}
      </div>

      {/* Addresses tab */}
      {tab === 'addresses' && (
        <div>
          {loadingAddresses ? (
            <Spinner className="py-12" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {addresses.map((addr) => (
                <AddressCard
                  key={addr.id}
                  address={addr}
                  onEdit={setEditAddress}
                  onDelete={(id) => deleteAddress.mutate(id)}
                  onSetDefault={(id) => setDefaultAddress.mutate(id)}
                />
              ))}
              <button
                onClick={() => setShowAddressForm(true)}
                className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl p-6 text-gray-400 hover:border-brand-400 hover:text-brand-500 transition-colors cursor-pointer min-h-[160px]"
              >
                <Plus className="h-6 w-6" />
                <span className="text-sm font-medium">Add Address</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Payment Methods tab */}
      {tab === 'payment' && (
        <div>
          {loadingPayments ? (
            <Spinner className="py-12" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {paymentMethods.map((method) => (
                <PaymentMethodCard
                  key={method.id}
                  method={method}
                  onDelete={(id) => deletePayment.mutate(id)}
                  onSetDefault={(id) => setDefaultPayment.mutate(id)}
                />
              ))}
              <button
                onClick={() => setShowPaymentForm(true)}
                className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl p-6 text-gray-400 hover:border-brand-400 hover:text-brand-500 transition-colors cursor-pointer min-h-[140px]"
              >
                <Plus className="h-6 w-6" />
                <span className="text-sm font-medium">Add Card</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showAddressForm && (
        <AddressForm
          onSave={(data) => addAddress.mutate(data)}
          onCancel={() => setShowAddressForm(false)}
          loading={addAddress.isPending}
        />
      )}
      {editAddress && (
        <AddressForm
          initial={editAddress}
          onSave={(data) => updateAddress.mutate({ id: editAddress.id, data })}
          onCancel={() => setEditAddress(null)}
          loading={updateAddress.isPending}
        />
      )}
      {showPaymentForm && (
        <PaymentMethodForm
          onSave={(data) => addPayment.mutate(data)}
          onCancel={() => setShowPaymentForm(false)}
          loading={addPayment.isPending}
        />
      )}
    </div>
  )
}
