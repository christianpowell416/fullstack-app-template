export const dynamic = 'force-dynamic'

import { adminSupabase } from '@/lib/supabase-admin'
import {
  UsersIcon,
  ArrowTrendingUpIcon,
  CurrencyDollarIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'

export default async function AdminDashboard() {
  // Fetch basic stats from your database
  // Replace these with your own queries
  const { count: totalUsers } = await adminSupabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Users"
          value={totalUsers?.toLocaleString() ?? '0'}
          icon={UsersIcon}
          color="text-accent"
        />
        <StatCard
          label="Active Today"
          value="—"
          icon={ArrowTrendingUpIcon}
          color="text-success"
        />
        <StatCard
          label="AI Calls Today"
          value="—"
          icon={SparklesIcon}
          color="text-warning"
        />
        <StatCard
          label="Est. Cost Today"
          value="$0.00"
          icon={CurrencyDollarIcon}
          color="text-error"
        />
      </div>

      {/* Placeholder sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-dark-card rounded-2xl border border-dark-border p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Signups</h2>
          <p className="text-dark-text-secondary text-sm">
            Connect your database queries here to show recent user signups.
          </p>
        </div>

        <div className="bg-dark-card rounded-2xl border border-dark-border p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <QuickAction label="View all users" href="/admin/users" />
            <QuickAction label="Check costs" href="/admin/costs" />
            <QuickAction label="Settings" href="/admin/settings" />
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon: Icon, color }: {
  label: string
  value: string
  icon: any
  color: string
}) {
  return (
    <div className="bg-dark-card rounded-2xl border border-dark-border p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-xl bg-white/5 ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-sm text-dark-text-secondary mt-1">{label}</p>
    </div>
  )
}

function QuickAction({ label, href }: { label: string; href: string }) {
  return (
    <a
      href={href}
      className="block px-4 py-3 bg-dark-bg rounded-xl border border-dark-border text-white text-sm hover:border-accent/50 transition-colors"
    >
      {label} &rarr;
    </a>
  )
}
