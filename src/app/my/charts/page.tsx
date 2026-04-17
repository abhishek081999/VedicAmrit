'use client'
// ─────────────────────────────────────────────────────────────
//  src/app/my/charts/page.tsx
//  Saved charts dashboard — lists all charts for logged-in user
//  Click a chart → loads it into the main calculator on home page
// ─────────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback } from 'react'
import { ChartNotes } from '@/components/ui/ChartNotes'
import { BulkImport } from '@/components/ui/BulkImport'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useAppLayout } from '@/components/providers/LayoutProvider'
import { useChart } from '@/components/providers/ChartProvider'

interface SavedChart {
  _id:        string
  name:       string
  birthDate:  string
  birthTime:  string
  birthPlace: string
  latitude:   number
  longitude:  number
  timezone:   string
  settings:   Record<string, unknown>
  isPublic:   boolean
  isPersonal: boolean
  slug:       string | null
  views:      number
  lastViewedAt: string | null
  createdAt:  string
}

type ChartUpdate = Partial<Pick<SavedChart, 'isPublic' | 'slug'>>

interface Pagination {
  page: number; limit: number; total: number; pages: number
}

function fmtDate(iso: string): string {
  const d = new Date(iso + 'T12:00:00Z')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

function fmtSaved(iso: string): string {
  const d   = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)   return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30)  return `${days}d ago`
  return fmtDate(iso.slice(0, 10))
}

function ChartCard({
  chart, isSelected, isDefault, toggleSelection, onLoad, onDelete, onUpdate, onSetDefault,
}: {
  chart: SavedChart
  isSelected:    boolean
  isDefault:     boolean
  toggleSelection: (id: string) => void
  onLoad:        (c: SavedChart) => void
  onDelete:      (id: string) => void | Promise<void>
  onUpdate:      (id: string, update: ChartUpdate) => void
  onSetDefault:  (id: string) => void
}) {
  const [confirmDel, setConfirmDel] = useState(false)
  const [deleting,   setDeleting]   = useState(false)
  const [toggling,   setToggling]   = useState(false)
  const [showNotes,  setShowNotes]  = useState(false)
  const [exporting,  setExporting]  = useState(false)

  async function handleExportPdf() {
    setExporting(true)
    try {
      // Step 1: recalculate the chart
      const calcRes = await fetch('/api/chart/calculate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:       chart.name,
          birthDate:  chart.birthDate,
          birthTime:  chart.birthTime,
          birthPlace: chart.birthPlace,
          latitude:   chart.latitude,
          longitude:  chart.longitude,
          timezone:   chart.timezone,
          settings:   chart.settings,
        }),
      })
      const calcJson = await calcRes.json()
      if (!calcJson.success) throw new Error('Calculation failed')

      // Step 2: export to HTML
      const exportRes = await fetch('/api/chart/export', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(calcJson.data),
      })
      if (!exportRes.ok) {
        const err = await exportRes.json().catch(() => ({}))
        if (err.upgradeRequired) { window.location.href = '/pricing?highlight=gold'; return }
        throw new Error(err.error || 'Export failed')
      }

      const html = await exportRes.text()
      const blob = new Blob([html], { type: 'text/html' })
      const url  = URL.createObjectURL(blob)
      const tab  = window.open(url, '_blank')
      if (!tab) {
        const a = document.createElement('a')
        a.href = url
        a.download = `${chart.name.replace(/[^a-z0-9]/gi,'_')}-jyotish.html`
        a.click()
      }
      setTimeout(() => URL.revokeObjectURL(url), 8000)
    } catch (e: any) {
      alert(e.message || 'Export failed. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  async function handleTogglePublic() {
    setToggling(true)
    try {
      const res  = await fetch('/api/chart/toggle-public', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ chartId: chart._id }),
      })
      const json = await res.json()
      if (json.success) {
        onUpdate(chart._id, { isPublic: json.isPublic, slug: json.slug })
        // Copy share link to clipboard if now public
        if (json.isPublic && json.slug) {
          const url = `${window.location.origin}/chart/${json.slug}`
          navigator.clipboard.writeText(url).catch(() => {})
        }
      }
    } finally {
      setToggling(false)
    }
  }

  async function handleDelete() {
    if (!confirmDel) { setConfirmDel(true); return }
    setDeleting(true)
    await onDelete(chart._id)
    setDeleting(false)
  }

  async function handleSetDefault() {
    try {
      const res = await fetch('/api/user/default-chart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chartId: chart._id })
      })
      const json = await res.json()
      if (json.success) {
        onSetDefault(chart._id)
      }
    } catch (e) {
      console.error('Failed to set default', e)
    }
  }

  return (
    <div style={{
      background: 'var(--surface-1)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-lg)',
      padding: '1.1rem 1.25rem',
      display: 'flex', flexDirection: 'column', gap: '0.5rem',
      transition: 'border-color 0.15s, box-shadow 0.15s',
      cursor: 'default',
    }}
    onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
      e.currentTarget.style.borderColor = 'var(--border-bright)'
      e.currentTarget.style.boxShadow = 'var(--shadow-card)'
    }}
    onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
      e.currentTarget.style.borderColor = 'var(--border)'
      e.currentTarget.style.boxShadow = 'none'
    }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <input 
          type="checkbox"
          checked={isSelected}
          onChange={() => toggleSelection(chart._id)}
          onClick={(e) => e.stopPropagation()}
          style={{ 
            width: 16, height: 16, 
            accentColor: 'var(--gold)',
            cursor: 'pointer' 
          }}
        />
        <span style={{
          fontFamily: 'var(--font-display)', fontSize: '1.05rem',
          fontWeight: 600, color: 'var(--text-primary)', flex: 1,
        }}>
          {chart.name}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); handleSetDefault() }}
          title={isDefault ? "Default Chart (Loads on Login)" : "Set as Default (Load on Login)"}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem',
            color: isDefault ? 'var(--gold)' : 'var(--text-muted)',
            opacity: isDefault ? 1 : 0.3,
            transition: 'all 0.2s',
            padding: '2px',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '1'}
          onMouseLeave={e => !isDefault && (e.currentTarget.style.opacity = '0.3')}
        >
          {isDefault ? '★' : '☆'}
        </button>
        {chart.isPersonal && (
          <span className="badge badge-gold" style={{ fontSize: '0.62rem' }}>Personal</span>
        )}
        {chart.isPublic && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span className="badge badge-accent" style={{ fontSize: '0.62rem' }}>Public</span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              👁 {chart.views ?? 0}
            </span>
          </div>
        )}
      </div>

      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: '0.78rem',
        color: 'var(--text-secondary)', display: 'flex', gap: '0.75rem', flexWrap: 'wrap',
      }}>
        <span>📅 {fmtDate(chart.birthDate)}</span>
        <span>🕐 {chart.birthTime.slice(0, 5)}</span>
      </div>
      <div style={{
        fontSize: '0.8rem', color: 'var(--text-muted)',
        fontFamily: 'var(--font-display)', fontStyle: 'italic',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        📍 {chart.birthPlace}
      </div>

      <div style={{
        fontSize: '0.68rem', color: 'var(--text-muted)',
        fontFamily: 'var(--font-mono)', marginTop: 2,
      }}>
        Saved {fmtSaved(chart.createdAt)}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => onLoad(chart)}
          className="btn btn-primary btn-sm"
          style={{ flex: 1, minWidth: 100, justifyContent: 'center', fontSize: '0.82rem' }}
        >
          Open Chart
        </button>

        {/* Export PDF */}
        <button
          onClick={handleExportPdf}
          disabled={exporting}
          title="Export chart as PDF"
          style={{
            padding: '0.3rem 0.65rem',
            background: 'rgba(139,92,246,0.08)',
            border: '1px solid rgba(139,92,246,0.25)',
            borderRadius: 'var(--r-md)',
            fontSize: '0.78rem',
            color: 'var(--text-accent, #8b5cf6)',
            cursor: exporting ? 'wait' : 'pointer',
            display: 'flex', alignItems: 'center', gap: '0.3rem',
            transition: 'all 0.15s',
            opacity: exporting ? 0.6 : 1,
          }}
        >
          {exporting ? '⏳' : '⬇'} PDF
        </button>

        {/* Make Public / Share toggle */}
        <button
          onClick={handleTogglePublic}
          disabled={toggling}
          title={chart.isPublic ? 'Make private (remove share link)' : 'Make public & get share link'}
          style={{
            padding: '0.3rem 0.65rem',
            background: chart.isPublic ? 'rgba(78,205,196,0.10)' : 'var(--surface-2)',
            border: `1px solid ${chart.isPublic ? 'rgba(78,205,196,0.35)' : 'var(--border)'}`,
            borderRadius: 'var(--r-md)',
            fontSize: '0.78rem',
            color: chart.isPublic ? 'var(--teal)' : 'var(--text-muted)',
            cursor: toggling ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', gap: '0.3rem',
            transition: 'all 0.15s',
          }}
        >
          {toggling ? '…' : chart.isPublic ? '🔗 Public' : '🔗 Share'}
        </button>

        {/* Copy link if public */}
        {chart.isPublic && chart.slug && (
          <Link
            href={`/chart/${chart.slug}`}
            target="_blank"
            title="Open public chart page"
            style={{
              padding: '0.3rem 0.65rem',
              background: 'rgba(78,205,196,0.06)',
              border: '1px solid rgba(78,205,196,0.20)',
              borderRadius: 'var(--r-md)',
              fontSize: '0.78rem',
              color: 'var(--teal)',
              textDecoration: 'none',
              display: 'flex', alignItems: 'center',
            }}
          >
            ↗
          </Link>
        )}

        <button
          onClick={handleDelete}
          disabled={deleting}
          style={{
            padding: '0.3rem 0.65rem',
            background: confirmDel ? 'rgba(224,123,142,0.15)' : 'var(--surface-2)',
            border: `1px solid ${confirmDel ? 'rgba(224,123,142,0.40)' : 'var(--border)'}`,
            borderRadius: 'var(--r-md)',
            fontSize: '0.78rem',
            color: confirmDel ? 'var(--rose)' : 'var(--text-muted)',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onBlur={() => setConfirmDel(false)}
        >
          {deleting ? '…' : confirmDel ? 'Confirm?' : '🗑'}
        </button>

        {/* Notes toggle */}
        <button
          onClick={() => setShowNotes(n => !n)}
          title="View / add notes"
          style={{
            padding: '0.3rem 0.65rem',
            background: showNotes ? 'rgba(139,124,246,0.12)' : 'var(--surface-2)',
            border: `1px solid ${showNotes ? 'rgba(139,124,246,0.35)' : 'var(--border)'}`,
            borderRadius: 'var(--r-md)',
            fontSize: '0.78rem',
            color: showNotes ? 'var(--accent)' : 'var(--text-muted)',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          ✏
        </button>
      </div>

      {/* Notes panel */}
      {showNotes && (
        <div style={{
          marginTop: '0.5rem',
          borderTop: '1px solid var(--border-soft)',
          paddingTop: '0.75rem',
        }}>
          <ChartNotes chartId={chart._id} />
        </div>
      )}
    </div>
  )
}

export default function MyChartsPage() {
  const router  = useRouter()
  const { data: session, status } = useSession()
  const { setActiveTab } = useAppLayout()
  const { setChart } = useChart()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/my/charts')
    }
  }, [status, router])

  const [charts,      setCharts]      = useState<SavedChart[]>([])
  const [pag,         setPag]         = useState<Pagination | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState<string | null>(null)
  const [page,        setPage]        = useState(1)
  const [search,      setSearch]      = useState('')
  const [exporting,        setExporting]        = useState(false)
  const [bulkExporting,    setBulkExporting]    = useState(false)
  const [tmplDownloading,  setTmplDownloading]  = useState(false)
  const [selectedIds,      setSelectedIds]      = useState<string[]>([])
  const [defaultChartId,   setDefaultChartId]   = useState<string | null>(null)

  const userPlan = (session?.user as any)?.plan ?? 'free'

  async function handleBulkZipExport() {
    if (userPlan !== 'platinum') {
      window.location.href = '/pricing?highlight=platinum'
      return
    }
    if (selectedIds.length === 0) return
    
    setBulkExporting(true)
    try {
      const res = await fetch('/api/chart/bulk-export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chartIds: selectedIds })
      })
      
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        alert(json.error || 'Bulk export failed')
        return
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Vedaansh_Charts_Export_${new Date().toISOString().slice(0, 10)}.zip`
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 5000)
      setSelectedIds([])
    } catch {
      alert('Could not export ZIP. Please try again.')
    } finally {
      setBulkExporting(false)
    }
  }

  function toggleSelection(id: string) {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  async function handleExportAll() {
    setExporting(true)
    try {
      const res = await fetch('/api/chart/export-xlsx')
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        alert(json.error || 'Export failed')
        return
      }
      const blob     = await res.blob()
      const url      = URL.createObjectURL(blob)
      const filename = res.headers.get('Content-Disposition')
        ?.match(/filename="(.+)"/)?.[1] ?? 'vedaansh-charts.xlsx'
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 6000)
    } catch {
      alert('Could not export charts. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  async function handleDownloadTemplate() {
    setTmplDownloading(true)
    try {
      const res = await fetch('/api/chart/template')
      if (!res.ok) throw new Error('Template generation failed')
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = 'vedaansh-charts-template.xlsx'
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 5000)
    } catch {
      alert('Could not download template. Please try again.')
    } finally {
      setTmplDownloading(false)
    }
  }

  const fetchCharts = useCallback(async (p: number) => {
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch(`/api/chart/list?page=${p}&limit=20`)
      const json = await res.json()
      if (res.status === 401) {
        router.push('/login?callbackUrl=/my/charts')
        return
      }
      if (!json.success) throw new Error(json.error)
      setCharts(json.charts)
      setPag(json.pagination)

      // Fetch default chart ID
      const defRes = await fetch('/api/user/default-chart')
      const defJson = await defRes.json()
      if (defJson.success) {
        setDefaultChartId(defJson.defaultChartId)
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => { fetchCharts(page) }, [page, fetchCharts])

  function handleLoad(chart: SavedChart) {
    setChart(null) // Clear old state immediately
    setActiveTab('dashboard')
    const params = new URLSearchParams({
      name:       chart.name,
      birthDate:  chart.birthDate,
      birthTime:  chart.birthTime,
      birthPlace: chart.birthPlace,
      lat:        chart.latitude.toString(),
      lng:        chart.longitude.toString(),
      tz:         chart.timezone,
    })
    router.push(`/?${params.toString()}`)
  }

  function handleUpdate(id: string, update: ChartUpdate) {
    setCharts((prev: SavedChart[]) =>
      prev.map((c: SavedChart) => c._id === id ? { ...c, ...update } : c)
    )
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/chart/delete?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      setCharts((prev: SavedChart[]) => prev.filter((c: SavedChart) => c._id !== id))
      setPag((prev: Pagination | null) => prev ? { ...prev, total: prev.total - 1 } : prev)
    }
  }

  const filtered = charts.filter((c: SavedChart) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.birthPlace.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <main style={{ maxWidth: 1000, width: '100%', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 4vw, 2rem)',
          fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.3rem',
        }}>
          My Charts
        </h1>
        {pag && (
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {pag.total} chart{pag.total !== 1 ? 's' : ''} saved
          </div>
        )}
      </div>

      <div className="charts-toolbar">
        <input
          className="input"
          placeholder="Search by name or place…"
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200 }}
        />
        {/* Export all charts as XLSX */}
        {(pag?.total ?? 0) > 0 && (
          <button
            id="export-all-xlsx-btn"
            onClick={handleExportAll}
            disabled={exporting}
            className="btn btn-ghost"
            style={{
              whiteSpace: 'nowrap',
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              opacity: exporting ? 0.6 : 1,
            }}
            title={`Export all ${pag?.total} charts as XLSX`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            {exporting ? 'Exporting…' : 'Export XLSX'}
          </button>
        )}
        {/* Download blank template */}
        <button
          id="download-template-btn"
          onClick={handleDownloadTemplate}
          disabled={tmplDownloading}
          className="btn btn-ghost"
          style={{
            whiteSpace: 'nowrap',
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            opacity: tmplDownloading ? 0.6 : 1,
            borderColor: 'rgba(201,168,76,0.35)',
            color: 'var(--gold)',
          }}
          title="Download XLSX template to fill and import"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          {tmplDownloading ? 'Downloading…' : '⬇ Template'}
        </button>
        <BulkImport onImportComplete={() => fetchCharts(page)} />
        <Link href="/" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
          + New Chart
        </Link>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <div className="spin-loader" style={{
            width: 32, height: 32, margin: '0 auto 1rem',
            border: '3px solid var(--border)', borderTopColor: 'var(--gold)',
          }} />
          <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>Loading charts…</div>
        </div>
      )}

      {error && (
        <div style={{
          padding: '1rem', borderRadius: 'var(--r-md)',
          background: 'rgba(224,123,142,0.08)', border: '1px solid rgba(224,123,142,0.25)',
          color: 'var(--rose)', fontFamily: 'var(--font-display)', marginBottom: '1rem',
        }}>
          {error === 'Not authenticated'
            ? <>Please <Link href="/" style={{ color: 'var(--gold)' }}>sign in</Link> to view saved charts.</>
            : error}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🪐</div>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            {search ? 'No charts match your search' : 'No saved charts yet'}
          </p>
          <Link href="/" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
            Calculate a Chart
          </Link>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.85rem' }}>
          {filtered.map((chart) => (
            <ChartCard 
              key={chart._id} 
              chart={chart} 
              isSelected={selectedIds.includes(chart._id)}
              isDefault={defaultChartId === chart._id}
              toggleSelection={toggleSelection}
              onLoad={handleLoad} 
              onDelete={handleDelete} 
              onUpdate={handleUpdate} 
              onSetDefault={(id) => setDefaultChartId(id)}
            />
          ))}
        </div>
      )}

      {/* Floating Action Bar for Bulk Selection */}
      {selectedIds.length > 0 && (
        <div className="charts-floating-actions">
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {selectedIds.length} chart{selectedIds.length > 1 ? 's' : ''} selected
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleBulkZipExport}
              disabled={bulkExporting}
              className="btn btn-primary btn-sm"
              style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              {bulkExporting ? '📦 Zipping…' : '⬇ Download ZIP'}
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="btn btn-ghost btn-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translate(-50%, 20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>

      {pag && pag.pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem', flexWrap: 'wrap' }}>
          {Array.from({ length: pag.pages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              style={{
                padding: '0.35rem 0.75rem',
                background: p === page ? 'rgba(201,168,76,0.15)' : 'var(--surface-2)',
                border: `1px solid ${p === page ? 'var(--border-bright)' : 'var(--border)'}`,
                borderRadius: 'var(--r-md)',
                fontFamily: 'var(--font-mono)', fontSize: '0.82rem',
                color: p === page ? 'var(--text-gold)' : 'var(--text-secondary)',
                cursor: 'pointer', fontWeight: p === page ? 700 : 400,
              }}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </main>
  )
}