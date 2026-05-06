import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, UserPlus, Download, Upload, Eye, Pencil, Ban, Check } from 'lucide-react'
import { userApi, UserResponse, AdminCreateUserRequest } from '../../api/userApi'
import { UserStatsBar } from '../../components/admin/UserStatsBar'
import { UserStatusBadge } from '../../components/admin/UserStatusBadge'
import { AddUserModal } from '../../components/admin/AddUserModal'
import { Spinner } from '../../components/ui/Spinner'
import toast from 'react-hot-toast'

type StatusFilter = 'ALL' | 'ACTIVE' | 'PENDING' | 'SUSPENDED'

const ROLE_LABELS: Record<string, string> = {
  ROLE_ADMIN: 'Admin',
  ROLE_CUSTOMER: 'Customer',
  ROLE_VENDOR: 'Vendor',
  ROLE_SUPPORT: 'Support',
}

const ROLE_COLORS: Record<string, string> = {
  ROLE_ADMIN: 'bg-purple-900/50 text-purple-400 border-purple-700',
  ROLE_CUSTOMER: 'bg-blue-900/50 text-blue-400 border-blue-700',
  ROLE_VENDOR: 'bg-green-900/50 text-green-400 border-green-700',
  ROLE_SUPPORT: 'bg-orange-900/50 text-orange-400 border-orange-700',
}

function avatarColor(name: string): string {
  const colors = [
    'bg-purple-500', 'bg-blue-500', 'bg-green-500', 'bg-orange-500',
    'bg-pink-500', 'bg-teal-500', 'bg-red-500', 'bg-indigo-500',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

function initials(user: UserResponse): string {
  const f = user.firstName?.[0] ?? ''
  const l = user.lastName?.[0] ?? ''
  return (f + l).toUpperCase() || user.email[0].toUpperCase()
}

function formatRelativeTime(ts: string | null): string {
  if (!ts) return 'Never'
  const diff = Date.now() - new Date(ts).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''} ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? 's' : ''} ago`
  const days = Math.floor(hrs / 24)
  return `${days} day${days > 1 ? 's' : ''} ago`
}

export function UserManagementPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [showAddUser, setShowAddUser] = useState(false)
  const qc = useQueryClient()

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['user-stats'],
    queryFn: userApi.getUserStats,
    refetchInterval: 30_000,
  })

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['admin-users', statusFilter, roleFilter],
    queryFn: () => userApi.listUsers({
      status: statusFilter === 'ALL' ? undefined : statusFilter,
      role: roleFilter === 'ALL' ? undefined : roleFilter,
    }),
  })

  const filteredUsers = useMemo(() => {
    if (!search) return users
    const q = search.toLowerCase()
    return users.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(q)
    )
  }, [users, search])

  const createUser = useMutation({
    mutationFn: (data: AdminCreateUserRequest) => userApi.createUser(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      qc.invalidateQueries({ queryKey: ['user-stats'] })
      setShowAddUser(false)
      toast.success('User created. Invitation email sent.')
    },
    onError: (err: unknown) => {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 409) toast.error('An account with this email already exists.')
      else toast.error('Failed to create user.')
    },
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACTIVE' | 'SUSPENDED' }) =>
      userApi.updateUserStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      qc.invalidateQueries({ queryKey: ['user-stats'] })
      toast.success('User status updated')
    },
    onError: () => toast.error('Failed to update status'),
  })

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users, emails, IDs…"
                className="pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 w-64"
              />
            </div>
            <button
              onClick={() => setShowAddUser(true)}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <UserPlus className="h-4 w-4" />
              Add User
            </button>
          </div>
        </div>

        {/* Stats */}
        {loadingStats ? <div className="h-28 flex items-center justify-center"><Spinner /></div> : stats && <UserStatsBar stats={stats} />}

        {/* Filters */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-1 p-1 bg-gray-800 rounded-xl border border-gray-700">
            {(['ALL', 'ACTIVE', 'PENDING', 'SUSPENDED'] as StatusFilter[]).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === s
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {s === 'ALL' ? 'All Users' : s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="ALL">All Roles</option>
              <option value="ROLE_ADMIN">Admin</option>
              <option value="ROLE_CUSTOMER">Customer</option>
              <option value="ROLE_VENDOR">Vendor</option>
              <option value="ROLE_SUPPORT">Support</option>
            </select>
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 hover:bg-gray-700 transition-colors">
              <Download className="h-3.5 w-3.5" /> Export
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 hover:bg-gray-700 transition-colors">
              <Upload className="h-3.5 w-3.5" /> Import
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white">
                {statusFilter === 'ALL' ? 'All Users' : statusFilter.charAt(0) + statusFilter.slice(1).toLowerCase()}
              </h2>
              <span className="px-2 py-0.5 bg-gray-700 text-gray-300 text-xs rounded-full">
                {filteredUsers.length} users
              </span>
            </div>
          </div>

          {loadingUsers ? (
            <div className="py-20 flex justify-center"><Spinner /></div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-20 text-center text-gray-500 text-sm">No users found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 tracking-wider">USER</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 tracking-wider">ROLE</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 tracking-wider">STATUS</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 tracking-wider">LAST LOGIN</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 tracking-wider">ORDERS</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 tracking-wider">MFA</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 tracking-wider">JOINED</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-700/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`h-9 w-9 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 ${avatarColor(`${user.firstName}${user.lastName}`)}`}>
                            {initials(user)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">
                              {user.firstName} {user.lastName}
                            </p>
                            <p className="text-xs text-gray-400">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-md text-xs font-medium border ${ROLE_COLORS[user.role] ?? 'bg-gray-700 text-gray-300 border-gray-600'}`}>
                          {ROLE_LABELS[user.role] ?? user.role}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <UserStatusBadge status={user.status} />
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-400">
                        {formatRelativeTime(user.lastLoginAt)}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">—</td>
                      <td className="px-4 py-4 text-sm text-gray-400">
                        {user.mfaEnabled ? <Check className="h-4 w-4 text-green-400" /> : <span className="text-gray-600">✗</span>}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-400">
                        {user.joinedAt ? new Date(user.joinedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button title="View" className="p-1 text-gray-500 hover:text-gray-200 transition-colors">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button title="Edit" className="p-1 text-gray-500 hover:text-gray-200 transition-colors">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            title={user.status === 'SUSPENDED' ? 'Activate' : 'Suspend'}
                            onClick={() => updateStatus.mutate({
                              id: user.id,
                              status: user.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED',
                            })}
                            className={`p-1 transition-colors ${user.status === 'SUSPENDED' ? 'text-green-500 hover:text-green-400' : 'text-gray-500 hover:text-red-400'}`}
                          >
                            <Ban className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showAddUser && (
        <AddUserModal
          onSave={(data) => createUser.mutate(data)}
          onCancel={() => setShowAddUser(false)}
          loading={createUser.isPending}
        />
      )}
    </div>
  )
}
