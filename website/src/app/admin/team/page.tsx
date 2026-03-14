'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useAuth } from '@/components/admin/AuthContext'
import type { Profile } from '@/lib/types'
import { getInitials, getFullName } from '@/lib/types'

interface RecruiterWithPerf extends Profile {
  total_hires: number
  active_candidates: number
  interest_rate: number
  total_outbound: number
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-dark-border/50 rounded-xl animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-dark-border/50 via-dark-card to-dark-border/50 ${className}`} />
}

function LoadingSkeleton() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-64" />)}
      </div>
    </div>
  )
}

export default function TeamPage() {
  const [recruiters, setRecruiters] = useState<RecruiterWithPerf[]>([])
  const [loading, setLoading] = useState(true)
  const { isAdmin } = useAuth()
  const supabase = createClient()

  useEffect(() => { fetchData() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchData = async () => {
    // Fetch all active recruiter profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'recruiter')
      .eq('is_active', true)
      .order('first_name')

    // Fetch performance data from the view
    const { data: perfData } = await supabase
      .from('recruiter_performance')
      .select('*')

    const perfMap = new Map<string, { total_hires: number; active_candidates: number; interest_rate: number; total_outbound: number }>()
    for (const p of (perfData || [])) {
      perfMap.set(p.recruiter_id, {
        total_hires: p.total_hires || 0,
        active_candidates: p.active_candidates || 0,
        interest_rate: p.interest_rate || 0,
        total_outbound: p.total_outbound || 0,
      })
    }

    const merged: RecruiterWithPerf[] = (profiles || []).map((profile: Profile) => {
      const perf = perfMap.get(profile.id) || { total_hires: 0, active_candidates: 0, interest_rate: 0, total_outbound: 0 }
      return { ...profile, ...perf }
    })

    setRecruiters(merged)
    setLoading(false)
  }

  if (loading) return <LoadingSkeleton />

  // Summary stats
  const teamSize = recruiters.length
  const totalHires = recruiters.reduce((s, r) => s + r.total_hires, 0)
  const totalActive = recruiters.reduce((s, r) => s + r.active_candidates, 0)
  const avgInterestRate = teamSize > 0
    ? Math.round(recruiters.reduce((s, r) => s + r.interest_rate, 0) / teamSize)
    : 0

  return (
    <div className="p-3 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Team summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        <div className="bg-dark-card rounded-2xl border border-dark-border p-3 md:p-6 opacity-0 animate-fadeIn" style={{ animationDelay: '50ms' }}>
          <p className="text-xs md:text-sm text-dark-text-secondary mb-1">Team Size</p>
          <p className="text-xl md:text-2xl font-heading font-bold text-dark-text">{teamSize}</p>
        </div>
        <div className="bg-dark-card rounded-2xl border border-dark-border p-3 md:p-6 opacity-0 animate-fadeIn" style={{ animationDelay: '100ms' }}>
          <p className="text-xs md:text-sm text-dark-text-secondary mb-1">Total Hires</p>
          <p className="text-xl md:text-2xl font-heading font-bold text-accent">{totalHires}</p>
        </div>
        <div className="bg-dark-card rounded-2xl border border-dark-border p-3 md:p-6 opacity-0 animate-fadeIn" style={{ animationDelay: '150ms' }}>
          <p className="text-xs md:text-sm text-dark-text-secondary mb-1">Active Candidates</p>
          <p className="text-xl md:text-2xl font-heading font-bold text-green">{totalActive}</p>
        </div>
        <div className="bg-dark-card rounded-2xl border border-dark-border p-3 md:p-6 opacity-0 animate-fadeIn" style={{ animationDelay: '200ms' }}>
          <p className="text-xs md:text-sm text-dark-text-secondary mb-1">Avg Interest Rate</p>
          <p className="text-xl md:text-2xl font-heading font-bold text-dark-text">{avgInterestRate}%</p>
        </div>
      </div>

      {/* Recruiter cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {recruiters.map((recruiter, i) => (
          <div
            key={recruiter.id}
            className="bg-dark-card rounded-2xl border border-dark-border p-4 md:p-6 hover:border-accent/30 hover:shadow-card-hover transition-all opacity-0 animate-fadeIn"
            style={{ animationDelay: `${250 + i * 100}ms` }}
          >
            <div className="flex items-start gap-3 md:gap-4 mb-4 md:mb-5">
              {/* Avatar */}
              <div className="w-11 h-11 md:w-14 md:h-14 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
                <span className="text-accent font-heading font-bold text-base md:text-lg">
                  {getInitials(recruiter.first_name, recruiter.last_name)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-heading font-semibold text-dark-text text-base md:text-lg truncate">
                  {getFullName(recruiter)}
                </h3>
                <p className="text-xs md:text-sm text-dark-text-secondary">{recruiter.email}</p>
              </div>
              {/* Status badge */}
              <span className="text-[10px] px-2 py-0.5 bg-green/10 text-green rounded-full shrink-0">Active</span>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <StatBox label="Hires" value={recruiter.total_hires.toString()} color="text-accent" />
              <StatBox label="Active Candidates" value={recruiter.active_candidates.toString()} color="text-green" />
              <StatBox label="Total Outbound" value={recruiter.total_outbound.toLocaleString()} color="text-dark-text" />
              <StatBox label="Weekly Goal" value={recruiter.weekly_outbound_goal.toString()} color="text-dark-text" />
            </div>

            {/* Interest rate bar */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-dark-text-secondary">Interest Rate</span>
                <span className="text-xs font-heading font-bold text-dark-text">{recruiter.interest_rate.toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-dark-bg rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(recruiter.interest_rate, 100)}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {recruiters.length === 0 && (
        <div className="text-center py-16">
          <p className="text-dark-text-secondary">No active recruiters found</p>
        </div>
      )}
    </div>
  )
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-dark-bg rounded-xl p-3">
      <p className="text-xs text-dark-text-secondary">{label}</p>
      <p className={`text-lg font-heading font-bold ${color}`}>{value}</p>
    </div>
  )
}
