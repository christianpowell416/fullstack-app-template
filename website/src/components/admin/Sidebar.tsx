'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'
import { usePageTitle } from './PageTitleContext'
import {
  UsersIcon,
  CurrencyDollarIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  ChevronRightIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline'

// Tooltip component
function Tooltip({ children, label }: { children: React.ReactNode; label: string }) {
  const [show, setShow] = useState(false)

  return (
    <div
      className="relative"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-[100] pointer-events-none">
          <div className="bg-dark-card border border-dark-border rounded-lg px-3 py-1.5 shadow-lg whitespace-nowrap">
            <span className="text-sm text-white">{label}</span>
          </div>
        </div>
      )}
    </div>
  )
}

// Navigation items — customize these for your app
const navigation = [
  { name: 'Growth', href: '/growth', icon: ArrowTrendingUpIcon },
  { name: 'Users', href: '/users', icon: UsersIcon },
  { name: 'Costs', href: '/costs', icon: CurrencyDollarIcon },
  // Add more nav items as you build:
  // { name: 'Email', href: '/email', icon: EnvelopeIcon },
  // { name: 'Errors', href: '/errors', icon: ExclamationTriangleIcon },
]

export default function Sidebar() {
  const rawPathname = usePathname()
  const [showMenu, setShowMenu] = useState(false)
  const [userInitials, setUserInitials] = useState('A')
  const [userEmail, setUserEmail] = useState('')
  const supabase = createClient()

  // Handle /admin prefix for localhost vs production subdomain
  const basePath = rawPathname?.startsWith('/admin') ? '/admin' : ''
  const pathname = basePath ? (rawPathname?.replace(/^\/admin/, '') || '/') : rawPathname
  const prefixHref = (href: string) => `${basePath}${href}`

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        setUserInitials(user.email[0].toUpperCase())
        setUserEmail(user.email)
      }
    }
    loadUser()
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = `${basePath}/login`
  }

  // Page title and breadcrumbs — add your pages here
  const getPageInfo = (): { title: string; breadcrumbs: { label: string; href: string }[] } => {
    const path = pathname || ''

    const pageTitles: Record<string, { title: string; breadcrumbs: { label: string; href: string }[] }> = {
      '/': { title: 'Dashboard', breadcrumbs: [] },
      '/growth': { title: 'Growth', breadcrumbs: [] },
      '/users': { title: 'Users', breadcrumbs: [] },
      '/costs': { title: 'Costs', breadcrumbs: [] },
      '/settings': { title: 'Settings', breadcrumbs: [] },
    }

    if (pageTitles[path]) {
      return pageTitles[path]
    }

    // Dynamic routes
    if (path.startsWith('/users/')) {
      return { title: 'User Details', breadcrumbs: [{ label: 'Users', href: '/users' }] }
    }

    // Fallback
    const segments = path.split('/').filter(Boolean)
    if (segments.length > 0) {
      const lastSegment = segments[segments.length - 1]
      const title = lastSegment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
      return { title, breadcrumbs: [] }
    }

    return { title: 'Dashboard', breadcrumbs: [] }
  }

  const pageInfo = getPageInfo()
  const { titleOverride } = usePageTitle()
  const displayTitle = titleOverride || pageInfo.title
  const isOnDashboard = pathname === '/'

  return (
    <>
      {/* Top Bar */}
      <div className="fixed top-0 left-12 md:left-16 right-0 h-16 bg-nav-bg border-b border-nav-border z-40 flex items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-3">
          {pageInfo.breadcrumbs.map((crumb) => (
            <div key={crumb.href} className="flex items-center gap-3">
              <Link
                href={prefixHref(crumb.href)}
                className="text-xl font-bold text-dark-text-secondary hover:text-white transition-colors"
              >
                {crumb.label}
              </Link>
              <ChevronRightIcon className="w-4 h-4 text-dark-text-secondary" />
            </div>
          ))}
          <h1 className="text-xl font-bold text-white">{displayTitle}</h1>
        </div>
      </div>

      {/* Left Sidebar */}
      <div className="fixed top-0 bottom-0 left-0 w-12 md:w-16 bg-nav-bg flex flex-col z-50 border-r border-nav-border">
        {/* Logo / Dashboard link */}
        <Tooltip label="Dashboard">
          <Link
            href={prefixHref('/')}
            className={`
              w-full h-16 flex items-center justify-center border-b border-nav-border
              ${isOnDashboard ? 'bg-accent' : 'bg-admin-bg hover:bg-white/10'}
            `}
          >
            {/* Replace with your logo */}
            <div className="w-6 h-6 md:w-8 md:h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-accent font-bold text-xs md:text-sm">A</span>
            </div>
          </Link>
        </Tooltip>

        {/* Navigation Items */}
        <nav className="flex-1 flex flex-col space-y-1 md:space-y-2 pt-2 md:pt-4 pb-2 px-1 md:px-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            const Icon = item.icon
            return (
              <Tooltip key={item.name} label={item.name}>
                <Link
                  href={prefixHref(item.href)}
                  className={`
                    h-10 md:h-12 flex items-center justify-center rounded-xl md:rounded-2xl transition-colors
                    ${isActive
                      ? 'bg-accent text-white shadow-lg'
                      : 'text-dark-text-secondary hover:bg-white/10 hover:text-white'
                    }
                  `}
                >
                  <Icon className="w-5 h-5 md:w-6 md:h-6" />
                </Link>
              </Tooltip>
            )
          })}
        </nav>

        {/* Bottom Section */}
        <div className="px-1 md:px-2 pb-2 space-y-1 md:space-y-2">
          {/* Settings */}
          <Tooltip label="Settings">
            <Link
              href={prefixHref('/settings')}
              className={`
                h-10 md:h-12 flex items-center justify-center rounded-xl md:rounded-2xl transition-colors
                ${pathname === '/settings'
                  ? 'bg-accent text-white shadow-lg'
                  : 'text-dark-text-secondary hover:bg-white/10 hover:text-white'
                }
              `}
            >
              <Cog6ToothIcon className="w-5 h-5 md:w-6 md:h-6" />
            </Link>
          </Tooltip>

          <div className="h-px bg-nav-border mx-1" />

          {/* User Menu */}
          <div className="relative">
            <Tooltip label={userEmail || 'Account'}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="w-full h-10 md:h-12 flex items-center justify-center rounded-xl md:rounded-2xl transition-colors hover:bg-white/10"
              >
                <div className="w-7 h-7 md:w-8 md:h-8 bg-accent rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-xs md:text-sm">
                    {userInitials}
                  </span>
                </div>
              </button>
            </Tooltip>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div className="absolute bottom-0 left-full ml-2 bg-dark-card rounded-2xl shadow-card-hover border border-dark-border py-2 z-50 min-w-[220px]">
                  <div className="px-4 py-3 border-b border-dark-border">
                    <p className="text-sm font-medium text-white">{userEmail || 'Admin User'}</p>
                    <p className="text-xs text-dark-text-secondary">Administrator</p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="w-full px-4 py-3 text-left text-sm text-error hover:bg-error/10 flex items-center gap-3 transition-colors"
                  >
                    <ArrowRightOnRectangleIcon className="w-5 h-5" />
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
