import React from 'react'
import { Star, Trash2 } from 'lucide-react'
import { PaymentMethodResponse } from '../../api/userApi'

interface Props {
  method: PaymentMethodResponse
  onDelete: (id: string) => void
  onSetDefault: (id: string) => void
}

const cardColors: Record<string, string> = {
  VISA: 'bg-blue-600',
  MASTERCARD: 'bg-red-600',
  AMEX: 'bg-green-700',
  DISCOVER: 'bg-orange-500',
}

export function PaymentMethodCard({ method, onDelete, onSetDefault }: Props) {
  const bg = cardColors[method.cardType] ?? 'bg-gray-700'

  return (
    <div className={`relative rounded-xl p-4 text-white ${bg} shadow-md`}>
      {method.isDefault && (
        <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-xs font-medium text-white/80">
          <Star className="h-3 w-3 fill-white" /> Default
        </span>
      )}
      <p className="text-xs font-medium tracking-widest opacity-70 mb-2">{method.cardType}</p>
      <p className="font-mono text-lg tracking-widest mb-1">···· ···· ···· {method.lastFour}</p>
      <p className="text-xs opacity-70">
        {method.nickname ? `${method.nickname} · ` : ''}Exp {String(method.expiryMonth).padStart(2, '0')}/{method.expiryYear}
      </p>

      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/20">
        {!method.isDefault && (
          <button
            onClick={() => onSetDefault(method.id)}
            className="text-xs text-white/80 hover:text-white transition-colors"
          >
            Set default
          </button>
        )}
        <button
          onClick={() => onDelete(method.id)}
          className="flex items-center gap-1 text-xs text-white/80 hover:text-white transition-colors ml-auto"
        >
          <Trash2 className="h-3 w-3" /> Remove
        </button>
      </div>
    </div>
  )
}
