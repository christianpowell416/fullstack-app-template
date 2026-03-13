'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useAuth } from '@/components/admin/AuthContext'
import type { Project, Profile } from '@/lib/types'
import { getFullName, getInitials } from '@/lib/types'
import {
  PlusIcon,
  CalendarIcon,
  UserGroupIcon,
  FlagIcon,
  PencilIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

interface ProjectAssignmentRow {
  id: string
  recruiter_id: string
  individual_hire_goal: number | null
  recruiter: { id: string; first_name: string | null; last_name: string | null; email: string }
}

interface ProjectWithAssignments extends Project {
  assignment_rows?: ProjectAssignmentRow[]
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectWithAssignments[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editingProject, setEditingProject] = useState<ProjectWithAssignments | null>(null)
  const [showAssignments, setShowAssignments] = useState<ProjectWithAssignments | null>(null)
  const { isAdmin } = useAuth()
  const supabase = createClient()

  useEffect(() => { fetchProjects() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchProjects = async () => {
    // Fetch projects with counts
    const { data } = await supabase
      .from('projects')
      .select(`
        *,
        assignments:project_assignments(count),
        hires:candidates(count)
      `)
      .order('start_date', { ascending: false })

    // Fetch assignments separately (FK goes to auth.users, not profiles directly)
    const { data: assignmentData } = await supabase
      .from('project_assignments')
      .select('id, project_id, recruiter_id, individual_hire_goal')

    // Fetch recruiter profiles for assigned recruiters
    const recruiterIds = [...new Set((assignmentData || []).map((a: any) => a.recruiter_id))]
    let recruiterMap: Record<string, any> = {}
    if (recruiterIds.length > 0) {
      const { data: recruiters } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .in('id', recruiterIds)
      for (const r of recruiters || []) {
        recruiterMap[r.id] = r
      }
    }

    // Combine assignments with recruiter profiles
    const assignmentsByProject: Record<string, ProjectAssignmentRow[]> = {}
    for (const a of assignmentData || []) {
      const row: ProjectAssignmentRow = {
        id: a.id,
        recruiter_id: a.recruiter_id,
        individual_hire_goal: a.individual_hire_goal,
        recruiter: recruiterMap[a.recruiter_id] || { id: a.recruiter_id, first_name: null, last_name: null, email: '' },
      }
      if (!assignmentsByProject[a.project_id]) assignmentsByProject[a.project_id] = []
      assignmentsByProject[a.project_id].push(row)
    }

    const mapped = (data || []).map((p: any) => ({
      ...p,
      recruiter_count: p.assignments?.[0]?.count || 0,
      hires_count: p.hires?.[0]?.count || 0,
      assignment_rows: assignmentsByProject[p.id] || [],
    }))
    setProjects(mapped)
    setLoading(false)
  }

  const statusColors: Record<string, string> = {
    active: 'bg-green/10 text-green',
    completed: 'bg-blue-500/10 text-blue-400',
    paused: 'bg-yellow-500/10 text-yellow-400',
    cancelled: 'bg-error/10 text-error',
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-dark-border/50 rounded-2xl animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-dark-border/50 via-dark-card to-dark-border/50" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-dark-text-secondary">
          {projects.length} project{projects.length !== 1 ? 's' : ''}
        </p>
        {isAdmin && (
          <button
            onClick={() => { setEditingProject(null); setShowCreate(true) }}
            className="px-4 py-2 bg-accent text-white text-sm rounded-xl hover:bg-accent-hover transition-colors flex items-center gap-2"
          >
            <PlusIcon className="w-4 h-4" />
            New Project
          </button>
        )}
      </div>

      {/* Project Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map(project => {
          const daysLeft = Math.ceil(
            (new Date(project.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          )
          const progress = project.hire_goal > 0
            ? Math.min(100, Math.round(((project.hires_count || 0) / project.hire_goal) * 100))
            : 0

          return (
            <div
              key={project.id}
              className="bg-dark-card rounded-2xl border border-dark-border p-5 hover:border-accent/30 transition-all"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-white">{project.name}</h3>
                  <p className="text-xs text-dark-text-secondary">{project.client_name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize ${statusColors[project.status] || ''}`}>
                    {project.status}
                  </span>
                  {isAdmin && (
                    <button
                      onClick={() => { setEditingProject(project); setShowCreate(true) }}
                      className="p-1 text-dark-text-secondary hover:text-white transition-colors"
                    >
                      <PencilIcon className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-xs text-dark-text-secondary">
                  <CalendarIcon className="w-3.5 h-3.5" />
                  <span>{project.start_date} - {project.end_date}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-dark-text-secondary">
                  <FlagIcon className="w-3.5 h-3.5" />
                  <span>{project.hires_count || 0} / {project.hire_goal} hires</span>
                  {daysLeft > 0 && project.status === 'active' && (
                    <span className="text-dark-text-secondary/50">({daysLeft}d left)</span>
                  )}
                </div>
              </div>

              {/* Assigned Recruiters */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 text-xs text-dark-text-secondary">
                    <UserGroupIcon className="w-3.5 h-3.5" />
                    <span>{project.recruiter_count || 0} recruiter{(project.recruiter_count || 0) !== 1 ? 's' : ''}</span>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => setShowAssignments(project)}
                      className="text-[10px] text-accent hover:text-accent-hover transition-colors"
                    >
                      Manage
                    </button>
                  )}
                </div>
                {project.assignment_rows && project.assignment_rows.length > 0 && (
                  <div className="flex -space-x-1.5">
                    {project.assignment_rows.slice(0, 5).map(a => (
                      <div
                        key={a.id}
                        className="w-6 h-6 rounded-full bg-accent/20 border-2 border-dark-card flex items-center justify-center"
                        title={getFullName(a.recruiter)}
                      >
                        <span className="text-[8px] font-heading font-bold text-accent">
                          {getInitials(a.recruiter.first_name, a.recruiter.last_name)}
                        </span>
                      </div>
                    ))}
                    {project.assignment_rows.length > 5 && (
                      <div className="w-6 h-6 rounded-full bg-dark-border border-2 border-dark-card flex items-center justify-center">
                        <span className="text-[8px] font-heading text-dark-text-secondary">+{project.assignment_rows.length - 5}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Progress bar */}
              <div className="h-1.5 bg-dark-bg rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    progress >= 100 ? 'bg-green' : progress >= 50 ? 'bg-accent' : 'bg-yellow-500'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-[10px] text-dark-text-secondary mt-1">{progress}% of goal</p>
            </div>
          )
        })}
      </div>

      {/* Create/Edit Modal */}
      {showCreate && (
        <ProjectFormModal
          project={editingProject}
          onClose={() => { setShowCreate(false); setEditingProject(null) }}
          onSaved={() => { setShowCreate(false); setEditingProject(null); fetchProjects() }}
        />
      )}

      {/* Assignment Modal */}
      {showAssignments && (
        <AssignmentModal
          project={showAssignments}
          onClose={() => setShowAssignments(null)}
          onSaved={() => { setShowAssignments(null); fetchProjects() }}
        />
      )}
    </div>
  )
}

// ─── Assignment Modal ───
function AssignmentModal({
  project,
  onClose,
  onSaved,
}: {
  project: ProjectWithAssignments
  onClose: () => void
  onSaved: () => void
}) {
  const supabase = createClient()
  const [allRecruiters, setAllRecruiters] = useState<Profile[]>([])
  const [assignments, setAssignments] = useState<ProjectAssignmentRow[]>(project.assignment_rows || [])
  const [saving, setSaving] = useState(false)
  const [selectedRecruiter, setSelectedRecruiter] = useState('')
  const [individualGoal, setIndividualGoal] = useState<number | ''>('')

  useEffect(() => {
    fetchRecruiters()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchRecruiters = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'recruiter')
      .eq('is_active', true)
      .order('first_name')
    setAllRecruiters((data || []) as Profile[])
  }

  const assignedIds = new Set(assignments.map(a => a.recruiter_id))
  const availableRecruiters = allRecruiters.filter(r => !assignedIds.has(r.id))

  const handleAssign = async () => {
    if (!selectedRecruiter) return
    setSaving(true)

    const { data, error } = await supabase
      .from('project_assignments')
      .insert({
        project_id: project.id,
        recruiter_id: selectedRecruiter,
        individual_hire_goal: individualGoal || null,
      })
      .select('id, recruiter_id, individual_hire_goal')
      .single()

    if (!error && data) {
      const recruiter = allRecruiters.find(r => r.id === selectedRecruiter)
      const row: ProjectAssignmentRow = {
        ...data,
        recruiter: {
          id: selectedRecruiter,
          first_name: recruiter?.first_name || null,
          last_name: recruiter?.last_name || null,
          email: recruiter?.email || '',
        },
      }
      setAssignments(prev => [...prev, row])
      setSelectedRecruiter('')
      setIndividualGoal('')
    }
    setSaving(false)
  }

  const handleRemove = async (assignmentId: string) => {
    await supabase
      .from('project_assignments')
      .delete()
      .eq('id', assignmentId)

    setAssignments(prev => prev.filter(a => a.id !== assignmentId))
  }

  const handleUpdateGoal = async (assignmentId: string, goal: number | null) => {
    await supabase
      .from('project_assignments')
      .update({ individual_hire_goal: goal })
      .eq('id', assignmentId)

    setAssignments(prev =>
      prev.map(a => a.id === assignmentId ? { ...a, individual_hire_goal: goal } : a)
    )
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-dark-card rounded-3xl border border-dark-border p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-heading font-semibold text-white">Manage Recruiters</h2>
            <p className="text-xs text-dark-text-secondary">{project.name}</p>
          </div>
          <button onClick={() => { onSaved() }} className="p-1 text-dark-text-secondary hover:text-white transition-colors">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Add Recruiter */}
        <div className="flex gap-2 mb-4">
          <select
            value={selectedRecruiter}
            onChange={e => setSelectedRecruiter(e.target.value)}
            className="flex-1 bg-dark-bg border border-dark-border rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent appearance-none"
          >
            <option value="">Select recruiter...</option>
            {availableRecruiters.map(r => (
              <option key={r.id} value={r.id}>{getFullName(r)}</option>
            ))}
          </select>
          <input
            type="number"
            min={0}
            placeholder="Goal"
            value={individualGoal}
            onChange={e => setIndividualGoal(e.target.value ? parseInt(e.target.value) : '')}
            className="w-20 bg-dark-bg border border-dark-border rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent"
          />
          <button
            onClick={handleAssign}
            disabled={!selectedRecruiter || saving}
            className="px-4 py-2.5 bg-accent text-white text-sm rounded-xl hover:bg-accent-hover transition-colors disabled:opacity-50"
          >
            Add
          </button>
        </div>

        {/* Current Assignments */}
        <div className="space-y-2">
          {assignments.length === 0 && (
            <p className="text-center text-sm text-dark-text-secondary py-6">No recruiters assigned yet</p>
          )}
          {assignments.map(a => (
            <div
              key={a.id}
              className="flex items-center gap-3 bg-dark-bg rounded-xl p-3"
            >
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                <span className="text-xs font-heading font-bold text-accent">
                  {getInitials(a.recruiter.first_name, a.recruiter.last_name)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{getFullName(a.recruiter)}</p>
                <p className="text-[10px] text-dark-text-secondary">{a.recruiter.email}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="number"
                  min={0}
                  placeholder="Goal"
                  value={a.individual_hire_goal || ''}
                  onChange={e => handleUpdateGoal(a.id, e.target.value ? parseInt(e.target.value) : null)}
                  className="w-16 bg-dark-card border border-dark-border rounded-lg px-2 py-1 text-xs text-white text-center focus:outline-none focus:border-accent"
                />
                <button
                  onClick={() => handleRemove(a.id)}
                  className="p-1 text-dark-text-secondary hover:text-error transition-colors"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        {assignments.length > 0 && (
          <div className="mt-4 pt-3 border-t border-dark-border flex items-center justify-between text-xs text-dark-text-secondary">
            <span>{assignments.length} recruiter{assignments.length !== 1 ? 's' : ''} assigned</span>
            <span>
              Individual goals: {assignments.reduce((s, a) => s + (a.individual_hire_goal || 0), 0)} / {project.hire_goal} project goal
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Project Form Modal ───
function ProjectFormModal({
  project,
  onClose,
  onSaved,
}: {
  project: Project | null
  onClose: () => void
  onSaved: () => void
}) {
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: project?.name || '',
    client_name: project?.client_name || '',
    description: project?.description || '',
    start_date: project?.start_date || new Date().toISOString().split('T')[0],
    end_date: project?.end_date || '',
    hire_goal: project?.hire_goal || 1,
    status: project?.status || 'active',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    if (project) {
      await supabase
        .from('projects')
        .update(form)
        .eq('id', project.id)
    } else {
      await supabase
        .from('projects')
        .insert(form)
    }

    setSaving(false)
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-dark-card rounded-3xl border border-dark-border p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-heading font-semibold text-white mb-4">
          {project ? 'Edit Project' : 'New Project'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Project Name" required>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
              className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent"
              placeholder="e.g., Vanta PM Recruiting"
            />
          </FormField>

          <FormField label="Client Name" required>
            <input
              type="text"
              value={form.client_name}
              onChange={e => setForm({ ...form, client_name: e.target.value })}
              required
              className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent"
              placeholder="e.g., Vanta"
            />
          </FormField>

          <FormField label="Description">
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent resize-none"
              placeholder="Brief project description..."
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Start Date" required>
              <input
                type="date"
                value={form.start_date}
                onChange={e => setForm({ ...form, start_date: e.target.value })}
                required
                className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent"
              />
            </FormField>
            <FormField label="End Date" required>
              <input
                type="date"
                value={form.end_date}
                onChange={e => setForm({ ...form, end_date: e.target.value })}
                required
                className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Hire Goal" required>
              <input
                type="number"
                min={1}
                value={form.hire_goal}
                onChange={e => setForm({ ...form, hire_goal: parseInt(e.target.value) || 1 })}
                required
                className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent"
              />
            </FormField>
            {project && (
              <FormField label="Status">
                <select
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value as any })}
                  className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent"
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="paused">Paused</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </FormField>
            )}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-sm text-dark-text-secondary border border-dark-border rounded-xl hover:text-white hover:border-dark-text-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 text-sm bg-accent text-white rounded-xl hover:bg-accent-hover transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : project ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
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
