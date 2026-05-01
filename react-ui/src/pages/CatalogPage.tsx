import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { productApi } from '../api/productApi'
import { ProductCard } from '../components/product/ProductCard'
import { Spinner } from '../components/ui/Spinner'
import { Button } from '../components/ui/Button'

const CATEGORIES = ['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports', 'Toys']

export function CatalogPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(0)

  const { data, isLoading, error } = useQuery({
    queryKey: ['products', { search, category, page }],
    queryFn: () => productApi.list({ search: search || undefined, category: category || undefined, page, size: 12 }),
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Product Catalog</h1>
        <p className="mt-1 text-gray-500">Discover our collection of products</p>
      </div>

      {/* Filters */}
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

      {/* Grid */}
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

          {/* Pagination */}
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
  )
}
