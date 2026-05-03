export interface Product {
  id: string
  name: string
  description: string
  price: number
  category: string
  sku: string
  imageUrl: string
  vendorId: string
  active: boolean
  availableQuantity: number
  createdAt: string
  updatedAt: string
}

export interface InventoryInfo {
  productId: string
  quantity: number
  reservedQuantity: number
  availableQuantity: number
}

export interface CreateProductRequest {
  name: string
  description?: string
  price: number
  category?: string
  sku: string
  imageUrl?: string
  initialQuantity: number
}

export interface ImportResult {
  totalRows: number
  succeeded: number
  failed: number
  errors: Array<{ rowNumber: number; reason: string }>
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
}
