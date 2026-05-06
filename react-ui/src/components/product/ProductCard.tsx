import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart } from 'lucide-react'
import { Product } from '../../types/product'
import { useCartStore } from '../../store/cartStore'
import { useAuth } from '../../hooks/useAuth'
import { formatCurrency } from '../../utils/formatCurrency'
import { Button } from '../ui/Button'
import toast from 'react-hot-toast'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem)
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!isAuthenticated) {
      toast.error('Please sign in to add items to your cart')
      navigate('/login')
      return
    }
    if (product.availableQuantity <= 0) return
    addItem({
      productId: product.id,
      productName: product.name,
      quantity: 1,
      unitPrice: product.price,
      imageUrl: product.imageUrl,
    })
    toast.success(`${product.name} added to cart`)
  }

  return (
    <Link to={`/products/${product.id}`} className="group block bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Image */}
      <div className="aspect-square bg-gray-100 overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {product.category && (
          <span className="text-xs text-brand-600 font-medium uppercase tracking-wide">{product.category}</span>
        )}
        <h3 className="mt-1 text-sm font-semibold text-gray-900 line-clamp-2">{product.name}</h3>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900">{formatCurrency(product.price)}</span>
          <span className={`text-xs ${product.availableQuantity > 0 ? 'text-green-600' : 'text-red-500'}`}>
            {product.availableQuantity > 0 ? `${product.availableQuantity} in stock` : 'Out of stock'}
          </span>
        </div>
        <Button
          variant="primary"
          size="sm"
          className="mt-3 w-full"
          onClick={handleAddToCart}
          disabled={product.availableQuantity <= 0}
        >
          <ShoppingCart className="h-4 w-4" />
          {isAuthenticated ? 'Add to cart' : 'Sign in to buy'}
        </Button>
      </div>
    </Link>
  )
}
