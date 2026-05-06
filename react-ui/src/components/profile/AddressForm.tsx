import React from 'react'
import { useForm } from 'react-hook-form'
import { X } from 'lucide-react'
import { SaveAddressRequest, AddressResponse } from '../../api/userApi'

interface Props {
  initial?: AddressResponse
  onSave: (data: SaveAddressRequest) => void
  onCancel: () => void
  loading?: boolean
}

export function AddressForm({ initial, onSave, onCancel, loading }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<SaveAddressRequest>({
    defaultValues: initial ? {
      label: initial.label,
      fullName: initial.fullName,
      street: initial.street,
      city: initial.city,
      state: initial.state,
      zipCode: initial.zipCode,
      country: initial.country,
      phone: initial.phone ?? '',
      isDefault: initial.isDefault,
    } : { label: 'Home', country: 'US', isDefault: false },
  })

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-gray-900">{initial ? 'Edit Address' : 'Add Address'}</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>

        <form onSubmit={handleSubmit(onSave)} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Label</label>
            <select {...register('label', { required: true })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
              <option>Home</option>
              <option>Work</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Full Name</label>
            <input {...register('fullName', { required: 'Required' })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="John Doe" />
            {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Street Address</label>
            <input {...register('street', { required: 'Required' })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="123 Main St" />
            {errors.street && <p className="mt-1 text-xs text-red-500">{errors.street.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
              <input {...register('city', { required: 'Required' })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="New York" />
              {errors.city && <p className="mt-1 text-xs text-red-500">{errors.city.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">State</label>
              <input {...register('state', { required: 'Required' })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="NY" />
              {errors.state && <p className="mt-1 text-xs text-red-500">{errors.state.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">ZIP Code</label>
              <input {...register('zipCode', { required: 'Required' })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="10001" />
              {errors.zipCode && <p className="mt-1 text-xs text-red-500">{errors.zipCode.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Country</label>
              <input {...register('country', { required: 'Required' })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              {errors.country && <p className="mt-1 text-xs text-red-500">{errors.country.message}</p>}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Phone (optional)</label>
            <input {...register('phone')} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="+1 555 000 0000" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" {...register('isDefault')} className="rounded text-brand-600" />
            <span className="text-sm text-gray-700">Set as default address</span>
          </label>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onCancel} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors">
              {loading ? 'Saving…' : 'Save Address'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
