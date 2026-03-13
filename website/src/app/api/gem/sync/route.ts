import { NextRequest, NextResponse } from 'next/server'
import { adminSupabase } from '@/lib/supabase-admin'
import {
  getGemUsers,
  getAllEventsForUser,
  calculateOutboundMetrics,
} from '@/lib/gem-client'

// POST /api/gem/sync - Pull outbound metrics from Gem for a given week
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

    // Log sync start
    const { data: syncLog } = await adminSupabase
      .from('gem_sync_log')
      .insert({ sync_type: 'outbound', status: 'started' })
      .select('id')
      .single()

    // Get all Gem users
    const gemUsers = await getGemUsers()

    // Get mapping of Gem user IDs to Mavericks recruiter IDs
    const { data: profiles } = await adminSupabase
      .from('profiles')
      .select('id, gem_user_id')
      .not('gem_user_id', 'is', null)

    const gemToRecruiterMap = new Map<string, string>()
    for (const profile of profiles || []) {
      if (profile.gem_user_id) {
        gemToRecruiterMap.set(profile.gem_user_id, profile.id)
      }
    }

    let totalSynced = 0

    // For each mapped Gem user, pull events and create outbound entries
    for (const gemUser of gemUsers) {
      const recruiterId = gemToRecruiterMap.get(gemUser.id)
      if (!recruiterId) continue // Skip unmapped users

      const events = await getAllEventsForUser(gemUser.id, week_start, week_end)
      const metrics = calculateOutboundMetrics(events)

      // Upsert outbound entry
      const { error } = await adminSupabase
        .from('outbound_entries')
        .upsert(
          {
            recruiter_id: recruiterId,
            week_start,
            week_end,
            source: 'gem',
            outbound_count: metrics.outbound_count,
            emails_replied: metrics.emails_replied,
            interested_count: metrics.interested_count,
          },
          { onConflict: 'recruiter_id,week_start,source' }
        )

      if (!error) totalSynced++
    }

    // Log sync completion
    if (syncLog?.id) {
      await adminSupabase
        .from('gem_sync_log')
        .update({
          status: 'completed',
          records_synced: totalSynced,
          completed_at: new Date().toISOString(),
        })
        .eq('id', syncLog.id)
    }

    return NextResponse.json({
      success: true,
      records_synced: totalSynced,
      gem_users_found: gemUsers.length,
      mapped_users: gemToRecruiterMap.size,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    // Log failure
    await adminSupabase
      .from('gem_sync_log')
      .insert({
        sync_type: 'outbound',
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
