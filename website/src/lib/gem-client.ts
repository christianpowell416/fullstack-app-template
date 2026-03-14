// ===========================================
// Gem API Client - Server-side only
// ===========================================
// Pulls outbound metrics and candidate data from Gem.
// API key must be set in GEM_API_KEY env var.
//
// Available endpoints (v0):
//   /users - list team users (flat array, "name" field)
//   /candidates - list candidates with created_by, created_after filters
//   /sequences - list sequences per user
//   /projects - list Gem projects
//   /project_candidate_membership_log - add/remove events per project
//
// NOTE: /candidates/events is DEPRECATED (returns 403).
// We use candidate creation counts as the outbound proxy instead.

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
  name: string // API returns "name", NOT first_name/last_name
}

export interface GemCandidate {
  id: string
  first_name: string
  last_name: string
  company: string | null
  title: string | null
  school: string | null
  location: string | null
  linked_in_handle: string | null
  gem_source: string | null
  sourced_from: string | null
  created_at: number // Unix timestamp
  created_by: string // Gem user ID
  project_ids: string[]
  emails: { email_address: string; is_primary: boolean }[]
  education_info: { school: string; degree: string; field_of_study: string }[]
}

export interface GemProject {
  id: string
  name: string
  is_archived: boolean
  user_id: string
  created_at: number
}

export interface GemMembershipLog {
  action: 'add' | 'remove'
  candidate_id: string
  project_id: string
  timestamp: number
}

// --- API Methods ---

/** List all Gem team users. Returns flat array (NOT paginated wrapper). */
export async function getGemUsers(): Promise<GemUser[]> {
  return gemFetch<GemUser[]>('/users?page_size=100')
}

/**
 * List Gem candidates with filters. Returns flat array.
 * Dates are Unix timestamps (seconds).
 */
export async function getGemCandidates(params: {
  createdBy?: string
  createdAfter?: number  // Unix timestamp (seconds)
  createdBefore?: number // Unix timestamp (seconds)
  page?: number
  pageSize?: number
}): Promise<GemCandidate[]> {
  const searchParams = new URLSearchParams()
  if (params.createdBy) searchParams.set('created_by', params.createdBy)
  if (params.createdAfter) searchParams.set('created_after', String(params.createdAfter))
  if (params.createdBefore) searchParams.set('created_before', String(params.createdBefore))
  searchParams.set('page', String(params.page || 1))
  searchParams.set('page_size', String(params.pageSize || 100))

  return gemFetch<GemCandidate[]>(`/candidates?${searchParams.toString()}`)
}

/**
 * Get ALL candidates created by a specific user in a date range.
 * Handles pagination automatically. Each candidate created = 1 outbound contact.
 */
export async function getAllCandidatesForUser(
  gemUserId: string,
  startTimestamp: number,
  endTimestamp: number
): Promise<GemCandidate[]> {
  const allCandidates: GemCandidate[] = []
  let page = 1
  const pageSize = 100

  while (true) {
    const candidates = await getGemCandidates({
      createdBy: gemUserId,
      createdAfter: startTimestamp,
      createdBefore: endTimestamp,
      page,
      pageSize,
    })

    allCandidates.push(...candidates)

    if (candidates.length < pageSize) break
    page++

    // Safety: max 50 pages (5000 candidates)
    if (page > 50) break
  }

  return allCandidates
}

/**
 * Calculate outbound metrics from candidate creation counts.
 * Each candidate added to Gem = one outbound contact sourced.
 */
export function calculateOutboundMetrics(candidates: GemCandidate[]) {
  return {
    outbound_count: candidates.length,
    // We don't have email open/reply data from the candidates endpoint,
    // so these default to 0. They can be supplemented via manual entry.
    emails_replied: 0,
    interested_count: 0,
    interest_rate: 0,
    reply_rate: 0,
  }
}

/** List Gem projects. Returns flat array. */
export async function getGemProjects(params?: {
  userId?: string
  isArchived?: boolean
}): Promise<GemProject[]> {
  const searchParams = new URLSearchParams()
  if (params?.userId) searchParams.set('user_id', params.userId)
  if (params?.isArchived !== undefined) searchParams.set('is_archived', String(params.isArchived))
  searchParams.set('page_size', '100')

  return gemFetch<GemProject[]>(`/projects?${searchParams.toString()}`)
}

/** Get project candidate membership log (requires project_id or candidate_id). */
export async function getProjectMembershipLog(params: {
  projectId?: string
  candidateId?: string
  page?: number
  pageSize?: number
}): Promise<GemMembershipLog[]> {
  const searchParams = new URLSearchParams()
  if (params.projectId) searchParams.set('project_id', params.projectId)
  if (params.candidateId) searchParams.set('candidate_id', params.candidateId)
  searchParams.set('page', String(params.page || 1))
  searchParams.set('page_size', String(params.pageSize || 100))

  return gemFetch<GemMembershipLog[]>(
    `/project_candidate_membership_log?${searchParams.toString()}`
  )
}
