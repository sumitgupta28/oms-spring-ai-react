import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { Header } from './components/layout/Header'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { CatalogPage } from './pages/CatalogPage'
import { ProductDetailPage } from './pages/ProductDetailPage'
import { CartPage } from './pages/CartPage'
import { OrdersPage } from './pages/OrdersPage'
import { OrderDetailPage } from './pages/OrderDetailPage'
import { AdminPage } from './pages/AdminPage'
import { VendorPage } from './pages/VendorPage'
import { LoginPage } from './pages/LoginPage'
import { AuthProvider } from './context/AuthContext'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
})

function AppShell() {
  const location = useLocation()
  const isLoginPage = location.pathname === '/login'

  return (
    <div className="min-h-screen bg-gray-50">
      {!isLoginPage && <Header />}
      <main>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute blockedRole="vendor">
                <CatalogPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/products/:id"
            element={
              <ProtectedRoute blockedRole="vendor">
                <ProductDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cart"
            element={
              <ProtectedRoute blockedRole="vendor">
                <CartPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute blockedRole="vendor">
                <OrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/:id"
            element={
              <ProtectedRoute blockedRole="vendor">
                <OrderDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor"
            element={
              <ProtectedRoute requiredRole="vendor">
                <VendorPage />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppShell />
          <Toaster position="top-right" />
        </BrowserRouter>
      </QueryClientProvider>
    </AuthProvider>
  )
}
