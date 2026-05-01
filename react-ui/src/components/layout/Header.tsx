import React from 'react'
import { Link, NavLink } from 'react-router-dom'
import { ShoppingCart, Package, ClipboardList, User, LogOut, Settings } from 'lucide-react'
import { useCartStore } from '../../store/cartStore'
import { useAuth } from '../../hooks/useAuth'

export function Header() {
  const { user, isAdmin, isVendor, logout } = useAuth()
  const itemCount = useCartStore((s) => s.itemCount())

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-brand-600">
            <Package className="h-6 w-6" />
            OMS Store
          </Link>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${isActive ? 'text-brand-600' : 'text-gray-600 hover:text-gray-900'}`
              }
            >
              Catalog
            </NavLink>
            <NavLink
              to="/orders"
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${isActive ? 'text-brand-600' : 'text-gray-600 hover:text-gray-900'}`
              }
            >
              My Orders
            </NavLink>
            {isAdmin && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors ${isActive ? 'text-brand-600' : 'text-gray-600 hover:text-gray-900'}`
                }
              >
                Admin
              </NavLink>
            )}
            {isVendor && (
              <NavLink
                to="/vendor"
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors ${isActive ? 'text-brand-600' : 'text-gray-600 hover:text-gray-900'}`
                }
              >
                My Products
              </NavLink>
            )}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <Link to="/cart" className="relative p-2 text-gray-600 hover:text-brand-600 transition-colors">
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </Link>

            <div className="relative group">
              <button className="flex items-center gap-2 p-2 text-gray-600 hover:text-brand-600 transition-colors">
                <User className="h-5 w-5" />
                <span className="hidden sm:block text-sm font-medium">{user?.username}</span>
              </button>
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 hidden group-hover:block">
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
