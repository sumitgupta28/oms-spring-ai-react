import React from 'react'
import { TrendingUp, CheckCircle, AlertTriangle, Clock } from 'lucide-react'
import { UserStatsResponse } from '../../api/userApi'

interface Props {
  stats: UserStatsResponse
}

export function UserStatsBar({ stats }: Props) {
  const cards = [
    {
      label: 'TOTAL USERS',
      value: stats.total.toLocaleString(),
      sub: `+${stats.thisMonth} this month`,
      icon: <TrendingUp className="h-4 w-4 text-blue-400" />,
      accent: 'bg-blue-500',
    },
    {
      label: 'ACTIVE',
      value: stats.active.toLocaleString(),
      sub: `${stats.total > 0 ? ((stats.active / stats.total) * 100).toFixed(1) : 0}% rate`,
      icon: <CheckCircle className="h-4 w-4 text-green-400" />,
      accent: 'bg-green-500',
    },
    {
      label: 'PENDING VERIFY',
      value: stats.pendingVerify.toLocaleString(),
      sub: `${stats.total > 0 ? ((stats.pendingVerify / stats.total) * 100).toFixed(1) : 0}% unverified`,
      icon: <AlertTriangle className="h-4 w-4 text-amber-400" />,
      accent: 'bg-amber-500',
    },
    {
      label: 'SUSPENDED',
      value: stats.suspended.toLocaleString(),
      sub: `${stats.total > 0 ? ((stats.suspended / stats.total) * 100).toFixed(1) : 0}% flagged`,
      icon: <Clock className="h-4 w-4 text-red-400" />,
      accent: 'bg-red-500',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((c) => (
        <div key={c.label} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <p className="text-xs text-gray-400 font-medium tracking-wider mb-1">{c.label}</p>
          <p className="text-3xl font-bold text-white mb-1">{c.value}</p>
          <div className="flex items-center gap-1.5 mb-3">
            {c.icon}
            <p className="text-xs text-gray-400">{c.sub}</p>
          </div>
          <div className="h-0.5 bg-gray-700 rounded-full">
            <div className={`h-0.5 ${c.accent} rounded-full w-3/4`} />
          </div>
        </div>
      ))}
    </div>
  )
}
