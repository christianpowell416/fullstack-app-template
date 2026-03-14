'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'

interface SidebarContextValue {
  expanded: boolean
  toggleSidebar: () => void
}

const SidebarContext = createContext<SidebarContextValue>({
  expanded: false,
  toggleSidebar: () => {},
})

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('sidebar-expanded')
    if (stored === 'true') setExpanded(true)
  }, [])

  const toggleSidebar = useCallback(() => {
    setExpanded(prev => {
      const next = !prev
      localStorage.setItem('sidebar-expanded', String(next))
      return next
    })
  }, [])

  return (
    <SidebarContext.Provider value={{ expanded, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  return useContext(SidebarContext)
}
