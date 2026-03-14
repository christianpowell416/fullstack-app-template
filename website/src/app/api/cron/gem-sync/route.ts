import { NextRequest, NextResponse } from 'next/server'
import { runGemSync } from '@/lib/gem-sync'
import { adminSupabase } from '@/lib/supabase-admin'

// GET /api/cron/gem-sync - Daily automated Gem sync
// Runs via Vercel cron at 7:00 UTC daily.
// Syncs the current week (Monday-Sunday).
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Calculate current week (Monday-Sunday)
    const now = new Date()
    const dayOfWeek = now.getDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const monday = new Date(now)
    monday.setDate(now.getDate() + mondayOffset)
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)

    const weekStart = monday.toISOString().split('T')[0]
    const weekEnd = sunday.toISOString().split('T')[0]

    const result = await runGemSync(weekStart, weekEnd)
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
      { error: `Gem cron sync failed: ${message}` },
      { status: 500 }
    )
  }
}
