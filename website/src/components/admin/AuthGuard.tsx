'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { AuthContext } from './AuthContext'
import type { Profile, UserRole } from '@/lib/types'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<Profile | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
          router.push('/admin/login')
          return
        }

        // Fetch the user's profile with role
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (error || !profile) {
          await supabase.auth.signOut()
          router.push('/admin/login?error=no_profile')
          return
        }

        if (!profile.is_active) {
          await supabase.auth.signOut()
          router.push('/admin/login?error=deactivated')
          return
        }

        setUser(profile as Profile)
        setIsAuthenticated(true)
      } catch {
        router.push('/admin/login')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string) => {
        if (event === 'SIGNED_OUT') {
          setUser(null)
          setIsAuthenticated(false)
          router.push('/admin/login')
        } else if (event === 'SIGNED_IN') {
          // Re-fetch profile on sign in
          const { data: { session } } = await supabase.auth.getSession()
          if (session) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single()
            if (profile) {
              setUser(profile as Profile)
              setIsAuthenticated(true)
              setIsLoading(false)
            }
          }
        }
      }
    )

    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-accent border-t-transparent mx-auto mb-4" />
          <p className="text-dark-text-secondary">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <AuthContext.Provider value={{
      user,
      userId: user.id,
      role: user.role as UserRole,
      isAdmin: user.role === 'admin',
      isLoading: false,
    }}>
      {children}
    </AuthContext.Provider>
  )
}
