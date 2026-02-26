export const dynamic = 'force-dynamic'

import { adminSupabase } from '@/lib/supabase-admin'

export default async function UsersPage() {
  // Fetch recent users
  const { data: users } = await adminSupabase
    .from('profiles')
    .select('id, email, first_name, last_name, created_at')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="bg-dark-card rounded-2xl border border-dark-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-dark-border">
              <th className="text-left px-6 py-4 text-sm font-medium text-dark-text-secondary">Email</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-dark-text-secondary">Name</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-dark-text-secondary">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users?.map((user) => (
              <tr key={user.id} className="border-b border-dark-border last:border-0 hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 text-sm text-white">{user.email}</td>
                <td className="px-6 py-4 text-sm text-dark-text-secondary">
                  {[user.first_name, user.last_name].filter(Boolean).join(' ') || '—'}
                </td>
                <td className="px-6 py-4 text-sm text-dark-text-secondary">
                  {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
            {(!users || users.length === 0) && (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-dark-text-secondary text-sm">
                  No users yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
