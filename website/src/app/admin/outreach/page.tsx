'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useAuth } from '@/components/admin/AuthContext'
import { usePageTitle } from '@/components/admin/PageTitleContext'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowTrendingUpIcon,
  PaperAirplaneIcon,
  SparklesIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import type { OutboundEntry, Profile } from '@/lib/types'
import { getFullName } from '@/lib/types'

type Tab = 'tracker' | 'history'

const tabs = [
  { key: 'tracker', label: 'Tracker' },
  { key: 'history', label: 'History' },
]

export default function OutreachPage() {
  const [tab, setTab] = useState<Tab>('tracker')
  const [entries, setEntries] = useState<OutboundEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingEntry, setEditingEntry] = useState<OutboundEntry | null>(null)
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

  useEffect(() => { fetchEntries() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchEntries = async () => {
    let query = supabase
      .from('outbound_entries')
      .select('*, recruiter:profiles!outbound_entries_recruiter_profile_fkey(first_name, last_name, email)')
      .order('week_start', { ascending: false })
      .limit(100)

    if (!isAdmin) {
      query = query.eq('recruiter_id', user!.id)
    }

    const { data } = await query
    setEntries((data || []) as OutboundEntry[])
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    await supabase.from('outbound_entries').delete().eq('id', id)
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  if (loading) return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-dark-border/50 rounded-2xl animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-dark-border/50 via-dark-card to-dark-border/50" />)}
      </div>
      <div className="h-72 bg-dark-border/50 rounded-2xl animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-dark-border/50 via-dark-card to-dark-border/50" />
    </div>
  )

  return (
    <div className="p-3 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {tab === 'tracker' && (
        <TrackerTab
          entries={entries}
          onAdd={() => { setEditingEntry(null); setShowForm(true) }}
          onEdit={(e) => { setEditingEntry(e); setShowForm(true) }}
          userId={user!.id}
          weeklyGoal={user?.weekly_outbound_goal || 200}
        />
      )}
      {tab === 'history' && (
        <HistoryTab
          entries={entries}
          isAdmin={isAdmin}
          onEdit={(e) => { setEditingEntry(e); setShowForm(true) }}
          onDelete={handleDelete}
        />
      )}

      {showForm && (
        <OutboundFormModal
          entry={editingEntry}
          recruiterId={user!.id}
          onClose={() => { setShowForm(false); setEditingEntry(null) }}
          onSaved={() => { setShowForm(false); setEditingEntry(null); fetchEntries() }}
        />
      )}
    </div>
  )
}

// ─── Tracker Tab ───
function TrackerTab({ entries, onAdd, onEdit, userId, weeklyGoal }: {
  entries: OutboundEntry[]
  onAdd: () => void
  onEdit: (e: OutboundEntry) => void
  userId: string
  weeklyGoal: number
}) {
  // Current week
  const now = new Date()
  const dayOfWeek = now.getDay()
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() + mondayOffset)
  const weekStartStr = weekStart.toISOString().split('T')[0]

  // This week's totals (user's own)
  const myEntries = entries.filter(e => e.recruiter_id === userId)
  const thisWeek = myEntries.filter(e => e.week_start === weekStartStr)
  const thisWeekOutbound = thisWeek.reduce((s, e) => s + (e.outbound_count || 0), 0)
  const thisWeekInterested = thisWeek.reduce((s, e) => s + (e.interested_count || 0), 0)
  const thisWeekReplied = thisWeek.reduce((s, e) => s + (e.emails_replied || 0), 0)
  const goalProgress = weeklyGoal > 0 ? Math.min(100, Math.round((thisWeekOutbound / weeklyGoal) * 100)) : 0

  // Last 12 weeks chart
  const weeklyData = (() => {
    const byWeek = new Map<string, { outbound: number; interested: number }>()
    for (const e of myEntries) {
      const existing = byWeek.get(e.week_start) || { outbound: 0, interested: 0 }
      existing.outbound += e.outbound_count || 0
      existing.interested += e.interested_count || 0
      byWeek.set(e.week_start, existing)
    }
    return Array.from(byWeek.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-12)
      .map(([week, data]) => ({
        week: new Date(week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        outbound: data.outbound,
        interested: data.interested,
      }))
  })()

  // All-time totals
  const totalOutbound = myEntries.reduce((s, e) => s + (e.outbound_count || 0), 0)
  const totalInterested = myEntries.reduce((s, e) => s + (e.interested_count || 0), 0)
  const overallInterestRate = totalOutbound > 0 ? Math.round((totalInterested / totalOutbound) * 100) : 0

  return (
    <div className="space-y-4 md:space-y-6">
      {/* This Week Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-dark-card rounded-2xl border border-dark-border p-4 md:p-6 opacity-0 animate-fadeIn" style={{ animationDelay: '50ms' }}>
          <div className="flex items-center gap-2 mb-1">
            <PaperAirplaneIcon className="w-4 h-4 text-accent" />
            <p className="text-xs text-dark-text-secondary">This Week</p>
          </div>
          <p className="text-2xl font-heading font-bold text-dark-text">{thisWeekOutbound}</p>
          <div className="mt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-dark-text-secondary">Goal: {weeklyGoal}</span>
              <span className="text-[10px] font-heading text-accent">{goalProgress}%</span>
            </div>
            <div className="h-1.5 bg-dark-bg rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${goalProgress >= 100 ? 'bg-green' : goalProgress >= 50 ? 'bg-accent' : 'bg-yellow-500'}`}
                style={{ width: `${goalProgress}%` }}
              />
            </div>
          </div>
        </div>
        <div className="bg-dark-card rounded-2xl border border-dark-border p-4 md:p-6 opacity-0 animate-fadeIn" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center gap-2 mb-1">
            <SparklesIcon className="w-4 h-4 text-green" />
            <p className="text-xs text-dark-text-secondary">Interested</p>
          </div>
          <p className="text-2xl font-heading font-bold text-green">{thisWeekInterested}</p>
          <p className="text-[10px] text-dark-text-secondary mt-1">
            {thisWeekOutbound > 0 ? `${Math.round((thisWeekInterested / thisWeekOutbound) * 100)}% rate` : 'No outreach yet'}
          </p>
        </div>
        <div className="bg-dark-card rounded-2xl border border-dark-border p-4 md:p-6 opacity-0 animate-fadeIn" style={{ animationDelay: '150ms' }}>
          <div className="flex items-center gap-2 mb-1">
            <ArrowTrendingUpIcon className="w-4 h-4 text-yellow-400" />
            <p className="text-xs text-dark-text-secondary">All-Time Interest</p>
          </div>
          <p className="text-2xl font-heading font-bold text-dark-text">{overallInterestRate}%</p>
          <p className="text-[10px] text-dark-text-secondary mt-1">{totalInterested} / {totalOutbound} total</p>
        </div>
        <div className="bg-dark-card rounded-2xl border border-dark-border p-4 md:p-6 opacity-0 animate-fadeIn flex items-center justify-center" style={{ animationDelay: '200ms' }}>
          <button
            onClick={onAdd}
            className="flex flex-col items-center gap-2 text-dark-text-secondary hover:text-accent transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <PlusIcon className="w-5 h-5 text-accent" />
            </div>
            <span className="text-xs font-heading">Log Outbound</span>
          </button>
        </div>
      </div>

      {/* Weekly Volume Chart */}
      <div className="bg-dark-card rounded-2xl border border-dark-border p-4 md:p-6 opacity-0 animate-fadeIn" style={{ animationDelay: '250ms' }}>
        <h3 className="text-sm font-heading font-semibold text-dark-text mb-3">Weekly Outbound Volume</h3>
        <div className="h-56 md:h-64">
          {weeklyData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
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
              No outbound data yet. Click "Log Outbound" to start tracking.
            </div>
          )}
        </div>
      </div>

      {/* Recent Entries */}
      {thisWeek.length > 0 && (
        <div className="bg-dark-card rounded-2xl border border-dark-border p-4 md:p-6 opacity-0 animate-fadeIn" style={{ animationDelay: '300ms' }}>
          <h3 className="text-sm font-heading font-semibold text-dark-text mb-3">This Week&apos;s Entries</h3>
          <div className="space-y-2">
            {thisWeek.map(e => (
              <div key={e.id} className="flex items-center justify-between bg-dark-bg rounded-xl p-3">
                <div className="flex items-center gap-3">
                  <div className="text-xs">
                    <span className="text-dark-text font-medium">{e.outbound_count} outbound</span>
                    {e.interested_count != null && (
                      <span className="text-dark-text-secondary"> - {e.interested_count} interested</span>
                    )}
                    {e.emails_replied != null && (
                      <span className="text-dark-text-secondary"> - {e.emails_replied} replied</span>
                    )}
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 bg-dark-card rounded text-dark-text-secondary capitalize">{e.source}</span>
                </div>
                <button
                  onClick={() => onEdit(e)}
                  className="p-1 text-dark-text-secondary hover:text-accent transition-colors"
                >
                  <PencilIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── History Tab ───
function HistoryTab({ entries, isAdmin, onEdit, onDelete }: {
  entries: OutboundEntry[]
  isAdmin: boolean
  onEdit: (e: OutboundEntry) => void
  onDelete: (id: string) => void
}) {
  // Group by week
  const byWeek = new Map<string, OutboundEntry[]>()
  for (const e of entries) {
    const existing = byWeek.get(e.week_start) || []
    existing.push(e)
    byWeek.set(e.week_start, existing)
  }

  const weeks = Array.from(byWeek.entries()).sort((a, b) => b[0].localeCompare(a[0]))

  return (
    <div className="space-y-4">
      {weeks.map(([weekStart, weekEntries], wi) => {
        const totalOutbound = weekEntries.reduce((s, e) => s + (e.outbound_count || 0), 0)
        const totalInterested = weekEntries.reduce((s, e) => s + (e.interested_count || 0), 0)
        const interestRate = totalOutbound > 0 ? Math.round((totalInterested / totalOutbound) * 100) : 0

        return (
          <div
            key={weekStart}
            className="bg-dark-card rounded-2xl border border-dark-border p-4 md:p-5 opacity-0 animate-fadeIn"
            style={{ animationDelay: `${50 + wi * 30}ms` }}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-heading font-semibold text-dark-text">
                  Week of {new Date(weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </h3>
                <p className="text-xs text-dark-text-secondary">
                  {totalOutbound} outbound - {totalInterested} interested - {interestRate}% rate
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {weekEntries.map(e => (
                <div key={e.id} className="flex items-center justify-between bg-dark-bg rounded-xl p-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-dark-text font-medium">{e.outbound_count} outbound</span>
                      {e.interested_count != null && (
                        <span className="text-green">{e.interested_count} interested</span>
                      )}
                      {e.emails_replied != null && (
                        <span className="text-dark-text-secondary">{e.emails_replied} replied</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] px-1.5 py-0.5 bg-dark-card rounded text-dark-text-secondary capitalize">{e.source}</span>
                      {isAdmin && e.recruiter && (
                        <span className="text-[10px] text-dark-text-secondary">{getFullName(e.recruiter)}</span>
                      )}
                      {e.notes && (
                        <span className="text-[10px] text-dark-text-secondary truncate">{e.notes}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button
                      onClick={() => onEdit(e)}
                      className="p-1.5 text-dark-text-secondary hover:text-accent transition-colors"
                    >
                      <PencilIcon className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(e.id)}
                      className="p-1.5 text-dark-text-secondary hover:text-error transition-colors"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {weeks.length === 0 && (
        <div className="text-center py-16">
          <PaperAirplaneIcon className="w-12 h-12 text-dark-text-secondary/30 mx-auto mb-3" />
          <p className="text-dark-text-secondary">No outbound entries yet</p>
          <p className="text-xs text-dark-text-secondary mt-1">Log your outbound or import from LinkedIn CSV</p>
        </div>
      )}
    </div>
  )
}

// ─── Outbound Form Modal ───
function OutboundFormModal({
  entry,
  recruiterId,
  onClose,
  onSaved,
}: {
  entry: OutboundEntry | null
  recruiterId: string
  onClose: () => void
  onSaved: () => void
}) {
  const supabase = createClient()
  const [saving, setSaving] = useState(false)

  // Default to current week's Monday
  const getDefaultWeekStart = () => {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const monday = new Date(now)
    monday.setDate(now.getDate() + mondayOffset)
    return monday.toISOString().split('T')[0]
  }

  const [form, setForm] = useState({
    week_start: entry?.week_start || getDefaultWeekStart(),
    outbound_count: entry?.outbound_count || 0,
    interested_count: entry?.interested_count || 0,
    emails_replied: entry?.emails_replied || 0,
    source: entry?.source || 'manual',
    notes: entry?.notes || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    // Calculate week_end
    const start = new Date(form.week_start)
    const end = new Date(start)
    end.setDate(end.getDate() + 6)

    const payload = {
      recruiter_id: recruiterId,
      week_start: form.week_start,
      week_end: end.toISOString().split('T')[0],
      outbound_count: form.outbound_count,
      interested_count: form.interested_count || null,
      emails_replied: form.emails_replied || null,
      source: form.source,
      notes: form.notes || null,
    }

    if (entry) {
      await supabase
        .from('outbound_entries')
        .update(payload)
        .eq('id', entry.id)
    } else {
      await supabase
        .from('outbound_entries')
        .insert(payload)
    }

    setSaving(false)
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-dark-card rounded-3xl border border-dark-border p-6 w-full max-w-md mx-4">
        <h2 className="text-lg font-heading font-semibold text-dark-text mb-4">
          {entry ? 'Edit Outbound Entry' : 'Log Outbound'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-dark-text-secondary mb-1">Week Starting</label>
            <input
              type="date"
              value={form.week_start}
              onChange={e => setForm({ ...form, week_start: e.target.value })}
              required
              className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-2.5 text-sm text-dark-text focus:outline-none focus:border-accent"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-dark-text-secondary mb-1">
                Outbound<span className="text-error ml-0.5">*</span>
              </label>
              <input
                type="number"
                min={0}
                value={form.outbound_count}
                onChange={e => setForm({ ...form, outbound_count: parseInt(e.target.value) || 0 })}
                required
                className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-2.5 text-sm text-dark-text focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-dark-text-secondary mb-1">Interested</label>
              <input
                type="number"
                min={0}
                value={form.interested_count}
                onChange={e => setForm({ ...form, interested_count: parseInt(e.target.value) || 0 })}
                className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-2.5 text-sm text-dark-text focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-dark-text-secondary mb-1">Replied</label>
              <input
                type="number"
                min={0}
                value={form.emails_replied}
                onChange={e => setForm({ ...form, emails_replied: parseInt(e.target.value) || 0 })}
                className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-2.5 text-sm text-dark-text focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-dark-text-secondary mb-1">Source</label>
            <select
              value={form.source}
              onChange={e => setForm({ ...form, source: e.target.value as any })}
              className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-2.5 text-sm text-dark-text focus:outline-none focus:border-accent"
            >
              <option value="manual">Manual</option>
              <option value="linkedin_csv">LinkedIn CSV</option>
              <option value="gem">Gem</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-dark-text-secondary mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-2.5 text-sm text-dark-text focus:outline-none focus:border-accent resize-none"
              placeholder="Optional notes..."
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-sm text-dark-text-secondary border border-dark-border rounded-xl hover:text-dark-text hover:border-dark-text-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 text-sm bg-accent text-white rounded-xl hover:bg-accent-hover transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : entry ? 'Update' : 'Log Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
