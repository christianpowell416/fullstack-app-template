// ===========================================
// Gem API Client - Server-side only
// ===========================================
// Pulls outbound metrics and candidate data from Gem.
// API key must be set in GEM_API_KEY env var.
// Docs: https://api.gem.com/v0/reference

const GEM_BASE_URL = 'https://api.gem.com/v0'

function getApiKey(): string {
  const key = process.env.GEM_API_KEY
  if (!key) {
    throw new Error('GEM_API_KEY environment variable is not set')
  }
  return key
}

async function gemFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${GEM_BASE_URL}${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      'X-API-Key': getApiKey(),
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (res.status === 429) {
    throw new Error('Gem API rate limit exceeded. Try again later.')
  }

  if (!res.ok) {
    const body = await res.text().catch(() => 'Unknown error')
    throw new Error(`Gem API error ${res.status}: ${body}`)
  }

  return res.json()
}

// --- Types ---

export interface GemUser {
  id: string
  email: string
  first_name: string
  last_name: string
}

export interface GemCandidateEvent {
  id: string
  candidate_id: string
  event_type: 'sequences' | 'sequence_replies' | 'manual_touchpoints'
  event_subtype: 'first_outreach' | 'follow_up' | 'reply' | null
  contact_medium: 'inmail' | 'phone_call' | 'text_message' | 'email' | 'meeting' | 'li_connect_request' | null
  reply_status: 'interested' | 'not_interested' | 'later' | null
  created_at: string
  user_id: string
}

export interface GemProject {
  id: string
  name: string
  is_archived: boolean
  user_id: string
}

interface PaginatedResponse<T> {
  data: T[]
}

// --- API Methods ---

/** List all Gem team users */
export async function getGemUsers(): Promise<GemUser[]> {
  const res = await gemFetch<PaginatedResponse<GemUser>>('/users?page_size=100')
  return res.data
}

/** List candidate events (outreach activity) for a date range */
export async function getCandidateEvents(params: {
  userId?: string
  createdAfter?: string   // ISO date
  createdBefore?: string  // ISO date
  page?: number
  pageSize?: number
}): Promise<GemCandidateEvent[]> {
  const searchParams = new URLSearchParams()
  if (params.userId) searchParams.set('created_by', params.userId)
  if (params.createdAfter) searchParams.set('created_after', params.createdAfter)
  if (params.createdBefore) searchParams.set('created_before', params.createdBefore)
  searchParams.set('page', String(params.page || 1))
  searchParams.set('page_size', String(params.pageSize || 100))

  const res = await gemFetch<PaginatedResponse<GemCandidateEvent>>(
    `/candidates/events?${searchParams.toString()}`
  )
  return res.data
}

/** Get all candidate events for a user in a date range (handles pagination) */
export async function getAllEventsForUser(
  gemUserId: string,
  startDate: string,
  endDate: string
): Promise<GemCandidateEvent[]> {
  const allEvents: GemCandidateEvent[] = []
  let page = 1
  const pageSize = 100

  while (true) {
    const events = await getCandidateEvents({
      userId: gemUserId,
      createdAfter: startDate,
      createdBefore: endDate,
      page,
      pageSize,
    })

    allEvents.push(...events)

    if (events.length < pageSize) break
    page++

    // Safety: max 50 pages (5000 events)
    if (page > 50) break
  }

  return allEvents
}

/** Calculate outbound metrics from events */
export function calculateOutboundMetrics(events: GemCandidateEvent[]) {
  const outboundEvents = events.filter(
    e => e.event_type === 'sequences' || e.event_type === 'manual_touchpoints'
  )
  const replyEvents = events.filter(e => e.event_type === 'sequence_replies')
  const interestedEvents = replyEvents.filter(e => e.reply_status === 'interested')

  return {
    outbound_count: outboundEvents.length,
    emails_replied: replyEvents.length,
    interested_count: interestedEvents.length,
    interest_rate: outboundEvents.length > 0
      ? (interestedEvents.length / outboundEvents.length) * 100
      : 0,
    reply_rate: outboundEvents.length > 0
      ? (replyEvents.length / outboundEvents.length) * 100
      : 0,
  }
}

/** List Gem projects */
export async function getGemProjects(params?: {
  userId?: string
  isArchived?: boolean
}): Promise<GemProject[]> {
  const searchParams = new URLSearchParams()
  if (params?.userId) searchParams.set('user_id', params.userId)
  if (params?.isArchived !== undefined) searchParams.set('is_archived', String(params.isArchived))
  searchParams.set('page_size', '100')

  const res = await gemFetch<PaginatedResponse<GemProject>>(
    `/projects?${searchParams.toString()}`
  )
  return res.data
}
