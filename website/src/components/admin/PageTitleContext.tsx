'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

export interface HeaderTab {
  key: string
  label: string
}

interface PageTitleContextType {
  titleOverride: string | null
  setTitleOverride: (title: string | null) => void
  headerTabs: HeaderTab[]
  activeTab: string | null
  setHeaderTabs: (tabs: HeaderTab[], activeTab: string, onTabChange: (key: string) => void) => void
  clearHeaderTabs: () => void
  onTabChange: ((key: string) => void) | null
}

const PageTitleContext = createContext<PageTitleContextType>({
  titleOverride: null,
  setTitleOverride: () => {},
  headerTabs: [],
  activeTab: null,
  setHeaderTabs: () => {},
  clearHeaderTabs: () => {},
  onTabChange: null,
})

export function PageTitleProvider({ children }: { children: ReactNode }) {
  const [titleOverride, setTitleOverrideRaw] = useState<string | null>(null)
  const [headerTabs, setHeaderTabsRaw] = useState<HeaderTab[]>([])
  const [activeTab, setActiveTab] = useState<string | null>(null)
  const [onTabChange, setOnTabChange] = useState<((key: string) => void) | null>(null)

  const setTitleOverride = useCallback((title: string | null) => {
    setTitleOverrideRaw(title)
  }, [])

  const setHeaderTabs = useCallback((tabs: HeaderTab[], active: string, onChange: (key: string) => void) => {
    setHeaderTabsRaw(tabs)
    setActiveTab(active)
    // Wrap in function to prevent React from calling it as an initializer
    setOnTabChange(() => (key: string) => {
      setActiveTab(key)
      onChange(key)
    })
  }, [])

  const clearHeaderTabs = useCallback(() => {
    setHeaderTabsRaw([])
    setActiveTab(null)
    setOnTabChange(null)
  }, [])

  return (
    <PageTitleContext.Provider value={{ titleOverride, setTitleOverride, headerTabs, activeTab, setHeaderTabs, clearHeaderTabs, onTabChange }}>
      {children}
    </PageTitleContext.Provider>
  )
}

export function usePageTitle() {
  return useContext(PageTitleContext)
}
