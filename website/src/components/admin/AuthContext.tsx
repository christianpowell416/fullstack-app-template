'use client'

import { createContext, useContext } from 'react'
import type { Profile, UserRole } from '@/lib/types'

interface AuthContextType {
  user: Profile | null
  userId: string | null
  role: UserRole | null
  isAdmin: boolean
  isLoading: boolean
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  userId: null,
  role: null,
  isAdmin: false,
  isLoading: true,
})

export function useAuth() {
  return useContext(AuthContext)
}
