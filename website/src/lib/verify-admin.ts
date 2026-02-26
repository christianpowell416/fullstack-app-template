import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

interface AdminAuthResult {
  authorized: boolean
  userId?: string
  userEmail?: string
  role?: string
  errorResponse?: NextResponse
}

/**
 * Verify that the current request is from an authenticated admin user.
 * Use this in API routes to protect admin endpoints.
 *
 * Requires an `admin_users` table in your Supabase database:
 *   CREATE TABLE admin_users (
 *     id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
 *     role TEXT DEFAULT 'admin'
 *   );
 */
export async function verifyAdmin(): Promise<AdminAuthResult> {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      authorized: false,
      errorResponse: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('id, role')
    .eq('id', user.id)
    .single()

  if (!adminUser) {
    return {
      authorized: false,
      errorResponse: NextResponse.json({ error: 'Forbidden - not an admin' }, { status: 403 }),
    }
  }

  return {
    authorized: true,
    userId: user.id,
    userEmail: user.email,
    role: adminUser.role,
  }
}
