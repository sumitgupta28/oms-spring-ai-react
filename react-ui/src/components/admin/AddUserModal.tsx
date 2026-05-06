import React from 'react'
import { useForm } from 'react-hook-form'
import { X, Mail } from 'lucide-react'
import { AdminCreateUserRequest } from '../../api/userApi'

interface Props {
  onSave: (data: AdminCreateUserRequest) => void
  onCancel: () => void
  loading?: boolean
}

export function AddUserModal({ onSave, onCancel, loading }: Props) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<AdminCreateUserRequest>({
    defaultValues: { role: 'ROLE_CUSTOMER' },
  })
  const role = watch('role')

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-white">Add User</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-200"><X className="h-5 w-5" /></button>
        </div>

        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">First Name</label>
              <input
                {...register('firstName', { required: 'Required' })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="John"
              />
              {errors.firstName && <p className="mt-1 text-xs text-red-400">{errors.firstName.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Last Name</label>
              <input
                {...register('lastName', { required: 'Required' })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Doe"
              />
              {errors.lastName && <p className="mt-1 text-xs text-red-400">{errors.lastName.message}</p>}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Email</label>
            <input
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' },
              })}
              type="email"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="john@example.com"
            />
            {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Role</label>
            <select
              {...register('role', { required: true })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="ROLE_CUSTOMER">Customer</option>
              <option value="ROLE_VENDOR">Vendor</option>
              <option value="ROLE_SUPPORT">Support</option>
            </select>
          </div>

          {role === 'ROLE_VENDOR' && (
            <div className="flex items-start gap-2 bg-amber-900/30 border border-amber-700 rounded-lg p-3">
              <Mail className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-300">
                A password setup email will be sent to the vendor via Mailhog (localhost:8025 in dev).
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onCancel} className="flex-1 py-2 border border-gray-600 rounded-lg text-sm text-gray-300 hover:bg-gray-700 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors">
              {loading ? 'Creating…' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
