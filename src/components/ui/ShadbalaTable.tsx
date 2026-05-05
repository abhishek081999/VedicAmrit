'use client'

import React, { useMemo, useState } from 'react'
import type { ShadbalaPlanet, ShadbalaResult } from '@/types/astrology'
import { BarChart3, ScrollText } from 'lucide-react'

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
  Su: 'Su',
  Mo: 'Mo',
  Ma: 'Ma',
  Me: 'Me',
  Ju: 'Ju',
  Ve: 'Ve',
  Sa: 'Sa',
}

const COMPONENTS: Array<{ key: keyof ShadbalaPlanet; label: string; maxRupa: number }> = [
  { key: 'sthanaBala', label: 'Sthana', maxRupa: 5.0 },
  { key: 'digBala', label: 'Dig', maxRupa: 1.0 },
  { key: 'kalaBala', label: 'Kala', maxRupa: 3.0 },
  { key: 'chestaBala', label: 'Chesta', maxRupa: 1.0 },
  { key: 'naisargikaBala', label: 'Naisargika', maxRupa: 1.0 },
  { key: 'drikBala', label: 'Drik', maxRupa: 1.0 },
]

function statusColor(ratio: number) {
  if (ratio >= 1.2) return 'var(--teal)'
  if (ratio >= 1.0) return 'var(--text-gold)'
  if (ratio >= 0.85) return 'var(--amber)'
  return 'var(--rose)'
}

function statusText(ratio: number) {
  if (ratio >= 1.2) return 'Excellent'
  if (ratio >= 1.0) return 'Strong'
  if (ratio >= 0.85) return 'Average'
  return 'Weak'
}

function toShash(rupa: number) {
  return rupa * 60
}

function ClassicMetricCharts({ planets }: { planets: Record<string, ShadbalaPlanet> }) {
  const metrics = [
    { key: 'sthanaBala' as const, title: 'Sthana Bala', scale: 60, decimals: 1 },
    { key: 'kalaBala' as const, title: 'Kala Bala', scale: 60, decimals: 1 },
    { key: 'digBala' as const, title: 'Dig Bala', scale: 60, decimals: 1 },
    { key: 'chestaBala' as const, title: 'Chesta Bala', scale: 60, decimals: 1 },
    { key: 'drikBala' as const, title: 'Drik Bala', scale: 60, decimals: 1 },
    { key: 'naisargikaBala' as const, title: 'Naisargika Bala', scale: 60, decimals: 1 },
    { key: 'totalShash' as const, title: 'Shadbala (Sh)', scale: 1, decimals: 0 },
    { key: 'total' as const, title: 'Shadbala (R)', scale: 1, decimals: 2 },
    { key: 'ratio' as const, title: 'Ratio (%)', scale: 100, decimals: 0 },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '0.55rem' }}>
      {metrics.map((metric) => {
        const vals = ORDER.map((id) => ((planets[id]?.[metric.key] as number) ?? 0) * metric.scale)
        const max = Math.max(...vals.map((v) => Math.abs(v)), 1)
        return (
          <div key={metric.key} style={{ border: '1px solid var(--border)', background: 'var(--surface-2)', borderRadius: 'var(--r-sm)', padding: '0.5rem' }}>
            <div style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 700, marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>{metric.title}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0,1fr))', gap: '0.2rem', alignItems: 'end', minHeight: 90 }}>
              {vals.map((v, idx) => {
                const h = Math.max(2, (Math.abs(v) / max) * 62)
                return (
                  <div key={`${metric.key}-${ORDER[idx]}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.12rem' }}>
                    <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{v.toFixed(metric.decimals)}</div>
                    <div style={{ width: '100%', maxWidth: 18, height: 66, display: 'flex', alignItems: v < 0 ? 'flex-start' : 'flex-end' }}>
                      <div style={{ width: '100%', height: h, borderRadius: 2, background: v < 0 ? 'linear-gradient(180deg,#c86a7b,#a64557)' : 'linear-gradient(180deg,#b5868f,#946870)' }} />
                    </div>
                    <div style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', fontWeight: 700 }}>{ORDER[idx]}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function PolarHex({
  planet,
}: {
  planet?: ShadbalaPlanet
}) {
  const values = COMPONENTS.map((c) => Math.max(0, Number(planet?.[c.key] ?? 0)))
  const size = 170
  const center = size / 2
  const radius = 56
  const step = (Math.PI * 2) / 6

  const points = values
    .map((v, i) => {
      const angle = i * step - Math.PI / 2
      const max = COMPONENTS[i].maxRupa
      const use = Math.min(1, max > 0 ? v / max : 0)
      return `${center + Math.cos(angle) * radius * use},${center + Math.sin(angle) * radius * use}`
    })
    .join(' ')

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {[0.25, 0.5, 0.75, 1].map((p) => {
        const ring = Array.from({ length: 6 }).map((_, i) => {
          const angle = i * step - Math.PI / 2
          return `${center + Math.cos(angle) * radius * p},${center + Math.sin(angle) * radius * p}`
        }).join(' ')
        return <polygon key={p} points={ring} fill="none" stroke="var(--border-soft)" strokeWidth="1" />
      })}
      <polygon points={points} fill="rgba(201,168,76,0.22)" stroke="var(--text-gold)" strokeWidth="2" />
      {COMPONENTS.map((c, i) => {
        const angle = i * step - Math.PI / 2
        const x = center + Math.cos(angle) * (radius + 12)
        const y = center + Math.sin(angle) * (radius + 12)
        return (
          <text key={c.key as string} x={x} y={y} textAnchor="middle" dominantBaseline="middle" style={{ fill: 'var(--text-muted)', fontSize: 9, fontWeight: 700 }}>
            {c.label}
          </text>
        )
      })}
    </svg>
  )
}



export function ShadbalaTable({
  shadbala,
  hideDetails = false,
  preferClassicCharts = true,
  classicMultiChartOnly = false,
  variant = 'full',
}: {
  shadbala: ShadbalaResult
  hideDetails?: boolean
  preferClassicCharts?: boolean
  classicMultiChartOnly?: boolean
  variant?: 'full' | 'widget'
}) {
  const [viewMode, setViewMode] = useState<ViewMode>(preferClassicCharts ? 'classic' : 'modern')
  const [active, setActive] = useState<PlanetCode>('Su')
  const [chartView, setChartView] = useState<'component' | 'classic_graphs'>(preferClassicCharts ? 'classic_graphs' : 'component')
  const planets = shadbala.planets

  const ranked = useMemo(
    () => ORDER.map((id) => planets[id]).filter(Boolean).sort((a, b) => b.total - a.total),
    [planets],
  )

  const strongest = (shadbala.strongest as PlanetCode) in PLANET_NAMES ? (shadbala.strongest as PlanetCode) : 'Su'
  const weakest = (shadbala.weakest as PlanetCode) in PLANET_NAMES ? (shadbala.weakest as PlanetCode) : 'Sa'
  const avgRatio = shadbala.averageRatio ?? (ranked.length ? ranked.reduce((s, p) => s + p.ratio, 0) / ranked.length : 0)
  const activePlanet = planets[active]



  if (variant === 'widget') {
    return (
      <div className="card" style={{ padding: '0.8rem' }}>
        <div className="label-caps" style={{ marginBottom: '0.55rem' }}>Ṣaḍbala Snapshot</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: '0.45rem' }}>
          <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', background: 'var(--surface-2)', padding: '0.45rem' }}>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Strongest</div>
            <div style={{ marginTop: '0.15rem', fontWeight: 700 }}>{PLANET_NAMES[strongest]}</div>
          </div>
          <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', background: 'var(--surface-2)', padding: '0.45rem' }}>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Weakest</div>
            <div style={{ marginTop: '0.15rem', fontWeight: 700 }}>{PLANET_NAMES[weakest]}</div>
          </div>
          <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', background: 'var(--surface-2)', padding: '0.45rem' }}>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Avg Ratio</div>
            <div style={{ marginTop: '0.15rem', fontWeight: 700 }}>{avgRatio.toFixed(2)}x</div>
          </div>
        </div>
      </div>
    )
  }

  if (classicMultiChartOnly) {
    return <ClassicMetricCharts planets={planets} />
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <div className="card" style={{ padding: '0.85rem 1rem', background: viewMode === 'classic' ? 'linear-gradient(135deg, rgba(132,27,27,0.12), rgba(166,124,0,0.08))' : 'linear-gradient(135deg, rgba(139,124,246,0.12), rgba(201,168,76,0.08))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <div className="label-caps">{viewMode === 'classic' ? 'Classical Shadbala Worksheet (R-Sync)' : 'Shadbala Analytics (R-Sync)'}</div>
            <div style={{ marginTop: '0.2rem', fontWeight: 700, fontSize: '0.9rem' }}>
              Strongest: {PLANET_NAMES[strongest]} · Weakest: {PLANET_NAMES[weakest]} · Mean ratio: {avgRatio.toFixed(2)}x
            </div>
            <div style={{ marginTop: '0.1rem', fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
              Profile: {shadbala.generatedProfile ?? 'balanced'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>

            {/* Toggles hidden as per user request for classic view only */}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem' }}>
        {ORDER.map((id) => {
          const p = planets[id]
          if (!p) return null
          const on = active === id
          return (
            <button
              key={id}
              onClick={() => setActive(id)}
              style={{
                textAlign: 'left',
                border: `1px solid ${on ? 'var(--border-bright)' : 'var(--border)'}`,
                borderRadius: 'var(--r-md)',
                background: on ? 'var(--surface-2)' : 'var(--surface-1)',
                padding: '0.6rem',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: '0.8rem' }}>{PLANET_SYMBOL[id]} {PLANET_NAMES[id]}</div>
                <div style={{ fontSize: '0.66rem', fontWeight: 700, color: statusColor(p.ratio) }}>{statusText(p.ratio)}</div>
              </div>
              <div style={{ marginTop: '0.15rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: statusColor(p.ratio) }}>
                {p.total.toFixed(3)} R
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{toShash(p.total).toFixed(0)} Sh · {p.ratio.toFixed(3)}x</div>
            </button>
          )
        })}
      </div>

      {chartView === 'classic_graphs' ? (
        <ClassicMetricCharts planets={planets} />
      ) : (
        <div className="card" style={{ padding: '0.8rem' }}>
          <div className="label-caps" style={{ marginBottom: '0.45rem' }}>Component graph · {PLANET_NAMES[active]}</div>
          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4 items-center">
            <div style={{ display: 'flex', justifyContent: 'center' }}><PolarHex planet={activePlanet} /></div>
            <div style={{ display: 'grid', gap: '0.38rem' }}>
              {COMPONENTS.map((c) => {
                const val = Number(activePlanet?.[c.key] ?? 0)
                const pct = Math.max(0, Math.min(100, (val / c.maxRupa) * 100))
                return (
                  <div key={c.key as string}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                      <span style={{ fontWeight: 700 }}>{c.label}</span>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>{val.toFixed(3)} R ({toShash(val).toFixed(1)} Sh)</span>
                    </div>
                    <div style={{ marginTop: '0.15rem', height: 8, borderRadius: 99, background: 'var(--surface-3)', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, var(--text-gold), var(--accent))' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: '0.8rem' }}>
        <div className="label-caps" style={{ marginBottom: '0.45rem' }}>Classical matrix (Rupas)</div>
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
                <tr key={c.key as string} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                  <td style={{ padding: '0.35rem 0.45rem', fontWeight: 700 }}>{c.label}</td>
                  {ORDER.map((id) => <td key={`${c.key}-${id}`} style={{ textAlign: 'center', padding: '0.35rem 0.25rem' }}>{((planets[id]?.[c.key] as number) ?? 0).toFixed(3)}</td>)}
                </tr>
              ))}
              <tr style={{ borderBottom: '1px solid var(--border-soft)' }}>
                <td style={{ padding: '0.35rem 0.45rem', fontWeight: 700 }}>Total (Rupas)</td>
                {ORDER.map((id) => <td key={`t-${id}`} style={{ textAlign: 'center', padding: '0.35rem 0.25rem', fontWeight: 700, color: statusColor(planets[id]?.ratio ?? 0) }}>{(planets[id]?.total ?? 0).toFixed(3)}</td>)}
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-soft)' }}>
                <td style={{ padding: '0.35rem 0.45rem', fontWeight: 700 }}>Total (Sh)</td>
                {ORDER.map((id) => <td key={`sh-${id}`} style={{ textAlign: 'center', padding: '0.35rem 0.25rem' }}>{(planets[id]?.totalShash ?? 0).toFixed(1)}</td>)}
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-soft)' }}>
                <td style={{ padding: '0.35rem 0.45rem', fontWeight: 700 }}>Required</td>
                {ORDER.map((id) => <td key={`r-${id}`} style={{ textAlign: 'center', padding: '0.35rem 0.25rem' }}>{(planets[id]?.required ?? 0).toFixed(2)}</td>)}
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-soft)' }}>
                <td style={{ padding: '0.35rem 0.45rem', fontWeight: 700 }}>Ratio</td>
                {ORDER.map((id) => <td key={`ra-${id}`} style={{ textAlign: 'center', padding: '0.35rem 0.25rem', color: statusColor(planets[id]?.ratio ?? 0), fontWeight: 700 }}>{(planets[id]?.ratio ?? 0).toFixed(3)}x</td>)}
              </tr>
              <tr>
                <td style={{ padding: '0.35rem 0.45rem', fontWeight: 700 }}>Band</td>
                {ORDER.map((id) => <td key={`b-${id}`} style={{ textAlign: 'center', padding: '0.35rem 0.25rem', fontWeight: 700 }}>{planets[id]?.qualityBand ?? statusText(planets[id]?.ratio ?? 0)}</td>)}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {!hideDetails && (
        <div className="card" style={{ padding: '0.8rem' }}>
          <div className="label-caps" style={{ marginBottom: '0.45rem' }}>Planet rankings</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-bright)' }}>
                  <th style={{ textAlign: 'left', padding: '0.35rem 0.45rem' }}>Rank</th>
                  <th style={{ textAlign: 'left', padding: '0.35rem 0.45rem' }}>Planet</th>
                  <th style={{ textAlign: 'right', padding: '0.35rem 0.45rem' }}>Total (R)</th>
                  <th style={{ textAlign: 'right', padding: '0.35rem 0.45rem' }}>Total (Sh)</th>
                  <th style={{ textAlign: 'right', padding: '0.35rem 0.45rem' }}>Required</th>
                  <th style={{ textAlign: 'right', padding: '0.35rem 0.45rem' }}>Ratio</th>
                  <th style={{ textAlign: 'right', padding: '0.35rem 0.45rem' }}>Band</th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((p, i) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                    <td style={{ padding: '0.35rem 0.45rem', fontWeight: 700 }}>#{i + 1}</td>
                    <td style={{ padding: '0.35rem 0.45rem' }}>{PLANET_NAMES[p.id as PlanetCode]}</td>
                    <td style={{ padding: '0.35rem 0.45rem', textAlign: 'right', fontWeight: 700 }}>{p.total.toFixed(3)}</td>
                    <td style={{ padding: '0.35rem 0.45rem', textAlign: 'right' }}>{p.totalShash.toFixed(1)}</td>
                    <td style={{ padding: '0.35rem 0.45rem', textAlign: 'right' }}>{p.required.toFixed(2)}</td>
                    <td style={{ padding: '0.35rem 0.45rem', textAlign: 'right', color: statusColor(p.ratio), fontWeight: 700 }}>{p.ratio.toFixed(3)}x</td>
                    <td style={{ padding: '0.35rem 0.45rem', textAlign: 'right', color: statusColor(p.ratio), fontWeight: 700 }}>{p.qualityBand ?? statusText(p.ratio)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
