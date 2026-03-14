'use client'

import { useState, useEffect, useCallback } from 'react'
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
  ChevronDownIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { PipelineStage, Project } from '@/lib/types'
import { PIPELINE_STAGES, STAGE_LABELS, stageColors, getFullName } from '@/lib/types'

interface DashboardData {
  candidates: { stage: string; status: string; last_activity_date: string }[]
  projects: Project[]
  weeklySnapshots: { week_start: string; total_hires: number }[]
  outboundWeekly: { week_start: string; outbound_count: number; interested_count: number | null }[]
  recentActivity: { id: string; candidate_name: string; from_stage: string | null; to_stage: string; changed_at: string; notes: string | null; changer_name: string | null }[]
  topPerformers: { recruiter_id: string; recruiter_name: string; total_hires: number; active_candidates: number }[]
  unactionedPoolCount: number
}

function MetricCard({ label, value, subValue, icon: Icon, color, delay }: {
  label: string; value: string; subValue?: string; icon: any; color: string; delay: number
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
      <p className="text-2xl font-heading font-bold text-dark-text">{value}</p>
      {subValue && <p className="text-[10px] text-accent mt-0.5">{subValue}</p>}
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
    unactionedPoolCount: 0,
  })
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [recruiterProjects, setRecruiterProjects] = useState<Project[]>([])
  const { user, isAdmin } = useAuth()
  const supabase = createClient()

  // On mount, fetch the recruiter's assigned projects
  useEffect(() => {
    const fetchRecruiterProjects = async () => {
      if (!user) return

      if (isAdmin) {
        // Admin fetches all active projects
        const { data: projects } = await supabase
          .from('projects')
          .select('*')
          .eq('status', 'active')
          .order('name')
        setRecruiterProjects(projects || [])
      } else {
        // Recruiter fetches their assigned projects
        const { data: assignments } = await supabase
          .from('project_assignments')
          .select('project_id, project:projects(*)')
          .eq('recruiter_id', user.id)

        const projects = (assignments || [])
          .map((a: any) => a.project)
          .filter((p: any) => p && p.status === 'active') as Project[]
        setRecruiterProjects(projects)

        // Auto-select if recruiter has exactly one project
        if (projects.length === 1) {
          setSelectedProjectId(projects[0].id)
          setSelectedProject(projects[0])
        }
      }
    }

    fetchRecruiterProjects()
  }, [user, isAdmin]) // eslint-disable-line react-hooks/exhaustive-deps

  // Update selectedProject when selection changes
  useEffect(() => {
    if (selectedProjectId) {
      const proj = recruiterProjects.find(p => p.id === selectedProjectId) || null
      setSelectedProject(proj)
    } else {
      setSelectedProject(null)
    }
  }, [selectedProjectId, recruiterProjects])

  const fetchDashboard = useCallback(async () => {
    try {
      const proj = selectedProjectId
        ? recruiterProjects.find(p => p.id === selectedProjectId) || null
        : null

      // Fetch candidates - filter by project if selected
      let candidateQuery = supabase
        .from('candidates')
        .select('stage, status, last_activity_date')
        .not('status', 'in', '(withdrawn)')
      if (!isAdmin) candidateQuery = candidateQuery.eq('recruiter_id', user!.id)
      if (selectedProjectId) candidateQuery = candidateQuery.eq('project_id', selectedProjectId)
      const { data: candidateData } = await candidateQuery

      // Fetch active projects
      const { data: projectData } = await supabase
        .from('projects')
        .select('id, name, client_name, status, hire_goal, start_date, end_date')
        .eq('status', 'active')

      // Fetch weekly snapshots - filter by project and date range
      let snapshotQuery = supabase
        .from('weekly_kpi_snapshots')
        .select('week_start, total_hires')
        .order('week_start', { ascending: true })
        .limit(24)
      if (!isAdmin) snapshotQuery = snapshotQuery.eq('recruiter_id', user!.id)
      if (selectedProjectId) {
        snapshotQuery = snapshotQuery.eq('project_id', selectedProjectId)
      } else {
        snapshotQuery = snapshotQuery.is('project_id', null)
      }
      if (proj) {
        snapshotQuery = snapshotQuery.gte('week_start', proj.start_date).lte('week_start', proj.end_date)
      }
      const { data: snapshotData } = await snapshotQuery

      // Fetch outbound data - filter by project and date range
      let outboundQuery = supabase
        .from('outbound_entries')
        .select('week_start, outbound_count, interested_count')
        .order('week_start', { ascending: true })
        .limit(50)
      if (!isAdmin) outboundQuery = outboundQuery.eq('recruiter_id', user!.id)
      if (selectedProjectId) outboundQuery = outboundQuery.eq('project_id', selectedProjectId)
      if (proj) {
        outboundQuery = outboundQuery.gte('week_start', proj.start_date).lte('week_start', proj.end_date)
      }
      const { data: outboundData } = await outboundQuery

      // Fetch recent stage changes - get more rows to allow client-side filtering
      let activityQuery = supabase
        .from('candidate_stage_history')
        .select('id, from_stage, to_stage, changed_at, notes, candidate:candidates(candidate_name, project_id, recruiter_id), changer:profiles!candidate_stage_history_changed_by_fkey(first_name, last_name)')
        .order('changed_at', { ascending: false })
        .limit(50)
      const { data: activityData } = await activityQuery

      // Filter activity: by recruiter for non-admins, by project if selected
      let filteredActivity = (activityData || []) as any[]
      if (!isAdmin) {
        filteredActivity = filteredActivity.filter((a: any) => a.candidate?.recruiter_id === user!.id)
      }
      if (selectedProjectId) {
        filteredActivity = filteredActivity.filter((a: any) => a.candidate?.project_id === selectedProjectId)
      }
      filteredActivity = filteredActivity.slice(0, 10)

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

      // Count unactioned shared candidates for current user
      let unactionedPoolCount = 0
      if (user) {
        const { count: totalRejected } = await supabase
          .from('candidates')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'rejected')
          .neq('recruiter_id', user.id)

        const { count: userClaims } = await supabase
          .from('candidate_claims')
          .select('*', { count: 'exact', head: true })
          .eq('recruiter_id', user.id)

        unactionedPoolCount = Math.max(0, (totalRejected || 0) - (userClaims || 0))
      }

      setData({
        candidates: candidateData || [],
        projects: (projectData || []) as Project[],
        weeklySnapshots: snapshotData || [],
        outboundWeekly: outboundData || [],
        recentActivity: filteredActivity.map((a: any) => ({
          id: a.id,
          candidate_name: a.candidate?.candidate_name || 'Unknown',
          from_stage: a.from_stage,
          to_stage: a.to_stage,
          changed_at: a.changed_at,
          notes: a.notes || null,
          changer_name: a.changer ? [a.changer.first_name, a.changer.last_name].filter(Boolean).join(' ') : null,
        })),
        topPerformers,
        unactionedPoolCount,
      })
    } catch (err) {
      console.error('Dashboard fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [supabase, isAdmin, user, selectedProjectId, recruiterProjects])

  useEffect(() => { fetchDashboard() }, [fetchDashboard])

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

  // Hire goal progress (when project selected)
  const hireGoal = selectedProject?.hire_goal || 0
  const hireProgress = hireGoal > 0 ? Math.round((totalHires / hireGoal) * 100) : 0

  // On-track calculation
  let onTrackStatus: 'on_track' | 'behind' | 'ahead' | null = null
  if (selectedProject && hireGoal > 0) {
    const start = new Date(selectedProject.start_date).getTime()
    const end = new Date(selectedProject.end_date).getTime()
    const now = Date.now()
    const timeProgress = Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100))
    if (hireProgress >= timeProgress + 10) onTrackStatus = 'ahead'
    else if (hireProgress >= timeProgress - 10) onTrackStatus = 'on_track'
    else onTrackStatus = 'behind'
  }

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
      {/* Project Selector */}
      {recruiterProjects.length > 0 && (
        <div className="flex items-center gap-3 mb-4 opacity-0 animate-fadeIn" style={{ animationDelay: '20ms' }}>
          <div className="relative">
            <select
              value={selectedProjectId || ''}
              onChange={e => setSelectedProjectId(e.target.value || null)}
              className="appearance-none bg-dark-card border border-dark-border rounded-xl pl-3 pr-8 py-2 text-sm text-dark-text focus:outline-none focus:border-accent transition-colors cursor-pointer"
            >
              <option value="">All Projects</option>
              {recruiterProjects.map(p => (
                <option key={p.id} value={p.id}>{p.name} - {p.client_name}</option>
              ))}
            </select>
            <ChevronDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-text-secondary pointer-events-none" />
          </div>
        </div>
      )}

      {/* Project Context Banner */}
      {selectedProject && (
        <div className="bg-dark-card rounded-2xl border border-dark-border p-4 mb-4 opacity-0 animate-fadeIn" style={{ animationDelay: '30ms' }}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-heading font-semibold text-dark-text">{selectedProject.name}</h2>
              <p className="text-xs text-dark-text-secondary mt-0.5">{selectedProject.client_name}</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div>
                <span className="text-dark-text-secondary">Period: </span>
                <span className="text-dark-text">
                  {new Date(selectedProject.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  {' - '}
                  {new Date(selectedProject.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <div>
                <span className="text-dark-text-secondary">Hires: </span>
                <span className="text-dark-text font-heading font-semibold">{totalHires}</span>
                <span className="text-dark-text-secondary"> / {hireGoal}</span>
              </div>
              {onTrackStatus && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-heading font-semibold ${
                  onTrackStatus === 'ahead' ? 'bg-green/10 text-green' :
                  onTrackStatus === 'on_track' ? 'bg-blue-500/10 text-blue-400' :
                  'bg-error/10 text-error'
                }`}>
                  {onTrackStatus === 'ahead' ? 'Ahead' :
                   onTrackStatus === 'on_track' ? 'On Track' :
                   'Behind'}
                </span>
              )}
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-3 h-1.5 bg-dark-bg rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                hireProgress >= 100 ? 'bg-green' :
                onTrackStatus === 'behind' ? 'bg-error' :
                'bg-accent'
              }`}
              style={{ width: `${Math.min(100, hireProgress)}%` }}
            />
          </div>
          <p className="text-[10px] text-dark-text-secondary mt-1">{hireProgress}% of hire goal</p>
        </div>
      )}

      {/* Unactioned Candidates Alert */}
      {data.unactionedPoolCount > 0 && (
        <Link
          href="/admin/candidate-pool"
          className="flex items-center gap-3 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl px-4 py-3 mb-4 hover:border-yellow-500/40 transition-colors opacity-0 animate-fadeIn"
          style={{ animationDelay: '40ms' }}
        >
          <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400 shrink-0" />
          <p className="text-xs text-yellow-400">
            <span className="font-semibold">{data.unactionedPoolCount}</span> shared candidate{data.unactionedPoolCount !== 1 ? 's' : ''} awaiting your review
          </p>
          <ArrowRightIcon className="w-3.5 h-3.5 text-yellow-400/60 ml-auto" />
        </Link>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-6">
        <MetricCard label="Active Candidates" value={totalActive.toString()} icon={UsersIcon} color="bg-accent/10 text-accent" delay={50} />
        <MetricCard
          label={selectedProject ? 'Project' : 'Active Projects'}
          value={selectedProject ? '1' : activeProjects.toString()}
          icon={BriefcaseIcon}
          color="bg-blue-500/10 text-blue-400"
          delay={80}
        />
        <MetricCard
          label="Total Hires"
          value={totalHires.toString()}
          subValue={hireGoal > 0 ? `of ${hireGoal} goal` : undefined}
          icon={CheckCircleIcon}
          color="bg-green/10 text-green"
          delay={110}
        />
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
              <h2 className="text-sm font-heading font-semibold text-dark-text">Pipeline Overview</h2>
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
                    <span className="text-xs font-heading font-semibold text-dark-text w-5 text-right">{count}</span>
                  </div>
                )
              })}
            </div>
          </Link>

          <div className="bg-dark-card rounded-2xl border border-dark-border p-5 opacity-0 animate-fadeIn" style={{ animationDelay: '310ms' }}>
            <h2 className="text-sm font-heading font-semibold text-dark-text mb-3">Quick Actions</h2>
            <div className="space-y-2">
              <QuickAction label="View full pipeline" href="/admin/pipeline" />
              <QuickAction label="Analytics & conversions" href="/admin/analytics" />
              <QuickAction label="Outbound tracker" href="/admin/outreach" />
              {isAdmin && <QuickAction label="Manage projects" href="/admin/projects" />}
              {isAdmin && <QuickAction label="Team performance" href="/admin/team" />}
            </div>
          </div>
        </div>

        {/* Center Column - Charts */}
        <div className="space-y-4">
          {/* Outbound Trend */}
          <div className="bg-dark-card rounded-2xl border border-dark-border p-5 opacity-0 animate-fadeIn" style={{ animationDelay: '260ms' }}>
            <h2 className="text-sm font-heading font-semibold text-dark-text mb-3">Outbound Over Time</h2>
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
                    <Tooltip contentStyle={{ backgroundColor: '#3A374A', border: '1px solid #332F42', borderRadius: '12px', color: '#fff' }} />
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
            <h2 className="text-sm font-heading font-semibold text-dark-text mb-3">Hires Over Time</h2>
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
                    <Tooltip contentStyle={{ backgroundColor: '#3A374A', border: '1px solid #332F42', borderRadius: '12px', color: '#fff' }} />
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
            <h2 className="text-sm font-heading font-semibold text-dark-text mb-3">Recent Activity</h2>
            <div className="space-y-3 max-h-[280px] overflow-y-auto">
              {data.recentActivity.length > 0 ? data.recentActivity.map((item) => {
                const isSourcing = item.from_stage === null
                return (
                  <div key={item.id} className="flex items-start gap-2.5">
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                      isSourcing ? 'bg-cyan-400' :
                      item.to_stage === 'accepted' ? 'bg-green' :
                      item.to_stage === 'offer' ? 'bg-accent' :
                      item.to_stage === 'rejected' ? 'bg-error' :
                      'bg-blue-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-dark-text leading-relaxed">
                        {isSourcing ? (
                          <>
                            {item.changer_name && <span className="font-medium text-accent">{item.changer_name}</span>}
                            {item.changer_name ? ' sourced ' : 'Sourced '}
                            <span className="font-medium">{item.candidate_name}</span>
                            {item.notes && <span className="text-dark-text-secondary"> - {item.notes}</span>}
                          </>
                        ) : (
                          <>
                            <span className="font-medium">{item.candidate_name}</span>
                            {' '}moved to{' '}
                            <span className="text-accent">{STAGE_LABELS[item.to_stage as PipelineStage] || item.to_stage}</span>
                          </>
                        )}
                      </p>
                      <p className="text-[10px] text-dark-text-secondary mt-0.5">
                        {new Date(item.changed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                )
              }) : (
                <p className="text-xs text-dark-text-secondary text-center py-4">No recent activity</p>
              )}
            </div>
          </div>

          {/* Top Performers (admin only) */}
          {isAdmin && data.topPerformers.length > 0 && (
            <div className="bg-dark-card rounded-2xl border border-dark-border p-5 opacity-0 animate-fadeIn" style={{ animationDelay: '370ms' }}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-heading font-semibold text-dark-text">Top Performers</h2>
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
                          <span className="text-xs text-dark-text truncate">{r.recruiter_name}</span>
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
              <h2 className="text-sm font-heading font-semibold text-dark-text">Active Projects</h2>
              {isAdmin && <Link href="/admin/projects" className="text-[10px] text-dark-text-secondary hover:text-accent transition-colors">View all</Link>}
            </div>
            <div className="space-y-2.5">
              {data.projects.length > 0 ? data.projects.slice(0, 5).map(p => (
                <div key={p.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs text-dark-text truncate">{p.name}</span>
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
      className="flex items-center justify-between px-3 py-2.5 bg-dark-bg rounded-xl border border-dark-border text-dark-text text-xs hover:border-accent/30 transition-all group"
    >
      <span>{label}</span>
      <ArrowRightIcon className="w-3.5 h-3.5 text-dark-text-secondary group-hover:text-accent transition-colors" />
    </Link>
  )
}
