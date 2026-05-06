import React from 'react'
import { Link, NavLink } from 'react-router-dom'
import { ShoppingCart, Package, User, LogOut, Users } from 'lucide-react'
import { useCartStore } from '../../store/cartStore'
import { useAuth } from '../../hooks/useAuth'

export function Header() {
  const { user, isAuthenticated, isAdmin, isVendor, logout } = useAuth()
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

          {isAuthenticated ? (
            <>
              {/* Authenticated nav */}
              <nav className="hidden md:flex items-center gap-6">
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    `text-sm font-medium transition-colors ${isActive ? 'text-brand-600' : 'text-gray-600 hover:text-gray-900'}`
                  }
                >
                  Catalog
                </NavLink>
                {!isVendor && (
                  <NavLink
                    to="/orders"
                    className={({ isActive }) =>
                      `text-sm font-medium transition-colors ${isActive ? 'text-brand-600' : 'text-gray-600 hover:text-gray-900'}`
                    }
                  >
                    My Orders
                  </NavLink>
                )}
                {isAdmin && (
                  <>
                    <NavLink
                      to="/admin"
                      className={({ isActive }) =>
                        `text-sm font-medium transition-colors ${isActive ? 'text-brand-600' : 'text-gray-600 hover:text-gray-900'}`
                      }
                    >
                      Admin
                    </NavLink>
                    <NavLink
                      to="/admin/users"
                      className={({ isActive }) =>
                        `flex items-center gap-1 text-sm font-medium transition-colors ${isActive ? 'text-brand-600' : 'text-gray-600 hover:text-gray-900'}`
                      }
                    >
                      <Users className="h-4 w-4" />
                      Users
                    </NavLink>
                  </>
                )}
              </nav>

              {/* Authenticated right actions */}
              <div className="flex items-center gap-3">
                {!isVendor && (
                  <Link to="/cart" className="relative p-2 text-gray-600 hover:text-brand-600 transition-colors">
                    <ShoppingCart className="h-5 w-5" />
                    {itemCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-brand-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                        {itemCount > 9 ? '9+' : itemCount}
                      </span>
                    )}
                  </Link>
                )}

                <div className="relative group">
                  <button className="flex items-center gap-2 p-2 text-gray-600 hover:text-brand-600 transition-colors">
                    <div className="h-7 w-7 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-semibold">
                      {user?.username?.[0]?.toUpperCase() ?? <User className="h-4 w-4" />}
                    </div>
                    <span className="hidden sm:block text-sm font-medium">{user?.username}</span>
                  </button>
                  <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 hidden group-hover:block">
                    {!isVendor && (
                      <Link
                        to="/profile"
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <User className="h-4 w-4" />
                        My Profile
                      </Link>
                    )}
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
            </>
          ) : (
            /* Guest right actions */
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors"
              >
                Create Account
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
