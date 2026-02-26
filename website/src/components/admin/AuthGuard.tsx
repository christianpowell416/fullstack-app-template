'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { AuthContext } from './AuthContext'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push('/admin/login')
        return
      }

      // Check if user is an admin
      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('id, role')
        .eq('id', session.user.id)
        .single()

      if (!adminUser) {
        await supabase.auth.signOut()
        router.push('/admin/login?error=unauthorized')
        return
      }

      setUserId(adminUser.id)
      setRole(adminUser.role)
      setIsAuthenticated(true)
      setIsLoading(false)
    }

    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string) => {
        if (event === 'SIGNED_OUT') {
          router.push('/admin/login')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase, router, pathname])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-admin-bg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-accent border-t-transparent mx-auto mb-4"></div>
          <p className="text-dark-text-secondary">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <AuthContext.Provider value={{ userId, role, isLoading: false }}>
      {children}
    </AuthContext.Provider>
  )
}
