// ─────────────────────────────────────────────────────────────
//  src/components/ui/TransitOverlay.tsx
//  Transit chart overlay — fetches current planet positions
//  and passes them to the chart for dual rendering
// ─────────────────────────────────────────────────────────────
'use client'

import { useState, useEffect, useCallback } from 'react'
import type { GrahaData, ChartOutput } from '@/types/astrology'

interface TransitOverlayProps {
  natalChart:    ChartOutput
  onTransitLoad: (grahas: GrahaData[] | null) => void
}

const GRAHA_SYMBOL: Record<string, string> = {
  Su:'☀', Mo:'☽', Ma:'♂', Me:'☿', Ju:'♃', Ve:'♀', Sa:'♄', Ra:'☊', Ke:'☋'
}
const GRAHA_NAME: Record<string, string> = {
  Su:'Sun', Mo:'Moon', Ma:'Mars', Me:'Mercury',
  Ju:'Jupiter', Ve:'Venus', Sa:'Saturn', Ra:'Rahu', Ke:'Ketu'
}

function todayIST(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date())
}
function nowTimeIST(): string {
  const d = new Date()
  const h = String(d.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false, hour: '2-digit' })).padStart(2,'0')
  const m = String(d.getMinutes()).padStart(2,'0')
  return `${h}:${m}:00`
}

export function TransitOverlay({ natalChart, onTransitLoad }: TransitOverlayProps) {
  const [enabled,  setEnabled]  = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [transit,  setTransit]  = useState<ChartOutput | null>(null)
  const [error,    setError]    = useState<string | null>(null)
  const [date,     setDate]     = useState(todayIST())

  const fetchTransit = useCallback(async (d: string) => {
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch('/api/chart/calculate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:       'Transit',
          birthDate:  d,
          birthTime:  nowTimeIST(),
          birthPlace: natalChart.meta.birthPlace,
          latitude:   natalChart.meta.latitude,
          longitude:  natalChart.meta.longitude,
          timezone:   natalChart.meta.timezone,
          settings:   natalChart.meta.settings,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setTransit(json.data)
      onTransitLoad(json.data.grahas)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed')
      onTransitLoad(null)
    } finally {
      setLoading(false)
    }
  }, [natalChart, onTransitLoad])

  // Auto-fetch when enabled
  useEffect(() => {
    if (enabled) fetchTransit(date)
    else { setTransit(null); onTransitLoad(null) }
  }, [enabled, date]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{
      background: enabled ? 'rgba(139,124,246,0.08)' : 'var(--surface-2)',
      border: `1px solid ${enabled ? 'rgba(139,124,246,0.35)' : 'var(--border)'}`,
      borderRadius: 'var(--r-md)',
      padding: '0.75rem 1rem',
      transition: 'all 0.2s',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        {/* Toggle */}
        <button
          onClick={() => setEnabled(e => !e)}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          }}
        >
          <div style={{
            width: 36, height: 20, borderRadius: 99, position: 'relative',
            background: enabled ? 'var(--accent)' : 'var(--surface-4)',
            transition: 'background 0.2s',
          }}>
            <div style={{
              position: 'absolute', top: 3, left: enabled ? 19 : 3,
              width: 14, height: 14, borderRadius: '50%', background: '#fff',
              transition: 'left 0.2s',
            }} />
          </div>
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: '0.85rem',
            fontWeight: 600, color: enabled ? 'var(--accent)' : 'var(--text-secondary)',
          }}>
            Transit Overlay
          </span>
        </button>

        {/* Date picker */}
        {enabled && (
          <input
            type="date"
            value={date}
            max={todayIST()}
            onChange={e => setDate(e.target.value)}
            style={{
              background: 'var(--surface-3)', border: '1px solid var(--border)',
              borderRadius: 'var(--r-sm)', padding: '0.2rem 0.5rem',
              fontFamily: 'var(--font-mono)', fontSize: '0.78rem',
              color: 'var(--text-primary)', cursor: 'pointer',
            }}
          />
        )}

        {loading && (
          <span className="spin-loader" style={{
            width: 14, height: 14,
            border: '2px solid var(--border)',
            borderTopColor: 'var(--accent)',
          }} />
        )}

        {enabled && !loading && transit && (
          <span style={{
            fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.06em',
            textTransform: 'uppercase', color: 'var(--accent)',
            fontFamily: 'var(--font-display)',
          }}>
            ✓ Live
          </span>
        )}

        {error && (
          <span style={{ fontSize: '0.75rem', color: 'var(--rose)', fontFamily: 'var(--font-display)' }}>
            {error}
          </span>
        )}
      </div>

      {/* Transit positions summary */}
      {enabled && transit && !loading && (
        <div style={{ marginTop: '0.65rem', display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          {transit.grahas.map(g => (
            <span key={g.id} style={{
              padding: '0.12rem 0.45rem', borderRadius: 99, fontSize: '0.7rem',
              background: 'rgba(139,124,246,0.12)', border: '1px solid rgba(139,124,246,0.25)',
              fontFamily: 'var(--font-mono)', color: 'var(--accent)',
            }}>
              {GRAHA_SYMBOL[g.id]} {g.rashi ? `H${g.rashi}` : g.id}
              {g.isRetro ? <span style={{ color: 'var(--rose)', marginLeft: 2 }}>℞</span> : ''}
            </span>
          ))}
        </div>
      )}

      {/* Legend */}
      {enabled && (
        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '1rem', fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
          <span style={{ color: 'var(--text-primary)' }}>● Natal</span>
          <span style={{ color: 'var(--accent)' }}>● Transit</span>
        </div>
      )}
    </div>
  )
}