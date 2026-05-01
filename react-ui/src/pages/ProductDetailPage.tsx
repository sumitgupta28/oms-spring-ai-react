import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, ShoppingCart, Minus, Plus } from 'lucide-react'
import { productApi } from '../api/productApi'
import { useCartStore } from '../store/cartStore'
import { formatCurrency } from '../utils/formatCurrency'
import { Spinner } from '../components/ui/Spinner'
import { Button } from '../components/ui/Button'
import toast from 'react-hot-toast'

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const addItem = useCartStore((s) => s.addItem)
  const [quantity, setQuantity] = useState(1)

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productApi.get(id!),
    enabled: !!id,
  })

  if (isLoading) return <Spinner className="py-40" />
  if (!product) return <p className="text-center py-20 text-gray-500">Product not found.</p>

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      productName: product.name,
      quantity,
      unitPrice: product.price,
      imageUrl: product.imageUrl,
    })
    toast.success(`${product.name} × ${quantity} added to cart`)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-6">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Image */}
        <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <svg className="h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col">
          {product.category && (
            <span className="text-sm text-brand-600 font-medium">{product.category}</span>
          )}
          <h1 className="mt-1 text-2xl font-bold text-gray-900">{product.name}</h1>
          <p className="mt-1 text-sm text-gray-500">SKU: {product.sku}</p>
          <p className="mt-4 text-3xl font-bold text-gray-900">{formatCurrency(product.price)}</p>
          <p className={`mt-1 text-sm font-medium ${product.availableQuantity > 0 ? 'text-green-600' : 'text-red-500'}`}>
            {product.availableQuantity > 0 ? `${product.availableQuantity} units available` : 'Out of stock'}
          </p>

          {product.description && (
            <p className="mt-4 text-gray-600 leading-relaxed">{product.description}</p>
          )}

          {/* Quantity selector */}
          {product.availableQuantity > 0 && (
            <div className="mt-6 flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">Quantity:</span>
              <div className="flex items-center gap-2 border border-gray-300 rounded-lg p-1">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center text-sm font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(product.availableQuantity, q + 1))}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          <Button
            variant="primary"
            size="lg"
            className="mt-6"
            onClick={handleAddToCart}
            disabled={product.availableQuantity <= 0}
          >
            <ShoppingCart className="h-5 w-5" />
            Add to Cart — {formatCurrency(product.price * quantity)}
          </Button>
        </div>
      </div>
    </div>
  )
}
