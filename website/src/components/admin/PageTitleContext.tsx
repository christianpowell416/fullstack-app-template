'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface PageTitleContextType {
  titleOverride: string | null
  setTitleOverride: (title: string | null) => void
}

const PageTitleContext = createContext<PageTitleContextType>({
  titleOverride: null,
  setTitleOverride: () => {},
})

export function PageTitleProvider({ children }: { children: ReactNode }) {
  const [titleOverride, setTitleOverrideRaw] = useState<string | null>(null)

  const setTitleOverride = useCallback((title: string | null) => {
    setTitleOverrideRaw(title)
  }, [])

  return (
    <PageTitleContext.Provider value={{ titleOverride, setTitleOverride }}>
      {children}
    </PageTitleContext.Provider>
  )
}

export function usePageTitle() {
  return useContext(PageTitleContext)
}
