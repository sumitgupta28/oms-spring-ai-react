import React, { useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Package, Upload, CheckCircle, XCircle, FileSpreadsheet } from 'lucide-react'
import { productApi } from '../api/productApi'
import { ProductCard } from '../components/product/ProductCard'
import { Spinner } from '../components/ui/Spinner'
import { Button } from '../components/ui/Button'
import { useForm } from 'react-hook-form'
import { CreateProductRequest, ImportResult } from '../types/product'
import toast from 'react-hot-toast'

export function VendorPage() {
  const [page, setPage] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['vendor-products', page],
    queryFn: () => productApi.myProducts({ page, size: 12 }),
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateProductRequest>()

  const createProduct = useMutation({
    mutationFn: productApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] })
      toast.success('Product created!')
      setShowForm(false)
      reset()
    },
    onError: () => toast.error('Failed to create product.'),
  })

  const importProducts = useMutation({
    mutationFn: (file: File) => productApi.importProducts(file),
    onSuccess: (result) => {
      setImportResult(result)
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] })
      if (result.succeeded > 0) {
        toast.success(`${result.succeeded} product(s) imported successfully!`)
      }
      if (result.failed > 0) {
        toast.error(`${result.failed} row(s) failed. See details below.`)
      }
    },
    onError: () => toast.error('Import failed. Please check the file format.'),
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Products</h1>
          <p className="text-gray-500 mt-1">Manage your product listings</p>
        </div>
        <Button onClick={() => setShowForm((s) => !s)}>
          <Plus className="h-4 w-4" />
          {showForm ? 'Cancel' : 'Add Product'}
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">New Product</h2>
          <form onSubmit={handleSubmit((d) => createProduct.mutate(d))} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Name', key: 'name', required: true },
              { label: 'SKU', key: 'sku', required: true },
              { label: 'Category', key: 'category' },
              { label: 'Image URL', key: 'imageUrl' },
            ].map(({ label, key, required }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input
                  {...register(key as keyof CreateProductRequest, { required: required ? `${label} is required` : false })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                {errors[key as keyof CreateProductRequest] && (
                  <p className="mt-1 text-xs text-red-500">{String(errors[key as keyof CreateProductRequest]?.message)}</p>
                )}
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
              <input type="number" step="0.01" {...register('price', { required: true, min: 0.01, valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Initial Quantity</label>
              <input type="number" {...register('initialQuantity', { required: true, min: 0, valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea {...register('description')} rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <Button type="submit" loading={createProduct.isPending}>Create Product</Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </div>
      )}

      {/* Bulk Import */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <FileSpreadsheet className="h-5 w-5 text-brand-600" />
          <h2 className="text-lg font-semibold text-gray-900">Bulk Import via XLS</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Upload an <strong>.xlsx</strong> file with columns: <code className="bg-gray-100 px-1 rounded text-xs">name · sku · price · description · category · imageUrl · initialQuantity</code>
        </p>

        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              setImportResult(null)
              setImportFile(e.target.files?.[0] ?? null)
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Upload className="h-4 w-4" />
            {importFile ? importFile.name : 'Choose file…'}
          </button>
          <Button
            onClick={() => importFile && importProducts.mutate(importFile)}
            disabled={!importFile || importProducts.isPending}
            loading={importProducts.isPending}
          >
            Import
          </Button>
          {importFile && (
            <button
              type="button"
              onClick={() => { setImportFile(null); setImportResult(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Clear
            </button>
          )}
        </div>

        {importResult && (
          <div className="mt-5">
            <div className="flex gap-4 mb-3">
              <span className="flex items-center gap-1 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-1">
                <CheckCircle className="h-4 w-4" /> {importResult.succeeded} imported
              </span>
              {importResult.failed > 0 && (
                <span className="flex items-center gap-1 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-1">
                  <XCircle className="h-4 w-4" /> {importResult.failed} failed
                </span>
              )}
            </div>
            {importResult.errors.length > 0 && (
              <div className="overflow-auto max-h-48 rounded-lg border border-gray-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium w-24">Row</th>
                      <th className="px-4 py-2 text-left font-medium">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {importResult.errors.map((e) => (
                      <tr key={e.rowNumber}>
                        <td className="px-4 py-2 text-gray-500">{e.rowNumber}</td>
                        <td className="px-4 py-2 text-red-600">{e.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {isLoading ? (
        <Spinner className="py-20" />
      ) : !data?.content.length ? (
        <div className="text-center py-20">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No products yet. Create your first listing!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {data.content.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  )
}
