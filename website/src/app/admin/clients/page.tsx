'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useAuth } from '@/components/admin/AuthContext'
import Link from 'next/link'
import { BuildingOfficeIcon, BriefcaseIcon, UserGroupIcon, FlagIcon } from '@heroicons/react/24/outline'

interface ClientSummary {
  client_name: string
  project_count: number
  total_hire_goal: number
  total_hires: number
  active_projects: number
  projects: { id: string; name: string; status: string; hire_goal: number }[]
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-dark-border/50 rounded-xl animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-dark-border/50 via-dark-card to-dark-border/50 ${className}`} />
}

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientSummary[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => { fetchClients() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchClients = async () => {
    // Fetch all projects with hire counts
    const { data: projectData } = await supabase
      .from('projects')
      .select(`
        id, name, client_name, status, hire_goal,
        hires:candidates(count)
      `)
      .order('client_name')

    // Group by client_name
    const clientMap = new Map<string, ClientSummary>()
    for (const p of (projectData || [])) {
      const hires = (p as any).hires?.[0]?.count || 0
      const existing: ClientSummary = clientMap.get(p.client_name) || {
        client_name: p.client_name,
        project_count: 0,
        total_hire_goal: 0,
        total_hires: 0,
        active_projects: 0,
        projects: [],
      }
      existing.project_count++
      existing.total_hire_goal += p.hire_goal || 0
      existing.total_hires += hires
      if (p.status === 'active') existing.active_projects++
      existing.projects.push({ id: p.id, name: p.name, status: p.status, hire_goal: p.hire_goal })
      clientMap.set(p.client_name, existing)
    }

    setClients(Array.from(clientMap.values()).sort((a, b) => b.active_projects - a.active_projects))
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-64" />)}
        </div>
      </div>
    )
  }

  const totalClients = clients.length
  const totalActiveProjects = clients.reduce((s, c) => s + c.active_projects, 0)
  const totalHires = clients.reduce((s, c) => s + c.total_hires, 0)

  const statusColors: Record<string, string> = {
    active: 'bg-green/10 text-green',
    completed: 'bg-blue-500/10 text-blue-400',
    paused: 'bg-yellow-500/10 text-yellow-400',
    cancelled: 'bg-error/10 text-error',
  }

  return (
    <div className="p-3 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
        <div className="bg-dark-card rounded-2xl border border-dark-border p-3 md:p-6 opacity-0 animate-fadeIn" style={{ animationDelay: '50ms' }}>
          <div className="flex items-center gap-1.5 md:gap-2 mb-1 md:mb-2">
            <BuildingOfficeIcon className="w-4 h-4 md:w-5 md:h-5 text-accent" />
            <span className="text-xs md:text-sm text-dark-text-secondary">Clients</span>
          </div>
          <p className="text-xl md:text-2xl font-heading font-bold text-dark-text">{totalClients}</p>
        </div>
        <div className="bg-dark-card rounded-2xl border border-dark-border p-3 md:p-6 opacity-0 animate-fadeIn" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center gap-1.5 md:gap-2 mb-1 md:mb-2">
            <BriefcaseIcon className="w-4 h-4 md:w-5 md:h-5 text-yellow-400" />
            <span className="text-xs md:text-sm text-dark-text-secondary">Active Projects</span>
          </div>
          <p className="text-xl md:text-2xl font-heading font-bold text-dark-text">{totalActiveProjects}</p>
        </div>
        <div className="bg-dark-card rounded-2xl border border-dark-border p-3 md:p-6 opacity-0 animate-fadeIn" style={{ animationDelay: '150ms' }}>
          <div className="flex items-center gap-1.5 md:gap-2 mb-1 md:mb-2">
            <FlagIcon className="w-4 h-4 md:w-5 md:h-5 text-green" />
            <span className="text-xs md:text-sm text-dark-text-secondary">Total Hires</span>
          </div>
          <p className="text-xl md:text-2xl font-heading font-bold text-green">{totalHires}</p>
        </div>
      </div>

      {/* Client cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {clients.map((client, i) => {
          const progress = client.total_hire_goal > 0
            ? Math.min(100, Math.round((client.total_hires / client.total_hire_goal) * 100))
            : 0

          return (
            <div
              key={client.client_name}
              className="bg-dark-card rounded-2xl border border-dark-border p-4 md:p-6 hover:border-accent/30 hover:shadow-card-hover transition-all opacity-0 animate-fadeIn"
              style={{ animationDelay: `${200 + i * 80}ms` }}
            >
              {/* Header */}
              <div className="flex items-start gap-3 md:gap-4 mb-3 md:mb-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                  <span className="font-heading font-bold text-accent text-xs md:text-sm">
                    {client.client_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-heading font-semibold text-dark-text text-sm md:text-base truncate">{client.client_name}</h3>
                  <p className="text-xs text-dark-text-secondary">
                    {client.project_count} project{client.project_count !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-dark-bg rounded-xl p-3">
                  <p className="text-xs text-dark-text-secondary">Active Projects</p>
                  <p className="text-lg font-heading font-bold text-dark-text">{client.active_projects}</p>
                </div>
                <div className="bg-dark-bg rounded-xl p-3">
                  <p className="text-xs text-dark-text-secondary">Hires</p>
                  <p className="text-lg font-heading font-bold text-green">{client.total_hires}</p>
                </div>
              </div>

              {/* Hire Goal Progress */}
              {client.total_hire_goal > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-dark-text-secondary">Hire Goal Progress</span>
                    <span className="text-xs font-heading text-dark-text">{client.total_hires}/{client.total_hire_goal}</span>
                  </div>
                  <div className="h-1.5 bg-dark-bg rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${progress >= 100 ? 'bg-green' : progress >= 50 ? 'bg-accent' : 'bg-yellow-500'}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Projects list */}
              <div className="pt-3 border-t border-dark-border">
                <p className="text-[10px] text-dark-text-secondary mb-2">Projects</p>
                <div className="space-y-1.5">
                  {client.projects.slice(0, 3).map(p => (
                    <div key={p.id} className="flex items-center justify-between">
                      <span className="text-xs text-dark-text truncate">{p.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full capitalize ${statusColors[p.status] || ''}`}>
                        {p.status}
                      </span>
                    </div>
                  ))}
                  {client.projects.length > 3 && (
                    <Link href="/admin/projects" className="text-[10px] text-accent hover:text-accent-hover transition-colors">
                      +{client.projects.length - 3} more
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {clients.length === 0 && (
        <div className="text-center py-16">
          <BuildingOfficeIcon className="w-12 h-12 text-dark-text-secondary/30 mx-auto mb-3" />
          <p className="text-dark-text-secondary">No clients yet. Create a project to get started.</p>
        </div>
      )}
    </div>
  )
}
