'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { usePageTitle } from './PageTitleContext'
import { useAuth } from './AuthContext'
import { useTheme } from './ThemeContext'
import { useSidebar } from './SidebarContext'
import { createClient } from '@/lib/supabase-client'
import { getInitials, getFullName } from '@/lib/types'
import {
  ChartBarIcon,
  SparklesIcon,
  UsersIcon,
  ChevronRightIcon,
  ArrowRightOnRectangleIcon,
  BellIcon,
  FolderIcon,
  ClipboardDocumentListIcon,
  TrophyIcon,
  ArrowUpTrayIcon,
  SunIcon,
  MoonIcon,
  ChevronDoubleRightIcon,
  ChevronDoubleLeftIcon,
} from '@heroicons/react/24/outline'

// Funnel icon as inline SVG since heroicons doesn't have one
function FunnelIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
    </svg>
  )
}

// Tooltip - only shows in collapsed mode
function Tooltip({ children, label, show }: { children: React.ReactNode; label: string; show: boolean }) {
  const [hover, setHover] = useState(false)

  if (!show) return <>{children}</>

  return (
    <div
      className="relative"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {children}
      {hover && (
        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-[100] pointer-events-none">
          <div className="bg-dark-card border border-dark-border rounded-lg px-3 py-1.5 shadow-lg whitespace-nowrap">
            <span className="text-sm text-dark-text">{label}</span>
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

// Fixed icon column width: matches collapsed sidebar (w-12 = 48px, md:w-16 = 64px)
// We use 64px as the icon column since the sidebar is always md:w-16 on desktop
const ICON_COL = 'w-12 md:w-16 shrink-0 flex items-center justify-center'

export default function Sidebar() {
  const rawPathname = usePathname()
  const [showMenu, setShowMenu] = useState(false)
  const [menuPos, setMenuPos] = useState<{ bottom: number; left: number } | null>(null)
  const [mounted, setMounted] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [poolCount, setPoolCount] = useState(0)
  const userBtnRef = useRef<HTMLButtonElement>(null)
  const { user, isAdmin } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { expanded, toggleSidebar } = useSidebar()
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

  // Fetch unactioned candidate pool count
  useEffect(() => {
    if (!user) return

    const fetchPoolCount = async () => {
      const { count: totalRejected } = await supabase
        .from('candidates')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'rejected')
        .neq('recruiter_id', user.id)

      const { count: userClaims } = await supabase
        .from('candidate_claims')
        .select('*', { count: 'exact', head: true })
        .eq('recruiter_id', user.id)

      setPoolCount(Math.max(0, (totalRejected || 0) - (userClaims || 0)))
    }

    fetchPoolCount()

    const channel = supabase
      .channel('pool-badge')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'candidates' },
        () => { fetchPoolCount() }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'candidate_claims' },
        () => { fetchPoolCount() }
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

  const sidebarWidth = expanded ? 'w-56' : 'w-12 md:w-16'
  const topBarLeft = expanded ? 'left-56' : 'left-12 md:left-16'

  const handleUserMenuClick = () => {
    if (!showMenu && userBtnRef.current) {
      const rect = userBtnRef.current.getBoundingClientRect()
      setMenuPos({
        bottom: window.innerHeight - rect.top + 4,
        left: rect.right + 8,
      })
    }
    setShowMenu(!showMenu)
  }

  if (!mounted) return (
    <>
      <div className={`fixed top-0 ${topBarLeft} right-0 h-16 bg-nav-bg border-b border-nav-border z-40`} />
      <div className={`fixed top-0 bottom-0 left-0 ${sidebarWidth} bg-nav-bg z-50 border-r border-nav-border`} />
    </>
  )

  return (
    <>
      {/* Top Bar */}
      <div
        className={`fixed top-0 right-0 h-16 bg-nav-bg border-b border-nav-border z-40 flex items-center px-4 md:px-8 transition-[left] duration-200 ${expanded ? '' : 'left-12 md:left-16'}`}
        style={expanded ? { left: '14rem' } : undefined}
      >
        {/* Left - Title */}
        <div className="flex items-center gap-3 shrink-0">
          {pageInfo.breadcrumbs.map((crumb) => (
            <div key={crumb.href} className="flex items-center gap-3">
              <Link
                href={prefixHref(crumb.href)}
                className="text-xl font-heading font-bold text-dark-text-secondary hover:text-dark-text transition-colors"
              >
                {crumb.label}
              </Link>
              <ChevronRightIcon className="w-4 h-4 text-dark-text-secondary" />
            </div>
          ))}
          <h1 className="text-xl font-heading font-bold text-dark-text">{displayTitle}</h1>
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
                  className="relative z-10 flex-1 py-1.5 rounded-lg text-sm font-heading text-center text-dark-text"
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
            className="relative p-2 rounded-xl text-dark-text-secondary hover:text-dark-text hover:bg-dark-text/10 transition-colors"
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
        <div
          className={`md:hidden fixed top-16 right-0 h-12 bg-nav-bg border-b border-nav-border z-40 flex items-center justify-center px-3 ${expanded ? '' : 'left-12'}`}
          style={expanded ? { left: '14rem' } : undefined}
        >
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
                className="relative z-10 flex-1 py-1.5 rounded-lg text-xs font-heading text-center text-dark-text"
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Left Sidebar */}
      <div className={`fixed top-0 bottom-0 left-0 ${sidebarWidth} bg-nav-bg flex flex-col z-50 border-r border-nav-border transition-[width] duration-200 overflow-hidden`}>
        {/* Logo / Dashboard link */}
        <Tooltip label="Dashboard" show={!expanded}>
          <Link
            href={prefixHref('/')}
            className={`
              w-full h-16 flex items-center border-b border-nav-border shrink-0
              ${isOnDashboard ? 'bg-accent' : 'bg-dark-bg hover:bg-dark-text/10'}
              transition-colors
            `}
          >
            <div className={ICON_COL}>
              <img src="/mavericks-logo.png" alt="Mavericks" className="w-6 h-6 md:w-8 md:h-8 rounded-lg object-cover" />
            </div>
            <span className="text-sm font-heading font-bold text-white truncate whitespace-nowrap">{expanded ? 'Mavericks' : ''}</span>
          </Link>
        </Tooltip>

        {/* Navigation Items */}
        <nav className="flex-1 flex flex-col space-y-1 md:space-y-2 pt-2 md:pt-4 pb-2 overflow-y-auto overflow-x-hidden">
          {visibleNavigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            const Icon = item.icon
            const badge = item.href === '/candidate-pool' && poolCount > 0 ? poolCount : 0
            return (
              <Tooltip key={item.name} label={item.name} show={!expanded}>
                <Link
                  href={prefixHref(item.href)}
                  className={`
                    relative h-10 md:h-12 flex items-center rounded-xl md:rounded-2xl transition-colors
                    ${isActive
                      ? 'bg-accent text-white shadow-glow'
                      : 'text-dark-text-secondary hover:bg-dark-text/10 hover:text-dark-text'
                    }
                  `}
                >
                  <div className={ICON_COL}>
                    <Icon className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <span className="text-sm truncate whitespace-nowrap">{item.name}</span>
                  {badge > 0 && !expanded && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-yellow-500 text-black text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                  {badge > 0 && expanded && (
                    <span className="ml-auto mr-2 w-4 h-4 bg-yellow-500 text-black text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </Link>
              </Tooltip>
            )
          })}
        </nav>

        {/* Bottom Section */}
        <div className="pb-2 space-y-1 md:space-y-2">
          <div className="h-px bg-nav-border mx-1" />

          {/* Collapse/Expand toggle */}
          <Tooltip label={expanded ? 'Collapse' : 'Expand'} show={!expanded}>
            <button
              onClick={toggleSidebar}
              className="w-full h-10 md:h-12 flex items-center rounded-xl md:rounded-2xl transition-colors text-dark-text-secondary hover:bg-dark-text/10 hover:text-dark-text"
            >
              <div className={ICON_COL}>
                {expanded ? <ChevronDoubleLeftIcon className="w-5 h-5" /> : <ChevronDoubleRightIcon className="w-5 h-5" />}
              </div>
              <span className="text-sm whitespace-nowrap">{expanded ? 'Collapse' : ''}</span>
            </button>
          </Tooltip>

          {/* User Menu */}
          <div className="relative">
            <Tooltip label={userName} show={!expanded}>
              <button
                ref={userBtnRef}
                onClick={handleUserMenuClick}
                className="w-full h-10 md:h-12 flex items-center rounded-xl md:rounded-2xl transition-colors hover:bg-dark-text/10"
              >
                <div className={ICON_COL}>
                  <div className="w-7 h-7 md:w-8 md:h-8 bg-accent rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-xs md:text-sm">{userInitials}</span>
                  </div>
                </div>
                {expanded && (
                  <div className="text-left min-w-0">
                    <p className="text-xs font-medium text-dark-text truncate">{userName}</p>
                    <p className="text-[10px] text-dark-text-secondary">{userRoleLabel}</p>
                  </div>
                )}
              </button>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* User Menu Popover - rendered outside the sidebar to avoid overflow clipping */}
      {showMenu && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setShowMenu(false)} />
          <div
            className="fixed bg-dark-card rounded-2xl shadow-card-hover border border-dark-border py-2 z-[70] min-w-[220px]"
            style={menuPos ? { bottom: menuPos.bottom, left: menuPos.left } : undefined}
          >
            <div className="px-4 py-3 border-b border-dark-border">
              <p className="text-sm font-medium text-dark-text">{userName}</p>
              <p className="text-xs text-dark-text-secondary">{userRoleLabel}</p>
            </div>
            <button
              onClick={toggleTheme}
              className="w-full px-4 py-3 text-left text-sm text-dark-text-secondary hover:bg-dark-text/10 flex items-center gap-3 transition-colors"
            >
              {theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </button>
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
    </>
  )
}
