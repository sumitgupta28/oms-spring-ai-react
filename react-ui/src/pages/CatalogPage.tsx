import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, ShoppingBag, ArrowRight } from 'lucide-react'
import { publicProductApi } from '../api/productApi'
import { ProductCard } from '../components/product/ProductCard'
import { Spinner } from '../components/ui/Spinner'
import { Button } from '../components/ui/Button'
import { useAuth } from '../hooks/useAuth'

const CATEGORIES = ['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports', 'Toys']

export function CatalogPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(0)

  const { data, isLoading, error } = useQuery({
    queryKey: ['products', { search, category, page }],
    queryFn: () => publicProductApi.list({ search: search || undefined, category: category || undefined, page, size: 12 }),
  })

  const scrollToProducts = () => {
    document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div>
      {/* Hero — shown to guests only */}
      {!authLoading && !isAuthenticated && (
        <div className="relative bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 text-white overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white" />
            <div className="absolute -bottom-12 -left-12 w-72 h-72 rounded-full bg-white" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur mb-6">
              <ShoppingBag className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
              OMS Store
            </h1>
            <p className="text-lg sm:text-xl text-brand-100 max-w-2xl mx-auto mb-10">
              Discover thousands of products at great prices. Shop electronics, clothing, books and more — all in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={scrollToProducts}
                className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-white text-brand-700 font-semibold rounded-xl hover:bg-brand-50 transition-colors shadow-lg"
              >
                Shop Now
                <ArrowRight className="h-4 w-4" />
              </button>
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/30 backdrop-blur transition-colors"
              >
                Register Free
              </Link>
            </div>
          </div>

          {/* Wave divider */}
          <div className="absolute bottom-0 left-0 right-0 leading-none">
            <svg viewBox="0 0 1440 40" xmlns="http://www.w3.org/2000/svg" className="w-full block">
              <path d="M0 40L1440 40L1440 10C1200 40 960 0 720 10C480 20 240 0 0 10L0 40Z" fill="#f9fafb" />
            </svg>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="products">

        {/* Page title for authenticated users */}
        {!authLoading && isAuthenticated && (
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Product Catalog</h1>
            <p className="mt-1 text-gray-500">Discover our collection of products</p>
          </div>
        )}

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
          <button
            onClick={() => { setCategory(''); setPage(0) }}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              category === ''
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => { setCategory(c); setPage(0) }}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                category === c
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Search + category dropdown */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0) }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(0) }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Product grid */}
        {isLoading ? (
          <Spinner className="py-20" />
        ) : error ? (
          <p className="text-center text-red-500 py-20">Failed to load products.</p>
        ) : !data?.content.length ? (
          <div className="text-center py-20">
            <p className="text-gray-500">No products found.</p>
            {(search || category) && (
              <Button variant="ghost" className="mt-4" onClick={() => { setSearch(''); setCategory('') }}>
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {data.content.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {data.totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <Button variant="secondary" size="sm" disabled={data.first} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {data.number + 1} of {data.totalPages}
                </span>
                <Button variant="secondary" size="sm" disabled={data.last} onClick={() => setPage((p) => p + 1)}>
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
