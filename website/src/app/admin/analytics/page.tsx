'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useAuth } from '@/components/admin/AuthContext'
import { usePageTitle } from '@/components/admin/PageTitleContext'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import type { PipelineStage, WeeklyKpiSnapshot } from '@/lib/types'
import { PIPELINE_STAGES, STAGE_LABELS, getFullName } from '@/lib/types'

type Tab = 'performance' | 'outbound' | 'conversions'

const tabs = [
  { key: 'performance', label: 'Performance' },
  { key: 'outbound', label: 'Outbound' },
  { key: 'conversions', label: 'Conversions' },
]

interface RecruiterPerf {
  recruiter_id: string
  recruiter_name: string
  total_hires: number
  active_candidates: number
  interest_rate: number
  total_outbound: number
}

interface OutboundWeek {
  week_start: string
  outbound_count: number
  interested_count: number | null
  emails_replied: number | null
  recruiter_id: string
}

export default function AnalyticsPage() {
  const [tab, setTab] = useState<Tab>('performance')
  const [loading, setLoading] = useState(true)
  const [snapshots, setSnapshots] = useState<WeeklyKpiSnapshot[]>([])
  const [recruiterPerf, setRecruiterPerf] = useState<RecruiterPerf[]>([])
  const [outboundEntries, setOutboundEntries] = useState<OutboundWeek[]>([])
  const [candidates, setCandidates] = useState<{ stage: string; status: string }[]>([])
  const { user, isAdmin } = useAuth()
  const { setHeaderTabs, clearHeaderTabs } = usePageTitle()
  const supabase = createClient()

  const handleTabChange = useCallback((key: string) => {
    setTab(key as Tab)
  }, [])

  useEffect(() => {
    setHeaderTabs(tabs, tab, handleTabChange)
    return () => clearHeaderTabs()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchData() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchData = async () => {
    // Fetch weekly snapshots (last 12 weeks)
    let snapshotQuery = supabase
      .from('weekly_kpi_snapshots')
      .select('*')
      .is('project_id', null)
      .order('week_start', { ascending: true })
      .limit(50)

    if (!isAdmin) {
      snapshotQuery = snapshotQuery.eq('recruiter_id', user!.id)
    }
    const { data: snapshotData } = await snapshotQuery
    setSnapshots((snapshotData || []) as WeeklyKpiSnapshot[])

    // Fetch recruiter performance (admin only for leaderboard)
    if (isAdmin) {
      const { data: perfData } = await supabase
        .from('recruiter_performance')
        .select('*')
      setRecruiterPerf((perfData || []) as RecruiterPerf[])
    }

    // Fetch outbound entries (last 12 weeks)
    let outboundQuery = supabase
      .from('outbound_entries')
      .select('week_start, outbound_count, interested_count, emails_replied, recruiter_id')
      .order('week_start', { ascending: true })
      .limit(100)

    if (!isAdmin) {
      outboundQuery = outboundQuery.eq('recruiter_id', user!.id)
    }
    const { data: outboundData } = await outboundQuery
    setOutboundEntries((outboundData || []) as OutboundWeek[])

    // Fetch candidate stages for pipeline analysis
    let candidateQuery = supabase
      .from('candidates')
      .select('stage, status')
      .not('status', 'in', '(withdrawn)')

    if (!isAdmin) {
      candidateQuery = candidateQuery.eq('recruiter_id', user!.id)
    }
    const { data: candidateData } = await candidateQuery
    setCandidates(candidateData || [])

    setLoading(false)
  }

  if (loading) return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-dark-border/50 rounded-2xl animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-dark-border/50 via-dark-card to-dark-border/50" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map(i => <div key={i} className="h-72 bg-dark-border/50 rounded-2xl animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-dark-border/50 via-dark-card to-dark-border/50" />)}
      </div>
    </div>
  )

  return (
    <div className="p-3 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {tab === 'performance' && <PerformanceTab snapshots={snapshots} recruiterPerf={recruiterPerf} candidates={candidates} isAdmin={isAdmin} />}
      {tab === 'outbound' && <OutboundTab outboundEntries={outboundEntries} />}
      {tab === 'conversions' && <ConversionsTab candidates={candidates} snapshots={snapshots} />}
    </div>
  )
}

// ─── Performance Tab ───
function PerformanceTab({ snapshots, recruiterPerf, candidates, isAdmin }: {
  snapshots: WeeklyKpiSnapshot[]
  recruiterPerf: RecruiterPerf[]
  candidates: { stage: string; status: string }[]
  isAdmin: boolean
}) {
  // Aggregate snapshots by week for the hires trend
  const weeklyHires = useMemo(() => {
    const byWeek = new Map<string, number>()
    for (const s of snapshots) {
      byWeek.set(s.week_start, (byWeek.get(s.week_start) || 0) + s.total_hires)
    }
    return Array.from(byWeek.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-12)
      .map(([week, hires]) => ({
        week: new Date(week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        hires,
      }))
  }, [snapshots])

  // Summary stats
  const totalHires = candidates.filter(c => c.stage === 'accepted').length
  const totalActive = candidates.filter(c => c.status === 'active').length
  const totalInPipeline = candidates.length

  // Latest snapshot conversion rates (average across recruiters)
  const latestWeek = snapshots.length > 0 ? snapshots[snapshots.length - 1].week_start : null
  const latestSnapshots = latestWeek ? snapshots.filter(s => s.week_start === latestWeek) : []
  const avgOfferAcceptance = latestSnapshots.length > 0
    ? Math.round(latestSnapshots.reduce((s, snap) => s + (snap.offer_acceptance_rate || 0), 0) / latestSnapshots.length)
    : 0

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-dark-card rounded-2xl border border-dark-border p-4 md:p-6 opacity-0 animate-fadeIn" style={{ animationDelay: '50ms' }}>
          <p className="text-xs md:text-sm text-dark-text-secondary mb-1">Total in Pipeline</p>
          <p className="text-xl md:text-2xl font-heading font-bold text-dark-text">{totalInPipeline}</p>
        </div>
        <div className="bg-dark-card rounded-2xl border border-dark-border p-4 md:p-6 opacity-0 animate-fadeIn" style={{ animationDelay: '100ms' }}>
          <p className="text-xs md:text-sm text-dark-text-secondary mb-1">Active Candidates</p>
          <p className="text-xl md:text-2xl font-heading font-bold text-accent">{totalActive}</p>
        </div>
        <div className="bg-dark-card rounded-2xl border border-dark-border p-4 md:p-6 opacity-0 animate-fadeIn" style={{ animationDelay: '150ms' }}>
          <p className="text-xs md:text-sm text-dark-text-secondary mb-1">Total Hires</p>
          <p className="text-xl md:text-2xl font-heading font-bold text-green">{totalHires}</p>
        </div>
        <div className="bg-dark-card rounded-2xl border border-dark-border p-4 md:p-6 opacity-0 animate-fadeIn" style={{ animationDelay: '200ms' }}>
          <p className="text-xs md:text-sm text-dark-text-secondary mb-1">Offer Acceptance</p>
          <p className="text-xl md:text-2xl font-heading font-bold text-dark-text">{avgOfferAcceptance}%</p>
        </div>
      </div>

      {/* Hires Trend Chart */}
      <div className="bg-dark-card rounded-2xl border border-dark-border p-4 md:p-6 opacity-0 animate-fadeIn" style={{ animationDelay: '250ms' }}>
        <h3 className="text-base md:text-lg font-heading font-semibold text-dark-text mb-3 md:mb-4">Weekly Hires Trend</h3>
        <div className="h-48 md:h-64">
          {weeklyHires.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyHires}>
                <defs>
                  <linearGradient id="hiresGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#76E59F" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#76E59F" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#332F42" />
                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: '#A29DB7', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#A29DB7', fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: '#3A374A', border: '1px solid #332F42', borderRadius: '12px', color: '#fff' }} />
                <Area type="monotone" dataKey="hires" stroke="#76E59F" strokeWidth={2} fill="url(#hiresGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-dark-text-secondary text-sm">
              No snapshot data yet. Weekly snapshots are generated every Monday.
            </div>
          )}
        </div>
      </div>

      {/* Pipeline Distribution */}
      <div className="bg-dark-card rounded-2xl border border-dark-border p-4 md:p-6 opacity-0 animate-fadeIn" style={{ animationDelay: '300ms' }}>
        <h3 className="text-base md:text-lg font-heading font-semibold text-dark-text mb-3 md:mb-4">Pipeline Distribution</h3>
        <div className="h-48 md:h-64">
          <PipelineDistribution candidates={candidates} />
        </div>
      </div>

      {/* Recruiter Leaderboard (admin only) */}
      {isAdmin && recruiterPerf.length > 0 && (
        <div className="bg-dark-card rounded-2xl border border-dark-border p-4 md:p-6 opacity-0 animate-fadeIn" style={{ animationDelay: '350ms' }}>
          <h3 className="text-base md:text-lg font-heading font-semibold text-dark-text mb-4 md:mb-6">Recruiter Leaderboard</h3>
          <div className="space-y-3 md:space-y-4">
            {[...recruiterPerf].sort((a, b) => b.total_hires - a.total_hires).map((r, i) => {
              const maxHires = recruiterPerf.reduce((m, rp) => Math.max(m, rp.total_hires), 1)
              const width = (r.total_hires / maxHires) * 100
              return (
                <div key={r.recruiter_id} className="flex items-center gap-2 md:gap-4">
                  <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                    <span className="text-xs font-heading font-bold text-accent">{i + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs md:text-sm font-medium text-dark-text truncate">{r.recruiter_name}</span>
                      <span className="text-xs font-heading text-dark-text-secondary shrink-0 ml-2">{r.active_candidates} active</span>
                    </div>
                    <div className="h-6 md:h-8 bg-dark-bg rounded-lg overflow-hidden">
                      <div
                        className="h-full bg-accent/20 rounded-lg flex items-center px-2 md:px-3 transition-all duration-700"
                        style={{ width: `${Math.max(width, 10)}%` }}
                      >
                        <span className="text-[10px] md:text-xs font-heading font-bold text-accent whitespace-nowrap">{r.total_hires} hires</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function PipelineDistribution({ candidates }: { candidates: { stage: string; status: string }[] }) {
  const data = PIPELINE_STAGES.map(stage => ({
    stage: STAGE_LABELS[stage],
    count: candidates.filter(c => c.stage === stage).length,
  }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#332F42" vertical={false} />
        <XAxis dataKey="stage" axisLine={false} tickLine={false} tick={{ fill: '#A29DB7', fontSize: 10 }} angle={-30} textAnchor="end" height={50} />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#A29DB7', fontSize: 11 }} allowDecimals={false} />
        <Tooltip contentStyle={{ backgroundColor: '#3A374A', border: '1px solid #332F42', borderRadius: '12px', color: '#fff' }} />
        <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="#7052F5" />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ─── Outbound Tab ───
function OutboundTab({ outboundEntries }: { outboundEntries: OutboundWeek[] }) {
  // Aggregate outbound by week
  const weeklyOutbound = useMemo(() => {
    const byWeek = new Map<string, { outbound: number; interested: number; replied: number }>()
    for (const e of outboundEntries) {
      const existing = byWeek.get(e.week_start) || { outbound: 0, interested: 0, replied: 0 }
      existing.outbound += e.outbound_count || 0
      existing.interested += e.interested_count || 0
      existing.replied += e.emails_replied || 0
      byWeek.set(e.week_start, existing)
    }
    return Array.from(byWeek.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-12)
      .map(([week, data]) => ({
        week: new Date(week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        outbound: data.outbound,
        interested: data.interested,
        replied: data.replied,
        interestRate: data.outbound > 0 ? Math.round((data.interested / data.outbound) * 100) : 0,
      }))
  }, [outboundEntries])

  // Totals
  const totalOutbound = outboundEntries.reduce((s, e) => s + (e.outbound_count || 0), 0)
  const totalInterested = outboundEntries.reduce((s, e) => s + (e.interested_count || 0), 0)
  const totalReplied = outboundEntries.reduce((s, e) => s + (e.emails_replied || 0), 0)
  const overallInterestRate = totalOutbound > 0 ? Math.round((totalInterested / totalOutbound) * 100) : 0
  const overallReplyRate = totalOutbound > 0 ? Math.round((totalReplied / totalOutbound) * 100) : 0

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-dark-card rounded-2xl border border-dark-border p-4 md:p-6 opacity-0 animate-fadeIn" style={{ animationDelay: '50ms' }}>
          <p className="text-xs md:text-sm text-dark-text-secondary mb-1">Total Outbound</p>
          <p className="text-xl md:text-2xl font-heading font-bold text-dark-text">{totalOutbound.toLocaleString()}</p>
        </div>
        <div className="bg-dark-card rounded-2xl border border-dark-border p-4 md:p-6 opacity-0 animate-fadeIn" style={{ animationDelay: '100ms' }}>
          <p className="text-xs md:text-sm text-dark-text-secondary mb-1">Interested</p>
          <p className="text-xl md:text-2xl font-heading font-bold text-accent">{totalInterested.toLocaleString()}</p>
        </div>
        <div className="bg-dark-card rounded-2xl border border-dark-border p-4 md:p-6 opacity-0 animate-fadeIn" style={{ animationDelay: '150ms' }}>
          <p className="text-xs md:text-sm text-dark-text-secondary mb-1">Interest Rate</p>
          <p className="text-xl md:text-2xl font-heading font-bold text-green">{overallInterestRate}%</p>
        </div>
        <div className="bg-dark-card rounded-2xl border border-dark-border p-4 md:p-6 opacity-0 animate-fadeIn" style={{ animationDelay: '200ms' }}>
          <p className="text-xs md:text-sm text-dark-text-secondary mb-1">Reply Rate</p>
          <p className="text-xl md:text-2xl font-heading font-bold text-dark-text">{overallReplyRate}%</p>
        </div>
      </div>

      {/* Outbound Volume Chart */}
      <div className="bg-dark-card rounded-2xl border border-dark-border p-4 md:p-6 opacity-0 animate-fadeIn" style={{ animationDelay: '250ms' }}>
        <h3 className="text-base md:text-lg font-heading font-semibold text-dark-text mb-3 md:mb-4">Weekly Outbound Volume</h3>
        <div className="h-48 md:h-64">
          {weeklyOutbound.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyOutbound}>
                <CartesianGrid strokeDasharray="3 3" stroke="#332F42" vertical={false} />
                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: '#A29DB7', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#A29DB7', fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: '#3A374A', border: '1px solid #332F42', borderRadius: '12px', color: '#fff' }} />
                <Bar dataKey="outbound" name="Outbound" radius={[4, 4, 0, 0]} fill="#7052F5" />
                <Bar dataKey="interested" name="Interested" radius={[4, 4, 0, 0]} fill="#76E59F" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-dark-text-secondary text-sm">
              No outbound data yet. Import LinkedIn CSV or sync from Gem.
            </div>
          )}
        </div>
      </div>

      {/* Interest Rate Trend */}
      <div className="bg-dark-card rounded-2xl border border-dark-border p-4 md:p-6 opacity-0 animate-fadeIn" style={{ animationDelay: '300ms' }}>
        <h3 className="text-base md:text-lg font-heading font-semibold text-dark-text mb-3 md:mb-4">Interest Rate Trend</h3>
        <div className="h-48 md:h-64">
          {weeklyOutbound.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyOutbound}>
                <CartesianGrid strokeDasharray="3 3" stroke="#332F42" />
                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: '#A29DB7', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#A29DB7', fontSize: 11 }} unit="%" />
                <Tooltip contentStyle={{ backgroundColor: '#3A374A', border: '1px solid #332F42', borderRadius: '12px', color: '#fff' }} formatter={(v: number) => [`${v}%`, 'Interest Rate']} />
                <Line type="monotone" dataKey="interestRate" stroke="#7052F5" strokeWidth={2} dot={{ r: 4, fill: '#7052F5' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-dark-text-secondary text-sm">
              No data available
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Conversions Tab ───
function ConversionsTab({ candidates, snapshots }: {
  candidates: { stage: string; status: string }[]
  snapshots: WeeklyKpiSnapshot[]
}) {
  // Calculate conversion rates from current pipeline
  const stageCounts = PIPELINE_STAGES.map(stage =>
    candidates.filter(c => c.stage === stage).length
  )

  const conversions = PIPELINE_STAGES.slice(1).map((stage, i) => {
    const fromCount = candidates.filter(c => PIPELINE_STAGES.indexOf(c.stage as PipelineStage) >= i).length
    const toCount = candidates.filter(c => PIPELINE_STAGES.indexOf(c.stage as PipelineStage) >= i + 1).length
    const rate = fromCount > 0 ? Math.round((toCount / fromCount) * 100) : 0
    return {
      from: STAGE_LABELS[PIPELINE_STAGES[i]],
      to: STAGE_LABELS[stage],
      rate,
    }
  })

  // Projected hires from current pipeline
  const inOffer = candidates.filter(c => c.stage === 'offer').length
  const inFinalRound = candidates.filter(c => c.stage === 'final_round').length
  const inThirdRound = candidates.filter(c => c.stage === 'third_round').length
  // Simple projection based on average conversion
  const avgConversion = conversions.length > 0
    ? conversions.reduce((s, c) => s + c.rate, 0) / conversions.length / 100
    : 0.5
  const projectedFromOffer = Math.round(inOffer * 0.8)
  const projectedFromFinal = Math.round(inFinalRound * 0.6)
  const projectedFromThird = Math.round(inThirdRound * 0.4)
  const projectedTotal = projectedFromOffer + projectedFromFinal + projectedFromThird

  // Weekly conversion trends from snapshots
  const weeklyConversions = useMemo(() => {
    const byWeek = new Map<string, { screenToSubmit: number[]; submitToFirst: number[]; offerAcceptance: number[] }>()
    for (const s of snapshots) {
      const existing = byWeek.get(s.week_start) || { screenToSubmit: [], submitToFirst: [], offerAcceptance: [] }
      if (s.screen_to_submit_rate != null) existing.screenToSubmit.push(s.screen_to_submit_rate)
      if (s.submit_to_first_rate != null) existing.submitToFirst.push(s.submit_to_first_rate)
      if (s.offer_acceptance_rate != null) existing.offerAcceptance.push(s.offer_acceptance_rate)
      byWeek.set(s.week_start, existing)
    }
    return Array.from(byWeek.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-12)
      .map(([week, data]) => ({
        week: new Date(week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        screenToSubmit: data.screenToSubmit.length > 0 ? Math.round(data.screenToSubmit.reduce((a, b) => a + b, 0) / data.screenToSubmit.length) : 0,
        offerAcceptance: data.offerAcceptance.length > 0 ? Math.round(data.offerAcceptance.reduce((a, b) => a + b, 0) / data.offerAcceptance.length) : 0,
      }))
  }, [snapshots])

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Projection Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <div className="bg-dark-card rounded-2xl border border-dark-border p-4 md:p-6 opacity-0 animate-fadeIn" style={{ animationDelay: '100ms' }}>
          <p className="text-xs md:text-sm text-dark-text-secondary mb-1 md:mb-2">Projected Hires (90 days)</p>
          <p className="text-2xl md:text-3xl font-heading font-bold text-accent">{projectedTotal}</p>
          <p className="text-[10px] md:text-xs text-dark-text-secondary mt-1">Based on current pipeline conversion rates</p>
        </div>
        <div className="bg-dark-card rounded-2xl border border-dark-border p-4 md:p-6 opacity-0 animate-fadeIn" style={{ animationDelay: '150ms' }}>
          <p className="text-xs md:text-sm text-dark-text-secondary mb-1 md:mb-2">In Offer Stage</p>
          <p className="text-2xl md:text-3xl font-heading font-bold text-green">{inOffer}</p>
          <p className="text-[10px] md:text-xs text-dark-text-secondary mt-1">~{projectedFromOffer} expected to accept</p>
        </div>
        <div className="bg-dark-card rounded-2xl border border-dark-border p-4 md:p-6 opacity-0 animate-fadeIn" style={{ animationDelay: '200ms' }}>
          <p className="text-xs md:text-sm text-dark-text-secondary mb-1 md:mb-2">In Final Rounds</p>
          <p className="text-2xl md:text-3xl font-heading font-bold text-dark-text">{inFinalRound + inThirdRound}</p>
          <p className="text-[10px] md:text-xs text-dark-text-secondary mt-1">~{projectedFromFinal + projectedFromThird} projected hires</p>
        </div>
      </div>

      {/* Conversion Rates */}
      <div className="bg-dark-card rounded-2xl border border-dark-border p-4 md:p-6 opacity-0 animate-fadeIn" style={{ animationDelay: '250ms' }}>
        <h3 className="text-base md:text-lg font-heading font-semibold text-dark-text mb-3 md:mb-4">Stage-to-Stage Conversion Rates</h3>
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-3 md:gap-4">
          {conversions.map(c => (
            <div key={c.to} className="text-center">
              <div className="relative w-14 h-14 md:w-16 md:h-16 mx-auto mb-2">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#332F42" strokeWidth="3" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#7052F5" strokeWidth="3" strokeDasharray={`${c.rate}, 100`} />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[10px] md:text-xs font-heading font-bold text-dark-text">{c.rate}%</span>
              </div>
              <p className="text-[10px] text-dark-text-secondary leading-tight">{c.from} to {c.to}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Conversion Trend */}
      {weeklyConversions.length > 0 && (
        <div className="bg-dark-card rounded-2xl border border-dark-border p-4 md:p-6 opacity-0 animate-fadeIn" style={{ animationDelay: '300ms' }}>
          <h3 className="text-base md:text-lg font-heading font-semibold text-dark-text mb-3 md:mb-4">Conversion Rate Trends</h3>
          <div className="h-48 md:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyConversions}>
                <CartesianGrid strokeDasharray="3 3" stroke="#332F42" />
                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: '#A29DB7', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#A29DB7', fontSize: 11 }} unit="%" />
                <Tooltip contentStyle={{ backgroundColor: '#3A374A', border: '1px solid #332F42', borderRadius: '12px', color: '#fff' }} />
                <Line type="monotone" dataKey="screenToSubmit" name="Screen to Submit" stroke="#7052F5" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="offerAcceptance" name="Offer Acceptance" stroke="#76E59F" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
