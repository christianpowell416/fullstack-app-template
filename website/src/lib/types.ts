// ===========================================
// Mavericks Phase 1 - Core Types
// ===========================================

// --- Pipeline Stages ---
export const PIPELINE_STAGES = [
  'sourced', 'contacted', 'phone_screen',
  'submittal', 'first_round', 'second_round',
  'third_round', 'final_round', 'offer', 'accepted',
] as const
export type PipelineStage = (typeof PIPELINE_STAGES)[number]

export const TERMINAL_STAGES = ['rejected', 'withdrawn'] as const
export type TerminalStage = (typeof TERMINAL_STAGES)[number]

export type CandidateStage = PipelineStage | TerminalStage

export const STAGE_LABELS: Record<CandidateStage, string> = {
  sourced: 'Sourced',
  contacted: 'Contacted',
  phone_screen: 'Phone Screen',
  submittal: 'Submittal',
  first_round: '1st Round',
  second_round: '2nd Round',
  third_round: '3rd Round',
  final_round: 'Final Round',
  offer: 'Offer',
  accepted: 'Accepted',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
}

// --- Candidate Status ---
export const CANDIDATE_STATUSES = ['active', 'rejected', 'withdrawn', 'hired', 'on_hold'] as const
export type CandidateStatus = (typeof CANDIDATE_STATUSES)[number]

// --- Candidate Sources ---
export const CANDIDATE_SOURCES = ['LinkedIn', 'Referral', 'Indeed', 'Agency', 'Applicant', 'Gem', 'Other'] as const
export type CandidateSource = (typeof CANDIDATE_SOURCES)[number]

// --- User Roles ---
export type UserRole = 'recruiter' | 'admin'

// --- Profile ---
export interface Profile {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  role: UserRole
  gem_user_id: string | null
  phone: string | null
  is_active: boolean
  weekly_outbound_goal: number
  created_at: string
  updated_at: string
}

// --- Project ---
export interface Project {
  id: string
  name: string
  client_name: string
  description: string | null
  start_date: string
  end_date: string
  hire_goal: number
  status: 'active' | 'completed' | 'paused' | 'cancelled'
  created_at: string
  updated_at: string
  created_by: string | null
  // Joined data
  assignments?: ProjectAssignment[]
  recruiter_count?: number
  hires_count?: number
}

export interface ProjectAssignment {
  id: string
  project_id: string
  recruiter_id: string
  individual_hire_goal: number | null
  assigned_at: string
  // Joined data
  recruiter?: Profile
}

// --- Candidate ---
export interface Candidate {
  id: string
  recruiter_id: string
  project_id: string | null

  // Candidate info
  candidate_name: string
  email: string | null
  phone: string | null
  linkedin_url: string | null
  title: string | null
  company: string | null
  school: string | null
  location: string | null

  // Role info
  role: string
  hiring_manager: string | null
  team: string | null

  // Source
  source: CandidateSource
  source_detail: string | null

  // Pipeline
  stage: CandidateStage
  status: CandidateStatus

  // Interview dates
  recruiter_screen_date: string | null
  submitted_date: string | null
  hm_interview_date: string | null
  first_round_date: string | null
  second_round_date: string | null
  third_round_date: string | null
  final_round_date: string | null
  offer_date: string | null
  accepted_date: string | null

  // Notes
  notes: string | null
  additional_notes: string | null
  rejection_reason: string | null

  // Resume
  resume_url: string | null

  // Tracking
  gender_id: number | null
  last_activity_date: string
  created_at: string
  updated_at: string

  // Joined data
  recruiter?: Profile
  project?: Project
}

// --- Stage History ---
export interface CandidateStageHistory {
  id: string
  candidate_id: string
  from_stage: string | null
  to_stage: string
  changed_by: string | null
  changed_at: string
  notes: string | null
}

// --- Outbound Entry ---
export interface OutboundEntry {
  id: string
  recruiter_id: string
  project_id: string | null
  week_start: string
  week_end: string
  outbound_count: number
  emails_opened: number | null
  emails_replied: number | null
  interested_count: number | null
  source: 'manual' | 'gem' | 'linkedin_csv'
  outbound_goal: number | null
  notes: string | null
  created_at: string
  updated_at: string
  // Joined
  recruiter?: Profile
}

// --- Weekly KPI Snapshot ---
export interface WeeklyKpiSnapshot {
  id: string
  recruiter_id: string
  project_id: string | null
  week_start: string

  sourced_count: number
  contacted_count: number
  phone_screen_count: number
  submittal_count: number
  first_round_count: number
  second_round_count: number
  third_round_count: number
  final_round_count: number
  offer_count: number
  accepted_count: number

  outbound_total: number
  interest_rate: number | null
  reply_rate: number | null

  screen_to_submit_rate: number | null
  submit_to_first_rate: number | null
  first_to_offer_rate: number | null
  offer_acceptance_rate: number | null

  total_hires: number
  hire_goal_progress: number | null

  created_at: string
}

// --- Notification ---
export interface Notification {
  id: string
  recipient_id: string
  type: 'candidate_rejected' | 'candidate_claimed' | 'system'
  title: string
  body: string | null
  data: Record<string, unknown>
  is_read: boolean
  created_at: string
}

// --- Candidate Claim ---
export interface CandidateClaim {
  id: string
  candidate_id: string
  recruiter_id: string
  action: 'claimed' | 'passed'
  claimed_at: string
}

// --- Gem Sync Log ---
export interface GemSyncLog {
  id: string
  sync_type: string
  status: 'started' | 'completed' | 'failed'
  records_synced: number | null
  error_message: string | null
  started_at: string
  completed_at: string | null
}

// --- App Settings ---
export interface AppSettings {
  leaderboard_public: boolean
  outbound_tracking_start_date: string
}

// --- Stage Colors ---
export const stageColors: Record<PipelineStage, { border: string; dot: string; bg: string; solid: string }> = {
  sourced:      { border: 'border-gray-500',    dot: 'bg-gray-500',    bg: 'bg-gray-500/10',    solid: 'bg-gray-500' },
  contacted:    { border: 'border-blue-500',    dot: 'bg-blue-500',    bg: 'bg-blue-500/10',    solid: 'bg-blue-500' },
  phone_screen: { border: 'border-cyan-500',    dot: 'bg-cyan-500',    bg: 'bg-cyan-500/10',    solid: 'bg-cyan-500' },
  submittal:    { border: 'border-yellow-500',  dot: 'bg-yellow-500',  bg: 'bg-yellow-500/10',  solid: 'bg-yellow-500' },
  first_round:  { border: 'border-orange-500',  dot: 'bg-orange-500',  bg: 'bg-orange-500/10',  solid: 'bg-orange-500' },
  second_round: { border: 'border-pink-500',    dot: 'bg-pink-500',    bg: 'bg-pink-500/10',    solid: 'bg-pink-500' },
  third_round:  { border: 'border-purple-500',  dot: 'bg-purple-500',  bg: 'bg-purple-500/10',  solid: 'bg-purple-500' },
  final_round:  { border: 'border-accent',      dot: 'bg-accent',      bg: 'bg-accent/10',      solid: 'bg-accent' },
  offer:        { border: 'border-green',        dot: 'bg-green',        bg: 'bg-green/10',        solid: 'bg-green' },
  accepted:     { border: 'border-emerald-500', dot: 'bg-emerald-500', bg: 'bg-emerald-500/10', solid: 'bg-emerald-500' },
}

// --- Helpers ---
export function getInitials(firstName: string | null, lastName: string | null): string {
  const f = firstName?.charAt(0)?.toUpperCase() || ''
  const l = lastName?.charAt(0)?.toUpperCase() || ''
  return f + l || '?'
}

export function getFullName(profile: Pick<Profile, 'first_name' | 'last_name' | 'email'>): string {
  if (profile.first_name || profile.last_name) {
    return [profile.first_name, profile.last_name].filter(Boolean).join(' ')
  }
  return profile.email || 'Unknown'
}
