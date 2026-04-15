'use client'

/**
 * src/app/sbc/page.tsx
 * ─────────────────────────────────────────────────────────────
 * Sarvatobhadra Chakra Dashboard
 *
 * Panels:
 *  Left   — Transit date controls + natal planet list + legend
 *  Center — Interactive 9×9 SBC grid + cell detail panel + transit table
 *  Right  — Financial Pulse meter + Natal Activations + Body Part Alerts
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { ThemeToggle }  from '@/components/ui/ThemeToggle'
import { useChart }     from '@/components/providers/ChartProvider'
import { SarvatobhadraChakra } from '@/components/ui/SarvatobhadraChakra'
import {
  getSBCGrid,
  getPlanetsOnSBC,
  analyzeSBC,
  PLANET_COLOR,
  PLANET_SYMBOL,
  nakFromLon,
  SBC_NAK_POS,
  type SBCCell,
  type SBCGrahaInput,
  type SBCAnalysis,
} from '@/lib/engine/sarvatobhadra'
import { GRAHA_NAMES, NAKSHATRA_NAMES } from '@/types/astrology'
import type { GrahaId } from '@/types/astrology'

// ─────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────

function todayIST(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date())
}

function fmtDate(d: string): string {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

// ─────────────────────────────────────────────────────────────
//  Sub-components
// ─────────────────────────────────────────────────────────────

function PulseMeter({ pulse }: { pulse: SBCAnalysis['financialPulse'] }) {
  const color =
    pulse.score > 8  ? '#4db66a' :
    pulse.score < -8 ? '#e84040' : '#c9a84c'
  const pct       = Math.abs(pulse.score)         // 0-50
  const barWidth  = `${(pct / 50) * 50}%`         // max 50% (half the bar)
  const barLeft   = pulse.score >= 0 ? '50%' : `${50 - (pct / 50) * 50}%`

  return (
    <div>
      {/* Gauge */}
      <div style={{ position: 'relative', height: 18, background: 'var(--surface-3)', borderRadius: 9, overflow: 'hidden', marginBottom: '0.5rem' }}>
        <div style={{
          position:     'absolute',
          top:          0, bottom: 0,
          left:         barLeft,
          width:        barWidth,
          background:   color,
          transition:   'all 0.6s ease',
          borderRadius: pulse.score >= 0 ? '0 9px 9px 0' : '9px 0 0 9px',
        }} />
        <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.35)' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '0.6rem' }}>
        <span>−50 Bear</span>
        <span style={{ fontWeight: 700, color, fontSize: '0.78rem' }}>
          {pulse.score > 0 ? '+' : ''}{pulse.score}
        </span>
        <span>Bull +50</span>
      </div>

      {/* Trend badge */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
        padding: '0.25rem 0.7rem', borderRadius: 20, marginBottom: '0.75rem',
        background: `${color}18`, border: `1px solid ${color}44`,
      }}>
        <span style={{ fontSize: '0.8rem' }}>
          {pulse.trend === 'expansion' ? '📈' : pulse.trend === 'contraction' ? '📉' : '↔️'}
        </span>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color, fontFamily: 'var(--font-display)', textTransform: 'capitalize' }}>
          {pulse.trend}
        </span>
      </div>

      {pulse.bullish.map((f, i) => (
        <div key={i} style={{ fontSize: '0.68rem', color: 'var(--teal)', fontFamily: 'var(--font-display)', marginBottom: 2, display: 'flex', gap: '0.3rem', lineHeight: 1.3 }}>
          <span style={{ flexShrink: 0 }}>↑</span><span>{f}</span>
        </div>
      ))}
      {pulse.bearish.map((f, i) => (
        <div key={i} style={{ fontSize: '0.68rem', color: 'var(--rose)', fontFamily: 'var(--font-display)', marginBottom: 2, display: 'flex', gap: '0.3rem', lineHeight: 1.3 }}>
          <span style={{ flexShrink: 0 }}>↓</span><span>{f}</span>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  Main page
// ─────────────────────────────────────────────────────────────

export default function SBCPage() {
  const { chart }  = useChart()
  const grid       = useMemo(() => getSBCGrid(), [])

  const [transitDate,    setTransitDate]    = useState(todayIST)
  const [transitRaw,     setTransitRaw]     = useState<SBCGrahaInput[]>([])
  const [loading,        setLoading]        = useState(false)
  const [showTransits,   setShowTransits]   = useState(true)
  const [selectedCell,   setSelectedCell]   = useState<SBCCell | null>(null)

  // ── Customization State ──
  const [gridSize,      setGridSize]        = useState(540)
  const [fontScale,     setFontScale]       = useState(1.0)
  const [fontWeight,    setFontWeight]      = useState(600)

  // ── 1. Load transit planets ────────────────────────────────
  const fetchTransits = useCallback(async (date: string) => {
    setLoading(true)
    try {
      const res  = await fetch(`/api/transits/planets?date=${date}&ayanamsha=lahiri`)
      const json = await res.json()
      if (json.success) setTransitRaw(json.grahas)
    } catch (e) {
      console.error('[sbc] transit fetch error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchTransits(transitDate) }, [transitDate, fetchTransits])

  // ── 2. Build SBC inputs ────────────────────────────────────
  const natalGrahas = useMemo<SBCGrahaInput[]>(() => {
    if (!chart) return []
    return chart.grahas
      .filter(g => !['Ur', 'Ne', 'Pl'].includes(g.id))
      .map(g => ({ id: g.id, lonSidereal: g.lonSidereal }))
  }, [chart])

  const natalOnGrid   = useMemo(() => getPlanetsOnSBC(natalGrahas, true), [natalGrahas])
  const transitOnGrid = useMemo(
    () => (showTransits ? getPlanetsOnSBC(transitRaw, false) : []),
    [transitRaw, showTransits],
  )

  const analysis = useMemo<SBCAnalysis | null>(() => {
    if (!transitRaw.length && !natalGrahas.length) return null
    return analyzeSBC(natalGrahas, showTransits ? transitRaw : [], grid)
  }, [natalGrahas, transitRaw, showTransits, grid])

  // ── 3. Cell detail: which vedhas hit this cell ─────────────
  const cellVedhas = useMemo(() => {
    if (!selectedCell || !analysis) return []
    return analysis.vedhas.filter(v =>
      (selectedCell.nakshatraIndex !== undefined && v.affectedNakshatras.includes(selectedCell.nakshatraIndex)) ||
      (selectedCell.rashiIndex !== undefined && v.affectedRashis.includes(selectedCell.rashiIndex))
    )
  }, [selectedCell, analysis])

  const pulse      = analysis?.financialPulse
  const pulseColor = pulse
    ? pulse.score > 8  ? '#4db66a' : pulse.score < -8 ? '#e84040' : '#c9a84c'
    : '#888'

  // ─────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-page)' }}>

      {/* ── Header ── */}
      <header style={{
        padding:       '0 2rem',
        height:        '3.75rem',
        display:       'flex',
        alignItems:    'center',
        justifyContent:'space-between',
        background:    'var(--header-bg)',
        borderBottom:  '1px solid var(--border-soft)',
        position:      'sticky',
        top:           0,
        zIndex:        100,
        backdropFilter:'blur(14px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.2rem' }}>🪐</span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--text-gold)' }}>Vedaansh</span>
          </Link>
          <span style={{ color: 'var(--border)' }}>|</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.01em' }}>
            Sarvatobhadra Chakra
          </span>
        </div>
        <nav style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Link href="/muhurta"  style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', color: 'var(--text-secondary)', textDecoration: 'none' }}>Muhūrta</Link>
          <Link href="/panchang" style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', color: 'var(--text-secondary)', textDecoration: 'none' }}>Pañcāṅga</Link>
          <ThemeToggle />
        </nav>
      </header>

      {/* ── Main ── */}
      <main style={{ flex: 1, maxWidth: 1440, width: '100%', margin: '0 auto', padding: 'clamp(1rem,3vw,1.75rem)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* Page title */}
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.25rem,3vw,1.7rem)', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Sarvatobhadra Chakra
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.83rem', fontFamily: 'var(--font-display)', margin: '0.25rem 0 0', fontStyle: 'italic' }}>
            Classical 9×9 Vedic predictive grid — Transit Vedha analysis · Dhana pulse · Body-part resonance
          </p>
        </div>

        {/* ── 3-column layout ────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr 265px', gap: '1.25rem', alignItems: 'start' }}>

          {/* ════════════════════════════════════
              LEFT SIDEBAR
          ════════════════════════════════════ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>

            {/* Transit controls */}
            <div className="card" style={{ padding: '1rem' }}>
              <div className="label-caps" style={{ marginBottom: '0.75rem' }}>Transit Date</div>
              <input
                type="date"
                className="input"
                value={transitDate}
                max={todayIST()}
                onChange={e => setTransitDate(e.target.value)}
                style={{ marginBottom: '0.5rem' }}
              />
              <button
                onClick={() => setTransitDate(todayIST())}
                className="btn btn-ghost"
                style={{ width: '100%', fontSize: '0.75rem', padding: '0.3rem' }}
              >
                ↺ Today
              </button>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}>
                <input type="checkbox" checked={showTransits} onChange={e => setShowTransits(e.target.checked)} />
                Show transit overlay
              </label>

              {loading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.6rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  <div className="spin-loader" style={{ width: 11, height: 11, border: '2px solid var(--border)', borderTopColor: 'var(--gold)', flexShrink: 0 }} />
                  Calculating transits…
                </div>
              )}
            </div>

            {/* Natal planet list */}
            {chart ? (
              <div className="card" style={{ padding: '1rem' }}>
                <div className="label-caps" style={{ marginBottom: '0.65rem' }}>● Natal — {chart.meta.name}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  {chart.grahas
                    .filter(g => !['Ur', 'Ne', 'Pl'].includes(g.id))
                    .map(g => {
                      const nak = nakFromLon(g.lonSidereal)
                      const [r, c] = SBC_NAK_POS[nak]
                      return (
                        <div
                          key={g.id}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.74rem', cursor: 'pointer', padding: '0.2rem 0.3rem', borderRadius: 4, transition: 'background 0.15s' }}
                          onClick={() => {
                            const cell = grid[r]?.[c]
                            if (cell) setSelectedCell(cell)
                          }}
                          title={`Go to ${g.name} in ${NAKSHATRA_NAMES[nak]}`}
                        >
                          <div style={{
                            width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
                            background: PLANET_COLOR[g.id] ?? '#888',
                            border: '1.5px solid rgba(255,255,255,0.7)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.52rem', color: '#fff', fontWeight: 700,
                          }}>
                            {PLANET_SYMBOL[g.id]}
                          </div>
                          <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}>{g.name}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.66rem', marginLeft: 'auto', fontFamily: 'var(--font-mono)' }}>
                            {NAKSHATRA_NAMES[nak].split(' ')[0]}
                          </span>
                          {g.isRetro && <span style={{ color: 'var(--rose)', fontSize: '0.6rem' }}>℞</span>}
                        </div>
                      )
                    })}
                </div>
              </div>
            ) : (
              <div className="card" style={{ padding: '1rem', textAlign: 'center', border: '1px dashed var(--border)' }}>
                <div style={{ fontSize: '1.6rem', marginBottom: '0.5rem' }}>🔮</div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontStyle: 'italic', marginBottom: '0.5rem' }}>
                  Calculate a birth chart to see natal planet analysis
                </div>
                <Link href="/" style={{ fontSize: '0.75rem', color: 'var(--text-gold)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                  Go to Chart →
                </Link>
              </div>
            )}

            {/* Legend */}
            <div className="card" style={{ padding: '1rem' }}>
              <div className="label-caps" style={{ marginBottom: '0.65rem' }}>Cell types</div>
              {[
                { bg: 'rgba(55,42,130,0.80)',  label: 'Nakshatra (27 stars)' },
                { bg: 'rgba(110,78,20,0.80)',  label: 'Rashi (zodiac sign)' },
                { bg: 'rgba(60,30,110,0.80)',  label: 'Vara (weekday lord)' },
                { bg: 'rgba(18,70,88,0.80)',   label: 'Sanskrit vowel' },
                { bg: 'rgba(28,28,45,0.80)',   label: 'Consonant / letter' },
                { bg: 'rgba(120,88,15,0.80)',  label: 'Center (native)' },
              ].map(({ bg, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.32rem' }}>
                  <div style={{ width: 13, height: 13, borderRadius: 3, background: bg, flexShrink: 0, border: '1px solid rgba(255,255,255,0.1)' }} />
                  <span style={{ fontSize: '0.69rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>{label}</span>
                </div>
              ))}
              <div style={{ borderTop: '1px solid var(--border-soft)', paddingTop: '0.45rem', marginTop: '0.45rem' }}>
                {[
                  { solid: true, label: 'Natal planet badge' },
                  { solid: false, label: 'Transit planet badge' },
                ].map(({ solid, label }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.28rem' }}>
                    <div style={{ width: 13, height: 13, borderRadius: '50%', background: 'rgba(255,215,0,0.45)', border: `1.5px ${solid ? 'solid' : 'dashed'} rgba(255,255,255,0.8)`, flexShrink: 0 }} />
                    <span style={{ fontSize: '0.69rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>{label}</span>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.45rem', fontFamily: 'var(--font-display)', lineHeight: 1.4 }}>
                Hover any cell → its row + column glows (Vedha). Pink glow = natal planet being affected.
              </div>
            </div>

            {/* Grid Customization */}
            <div className="card" style={{ padding: '1rem' }}>
              <div className="label-caps" style={{ marginBottom: '0.75rem' }}>Grid Customization</div>
              
              <div style={{ marginBottom: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Size ({gridSize}px)</label>
                </div>
                <input 
                  type="range" min="400" max="850" step="10" 
                  value={gridSize} onChange={e => setGridSize(Number(e.target.value))} 
                  style={{ width: '100%', accentColor: 'var(--gold)' }}
                />
              </div>

              <div style={{ marginBottom: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Text Scale ({fontScale.toFixed(1)}x)</label>
                </div>
                <input 
                  type="range" min="0.5" max="2.0" step="0.1" 
                  value={fontScale} onChange={e => setFontScale(Number(e.target.value))} 
                  style={{ width: '100%', accentColor: 'var(--gold)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>Font Weight</label>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  {[400, 600, 800].map(w => (
                    <button 
                      key={w}
                      onClick={() => setFontWeight(w)}
                      style={{
                        flex: 1, padding: '0.25rem', fontSize: '0.7rem',
                        borderRadius: 4, border: '1px solid var(--border-soft)',
                        background: fontWeight === w ? 'var(--gold-faint)' : 'transparent',
                        color: fontWeight === w ? 'var(--gold)' : 'var(--text-secondary)',
                        fontWeight: w, cursor: 'pointer'
                      }}
                    >
                      {w === 400 ? 'Light' : w === 600 ? 'Bold' : 'Heavy'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ════════════════════════════════════
              CENTER — GRID + DETAIL
          ════════════════════════════════════ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>

            {/* The chakra grid */}
            <SarvatobhadraChakra
              grid={grid}
              natalPlanets={natalOnGrid}
              transitPlanets={transitOnGrid}
              onCellClick={setSelectedCell}
              size={gridSize}
              fontScale={fontScale}
              fontWeight={fontWeight}
            />

            {/* Cell detail panel (slides in on click) */}
            {selectedCell && (
              <div className="card fade-up" style={{ width: '100%', padding: '1rem 1.25rem', border: '1px solid var(--border-bright)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                      {selectedCell.label}
                      {selectedCell.sublabel && <span style={{ marginLeft: '0.5rem', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 400 }}>({selectedCell.sublabel})</span>}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', marginTop: 2, textTransform: 'capitalize', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <span style={{ background: 'var(--surface-3)', padding: '1px 6px', borderRadius: 10 }}>{selectedCell.type}</span>
                      {selectedCell.nakshatraIndex !== undefined && <span style={{ background: 'var(--surface-3)', padding: '1px 6px', borderRadius: 10 }}>Nak #{selectedCell.nakshatraIndex + 1}</span>}
                      {selectedCell.rashiIndex && <span style={{ background: 'var(--surface-3)', padding: '1px 6px', borderRadius: 10 }}>Rashi {selectedCell.rashiIndex}</span>}
                      {selectedCell.bodyPart && <span style={{ background: 'rgba(224,123,142,0.12)', padding: '1px 6px', borderRadius: 10, color: 'var(--rose)' }}>{selectedCell.bodyPart}</span>}
                    </div>
                  </div>
                  <button onClick={() => setSelectedCell(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1 }}>✕</button>
                </div>

                {/* Planets present in this cell */}
                {(() => {
                  const k = `${selectedCell.row},${selectedCell.col}`
                  const n = natalOnGrid.filter(p => `${p.row},${p.col}` === k)
                  const t = transitOnGrid.filter(p => `${p.row},${p.col}` === k)
                  return (n.length || t.length) ? (
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                      {n.map(p => (
                        <span key={`n-${p.planet}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.74rem', padding: '0.2rem 0.65rem', background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.25)', borderRadius: 20 }}>
                          <span style={{ fontSize: '0.7rem' }}>{PLANET_SYMBOL[p.planet as GrahaId]}</span>
                          <span style={{ color: 'var(--text-gold)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>Natal {p.planet}</span>
                        </span>
                      ))}
                      {t.map(p => (
                        <span key={`t-${p.planet}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.74rem', padding: '0.2rem 0.65rem', background: 'rgba(139,124,246,0.08)', border: '1px dashed rgba(139,124,246,0.35)', borderRadius: 20 }}>
                          <span style={{ fontSize: '0.7rem' }}>{PLANET_SYMBOL[p.planet as GrahaId]}</span>
                          <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>Transit {p.planet}</span>
                        </span>
                      ))}
                    </div>
                  ) : null
                })()}

                {/* Inbound vedhas on this cell */}
                {cellVedhas.length > 0 && (
                  <div>
                    <div className="label-caps" style={{ fontSize: '0.6rem', marginBottom: '0.4rem' }}>Vedha cast on this cell</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                      {cellVedhas.slice(0, 6).map((v, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', padding: '0.25rem 0.5rem', background: v.isMalefic ? 'rgba(224,123,142,0.07)' : 'rgba(78,205,196,0.07)', border: `1px solid ${v.isMalefic ? 'rgba(224,123,142,0.20)' : 'rgba(78,205,196,0.20)'}`, borderRadius: 5 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: PLANET_COLOR[v.planet as GrahaId] ?? '#888', flexShrink: 0 }} />
                          <span style={{ color: v.isMalefic ? 'var(--rose)' : 'var(--teal)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>{GRAHA_NAMES[v.planet as GrahaId]}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.62rem' }}>{v.isMalefic ? 'papa' : 'shubha'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Transit planet table */}
            {transitRaw.length > 0 && (
              <div className="card fade-up" style={{ width: '100%', padding: '1rem 1.25rem' }}>
                <div className="label-caps" style={{ marginBottom: '0.75rem' }}>
                  Transit Positions — {fmtDate(transitDate)}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
                  {(transitRaw as any[]).map((g: any) => {
                    const nak = nakFromLon(g.lonSidereal)
                    return (
                      <div
                        key={g.id}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', padding: '0.3rem 0.5rem', background: 'var(--surface-2)', border: '1px solid var(--border-soft)', borderRadius: 6, cursor: 'pointer' }}
                        onClick={() => {
                          const [r, c] = SBC_NAK_POS[nak]
                          setSelectedCell(grid[r]?.[c] ?? null)
                        }}
                      >
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: PLANET_COLOR[g.id as GrahaId], border: '1px dashed rgba(255,255,255,0.6)', flexShrink: 0 }} />
                        <span style={{ color: 'var(--text-gold)', fontWeight: 600, fontFamily: 'var(--font-display)' }}>{g.id}</span>
                        <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontSize: '0.66rem' }}>
                          {NAKSHATRA_NAMES[nak]?.split(' ')[0] ?? nak}
                        </span>
                        {g.isRetro && <span style={{ color: 'var(--rose)', fontSize: '0.58rem', marginLeft: 'auto' }}>℞</span>}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ════════════════════════════════════
              RIGHT SIDEBAR
          ════════════════════════════════════ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>

            {/* Financial Pulse */}
            <div className="card" style={{ padding: '1.25rem', border: pulse ? `1px solid ${pulseColor}38` : '1px solid var(--border)' }}>
              <div className="label-caps" style={{ marginBottom: '1rem' }}>💰 Financial Pulse (Dhana Vedha)</div>
              {pulse ? (
                <PulseMeter pulse={pulse} />
              ) : (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', fontFamily: 'var(--font-display)' }}>
                  Load natal chart to see financial pulse
                </div>
              )}
            </div>

            {/* Active Vedha Activations */}
            <div className="card" style={{ padding: '1.25rem' }}>
              <div className="label-caps" style={{ marginBottom: '0.75rem' }}>⚡ Natal Activations</div>
              {analysis?.activations && analysis.activations.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 300, overflowY: 'auto' }}>
                  {analysis.activations.slice(0, 10).map((a, i) => (
                    <div key={i} style={{
                      padding: '0.5rem 0.65rem',
                      background: a.type === 'shubha' ? 'rgba(78,205,196,0.06)' : 'rgba(224,123,142,0.06)',
                      border: `1px solid ${a.type === 'shubha' ? 'rgba(78,205,196,0.20)' : 'rgba(224,123,142,0.20)'}`,
                      borderRadius: 'var(--r-sm)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: PLANET_COLOR[a.transitPlanet as GrahaId] ?? '#888', border: '1px dashed rgba(255,255,255,0.6)', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: a.type === 'shubha' ? 'var(--teal)' : 'var(--rose)', fontFamily: 'var(--font-display)' }}>
                          {a.transitPlanet} → {a.natalPlanet}
                        </span>
                        <span style={{ marginLeft: 'auto', fontSize: '0.6rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{a.strength}%</span>
                      </div>
                      <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', lineHeight: 1.35 }}>
                        {a.meaning.length > 80 ? a.meaning.slice(0, 78) + '…' : a.meaning}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', fontFamily: 'var(--font-display)' }}>
                  {chart
                    ? 'No natal-transit vedha activations for this date'
                    : 'Load natal chart to see activations'}
                </div>
              )}
            </div>

            {/* Body Part Alerts */}
            {(analysis?.bodyPartsAlerted?.length ?? 0) > 0 && (
              <div className="card" style={{ padding: '1.25rem', border: '1px solid rgba(224,123,142,0.22)' }}>
                <div className="label-caps" style={{ color: 'var(--rose)', marginBottom: '0.75rem' }}>🫀 Body-Part Resonance</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.38rem' }}>
                  {analysis!.bodyPartsAlerted.slice(0, 8).map((b, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.74rem' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: PLANET_COLOR[b.by as GrahaId] ?? '#888', flexShrink: 0 }} />
                      <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}>{b.part}</span>
                      <span style={{ marginLeft: 'auto', color: 'var(--rose)', fontFamily: 'var(--font-display)', fontSize: '0.65rem', fontWeight: 600 }}>{b.by}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '0.75rem', fontSize: '0.65rem', color: 'var(--text-muted)', fontStyle: 'italic', fontFamily: 'var(--font-display)', lineHeight: 1.4 }}>
                  Malefic vedha crosses letter cells linked to these body areas. Precautionary awareness recommended.
                </div>
              </div>
            )}

            {/* How to use */}
            <div className="card" style={{ padding: '1rem', background: 'rgba(139,124,246,0.04)', border: '1px solid rgba(139,124,246,0.15)' }}>
              <div className="label-caps" style={{ marginBottom: '0.6rem', color: 'var(--accent)' }}>How to Read</div>
              {[
                ['Hover a cell', 'See its row + column vedha glow'],
                ['Pink cells', 'Your natal planet is being vedha\'d by a transit'],
                ['Gold glow', 'Source cell you are hovering'],
                ['◌ badge', 'Transiting planet in that nakshatra'],
                ['● badge', 'Natal planet in that nakshatra'],
              ].map(([term, desc]) => (
                <div key={term} style={{ marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-display)' }}>{term}: </span>
                  <span style={{ fontSize: '0.70rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>{desc}</span>
                </div>
              ))}
            </div>

          </div>
        </div>

      </main>

      <footer style={{ padding: '1rem 2rem', borderTop: '1px solid var(--border-soft)', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontSize: '0.8rem' }}>
        Sarvatobhadra Chakra · Classical Vedic 9×9 Grid · <span style={{ color: 'var(--text-gold)' }}>Vedaansh Platform</span>
      </footer>
    </div>
  )
}
