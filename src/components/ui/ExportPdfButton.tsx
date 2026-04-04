'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/ExportPdfButton.tsx
//  PDF export button — calls /api/chart/export, opens in
//  new tab. Shows upgrade prompt for Free users.
// ─────────────────────────────────────────────────────────────

import React, { useState } from 'react'
import { useSession } from 'next-auth/react'
import type { ChartOutput } from '@/types/astrology'

interface Props {
  chart: ChartOutput
  /** compact = icon + short label, default = full label */
  compact?: boolean
  style?: React.CSSProperties
}

export function ExportPdfButton({ chart, compact = false, style }: Props) {
  const { data: session } = useSession()
  const plan = (session?.user as any)?.plan ?? 'free'
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  async function handleExport() {
    setError(null)

    // Free users → redirect to pricing
    if (plan === 'free') {
      window.location.href = '/pricing?highlight=gold'
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/chart/export', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(chart),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        if (data.upgradeRequired) {
          window.location.href = '/pricing?highlight=gold'
          return
        }
        throw new Error(data.error || 'Export failed')
      }

      // Get HTML blob and open in new tab
      const html = await res.text()
      const blob = new Blob([html], { type: 'text/html' })
      const url  = URL.createObjectURL(blob)
      const tab  = window.open(url, '_blank')

      // Clean up object URL after tab has loaded
      if (tab) {
        tab.addEventListener('load', () => {
          setTimeout(() => URL.revokeObjectURL(url), 5000)
        })
      } else {
        // Pop-up blocked — offer direct download
        const a = document.createElement('a')
        a.href = url
        a.download = `${chart.meta.name.replace(/[^a-z0-9]/gi, '_')}-jyotish.html`
        a.click()
        setTimeout(() => URL.revokeObjectURL(url), 5000)
      }
    } catch (e: any) {
      setError(e.message || 'Export failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const isFree = plan === 'free'

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
      <button
        onClick={handleExport}
        disabled={loading}
        title={isFree ? 'PDF export requires Gold plan' : `Export ${chart.meta.name} as PDF`}
        style={{
          display:        'inline-flex',
          alignItems:     'center',
          gap:            6,
          padding:        compact ? '5px 10px' : '7px 16px',
          borderRadius:   'var(--r-sm, 6px)',
          border:         `1px solid ${isFree ? 'var(--border-soft, #ccc)' : 'var(--border-accent, #8b5cf6)'}`,
          background:     isFree ? 'transparent' : 'rgba(139,92,246,0.08)',
          color:          isFree ? 'var(--text-muted, #888)' : 'var(--text-accent, #8b5cf6)',
          cursor:         loading ? 'wait' : 'pointer',
          fontSize:       compact ? '0.7rem' : '0.8rem',
          fontWeight:     600,
          fontFamily:     'inherit',
          opacity:        loading ? 0.6 : 1,
          transition:     'all 0.15s',
          whiteSpace:     'nowrap',
          ...style,
        }}
      >
        {loading ? (
          <>
            <span style={{ fontSize: 14 }}>⏳</span>
            {!compact && 'Preparing…'}
          </>
        ) : isFree ? (
          <>
            <span style={{ fontSize: 14 }}>🔒</span>
            {compact ? 'PDF' : 'PDF Export (Gold)'}
          </>
        ) : (
          <>
            <span style={{ fontSize: 14 }}>⬇</span>
            {compact ? 'PDF' : 'Download PDF'}
          </>
        )}
      </button>

      {error && (
        <span style={{ fontSize: '0.7rem', color: 'var(--rose, #e07b8e)', maxWidth: 200 }}>
          {error}
        </span>
      )}
    </div>
  )
}
