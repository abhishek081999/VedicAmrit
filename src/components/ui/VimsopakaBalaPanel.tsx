'use client'

// ─────────────────────────────────────────────────────────────
//  src/components/ui/VimsopakaBalaPanel.tsx
//  REDESIGNED: High-performance, luxury-themed Vimsopaka UI
//  Version 3.0 — SVG Gauges, Interactive Heatmap & BPHS Logic
// ─────────────────────────────────────────────────────────────

import React, { useMemo, useState } from 'react'
import type { GrahaId, VimsopakaBalaResult } from '@/lib/engine/vimsopaka'
import { Crown, Gem, Info, Palette, ScrollText, Sparkles, ChevronDown, ChevronUp } from 'lucide-react'

interface Props {
  vimsopaka: VimsopakaBalaResult
  userPlan?: 'free' | 'gold' | 'platinum'
}

const ORDER: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']

const PLANET_NAMES: Record<GrahaId, string> = {
  Su: 'Sun', Mo: 'Moon', Ma: 'Mars', Me: 'Mercury',
  Ju: 'Jupiter', Ve: 'Venus', Sa: 'Saturn', Ra: 'Rahu', Ke: 'Ketu',
  Ur: 'Uranus', Ne: 'Neptune', Pl: 'Pluto',
}

const PLANET_GLYPHS: Record<GrahaId, string> = {
  Su: '☉', Mo: '☽', Ma: '♂', Me: '☿', Ju: '♃',
  Ve: '♀', Sa: '♄', Ra: '☊', Ke: '☋',
  Ur: '⛢', Ne: '♆', Pl: '♇',
}

const VARGA_LABELS: Record<string, string> = {
  D1: 'Rashi', D2: 'Hora', D3: 'Drekkana', D4: 'Chaturthamsha',
  D7: 'Saptamsha', D9: 'Navamsha', D10: 'Dashamsha', D12: 'Dwadashamsha',
  D16: 'Shodashamsha', D20: 'Vimshamsha', D24: 'Chaturvimshamsha',
  D27: 'Bhamsha', D30: 'Trimshamsha', D40: 'Khavedamsha',
  D45: 'Akshavedamsha', D60: 'Shashtyamsha',
}

const SCHEMES = [
  { id: 'shodasvarga', label: 'Shoḍaśa (16)', short: '16V' },
  { id: 'dashavarga',  label: 'Daśa (10)',    short: '10V' },
  { id: 'saptavarga',  label: 'Sapta (7)',    short: '7V'  },
  { id: 'shadvarga',   label: 'Ṣaḍ (6)',      short: '6V'  },
] as const

type SchemeId = (typeof SCHEMES)[number]['id']

// ── Colour helpers ────────────────────────────────────────────

const DIGNITY_COLORS: Record<string, string> = {
  exalted:      'var(--gold)',
  moolatrikona: 'var(--teal)',
  own:          'var(--accent)',
  great_friend: '#60a5fa',
  friend:       '#93c5fd',
  neutral:      'var(--text-muted)',
  enemy:        '#f97316',
  great_enemy:  'var(--rose)',
  debilitated:  '#dc2626',
}

const DIGNITY_LABELS: Record<string, string> = {
  exalted:      'Exalted',
  moolatrikona: 'Moolatrikona',
  own:          'Own',
  great_friend: 'Gr.Friend',
  friend:       'Friend',
  neutral:      'Neutral',
  enemy:        'Enemy',
  great_enemy:  'Gr.Enemy',
  debilitated:  'Debilitated',
}

// Correct BPHS dignity points for display
const DIGNITY_POINTS_DISPLAY: Record<string, number> = {
  exalted: 20, moolatrikona: 18, own: 15, great_friend: 10,
  friend: 7, neutral: 4, enemy: 2, great_enemy: 1, debilitated: 0,
}

function getDignityColor(d: string | null): string {
  if (!d) return 'var(--surface-3)'
  return DIGNITY_COLORS[d] ?? 'var(--surface-3)'
}

function getScoreColor(score: number): string {
  if (score >= 15) return 'var(--text-gold)'
  if (score >= 10) return 'var(--teal)'
  if (score >= 6)  return 'var(--accent)'
  return 'var(--rose)'
}

function getScoreBg(score: number): string {
  if (score >= 15) return 'var(--gold-faint)'
  if (score >= 10) return 'rgba(78,205,196,0.12)'
  if (score >= 6)  return 'var(--accent-glow)'
  return 'rgba(224,123,142,0.12)'
}

function strengthLabel(score: number): string {
  if (score >= 15) return 'Excellent'
  if (score >= 10) return 'Strong'
  if (score >= 6)  return 'Moderate'
  return 'Weak'
}

// ── SVG Gauge ─────────────────────────────────────────────────

function Gauge({ score, size = 90 }: { score: number; size?: number }) {
  const r = (size - 12) / 2
  const cx = size / 2
  const cy = size / 2
  const circumference = Math.PI * r  // semi-circle
  const progress = Math.min(1, score / 20)
  const dashOffset = circumference * (1 - progress)
  const color = getScoreColor(score)

  // Needle angle: -180deg (0) to 0deg (20)
  const angle = -180 + progress * 180
  const rad = (angle * Math.PI) / 180
  const nx = cx + (r - 4) * Math.cos(rad)
  const ny = cy + (r - 4) * Math.sin(rad)

  return (
    <svg width={size} height={size / 2 + 14} viewBox={`0 0 ${size} ${size / 2 + 14}`}>
      {/* Track */}
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none" stroke="var(--surface-3)" strokeWidth={8} strokeLinecap="round"
      />
      {/* Progress */}
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none" stroke={color} strokeWidth={8} strokeLinecap="round"
        strokeDasharray={`${circumference}`}
        strokeDashoffset={dashOffset}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      {/* Needle */}
      <line x1={cx} y1={cy} x2={nx} y2={ny}
        stroke={color} strokeWidth={2} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={3} fill={color} />
      {/* Score text */}
      <text x={cx} y={cy + 16} textAnchor="middle" fill={color}
        fontSize={13} fontWeight="bold">
        {score.toFixed(2)}
      </text>
    </svg>
  )
}

// ── Mini bar ──────────────────────────────────────────────────

function MiniBar({ score, max = 20 }: { score: number; max?: number }) {
  const pct = Math.min(100, (score / max) * 100)
  return (
    <div style={{ height: 5, borderRadius: 999, background: 'var(--surface-3)', overflow: 'hidden' }}>
      <div style={{
        width: `${pct}%`, height: '100%', borderRadius: 999,
        background: `linear-gradient(90deg, ${getScoreColor(score)}, ${getScoreColor(score)}aa)`,
        transition: 'width 0.5s ease',
      }} />
    </div>
  )
}

// ── Main Panel ────────────────────────────────────────────────

export function VimsopakaBalaPanel({ vimsopaka, userPlan = 'free' }: Props) {
  void userPlan
  const [activePlanet, setActivePlanet]   = useState<GrahaId>('Su')
  const [selectedScheme, setSelectedScheme] = useState<SchemeId>('shodasvarga')
  const [showMatrix, setShowMatrix]       = useState(true)
  const [showClassic, setShowClassic]     = useState(false)

  const ranked = useMemo(() => {
    const list = ORDER.map((id) => {
      const p = vimsopaka.planets[id]
      const score = (p ? (p[selectedScheme] as number) : 0) || 0
      return {
        id,
        score,
        percent: (score / 20) * 100,
      }
    })
    return list
      .sort((a, b) => b.score - a.score)
      .map((item, idx) => ({ ...item, rank: idx + 1 }))
  }, [vimsopaka, selectedScheme])

  const curData = vimsopaka?.planets?.[activePlanet]

  const sortedContributions = useMemo(() => {
    return Object.entries(curData?.vargaContributions ?? {})
      .sort((a, b) => b[1] - a[1])
  }, [curData])

  if (!vimsopaka?.planets) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Viṁśopaka data unavailable.
      </div>
    )
  }

  const activeScore = curData ? (curData[selectedScheme] as number) : 0
  const activeRank  = ranked.find(r => r.id === activePlanet)?.rank ?? 1
  const vargaKeys   = Object.keys(curData?.vargaDignities ?? {})

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="vp-card vp-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Crown size={16} style={{ color: 'var(--gold)' }} />
          <span className="vp-caps">Viṁśopaka Bala</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>BPHS — 20-Point Strength</span>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
          <div>
            <div className="vp-caps" style={{ color: 'var(--text-muted)' }}>Strongest</div>
            <div style={{ fontWeight: 700, color: 'var(--gold)' }}>
              {PLANET_GLYPHS[vimsopaka.strongest as GrahaId]} {PLANET_NAMES[vimsopaka.strongest as GrahaId]}
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 6 }}>
                {vimsopaka.planets[vimsopaka.strongest]?.shodasvarga.toFixed(2)} / 20
              </span>
            </div>
          </div>
          <div>
            <div className="vp-caps" style={{ color: 'var(--text-muted)' }}>Weakest</div>
            <div style={{ fontWeight: 700, color: 'var(--rose)' }}>
              {PLANET_GLYPHS[vimsopaka.weakest as GrahaId]} {PLANET_NAMES[vimsopaka.weakest as GrahaId]}
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 6 }}>
                {vimsopaka.planets[vimsopaka.weakest]?.shodasvarga.toFixed(2)} / 20
              </span>
            </div>
          </div>
          <div>
            <div className="vp-caps" style={{ color: 'var(--text-muted)' }}>Average</div>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
              {vimsopaka.insights?.averageShodasvarga?.toFixed(2)} / 20
            </div>
          </div>
          <div>
            <div className="vp-caps" style={{ color: 'var(--text-muted)' }}>Spread</div>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
              {vimsopaka.insights?.spread?.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* ── Scheme selector ────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        {SCHEMES.map(s => (
          <button
            key={s.id}
            onClick={() => setSelectedScheme(s.id)}
            className={`vp-pill ${selectedScheme === s.id ? 'vp-pill-active' : ''}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* ── Planet cards row ────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
        {ORDER.map(id => {
          const p = vimsopaka.planets[id]
          if (!p) return null
          const score = (p as any)[selectedScheme] as number
          const active = activePlanet === id
          return (
            <button
              key={id}
              onClick={() => setActivePlanet(id)}
              className="vp-planet-card"
              style={{
                borderColor: active ? getScoreColor(score) : 'transparent',
                background: active ? getScoreBg(score) : 'var(--surface-1)',
              }}
            >
              <div style={{ fontSize: '1.2rem', lineHeight: 1 }}>{PLANET_GLYPHS[id]}</div>
              <div style={{
                fontSize: '0.78rem', fontWeight: 800,
                color: getScoreColor(score), marginTop: '0.25rem',
              }}>
                {score.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '0.1rem' }}>
                {id}
              </div>
              <div style={{ marginTop: '0.35rem', width: '100%' }}>
                <MiniBar score={score} />
              </div>
            </button>
          )
        })}
      </div>

      {/* ── Detail + Rankings grid ──────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>

        {/* Planet detail card */}
        <div className="vp-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
            <div>
              <div className="vp-caps">Selected Planet</div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', marginTop: '0.2rem', color: 'var(--text-primary)' }}>
                {PLANET_GLYPHS[activePlanet]} {PLANET_NAMES[activePlanet]}
              </div>
            </div>
            <Gauge score={activeScore} size={80} />
          </div>

          {/* Stats chips */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.5rem', marginBottom: '0.8rem' }}>
            {([
              { label: 'Rank', value: `#${activeRank}`, sub: 'of 9' },
              { label: 'Status', value: strengthLabel(activeScore), sub: selectedScheme, color: getScoreColor(activeScore) },
              { label: 'Score', value: activeScore.toFixed(2), sub: '/ 20', color: getScoreColor(activeScore) },
            ] as const).map((chip, i) => (
              <div key={i} className="vp-stat-chip">
                <div className="vp-caps">{chip.label}</div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: (chip as any).color ?? 'var(--text-primary)', marginTop: '0.1rem' }}>
                  {chip.value}
                </div>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.05rem' }}>{chip.sub}</div>
              </div>
            ))}
          </div>

          {/* All varga contributions */}
          <div className="vp-caps" style={{ marginBottom: '0.4rem' }}>
            Shoḍaśa Contributions
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', maxHeight: 260, overflowY: 'auto' }}>
            {sortedContributions.map(([varga, val]) => {
              const dignity = curData?.vargaDignities[varga] ?? null
              const pct = Math.min(100, (val / 3.5) * 100) // max weight is 3.5
              return (
                <div key={varga}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', marginBottom: '0.1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <span style={{
                        width: 7, height: 7, borderRadius: 2,
                        display: 'inline-block',
                        background: getDignityColor(dignity),
                      }} />
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                        {varga}
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        {VARGA_LABELS[varga] ?? ''}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <span style={{ color: getDignityColor(dignity), fontSize: '0.66rem', fontWeight: 700 }}>
                        {dignity ? (DIGNITY_LABELS[dignity] ?? dignity) : '—'}
                        {dignity ? ` (${DIGNITY_POINTS_DISPLAY[dignity] ?? '?'})` : ''}
                      </span>
                      <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {val.toFixed(3)}
                      </span>
                    </div>
                  </div>
                  <div style={{ height: 4, background: 'var(--surface-3)', borderRadius: 999 }}>
                    <div style={{
                      width: `${pct}%`, height: '100%', borderRadius: 999,
                      background: `linear-gradient(90deg,${getDignityColor(dignity)},${getDignityColor(dignity)}88)`,
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Rankings card */}
        <div className="vp-card">
          <div className="vp-caps" style={{ marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Sparkles size={12} style={{ color: 'var(--gold)' }} />
            Ranking — {SCHEMES.find(s => s.id === selectedScheme)?.label}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            {ranked.map((row, idx) => {
                const isActive = row.id === activePlanet
                return (
                  <button
                    key={row.id}
                    onClick={() => setActivePlanet(row.id as GrahaId)}
                    className="vp-rank-row"
                    style={{
                      background: isActive ? getScoreBg(row.score) : 'var(--surface-1)',
                      borderColor: isActive ? getScoreColor(row.score) : 'var(--border-soft)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                      <span style={{
                        width: 22, height: 22, borderRadius: '50%',
                        background: idx === 0 ? 'var(--gold-faint)' : 'var(--surface-3)',
                        border: `1px solid ${idx === 0 ? 'var(--gold)' : 'var(--border)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.6rem', fontWeight: 800, color: idx === 0 ? 'var(--gold)' : 'var(--text-muted)',
                        flexShrink: 0,
                      }}>
                        #{idx + 1}
                      </span>
                      <span style={{ fontSize: '0.9rem' }}>{PLANET_GLYPHS[row.id as GrahaId]}</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {PLANET_NAMES[row.id as GrahaId]}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: 60 }}>
                        <MiniBar score={row.score} />
                      </div>
                      <span style={{
                        fontSize: '0.8rem', fontWeight: 800,
                        color: getScoreColor(row.score), fontFamily: 'var(--font-mono)', minWidth: 36,
                        textAlign: 'right',
                      }}>
                        {row.score.toFixed(2)}
                      </span>
                    </div>
                  </button>
                )
              })}
          </div>
        </div>
      </div>

      {/* ── Dignity Heatmap ─────────────────────────────────── */}
      <div className="vp-card">
        <button
          onClick={() => setShowMatrix(v => !v)}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0 }}
        >
          <div className="vp-caps" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Palette size={12} style={{ color: 'var(--accent)' }} />
            Dignity Heatmap — Shoḍaśa Vargas
          </div>
          {showMatrix ? <ChevronUp size={14} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />}
        </button>

        {showMatrix && (
          <div style={{ marginTop: '0.75rem', overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'separate', borderSpacing: '2px', minWidth: 520 }}>
              <thead>
                <tr>
                  <th style={{ fontSize: '0.64rem', color: 'var(--text-muted)', fontWeight: 700, textAlign: 'left', padding: '0.2rem 0.4rem', width: 80 }}>
                    Varga
                  </th>
                  {ORDER.map(id => (
                    <th key={id} style={{ fontSize: '0.64rem', color: activePlanet === id ? 'var(--gold)' : 'var(--text-muted)', fontWeight: 700, textAlign: 'center', padding: '0.2rem' }}>
                      {PLANET_GLYPHS[id]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vargaKeys.map(varga => (
                  <tr key={varga}>
                    <td style={{ fontSize: '0.64rem', color: 'var(--text-secondary)', fontWeight: 600, padding: '0.15rem 0.4rem', whiteSpace: 'nowrap' }}>
                      <span style={{ color: 'var(--text-primary)' }}>{varga}</span>
                      <span style={{ color: 'var(--text-muted)', marginLeft: 4 }}>{VARGA_LABELS[varga] ?? ''}</span>
                    </td>
                    {ORDER.map(id => {
                      const d = vimsopaka.planets[id]?.vargaDignities[varga] ?? null
                      const selected = id === activePlanet
                      const pts = d ? DIGNITY_POINTS_DISPLAY[d] : null
                      return (
                        <td
                          key={`${varga}-${id}`}
                          onClick={() => setActivePlanet(id)}
                          title={`${PLANET_NAMES[id]} · ${varga}: ${d ?? 'neutral'} (${pts ?? '?'}/20)`}
                          style={{ textAlign: 'center', cursor: 'pointer', padding: '0.1rem' }}
                        >
                          <div style={{
                            width: 24, height: 18, borderRadius: 3,
                            background: d ? getDignityColor(d) : 'var(--surface-3)',
                            opacity: d ? (d === 'neutral' ? 0.5 : 1) : 0.2,
                            margin: '0 auto',
                            boxShadow: selected ? `0 0 0 2px var(--gold)` : 'none',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <span style={{ fontSize: '0.45rem', color: '#fff', fontWeight: 800 }}>
                              {pts !== null ? pts : ''}
                            </span>
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Classic table ───────────────────────────────────── */}
      <div className="vp-card">
        <button
          onClick={() => setShowClassic(v => !v)}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0 }}
        >
          <div className="vp-caps" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <ScrollText size={12} style={{ color: 'var(--gold)' }} />
            Classic Score Table — All Schemes
          </div>
          {showClassic ? <ChevronUp size={14} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />}
        </button>

        {showClassic && (
          <div style={{ marginTop: '0.75rem', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.74rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '0.35rem 0.5rem', color: 'var(--text-muted)', fontWeight: 700 }}>Scheme</th>
                  {ORDER.map(id => (
                    <th key={id} style={{
                      textAlign: 'center', padding: '0.35rem 0.25rem',
                      color: activePlanet === id ? 'var(--gold)' : 'var(--text-muted)', fontWeight: 700,
                    }}>
                      {PLANET_GLYPHS[id]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SCHEMES.map(scheme => (
                  <tr key={scheme.id} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                    <td style={{ padding: '0.35rem 0.5rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{scheme.label}</td>
                    {ORDER.map(id => {
                      const score = (vimsopaka.planets[id]?.[scheme.id] as number) ?? 0
                      const active = activePlanet === id
                      return (
                        <td
                          key={`${scheme.id}-${id}`}
                          onClick={() => { setActivePlanet(id); setSelectedScheme(scheme.id) }}
                          style={{
                            textAlign: 'center', padding: '0.35rem 0.25rem',
                            color: getScoreColor(score), fontWeight: active ? 800 : 600,
                            background: active ? 'var(--gold-faint)' : 'transparent',
                            cursor: 'pointer', fontFamily: 'var(--font-mono)',
                          }}
                        >
                          {score.toFixed(2)}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Legend + Info ───────────────────────────────────── */}
      <div className="vp-card" style={{ padding: '0.75rem 1rem' }}>
        <div className="vp-caps" style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <Gem size={12} style={{ color: 'var(--gold)' }} />
          Dignity Points Legend (BPHS)
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1rem' }}>
          {Object.entries(DIGNITY_LABELS).map(([key, label]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{
                width: 10, height: 10, borderRadius: 2,
                display: 'inline-block', background: getDignityColor(key),
              }} />
              <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                {label}
              </span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                ({DIGNITY_POINTS_DISPLAY[key] ?? '?'})
              </span>
            </div>
          ))}
        </div>
        <div style={{
          marginTop: '0.75rem', display: 'flex', gap: '0.5rem',
          alignItems: 'flex-start', fontSize: '0.72rem', color: 'var(--text-muted)',
        }}>
          <Info size={13} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 1 }} />
          <div>
            <strong style={{ color: 'var(--text-secondary)' }}>Formula: </strong>
            Score = Σ [ (dignity_pts / 20) × varga_weight ] for each varga.
            Max score per scheme = 20 (planet exalted in all charts).
            Weights: Shoḍaśa sums to 20 across 16 vargas; other schemes likewise.
          </div>
        </div>
      </div>

    </div>
  )
}
