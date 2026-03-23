// ─────────────────────────────────────────────────────────────
//  src/components/ui/YogaList.tsx
//  Graha Yoga display — classical combinations in the chart
// ─────────────────────────────────────────────────────────────
'use client'

import { useState } from 'react'
import type { YogaResult, YogaCategory } from '@/types/astrology'

const CATEGORY_CONFIG: Record<YogaCategory, { label: string; color: string; bg: string; icon: string }> = {
  mahapurusha: { label: 'Pancha Mahāpuruṣa', color: '#e2c97e', bg: 'rgba(201,168,76,0.10)', icon: '⭐' },
  raja:        { label: 'Rāja Yoga',          color: '#f59e42', bg: 'rgba(245,158,66,0.10)',  icon: '👑' },
  dhana:       { label: 'Dhana Yoga',         color: '#4ecdc4', bg: 'rgba(78,205,196,0.10)',  icon: '💎' },
  special:     { label: 'Special Yoga',       color: '#8b7cf6', bg: 'rgba(139,124,246,0.10)', icon: '✦' },
  viparita:    { label: 'Viparīta Rāja',      color: '#f0a0c0', bg: 'rgba(240,160,192,0.10)', icon: '☯' },
  lunar:       { label: 'Lunar Yoga',         color: '#b0c8e0', bg: 'rgba(176,200,224,0.10)', icon: '☽' },
}

const PLANET_NAMES: Record<string, string> = {
  Su:'Sun', Mo:'Moon', Ma:'Mars', Me:'Mercury',
  Ju:'Jupiter', Ve:'Venus', Sa:'Saturn', Ra:'Rahu', Ke:'Ketu',
}

const STRENGTH_CONFIG = {
  strong:   { label: 'Strong',   color: 'var(--teal)', bg: 'rgba(78,205,196,0.12)',   border: 'rgba(78,205,196,0.30)' },
  moderate: { label: 'Moderate', color: 'var(--gold)', bg: 'rgba(201,168,76,0.10)',   border: 'rgba(201,168,76,0.25)' },
  weak:     { label: 'Weak',     color: 'var(--rose)', bg: 'rgba(224,123,142,0.10)',  border: 'rgba(224,123,142,0.25)' },
}

const CATEGORY_ORDER: YogaCategory[] = ['mahapurusha','raja','dhana','special','viparita','lunar']

function YogaCard({ yoga }: { yoga: YogaResult }) {
  const cat = CATEGORY_CONFIG[yoga.category]
  const str = STRENGTH_CONFIG[yoga.strength]

  return (
    <div style={{
      background: 'var(--surface-1)',
      border: '1px solid var(--border)',
      borderLeft: `3px solid ${cat.color}`,
      borderRadius: 'var(--r-md)',
      padding: '0.9rem 1rem',
      display: 'flex', flexDirection: 'column', gap: '0.4rem',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.9rem' }}>{cat.icon}</span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {yoga.name}
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-display)', fontStyle: 'italic', color: cat.color, marginTop: 1 }}>
            {yoga.sanskrit}
          </div>
        </div>
        {/* Strength badge */}
        <span style={{
          padding: '0.15rem 0.55rem', borderRadius: 99,
          fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.06em',
          textTransform: 'uppercase', fontFamily: 'var(--font-display)',
          background: str.bg, color: str.color, border: `1px solid ${str.border}`,
          whiteSpace: 'nowrap',
        }}>
          {str.label}
        </span>
      </div>

      {/* Planets involved */}
      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
        {yoga.planets.map(p => (
          <span key={p} style={{
            padding: '0.12rem 0.45rem', borderRadius: 99,
            background: 'var(--surface-3)', border: '1px solid var(--border)',
            fontSize: '0.72rem', fontFamily: 'var(--font-display)',
            color: 'var(--text-secondary)', fontWeight: 500,
          }}>
            {PLANET_NAMES[p] ?? p}
          </span>
        ))}
        {yoga.houses.map(h => (
          <span key={`h${h}`} style={{
            padding: '0.12rem 0.45rem', borderRadius: 99,
            background: 'var(--gold-faint)', border: '1px solid rgba(201,168,76,0.20)',
            fontSize: '0.72rem', fontFamily: 'var(--font-mono)',
            color: 'var(--text-gold)',
          }}>
            H{h}
          </span>
        ))}
      </div>

      {/* Description */}
      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>
        {yoga.description}
      </div>

      {/* Effect */}
      <div style={{
        fontSize: '0.82rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-display)',
        padding: '0.5rem 0.75rem',
        background: cat.bg, borderRadius: 'var(--r-sm)',
        borderLeft: `2px solid ${cat.color}55`,
        lineHeight: 1.5,
      }}>
        {yoga.effect}
      </div>
    </div>
  )
}

export function YogaList({ yogas }: { yogas: YogaResult[] }) {
  const [showAll, setShowAll] = useState(false)
  
  if (!yogas?.length) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>
        No classical yogas detected in this chart.
      </div>
    )
  }

  // Flatten for limiting
  const visibleLimit = 3
  const displayYogas = showAll ? yogas : yogas.slice(0, visibleLimit)

  // Group by category (only for the ones we DISPLAY)
  const grouped = CATEGORY_ORDER.reduce<Record<string, YogaResult[]>>((acc, cat) => {
    const items = displayYogas.filter(y => y.category === cat)
    if (items.length) acc[cat] = items
    return acc
  }, {})

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Summary */}
      <div style={{
        display: 'flex', gap: '0.6rem', flexWrap: 'wrap',
        padding: '0.75rem 1rem',
        background: 'var(--surface-2)', border: '1px solid var(--border-bright)',
        borderRadius: 'var(--r-md)',
        alignItems: 'center',
      }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-gold)' }}>
            {yogas.length} Classical Yogas
          </span>
          <div style={{ width: 1, height: 16, background: 'var(--border)' }} />
          {yogas.filter(y => y.strength === 'strong').length > 0 && (
            <span style={{ fontSize: '0.74rem', color: 'var(--teal)', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--teal)' }} />
              {yogas.filter(y => y.strength === 'strong').length} Strong
            </span>
          )}
        </div>

        {!showAll && yogas.length > visibleLimit && (
          <button 
            onClick={() => setShowAll(true)}
            style={{ 
              background: 'var(--gold-faint)', border: '1px solid var(--gold)', borderRadius: 'var(--r-sm)',
              color: 'var(--text-gold)', padding: '0.25rem 0.6rem', fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer'
            }}
          >
            Show All ({yogas.length})
          </button>
        )}
        {showAll && (
           <button 
             onClick={() => setShowAll(false)}
             style={{ 
               background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)',
               color: 'var(--text-muted)', padding: '0.25rem 0.6rem', fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer'
             }}
           >
             Show Less
           </button>
        )}
      </div>

      {/* Grouped yoga cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {CATEGORY_ORDER.map(cat => {
          const items = grouped[cat]
          if (!items?.length) return null
          const cfg = CATEGORY_CONFIG[cat]
          return (
            <div key={cat} style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
              }}>
                <span style={{ fontSize: '0.85rem' }}>{cfg.icon}</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: cfg.color }}>
                  {cfg.label}
                </span>
                <div style={{ flex: 1, height: 1, background: `${cfg.color}22` }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {items.map((yoga, i) => <YogaCard key={`${cat}-${i}`} yoga={yoga} />)}
              </div>
            </div>
          )
        })}
      </div>

      {!showAll && yogas.length > visibleLimit && (
        <button 
          onClick={() => setShowAll(true)}
          style={{ 
            width: '100%', padding: '0.75rem', border: '1px dashed var(--gold)', borderRadius: 'var(--r-md)',
            background: 'var(--gold-faint)', color: 'var(--text-gold)', fontWeight: 700, fontSize: '0.8rem',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
          }}
        >
          View More Yogas (+{yogas.length - visibleLimit})
        </button>
      )}

      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontStyle: 'italic', textAlign: 'center', paddingTop: '0.5rem', borderTop: '1px solid var(--border-soft)' }}>
        Per BPHS, Phaladeepika & Saravali · Strength depends on planetary dignity, house position and aspects
      </div>
    </div>
  )
}