'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { usePageTitle } from './PageTitleContext'
import { useAuth } from './AuthContext'
import { createClient } from '@/lib/supabase-client'
import { getInitials, getFullName } from '@/lib/types'
import {
  ChartBarIcon,
  SparklesIcon,
  BuildingOfficeIcon,
  UsersIcon,
  ChevronRightIcon,
  ArrowRightOnRectangleIcon,
  BellIcon,
  FolderIcon,
  ClipboardDocumentListIcon,
  TrophyIcon,
  ArrowUpTrayIcon,
} from '@heroicons/react/24/outline'

// Funnel icon as inline SVG since heroicons doesn't have one
function FunnelIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
    </svg>
  )
}

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

const navigation = [
  { name: 'Pipeline', href: '/pipeline', icon: FunnelIcon },
  { name: 'Candidates', href: '/candidates', icon: ClipboardDocumentListIcon },
  { name: 'Projects', href: '/projects', icon: FolderIcon, adminOnly: true },
  { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
  { name: 'Team', href: '/team', icon: UsersIcon, adminOnly: true },
  { name: 'Leaderboard', href: '/leaderboard', icon: TrophyIcon },
  { name: 'Candidate Pool', href: '/candidate-pool', icon: SparklesIcon },
  { name: 'Import', href: '/import', icon: ArrowUpTrayIcon, adminOnly: true },
]

export default function Sidebar() {
  const rawPathname = usePathname()
  const [showMenu, setShowMenu] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const { user, isAdmin } = useAuth()
  const supabase = createClient()

  useEffect(() => { setMounted(true) }, [])

  // Fetch unread notification count
  useEffect(() => {
    if (!user) return

    const fetchUnread = async () => {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', user.id)
        .eq('is_read', false)
      setUnreadCount(count || 0)
    }

    fetchUnread()

    // Subscribe to new notifications
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${user.id}` },
        () => { setUnreadCount(prev => prev + 1) }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user, supabase])

  const basePath = rawPathname?.startsWith('/admin') ? '/admin' : ''
  const pathname = basePath ? (rawPathname?.replace(/^\/admin/, '') || '/') : rawPathname
  const prefixHref = (href: string) => `${basePath}${href}`

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = `${basePath}/login`
  }

  // Filter navigation based on role
  const visibleNavigation = navigation.filter(item => !item.adminOnly || isAdmin)

  const getPageInfo = (): { title: string; breadcrumbs: { label: string; href: string }[] } => {
    const path = pathname || ''

    const pageTitles: Record<string, { title: string; breadcrumbs: { label: string; href: string }[] }> = {
      '/': { title: 'Dashboard', breadcrumbs: [] },
      '/pipeline': { title: 'Pipeline', breadcrumbs: [] },
      '/candidates': { title: 'Candidates', breadcrumbs: [] },
      '/projects': { title: 'Projects', breadcrumbs: [] },
      '/analytics': { title: 'Analytics', breadcrumbs: [] },
      '/team': { title: 'Team', breadcrumbs: [] },
      '/leaderboard': { title: 'Leaderboard', breadcrumbs: [] },
      '/candidate-pool': { title: 'Candidate Pool', breadcrumbs: [] },
      '/import': { title: 'Import Data', breadcrumbs: [] },
      '/notifications': { title: 'Notifications', breadcrumbs: [] },
    }

    if (pageTitles[path]) return pageTitles[path]

    if (path.startsWith('/projects/')) {
      return { title: 'Project Details', breadcrumbs: [{ label: 'Projects', href: '/projects' }] }
    }
    if (path.startsWith('/candidates/')) {
      return { title: 'Candidate Details', breadcrumbs: [{ label: 'Candidates', href: '/candidates' }] }
    }

    const segments = path.split('/').filter(Boolean)
    if (segments.length > 0) {
      const lastSegment = segments[segments.length - 1]
      const title = lastSegment.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      return { title, breadcrumbs: [] }
    }

    return { title: 'Dashboard', breadcrumbs: [] }
  }

  const pageInfo = getPageInfo()
  const { titleOverride, headerTabs, activeTab, onTabChange } = usePageTitle()
  const displayTitle = titleOverride || pageInfo.title
  const isOnDashboard = pathname === '/'

  const userInitials = user ? getInitials(user.first_name, user.last_name) : '?'
  const userName = user ? getFullName(user) : 'User'
  const userRoleLabel = isAdmin ? 'Admin' : 'Recruiter'

  if (!mounted) return (
    <>
      <div className="fixed top-0 left-12 md:left-16 right-0 h-16 bg-nav-bg/80 backdrop-blur-xl border-b border-nav-border z-40" />
      <div className="fixed top-0 bottom-0 left-0 w-12 md:w-16 bg-nav-bg z-50 border-r border-nav-border" />
    </>
  )

  return (
    <>
      {/* Top Bar */}
      <div className="fixed top-0 left-12 md:left-16 right-0 h-16 bg-nav-bg/80 backdrop-blur-xl border-b border-nav-border z-40 flex items-center px-4 md:px-8">
        {/* Left - Title */}
        <div className="flex items-center gap-3 shrink-0">
          {pageInfo.breadcrumbs.map((crumb) => (
            <div key={crumb.href} className="flex items-center gap-3">
              <Link
                href={prefixHref(crumb.href)}
                className="text-xl font-heading font-bold text-dark-text-secondary hover:text-white transition-colors"
              >
                {crumb.label}
              </Link>
              <ChevronRightIcon className="w-4 h-4 text-dark-text-secondary" />
            </div>
          ))}
          <h1 className="text-xl font-heading font-bold text-white">{displayTitle}</h1>
        </div>

        {/* Desktop Tabs - absolutely centered in header */}
        {headerTabs.length > 0 && (
          <div className="hidden md:flex absolute inset-0 items-center justify-center pointer-events-none">
            <div className="relative flex bg-dark-bg/60 border border-dark-border rounded-xl p-1 pointer-events-auto" style={{ width: `${headerTabs.length * 7.5}rem` }}>
              <div
                className="absolute top-1 bottom-1 bg-accent rounded-lg transition-all duration-200 ease-out"
                style={{
                  left: `calc(${(headerTabs.findIndex(t => t.key === activeTab) / headerTabs.length) * 100}% + 4px)`,
                  width: `calc(${100 / headerTabs.length}% - 8px)`,
                }}
              />
              {headerTabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => onTabChange?.(tab.key)}
                  className="relative z-10 flex-1 py-1.5 rounded-lg text-sm font-heading text-center text-white"
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Right - Notifications */}
        <div className="ml-auto flex items-center gap-3">
          <Link
            href={prefixHref('/notifications')}
            className="relative p-2 rounded-xl text-dark-text-secondary hover:text-white hover:bg-white/10 transition-colors"
          >
            <BellIcon className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-error text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Mobile Tabs - separate bar below header */}
      {headerTabs.length > 0 && (
        <div className="md:hidden fixed top-16 left-12 right-0 h-12 bg-nav-bg/80 backdrop-blur-xl border-b border-nav-border z-40 flex items-center justify-center px-3">
          <div className="relative flex bg-dark-bg/60 border border-dark-border rounded-xl p-1" style={{ width: `${headerTabs.length * 6}rem` }}>
            <div
              className="absolute top-1 bottom-1 bg-accent rounded-lg transition-all duration-200 ease-out"
              style={{
                left: `calc(${(headerTabs.findIndex(t => t.key === activeTab) / headerTabs.length) * 100}% + 4px)`,
                width: `calc(${100 / headerTabs.length}% - 8px)`,
              }}
            />
            {headerTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => onTabChange?.(tab.key)}
                className="relative z-10 flex-1 py-1.5 rounded-lg text-xs font-heading text-center text-white"
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Left Sidebar */}
      <div className="fixed top-0 bottom-0 left-0 w-12 md:w-16 bg-nav-bg flex flex-col z-50 border-r border-nav-border">
        {/* Logo / Dashboard link */}
        <Tooltip label="Dashboard">
          <Link
            href={prefixHref('/')}
            className={`
              w-full h-16 flex items-center justify-center border-b border-nav-border
              ${isOnDashboard ? 'bg-accent' : 'bg-dark-bg hover:bg-white/10'}
              transition-colors
            `}
          >
            <img src="/mavericks-logo.png" alt="Mavericks" className="w-6 h-6 md:w-8 md:h-8 rounded-lg object-cover" />
          </Link>
        </Tooltip>

        {/* Navigation Items */}
        <nav className="flex-1 flex flex-col space-y-1 md:space-y-2 pt-2 md:pt-4 pb-2 px-1 md:px-2 overflow-y-auto">
          {visibleNavigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            const Icon = item.icon
            return (
              <Tooltip key={item.name} label={item.name}>
                <Link
                  href={prefixHref(item.href)}
                  className={`
                    h-10 md:h-12 flex items-center justify-center rounded-xl md:rounded-2xl transition-all
                    ${isActive
                      ? 'bg-accent text-white shadow-glow'
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
          <div className="h-px bg-nav-border mx-1" />

          {/* User Menu */}
          <div className="relative">
            <Tooltip label={userName}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="w-full h-10 md:h-12 flex items-center justify-center rounded-xl md:rounded-2xl transition-colors hover:bg-white/10"
              >
                <div className="w-7 h-7 md:w-8 md:h-8 bg-accent rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-xs md:text-sm">{userInitials}</span>
                </div>
              </button>
            </Tooltip>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div className="absolute bottom-0 left-full ml-2 bg-dark-card rounded-2xl shadow-card-hover border border-dark-border py-2 z-50 min-w-[220px]">
                  <div className="px-4 py-3 border-b border-dark-border">
                    <p className="text-sm font-medium text-white">{userName}</p>
                    <p className="text-xs text-dark-text-secondary">{userRoleLabel}</p>
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
