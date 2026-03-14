import { NextRequest, NextResponse } from 'next/server'
import { adminSupabase } from '@/lib/supabase-admin'
import { runGemSync } from '@/lib/gem-sync'

// POST /api/gem/sync - Pull outbound metrics + auto-import candidates from Gem
// Body: { week_start: string, week_end: string }
// Auth: Requires CRON_SECRET or admin session
export async function POST(request: NextRequest) {
  // Verify authorization
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (authHeader !== `Bearer ${cronSecret}`) {
    // Check if it's an admin user via session cookie
    const { data: { user } } = await adminSupabase.auth.getUser(
      request.headers.get('cookie')?.match(/sb-.*-auth-token=([^;]+)/)?.[1] || ''
    )
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
  }

  try {
    const body = await request.json()
    const { week_start, week_end } = body

    if (!week_start || !week_end) {
      return NextResponse.json(
        { error: 'week_start and week_end are required' },
        { status: 400 }
      )
    }

    const result = await runGemSync(week_start, week_end)
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    await adminSupabase
      .from('gem_sync_log')
      .insert({
        sync_type: 'full_sync',
        status: 'failed',
        error_message: message,
        completed_at: new Date().toISOString(),
      })

    return NextResponse.json(
      { error: `Gem sync failed: ${message}` },
      { status: 500 }
    )
  }
}
