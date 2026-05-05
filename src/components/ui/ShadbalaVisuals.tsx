// ─────────────────────────────────────────────────────────────
//  src/components/ui/ShadbalaVisuals.tsx
//  Advanced Shadbala UI — Radar charts and interactive visuals
// ─────────────────────────────────────────────────────────────
'use client'

import React, { useMemo, useState } from 'react'
import type { ShadbalaResult, ShadbalaPlanet } from '@/types/astrology'

// ── Constants & Helpers ────────────────────────────────────────

const PLANET_NAMES: Record<string, string> = {
  Su: 'Sun', Mo: 'Moon', Ma: 'Mars', Me: 'Mercury',
  Ju: 'Jupiter', Ve: 'Venus', Sa: 'Saturn',
}

const PLANET_SYMBOL: Record<string, string> = {
  Su: '☀', Mo: '☽', Ma: '♂', Me: '☿', Ju: '♃', Ve: '♀', Sa: '♄',
}

const PLANET_COLOR: Record<string, string> = {
  Su: '#c2410c', // Saffron
  Mo: '#475569', // Slate
  Ma: '#991b1b', // Maroon
  Me: '#0d9488', // Teal
  Ju: '#b45309', // Gold
  Ve: '#db2777', // Pink
  Sa: '#1e1b4b', // Indigo
}

const COMPONENTS = [
  { key: 'sthanaBala',     label: 'Sthāna',   full: 'Positional Strength' },
  { key: 'digBala',        label: 'Dik',       full: 'Directional Strength' },
  { key: 'kalaBala',       label: 'Kāla',      full: 'Temporal Strength' },
  { key: 'chestaBala',     label: 'Cheṣṭā',   full: 'Motional Strength' },
  { key: 'naisargikaBala', label: 'Naisargik', full: 'Natural Strength' },
  { key: 'drikBala',       label: 'Dṛk',       full: 'Aspectual Strength' },
]

const ORDER = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa']

// ── Components ────────────────────────────────────────────────

/**
 * A highly styled SVG Radar Chart
 */
function RadarChart({ data, color, size = 120 }: { data: number[], color: string, size?: number }) {
  const center = size / 2
  const radius = size * 0.38
  const angleStep = (Math.PI * 2) / 6

  // Generate background polygons (rings)
  const rings = [0.25, 0.5, 0.75, 1].map((p, i) => {
    const points = Array.from({ length: 6 }).map((_, j) => {
      const angle = j * angleStep - Math.PI / 2
      const x = center + Math.cos(angle) * radius * p
      const y = center + Math.sin(angle) * radius * p
      return `${x},${y}`
    }).join(' ')
    return <polygon key={i} points={points} fill="none" stroke="var(--border-soft)" strokeWidth="0.5" />
  })

  // Axis lines
  const axes = Array.from({ length: 6 }).map((_, i) => {
    const angle = i * angleStep - Math.PI / 2
    const x2 = center + Math.cos(angle) * radius
    const y2 = center + Math.sin(angle) * radius
    return <line key={i} x1={center} y1={center} x2={x2} y2={y2} stroke="var(--border-soft)" strokeWidth="0.5" />
  })

  // Data polygon — Normalize to 6.0 Rupas (Max Sthana Bala)
  const dataPoints = data.map((val, i) => {
    const angle = i * angleStep - Math.PI / 2
    const magnitude = (val / 6.0) * radius // Increased from 1.5 to 6.0
    const x = center + Math.cos(angle) * Math.min(magnitude, radius * 1.1)
    const y = center + Math.sin(angle) * Math.min(magnitude, radius * 1.1)
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.2))' }}>
      <g>
        {rings}
        {axes}
        <polygon 
          points={dataPoints} 
          fill={`${color}33`} 
          stroke={color} 
          strokeWidth="2" 
          strokeLinejoin="round"
          style={{ transition: 'all 0.4s ease' }}
        />
        {/* Points */}
        {data.map((val, i) => {
          const angle = i * angleStep - Math.PI / 2
          const magnitude = (val / 6.0) * radius
          const x = center + Math.cos(angle) * Math.min(magnitude, radius * 1.1)
          const y = center + Math.sin(angle) * Math.min(magnitude, radius * 1.1)
          return <circle key={i} cx={x} cy={y} r="2.5" fill={color} stroke="var(--surface-1)" strokeWidth="1" />
        })}
      </g>
    </svg>
  )
}

/**
 * Multi-planet comparison visual
 */
function ComparisonChart({ planets }: { planets: Record<string, ShadbalaPlanet> }) {
  const maxTotal = useMemo(() => Math.max(...ORDER.map(id => planets[id]?.total || 0), 12), [planets])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.5rem', background: 'var(--surface-1)', borderRadius: 'var(--r-xl)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 4, height: 16, background: 'var(--gold)', borderRadius: 2 }} />
          <h4 className="label-caps" style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.8rem' }}>Planetary Power Index (Actual vs Required)</h4>
        </div>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>1 Rupa = 60 Shastiamsas</span>
      </div>

      <div className="flex items-end gap-2 md:gap-8 px-2 md:px-6 pt-6" style={{ height: 220 }}>
        {ORDER.map(id => {
          const p = planets[id]
          if (!p) return null
          const col = PLANET_COLOR[id]
          const heightPct = (p.total / maxTotal) * 100
          const reqPct = (p.required / maxTotal) * 100

          return (
            <div key={id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', position: 'relative', height: '100%' }}>
              
              {/* Value label */}
              <div style={{ 
                fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 800, 
                color: p.isStrong ? 'var(--text-primary)' : 'var(--rose)',
                marginBottom: 'auto'
              }}>
                {p.total.toFixed(1)}
              </div>

              {/* Stacked bar visual */}
              <div style={{ width: '100%', maxWidth: 36, flex: 1, position: 'relative', background: 'var(--surface-3)', borderRadius: '6px 6px 2px 2px', overflow: 'hidden', border: '1px solid var(--border-soft)' }}>
                {/* Required marker */}
                <div style={{ 
                  position: 'absolute', bottom: `${reqPct}%`, width: '100%', height: 0, 
                  borderTop: '2px dashed rgba(255,255,255,0.4)', zIndex: 5,
                  boxShadow: '0 0 8px rgba(0,0,0,0.3)'
                }} />
                
                {/* Actual bar */}
                <div style={{ 
                  position: 'absolute', bottom: 0, width: '100%', height: `${heightPct}%`, 
                  background: `linear-gradient(to top, ${col}88, ${col})`,
                  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.2), 0 0 15px ${col}22`,
                  transition: 'height 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  borderRadius: '4px 4px 0 0'
                }} />
              </div>

              {/* Planet icon */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                 <div style={{ width: 24, height: 24, borderRadius: '50%', background: `${col}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${col}44` }}>
                   <span style={{ color: col, fontSize: '0.85rem', fontWeight: 900 }}>{PLANET_SYMBOL[id]}</span>
                 </div>
                 <span style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>{id.toUpperCase()}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────

export function ShadbalaVisuals({ shadbala }: { shadbala: ShadbalaResult }) {
  const { planets, strongest, weakest } = shadbala
  const [hoveredPlanet, setHoveredPlanet] = useState<string | null>(null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* ── Top Header Analysis ────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        
        {/* Strongest Card */}
        <div style={{ 
          padding: '1.25rem', background: 'linear-gradient(135deg, var(--surface-2) 0%, rgba(78,205,196,0.1) 100%)', 
          border: '1px solid var(--border-bright)', borderRadius: 'var(--r-lg)',
          display: 'flex', alignItems: 'center', gap: '1.25rem'
        }}>
          <div style={{ 
            width: 50, height: 50, borderRadius: '50%', background: `${PLANET_COLOR[strongest]}22`, 
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: PLANET_COLOR[strongest] 
          }}>
            {PLANET_SYMBOL[strongest]}
          </div>
          <div>
            <div className="label-caps" style={{ color: 'var(--teal)', marginBottom: 2 }}>Dominant Graha</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 500, fontFamily: 'var(--font-display)' }}>{PLANET_NAMES[strongest]}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{planets[strongest]?.total} Rupas · ({planets[strongest]?.ratio.toFixed(2)}x)</div>
          </div>
        </div>

        {/* Weakest Card */}
        <div style={{ 
          padding: '1.25rem', background: 'linear-gradient(135deg, var(--surface-2) 0%, rgba(224,123,142,0.1) 100%)', 
          border: '1px solid var(--border-soft)', borderRadius: 'var(--r-lg)',
          display: 'flex', alignItems: 'center', gap: '1.25rem'
        }}>
          <div style={{ 
            width: 50, height: 50, borderRadius: '50%', background: `${PLANET_COLOR[weakest]}22`, 
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: PLANET_COLOR[weakest] 
          }}>
            {PLANET_SYMBOL[weakest]}
          </div>
          <div>
            <div className="label-caps" style={{ color: 'var(--rose)', marginBottom: 2 }}>Inhibited Graha</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 500, fontFamily: 'var(--font-display)' }}>{PLANET_NAMES[weakest]}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{planets[weakest]?.total} Rupas · Needs Remedy</div>
          </div>
        </div>

      </div>

      {/* ── Visual Comparison ──────────────────────────────────── */}
      <div className="fade-up">
         <ComparisonChart planets={planets} />
      </div>

      {/* ── Detailed Breakdown Grid ────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        {ORDER.map((id, index) => {
          const p = planets[id]
          if (!p) return null
          const col = PLANET_COLOR[id]
          const isHovered = hoveredPlanet === id

          const componentValues = COMPONENTS.map(c => p[c.key as keyof ShadbalaPlanet] as number)

          return (
            <div 
              key={id}
              onMouseEnter={() => setHoveredPlanet(id)}
              onMouseLeave={() => setHoveredPlanet(null)}
              style={{
                background: 'var(--surface-1)',
                border: `1px solid ${isHovered ? col : 'var(--border)'}`,
                borderRadius: 'var(--r-lg)',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: isHovered ? 'translateY(-4px)' : 'none',
                boxShadow: isHovered ? `0 12px 24px rgba(0,0,0,0.3), 0 0 10px ${col}22` : 'none',
                animationDelay: `${index * 0.05}s`
              }}
              className="fade-up"
            >
              {/* Card Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                   <div style={{ fontSize: '1.5rem', color: col }}>{PLANET_SYMBOL[id]}</div>
                   <div>
                      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{PLANET_NAMES[id]}</h3>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Planetary Power</div>
                   </div>
                </div>
                
                <div style={{ textAlign: 'right' }}>
                   <div style={{ fontSize: '1.25rem', fontWeight: 700, color: p.isStrong ? col : 'var(--rose)', fontFamily: 'var(--font-mono)' }}>
                     {p.total.toFixed(2)}
                   </div>
                   <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>/ {p.required} Rupas</div>
                </div>
              </div>

              <div style={{ width: '100%', height: 1, background: 'var(--border-soft)' }} />

              {/* Content: Radar + Mini Stats */}
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <RadarChart data={componentValues} color={col} size={130} />
                
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {COMPONENTS.slice(0, 3).map(c => (
                    <div key={c.key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                       <span style={{ color: 'var(--text-muted)' }}>{c.label}</span>
                       <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{ (p[c.key as keyof ShadbalaPlanet] as number).toFixed(2) }</span>
                    </div>
                  ))}
                  <div style={{ height: 1, background: 'var(--border-soft)', margin: '2px 0' }} />
                  {COMPONENTS.slice(3, 6).map(c => (
                    <div key={c.key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                       <span style={{ color: 'var(--text-muted)' }}>{c.label}</span>
                       <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{ (p[c.key as keyof ShadbalaPlanet] as number).toFixed(2) }</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Badge */}
              <div style={{
                marginTop: 'auto',
                padding: '0.4rem 0.75rem',
                borderRadius: 'var(--r-md)',
                background: p.isStrong ? 'rgba(78,205,196,0.08)' : 'rgba(224,123,142,0.08)',
                color: p.isStrong ? 'var(--teal)' : 'var(--rose)',
                fontSize: '0.7rem',
                fontWeight: 600,
                textAlign: 'center',
                border: `1px solid ${p.isStrong ? 'rgba(78,205,196,0.15)' : 'rgba(224,123,142,0.15)'}`,
                letterSpacing: '0.02em'
              }}>
                {p.isStrong ? '✓ CAPACITY EXCEEDS REQUIREMENT' : '⚠ FALLS BELOW REQUIRED STRENGTH'}
              </div>

            </div>
          )
        })}
      </div>

      <div style={{ textAlign: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border-soft)' }}>
        <p style={{ fontSize: '0.75rem', fontStyle: 'italic', margin: 0 }}>
          Visualized using the Ṣaṭkalā methodology. 1 Rupa = 60 Shashtiamsas. 
          Radar shows relative distribution across Sthana, Dig, Kala, Chesta, Naisargika, and Drik Balas.
        </p>
      </div>

    </div>
  )
}
