import React from 'react'

interface Props {
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED' | string
}

export function UserStatusBadge({ status }: Props) {
  switch (status) {
    case 'ACTIVE':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-900/50 text-green-400 border border-green-800">
          <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
          Active
        </span>
      )
    case 'PENDING':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-900/50 text-amber-400 border border-amber-800">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          Pending
        </span>
      )
    case 'SUSPENDED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-700 text-gray-400 border border-gray-600">
          <span className="h-1.5 w-1.5 rounded-full bg-gray-500" />
          Suspended
        </span>
      )
    default:
      return <span className="text-xs text-gray-500">{status}</span>
  }
}
