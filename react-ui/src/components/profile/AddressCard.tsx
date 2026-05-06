import React from 'react'
import { Home, Briefcase, MapPin, Star, Pencil, Trash2 } from 'lucide-react'
import { AddressResponse } from '../../api/userApi'

interface Props {
  address: AddressResponse
  onEdit: (address: AddressResponse) => void
  onDelete: (id: string) => void
  onSetDefault: (id: string) => void
}

const labelIcon = (label: string) => {
  if (label.toLowerCase() === 'home') return <Home className="h-4 w-4" />
  if (label.toLowerCase() === 'work') return <Briefcase className="h-4 w-4" />
  return <MapPin className="h-4 w-4" />
}

export function AddressCard({ address, onEdit, onDelete, onSetDefault }: Props) {
  return (
    <div className={`relative bg-white rounded-xl border-2 p-4 ${address.isDefault ? 'border-brand-500' : 'border-gray-200'}`}>
      {address.isDefault && (
        <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-xs font-medium text-brand-600">
          <Star className="h-3 w-3 fill-brand-600" /> Default
        </span>
      )}
      <div className="flex items-center gap-2 text-gray-700 font-medium mb-2">
        {labelIcon(address.label)}
        <span>{address.label}</span>
      </div>
      <p className="text-sm text-gray-900">{address.fullName}</p>
      <p className="text-sm text-gray-600">{address.street}</p>
      <p className="text-sm text-gray-600">
        {address.city}, {address.state} {address.zipCode}
      </p>
      <p className="text-sm text-gray-600">{address.country}</p>
      {address.phone && <p className="text-sm text-gray-500 mt-1">{address.phone}</p>}

      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
        <button
          onClick={() => onEdit(address)}
          className="flex items-center gap-1 text-xs text-gray-600 hover:text-brand-600 transition-colors"
        >
          <Pencil className="h-3 w-3" /> Edit
        </button>
        {!address.isDefault && (
          <>
            <span className="text-gray-300">·</span>
            <button
              onClick={() => onSetDefault(address.id)}
              className="text-xs text-gray-600 hover:text-brand-600 transition-colors"
            >
              Set default
            </button>
          </>
        )}
        <span className="text-gray-300">·</span>
        <button
          onClick={() => onDelete(address.id)}
          className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors"
        >
          <Trash2 className="h-3 w-3" /> Delete
        </button>
      </div>
    </div>
  )
}
