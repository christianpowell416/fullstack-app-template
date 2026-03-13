'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useAuth } from '@/components/admin/AuthContext'
import {
  ArrowUpTrayIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'

type ImportType = 'linkedin_outbound' | 'candidates'

export default function ImportPage() {
  const [importType, setImportType] = useState<ImportType>('linkedin_outbound')
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ success: number; errors: string[] } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()
  const supabase = createClient()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f && f.name.endsWith('.csv')) {
      setFile(f)
      setResult(null)
    }
  }

  const parseCsv = (text: string): Record<string, string>[] => {
    const lines = text.split('\n').filter(l => l.trim())
    if (lines.length < 2) return []

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase())
    return lines.slice(1).map(line => {
      const values = line.match(/(".*?"|[^,]+)/g)?.map(v => v.trim().replace(/^"|"$/g, '')) || []
      const row: Record<string, string> = {}
      headers.forEach((h, i) => { row[h] = values[i] || '' })
      return row
    })
  }

  const importLinkedInOutbound = async (rows: Record<string, string>[]) => {
    let success = 0
    const errors: string[] = []

    for (const row of rows) {
      const weekStart = row['week_start'] || row['week start'] || row['date']
      const count = parseInt(row['outbound_count'] || row['outbound'] || row['messages_sent'] || row['count'] || '0')

      if (!weekStart || isNaN(count)) {
        errors.push(`Skipped row: missing week_start or outbound_count`)
        continue
      }

      // Calculate week_end as 6 days after week_start
      const start = new Date(weekStart)
      const end = new Date(start)
      end.setDate(end.getDate() + 6)

      const { error } = await supabase
        .from('outbound_entries')
        .upsert({
          recruiter_id: user!.id,
          week_start: weekStart,
          week_end: end.toISOString().split('T')[0],
          outbound_count: count,
          source: 'linkedin_csv',
        }, { onConflict: 'recruiter_id,week_start,source' })

      if (error) {
        errors.push(`Row ${weekStart}: ${error.message}`)
      } else {
        success++
      }
    }

    return { success, errors }
  }

  const importCandidates = async (rows: Record<string, string>[]) => {
    let success = 0
    const errors: string[] = []

    for (const row of rows) {
      const name = row['candidate_name'] || row['name'] || row['candidate name']
      const role = row['role'] || row['position']

      if (!name || !role) {
        errors.push(`Skipped row: missing candidate_name or role`)
        continue
      }

      const { error } = await supabase
        .from('candidates')
        .insert({
          recruiter_id: user!.id,
          candidate_name: name,
          role,
          email: row['email'] || null,
          phone: row['phone'] || null,
          linkedin_url: row['linkedin_url'] || row['linkedin'] || null,
          title: row['title'] || row['current_title'] || null,
          company: row['company'] || row['current_company'] || null,
          school: row['school'] || row['education'] || null,
          location: row['location'] || null,
          hiring_manager: row['hiring_manager'] || row['hiring manager'] || null,
          team: row['team'] || null,
          source: row['source'] || 'Other',
          stage: row['stage'] || 'sourced',
          notes: row['notes'] || null,
          additional_notes: row['additional_notes'] || row['additional notes'] || null,
        })

      if (error) {
        errors.push(`${name}: ${error.message}`)
      } else {
        success++
      }
    }

    return { success, errors }
  }

  const handleImport = async () => {
    if (!file) return
    setImporting(true)
    setResult(null)

    try {
      const text = await file.text()
      const rows = parseCsv(text)

      if (rows.length === 0) {
        setResult({ success: 0, errors: ['No valid rows found in CSV'] })
        setImporting(false)
        return
      }

      const res = importType === 'linkedin_outbound'
        ? await importLinkedInOutbound(rows)
        : await importCandidates(rows)

      setResult(res)
    } catch (err) {
      setResult({ success: 0, errors: [`Parse error: ${err instanceof Error ? err.message : 'Unknown'}`] })
    }

    setImporting(false)
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      {/* Import Type Selection */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => { setImportType('linkedin_outbound'); setFile(null); setResult(null) }}
          className={`flex-1 p-4 rounded-2xl border text-left transition-all ${
            importType === 'linkedin_outbound'
              ? 'border-accent bg-accent/5'
              : 'border-dark-border bg-dark-card hover:border-dark-text-secondary'
          }`}
        >
          <h3 className="text-sm font-medium text-white">LinkedIn Outbound</h3>
          <p className="text-xs text-dark-text-secondary mt-1">
            Import weekly outbound message counts from LinkedIn exports
          </p>
        </button>
        <button
          onClick={() => { setImportType('candidates'); setFile(null); setResult(null) }}
          className={`flex-1 p-4 rounded-2xl border text-left transition-all ${
            importType === 'candidates'
              ? 'border-accent bg-accent/5'
              : 'border-dark-border bg-dark-card hover:border-dark-text-secondary'
          }`}
        >
          <h3 className="text-sm font-medium text-white">Candidates</h3>
          <p className="text-xs text-dark-text-secondary mt-1">
            Bulk import candidates from a CSV file (migration from Excel)
          </p>
        </button>
      </div>

      {/* Expected Format */}
      <div className="bg-dark-card rounded-2xl border border-dark-border p-4 mb-6">
        <h3 className="text-xs font-medium text-dark-text-secondary mb-2">Expected CSV columns</h3>
        <code className="text-xs text-accent block">
          {importType === 'linkedin_outbound'
            ? 'week_start, outbound_count'
            : 'candidate_name, role, email, phone, linkedin_url, title, company, school, location, hiring_manager, team, source, stage, notes'}
        </code>
      </div>

      {/* File Upload */}
      <div
        className="border-2 border-dashed border-dark-border rounded-2xl p-8 text-center cursor-pointer hover:border-accent/30 transition-colors mb-6"
        onClick={() => fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
        />
        {file ? (
          <div className="flex items-center justify-center gap-3">
            <DocumentTextIcon className="w-8 h-8 text-accent" />
            <div className="text-left">
              <p className="text-sm text-white">{file.name}</p>
              <p className="text-xs text-dark-text-secondary">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
          </div>
        ) : (
          <>
            <ArrowUpTrayIcon className="w-8 h-8 text-dark-text-secondary mx-auto mb-2" />
            <p className="text-sm text-dark-text-secondary">Click to upload a CSV file</p>
          </>
        )}
      </div>

      {/* Import Button */}
      <button
        onClick={handleImport}
        disabled={!file || importing}
        className="w-full py-3 bg-accent text-white rounded-xl font-heading font-semibold hover:bg-accent-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-6"
      >
        {importing ? 'Importing...' : `Import ${importType === 'linkedin_outbound' ? 'Outbound Data' : 'Candidates'}`}
      </button>

      {/* Results */}
      {result && (
        <div className="bg-dark-card rounded-2xl border border-dark-border p-4">
          <div className="flex items-center gap-2 mb-2">
            {result.errors.length === 0 ? (
              <CheckCircleIcon className="w-5 h-5 text-green" />
            ) : (
              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400" />
            )}
            <span className="text-sm font-medium text-white">
              {result.success} record{result.success !== 1 ? 's' : ''} imported
            </span>
          </div>
          {result.errors.length > 0 && (
            <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
              {result.errors.map((err, i) => (
                <p key={i} className="text-xs text-error">{err}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
