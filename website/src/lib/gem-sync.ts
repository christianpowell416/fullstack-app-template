// ===========================================
// Gem Sync - Shared logic for auto-import,
// project-level outbound, and activity tracking.
// Called by both the manual POST endpoint and the daily cron.
// ===========================================

import { adminSupabase } from '@/lib/supabase-admin'
import {
  getGemUsers,
  getAllCandidatesForUser,
  getGemProjects,
  type GemCandidate,
} from '@/lib/gem-client'

export interface SyncResult {
  success: boolean
  records_synced: number
  candidates_imported: number
  gem_users_found: number
  mapped_users: number
  details: { gem_user: string; recruiter_id: string; outbound_count: number; imported: number }[]
  error?: string
}

function normalizeLinkedInUrl(handleOrUrl: string | null): string | null {
  if (!handleOrUrl) return null
  let handle = handleOrUrl.trim().toLowerCase()
  // Strip full URL down to handle
  handle = handle.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//i, '')
  handle = handle.replace(/\/+$/, '') // trailing slashes
  if (!handle) return null
  return `https://linkedin.com/in/${handle}`
}

export async function runGemSync(weekStart: string, weekEnd: string): Promise<SyncResult> {
  // Log sync start
  const { data: syncLog } = await adminSupabase
    .from('gem_sync_log')
    .insert({ sync_type: 'full_sync', status: 'started' })
    .select('id')
    .single()

  const startTimestamp = Math.floor(new Date(weekStart).getTime() / 1000)
  const endTimestamp = Math.floor(new Date(weekEnd + 'T23:59:59Z').getTime() / 1000)

  // Get all Gem users
  const gemUsers = await getGemUsers()

  // Get recruiter mappings (gem_user_id -> mavericks profile id)
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

  // Get Gem project -> Mavericks project mapping
  const { data: projectMappings } = await adminSupabase
    .from('projects')
    .select('id, gem_project_id')
    .not('gem_project_id', 'is', null)

  const gemToProjectMap = new Map<string, string>()
  for (const p of projectMappings || []) {
    if (p.gem_project_id) {
      gemToProjectMap.set(p.gem_project_id, p.id)
    }
  }

  let totalSynced = 0
  let totalImported = 0
  const details: SyncResult['details'] = []

  for (const gemUser of gemUsers) {
    const recruiterId = gemToRecruiterMap.get(gemUser.id)
    if (!recruiterId) continue

    const candidates = await getAllCandidatesForUser(gemUser.id, startTimestamp, endTimestamp)

    // --- Feature 1: Auto-import candidates ---
    const imported = await importCandidates(candidates, recruiterId, gemToProjectMap)
    totalImported += imported

    // --- Feature 2: Project-level outbound attribution ---
    await upsertOutboundByProject(candidates, recruiterId, weekStart, weekEnd, gemToProjectMap)

    totalSynced++
    details.push({
      gem_user: gemUser.name,
      recruiter_id: recruiterId,
      outbound_count: candidates.length,
      imported,
    })
  }

  // Log completion
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

  return {
    success: true,
    records_synced: totalSynced,
    candidates_imported: totalImported,
    gem_users_found: gemUsers.length,
    mapped_users: gemToRecruiterMap.size,
    details,
  }
}

// --- Auto-import candidates from Gem ---
async function importCandidates(
  gemCandidates: GemCandidate[],
  recruiterId: string,
  projectMap: Map<string, string>,
): Promise<number> {
  if (gemCandidates.length === 0) return 0

  // Bulk-fetch existing candidates for this recruiter for dedup
  const { data: existing } = await adminSupabase
    .from('candidates')
    .select('gem_candidate_id, linkedin_url, email')
    .eq('recruiter_id', recruiterId)

  const existingGemIds = new Set<string>()
  const existingLinkedIn = new Set<string>()
  const existingEmails = new Set<string>()

  for (const c of existing || []) {
    if (c.gem_candidate_id) existingGemIds.add(c.gem_candidate_id)
    if (c.linkedin_url) existingLinkedIn.add(c.linkedin_url.toLowerCase())
    if (c.email) existingEmails.add(c.email.toLowerCase())
  }

  let imported = 0

  for (const gc of gemCandidates) {
    // Check for duplicates
    if (existingGemIds.has(gc.id)) continue

    const linkedinUrl = normalizeLinkedInUrl(gc.linked_in_handle)
    if (linkedinUrl && existingLinkedIn.has(linkedinUrl.toLowerCase())) continue

    const primaryEmail = gc.emails?.find(e => e.is_primary)?.email_address || gc.emails?.[0]?.email_address || null
    if (primaryEmail && existingEmails.has(primaryEmail.toLowerCase())) continue

    // Resolve Mavericks project from Gem project_ids
    let projectId: string | null = null
    let role = 'Imported from Gem'
    if (gc.project_ids?.length > 0) {
      for (const gpId of gc.project_ids) {
        const mapped = projectMap.get(gpId)
        if (mapped) {
          projectId = mapped
          break
        }
      }
    }

    // If we mapped a project, try to use project name as role
    if (projectId) {
      const { data: proj } = await adminSupabase
        .from('projects')
        .select('name')
        .eq('id', projectId)
        .single()
      if (proj?.name) role = proj.name
    }

    const candidateName = [gc.first_name, gc.last_name].filter(Boolean).join(' ') || 'Unknown'

    const { error } = await adminSupabase
      .from('candidates')
      .insert({
        recruiter_id: recruiterId,
        project_id: projectId,
        gem_candidate_id: gc.id,
        candidate_name: candidateName,
        email: primaryEmail,
        linkedin_url: linkedinUrl,
        title: gc.title || null,
        company: gc.company || null,
        school: gc.school || gc.education_info?.[0]?.school || null,
        location: gc.location || null,
        role,
        source: 'Gem',
        source_detail: gc.gem_source || gc.sourced_from || null,
        stage: 'sourced',
        status: 'active',
      })

    if (!error) {
      imported++
      // Add to dedup sets for remaining candidates in this batch
      existingGemIds.add(gc.id)
      if (linkedinUrl) existingLinkedIn.add(linkedinUrl.toLowerCase())
      if (primaryEmail) existingEmails.add(primaryEmail.toLowerCase())
    }
  }

  return imported
}

// --- Project-level outbound attribution ---
async function upsertOutboundByProject(
  candidates: GemCandidate[],
  recruiterId: string,
  weekStart: string,
  weekEnd: string,
  projectMap: Map<string, string>,
): Promise<void> {
  // Group candidates by their first mapped Mavericks project (or null)
  const byProject = new Map<string | null, number>()

  for (const gc of candidates) {
    let projectId: string | null = null
    if (gc.project_ids?.length > 0) {
      for (const gpId of gc.project_ids) {
        const mapped = projectMap.get(gpId)
        if (mapped) {
          projectId = mapped
          break
        }
      }
    }
    byProject.set(projectId, (byProject.get(projectId) || 0) + 1)
  }

  // Upsert one row per project (plus a null rollup for total)
  const totalOutbound = candidates.length

  // Rollup row (project_id = null) for total
  await adminSupabase
    .from('outbound_entries')
    .upsert(
      {
        recruiter_id: recruiterId,
        week_start: weekStart,
        week_end: weekEnd,
        source: 'gem',
        project_id: null,
        outbound_count: totalOutbound,
        emails_replied: 0,
        interested_count: 0,
      },
      { onConflict: 'idx_outbound_unique_with_project' }
    )

  // Per-project rows
  for (const [projectId, count] of byProject) {
    if (projectId === null) continue // already covered by rollup
    await adminSupabase
      .from('outbound_entries')
      .upsert(
        {
          recruiter_id: recruiterId,
          week_start: weekStart,
          week_end: weekEnd,
          source: 'gem',
          project_id: projectId,
          outbound_count: count,
          emails_replied: 0,
          interested_count: 0,
        },
        { onConflict: 'idx_outbound_unique_with_project' }
      )
  }
}
