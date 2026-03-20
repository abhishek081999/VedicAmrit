// ─────────────────────────────────────────────────────────────
//  src/components/ui/ShadbalaTable.tsx
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
  Su: '#FDB813', Mo: '#E6E6E6', Ma: '#FF4D4D', Me: '#00D084',
  Ju: '#FFD700', Ve: '#FF69B4', Sa: '#8B8B8B',
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

// ── Graphical Components ───────────────────────────────────────

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

  // Data polygon — Normalize to 6.0 Rupas
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
  const maxTotal = useMemo(() => Math.max(...ORDER.map(id => planets[id]?.total || 0), 12), [planets]) // Increased to 12

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem', background: 'var(--surface-0)', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 className="label-caps" style={{ margin: 0, color: 'var(--text-gold)' }}>Total Strength Comparison (Rupas)</h4>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Required vs Actual</span>
      </div>

      <div style={{ height: 180, display: 'flex', alignItems: 'flex-end', gap: '1.5rem', padding: '0 1rem', paddingTop: '1rem' }}>
        {ORDER.map(id => {
          const p = planets[id]
          if (!p) return null
          const col = PLANET_COLOR[id]
          const heightPct = (p.total / maxTotal) * 100
          const reqPct = (p.required / maxTotal) * 100

          return (
            <div key={id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', position: 'relative', height: '100%' }}>
              
              <div style={{ 
                fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 600, 
                color: p.isStrong ? 'var(--text-primary)' : 'var(--rose)',
                marginBottom: 'auto'
              }}>
                {p.total.toFixed(1)}
              </div>

              <div style={{ width: '100%', maxWidth: 40, flex: 1, position: 'relative', background: 'var(--surface-3)', borderRadius: '4px 4px 0 0', overflow: 'hidden' }}>
                <div style={{ 
                  position: 'absolute', bottom: `${reqPct}%`, width: '100%', height: 2, 
                  background: 'var(--surface-4)', zIndex: 5, borderBottom: '1px dashed rgba(255,255,255,0.2)' 
                }} />
                
                <div style={{ 
                  position: 'absolute', bottom: 0, width: '100%', height: `${heightPct}%`, 
                  background: `linear-gradient(to top, ${col}99, ${col})`,
                  boxShadow: `0 0 12px ${col}33`,
                  transition: 'height 1s cubic-bezier(0.16, 1, 0.3, 1)'
                }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                 <span style={{ color: col, fontSize: '0.9rem' }}>{PLANET_SYMBOL[id]}</span>
                 <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)' }}>{id}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────

export function ShadbalaTable({ shadbala }: { shadbala: ShadbalaResult }) {
  const { planets, strongest, weakest } = shadbala
  const [hoveredPlanet, setHoveredPlanet] = useState<string | null>(null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1rem 0' }}>
      
      {/* ── Summary Row ────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
        
        {/* Strongest */}
        <div style={{ 
          padding: '1rem', background: 'var(--surface-2)', 
          border: '1px solid var(--border-bright)', borderRadius: 'var(--r-md)',
          display: 'flex', alignItems: 'center', gap: '1rem'
        }}>
          <div style={{ 
            width: 44, height: 44, borderRadius: '50%', background: `${PLANET_COLOR[strongest]}22`, 
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', color: PLANET_COLOR[strongest] 
          }}>
            {PLANET_SYMBOL[strongest]}
          </div>
          <div>
            <div className="label-caps" style={{ color: 'var(--teal)', fontSize: '0.6rem', marginBottom: 2 }}>Strongest</div>
            <div style={{ fontSize: '1rem', fontWeight: 500, fontFamily: 'var(--font-display)' }}>{PLANET_NAMES[strongest]}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>{planets[strongest]?.total} Rupas</div>
          </div>
        </div>

        {/* Weakest */}
        <div style={{ 
          padding: '1rem', background: 'var(--surface-2)', 
          border: '1px solid var(--border-soft)', borderRadius: 'var(--r-md)',
          display: 'flex', alignItems: 'center', gap: '1rem'
        }}>
          <div style={{ 
            width: 44, height: 44, borderRadius: '50%', background: `${PLANET_COLOR[weakest]}22`, 
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', color: PLANET_COLOR[weakest] 
          }}>
            {PLANET_SYMBOL[weakest]}
          </div>
          <div>
            <div className="label-caps" style={{ color: 'var(--rose)', fontSize: '0.6rem', marginBottom: 2 }}>Weakest</div>
            <div style={{ fontSize: '1rem', fontWeight: 500, fontFamily: 'var(--font-display)' }}>{PLANET_NAMES[weakest]}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>{planets[weakest]?.total} Rupas</div>
          </div>
        </div>

      </div>

      {/* ── Comparison Graph ───────────────────────────────────── */}
      <div className="fade-up">
         <ComparisonChart planets={planets} />
      </div>

      {/* ── Detailed Breakdown Grid ────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '0.75rem' }}>
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
                borderLeft: `4px solid ${col}`,
                borderRadius: 'var(--r-md)',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                transition: 'all 0.2s ease',
                transform: isHovered ? 'translateY(-2px)' : 'none',
                boxShadow: isHovered ? `0 8px 24px rgba(0,0,0,0.2)` : 'none',
                animationDelay: `${index * 0.05}s`
              }}
              className="fade-up"
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                   <div style={{ fontSize: '1.2rem', color: col }}>{PLANET_SYMBOL[id]}</div>
                   <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>{PLANET_NAMES[id]}</h3>
                </div>
                
                <div style={{ textAlign: 'right' }}>
                   <span style={{ fontSize: '1.1rem', fontWeight: 700, color: p.isStrong ? 'var(--text-primary)' : 'var(--rose)', fontFamily: 'var(--font-mono)' }}>
                     {p.total.toFixed(2)}
                   </span>
                   <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginLeft: 4 }}>/ {p.required}</span>
                </div>
              </div>

              {/* Main Content: Radar + List */}
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <RadarChart data={componentValues} color={col} size={110} />
                
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {COMPONENTS.map(c => (
                    <div key={c.key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem' }}>
                       <span style={{ color: 'var(--text-muted)' }}>{c.label}</span>
                       <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{ (p[c.key as keyof ShadbalaPlanet] as number).toFixed(2) }</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strength Badge */}
              <div style={{
                padding: '0.35rem',
                borderRadius: 'var(--r-xs)',
                background: p.isStrong ? 'rgba(78,205,196,0.08)' : 'rgba(224,123,142,0.08)',
                color: p.isStrong ? 'var(--teal)' : 'var(--rose)',
                fontSize: '0.65rem',
                fontWeight: 700,
                textAlign: 'center',
                border: `1px solid ${p.isStrong ? 'rgba(78,205,196,0.15)' : 'rgba(224,123,142,0.15)'}`,
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}>
                {p.isStrong ? '● Strong Engagement' : '○ Below Threshold'}
              </div>

            </div>
          )
        })}
      </div>

      <div style={{ textAlign: 'center', paddingTop: '1rem', opacity: 0.6 }}>
        <p style={{ fontSize: '0.68rem', fontStyle: 'italic', margin: 0 }}>
          Ṣaḍbala (Six-fold Strength) per BPHS standards. 1 Rupas = 60 Shashtiamsas.
        </p>
      </div>

    </div>
  )
}