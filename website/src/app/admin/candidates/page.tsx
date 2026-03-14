'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useAuth } from '@/components/admin/AuthContext'
import type { Candidate, CandidateStage, CandidateSource } from '@/lib/types'
import { PIPELINE_STAGES, STAGE_LABELS, CANDIDATE_SOURCES } from '@/lib/types'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
  ChevronUpDownIcon,
  DocumentIcon,
  ArrowUpTrayIcon,
} from '@heroicons/react/24/outline'

type SortField = 'candidate_name' | 'company' | 'stage' | 'last_activity_date' | 'role'
type SortDir = 'asc' | 'desc'

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState<string>('all')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [sortField, setSortField] = useState<SortField>('last_activity_date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null)
  const { user, isAdmin } = useAuth()
  const supabase = createClient()

  const fetchCandidates = useCallback(async () => {
    let query = supabase
      .from('candidates')
      .select('*, recruiter:profiles!candidates_recruiter_profile_fkey(first_name, last_name)')
      .order(sortField, { ascending: sortDir === 'asc' })

    if (!isAdmin) {
      query = query.eq('recruiter_id', user!.id)
    }
    if (stageFilter !== 'all') {
      query = query.eq('stage', stageFilter)
    }
    if (sourceFilter !== 'all') {
      query = query.eq('source', sourceFilter)
    }

    const { data } = await query
    setCandidates((data || []) as Candidate[])
    setLoading(false)
  }, [supabase, isAdmin, user, sortField, sortDir, stageFilter, sourceFilter])

  useEffect(() => { fetchCandidates() }, [fetchCandidates])

  const filtered = candidates.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      c.candidate_name.toLowerCase().includes(q) ||
      c.company?.toLowerCase().includes(q) ||
      c.title?.toLowerCase().includes(q) ||
      c.role.toLowerCase().includes(q) ||
      c.hiring_manager?.toLowerCase().includes(q) ||
      c.location?.toLowerCase().includes(q) ||
      c.school?.toLowerCase().includes(q)
    )
  })

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const exportCsv = () => {
    const headers = [
      'Recruiter', 'Source', 'Candidate Name', 'Title', 'Company', 'School',
      'Role', 'Hiring Manager', 'Team', 'Location', 'Stage', 'Status',
      'Recruiter Screen', 'Submitted', 'HM Interview', '1st Round', '2nd Round',
      '3rd Round', 'Final Round', 'Offer', 'Accepted', 'Notes', 'LinkedIn URL',
      'Last Activity',
    ]
    const rows = filtered.map(c => [
      (c.recruiter as any)?.first_name ? `${(c.recruiter as any).first_name} ${(c.recruiter as any).last_name}` : '',
      c.source,
      c.candidate_name,
      c.title || '',
      c.company || '',
      c.school || '',
      c.role,
      c.hiring_manager || '',
      c.team || '',
      c.location || '',
      STAGE_LABELS[c.stage] || c.stage,
      c.status,
      c.recruiter_screen_date || '',
      c.submitted_date || '',
      c.hm_interview_date || '',
      c.first_round_date || '',
      c.second_round_date || '',
      c.third_round_date || '',
      c.final_round_date || '',
      c.offer_date || '',
      c.accepted_date || '',
      c.notes || '',
      c.linkedin_url || '',
      c.last_activity_date || '',
    ])

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mavericks-candidates-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const stageColor = (stage: string) => {
    const colors: Record<string, string> = {
      sourced: 'bg-gray-500/10 text-gray-400',
      contacted: 'bg-blue-500/10 text-blue-400',
      phone_screen: 'bg-cyan-500/10 text-cyan-400',
      submittal: 'bg-yellow-500/10 text-yellow-400',
      first_round: 'bg-orange-500/10 text-orange-400',
      second_round: 'bg-pink-500/10 text-pink-400',
      third_round: 'bg-purple-500/10 text-purple-400',
      final_round: 'bg-accent/10 text-accent',
      offer: 'bg-green/10 text-green',
      accepted: 'bg-emerald-500/10 text-emerald-400',
      rejected: 'bg-error/10 text-error',
      withdrawn: 'bg-dark-text-secondary/10 text-dark-text-secondary',
    }
    return colors[stage] || 'bg-dark-bg text-dark-text-secondary'
  }

  // Time-in-stage color for aging
  const ageColor = (lastActivity: string) => {
    const days = Math.floor((Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24))
    if (days <= 3) return 'text-green'
    if (days <= 7) return 'text-yellow-400'
    return 'text-error'
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="h-12 bg-dark-border/50 rounded-xl animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-dark-border/50 via-dark-card to-dark-border/50" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        {/* Search */}
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-text-secondary" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search candidates..."
            className="w-full bg-dark-card border border-dark-border rounded-xl pl-10 pr-4 py-2 text-sm text-dark-text placeholder-dark-text-secondary/50 focus:outline-none focus:border-accent"
          />
        </div>

        {/* Filters */}
        <select
          value={stageFilter}
          onChange={e => setStageFilter(e.target.value)}
          className="bg-dark-card border border-dark-border rounded-xl px-3 py-2 text-sm text-dark-text focus:outline-none focus:border-accent"
        >
          <option value="all">All Stages</option>
          {[...PIPELINE_STAGES, 'rejected', 'withdrawn'].map(s => (
            <option key={s} value={s}>{STAGE_LABELS[s as CandidateStage] || s}</option>
          ))}
        </select>

        <select
          value={sourceFilter}
          onChange={e => setSourceFilter(e.target.value)}
          className="bg-dark-card border border-dark-border rounded-xl px-3 py-2 text-sm text-dark-text focus:outline-none focus:border-accent"
        >
          <option value="all">All Sources</option>
          {CANDIDATE_SOURCES.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={exportCsv}
            className="px-3 py-2 bg-dark-card border border-dark-border rounded-xl text-sm text-dark-text-secondary hover:text-dark-text transition-colors flex items-center gap-1.5"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => { setEditingCandidate(null); setShowAddModal(true) }}
            className="px-3 py-2 bg-accent text-white text-sm rounded-xl hover:bg-accent-hover transition-colors flex items-center gap-1.5"
          >
            <PlusIcon className="w-4 h-4" />
            Add
          </button>
        </div>
      </div>

      <p className="text-xs text-dark-text-secondary mb-3">
        {filtered.length} candidate{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* Table */}
      <div className="overflow-x-auto bg-dark-card rounded-2xl border border-dark-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-dark-border bg-dark-bg/50">
              <SortHeader label="Name" field="candidate_name" current={sortField} dir={sortDir} onSort={toggleSort} />
              <th className="px-4 py-3.5 text-left text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">Title / Company</th>
              <SortHeader label="Role" field="role" current={sortField} dir={sortDir} onSort={toggleSort} />
              <SortHeader label="Stage" field="stage" current={sortField} dir={sortDir} onSort={toggleSort} />
              <th className="px-4 py-3.5 text-left text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">Source</th>
              {isAdmin && <th className="px-4 py-3.5 text-left text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">Recruiter</th>}
              <SortHeader label="Last Activity" field="last_activity_date" current={sortField} dir={sortDir} onSort={toggleSort} />
              <th className="px-4 py-3.5 text-left text-xs font-semibold text-dark-text-secondary w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-border/40">
            {filtered.map((c, i) => (
              <tr
                key={c.id}
                className={`hover:bg-accent/[0.06] cursor-pointer transition-colors ${i % 2 === 1 ? 'bg-dark-bg/20' : ''}`}
                onClick={() => { setEditingCandidate(c); setShowAddModal(true) }}
              >
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <span className="text-dark-text font-medium">{c.candidate_name}</span>
                    {c.linkedin_url && (
                      <a
                        href={c.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="text-[10px] text-blue-400 hover:text-blue-300 font-medium"
                      >
                        LI
                      </a>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <div className="text-xs text-dark-text">
                    {c.title}{c.company ? <span className="text-dark-text-secondary"> @ {c.company}</span> : ''}
                  </div>
                </td>
                <td className="px-4 py-3.5 text-xs text-dark-text">{c.role}</td>
                <td className="px-4 py-3.5">
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium ${stageColor(c.stage)}`}>
                    {STAGE_LABELS[c.stage] || c.stage}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-xs text-dark-text-secondary">{c.source}</td>
                {isAdmin && (
                  <td className="px-4 py-3.5 text-xs text-dark-text-secondary">
                    {(c.recruiter as any)?.first_name || '-'}
                  </td>
                )}
                <td className={`px-4 py-3.5 text-xs font-medium ${ageColor(c.last_activity_date)}`}>
                  {new Date(c.last_activity_date).toLocaleDateString()}
                </td>
                <td className="px-4 py-3.5">
                  <button
                    onClick={e => { e.stopPropagation(); setEditingCandidate(c); setShowAddModal(true) }}
                    className="text-dark-text-secondary hover:text-dark-text transition-colors"
                  >
                    ...
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-dark-text-secondary text-sm">
              {search || stageFilter !== 'all' || sourceFilter !== 'all'
                ? 'No candidates match your filters'
                : 'No candidates yet. Add your first candidate to get started.'}
            </p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <CandidateFormModal
          candidate={editingCandidate}
          onClose={() => { setShowAddModal(false); setEditingCandidate(null) }}
          onSaved={() => { setShowAddModal(false); setEditingCandidate(null); fetchCandidates() }}
        />
      )}
    </div>
  )
}

function SortHeader({ label, field, current, dir, onSort }: {
  label: string; field: SortField; current: SortField; dir: SortDir; onSort: (f: SortField) => void
}) {
  return (
    <th
      className="px-4 py-3.5 text-left text-xs font-semibold text-dark-text-secondary uppercase tracking-wider cursor-pointer hover:text-dark-text transition-colors select-none"
      onClick={() => onSort(field)}
    >
      <span className="flex items-center gap-1">
        {label}
        <ChevronUpDownIcon className={`w-3 h-3 ${current === field ? 'text-accent' : ''}`} />
      </span>
    </th>
  )
}

function CandidateFormModal({
  candidate,
  onClose,
  onSaved,
}: {
  candidate: Candidate | null
  onClose: () => void
  onSaved: () => void
}) {
  const supabase = createClient()
  const { user } = useAuth()
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [uploadingResume, setUploadingResume] = useState(false)
  const [form, setForm] = useState({
    candidate_name: candidate?.candidate_name || '',
    email: candidate?.email || '',
    phone: candidate?.phone || '',
    linkedin_url: candidate?.linkedin_url || '',
    title: candidate?.title || '',
    company: candidate?.company || '',
    school: candidate?.school || '',
    location: candidate?.location || '',
    role: candidate?.role || '',
    hiring_manager: candidate?.hiring_manager || '',
    team: candidate?.team || '',
    source: candidate?.source || 'LinkedIn',
    stage: candidate?.stage || 'sourced',
    status: candidate?.status || 'active',
    notes: candidate?.notes || '',
    additional_notes: candidate?.additional_notes || '',
    rejection_reason: candidate?.rejection_reason || '',
  })

  const set = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }))

  const uploadResume = async (candidateId: string): Promise<string | null> => {
    if (!resumeFile) return null
    setUploadingResume(true)
    const ext = resumeFile.name.split('.').pop() || 'pdf'
    const path = `${candidateId}/${Date.now()}.${ext}`
    const { error } = await supabase.storage
      .from('resumes')
      .upload(path, resumeFile, { upsert: true })
    setUploadingResume(false)
    if (error) {
      console.error('Resume upload failed:', error)
      return null
    }
    return path
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    if (candidate) {
      // Upload resume if a new file was selected
      let resumeUrl = candidate.resume_url
      if (resumeFile) {
        const path = await uploadResume(candidate.id)
        if (path) resumeUrl = path
      }
      await supabase
        .from('candidates')
        .update({ ...form, resume_url: resumeUrl })
        .eq('id', candidate.id)
    } else {
      // Insert candidate first, then upload resume
      const { data: newCandidate } = await supabase
        .from('candidates')
        .insert({ ...form, recruiter_id: user!.id })
        .select('id')
        .single()

      if (newCandidate && resumeFile) {
        const path = await uploadResume(newCandidate.id)
        if (path) {
          await supabase
            .from('candidates')
            .update({ resume_url: path })
            .eq('id', newCandidate.id)
        }
      }
    }

    setSaving(false)
    onSaved()
  }

  const handleDelete = async () => {
    if (!candidate || !confirm('Delete this candidate? This cannot be undone.')) return
    setDeleting(true)
    await supabase.from('candidates').delete().eq('id', candidate.id)
    setDeleting(false)
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-dark-card rounded-3xl border border-dark-border p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-heading font-semibold text-dark-text">
            {candidate ? 'Edit Candidate' : 'Add Candidate'}
          </h2>
          <button onClick={onClose} className="text-dark-text-secondary hover:text-dark-text">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name & Contact */}
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Candidate Name" required>
              <input type="text" value={form.candidate_name} onChange={e => set('candidate_name', e.target.value)} required className="form-input" placeholder="Full name" />
            </FormField>
            <FormField label="Email">
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className="form-input" placeholder="email@example.com" />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Phone">
              <input type="text" value={form.phone} onChange={e => set('phone', e.target.value)} className="form-input" />
            </FormField>
            <FormField label="LinkedIn URL">
              <input type="url" value={form.linkedin_url} onChange={e => set('linkedin_url', e.target.value)} className="form-input" placeholder="https://linkedin.com/in/..." />
            </FormField>
          </div>

          {/* Current Position */}
          <div className="grid grid-cols-3 gap-3">
            <FormField label="Current Title">
              <input type="text" value={form.title} onChange={e => set('title', e.target.value)} className="form-input" />
            </FormField>
            <FormField label="Current Company">
              <input type="text" value={form.company} onChange={e => set('company', e.target.value)} className="form-input" />
            </FormField>
            <FormField label="School">
              <input type="text" value={form.school} onChange={e => set('school', e.target.value)} className="form-input" />
            </FormField>
          </div>

          {/* Role Info */}
          <div className="grid grid-cols-3 gap-3">
            <FormField label="Role" required>
              <input type="text" value={form.role} onChange={e => set('role', e.target.value)} required className="form-input" placeholder="Interviewing for..." />
            </FormField>
            <FormField label="Hiring Manager">
              <input type="text" value={form.hiring_manager} onChange={e => set('hiring_manager', e.target.value)} className="form-input" />
            </FormField>
            <FormField label="Team">
              <input type="text" value={form.team} onChange={e => set('team', e.target.value)} className="form-input" />
            </FormField>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <FormField label="Location">
              <input type="text" value={form.location} onChange={e => set('location', e.target.value)} className="form-input" />
            </FormField>
            <FormField label="Source" required>
              <select value={form.source} onChange={e => set('source', e.target.value)} className="form-input">
                {CANDIDATE_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </FormField>
            <FormField label="Stage">
              <select value={form.stage} onChange={e => set('stage', e.target.value)} className="form-input">
                {[...PIPELINE_STAGES, 'rejected', 'withdrawn'].map(s => (
                  <option key={s} value={s}>{STAGE_LABELS[s as CandidateStage]}</option>
                ))}
              </select>
            </FormField>
          </div>

          {/* Notes */}
          <FormField label="Notes">
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} className="form-input resize-none" placeholder="Recruiter screen notes, candidate background, etc." />
          </FormField>

          {form.stage === 'rejected' && (
            <FormField label="Rejection Reason">
              <input type="text" value={form.rejection_reason} onChange={e => set('rejection_reason', e.target.value)} className="form-input" placeholder="Why was this candidate rejected?" />
            </FormField>
          )}

          <FormField label="Additional Notes">
            <textarea value={form.additional_notes} onChange={e => set('additional_notes', e.target.value)} rows={2} className="form-input resize-none" />
          </FormField>

          {/* Resume Upload */}
          <FormField label="Resume">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-3 py-2 bg-dark-bg border border-dark-border rounded-xl text-sm text-dark-text-secondary hover:text-dark-text hover:border-accent/50 transition-colors cursor-pointer">
                <ArrowUpTrayIcon className="w-4 h-4" />
                {resumeFile ? resumeFile.name : 'Choose file'}
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) setResumeFile(file)
                  }}
                />
              </label>
              {candidate?.resume_url && !resumeFile && (
                <button
                  type="button"
                  onClick={async () => {
                    const { data } = await supabase.storage
                      .from('resumes')
                      .createSignedUrl(candidate.resume_url!, 60)
                    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
                  }}
                  className="flex items-center gap-1.5 text-xs text-accent hover:text-accent-hover transition-colors"
                >
                  <DocumentIcon className="w-4 h-4" />
                  View current
                </button>
              )}
              {resumeFile && (
                <button
                  type="button"
                  onClick={() => setResumeFile(null)}
                  className="text-xs text-dark-text-secondary hover:text-error transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
            <p className="text-[10px] text-dark-text-secondary mt-1">PDF, DOC, or DOCX (max 10MB)</p>
          </FormField>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            {candidate && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2.5 text-sm text-error border border-error/20 rounded-xl hover:bg-error/10 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            )}
            <div className="flex-1" />
            <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm text-dark-text-secondary border border-dark-border rounded-xl hover:text-dark-text transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-6 py-2.5 text-sm bg-accent text-white rounded-xl hover:bg-accent-hover transition-colors disabled:opacity-50">
              {saving ? 'Saving...' : candidate ? 'Update' : 'Add Candidate'}
            </button>
          </div>
        </form>

        <style jsx>{`
          .form-input {
            width: 100%;
            background: var(--dark-bg, #1A191E);
            border: 1px solid var(--dark-border, #2E2D35);
            border-radius: 0.75rem;
            padding: 0.5rem 0.75rem;
            font-size: 0.875rem;
            color: var(--dark-text);
          }
          .form-input:focus {
            outline: none;
            border-color: #7052F5;
          }
        `}</style>
      </div>
    </div>
  )
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-dark-text-secondary mb-1">
        {label}{required && <span className="text-error ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}
