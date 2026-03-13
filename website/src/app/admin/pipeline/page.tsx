'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useAuth } from '@/components/admin/AuthContext'
import { usePageTitle } from '@/components/admin/PageTitleContext'
import type { Candidate, PipelineStage } from '@/lib/types'
import { PIPELINE_STAGES, STAGE_LABELS, stageColors, getFullName } from '@/lib/types'
import {
  MagnifyingGlassIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'

type ViewMode = 'kanban' | 'funnel'

export default function PipelinePage() {
  const [view, setView] = useState<ViewMode>('kanban')
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])
  const [recruiters, setRecruiters] = useState<{ id: string; first_name: string; last_name: string }[]>([])
  const [search, setSearch] = useState('')
  const [projectFilter, setProjectFilter] = useState('')
  const [recruiterFilter, setRecruiterFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const { user, isAdmin } = useAuth()
  const { setHeaderTabs, clearHeaderTabs } = usePageTitle()
  const supabase = createClient()

  const handleViewChange = useCallback((key: string) => {
    setView(key as ViewMode)
  }, [])

  useEffect(() => {
    setHeaderTabs(
      [{ key: 'kanban', label: 'Kanban' }, { key: 'funnel', label: 'Funnel' }],
      view,
      handleViewChange,
    )
    return () => clearHeaderTabs()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    // Fetch candidates
    let query = supabase
      .from('candidates')
      .select('*, recruiter:profiles!candidates_recruiter_id_fkey(first_name, last_name)')
      .not('status', 'in', '(withdrawn)')
      .order('last_activity_date', { ascending: false })

    if (!isAdmin) {
      query = query.eq('recruiter_id', user!.id)
    }

    const { data: candidateData } = await query
    setCandidates((candidateData || []) as Candidate[])

    // Fetch projects for filter
    const { data: projectData } = await supabase
      .from('projects')
      .select('id, name')
      .eq('status', 'active')
    setProjects(projectData || [])

    // Fetch recruiters for filter (admin only)
    if (isAdmin) {
      const { data: recruiterData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('role', 'recruiter')
        .eq('is_active', true)
      setRecruiters(recruiterData || [])
    }

    setLoading(false)
  }

  const updateCandidateStage = async (candidateId: string, newStage: PipelineStage) => {
    await supabase
      .from('candidates')
      .update({ stage: newStage })
      .eq('id', candidateId)

    setCandidates(prev =>
      prev.map(c => c.id === candidateId ? { ...c, stage: newStage } : c)
    )
  }

  const filtered = useMemo(() => {
    return candidates.filter(c => {
      if (search) {
        const q = search.toLowerCase()
        if (!c.candidate_name.toLowerCase().includes(q) &&
            !c.role.toLowerCase().includes(q) &&
            !c.company?.toLowerCase().includes(q)) return false
      }
      if (projectFilter && c.project_id !== projectFilter) return false
      if (recruiterFilter && c.recruiter_id !== recruiterFilter) return false
      return true
    })
  }, [candidates, search, projectFilter, recruiterFilter])

  if (loading) return (
    <div className="p-3 md:p-6 lg:p-8 max-w-full mx-auto">
      <div className="flex gap-4">
        {[1, 2, 3, 4, 5].map(i => <div key={i} className="w-60 md:w-72 h-96 shrink-0 bg-dark-border/50 rounded-2xl animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-dark-border/50 via-dark-card to-dark-border/50" />)}
      </div>
    </div>
  )

  return (
    <div className="p-3 md:p-6 lg:p-8 max-w-full mx-auto">
      {/* Filters */}
      <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-2 md:gap-3 mb-4 md:mb-6 opacity-0 animate-fadeIn" style={{ animationDelay: '100ms' }}>
        <div className="relative sm:flex-1 sm:min-w-[200px] sm:max-w-sm">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-text-secondary" />
          <input
            type="text"
            placeholder="Search candidates..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 md:py-2.5 bg-dark-card border border-dark-border rounded-xl text-white text-sm placeholder-dark-text-secondary focus:outline-none focus:border-accent transition-colors"
          />
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1 sm:flex-none">
            <select
              value={projectFilter}
              onChange={e => setProjectFilter(e.target.value)}
              className="w-full appearance-none pl-3 pr-8 py-2 md:py-2.5 bg-dark-card border border-dark-border rounded-xl text-sm text-white focus:outline-none focus:border-accent transition-colors cursor-pointer"
            >
              <option value="">All Projects</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <ChevronDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-text-secondary pointer-events-none" />
          </div>

          {isAdmin && (
            <div className="relative flex-1 sm:flex-none">
              <select
                value={recruiterFilter}
                onChange={e => setRecruiterFilter(e.target.value)}
                className="w-full appearance-none pl-3 pr-8 py-2 md:py-2.5 bg-dark-card border border-dark-border rounded-xl text-sm text-white focus:outline-none focus:border-accent transition-colors cursor-pointer"
              >
                <option value="">All Recruiters</option>
                {recruiters.map(r => <option key={r.id} value={r.id}>{r.first_name} {r.last_name}</option>)}
              </select>
              <ChevronDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-text-secondary pointer-events-none" />
            </div>
          )}
        </div>
      </div>

      {view === 'kanban' && <KanbanView candidates={filtered} onStageChange={updateCandidateStage} />}
      {view === 'funnel' && <FunnelView candidates={filtered} />}
    </div>
  )
}

// ─── Kanban View ───
function KanbanView({ candidates, onStageChange }: {
  candidates: Candidate[]
  onStageChange: (id: string, stage: PipelineStage) => void
}) {
  const [dragCandidate, setDragCandidate] = useState<string | null>(null)

  const handleDragStart = (candidateId: string) => {
    setDragCandidate(candidateId)
  }

  const handleDrop = (stage: PipelineStage) => {
    if (dragCandidate) {
      onStageChange(dragCandidate, stage)
      setDragCandidate(null)
    }
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 -mx-2 px-2">
      {PIPELINE_STAGES.map((stage, stageIdx) => {
        const stageCandidates = candidates.filter(c => c.stage === stage)
        const colors = stageColors[stage]
        return (
          <div
            key={stage}
            className="flex-shrink-0 w-56 md:w-64 opacity-0 animate-fadeIn"
            style={{ animationDelay: `${150 + stageIdx * 40}ms` }}
            onDragOver={e => e.preventDefault()}
            onDrop={() => handleDrop(stage)}
          >
            {/* Column Header */}
            <div className={`flex items-center gap-2 mb-3 px-3 py-2 rounded-xl ${colors.bg}`}>
              <div className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
              <span className="font-heading font-semibold text-white text-xs">{STAGE_LABELS[stage]}</span>
              <span className="ml-auto text-[10px] font-heading text-dark-text-secondary bg-dark-bg px-2 py-0.5 rounded-full">{stageCandidates.length}</span>
            </div>

            {/* Cards */}
            <div className="space-y-2 min-h-[200px]">
              {stageCandidates.map(candidate => (
                <div
                  key={candidate.id}
                  draggable
                  onDragStart={() => handleDragStart(candidate.id)}
                  className={`bg-dark-card rounded-xl border-l-2 ${colors.border} border border-dark-border p-3 hover:border-accent/30 transition-all cursor-grab active:cursor-grabbing group`}
                >
                  <h3 className="font-heading font-semibold text-white text-xs group-hover:text-accent transition-colors">{candidate.candidate_name}</h3>
                  <p className="text-[10px] text-accent mt-0.5">{candidate.role}</p>
                  <p className="text-[10px] text-dark-text-secondary">
                    {candidate.title}{candidate.company ? ` @ ${candidate.company}` : ''}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    {candidate.school && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-dark-bg rounded text-dark-text-secondary">{candidate.school}</span>
                    )}
                    {candidate.last_activity_date && (
                      <AgeIndicator date={candidate.last_activity_date} />
                    )}
                  </div>
                </div>
              ))}
              {stageCandidates.length === 0 && (
                <div className="text-center py-8 text-dark-text-secondary text-xs border border-dashed border-dark-border rounded-xl">
                  No candidates
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function AgeIndicator({ date }: { date: string }) {
  const days = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))
  const color = days <= 3 ? 'bg-green/10 text-green' : days <= 7 ? 'bg-yellow-500/10 text-yellow-400' : 'bg-error/10 text-error'
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded ${color}`}>
      {days}d
    </span>
  )
}

// ─── Funnel View ───
function FunnelView({ candidates }: { candidates: Candidate[] }) {
  const stageCounts = PIPELINE_STAGES.map(stage => ({
    stage: STAGE_LABELS[stage],
    count: candidates.filter(c => c.stage === stage).length,
  }))

  // Calculate conversion rates between consecutive stages
  const conversions = PIPELINE_STAGES.slice(1).map((stage, i) => {
    const prevStage = PIPELINE_STAGES[i]
    const prevCount = candidates.filter(c => c.stage === prevStage).length
    const currentCount = candidates.filter(c => c.stage === stage).length
    // Use cumulative counts for realistic conversion
    const fromCount = candidates.filter(c => PIPELINE_STAGES.indexOf(c.stage as PipelineStage) >= i).length
    const toCount = candidates.filter(c => PIPELINE_STAGES.indexOf(c.stage as PipelineStage) >= i + 1).length
    const rate = fromCount > 0 ? Math.round((toCount / fromCount) * 100) : 0
    return {
      from: STAGE_LABELS[prevStage],
      to: STAGE_LABELS[stage],
      rate,
    }
  })

  const totalCandidates = candidates.length
  const totalHired = candidates.filter(c => c.stage === 'accepted').length
  const offerAcceptance = candidates.filter(c => c.stage === 'offer' || c.stage === 'accepted').length > 0
    ? Math.round((totalHired / candidates.filter(c => c.stage === 'offer' || c.stage === 'accepted').length) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-dark-card rounded-2xl border border-dark-border p-4 text-center">
          <p className="text-2xl font-heading font-bold text-white">{totalCandidates}</p>
          <p className="text-xs text-dark-text-secondary">Total in Pipeline</p>
        </div>
        <div className="bg-dark-card rounded-2xl border border-dark-border p-4 text-center">
          <p className="text-2xl font-heading font-bold text-green">{totalHired}</p>
          <p className="text-xs text-dark-text-secondary">Accepted</p>
        </div>
        <div className="bg-dark-card rounded-2xl border border-dark-border p-4 text-center">
          <p className="text-2xl font-heading font-bold text-accent">{offerAcceptance}%</p>
          <p className="text-xs text-dark-text-secondary">Offer Acceptance</p>
        </div>
      </div>

      {/* Funnel Bar Chart */}
      <div className="bg-dark-card rounded-2xl border border-dark-border p-5">
        <h3 className="text-sm font-heading font-semibold text-white mb-4">Pipeline Funnel</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stageCounts} layout="vertical">
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#A29DB7', fontSize: 11 }} />
              <YAxis type="category" dataKey="stage" axisLine={false} tickLine={false} tick={{ fill: '#A29DB7', fontSize: 11 }} width={90} />
              <Tooltip contentStyle={{ backgroundColor: '#232228', border: '1px solid #2E2D35', borderRadius: '12px', color: '#fff' }} />
              <Bar dataKey="count" radius={[0, 6, 6, 0]} fill="#7052F5" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Conversion Rates */}
      <div className="bg-dark-card rounded-2xl border border-dark-border p-5">
        <h3 className="text-sm font-heading font-semibold text-white mb-4">Stage-to-Stage Conversion Rates</h3>
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-3">
          {conversions.map(c => (
            <div key={c.to} className="text-center">
              <div className="relative w-14 h-14 mx-auto mb-2">
                <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#2E2D35" strokeWidth="3" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#7052F5" strokeWidth="3" strokeDasharray={`${c.rate}, 100`} />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-heading font-bold text-white">{c.rate}%</span>
              </div>
              <p className="text-[10px] text-dark-text-secondary leading-tight">{c.from} to {c.to}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
