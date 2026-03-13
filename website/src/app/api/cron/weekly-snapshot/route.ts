import { NextRequest, NextResponse } from 'next/server'
import { adminSupabase } from '@/lib/supabase-admin'

// POST /api/cron/weekly-snapshot
// Creates permanent weekly KPI snapshots for all active recruiters.
// Should run every Monday via Vercel cron.
export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get current week start (Monday)
    const now = new Date()
    const dayOfWeek = now.getDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() + mondayOffset)
    const weekStartStr = weekStart.toISOString().split('T')[0]

    // Get all active recruiters
    const { data: recruiters } = await adminSupabase
      .from('profiles')
      .select('id')
      .eq('role', 'recruiter')
      .eq('is_active', true)

    if (!recruiters || recruiters.length === 0) {
      return NextResponse.json({ message: 'No active recruiters found' })
    }

    let created = 0

    for (const recruiter of recruiters) {
      // Get pipeline counts
      const { data: funnel } = await adminSupabase
        .from('pipeline_funnel')
        .select('*')
        .eq('recruiter_id', recruiter.id)

      // Aggregate across all projects
      const counts = (funnel || []).reduce(
        (acc: Record<string, number>, row: Record<string, number>) => {
          for (const key of Object.keys(row)) {
            if (typeof row[key] === 'number') {
              acc[key] = (acc[key] || 0) + row[key]
            }
          }
          return acc
        },
        {}
      )

      // Get outbound totals for this week
      const { data: outbound } = await adminSupabase
        .from('outbound_entries')
        .select('outbound_count, interested_count, emails_replied')
        .eq('recruiter_id', recruiter.id)
        .eq('week_start', weekStartStr)

      const outboundTotal = (outbound || []).reduce((s, o) => s + (o.outbound_count || 0), 0)
      const interestedTotal = (outbound || []).reduce((s, o) => s + (o.interested_count || 0), 0)
      const repliedTotal = (outbound || []).reduce((s, o) => s + (o.emails_replied || 0), 0)

      // Calculate conversion rates
      const screenToSubmit = (counts.phone_screen || 0) > 0
        ? ((counts.submittal || 0) / counts.phone_screen) * 100 : null
      const submitToFirst = (counts.submittal || 0) > 0
        ? ((counts.first_round || 0) / counts.submittal) * 100 : null
      const firstToOffer = (counts.first_round || 0) > 0
        ? ((counts.offer || 0) / counts.first_round) * 100 : null
      const offerAcceptance = (counts.offer || 0) > 0
        ? ((counts.accepted || 0) / counts.offer) * 100 : null

      await adminSupabase
        .from('weekly_kpi_snapshots')
        .upsert({
          recruiter_id: recruiter.id,
          project_id: null, // org-level snapshot
          week_start: weekStartStr,
          sourced_count: counts.sourced || 0,
          contacted_count: counts.contacted || 0,
          phone_screen_count: counts.phone_screen || 0,
          submittal_count: counts.submittal || 0,
          first_round_count: counts.first_round || 0,
          second_round_count: counts.second_round || 0,
          third_round_count: counts.third_round || 0,
          final_round_count: counts.final_round || 0,
          offer_count: counts.offer || 0,
          accepted_count: counts.accepted || 0,
          outbound_total: outboundTotal,
          interest_rate: outboundTotal > 0 ? (interestedTotal / outboundTotal) * 100 : null,
          reply_rate: outboundTotal > 0 ? (repliedTotal / outboundTotal) * 100 : null,
          screen_to_submit_rate: screenToSubmit,
          submit_to_first_rate: submitToFirst,
          first_to_offer_rate: firstToOffer,
          offer_acceptance_rate: offerAcceptance,
          total_hires: counts.accepted || 0,
        }, { onConflict: 'recruiter_id,project_id,week_start' })

      created++
    }

    return NextResponse.json({
      success: true,
      week_start: weekStartStr,
      snapshots_created: created,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
