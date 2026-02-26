import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Server-only — uses service role key for admin operations.
// DO NOT import this file in client components.

let _adminSupabase: SupabaseClient | null = null

export const adminSupabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!_adminSupabase) {
      _adminSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        }
      )
    }
    return (_adminSupabase as any)[prop]
  },
})
