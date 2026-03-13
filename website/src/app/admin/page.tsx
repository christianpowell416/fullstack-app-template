'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-client'
import { useAuth } from '@/components/admin/AuthContext'
import {
  UsersIcon,
  BriefcaseIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ArrowTrendingUpIcon,
  PaperAirplaneIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { PipelineStage } from '@/lib/types'
import { PIPELINE_STAGES, STAGE_LABELS, stageColors, getInitials, getFullName } from '@/lib/types'

interface DashboardData {
  candidates: { stage: string; status: string; last_activity_date: string }[]
  projects: { id: string; name: string; client_name: string; status: string; hire_goal: number }[]
  weeklySnapshots: { week_start: string; total_hires: number }[]
  outboundWeekly: { week_start: string; outbound_count: number; interested_count: number | null }[]
  recentActivity: { id: string; candidate_name: string; from_stage: string | null; to_stage: string; changed_at: string }[]
  topPerformers: { recruiter_id: string; recruiter_name: string; total_hires: number; active_candidates: number }[]
}

function MetricCard({ label, value, icon: Icon, color, delay }: {
  label: string; value: string; icon: any; color: string; delay: number
}) {
  return (
    <div
      className="bg-dark-card rounded-2xl border border-dark-border p-5 opacity-0 animate-fadeIn hover:border-accent/30 transition-colors"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-xl ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-heading font-bold text-white">{value}</p>
      <p className="text-xs text-dark-text-secondary mt-1">{label}</p>
    </div>
  )
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DashboardData>({
    candidates: [],
    projects: [],
    weeklySnapshots: [],
    outboundWeekly: [],
    recentActivity: [],
    topPerformers: [],
  })
  const { user, isAdmin } = useAuth()
  const supabase = createClient()

  useEffect(() => { fetchDashboard() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchDashboard = async () => {
    // Fetch candidates for pipeline counts
    let candidateQuery = supabase
      .from('candidates')
      .select('stage, status, last_activity_date')
      .not('status', 'in', '(withdrawn)')
    if (!isAdmin) candidateQuery = candidateQuery.eq('recruiter_id', user!.id)
    const { data: candidateData } = await candidateQuery

    // Fetch active projects
    const { data: projectData } = await supabase
      .from('projects')
      .select('id, name, client_name, status, hire_goal')
      .eq('status', 'active')

    // Fetch weekly snapshots for trend chart
    let snapshotQuery = supabase
      .from('weekly_kpi_snapshots')
      .select('week_start, total_hires')
      .is('project_id', null)
      .order('week_start', { ascending: true })
      .limit(24)
    if (!isAdmin) snapshotQuery = snapshotQuery.eq('recruiter_id', user!.id)
    const { data: snapshotData } = await snapshotQuery

    // Fetch outbound data for trend
    let outboundQuery = supabase
      .from('outbound_entries')
      .select('week_start, outbound_count, interested_count')
      .order('week_start', { ascending: true })
      .limit(50)
    if (!isAdmin) outboundQuery = outboundQuery.eq('recruiter_id', user!.id)
    const { data: outboundData } = await outboundQuery

    // Fetch recent stage changes
    const { data: activityData } = await supabase
      .from('candidate_stage_history')
      .select('id, from_stage, to_stage, changed_at, candidate:candidates!candidate_stage_history_candidate_id_fkey(candidate_name)')
      .order('changed_at', { ascending: false })
      .limit(10)

    // Fetch top performers (admin only)
    let topPerformers: any[] = []
    if (isAdmin) {
      const { data: perfData } = await supabase
        .from('recruiter_performance')
        .select('*')
      topPerformers = (perfData || [])
        .sort((a: any, b: any) => b.total_hires - a.total_hires)
        .slice(0, 4)
    }

    setData({
      candidates: candidateData || [],
      projects: projectData || [],
      weeklySnapshots: snapshotData || [],
      outboundWeekly: outboundData || [],
      recentActivity: (activityData || []).map((a: any) => ({
        id: a.id,
        candidate_name: a.candidate?.candidate_name || 'Unknown',
        from_stage: a.from_stage,
        to_stage: a.to_stage,
        changed_at: a.changed_at,
      })),
      topPerformers,
    })
    setLoading(false)
  }

  if (loading) return (
    <div className="p-4 md:p-6 max-w-full">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-6">
        {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-24 bg-dark-border/50 rounded-2xl animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-dark-border/50 via-dark-card to-dark-border/50" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr_1fr] gap-4">
        {[1, 2, 3].map(i => <div key={i} className="h-96 bg-dark-border/50 rounded-2xl animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-dark-border/50 via-dark-card to-dark-border/50" />)}
      </div>
    </div>
  )

  // Compute KPIs
  const totalActive = data.candidates.filter(c => c.status === 'active').length
  const activeProjects = data.projects.length
  const totalHires = data.candidates.filter(c => c.stage === 'accepted').length
  const totalOutbound = data.outboundWeekly.reduce((s, e) => s + (e.outbound_count || 0), 0)
  const totalInterested = data.outboundWeekly.reduce((s, e) => s + (e.interested_count || 0), 0)
  const interestRate = totalOutbound > 0 ? Math.round((totalInterested / totalOutbound) * 100) : 0

  // Stage counts for pipeline
  const stageCounts: Record<string, number> = {}
  for (const stage of PIPELINE_STAGES) {
    stageCounts[stage] = data.candidates.filter(c => c.stage === stage).length
  }
  const maxStageCount = Math.max(...Object.values(stageCounts), 1)

  // Aggregate outbound by week for chart
  const outboundByWeek = new Map<string, number>()
  for (const e of data.outboundWeekly) {
    outboundByWeek.set(e.week_start, (outboundByWeek.get(e.week_start) || 0) + e.outbound_count)
  }
  const outboundChartData = Array.from(outboundByWeek.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-12)
    .map(([week, count]) => ({
      week: new Date(week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      outbound: count,
    }))

  // Aggregate hires by week for chart
  const hiresByWeek = new Map<string, number>()
  for (const s of data.weeklySnapshots) {
    hiresByWeek.set(s.week_start, (hiresByWeek.get(s.week_start) || 0) + s.total_hires)
  }
  const hiresChartData = Array.from(hiresByWeek.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-12)
    .map(([week, hires]) => ({
      week: new Date(week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      hires,
    }))

  return (
    <div className="p-3 md:p-4 lg:p-6 max-w-full">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-6">
        <MetricCard label="Active Candidates" value={totalActive.toString()} icon={UsersIcon} color="bg-accent/10 text-accent" delay={50} />
        <MetricCard label="Active Projects" value={activeProjects.toString()} icon={BriefcaseIcon} color="bg-blue-500/10 text-blue-400" delay={80} />
        <MetricCard label="Total Hires" value={totalHires.toString()} icon={CheckCircleIcon} color="bg-green/10 text-green" delay={110} />
        <MetricCard label="Total Outbound" value={totalOutbound.toLocaleString()} icon={PaperAirplaneIcon} color="bg-purple-500/10 text-purple-400" delay={140} />
        <MetricCard label="Interest Rate" value={`${interestRate}%`} icon={SparklesIcon} color="bg-yellow-500/10 text-yellow-400" delay={170} />
        <MetricCard label="In Pipeline" value={data.candidates.length.toString()} icon={ArrowTrendingUpIcon} color="bg-cyan-500/10 text-cyan-400" delay={200} />
      </div>

      {/* 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] xl:grid-cols-[320px_1fr_320px] gap-4">

        {/* Left Column - Pipeline + Quick Actions */}
        <div className="space-y-4">
          <Link href="/admin/pipeline" className="block bg-dark-card rounded-2xl border border-dark-border p-5 opacity-0 animate-fadeIn hover:border-accent/30 transition-all group" style={{ animationDelay: '230ms' }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-heading font-semibold text-white">Pipeline Overview</h2>
              <ArrowRightIcon className="w-3.5 h-3.5 text-dark-text-secondary group-hover:text-accent transition-colors" />
            </div>
            <div className="space-y-2">
              {PIPELINE_STAGES.map((stage) => {
                const count = stageCounts[stage] || 0
                const width = maxStageCount > 0 ? (count / maxStageCount) * 100 : 0
                const colors = stageColors[stage]
                return (
                  <div key={stage} className="flex items-center gap-2">
                    <span className="text-xs text-dark-text-secondary w-20 shrink-0 truncate">{STAGE_LABELS[stage]}</span>
                    <div className="flex-1 h-5 bg-dark-bg rounded overflow-hidden">
                      <div
                        className={`h-full ${colors.solid} rounded transition-all duration-700`}
                        style={{ width: `${width}%` }}
                      />
                    </div>
                    <span className="text-xs font-heading font-semibold text-white w-5 text-right">{count}</span>
                  </div>
                )
              })}
            </div>
          </Link>

          <div className="bg-dark-card rounded-2xl border border-dark-border p-5 opacity-0 animate-fadeIn" style={{ animationDelay: '310ms' }}>
            <h2 className="text-sm font-heading font-semibold text-white mb-3">Quick Actions</h2>
            <div className="space-y-2">
              <QuickAction label="View full pipeline" href="/admin/pipeline" />
              <QuickAction label="Analytics & conversions" href="/admin/analytics" />
              <QuickAction label="Outbound tracker" href="/admin/outreach" />
              <QuickAction label="Manage projects" href="/admin/projects" />
              <QuickAction label="Team performance" href="/admin/team" />
            </div>
          </div>
        </div>

        {/* Center Column - Charts */}
        <div className="space-y-4">
          {/* Outbound Trend */}
          <div className="bg-dark-card rounded-2xl border border-dark-border p-5 opacity-0 animate-fadeIn" style={{ animationDelay: '260ms' }}>
            <h2 className="text-sm font-heading font-semibold text-white mb-3">Outbound Over Time</h2>
            <div className="h-56">
              {outboundChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={outboundChartData}>
                    <defs>
                      <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7052F5" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#7052F5" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: '#A29DB7', fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#A29DB7', fontSize: 11 }} allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#232228', border: '1px solid #2E2D35', borderRadius: '12px', color: '#fff' }} />
                    <Area type="monotone" dataKey="outbound" stroke="#7052F5" strokeWidth={2} fill="url(#purpleGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-dark-text-secondary text-xs">
                  No outbound data yet
                </div>
              )}
            </div>
          </div>

          {/* Hires Trend */}
          <div className="bg-dark-card rounded-2xl border border-dark-border p-5 opacity-0 animate-fadeIn" style={{ animationDelay: '290ms' }}>
            <h2 className="text-sm font-heading font-semibold text-white mb-3">Hires Over Time</h2>
            <div className="h-56">
              {hiresChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={hiresChartData}>
                    <defs>
                      <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#76E59F" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#76E59F" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: '#A29DB7', fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#A29DB7', fontSize: 11 }} allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#232228', border: '1px solid #2E2D35', borderRadius: '12px', color: '#fff' }} />
                    <Area type="monotone" dataKey="hires" stroke="#76E59F" strokeWidth={2} fill="url(#greenGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-dark-text-secondary text-xs">
                  No snapshot data yet
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Activity + Top Performers + Projects */}
        <div className="space-y-4">
          {/* Recent Activity */}
          <div className="bg-dark-card rounded-2xl border border-dark-border p-5 opacity-0 animate-fadeIn" style={{ animationDelay: '340ms' }}>
            <h2 className="text-sm font-heading font-semibold text-white mb-3">Recent Activity</h2>
            <div className="space-y-3 max-h-[280px] overflow-y-auto">
              {data.recentActivity.length > 0 ? data.recentActivity.map((item) => (
                <div key={item.id} className="flex items-start gap-2.5">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                    item.to_stage === 'accepted' ? 'bg-green' :
                    item.to_stage === 'offer' ? 'bg-accent' :
                    item.to_stage === 'rejected' ? 'bg-error' :
                    'bg-blue-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white leading-relaxed">
                      <span className="font-medium">{item.candidate_name}</span>
                      {' '}moved to{' '}
                      <span className="text-accent">{STAGE_LABELS[item.to_stage as PipelineStage] || item.to_stage}</span>
                    </p>
                    <p className="text-[10px] text-dark-text-secondary mt-0.5">
                      {new Date(item.changed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              )) : (
                <p className="text-xs text-dark-text-secondary text-center py-4">No recent activity</p>
              )}
            </div>
          </div>

          {/* Top Performers (admin only) */}
          {isAdmin && data.topPerformers.length > 0 && (
            <div className="bg-dark-card rounded-2xl border border-dark-border p-5 opacity-0 animate-fadeIn" style={{ animationDelay: '370ms' }}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-heading font-semibold text-white">Top Performers</h2>
                <Link href="/admin/team" className="text-[10px] text-dark-text-secondary hover:text-accent transition-colors">View all</Link>
              </div>
              <div className="space-y-3">
                {data.topPerformers.map((r, i) => {
                  const maxHires = data.topPerformers[0]?.total_hires || 1
                  const width = (r.total_hires / maxHires) * 100
                  return (
                    <div key={r.recruiter_id} className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-heading font-bold text-accent">{i + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-white truncate">{r.recruiter_name}</span>
                          <span className="text-[10px] font-heading text-dark-text-secondary ml-2">{r.total_hires}h</span>
                        </div>
                        <div className="h-1.5 bg-dark-bg rounded-full overflow-hidden">
                          <div className="h-full bg-accent/40 rounded-full" style={{ width: `${Math.max(width, 10)}%` }} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Projects Summary */}
          <div className="bg-dark-card rounded-2xl border border-dark-border p-5 opacity-0 animate-fadeIn" style={{ animationDelay: '400ms' }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-heading font-semibold text-white">Active Projects</h2>
              <Link href="/admin/projects" className="text-[10px] text-dark-text-secondary hover:text-accent transition-colors">View all</Link>
            </div>
            <div className="space-y-2.5">
              {data.projects.length > 0 ? data.projects.slice(0, 5).map(p => (
                <div key={p.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs text-white truncate">{p.name}</span>
                  </div>
                  <span className="text-[10px] text-dark-text-secondary shrink-0 ml-2">{p.client_name}</span>
                </div>
              )) : (
                <p className="text-xs text-dark-text-secondary text-center py-2">No active projects</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function QuickAction({ label, href }: { label: string; href: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between px-3 py-2.5 bg-dark-bg rounded-xl border border-dark-border text-white text-xs hover:border-accent/30 transition-all group"
    >
      <span>{label}</span>
      <ArrowRightIcon className="w-3.5 h-3.5 text-dark-text-secondary group-hover:text-accent transition-colors" />
    </Link>
  )
}
