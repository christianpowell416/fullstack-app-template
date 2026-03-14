'use client'

import { useState, Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam === 'unauthorized') {
      setError('You do not have access to this platform.')
    } else if (errorParam === 'no_profile') {
      setError('Account setup incomplete. Contact your admin.')
    } else if (errorParam === 'deactivated') {
      setError('Your account has been deactivated. Contact your admin.')
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    router.push('/admin')
  }

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/mavericks-logo.png" alt="Mavericks" className="w-20 h-20 rounded-2xl mb-6 shadow-glow mx-auto object-cover" />
          <h1 className="text-3xl font-display text-dark-text mb-2">Mavericks</h1>
          <p className="text-dark-text-secondary font-heading">Internal Recruiting Platform</p>
        </div>

        {/* Login Card */}
        <div className="bg-dark-card rounded-3xl shadow-card border border-dark-border p-8">
          <div className="text-center mb-6">
            <h2 className="text-lg font-heading font-semibold text-dark-text mb-2">Sign In</h2>
            <p className="text-dark-text-secondary text-sm">
              Enter your credentials to access the dashboard.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-error/10 border border-error/20 rounded-xl">
              <p className="text-sm text-error">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-dark-text-secondary mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-dark-text placeholder-dark-text-secondary/50 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                placeholder="you@mavericksondemand.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-dark-text-secondary mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-dark-text placeholder-dark-text-secondary/50 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent text-white py-4 rounded-2xl font-heading font-semibold hover:bg-accent-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-button hover:shadow-glow mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="text-center text-dark-text-secondary/50 text-xs mt-6">
            Contact your admin if you need access or forgot your password.
          </p>
        </div>

        <p className="text-center text-dark-text-secondary/50 text-xs mt-8">
          Mavericks On Demand - Internal Use Only
        </p>
      </div>
    </div>
  )
}

export default function AdminLogin() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
