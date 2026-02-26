'use client'

import { createContext, useContext } from 'react'

interface AuthContextType {
  userId: string | null
  role: string | null
  isLoading: boolean
}

export const AuthContext = createContext<AuthContextType>({
  userId: null,
  role: null,
  isLoading: true,
})

export function useAuth() {
  return useContext(AuthContext)
}
