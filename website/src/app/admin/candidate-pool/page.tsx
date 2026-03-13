'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useAuth } from '@/components/admin/AuthContext'
import type { Candidate, CandidateClaim } from '@/lib/types'
import { UserPlusIcon, MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline'

export default function CandidatePoolPage() {
  const [candidates, setCandidates] = useState<(Candidate & { claims?: CandidateClaim[] })[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [claimingId, setClaimingId] = useState<string | null>(null)
  const { user } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    fetchRejectedCandidates()
  }, [])

  const fetchRejectedCandidates = async () => {
    const { data } = await supabase
      .from('candidates')
      .select(`
        *,
        recruiter:profiles!candidates_recruiter_profile_fkey(first_name, last_name),
        claims:candidate_claims(*)
      `)
      .eq('status', 'rejected')
      .order('updated_at', { ascending: false })

    setCandidates((data || []) as any)
    setLoading(false)
  }

  const claimCandidate = async (candidateId: string) => {
    if (!user) return
    setClaimingId(candidateId)

    const { error } = await supabase
      .from('candidate_claims')
      .insert({
        candidate_id: candidateId,
        recruiter_id: user.id,
        action: 'claimed',
      })

    if (!error) {
      // Refresh the list
      fetchRejectedCandidates()
    }
    setClaimingId(null)
  }

  const passCandidate = async (candidateId: string) => {
    if (!user) return

    await supabase
      .from('candidate_claims')
      .insert({
        candidate_id: candidateId,
        recruiter_id: user.id,
        action: 'passed',
      })

    fetchRejectedCandidates()
  }

  const filteredCandidates = candidates.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      c.candidate_name.toLowerCase().includes(q) ||
      c.company?.toLowerCase().includes(q) ||
      c.title?.toLowerCase().includes(q) ||
      c.role.toLowerCase().includes(q) ||
      c.school?.toLowerCase().includes(q)
    )
  })

  const hasUserActioned = (candidate: Candidate & { claims?: CandidateClaim[] }) => {
    return candidate.claims?.some(cl => cl.recruiter_id === user?.id)
  }

  const getUserClaim = (candidate: Candidate & { claims?: CandidateClaim[] }) => {
    return candidate.claims?.find(cl => cl.recruiter_id === user?.id)
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-48 bg-dark-border/50 rounded-2xl animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-dark-border/50 via-dark-card to-dark-border/50" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6">
      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-text-secondary" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, company, role, school..."
            className="w-full bg-dark-card border border-dark-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-dark-text-secondary/50 focus:outline-none focus:border-accent transition-colors"
          />
        </div>
        <p className="text-xs text-dark-text-secondary mt-2">
          {filteredCandidates.length} rejected candidate{filteredCandidates.length !== 1 ? 's' : ''} available
        </p>
      </div>

      {/* Candidate Cards Grid */}
      {filteredCandidates.length === 0 ? (
        <div className="text-center py-16">
          <FunnelIcon className="w-12 h-12 text-dark-text-secondary/30 mx-auto mb-3" />
          <p className="text-dark-text-secondary">
            {search ? 'No candidates match your search' : 'No rejected candidates in the pool yet'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCandidates.map(candidate => {
            const actioned = hasUserActioned(candidate)
            const claim = getUserClaim(candidate)

            return (
              <div
                key={candidate.id}
                className={`bg-dark-card rounded-2xl border p-5 transition-all ${
                  actioned ? 'border-dark-border opacity-60' : 'border-dark-border hover:border-accent/30'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-white">{candidate.candidate_name}</h3>
                    <p className="text-xs text-dark-text-secondary mt-0.5">
                      {candidate.title}{candidate.company ? ` at ${candidate.company}` : ''}
                    </p>
                  </div>
                  {actioned && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                      claim?.action === 'claimed'
                        ? 'bg-accent/10 text-accent'
                        : 'bg-dark-bg text-dark-text-secondary'
                    }`}>
                      {claim?.action === 'claimed' ? 'Claimed' : 'Passed'}
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-1.5 mb-4">
                  <DetailRow label="Role" value={candidate.role} />
                  {candidate.school && <DetailRow label="Education" value={candidate.school} />}
                  {candidate.location && <DetailRow label="Location" value={candidate.location} />}
                  {candidate.rejection_reason && (
                    <DetailRow label="Rejection" value={candidate.rejection_reason} />
                  )}
                </div>

                {/* LinkedIn */}
                {candidate.linkedin_url && (
                  <a
                    href={candidate.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors block mb-3"
                  >
                    View LinkedIn Profile
                  </a>
                )}

                {/* Notes preview */}
                {candidate.notes && (
                  <p className="text-[10px] text-dark-text-secondary line-clamp-2 mb-3 italic">
                    {candidate.notes}
                  </p>
                )}

                {/* Actions */}
                {!actioned && (
                  <div className="flex items-center gap-2 pt-2 border-t border-dark-border">
                    <button
                      onClick={() => claimCandidate(candidate.id)}
                      disabled={claimingId === candidate.id}
                      className="flex-1 px-3 py-2 bg-accent text-white text-xs rounded-lg hover:bg-accent-hover transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                      <UserPlusIcon className="w-3.5 h-3.5" />
                      Claim
                    </button>
                    <button
                      onClick={() => passCandidate(candidate.id)}
                      className="flex-1 px-3 py-2 bg-dark-bg text-dark-text-secondary text-xs rounded-lg hover:text-white border border-dark-border hover:border-dark-text-secondary transition-colors"
                    >
                      Pass
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-[10px] text-dark-text-secondary w-16 shrink-0">{label}</span>
      <span className="text-xs text-white">{value}</span>
    </div>
  )
}
