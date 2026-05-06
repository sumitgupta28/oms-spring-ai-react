import React from 'react'
import { useForm } from 'react-hook-form'
import { X } from 'lucide-react'
import { SavePaymentMethodRequest } from '../../api/userApi'

interface Props {
  onSave: (data: SavePaymentMethodRequest) => void
  onCancel: () => void
  loading?: boolean
}

export function PaymentMethodForm({ onSave, onCancel, loading }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<SavePaymentMethodRequest>({
    defaultValues: { cardType: 'VISA', isDefault: false },
  })

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-gray-900">Add Payment Method</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>

        <form onSubmit={handleSubmit(onSave)} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Card Type</label>
            <select {...register('cardType', { required: true })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
              <option value="VISA">Visa</option>
              <option value="MASTERCARD">Mastercard</option>
              <option value="AMEX">American Express</option>
              <option value="DISCOVER">Discover</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Last 4 Digits</label>
            <input
              {...register('lastFour', {
                required: 'Required',
                pattern: { value: /^\d{4}$/, message: 'Must be exactly 4 digits' },
              })}
              maxLength={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
              placeholder="4242"
            />
            {errors.lastFour && <p className="mt-1 text-xs text-red-500">{errors.lastFour.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Expiry Month</label>
              <input
                {...register('expiryMonth', { required: 'Required', min: 1, max: 12, valueAsNumber: true })}
                type="number" min={1} max={12}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="12"
              />
              {errors.expiryMonth && <p className="mt-1 text-xs text-red-500">Required (1–12)</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Expiry Year</label>
              <input
                {...register('expiryYear', { required: 'Required', min: 2024, max: 2040, valueAsNumber: true })}
                type="number" min={2024} max={2040}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="2027"
              />
              {errors.expiryYear && <p className="mt-1 text-xs text-red-500">Required (2024–2040)</p>}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Nickname (optional)</label>
            <input {...register('nickname')} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="My Work Card" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" {...register('isDefault')} className="rounded text-brand-600" />
            <span className="text-sm text-gray-700">Set as default payment method</span>
          </label>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onCancel} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors">
              {loading ? 'Saving…' : 'Add Card'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
