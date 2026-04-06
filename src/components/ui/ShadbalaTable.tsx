'use client'

import React, { useMemo, useState } from 'react'
import type { ShadbalaPlanet, ShadbalaResult } from '@/types/astrology'
import { BarChart3, Palette, Printer, ScrollText, Sparkles } from 'lucide-react'

const ORDER = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa'] as const
type PlanetCode = (typeof ORDER)[number]
type ViewMode = 'modern' | 'classic'

const PLANET_NAMES: Record<PlanetCode, string> = {
  Su: 'Sun',
  Mo: 'Moon',
  Ma: 'Mars',
  Me: 'Mercury',
  Ju: 'Jupiter',
  Ve: 'Venus',
  Sa: 'Saturn',
}

const PLANET_SYMBOL: Record<PlanetCode, string> = {
  Su: '☀',
  Mo: '☽',
  Ma: '♂',
  Me: '☿',
  Ju: '♃',
  Ve: '♀',
  Sa: '♄',
}

const PLANET_COLOR: Record<PlanetCode, string> = {
  Su: '#FDB813',
  Mo: '#E6E6E6',
  Ma: '#FF4D4D',
  Me: '#00D084',
  Ju: '#FFD700',
  Ve: '#FF69B4',
  Sa: '#8B8B8B',
}

const COMPONENTS: Array<{ key: keyof ShadbalaPlanet; label: string; full: string }> = [
  { key: 'sthanaBala', label: 'Sthana', full: 'Positional Strength' },
  { key: 'digBala', label: 'Dig', full: 'Directional Strength' },
  { key: 'kalaBala', label: 'Kala', full: 'Temporal Strength' },
  { key: 'chestaBala', label: 'Chesta', full: 'Motional Strength' },
  { key: 'naisargikaBala', label: 'Naisargika', full: 'Natural Strength' },
  { key: 'drikBala', label: 'Drik', full: 'Aspectual Strength' },
]

const VIEW_MODES: Array<{ id: ViewMode; label: string; icon: typeof Palette }> = [
  { id: 'modern', label: 'Modern', icon: Palette },
  { id: 'classic', label: 'Classic', icon: ScrollText },
]

function scoreColor(ratio: number) {
  if (ratio >= 1.2) return 'var(--text-gold)'
  if (ratio >= 1.0) return 'var(--teal)'
  if (ratio >= 0.85) return 'var(--amber)'
  return 'var(--rose)'
}

function statusLabel(ratio: number) {
  if (ratio >= 1.2) return 'excellent'
  if (ratio >= 1.0) return 'strong'
  if (ratio >= 0.85) return 'average'
  return 'weak'
}

function tone(mode: ViewMode) {
  return mode === 'modern'
    ? 'linear-gradient(135deg, rgba(139,124,246,0.12), rgba(201,168,76,0.06))'
    : 'linear-gradient(135deg, rgba(132,27,27,0.10), rgba(166,124,0,0.08))'
}

function RadarChart({ values, color, size = 130 }: { values: number[]; color: string; size?: number }) {
  const center = size / 2
  const radius = size * 0.36
  const step = (Math.PI * 2) / 6
  const points = values
    .map((val, i) => {
      const angle = i * step - Math.PI / 2
      const mag = Math.min(radius, (val / 2.2) * radius)
      const x = center + Math.cos(angle) * mag
      const y = center + Math.sin(angle) * mag
      return `${x},${y}`
    })
    .join(' ')
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {[0.25, 0.5, 0.75, 1].map((p) => {
        const ring = Array.from({ length: 6 }).map((_, i) => {
          const angle = i * step - Math.PI / 2
          const x = center + Math.cos(angle) * radius * p
          const y = center + Math.sin(angle) * radius * p
          return `${x},${y}`
        }).join(' ')
        return <polygon key={p} points={ring} fill="none" stroke="var(--border-soft)" strokeWidth={0.8} />
      })}
      <polygon points={points} fill={`${color}33`} stroke={color} strokeWidth={2} />
    </svg>
  )
}

function ComparisonBars({ planets }: { planets: Record<string, ShadbalaPlanet> }) {
  const maxTotal = useMemo(() => Math.max(...ORDER.map((id) => planets[id]?.total ?? 0), 12), [planets])
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0,1fr))', gap: '0.45rem', alignItems: 'end', minHeight: 180 }}>
      {ORDER.map((id) => {
        const p = planets[id]
        if (!p) return null
        const h = Math.max(3, (p.total / maxTotal) * 130)
        const req = Math.max(1, (p.required / maxTotal) * 130)
        return (
          <div key={id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
            <div style={{ fontSize: '0.68rem', color: scoreColor(p.ratio), fontWeight: 700 }}>{p.total.toFixed(2)}</div>
            <div style={{ width: '100%', maxWidth: 34, height: 132, borderRadius: 6, background: 'var(--surface-3)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', bottom: `${req}px`, left: 0, right: 0, height: 2, background: 'var(--text-muted)' }} />
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: `${h}px`, background: `linear-gradient(180deg, ${PLANET_COLOR[id]}, ${PLANET_COLOR[id]}88)` }} />
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>
              {PLANET_SYMBOL[id]} {id}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function componentRows(p?: ShadbalaPlanet) {
  return [
    { key: 'sthana', label: 'Sthana', value: p?.sthanaBala ?? 0 },
    { key: 'dig', label: 'Dig', value: p?.digBala ?? 0 },
    { key: 'kala', label: 'Kala', value: p?.kalaBala ?? 0 },
    { key: 'chesta', label: 'Chesta', value: p?.chestaBala ?? 0 },
    { key: 'naisargika', label: 'Naisargika', value: p?.naisargikaBala ?? 0 },
    { key: 'drik', label: 'Drik', value: p?.drikBala ?? 0 },
  ]
}

function getRemedyHints(p?: ShadbalaPlanet) {
  if (!p) return []
  const rows = componentRows(p).sort((a, b) => a.value - b.value).slice(0, 2)
  const map: Record<string, string> = {
    sthana: 'Strengthen positional support: graha mantra japa, rashi-aligned discipline, and house-lord worship.',
    dig: 'Directional weakness: practice sunrise/sunset prayers and align important actions to favorable directions.',
    kala: 'Temporal weakness: increase nitya sadhana timing discipline, tithi/vara observances, and moon-cycle fasting.',
    chesta: 'Motional weakness: reduce impulsive action, maintain steady routines, and do breath work before key decisions.',
    naisargika: 'Natural baseline low: use gentle long-term upaya, charity linked to graha karakatva, and sattvic lifestyle.',
    drik: 'Aspect pressure high: do protection/remedy rituals, avoid conflict cycles, and reinforce benefic company.',
  }
  return rows.map((r) => ({ component: r.label, hint: map[r.key] }))
}

function toShashtiamsa(ru: number) {
  return ru * 60
}

function buildPrintableHtml(shadbala: ShadbalaResult) {
  const planets = shadbala.planets
  const headers = ORDER.map((id) => `<th>${id}</th>`).join('')
  const components = [
    ['Sthana', 'sthanaBala'],
    ['Dig', 'digBala'],
    ['Kala', 'kalaBala'],
    ['Chesta', 'chestaBala'],
    ['Naisargika', 'naisargikaBala'],
    ['Drik', 'drikBala'],
  ] as const

  const rows = components
    .map(
      ([label, key]) =>
        `<tr><td>${label}</td>${ORDER.map((id) => `<td>${(planets[id]?.[key] ?? 0).toFixed(3)}</td>`).join('')}</tr>`,
    )
    .join('')

  const totalRow = `<tr><td>Total</td>${ORDER.map((id) => `<td>${(planets[id]?.total ?? 0).toFixed(3)}</td>`).join('')}</tr>`
  const reqRow = `<tr><td>Required</td>${ORDER.map((id) => `<td>${(planets[id]?.required ?? 0).toFixed(2)}</td>`).join('')}</tr>`
  const ratioRow = `<tr><td>Ratio</td>${ORDER.map((id) => `<td>${(planets[id]?.ratio ?? 0).toFixed(3)}x</td>`).join('')}</tr>`

  return `<!doctype html><html><head><meta charset="utf-8"/><title>Shadbala Report</title>
  <style>
  body{font-family:Arial,sans-serif;padding:20px;color:#111}
  h1{font-size:18px;margin:0 0 8px} p{font-size:12px;color:#444}
  table{width:100%;border-collapse:collapse;font-size:12px;margin-top:12px}
  th,td{border:1px solid #ddd;padding:6px;text-align:center}
  th:first-child,td:first-child{text-align:left;font-weight:700}
  </style></head><body>
  <h1>Shadbala Report</h1>
  <p>Six-fold strength. 1 Rupa = 60 Shashtiamsas.</p>
  <table><thead><tr><th>Component</th>${headers}</tr></thead><tbody>${rows}${totalRow}${reqRow}${ratioRow}</tbody></table>
  </body></html>`
}

export function ShadbalaTable({
  shadbala,
  hideDetails = false,
  preferClassicCharts = false,
  variant = 'full',
}: {
  shadbala: ShadbalaResult
  hideDetails?: boolean
  preferClassicCharts?: boolean
  variant?: 'full' | 'widget'
}) {
  const [viewMode, setViewMode] = useState<ViewMode>('modern')
  const [active, setActive] = useState<PlanetCode>('Su')
  const [chartPanelView, setChartPanelView] = useState<'modern' | 'classic_grid'>(
    preferClassicCharts ? 'classic_grid' : 'modern',
  )
  const { planets } = shadbala

  const ranked = useMemo(() => {
    return ORDER.map((id) => planets[id]).filter(Boolean).sort((a, b) => b.total - a.total)
  }, [planets])

  if (variant === 'widget') {
    const metricCards = [
      { key: 'sthanaBala' as const, title: 'Sthāna Bala', toDisplay: (v: number) => toShashtiamsa(v) },

      { key: 'kalaBala' as const, title: 'Kāla Bala', toDisplay: (v: number) => toShashtiamsa(v) },
      { key: 'digBala' as const, title: 'DigBala', toDisplay: (v: number) => toShashtiamsa(v) },
      { key: 'chestaBala' as const, title: 'Cheshta Bala', toDisplay: (v: number) => toShashtiamsa(v) },
      { key: 'drikBala' as const, title: 'DrigBala', toDisplay: (v: number) => toShashtiamsa(v), allowNegative: true },
      { key: 'ratio' as const, title: 'Shadbala (% strength)', toDisplay: (v: number) => v * 100 },
    ] as const

    const widgetMetrics = metricCards.map((m) => {
      const vals = ORDER.map((id) => {
        const raw = planets[id]?.[m.key as keyof ShadbalaPlanet] as number | undefined
        return m.toDisplay(raw ?? 0)
      })
      const maxAbs = Math.max(...vals.map((v) => Math.abs(v)), 1)
      return { ...m, vals, maxAbs }
    })

    return (
      <div className="card" style={{ padding: '0.9rem', maxHeight: 420, overflowY: 'auto' }}>
        <div className="label-caps" style={{ marginBottom: '0.75rem', fontSize: '0.65rem' }}>
          Ṣaḍbala Mini Graphs
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: '0.55rem' }}>
          {widgetMetrics.map((metric) => (
            <div key={metric.key} style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', background: 'var(--surface-2)', padding: '0.5rem' }}>
              <div style={{ textAlign: 'center', fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                {metric.title}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0,1fr))', gap: '0.15rem', alignItems: 'end', minHeight: 74 }}>
                {metric.vals.map((v, idx) => {
                  const h = Math.max(2, (Math.abs(v) / metric.maxAbs) * 44)
                  const neg = v < 0
                  const barBg = neg
                    ? 'linear-gradient(180deg, rgba(224,123,142,0.55), rgba(224,123,142,0.18))'
                    : 'linear-gradient(180deg, rgba(201,168,76,0.45), rgba(201,168,76,0.18))'
                  return (
                    <div key={`${metric.key}-${ORDER[idx]}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.1rem' }}>
                      <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{metric.vals[idx].toFixed(metric.key === 'ratio' ? 0 : 1)}</div>
                      <div style={{ width: '100%', maxWidth: 16, height: h, borderRadius: 2, background: barBg }} />
                      <div style={{ fontSize: '0.48rem', color: 'var(--text-muted)', fontWeight: 800 }}>{ORDER[idx]}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const strongestId = (shadbala.strongest as PlanetCode) in PLANET_NAMES ? (shadbala.strongest as PlanetCode) : 'Su'
  const weakestId = (shadbala.weakest as PlanetCode) in PLANET_NAMES ? (shadbala.weakest as PlanetCode) : 'Sa'
  const avgRatio = ranked.length ? ranked.reduce((s, p) => s + p.ratio, 0) / ranked.length : 0
  const activePlanet = planets[active]
  const activeRows = componentRows(activePlanet)
  const remedyHints = getRemedyHints(activePlanet)
  const radarValues = activeRows.map((r) => r.value)

  const printReport = () => {
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(buildPrintableHtml(shadbala))
    w.document.close()
    w.focus()
    w.print()
  }

  const panelMetrics = [
    { key: 'sthanaBala', title: 'Sthaana Bala', toDisplay: (v: number) => toShashtiamsa(v), decimals: 1, allowNegative: false },
    { key: 'kalaBala', title: 'Kaala Bala', toDisplay: (v: number) => toShashtiamsa(v), decimals: 1, allowNegative: false },
    { key: 'digBala', title: 'DigBala', toDisplay: (v: number) => toShashtiamsa(v), decimals: 1, allowNegative: false },
    { key: 'chestaBala', title: 'Cheshta Bala', toDisplay: (v: number) => toShashtiamsa(v), decimals: 1, allowNegative: false },
    { key: 'drikBala', title: 'DrigBala', toDisplay: (v: number) => toShashtiamsa(v), decimals: 1, allowNegative: true },
    { key: 'naisargikaBala', title: 'Naisargika Bala', toDisplay: (v: number) => toShashtiamsa(v), decimals: 1, allowNegative: false },
    { key: 'totalShash', title: 'Shadbala', toDisplay: (v: number) => v, decimals: 0, allowNegative: false },
    { key: 'total', title: 'Shadbala (rupas)', toDisplay: (v: number) => v, decimals: 2, allowNegative: false },
    { key: 'ratio', title: 'Shadbala (% strength)', toDisplay: (v: number) => v * 100, decimals: 0, allowNegative: false },
  ] as const

  if (viewMode === 'classic') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div className="card" style={{ background: tone(viewMode), padding: '0.9rem 1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <div className="label-caps">Classic Shadbala Report</div>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', marginTop: '0.25rem' }}>
                Dominant: {PLANET_NAMES[strongestId]} · Inhibited: {PLANET_NAMES[weakestId]} · Mean ratio: {avgRatio.toFixed(2)}x
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.3rem', background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '0.2rem' }}>
              <button className="btn btn-sm btn-ghost no-print" onClick={printReport}>
                <Printer size={13} />
                Print
              </button>
              {VIEW_MODES.map((mode) => {
                const Icon = mode.icon
                const activeMode = viewMode === mode.id
                return (
                  <button
                    key={mode.id}
                    onClick={() => setViewMode(mode.id)}
                    style={{
                      border: 'none',
                      borderRadius: 'calc(var(--r-md) - 4px)',
                      background: activeMode ? 'var(--surface-2)' : 'transparent',
                      color: activeMode ? 'var(--text-primary)' : 'var(--text-muted)',
                      padding: '0.35rem 0.55rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                    }}
                  >
                    <Icon size={13} />
                    {mode.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '0.8rem' }}>
          <div className="label-caps" style={{ marginBottom: '0.45rem' }}>Component Table (Rupas)</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-bright)' }}>
                  <th style={{ textAlign: 'left', padding: '0.35rem 0.45rem' }}>Component</th>
                  {ORDER.map((id) => (
                    <th key={id} style={{ textAlign: 'center', padding: '0.35rem 0.25rem' }}>{id}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPONENTS.map((c) => (
                  <tr key={c.key} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                    <td style={{ padding: '0.35rem 0.45rem', fontWeight: 700 }}>
                      {c.label} <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>({c.full})</span>
                    </td>
                    {ORDER.map((id) => (
                      <td key={`${c.key}-${id}`} style={{ textAlign: 'center', padding: '0.35rem 0.25rem' }}>
                        {((planets[id]?.[c.key] as number) ?? 0).toFixed(3)}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr style={{ borderBottom: '1px solid var(--border-soft)' }}>
                  <td style={{ padding: '0.35rem 0.45rem', fontWeight: 700 }}>Total</td>
                  {ORDER.map((id) => (
                    <td key={`total-${id}`} style={{ textAlign: 'center', padding: '0.35rem 0.25rem', fontWeight: 700, color: scoreColor(planets[id]?.ratio ?? 0) }}>
                      {(planets[id]?.total ?? 0).toFixed(3)}
                    </td>
                  ))}
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-soft)' }}>
                  <td style={{ padding: '0.35rem 0.45rem', fontWeight: 700 }}>Required</td>
                  {ORDER.map((id) => (
                    <td key={`req-${id}`} style={{ textAlign: 'center', padding: '0.35rem 0.25rem' }}>
                      {(planets[id]?.required ?? 0).toFixed(2)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ padding: '0.35rem 0.45rem', fontWeight: 700 }}>Ratio</td>
                  {ORDER.map((id) => (
                    <td key={`ratio-${id}`} style={{ textAlign: 'center', padding: '0.35rem 0.25rem', color: scoreColor(planets[id]?.ratio ?? 0), fontWeight: 700 }}>
                      {(planets[id]?.ratio ?? 0).toFixed(3)}x
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {!hideDetails && (
          <div className="card" style={{ padding: '0.8rem' }}>
            <div className="label-caps" style={{ marginBottom: '0.45rem' }}>Rankings</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-bright)' }}>
                    <th style={{ textAlign: 'left', padding: '0.35rem 0.45rem' }}>Rank</th>
                    <th style={{ textAlign: 'left', padding: '0.35rem 0.45rem' }}>Planet</th>
                    <th style={{ textAlign: 'right', padding: '0.35rem 0.45rem' }}>Total</th>
                    <th style={{ textAlign: 'right', padding: '0.35rem 0.45rem' }}>Required</th>
                    <th style={{ textAlign: 'right', padding: '0.35rem 0.45rem' }}>Ratio</th>
                    <th style={{ textAlign: 'right', padding: '0.35rem 0.45rem' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {ranked.map((p, idx) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                      <td style={{ padding: '0.35rem 0.45rem', fontWeight: 700 }}>#{idx + 1}</td>
                      <td style={{ padding: '0.35rem 0.45rem' }}>{PLANET_NAMES[p.id as PlanetCode]}</td>
                      <td style={{ padding: '0.35rem 0.45rem', textAlign: 'right', fontWeight: 700 }}>{p.total.toFixed(3)}</td>
                      <td style={{ padding: '0.35rem 0.45rem', textAlign: 'right' }}>{p.required.toFixed(2)}</td>
                      <td style={{ padding: '0.35rem 0.45rem', textAlign: 'right', color: scoreColor(p.ratio), fontWeight: 700 }}>{p.ratio.toFixed(3)}x</td>
                      <td style={{ padding: '0.35rem 0.45rem', textAlign: 'right', textTransform: 'capitalize' }}>{statusLabel(p.ratio)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!hideDetails && (
          <div className="card" style={{ padding: '0.8rem' }}>
            <div className="label-caps" style={{ marginBottom: '0.45rem' }}>Sub-component Breakdown · {PLANET_NAMES[active]}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '0.5rem' }}>
              {activePlanet?.details?.sthana && (
                <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '0.5rem' }}>
                  <div style={{ fontWeight: 700, marginBottom: '0.3rem', fontSize: '0.75rem' }}>Sthana Parts (shashtiamsa)</div>
                  {Object.entries(activePlanet.details.sthana).map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                      <span>{k}</span><span>{Number(v).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
              {activePlanet?.details?.kala && (
                <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '0.5rem' }}>
                  <div style={{ fontWeight: 700, marginBottom: '0.3rem', fontSize: '0.75rem' }}>Kala Parts (shashtiamsa)</div>
                  {Object.entries(activePlanet.details.kala).filter(([k]) => k !== 'isDayBirth').map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                      <span>{k}</span><span>{Number(v).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
              {activePlanet?.details?.drik && (
                <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '0.5rem' }}>
                  <div style={{ fontWeight: 700, marginBottom: '0.3rem', fontSize: '0.75rem' }}>Drik Forces (shashtiamsa)</div>
                  {Object.entries(activePlanet.details.drik).map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                      <span>{k}</span><span>{Number(v).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="card" style={{ background: tone(viewMode), padding: '0.9rem 1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart3 size={16} style={{ color: 'var(--gold)' }} />
            <div>
              <div className="label-caps">Modern Shadbala Analytics</div>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', marginTop: '0.2rem' }}>
                Dominant: {PLANET_NAMES[strongestId]} · Inhibited: {PLANET_NAMES[weakestId]} · Mean ratio: {avgRatio.toFixed(2)}x
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.3rem', background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '0.2rem' }}>
            <button className="btn btn-sm btn-ghost no-print" onClick={printReport}>
              <Printer size={13} />
              Print
            </button>
            <button
              className="btn btn-sm btn-ghost"
              onClick={() => setChartPanelView((v) => (v === 'modern' ? 'classic_grid' : 'modern'))}
            >
              {chartPanelView === 'modern' ? 'Classic Charts' : 'Modern Charts'}
            </button>
            {VIEW_MODES.map((mode) => {
              const Icon = mode.icon
              const activeMode = viewMode === mode.id
              return (
                <button
                  key={mode.id}
                  onClick={() => setViewMode(mode.id)}
                  style={{
                    border: 'none',
                    borderRadius: 'calc(var(--r-md) - 4px)',
                    background: activeMode ? 'var(--surface-2)' : 'transparent',
                    color: activeMode ? 'var(--text-primary)' : 'var(--text-muted)',
                    padding: '0.35rem 0.55rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                  }}
                >
                  <Icon size={13} />
                  {mode.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {chartPanelView === 'classic_grid' && (
        <div className="card" style={{ padding: '0.85rem' }}>
          <div className="label-caps" style={{ marginBottom: '0.5rem' }}>Classic Multi-Chart View</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '0.5rem' }}>
            {panelMetrics.map((metric) => {
              const vals = ORDER.map((id) => {
                const raw = planets[id]?.[metric.key as keyof ShadbalaPlanet]
                const numeric = typeof raw === 'number' ? raw : 0
                return metric.toDisplay(numeric)
              })
              const maxAbs = Math.max(...vals.map((v) => Math.abs(v)), 1)
              return (
                <div key={metric.key} style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', background: 'var(--surface-2)', padding: '0.45rem' }}>
                  <div style={{ textAlign: 'center', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>{metric.title}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0,1fr))', gap: '0.2rem', alignItems: 'end', minHeight: 96 }}>
                    {vals.map((v, idx) => {
                      const h = Math.max(2, (Math.abs(v) / maxAbs) * 64)
                      const neg = v < 0
                      return (
                        <div key={`${metric.key}-${ORDER[idx]}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.15rem' }}>
                          <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{v.toFixed(metric.decimals)}</div>
                          <div style={{ width: '100%', maxWidth: 20, height: 68, display: 'flex', alignItems: neg && metric.allowNegative ? 'flex-start' : 'flex-end' }}>
                            <div
                              style={{
                                width: '100%',
                                height: h,
                                borderRadius: 2,
                                background: neg && metric.allowNegative
                                  ? 'linear-gradient(180deg, #c86a7b, #a64557)'
                                  : 'linear-gradient(180deg, #b5868f, #946870)',
                              }}
                            />
                          </div>
                          <div style={{ fontSize: '0.64rem', color: 'var(--text-secondary)', fontWeight: 700 }}>{ORDER[idx]}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {!hideDetails && (
        <div className="card" style={{ padding: '0.9rem' }}>
          <div className="label-caps" style={{ marginBottom: '0.45rem' }}>
            Component Breakdown · {PLANET_NAMES[active]}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.55rem' }}>
            {COMPONENTS.map((c) => {
              const p = planets[active]
              const value = (p?.[c.key] as number) ?? 0
              return (
                <div key={c.key} style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '0.55rem 0.65rem', background: 'var(--surface-2)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>{c.label}</div>
                  <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>{c.full}</div>
                  <div style={{ marginTop: '0.2rem', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{value.toFixed(3)} Rupa</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
        {ORDER.map((id) => {
          const p = planets[id]
          if (!p) return null
          const isActive = active === id
          return (
            <button
              key={id}
              onClick={() => setActive(id)}
              style={{
                textAlign: 'left',
                border: `1px solid ${isActive ? PLANET_COLOR[id] : 'var(--border)'}`,
                borderRadius: 'var(--r-md)',
                background: isActive ? 'var(--surface-2)' : 'var(--surface-1)',
                padding: '0.75rem',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.86rem', fontWeight: 700 }}>
                  {PLANET_SYMBOL[id]} {PLANET_NAMES[id]}
                </span>
                <span style={{ fontSize: '0.8rem', color: scoreColor(p.ratio), fontWeight: 700 }}>{statusLabel(p.ratio)}</span>
              </div>
              <div style={{ fontSize: '1.02rem', fontWeight: 800, color: scoreColor(p.ratio), fontFamily: 'var(--font-mono)' }}>
                {p.total.toFixed(3)} <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>/ {p.required.toFixed(2)}</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Ratio {p.ratio.toFixed(3)}x</div>
            </button>
          )
        })}
      </div>

      <div className="card" style={{ padding: '0.9rem' }}>
        <div className="label-caps" style={{ marginBottom: '0.55rem' }}>Total Strength vs Requirement (Rupas)</div>
        <ComparisonBars planets={planets} />
      </div>

      {!hideDetails && (
        <div className="card" style={{ padding: '0.9rem' }}>
          <div className="label-caps" style={{ marginBottom: '0.45rem' }}>Sub-component Drilldown · {PLANET_NAMES[active]}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, 250px) 1fr', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
              <RadarChart values={radarValues} color={PLANET_COLOR[active]} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.55rem' }}>
              <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '0.55rem', background: 'var(--surface-2)' }}>
                <div style={{ fontSize: '0.73rem', fontWeight: 700, marginBottom: '0.25rem' }}>Kala Bala Parts</div>
                {activePlanet?.details?.kala ? (
                  <>
                    {Object.entries(activePlanet.details.kala).filter(([k]) => k !== 'isDayBirth').map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                        <span>{k}</span><span>{(Number(v) / 60).toFixed(3)} R</span>
                      </div>
                    ))}
                    <div style={{ marginTop: '0.2rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Birth: {activePlanet.details.kala.isDayBirth ? 'Day' : 'Night'}
                    </div>
                  </>
                ) : <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>No details</div>}
              </div>

              <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '0.55rem', background: 'var(--surface-2)' }}>
                <div style={{ fontSize: '0.73rem', fontWeight: 700, marginBottom: '0.25rem' }}>Sthana Bala Parts</div>
                {activePlanet?.details?.sthana ? Object.entries(activePlanet.details.sthana).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                    <span>{k}</span><span>{Number(v / 60).toFixed(3)} R</span>
                  </div>
                )) : <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>No details</div>}
              </div>

              <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '0.55rem', background: 'var(--surface-2)' }}>
                <div style={{ fontSize: '0.73rem', fontWeight: 700, marginBottom: '0.25rem' }}>Dig / Chesta / Drik Notes</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  Dig angle: {(activePlanet?.details?.dig?.angularDistance ?? 0).toFixed(2)}°
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  Chesta mode: {activePlanet?.details?.chesta?.method ?? 'n/a'}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  Drik net: {toShashtiamsa(activePlanet?.drikBala ?? 0).toFixed(1)} shashtiamsa
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!hideDetails && (
        <div className="card" style={{ padding: '0.9rem' }}>
          <div className="label-caps" style={{ marginBottom: '0.45rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Sparkles size={14} style={{ color: 'var(--gold)' }} />
            Remedy Hints · {PLANET_NAMES[active]}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px,1fr))', gap: '0.55rem' }}>
            {remedyHints.map((r) => (
              <div key={r.component} style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '0.6rem', background: 'var(--surface-2)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.76rem', marginBottom: '0.2rem' }}>
                  Weak component: {r.component}
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {r.hint}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card" style={{ padding: '0.85rem' }}>
        <div className="label-caps" style={{ marginBottom: '0.35rem' }}>Calculation Logic</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Total Shadbala = Sthana + Dig + Kala + Chesta + Naisargika + Drik. Final total is shown in Rupas
          ({' '}1 Rupa = 60 Shashtiamsas{')'}. Strength status compares total against required minimum for each graha.
        </div>
      </div>
    </div>
  )
}