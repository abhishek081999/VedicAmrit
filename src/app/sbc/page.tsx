'use client'
/**
 * src/app/sbc/page.tsx
 * ─────────────────────────────────────────────────────────────
 * Advanced Sarvatobhadra Chakra Dashboard v2
 *
 * Features:
 *  - Birth & name nakshatra detection + grid highlighting
 *  - Diagonal vedha for Mars / Jupiter / Saturn / Rahu / Ketu
 *  - Life-area prediction tabs (Health, Wealth, Love, Travel, Career, Enemies)
 *  - Muhurta event assessment
 *  - Planet remedies panel
 *  - Tithi quality display
 *  - Comprehensive transit & natal position tables
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ThemeToggle }     from '@/components/ui/ThemeToggle'
import { useChart }        from '@/components/providers/ChartProvider'
import { SarvatobhadraChakra } from '@/components/ui/SarvatobhadraChakra'
import { SBCStockPanel }    from '@/components/ui/SBCStockPanel'
import { SBCAdvancedPanel } from '@/components/ui/SBCAdvancedPanel'
import {
  getSBCGrid,
  getPlanetsOnSBC,
  analyzeSBC,
  analyzeSBCExtended,
  PLANET_COLOR,
  PLANET_SYMBOL,
  PLANET_REMEDIES,
  MUHURTA_EVENTS,
  nakFromLon,
  nameToNakshatra,
  getTithiInfo,
  SBC_NAK_POS,
  type SBCCell,
  type SBCGrahaInput,
  type SBCAnalysis,
  type SBCAnalysisExtended,
  type LifeAreaKey,
  type MuhurtaEvent,
} from '@/lib/engine/sarvatobhadra'
import { GRAHA_NAMES, NAKSHATRA_NAMES } from '@/types/astrology'
import type { GrahaId } from '@/types/astrology'
import {
  USE_CASES,
  USE_CASE_CATEGORIES,
  computePlanetStatuses,
  assessSingleUseCase,
  assessCategory,
  getCategorySummaries,
  type SBCUseCase,
  type UseCaseResult,
  type UseCaseVerdict,
  type CategorySummary,
} from '@/lib/engine/sbcUseCases'

// ─── Utils ────────────────────────────────────────────────────

function todayIST(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date())
}

function fmtDate(d: string): string {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
  })
}

const PLANET_NAME: Record<string, string> = {
  Su:'Sun', Mo:'Moon', Ma:'Mars', Me:'Mercury', Ju:'Jupiter',
  Ve:'Venus', Sa:'Saturn', Ra:'Rahu', Ke:'Ketu',
}

// ─── Sub-components ───────────────────────────────────────────

function PulseMeter({ pulse }: { pulse: SBCAnalysis['financialPulse'] }) {
  const color =
    pulse.score > 8  ? '#4db66a' :
    pulse.score < -8 ? '#e84040' : '#c9a84c'
  const pct      = Math.abs(pulse.score)
  const barWidth = `${(pct / 50) * 50}%`
  const barLeft  = pulse.score >= 0 ? '50%' : `${50 - (pct / 50) * 50}%`

  return (
    <div>
      <div style={{ position: 'relative', height: 16, background: 'var(--surface-3)', borderRadius: 8, overflow: 'hidden', marginBottom: '0.5rem' }}>
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: barLeft, width: barWidth, background: color, transition: 'all 0.6s ease', borderRadius: pulse.score >= 0 ? '0 8px 8px 0' : '8px 0 0 8px' }} />
        <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.3)' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
        <span>Bear −50</span>
        <span style={{ fontWeight: 800, color, fontSize: '0.82rem' }}>{pulse.score > 0 ? '+' : ''}{pulse.score}</span>
        <span>Bull +50</span>
      </div>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.2rem 0.65rem', borderRadius: 20, background: `${color}18`, border: `1px solid ${color}44`, marginBottom: '0.65rem' }}>
        <span>{pulse.trend === 'expansion' ? '📈' : pulse.trend === 'contraction' ? '📉' : '↔️'}</span>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color, textTransform: 'capitalize' }}>{pulse.trend}</span>
      </div>
      {pulse.bullish.map((f, i) => <div key={i} style={{ fontSize: '0.67rem', color: 'var(--teal)', marginBottom: 2, display: 'flex', gap: '0.3rem', lineHeight: 1.35 }}><span>↑</span><span>{f}</span></div>)}
      {pulse.bearish.map((f, i) => <div key={i} style={{ fontSize: '0.67rem', color: 'var(--rose)', marginBottom: 2, display: 'flex', gap: '0.3rem', lineHeight: 1.35 }}><span>↓</span><span>{f}</span></div>)}
    </div>
  )
}

function ScoreBar({ score, max = 100 }: { score: number; max?: number }) {
  const pct   = Math.min(100, Math.abs(score) / max * 100)
  const color = score > 20 ? '#4db66a' : score < -20 ? '#e84040' : '#c9a84c'
  return (
    <div style={{ height: 4, borderRadius: 4, background: 'var(--surface-2)', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width 0.8s ease' }} />
    </div>
  )
}

function MuhurtaCard({ event }: { event: MuhurtaEvent }) {
  const verdictColor = {
    excellent: '#4db66a', good: '#a3c65a', neutral: '#c9a84c', avoid: '#e84040',
  }[event.verdict ?? 'neutral']

  return (
    <div style={{ padding: '0.75rem', background: 'var(--surface-2)', borderRadius: 12, border: `1px solid ${verdictColor}28` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 700 }}>
          <span>{event.icon}</span>
          <span>{event.label}</span>
        </div>
        <span style={{ fontSize: '0.62rem', fontWeight: 800, color: verdictColor, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '2px 7px', background: `${verdictColor}15`, borderRadius: 20 }}>
          {event.verdict ?? 'neutral'}
        </span>
      </div>
      {event.note && (
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{event.note}</div>
      )}
    </div>
  )
}

type RightTab = 'pulse' | 'life' | 'muhurta' | 'remedies' | 'activations' | 'body'

// ─── Life Advisor sub-components ──────────────────────────────

const VERDICT_META: Record<UseCaseVerdict, { label: string; color: string; bg: string }> = {
  excellent: { label: 'Excellent', color: '#4db66a', bg: 'rgba(77,182,106,0.12)' },
  good:      { label: 'Good',      color: '#a3c65a', bg: 'rgba(163,198,90,0.12)' },
  neutral:   { label: 'Neutral',   color: '#c9a84c', bg: 'rgba(201,168,76,0.12)' },
  caution:   { label: 'Caution',   color: '#FF8C00', bg: 'rgba(255,140,0,0.12)'  },
  avoid:     { label: 'Avoid',     color: '#e84040', bg: 'rgba(232,64,64,0.12)'  },
}

function VerdictBadge({ verdict }: { verdict: UseCaseVerdict }) {
  const m = VERDICT_META[verdict]
  return (
    <span style={{
      fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.06em',
      padding: '2px 8px', borderRadius: 20,
      color: m.color, background: m.bg,
      border: `1px solid ${m.color}40`,
      textTransform: 'uppercase',
    }}>{m.label}</span>
  )
}

function ScoreRing({ score }: { score: number }) {
  const color =
    score >= 80 ? '#4db66a' :
    score >= 58 ? '#a3c65a' :
    score >= 38 ? '#c9a84c' :
    score >= 20 ? '#FF8C00' : '#e84040'
  const circ = 2 * Math.PI * 16
  const dash = (score / 100) * circ

  return (
    <svg width={40} height={40} style={{ flexShrink: 0 }}>
      <circle cx={20} cy={20} r={16} fill="none" stroke="var(--surface-3)" strokeWidth={3.5} />
      <circle
        cx={20} cy={20} r={16} fill="none"
        stroke={color} strokeWidth={3.5}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        transform="rotate(-90 20 20)"
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
      <text x={20} y={24} textAnchor="middle" fontSize={9} fontWeight={800} fill={color}>{score}</text>
    </svg>
  )
}

// ─── Main Page ────────────────────────────────────────────────

export default function SBCPage() {
  const { chart }  = useChart()
  const grid       = useMemo(() => getSBCGrid(), [])

  // State
  const [transitDate,   setTransitDate]   = useState(todayIST)
  const [transitRaw,    setTransitRaw]    = useState<SBCGrahaInput[]>([])
  const [sunLon,        setSunLon]        = useState<number | null>(null)
  const [moonLon,       setMoonLon]       = useState<number | null>(null)
  const [loading,       setLoading]       = useState(false)
  const [showTransits,  setShowTransits]  = useState(true)
  const [selectedCell,  setSelectedCell]  = useState<SBCCell | null>(null)
  const [queryName,     setQueryName]     = useState('')
  const [gridSize,      setGridSize]      = useState(600)
  const [fontScale,     setFontScale]     = useState(1.5)
  const [fontWeight,    setFontWeight]    = useState(600)
  const [rightTab,      setRightTab]      = useState<RightTab>('pulse')
  const [lifeTab,       setLifeTab]       = useState<LifeAreaKey>('wealth')
  const [isMobile,      setIsMobile]      = useState(false)
  const [showControls,  setShowControls]  = useState(false)

  // Life Advisor state
  const [advisorCat,    setAdvisorCat]    = useState('health')
  const [searchQuery,   setSearchQuery]   = useState('')
  const [expandedUC,    setExpandedUC]    = useState<string | null>(null)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1100)
    check(); window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    if (isMobile) setGridSize(Math.min(window.innerWidth - 48, 480))
    else           setGridSize(600)
  }, [isMobile])

  // Fetch transits
  const fetchTransits = useCallback(async (date: string) => {
    setLoading(true)
    try {
      const res  = await fetch(`/api/transits/planets?date=${date}&ayanamsha=lahiri`)
      const json = await res.json()
      if (json.success) {
        setTransitRaw(json.grahas)
        const su = json.grahas.find((g: any) => g.id === 'Su')
        const mo = json.grahas.find((g: any) => g.id === 'Mo')
        if (su) setSunLon(su.lonSidereal)
        if (mo) setMoonLon(mo.lonSidereal)
      }
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchTransits(transitDate) }, [transitDate, fetchTransits])

  // Derived data
  const natalGrahas = useMemo<SBCGrahaInput[]>(() => {
    if (!chart) return []
    return chart.grahas
      .filter(g => !['Ur', 'Ne', 'Pl'].includes(g.id))
      .map(g => ({ id: g.id, lonSidereal: g.lonSidereal }))
  }, [chart])

  const birthNakIdx = useMemo(() => {
    const mo = chart?.grahas.find(g => g.id === 'Mo')
    return mo ? nakFromLon(mo.lonSidereal) : undefined
  }, [chart])

  const nameNakIdx = useMemo(() => {
    if (!queryName.trim()) return undefined
    const n = nameToNakshatra(queryName.trim())
    return n !== null ? n : undefined
  }, [queryName])

  const natalOnGrid   = useMemo(() => getPlanetsOnSBC(natalGrahas, true),  [natalGrahas])
  const transitOnGrid = useMemo(() => showTransits ? getPlanetsOnSBC(transitRaw, false) : [], [transitRaw, showTransits])

  const analysis = useMemo<SBCAnalysisExtended | null>(() => {
    if (!transitRaw.length && !natalGrahas.length) return null
    return analyzeSBCExtended(
      natalGrahas,
      showTransits ? transitRaw : [],
      grid,
      birthNakIdx,
      nameNakIdx,
    )
  }, [natalGrahas, transitRaw, showTransits, grid, birthNakIdx, nameNakIdx])

  const tithi = useMemo(() => {
    if (sunLon === null || moonLon === null) return null
    return getTithiInfo(sunLon, moonLon)
  }, [sunLon, moonLon])

  const cellVedhas = useMemo(() => {
    if (!selectedCell || !analysis) return []
    return analysis.vedhas.filter(v =>
      (selectedCell.nakshatraIndex !== undefined && v.affectedNakshatras.includes(selectedCell.nakshatraIndex)) ||
      (selectedCell.rashiIndex !== undefined && v.affectedRashis.includes(selectedCell.rashiIndex))
    )
  }, [selectedCell, analysis])

  const pulse      = analysis?.financialPulse
  const pulseColor = pulse
    ? (pulse.score > 8 ? '#4db66a' : pulse.score < -8 ? '#e84040' : '#c9a84c')
    : '#888'

  const tithiColor = tithi
    ? (tithi.quality === 'best' ? '#4db66a' : tithi.quality === 'good' ? '#a3c65a' : tithi.quality === 'bad' ? '#e84040' : tithi.quality === 'special' ? '#9B59B6' : '#c9a84c')
    : '#888'

  const activeLifeArea = analysis?.lifeAreas.find(l => l.area === lifeTab)
  const birthRemedies  = analysis?.birthVedhas
    .filter(v => v.isMalefic)
    .map(v => PLANET_REMEDIES.find(r => r.planet === v.planet))
    .filter(Boolean) ?? []

  // ── Life Advisor computed data ─────────────────────────────
  const planetStatuses = useMemo(() => {
    if (!transitRaw.length || !analysis) return new Map()
    return computePlanetStatuses(transitRaw, analysis.vedhas)
  }, [transitRaw, analysis])

  const categorySummaries = useMemo(
    () => getCategorySummaries(planetStatuses),
    [planetStatuses],
  )

  const advisorResults = useMemo(() => {
    if (!planetStatuses.size) return []
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      return USE_CASES
        .filter(uc => uc.label.toLowerCase().includes(q) || uc.cat.includes(q))
        .map(uc => assessSingleUseCase(uc, planetStatuses))
        .sort((a, b) => b.score - a.score)
    }
    return assessCategory(advisorCat, planetStatuses)
  }, [advisorCat, planetStatuses, searchQuery])

  const RIGHT_TABS: Array<[RightTab, string, string]> = [
    ['pulse',       '💰', 'Pulse'],
    ['life',        '🌐', 'Life'],
    ['muhurta',     '🪔', 'Muhurta'],
    ['activations', '⚡', 'Vedha'],
    ['body',        '🫀', 'Body'],
    ['remedies',    '💊', 'Remedies'],
  ]

  // ─── Render ───────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-page)' }}>

      {/* ── Header ── */}
      <header style={{
        padding: '0 1.5rem', height: '3.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--header-bg)', borderBottom: '1px solid var(--border-soft)',
        position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(14px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Image src="/veda-icon.png" alt="Vedaansh" width={20} height={20} style={{ objectFit: 'contain' }} />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--text-gold)', fontSize: '0.9rem' }}>Vedaansh</span>
          </Link>
          <span style={{ color: 'var(--border)' }}>|</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.875rem', fontWeight: 700, color: 'var(--accent)' }}>Sarvatobhadra Chakra</span>
          {analysis?.birthNakAffected && (
            <span style={{ fontSize: '0.62rem', padding: '2px 8px', borderRadius: 20, background: 'rgba(232,64,64,0.15)', border: '1px solid rgba(232,64,64,0.35)', color: '#e84040', fontWeight: 700 }}>⚠ Birth Star Afflicted</span>
          )}
        </div>
        <nav style={{ display: 'flex', gap: '0.875rem', alignItems: 'center' }}>
          {!isMobile && <Link href="/muhurta" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', textDecoration: 'none' }}>Muhūrta</Link>}
          <ThemeToggle />
        </nav>
      </header>

      <main style={{
        flex: 1, maxWidth: 1500, width: '100%', margin: '0 auto',
        padding: isMobile ? '1rem' : 'clamp(1rem,2.5vw,1.75rem)',
        display: 'flex', flexDirection: 'column', gap: '1.25rem',
      }}>

        {/* ── Page title + tithi strip ── */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: '0.75rem' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: isMobile ? '1.4rem' : 'clamp(1.2rem,2.8vw,1.65rem)', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Sarvatobhadra Chakra
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontStyle: 'italic', margin: '3px 0 0' }}>
              Classical 9×9 Vedic grid — Transit Vedha · Life Areas · Muhurta Intelligence
            </p>
          </div>

          {/* Tithi & Date strip */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {tithi && (
              <div style={{ padding: '0.35rem 0.875rem', borderRadius: 20, background: `${tithiColor}15`, border: `1px solid ${tithiColor}35`, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 900, color: tithiColor }}>{tithi.name}</span>
                <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>·</span>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{tithi.paksha === 'shukla' ? '☽ Shukla' : '🌑 Krishna'} Paksha</span>
                <span style={{ fontSize: '0.6rem', padding: '1px 6px', borderRadius: 10, background: `${tithiColor}20`, color: tithiColor, fontWeight: 700 }}>{tithi.quality}</span>
              </div>
            )}
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{fmtDate(transitDate)}</div>
          </div>
        </div>

        {/* ── Three-column layout ── */}
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1.25rem', alignItems: 'start' }}>

          {/* ── LEFT PANEL ── */}
          <div style={{ width: isMobile ? '100%' : 255, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

            {/* Transit date */}
            <div className="card" style={{ padding: '1rem' }}>
              <div className="label-caps" style={{ marginBottom: '0.65rem' }}>📅 Transit Date</div>
              <input
                type="date" className="input"
                value={transitDate} max={todayIST()}
                onChange={e => setTransitDate(e.target.value)}
                style={{ marginBottom: '0.4rem' }}
              />
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button onClick={() => setTransitDate(todayIST())} className="btn btn-ghost" style={{ flex: 1, fontSize: '0.72rem' }}>↺ Today</button>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={showTransits} onChange={e => setShowTransits(e.target.checked)} />
                  Transits
                </label>
              </div>
            </div>

            {/* Birth nakshatra + Name input */}
            <div className="card" style={{ padding: '1rem' }}>
              <div className="label-caps" style={{ marginBottom: '0.65rem' }}>⭐ Birth & Name Star</div>

              {birthNakIdx !== undefined ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.65rem', borderRadius: 10, background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.25)', marginBottom: '0.65rem' }}>
                  <span style={{ fontSize: '1rem' }}>⭐</span>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--gold)' }}>{NAKSHATRA_NAMES[birthNakIdx]}</div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Moon&apos;s Janma Nakshatra</div>
                  </div>
                  {analysis?.birthNakAffected && <span style={{ marginLeft: 'auto', fontSize: '0.8rem' }}>⚠️</span>}
                </div>
              ) : (
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.65rem', fontStyle: 'italic' }}>Load a chart to see birth star</div>
              )}

              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Name / Query (first syllable)</div>
              <input
                type="text"
                value={queryName}
                onChange={e => setQueryName(e.target.value)}
                placeholder="e.g. Priya, Ravi, Anand…"
                className="input"
                style={{ fontSize: '0.82rem', marginBottom: '0.4rem' }}
              />
              {queryName && nameNakIdx !== undefined && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.65rem', borderRadius: 8, background: 'rgba(135,206,250,0.08)', border: '1px solid rgba(135,206,250,0.25)', fontSize: '0.75rem' }}>
                  <span>🔤</span>
                  <span style={{ fontWeight: 700, color: 'rgba(135,206,250,0.9)' }}>{NAKSHATRA_NAMES[nameNakIdx]}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.62rem' }}>Name Star</span>
                  {analysis?.nameNakAffected && <span style={{ marginLeft: 'auto' }}>⚠️</span>}
                </div>
              )}
              {queryName && nameNakIdx === undefined && (
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Syllable not matched — try 2–3 letters</div>
              )}
            </div>

            {/* Natal positions */}
            {chart ? (
              <div className="card" style={{ padding: '1rem' }}>
                <div className="label-caps" style={{ marginBottom: '0.6rem' }}>● Natal — {chart.meta.name}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {chart.grahas.filter(g => !['Ur', 'Ne', 'Pl'].includes(g.id)).map(g => {
                    const nak = nakFromLon(g.lonSidereal)
                    const isAff = analysis?.vedhas.some(v => v.isMalefic && v.affectedNakshatras.includes(nak))
                    return (
                      <div key={g.id} onClick={() => { const [r, c] = SBC_NAK_POS[nak]; setSelectedCell(grid[r][c]) }}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', cursor: 'pointer', padding: '0.2rem 0.3rem', borderRadius: 6, transition: 'background 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-2)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                      >
                        <div style={{ width: 13, height: 13, borderRadius: '50%', background: PLANET_COLOR[g.id] ?? '#888', border: '1.5px solid rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.5rem', color: '#fff', fontWeight: 700 }}>
                          {PLANET_SYMBOL[g.id]}
                        </div>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{g.name}</span>
                        <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '0.64rem' }}>{NAKSHATRA_NAMES[nak]?.split(' ')[0]}</span>
                        {isAff && <span style={{ color: '#e84040', fontSize: '0.65rem' }}>⚠</span>}
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="card" style={{ padding: '1rem', textAlign: 'center', border: '1px dashed var(--border)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Load a chart to see natal positions</div>
              </div>
            )}

            {/* Grid controls — collapsible */}
            <div className="card" style={{ padding: '0.875rem' }}>
              <button
                onClick={() => setShowControls(s => !s)}
                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}
              >
                <span>⚙ Grid Appearance</span>
                <span>{showControls ? '▲' : '▼'}</span>
              </button>

              {showControls && (
                <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <div>
                    <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Size: {gridSize}px</div>
                    <input type="range" min="300" max="760" value={gridSize} onChange={e => setGridSize(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--gold)' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Text scale: {fontScale.toFixed(1)}×</div>
                    <input type="range" min="0.5" max="2.0" step="0.1" value={fontScale} onChange={e => setFontScale(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--gold)' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '0.3rem' }}>
                    {[400, 600, 800].map(w => (
                      <button key={w} onClick={() => setFontWeight(w)} style={{ flex: 1, padding: '0.2rem', fontSize: '0.6rem', borderRadius: 4, border: '1px solid var(--border-soft)', background: fontWeight === w ? 'var(--gold-faint)' : 'transparent', color: fontWeight === w ? 'var(--gold)' : 'var(--text-secondary)' }}>{w}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Cell type legend */}
            {!isMobile && (
              <div className="card" style={{ padding: '0.875rem' }}>
                <div className="label-caps" style={{ marginBottom: '0.6rem' }}>Cell Types</div>
                {[
                  { bg: 'rgba(55,42,130,0.80)',  label: 'Nakshatra (27 Stars)' },
                  { bg: 'rgba(110,78,20,0.80)',  label: 'Rashi (12 Signs)' },
                  { bg: 'rgba(60,30,110,0.80)',  label: 'Vara (Weekday Lord)' },
                  { bg: 'rgba(18,70,88,0.80)',   label: 'Sanskrit Vowel' },
                  { bg: 'rgba(28,28,45,0.80)',   label: 'Consonant' },
                  { bg: 'rgba(120,88,15,0.80)',  label: 'Center (The Native)' },
                ].map(({ bg, label }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.28rem' }}>
                    <div style={{ width: 11, height: 11, borderRadius: 2, background: bg, border: '1px solid rgba(255,255,255,0.1)' }} />
                    <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>{label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── CENTER COLUMN ── */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>

            {loading && (
              <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span> Loading transits…
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
              </div>
            )}

            {/* Grid */}
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
              <SarvatobhadraChakra
                grid={grid}
                natalPlanets={natalOnGrid}
                transitPlanets={transitOnGrid}
                onCellClick={setSelectedCell}
                size={gridSize}
                fontScale={fontScale}
                fontWeight={fontWeight}
                birthNakshatraIndex={birthNakIdx}
                nameNakshatraIndex={nameNakIdx}
                showDiagonalVedha={true}
              />
            </div>

            {/* Selected cell detail */}
            {selectedCell && (
              <div className="card fade-up" style={{ width: '100%', padding: '1.25rem', border: '1px solid var(--gold)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>
                      {selectedCell.label} {selectedCell.sublabel ? `(${selectedCell.sublabel})` : ''}
                    </h3>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 3, letterSpacing: '0.05em' }}>
                      {selectedCell.type} {selectedCell.bodyPart ? `· Body: ${selectedCell.bodyPart}` : ''}
                    </div>
                  </div>
                  <button onClick={() => setSelectedCell(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: 'var(--text-muted)' }}>✕</button>
                </div>

                {/* Planets present */}
                {(() => {
                  const k = `${selectedCell.row},${selectedCell.col}`
                  const n = natalOnGrid.filter(p => `${p.row},${p.col}` === k)
                  const t = transitOnGrid.filter(p => `${p.row},${p.col}` === k)
                  return (n.length || t.length) ? (
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                      {n.map(p => (
                        <span key={`n-${p.planet}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', padding: '0.2rem 0.6rem', background: 'rgba(255,215,0,0.1)', border: '1px solid var(--gold)', borderRadius: 20 }}>
                          <span style={{ color: PLANET_COLOR[p.planet as GrahaId] }}>{PLANET_SYMBOL[p.planet as GrahaId]}</span>
                          <span style={{ color: 'var(--text-gold)', fontWeight: 700 }}>Natal {PLANET_NAME[p.planet]}</span>
                        </span>
                      ))}
                      {t.map(p => (
                        <span key={`t-${p.planet}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', padding: '0.2rem 0.6rem', background: 'rgba(139,124,246,0.1)', border: '1px dashed var(--accent)', borderRadius: 20 }}>
                          <span style={{ color: PLANET_COLOR[p.planet as GrahaId] }}>{PLANET_SYMBOL[p.planet as GrahaId]}</span>
                          <span style={{ color: 'var(--accent)', fontWeight: 700 }}>Transit {PLANET_NAME[p.planet]}</span>
                        </span>
                      ))}
                    </div>
                  ) : null
                })()}

                {/* Vedha influx */}
                {cellVedhas.length > 0 && (
                  <div>
                    <div className="label-caps" style={{ fontSize: '0.58rem', marginBottom: '0.4rem' }}>Vedha Influx on This Cell</div>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0.4rem' }}>
                      {cellVedhas.map((v, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.6rem', background: 'var(--surface-3)', borderRadius: 8, border: `1px solid ${v.isMalefic ? 'rgba(232,64,64,0.18)' : 'rgba(77,182,106,0.18)'}` }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: PLANET_COLOR[v.planet as GrahaId] ?? '#888' }} />
                          <span style={{ fontWeight: 700, color: v.isMalefic ? 'var(--rose)' : 'var(--teal)', fontSize: '0.73rem' }}>{PLANET_NAME[v.planet]}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.6rem' }}>{v.isMalefic ? 'Malefic Vedha' : 'Benefic Vedha'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Transit position table */}
            {transitRaw.length > 0 && (
              <div className="card" style={{ width: '100%', padding: '1.1rem' }}>
                <div className="label-caps" style={{ marginBottom: '0.6rem' }}>Transit Planets — {fmtDate(transitDate)}</div>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: '0.5rem' }}>
                  {(transitRaw as any[]).map((g: any) => {
                    const nak   = nakFromLon(g.lonSidereal)
                    const isAff = analysis?.vedhas.find(v => v.planet === g.id)?.isMalefic
                    return (
                      <div
                        key={g.id}
                        onClick={() => { const [r, c] = SBC_NAK_POS[nak]; setSelectedCell(grid[r][c]) }}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.72rem', padding: '0.5rem 0.6rem', background: 'var(--surface-2)', border: `1px solid ${isAff ? 'rgba(232,64,64,0.25)' : 'var(--border-soft)'}`, borderRadius: 8, cursor: 'pointer' }}
                      >
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: PLANET_COLOR[g.id as GrahaId], flexShrink: 0 }} />
                        <span style={{ color: 'var(--text-gold)', fontWeight: 800 }}>{g.id}</span>
                        <span style={{ color: 'var(--text-muted)', flex: 1 }}>{NAKSHATRA_NAMES[nak]?.split(' ')[0]}</span>
                        {g.isRetro && <span style={{ fontSize: '0.58rem', color: 'var(--accent)', fontWeight: 700 }}>℞</span>}
                        {isAff && <span style={{ fontSize: '0.6rem', color: '#e84040' }}>⚠</span>}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT PANEL ── */}
          <div style={{ width: isMobile ? '100%' : 275, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

            {/* Tab selector */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3, background: 'var(--surface-2)', padding: 3, borderRadius: 12 }}>
              {RIGHT_TABS.map(([id, icon, label]) => (
                <button
                  key={id}
                  onClick={() => setRightTab(id)}
                  style={{
                    padding: '6px 4px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.62rem', fontWeight: 700,
                    background: rightTab === id ? 'var(--surface-0)' : 'transparent',
                    color: rightTab === id ? 'var(--text-primary)' : 'var(--text-muted)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                    boxShadow: rightTab === id ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  <span style={{ fontSize: '0.9rem' }}>{icon}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {/* Tab: Financial Pulse */}
            {rightTab === 'pulse' && (
              <div className="card" style={{ padding: '1.1rem', border: pulse ? `1px solid ${pulseColor}38` : '1px solid var(--border)' }}>
                <div className="label-caps" style={{ marginBottom: '0.875rem' }}>💰 Financial Pulse</div>
                {pulse ? <PulseMeter pulse={pulse} /> : <div style={{ opacity: 0.5, fontSize: '0.8rem' }}>Calculation pending…</div>}
              </div>
            )}

            {/* Tab: Life Areas */}
            {rightTab === 'life' && (
              <div className="card" style={{ padding: '1.1rem' }}>
                <div className="label-caps" style={{ marginBottom: '0.75rem' }}>🌐 Life Area Analysis</div>

                {/* Life area tabs */}
                <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                  {(analysis?.lifeAreas ?? []).map(la => {
                    const color = la.score > 20 ? '#4db66a' : la.score < -20 ? '#e84040' : '#c9a84c'
                    return (
                      <button
                        key={la.area}
                        onClick={() => setLifeTab(la.area)}
                        style={{ padding: '4px 8px', borderRadius: 8, fontSize: '0.62rem', fontWeight: 700, border: `1px solid ${lifeTab === la.area ? color : 'var(--border)'}`, background: lifeTab === la.area ? `${color}15` : 'transparent', color: lifeTab === la.area ? color : 'var(--text-muted)', cursor: 'pointer', display: 'flex', gap: 4, alignItems: 'center' }}
                      >
                        <span>{la.icon}</span><span>{la.area.charAt(0).toUpperCase() + la.area.slice(1)}</span>
                      </button>
                    )
                  })}
                </div>

                {activeLifeArea && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <div style={{ fontWeight: 800, fontSize: '0.88rem' }}>{activeLifeArea.label}</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 900, color: activeLifeArea.score > 20 ? '#4db66a' : activeLifeArea.score < -20 ? '#e84040' : '#c9a84c', fontFamily: 'var(--font-mono)' }}>
                        {activeLifeArea.score > 0 ? '+' : ''}{activeLifeArea.score}
                      </div>
                    </div>
                    <ScoreBar score={activeLifeArea.score} />
                    <div style={{ marginTop: '0.65rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      {activeLifeArea.positive.map((p, i) => (
                        <div key={i} style={{ fontSize: '0.67rem', color: 'var(--teal)', display: 'flex', gap: '0.3rem', lineHeight: 1.35 }}><span style={{ flexShrink: 0 }}>✓</span><span>{p}</span></div>
                      ))}
                      {activeLifeArea.negative.map((n, i) => (
                        <div key={i} style={{ fontSize: '0.67rem', color: 'var(--rose)', display: 'flex', gap: '0.3rem', lineHeight: 1.35 }}><span style={{ flexShrink: 0 }}>✗</span><span>{n}</span></div>
                      ))}
                      {!activeLifeArea.positive.length && !activeLifeArea.negative.length && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No significant planetary influences on {activeLifeArea.label} currently.</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Muhurta */}
            {rightTab === 'muhurta' && (
              <div className="card" style={{ padding: '1.1rem' }}>
                <div className="label-caps" style={{ marginBottom: '0.875rem' }}>🪔 Muhurta Guide — {fmtDate(transitDate).split(',').slice(0, 1)}</div>
                {tithi && (
                  <div style={{ marginBottom: '0.75rem', padding: '0.5rem 0.75rem', borderRadius: 10, background: `${tithiColor}10`, border: `1px solid ${tithiColor}30`, fontSize: '0.72rem' }}>
                    <span style={{ fontWeight: 700, color: tithiColor }}>{tithi.name} ({tithi.type})</span>
                    <span style={{ color: 'var(--text-muted)' }}> — </span>
                    <span style={{ color: tithiColor, fontWeight: 600 }}>
                      {tithi.quality === 'best' ? '⭐ Most Auspicious' : tithi.quality === 'good' ? '✓ Favorable' : tithi.quality === 'bad' ? '✗ Avoid major events' : tithi.quality === 'special' ? '🌑 Amavasya — Ancestor rites' : 'Mixed'}
                    </span>
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {(analysis?.muhurta ?? []).map((ev, i) => <MuhurtaCard key={i} event={ev} />)}
                </div>
              </div>
            )}

            {/* Tab: Vedha Activations */}
            {rightTab === 'activations' && (
              <div className="card" style={{ padding: '1.1rem' }}>
                <div className="label-caps" style={{ marginBottom: '0.75rem' }}>⚡ Natal Activations via Vedha</div>
                {analysis?.activations?.length ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                    {analysis.activations.slice(0, 10).map((a, i) => (
                      <div key={i} style={{ fontSize: '0.68rem', borderLeft: `2px solid ${a.type === 'shubha' ? 'var(--teal)' : 'var(--rose)'}`, paddingLeft: '0.55rem' }}>
                        <div style={{ fontWeight: 800, color: a.type === 'shubha' ? 'var(--teal)' : 'var(--rose)', marginBottom: 1 }}>
                          {a.transitPlanet} → {a.natalPlanet} ({a.nakshatraName.split(' ')[0]})
                        </div>
                        <div style={{ color: 'var(--text-muted)', lineHeight: 1.35 }}>{a.meaning.slice(0, 120)}</div>
                      </div>
                    ))}
                  </div>
                ) : <div style={{ fontSize: '0.8rem', opacity: 0.5 }}>No active natal activations</div>}
              </div>
            )}

            {/* Tab: Body Alerts */}
            {rightTab === 'body' && (
              <div className="card" style={{ padding: '1.1rem' }}>
                <div className="label-caps" style={{ color: 'var(--rose)', marginBottom: '0.75rem' }}>🫀 Body-Part Afflictions</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.65rem', lineHeight: 1.4 }}>
                  Malefic planets cast vedha on body-part cells (Sanskrit letter squares). Take preventive care for these areas.
                </div>
                {(analysis?.bodyPartsAlerted?.length ?? 0) > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {analysis!.bodyPartsAlerted.map((b, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem', padding: '0.3rem 0.5rem', background: 'var(--surface-2)', borderRadius: 7, border: '1px solid rgba(232,64,64,0.12)' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: PLANET_COLOR[b.by], flexShrink: 0 }} />
                        <span style={{ color: 'var(--text-secondary)', flex: 1 }}>{b.part}</span>
                        <span style={{ color: '#e84040', fontSize: '0.62rem', fontWeight: 700 }}>{PLANET_NAME[b.by]}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.8rem', opacity: 0.5, textAlign: 'center', padding: '1rem' }}>No significant body-part afflictions</div>
                )}
              </div>
            )}

            {/* Tab: Remedies */}
            {rightTab === 'remedies' && (
              <div className="card" style={{ padding: '1.1rem' }}>
                <div className="label-caps" style={{ marginBottom: '0.75rem' }}>💊 Vedic Remedies</div>

                {birthRemedies.length > 0 && (
                  <div style={{ padding: '0.5rem 0.75rem', background: 'rgba(232,64,64,0.06)', border: '1px solid rgba(232,64,64,0.2)', borderRadius: 10, marginBottom: '0.75rem', fontSize: '0.68rem', color: 'var(--rose)' }}>
                    ⚠ Your birth star is afflicted. Priority remedies below.
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {(birthRemedies.length > 0
                    ? birthRemedies
                    : analysis?.vedhas.filter(v => v.isMalefic).slice(0, 4).map(v => PLANET_REMEDIES.find(r => r.planet === v.planet)).filter(Boolean)
                  )?.map((rem: any, i: number) => rem && (
                    <div key={i} style={{ padding: '0.75rem', background: 'var(--surface-2)', borderRadius: 12, border: `1px solid ${rem.color}20` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: rem.color }} />
                        <span style={{ fontWeight: 800, fontSize: '0.82rem', color: rem.color }}>{rem.name}</span>
                        <span style={{ marginLeft: 'auto', fontSize: '0.6rem', color: 'var(--text-muted)' }}>{rem.day} · {rem.deity}</span>
                      </div>
                      <div style={{ fontSize: '0.67rem', color: 'var(--text-secondary)', lineHeight: 1.45, marginBottom: '0.4rem' }}>{rem.remedy}</div>
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.4 }}>{rem.mantra}</div>
                      <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem' }}>
                        <span style={{ fontSize: '0.6rem', padding: '2px 7px', borderRadius: 20, background: `${rem.color}12`, border: `1px solid ${rem.color}30`, color: rem.color, fontWeight: 700 }}>{rem.stone}</span>
                      </div>
                    </div>
                  ))}

                  {!birthRemedies.length && !analysis?.vedhas.some(v => v.isMalefic) && (
                    <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>✨</div>
                      No malefic vedha detected — day is relatively clear.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Reading guide */}
            <div className="card" style={{ padding: '0.875rem', background: 'rgba(139,124,246,0.04)', border: '1px solid rgba(139,124,246,0.12)' }}>
              <div className="label-caps" style={{ marginBottom: '0.4rem', color: 'var(--accent)', fontSize: '0.58rem' }}>How to Read</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                Hover cells to reveal <b>Vedha lines</b>. <b>⭐ Gold border</b> = your birth star. <b>✦ symbol</b> on a cell = diagonal-aspect planet present. Pink highlight = malefic pressure on natal position.
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* ═══════════════════════════════════════════════════════
           LIFE ADVISOR — Full-width section below the grid
          ═══════════════════════════════════════════════════════ */}
      <section style={{
        maxWidth: 1500, width: '100%', margin: '0 auto',
        padding: isMobile ? '1rem' : 'clamp(1rem,2.5vw,1.75rem)',
        paddingTop: 0,
      }}>
        <div className="card" style={{ padding: '1.5rem', borderTop: '3px solid var(--gold-faint)' }}>

          {/* Section header */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.3rem' }}>🔮</span>
                <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Life Advisor
                </h2>
                <span style={{ fontSize: '0.62rem', padding: '2px 8px', borderRadius: 20, background: 'var(--gold-faint)', color: 'var(--text-gold)', fontWeight: 700 }}>
                  200+ Use Cases
                </span>
              </div>
              <p style={{ margin: '3px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Muhurta assessment · Prashna Q&A · Category predictions — all driven by today&apos;s transit vedha
              </p>
            </div>

            {/* Search */}
            <div style={{ position: 'relative', minWidth: 220 }}>
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.85rem', pointerEvents: 'none' }}>🔍</span>
              <input
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setAdvisorCat('') }}
                placeholder="Search use case…"
                className="input"
                style={{ paddingLeft: '2rem', fontSize: '0.8rem', width: '100%' }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.9rem' }}>×</button>
              )}
            </div>
          </div>

          {/* Category tabs */}
          {!searchQuery && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: '1.25rem' }}>
              {categorySummaries.map(cs => {
                const isActive = advisorCat === cs.cat.id
                const color    = cs.cat.color
                const pct      = Math.round((cs.excellent + cs.good) / Math.max(1, cs.total) * 100)
                return (
                  <button
                    key={cs.cat.id}
                    onClick={() => { setAdvisorCat(cs.cat.id); setExpandedUC(null) }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.3rem',
                      padding: '0.35rem 0.75rem', borderRadius: 20, border: 'none', cursor: 'pointer',
                      background: isActive ? color : 'var(--surface-2)',
                      color: isActive ? '#fff' : 'var(--text-secondary)',
                      fontWeight: isActive ? 800 : 600, fontSize: '0.72rem',
                      transition: 'all 0.2s',
                      outline: isActive ? `2px solid ${color}` : 'none',
                      outlineOffset: 2,
                      boxShadow: isActive ? `0 2px 12px ${color}40` : 'none',
                    }}
                  >
                    <span>{cs.cat.icon}</span>
                    <span>{cs.cat.label}</span>
                    <span style={{
                      fontSize: '0.58rem', fontWeight: 800,
                      padding: '1px 5px', borderRadius: 10,
                      background: isActive ? 'rgba(255,255,255,0.25)' : (pct >= 60 ? 'rgba(77,182,106,0.18)' : pct >= 35 ? 'rgba(201,168,76,0.18)' : 'rgba(232,64,64,0.18)'),
                      color: isActive ? '#fff' : (pct >= 60 ? '#4db66a' : pct >= 35 ? '#c9a84c' : '#e84040'),
                    }}>{pct}%</span>
                  </button>
                )
              })}
            </div>
          )}

          {/* Category summary strip */}
          {!searchQuery && (() => {
            const cs = categorySummaries.find(s => s.cat.id === advisorCat)
            if (!cs) return null
            const color = cs.cat.color
            return (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
                padding: '0.65rem 1rem', borderRadius: 12, marginBottom: '1.1rem',
                background: `${color}10`, border: `1px solid ${color}30`,
              }}>
                <span style={{ fontSize: '1.4rem' }}>{cs.cat.icon}</span>
                <span style={{ fontWeight: 800, fontSize: '0.9rem', color }}>{cs.cat.label}</span>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  <span><b style={{ color: '#4db66a' }}>{cs.excellent}</b> Excellent</span>
                  <span><b style={{ color: '#a3c65a' }}>{cs.good}</b> Good</span>
                  <span><b style={{ color: '#e84040' }}>{cs.avoid}</b> Avoid</span>
                  <span style={{ color: 'var(--text-muted)' }}>of {cs.total} use cases</span>
                </div>
                <div style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Avg score: <b style={{ color }}>{cs.score}</b>/100
                </div>
              </div>
            )
          })()}

          {/* No transit data fallback */}
          {!planetStatuses.size && (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
              Transit data loading… Life Advisor activates once planetary positions are fetched.
            </div>
          )}

          {/* Use-case cards grid */}
          {planetStatuses.size > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? 280 : 320}px, 1fr))`,
              gap: '0.75rem',
            }}>
              {advisorResults.map(r => {
                const vm        = VERDICT_META[r.verdict]
                const isExpanded = expandedUC === r.id

                return (
                  <div
                    key={r.id}
                    onClick={() => setExpandedUC(isExpanded ? null : r.id)}
                    style={{
                      padding: '0.875rem', borderRadius: 14, cursor: 'pointer',
                      background: 'var(--surface-1)', border: `1px solid ${vm.color}30`,
                      transition: 'all 0.2s',
                      boxShadow: isExpanded ? `0 4px 20px ${vm.color}30` : 'none',
                    }}
                  >
                    {/* Card header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <ScoreRing score={r.score} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: 3 }}>
                          {r.label}
                        </div>
                        <VerdictBadge verdict={r.verdict} />
                      </div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'none' }}>▾</span>
                    </div>

                    {/* Positive / negative count pills */}
                    <div style={{ display: 'flex', gap: 6, marginTop: '0.55rem' }}>
                      {r.positiveCount > 0 && (
                        <span style={{ fontSize: '0.6rem', padding: '1px 7px', borderRadius: 10, background: 'rgba(77,182,106,0.14)', color: '#4db66a', fontWeight: 700 }}>
                          ✓ {r.positiveCount} supportive
                        </span>
                      )}
                      {r.afflictedCount > 0 && (
                        <span style={{ fontSize: '0.6rem', padding: '1px 7px', borderRadius: 10, background: 'rgba(232,64,64,0.14)', color: '#e84040', fontWeight: 700 }}>
                          ✗ {r.afflictedCount} afflicted
                        </span>
                      )}
                    </div>

                    {/* Classical note */}
                    {r.note && (
                      <div style={{ marginTop: '0.4rem', fontSize: '0.62rem', color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.4 }}>
                        {r.note}
                      </div>
                    )}

                    {/* Expanded: detailed reasons */}
                    {isExpanded && (
                      <div style={{
                        marginTop: '0.75rem', padding: '0.75rem', borderRadius: 10,
                        background: 'var(--surface-2)', border: `1px solid ${vm.color}20`,
                      }}>
                        <div style={{ fontWeight: 700, fontSize: '0.7rem', color: vm.color, marginBottom: '0.5rem', letterSpacing: '0.04em' }}>
                          PLANETARY ANALYSIS
                        </div>
                        {r.reasons.map((reason, i) => (
                          <div key={i} style={{
                            display: 'flex', gap: '0.4rem', fontSize: '0.68rem',
                            color: reason.startsWith('✓') ? '#4db66a' : reason.startsWith('✗') ? '#e84040' : '#FF8C00',
                            lineHeight: 1.4, marginBottom: 3,
                          }}>
                            <span style={{ flexShrink: 0 }}>{reason.slice(0, 1)}</span>
                            <span style={{ color: 'var(--text-secondary)' }}>{reason.slice(2)}</span>
                          </div>
                        ))}
                        <div style={{
                          marginTop: '0.65rem', paddingTop: '0.5rem',
                          borderTop: '1px solid var(--border-soft)',
                          fontSize: '0.62rem', color: 'var(--text-muted)', lineHeight: 1.45,
                        }}>
                          <b style={{ color: 'var(--text-secondary)' }}>Classical rule:</b> {r.note}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Search results info */}
          {searchQuery && advisorResults.length > 0 && (
            <div style={{ marginTop: '1rem', fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              Showing {advisorResults.length} results for &quot;<b style={{ color: 'var(--text-primary)' }}>{searchQuery}</b>&quot;
            </div>
          )}
          {searchQuery && advisorResults.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>🔍</div>
              No use cases found for &quot;{searchQuery}&quot;
            </div>
          )}

          {/* Footer legend */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1.25rem',
            paddingTop: '1rem', borderTop: '1px solid var(--border-soft)',
            fontSize: '0.65rem', color: 'var(--text-muted)', alignItems: 'center',
          }}>
            <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>Verdict key:</span>
            {(Object.entries(VERDICT_META) as [UseCaseVerdict, typeof VERDICT_META[UseCaseVerdict]][]).map(([k, v]) => (
              <span key={k} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: v.color, display: 'inline-block' }} />
                <span style={{ color: v.color, fontWeight: 700 }}>{v.label}</span>
              </span>
            ))}
            <span style={{ marginLeft: 'auto', fontStyle: 'italic' }}>Based on transit vedha for {fmtDate(transitDate)}</span>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
           ADVANCED ANALYSIS ENGINE — Full-width section
          ═══════════════════════════════════════════════════════ */}
      <section style={{
        maxWidth: 1500, width: '100%', margin: '0 auto',
        padding: isMobile ? '1rem' : 'clamp(1rem,2.5vw,1.75rem)',
        paddingTop: 0,
      }}>
        <SBCAdvancedPanel
          grid={grid}
          transitRaw={transitRaw as any}
          natalGrahas={natalGrahas as any}
          analysis={analysis}
          tithi={tithi}
          transitDate={transitDate}
          isMobile={isMobile}
        />
      </section>

      {/* ═══════════════════════════════════════════════════════
           STOCK MARKET & TRADING — Full-width section
          ═══════════════════════════════════════════════════════ */}
      <section style={{
        maxWidth: 1500, width: '100%', margin: '0 auto',
        padding: isMobile ? '1rem' : 'clamp(1rem,2.5vw,1.75rem)',
        paddingTop: 0,
      }}>
        <SBCStockPanel
          pulse={pulse ?? null}
          tithi={tithi}
          transitDate={transitDate}
          transitRaw={transitRaw as any}
          analysis={analysis ?? null}
        />
      </section>

      <footer style={{ padding: '1.25rem', textAlign: 'center', opacity: 0.45, fontSize: '0.72rem', borderTop: '1px solid var(--border-soft)' }}>
        Sarvatobhadra Chakra · Classical Vedic Analysis · <span style={{ color: 'var(--text-gold)' }}>Vedaansh Platform</span>
      </footer>
    </div>
  )
}
