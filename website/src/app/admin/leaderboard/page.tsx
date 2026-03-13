'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useAuth } from '@/components/admin/AuthContext'
import { TrophyIcon } from '@heroicons/react/24/outline'

interface RecruiterRank {
  recruiter_id: string
  recruiter_name: string
  total_hires: number
  active_candidates: number
  interest_rate: number
  total_outbound: number
}

export default function LeaderboardPage() {
  const [rankings, setRankings] = useState<RecruiterRank[]>([])
  const [loading, setLoading] = useState(true)
  const [leaderboardPublic, setLeaderboardPublic] = useState(false)
  const [tab, setTab] = useState<'hires' | 'interest'>('hires')
  const { user, isAdmin } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    // Check leaderboard visibility setting
    const { data: setting } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'leaderboard_public')
      .single()

    const isPublic = setting?.value === 'true' || setting?.value === true
    setLeaderboardPublic(isPublic)

    // Fetch recruiter performance from the view
    const { data } = await supabase
      .from('recruiter_performance')
      .select('*')

    setRankings((data || []) as RecruiterRank[])
    setLoading(false)
  }

  const toggleVisibility = async () => {
    const newValue = !leaderboardPublic
    await supabase
      .from('app_settings')
      .upsert({ key: 'leaderboard_public', value: JSON.stringify(newValue) })
    setLeaderboardPublic(newValue)
  }

  // If not admin and leaderboard is private, only show current user
  const visibleRankings = (!isAdmin && !leaderboardPublic)
    ? rankings.filter(r => r.recruiter_id === user?.id)
    : rankings

  const sorted = [...visibleRankings].sort((a, b) =>
    tab === 'hires'
      ? b.total_hires - a.total_hires
      : b.interest_rate - a.interest_rate
  )

  const medalColors = ['text-yellow-400', 'text-gray-300', 'text-amber-600']

  if (loading) {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto">
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-dark-border/50 rounded-2xl animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-dark-border/50 via-dark-card to-dark-border/50" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      {/* Toggle tabs */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex bg-dark-card border border-dark-border rounded-xl p-1">
          <button
            onClick={() => setTab('hires')}
            className={`px-4 py-1.5 text-sm rounded-lg transition-colors ${
              tab === 'hires' ? 'bg-accent text-white' : 'text-dark-text-secondary hover:text-white'
            }`}
          >
            Top Hires
          </button>
          <button
            onClick={() => setTab('interest')}
            className={`px-4 py-1.5 text-sm rounded-lg transition-colors ${
              tab === 'interest' ? 'bg-accent text-white' : 'text-dark-text-secondary hover:text-white'
            }`}
          >
            Interest Rate
          </button>
        </div>

        {isAdmin && (
          <button
            onClick={toggleVisibility}
            className="ml-auto text-xs text-dark-text-secondary hover:text-white transition-colors border border-dark-border rounded-lg px-3 py-1.5"
          >
            {leaderboardPublic ? 'Hide from recruiters' : 'Show to recruiters'}
          </button>
        )}
      </div>

      {!isAdmin && !leaderboardPublic && (
        <div className="mb-4 p-3 bg-dark-card border border-dark-border rounded-xl">
          <p className="text-xs text-dark-text-secondary">
            Leaderboard visibility is currently limited. You can only see your own ranking.
          </p>
        </div>
      )}

      {/* Rankings */}
      <div className="space-y-2">
        {sorted.map((r, i) => {
          const isCurrentUser = r.recruiter_id === user?.id
          const value = tab === 'hires' ? r.total_hires : r.interest_rate
          const maxValue = sorted[0] ? (tab === 'hires' ? sorted[0].total_hires : sorted[0].interest_rate) : 1
          const barWidth = maxValue > 0 ? (value / maxValue) * 100 : 0

          return (
            <div
              key={r.recruiter_id}
              className={`bg-dark-card rounded-2xl border p-4 transition-all ${
                isCurrentUser ? 'border-accent/40 shadow-sm' : 'border-dark-border'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Rank */}
                <div className="w-8 text-center shrink-0">
                  {i < 3 ? (
                    <TrophyIcon className={`w-5 h-5 mx-auto ${medalColors[i]}`} />
                  ) : (
                    <span className="text-sm font-heading text-dark-text-secondary">{i + 1}</span>
                  )}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white truncate">{r.recruiter_name}</span>
                    {isCurrentUser && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-accent/10 text-accent rounded-full">You</span>
                    )}
                  </div>
                  <div className="h-1.5 bg-dark-bg rounded-full overflow-hidden mt-1.5">
                    <div
                      className="h-full bg-accent/40 rounded-full transition-all"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>

                {/* Value */}
                <div className="text-right shrink-0">
                  <span className="text-lg font-heading font-bold text-white">
                    {tab === 'hires' ? value : `${value.toFixed(1)}%`}
                  </span>
                  <p className="text-[10px] text-dark-text-secondary">
                    {tab === 'hires' ? 'hires' : 'interest rate'}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {sorted.length === 0 && (
        <div className="text-center py-16">
          <TrophyIcon className="w-12 h-12 text-dark-text-secondary/30 mx-auto mb-3" />
          <p className="text-dark-text-secondary">No ranking data yet</p>
        </div>
      )}
    </div>
  )
}
