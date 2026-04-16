'use client'

/**
 * src/app/sbc/page.tsx
 * ─────────────────────────────────────────────────────────────
 * Sarvatobhadra Chakra Dashboard
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

function todayIST(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date())
}

function fmtDate(d: string): string {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function PulseMeter({ pulse }: { pulse: SBCAnalysis['financialPulse'] }) {
  const color =
    pulse.score > 8  ? '#4db66a' :
    pulse.score < -8 ? '#e84040' : '#c9a84c'
  const pct       = Math.abs(pulse.score)
  const barWidth  = `${(pct / 50) * 50}%`
  const barLeft   = pulse.score >= 0 ? '50%' : `${50 - (pct / 50) * 50}%`

  return (
    <div>
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

export default function SBCPage() {
  const { chart }  = useChart()
  const grid       = useMemo(() => getSBCGrid(), [])

  const [transitDate,    setTransitDate]    = useState(todayIST)
  const [transitRaw,     setTransitRaw]     = useState<SBCGrahaInput[]>([])
  const [loading,        setLoading]        = useState(false)
  const [showTransits,   setShowTransits]   = useState(true)
  const [selectedCell,   setSelectedCell]   = useState<SBCCell | null>(null)

  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1100)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const [gridSize,      setGridSize]        = useState(540)
  const [fontScale,     setFontScale]       = useState(1.0)
  const [fontWeight,    setFontWeight]      = useState(600)

  useEffect(() => {
    if (isMobile) {
      setGridSize(Math.min(window.innerWidth - 32, 540))
      setFontScale(0.85)
    } else {
      setGridSize(540)
      setFontScale(1.0)
    }
  }, [isMobile])

  const fetchTransits = useCallback(async (date: string) => {
    setLoading(true)
    try {
      const res  = await fetch(`/api/transits/planets?date=${date}&ayanamsha=lahiri`)
      const json = await res.json()
      if (json.success) setTransitRaw(json.grahas)
    } catch (e) {} finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchTransits(transitDate) }, [transitDate, fetchTransits])

  const natalGrahas = useMemo<SBCGrahaInput[]>(() => {
    if (!chart) return []
    return chart.grahas
      .filter(g => !['Ur', 'Ne', 'Pl'].includes(g.id))
      .map(g => ({ id: g.id, lonSidereal: g.lonSidereal }))
  }, [chart])

  const natalOnGrid   = useMemo(() => getPlanetsOnSBC(natalGrahas, true), [natalGrahas])
  const transitOnGrid = useMemo(() => (showTransits ? getPlanetsOnSBC(transitRaw, false) : []), [transitRaw, showTransits])

  const analysis = useMemo<SBCAnalysis | null>(() => {
    if (!transitRaw.length && !natalGrahas.length) return null
    return analyzeSBC(natalGrahas, showTransits ? transitRaw : [], grid)
  }, [natalGrahas, transitRaw, showTransits, grid])

  const cellVedhas = useMemo(() => {
    if (!selectedCell || !analysis) return []
    return analysis.vedhas.filter(v =>
      (selectedCell.nakshatraIndex !== undefined && v.affectedNakshatras.includes(selectedCell.nakshatraIndex)) ||
      (selectedCell.rashiIndex !== undefined && v.affectedRashis.includes(selectedCell.rashiIndex))
    )
  }, [selectedCell, analysis])

  const pulse      = analysis?.financialPulse
  const pulseColor = pulse ? (pulse.score > 8 ? '#4db66a' : pulse.score < -8 ? '#e84040' : '#c9a84c') : '#888'

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-page)' }}>
      <header style={{
        padding: '0 2rem', height: '3.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--header-bg)', borderBottom: '1px solid var(--border-soft)', position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(14px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.2rem' }}>🪐</span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--text-gold)' }}>Vedaansh</span>
          </Link>
          <span style={{ color: 'var(--border)' }}>|</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', fontWeight: 600, color: 'var(--accent)' }}>Sarvatobhadra Chakra</span>
        </div>
        <nav style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link href="/muhurta" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textDecoration: 'none' }}>Muhūrta</Link>
          <ThemeToggle />
        </nav>
      </header>

      <main style={{ 
        flex: 1, maxWidth: 1440, width: '100%', margin: '0 auto', 
        padding: isMobile ? '1rem' : 'clamp(1rem,3vw,1.75rem)', display: 'flex', flexDirection: 'column', gap: '1.5rem' 
      }}>
        <div style={{ padding: isMobile ? '0 0.5rem' : 0 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: isMobile ? '1.5rem' : 'clamp(1.25rem,3vw,1.7rem)', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Sarvatobhadra Chakra</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>Classical 9×9 Vedic predictive grid — Transit Vedha detection & Dhana pulse.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1.25rem', alignItems: 'start' }}>
          
          {/* Left Column: Controls & Natal List */}
          <div style={{ width: isMobile ? '100%' : '250px', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            {/* Customization Details Moved to Top */}
            <div className="card" style={{ padding: '1rem' }}>
              <div className="label-caps" style={{ marginBottom: '0.75rem' }}>Grid Appearance</div>
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.65rem', marginBottom: '0.25rem', color: 'var(--text-muted)' }}>Scale: {gridSize}px</div>
                <input type="range" min="300" max="850" value={gridSize} onChange={e => setGridSize(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--gold)' }} />
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.65rem', marginBottom: '0.25rem', color: 'var(--text-muted)' }}>Text: {fontScale.toFixed(1)}x</div>
                <input type="range" min="0.5" max="2.0" step="0.1" value={fontScale} onChange={e => setFontScale(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--gold)' }} />
              </div>
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                {[400, 600, 800].map(w => (
                  <button key={w} onClick={() => setFontWeight(w)} style={{ flex: 1, padding: '0.2rem', fontSize: '0.65rem', borderRadius: 4, border: '1px solid var(--border-soft)', background: fontWeight === w ? 'var(--gold-faint)' : 'transparent', color: fontWeight === w ? 'var(--gold)' : 'var(--text-secondary)' }}>{w}</button>
                ))}
              </div>
            </div>

            <div className="card" style={{ padding: '1.25rem' }}>
              <div className="label-caps" style={{ marginBottom: '0.75rem' }}>Transit Date</div>
              <input type="date" className="input" value={transitDate} max={todayIST()} onChange={e => setTransitDate(e.target.value)} style={{ marginBottom: '0.5rem' }} />
              <button onClick={() => setTransitDate(todayIST())} className="btn btn-ghost" style={{ width: '100%', fontSize: '0.75rem' }}>↺ Today</button>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <input type="checkbox" checked={showTransits} onChange={e => setShowTransits(e.target.checked)} /> Show transit overlay
              </label>
            </div>

            {chart ? (
              <div className="card" style={{ padding: '1rem' }}>
                <div className="label-caps" style={{ marginBottom: '0.65rem' }}>● Natal — {chart.meta.name}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  {chart.grahas.filter(g => !['Ur', 'Ne', 'Pl'].includes(g.id)).map(g => {
                    const nak = nakFromLon(g.lonSidereal)
                    const [r, c] = SBC_NAK_POS[nak]
                    return (
                      <div key={g.id} onClick={() => setSelectedCell(grid[r][c])} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.74rem', cursor: 'pointer', padding: '0.2rem 0.3rem', borderRadius: 4, transition: 'background 0.15s' }}>
                        <div style={{ width: 14, height: 14, borderRadius: '50%', background: PLANET_COLOR[g.id] ?? '#888', border: '1.5px solid rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.52rem', color: '#fff', fontWeight: 700 }}>
                          {PLANET_SYMBOL[g.id]}
                        </div>
                        <span style={{ color: 'var(--text-secondary)' }}>{g.name}</span>
                        <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '0.66rem' }}>{NAKSHATRA_NAMES[nak]?.split(' ')[0]}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="card" style={{ padding: '1rem', textAlign: 'center', border: '1px dashed var(--border)' }}>
                 <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Load a chart to see natal positions</div>
              </div>
            )}

            {/* Legend Restored */}
            {!isMobile && (
              <div className="card" style={{ padding: '1rem' }}>
                <div className="label-caps" style={{ marginBottom: '0.65rem' }}>Cell types</div>
                {[
                  { bg: 'rgba(55,42,130,0.80)',  label: 'Nakshatra' },
                  { bg: 'rgba(110,78,20,0.80)',  label: 'Rashi' },
                  { bg: 'rgba(60,30,110,0.80)',  label: 'Vara Lord' },
                  { bg: 'rgba(18,70,88,0.80)',   label: 'Sanskrit Vowel' },
                  { bg: 'rgba(28,28,45,0.80)',   label: 'Consonant' },
                  { bg: 'rgba(120,88,15,0.80)',  label: 'The Native (Center)' },
                ].map(({ bg, label }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.32rem' }}>
                    <div style={{ width: 13, height: 13, borderRadius: 3, background: bg, border: '1px solid rgba(255,255,255,0.1)' }} />
                    <span style={{ fontSize: '0.69rem', color: 'var(--text-muted)' }}>{label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Center Column: Grid & Detail & Transit Table */}
          <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
              <SarvatobhadraChakra
                grid={grid}
                natalPlanets={natalOnGrid}
                transitPlanets={transitOnGrid}
                onCellClick={setSelectedCell}
                size={gridSize}
                fontScale={fontScale}
                fontWeight={fontWeight}
              />
            </div>

            {selectedCell && (
              <div className="card fade-up" style={{ width: '100%', padding: '1.25rem', border: '1px solid var(--gold)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{selectedCell.label} {selectedCell.sublabel && `(${selectedCell.sublabel})`}</h3>
                    <div style={{ fontSize: '0.7rem', opacity: 0.6, textTransform: 'uppercase', marginTop: 4 }}>
                      {selectedCell.type} {selectedCell.bodyPart && `· Association: ${selectedCell.bodyPart}`}
                    </div>
                  </div>
                  <button onClick={() => setSelectedCell(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
                </div>

                {/* Planets Present */}
                {(() => {
                  const k = `${selectedCell.row},${selectedCell.col}`
                  const n = natalOnGrid.filter(p => `${p.row},${p.col}` === k)
                  const t = transitOnGrid.filter(p => `${p.row},${p.col}` === k)
                  return (n.length || t.length) ? (
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                      {n.map(p => (
                        <span key={`n-${p.planet}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.74rem', padding: '0.2rem 0.65rem', background: 'rgba(255,215,0,0.1)', border: '1px solid var(--gold)', borderRadius: 20 }}>
                          <span style={{ color: 'var(--text-gold)', fontWeight: 700 }}>Natal {p.planet}</span>
                        </span>
                      ))}
                      {t.map(p => (
                        <span key={`t-${p.planet}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.74rem', padding: '0.2rem 0.65rem', background: 'rgba(139,124,246,0.1)', border: '1px dashed var(--accent)', borderRadius: 20 }}>
                          <span style={{ color: 'var(--accent)', fontWeight: 700 }}>Transit {p.planet}</span>
                        </span>
                      ))}
                    </div>
                  ) : null
                })()}

                {/* Vedha Influx */}
                {cellVedhas.length > 0 && (
                  <div>
                    <div className="label-caps" style={{ fontSize: '0.6rem', marginBottom: '0.4rem' }}>Significant Vedha Influx</div>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0.5rem' }}>
                      {cellVedhas.map((v, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.4rem 0.6rem', background: 'var(--surface-3)', borderRadius: 8, border: `1px solid ${v.isMalefic ? 'rgba(232,64,64,0.15)' : 'rgba(77,182,106,0.15)'}` }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: PLANET_COLOR[v.planet as GrahaId] ?? '#888' }} />
                          <span style={{ fontWeight: 700, color: v.isMalefic ? 'var(--rose)' : 'var(--teal)', fontSize: '0.75rem' }}>{v.planet}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.62rem' }}>Vedha</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Transit Position Table Restored */}
            {transitRaw.length > 0 && (
              <div className="card fade-up" style={{ width: '100%', padding: '1.25rem' }}>
                <div className="label-caps" style={{ marginBottom: '0.75rem' }}>Transit Positions — {fmtDate(transitDate)}</div>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '0.5rem' }}>
                  {(transitRaw as any[]).map((g: any) => {
                    const nak = nakFromLon(g.lonSidereal)
                    return (
                      <div key={g.id} onClick={() => { const [r, c] = SBC_NAK_POS[nak]; setSelectedCell(grid[r][c]) }} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.72rem', padding: '0.45rem', background: 'var(--surface-2)', border: '1px solid var(--border-soft)', borderRadius: 8, cursor: 'pointer' }}>
                         <div style={{ width: 10, height: 10, borderRadius: '50%', background: PLANET_COLOR[g.id as GrahaId], flexShrink: 0 }} />
                         <span style={{ color: 'var(--text-gold)', fontWeight: 800 }}>{g.id}</span>
                         <span style={{ color: 'var(--text-muted)' }}>{NAKSHATRA_NAMES[nak]?.split(' ')[0]}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Pulse & Activations & Body Alerts */}
          <div style={{ width: isMobile ? '100%' : '265px', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            <div className="card" style={{ padding: '1.25rem', border: pulse ? `1px solid ${pulseColor}38` : '1px solid var(--border)' }}>
              <div className="label-caps" style={{ marginBottom: '1rem' }}>💰 Financial Pulse</div>
              {pulse ? <PulseMeter pulse={pulse} /> : <div style={{ opacity: 0.5, fontSize: '0.8rem' }}>Calculation pending…</div>}
            </div>

            <div className="card" style={{ padding: '1.25rem' }}>
              <div className="label-caps" style={{ marginBottom: '0.75rem' }}>⚡ Natal Activations</div>
              {analysis?.activations?.length ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {analysis.activations.slice(0, 8).map((a, i) => (
                    <div key={i} style={{ fontSize: '0.7rem', borderLeft: `2px solid ${a.type === 'shubha' ? 'var(--teal)' : 'var(--rose)'}`, paddingLeft: '0.6rem' }}>
                      <div style={{ fontWeight: 800, color: a.type === 'shubha' ? 'var(--teal)' : 'var(--rose)' }}>{a.transitPlanet} → {a.natalPlanet}</div>
                      <div style={{ opacity: 0.7 }}>{a.meaning.slice(0, 100)}...</div>
                    </div>
                  ))}
                </div>
              ) : <div style={{ fontSize: '0.8rem', opacity: 0.5 }}>No active activations</div>}
            </div>

            {/* Body Part Alerts Restored */}
            {(analysis?.bodyPartsAlerted?.length ?? 0) > 0 && (
              <div className="card" style={{ padding: '1.25rem', border: '1px solid rgba(232,64,64,0.15)' }}>
                <div className="label-caps" style={{ color: 'var(--rose)', marginBottom: '0.75rem' }}>🫀 Body-Part Afflictions</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {analysis!.bodyPartsAlerted.slice(0, 10).map((b, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: PLANET_COLOR[b.by] }} />
                      <span style={{ color: 'var(--text-secondary)' }}>{b.part}</span>
                      <span style={{ marginLeft: 'auto', color: 'var(--rose)', fontSize: '0.65rem' }}>{b.by}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* How to Use Restored */}
            <div className="card" style={{ padding: '1rem', background: 'rgba(139,124,246,0.04)', border: '1px solid rgba(139,124,246,0.1)' }}>
              <div className="label-caps" style={{ marginBottom: '0.5rem', color: 'var(--accent)' }}>Reading Guide</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                Hover cells to view <b>Vedha</b> (obstructive aspects). <b>Pink</b> highlights indicate transit malefic pressure on natal positions. 💰 Financial pulse scores reflect Dhana-Vedha alignment.
              </div>
            </div>
          </div>

        </div>
      </main>

      <footer style={{ padding: '1.5rem', textAlign: 'center', opacity: 0.5, fontSize: '0.8rem', borderTop: '1px solid var(--border-soft)' }}>
        Sarvatobhadra Chakra · Classical Vedic Analysis System · <span style={{ color: 'var(--text-gold)' }}>Vedaansh Platform</span>
      </footer>
    </div>
  )
}
