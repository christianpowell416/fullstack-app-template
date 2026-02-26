'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import Sidebar from './Sidebar'
import AuthGuard from './AuthGuard'
import { PageTitleProvider } from './PageTitleContext'

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <PageTitleProvider>
      {/* Background */}
      <div className="fixed inset-0 bg-admin-bg -z-10" />

      {/* Sidebar placeholder to prevent flash */}
      {!mounted && (
        <>
          <div className="fixed top-0 bottom-0 left-0 w-12 md:w-16 bg-nav-bg z-50 border-r border-nav-border" />
          <div className="fixed top-0 left-12 md:left-16 right-0 h-16 bg-nav-bg border-b border-nav-border z-40" />
        </>
      )}
      {mounted && <Sidebar />}

      {/* Main content */}
      <main className="pl-12 md:pl-16 pt-16 min-h-screen relative z-10">
        {children}
      </main>
    </PageTitleProvider>
  )
}

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Login page doesn't need the sidebar
  const isPublicRoute = pathname === '/login' || pathname === '/admin/login'

  if (isPublicRoute) {
    return <>{children}</>
  }

  return (
    <AuthGuard>
      <AuthenticatedLayout>{children}</AuthenticatedLayout>
    </AuthGuard>
  )
}
