import { NextResponse } from 'next/server'

/**
 * Example cron job endpoint.
 *
 * Configure in vercel.json:
 *   { "crons": [{ "path": "/api/cron/example", "schedule": "0 14 * * *" }] }
 *
 * Vercel sends the CRON_SECRET as a Bearer token automatically.
 */
export async function GET(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Your cron job logic here:
    // - Send daily digest emails
    // - Clean up expired data
    // - Calculate analytics
    // - Check cost thresholds

    console.log('[cron/example] Running at', new Date().toISOString())

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[cron/example] Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
