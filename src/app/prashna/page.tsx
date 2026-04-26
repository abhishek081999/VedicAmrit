'use client'
/**
 * src/app/prashna/page.tsx
 * Advanced Krishneeyam Horary Astrology Dashboard
 * Based on "Krishneeyam" by Sri Krishna Acharya (~11th c. AD)
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { LocationPicker, getSavedLocation, type LocationValue } from '@/components/ui/LocationPicker'
import type { ChartOutput, ChartStyle } from '@/types/astrology'
import { ChakraSelector } from '@/components/chakra/ChakraSelector'
import { getKPSubLord } from '@/lib/engine/nakshatraAdvanced'
import {
  runKrishneeyamPrashna,
  RASHI_NAMES,
  SIGN_LORDS,
  type PrashnaCategory,
  type KrishneeyamResult,
} from '@/lib/engine/krishneeyam'

type KPMode = 'vedic' | 'kp' | 'krishneeyam'

const CATEGORY_LABELS: Record<PrashnaCategory, string> = {
  yes_no: 'Yes / No', when: 'When', what: 'What', who: 'Who (Thief)',
  lost_article: 'Lost Article', health: 'Health', travel: 'Traveller',
  pregnancy: 'Pregnancy', marriage: 'Marriage', house_query: 'House',
  spirit: 'Spirit / Baadha', intercourse: 'Intercourse', food: 'Food',
  lawsuit: 'Lawsuit', exam: 'Exam / Election', general: 'General',
}

const CATEGORY_ICONS: Record<PrashnaCategory, string> = {
  yes_no: '⚖️', when: '⏰', what: '🔍', who: '🕵️', lost_article: '💎',
  health: '🏥', travel: '✈️', pregnancy: '👶', marriage: '💍',
  house_query: '🏠', spirit: '👁️', intercourse: '🌹', food: '🍽️',
  lawsuit: '⚖️', exam: '🎓', general: '🌟',
}

const RASHI_OPTIONS = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `${i + 1}. ${RASHI_NAMES[i + 1]}` }))

const BODY_PARTS = [
  { value: '', label: '— Not specified —' },
  { value: 'chest', label: 'Chest ✅' }, { value: 'hair', label: 'Hair ✅' },
  { value: 'nail', label: 'Nails ✅' }, { value: 'teeth', label: 'Teeth ✅' },
  { value: 'armpit', label: 'Armpit ✅' }, { value: 'breast', label: 'Breast ✅' },
  { value: 'hand', label: 'Hand / Palm ✅' }, { value: 'navel', label: 'Navel ✅' },
  { value: 'thigh', label: 'Thigh ✅' }, { value: 'head', label: 'Head ✅' },
  { value: 'foot', label: 'Foot ✅' }, { value: 'back_neck', label: 'Back of neck ⚠️' },
  { value: 'eyebrow', label: 'Eyebrow ⚠️' }, { value: 'nose', label: 'Nose ⚠️' },
  { value: 'finger', label: 'Finger ⚠️' }, { value: 'ankle', label: 'Ankle ⚠️' },
  { value: 'face', label: 'Face ❌' }, { value: 'knee', label: 'Knee ❌' },
  { value: 'belly', label: 'Belly ❌' }, { value: 'forehead', label: 'Forehead ❌' },
]

// ─── Small reusable UI pieces ─────────────────────────────────────────────────

const Chip = ({ label, value, color = 'var(--text-gold)', bg = 'var(--surface-2)' }: { label: string; value: string; color?: string; bg?: string }) => (
  <div style={{ background: bg, borderRadius: 6, padding: '0.35rem 0.65rem', border: '1px solid var(--border-soft)', minWidth: 0 }}>
    <div style={{ fontSize: '0.57rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{label}</div>
    <div style={{ fontSize: '0.8rem', fontWeight: 700, color, lineHeight: 1.2, wordBreak: 'break-word' }}>{value}</div>
  </div>
)

const SectionCard = ({ title, icon, accent = 'var(--gold)', children }: { title: string; icon: string; accent?: string; children: React.ReactNode }) => (
  <div style={{ background: 'var(--surface-1)', borderRadius: 10, border: `1px solid var(--border-soft)`, borderLeft: `3px solid ${accent}`, overflow: 'hidden' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.55rem 0.9rem', borderBottom: '1px solid var(--border-soft)', background: 'var(--surface-2)' }}>
      <span style={{ fontSize: '1rem' }}>{icon}</span>
      <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: accent }}>{title}</span>
    </div>
    <div style={{ padding: '0.75rem' }}>{children}</div>
  </div>
)


const BulletList = ({ items }: { items: string[] }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
    {items.map((item, i) => (
      <div key={i} style={{ display: 'flex', gap: '0.4rem', fontSize: '0.73rem', lineHeight: 1.5 }}>
        <span style={{ color: 'var(--gold)', flexShrink: 0, marginTop: 2 }}>◆</span>
        <span style={{ color: 'var(--text-secondary)' }}>{item}</span>
      </div>
    ))}
  </div>
)

const IndicatorRow = ({ label, value, ok }: { label: string; value: string; ok: boolean | null }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0', borderBottom: '1px solid var(--border-soft)', gap: '0.5rem' }}>
    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', flexShrink: 0 }}>{label}</span>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
      {ok !== null && <span style={{ fontSize: '0.75rem' }}>{ok ? '✅' : '❌'}</span>}
      <span style={{ fontSize: '0.73rem', fontWeight: 600, color: ok === true ? 'var(--teal)' : ok === false ? 'var(--rose)' : 'var(--gold)', textAlign: 'right' }}>{value}</span>
    </div>
  </div>
)

// ─── Nakshatra Dial ──────────────────────────────────────────────────────────
const NAK_NAMES = ['Ash','Bha','Kri','Roh','Mri','Ard','Pun','Pus','Ash','Mag','PP','UP','Has','Chi','Swa','Vis','Anu','Jye','Mul','PAs','UAs','Sra','Dha','Sha','PBh','UBh','Rev']
const NakshatraDial = ({ moonNakIdx, moonDeg }: { moonNakIdx: number; moonDeg: number }) => {
  const size = 160, cx = 80, cy = 80, r = 68, ir = 44
  const total = 27
  const sliceAngle = (2 * Math.PI) / total
  const moonAngle = -Math.PI / 2 + (moonNakIdx + (moonDeg % (360/27)) / (360/27)) / total * 2 * Math.PI
  return (
    <svg width={size} height={size} style={{ display: 'block', margin: '0 auto' }}>
      {Array.from({ length: total }, (_, i) => {
        const a0 = -Math.PI / 2 + i * sliceAngle
        const a1 = a0 + sliceAngle
        const active = i === moonNakIdx
        const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0)
        const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1)
        const xi0 = cx + ir * Math.cos(a0), yi0 = cy + ir * Math.sin(a0)
        const xi1 = cx + ir * Math.cos(a1), yi1 = cy + ir * Math.sin(a1)
        const d = `M${xi0},${yi0} L${x0},${y0} A${r},${r} 0 0,1 ${x1},${y1} L${xi1},${yi1} A${ir},${ir} 0 0,0 ${xi0},${yi0} Z`
        const mid = (a0 + a1) / 2
        const tx = cx + (r + ir) / 2 * Math.cos(mid), ty = cy + (r + ir) / 2 * Math.sin(mid)
        return (
          <g key={i}>
            <path d={d} fill={active ? 'var(--gold)' : i % 9 === 0 ? 'var(--surface-3)' : 'var(--surface-2)'} stroke="var(--border)" strokeWidth={0.5} />
            <text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle" fontSize={active ? 5.5 : 4.5} fontWeight={active ? 700 : 400} fill={active ? 'var(--bg-page)' : 'var(--text-muted)'}>{NAK_NAMES[i]}</text>
          </g>
        )
      })}
      <circle cx={cx + (ir - 4) * Math.cos(moonAngle)} cy={cy + (ir - 4) * Math.sin(moonAngle)} r={5} fill="var(--gold)" />
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize={8} fontWeight={700} fill="var(--text-gold)">🌙</text>
      <text x={cx} y={cy + 7} textAnchor="middle" fontSize={6.5} fill="var(--text-muted)">{NAK_NAMES[moonNakIdx]}</text>
    </svg>
  )
}

// ─── History types ────────────────────────────────────────────────────────────
interface HistoryEntry {
  id: string
  question: string
  category: PrashnaCategory
  verdict: string
  confidence: number
  headline: string
  location: string
  ts: number
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PrashnaPage() {
  const [now, setNow] = useState(new Date())
  const [frozen, setFrozen] = useState(false)
  const [frozenAt, setFrozenAt] = useState<Date | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [location, setLocation] = useState<LocationValue>(getSavedLocation)
  const [chart, setChart] = useState<ChartOutput | null>(null)
  const [loading, setLoading] = useState(false)
  const [style, setStyle] = useState<ChartStyle>('north')
  const [varga, setVarga] = useState<'D1' | 'D9'>('D1')
  const [mounted, setMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [chartSize, setChartSize] = useState(420)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['core', 'timing', 'category']))
  const [mode, setMode] = useState<KPMode>('krishneeyam')
  const [kpNumber, setKpNumber] = useState<number | ''>('')
  const [category, setCategory] = useState<PrashnaCategory>('yes_no')
  const [aroodha, setAroodha] = useState<number | ''>('')
  const [questionText, setQuestionText] = useState('')
  const [bodyTouch, setBodyTouch] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState<HistoryEntry[]>([])

  // Load history on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const saved = localStorage.getItem('prashna_history')
      if (saved) setHistory(JSON.parse(saved))
    } catch { /* ignore */ }
  }, [])

  const saveToHistory = useCallback((entry: HistoryEntry) => {
    setHistory(prev => {
      const next = [entry, ...prev].slice(0, 50) // keep last 50
      try { localStorage.setItem('prashna_history', JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }, [])

  const toggleSection = (id: string) => setExpandedSections(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      setChartSize(mobile ? Math.min(window.innerWidth - 48, 380) : 420)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    setMounted(true)
    const t = setInterval(() => {
      const n = new Date()
      setNow(n)
      if (frozenAt) setElapsed(Math.floor((n.getTime() - frozenAt.getTime()) / 1000))
    }, 1000)
    return () => clearInterval(t)
  }, [frozenAt])

  const calculateChart = useCallback(async (targetDate: Date) => {
    setLoading(true)
    try {
      const res = await fetch('/api/chart/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Prashna Chart',
          birthDate: targetDate.toISOString().split('T')[0],
          birthTime: targetDate.toTimeString().split(' ')[0],
          birthPlace: location.name,
          latitude: location.lat, longitude: location.lng, timezone: location.tz,
          prashnaNumber: kpNumber === '' ? undefined : kpNumber,
          settings: { ayanamsha: 'lahiri', houseSystem: 'whole_sign' }
        })
      })
      const json = await res.json()
      if (json.success) setChart(json.data)
    } catch (err) { console.error('Prashna error:', err) }
    finally { setLoading(false) }
  }, [location, kpNumber])

  const handleAction = () => {
    if (frozen) { setFrozen(false); setChart(null); setFrozenAt(null); setElapsed(0) }
    else { setFrozen(true); setFrozenAt(now); setElapsed(0); calculateChart(now) }
  }

  const krishneeyamResult = useMemo((): KrishneeyamResult | null => {
    if (!chart || mode !== 'krishneeyam') return null
    const sun = chart.grahas.find(g => g.id === 'Su')
    const moon = chart.grahas.find(g => g.id === 'Mo')
    if (!sun || !moon) return null
    return runKrishneeyamPrashna({
      lagnaRashi: chart.lagnas.ascRashi, lagnaDegreeFull: chart.lagnas.ascDegree,
      lagnaSignDegree: chart.lagnas.ascDegree % 30,
      sunRashi: sun.rashi, sunDegreeFull: sun.totalDegree,
      moonRashi: moon.rashi, moonDegreeFull: moon.totalDegree,
      moonDignity: moon.dignity, moonIsRetro: moon.isRetro, moonIsCombust: moon.isCombust,
      grahas: chart.grahas, tithiNumber: chart.panchang.tithi.number,
      tithiPaksha: chart.panchang.tithi.paksha as 'shukla' | 'krishna',
      varaDayNumber: chart.panchang.vara.number, nakshatraIndex: chart.panchang.nakshatra.index,
      aroodhaRashi: aroodha === '' ? null : aroodha as number as 1,
      category, bodyTouchPart: bodyTouch || undefined,
    })
  }, [chart, mode, aroodha, category, bodyTouch])

  const rulingPlanets = useMemo(() => {
    if (!chart) return []
    const moon = chart.grahas.find(g => g.id === 'Mo')
    if (!moon) return []
    const ascLord = SIGN_LORDS[chart.lagnas.ascRashi]
    const moonStar = getKPSubLord(moon.totalDegree).nakshatraLord
    const ascStar = getKPSubLord(chart.lagnas.ascDegree).nakshatraLord
    return [
      { label: 'Day Lord', value: chart.panchang.vara.lord },
      { label: 'Moon Sign Lord', value: SIGN_LORDS[moon.rashi] },
      { label: 'Moon Star Lord', value: moonStar },
      { label: 'Lagna Lord', value: ascLord },
      { label: 'Lagna Star Lord', value: ascStar },
    ]
  }, [chart])

  // Save to history when result is ready
  useEffect(() => {
    if (!krishneeyamResult || !frozen || !frozenAt) return
    const entry: HistoryEntry = {
      id: frozenAt.toISOString(),
      question: questionText,
      category,
      verdict: krishneeyamResult.verdict,
      confidence: krishneeyamResult.confidence,
      headline: krishneeyamResult.headline,
      location: location.name,
      ts: frozenAt.getTime(),
    }
    saveToHistory(entry)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [krishneeyamResult])

  const formatElapsed = (sec: number) => {
    if (sec < 60) return `${sec}s`
    if (sec < 3600) return `${Math.floor(sec/60)}m ${sec%60}s`
    return `${Math.floor(sec/3600)}h ${Math.floor((sec%3600)/60)}m`
  }

  const vc = krishneeyamResult?.verdict
  const verdictColor = vc === 'YES' ? 'var(--teal)' : vc === 'NO' ? 'var(--rose)' : vc === 'DELAYED' ? 'var(--amber)' : 'var(--gold)'

  const Collapsible = ({ id, title, icon, accent = 'var(--gold)', children }: { id: string; title: string; icon: string; accent?: string; children: React.ReactNode }) => {
    const open = expandedSections.has(id)
    return (
      <div style={{ background: 'var(--surface-1)', borderRadius: 10, border: '1px solid var(--border-soft)', borderLeft: `3px solid ${accent}`, overflow: 'hidden' }}>
        <button onClick={() => toggleSection(id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.9rem', background: 'var(--surface-2)', border: 'none', cursor: 'pointer', borderBottom: open ? '1px solid var(--border-soft)' : 'none' }}>
          <span style={{ fontSize: '1rem' }}>{icon}</span>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: accent, flex: 1, textAlign: 'left' }}>{title}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{open ? '▲' : '▼'}</span>
        </button>
        {open && <div style={{ padding: '0.75rem' }}>{children}</div>}
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <header style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-1)', padding: '0.7rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link href="/" style={{ fontSize: '1.4rem', textDecoration: 'none' }}>🔮</Link>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, letterSpacing: '0.04em' }}>PRASHNA</h1>
              <span style={{ fontSize: '0.6rem', padding: '1px 7px', borderRadius: 999, background: 'var(--gold-faint)', color: 'var(--gold)', fontWeight: 700, border: '1px solid var(--gold-dim)' }}>KRISHNEEYAM</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.63rem', color: 'var(--text-muted)' }}>Kerala Horary Astrology · Sri Krishna Acharya (~11th c. AD)</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {mounted && <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '0.85rem', fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: frozen ? 'var(--rose)' : 'var(--teal)' }}>{now.toLocaleTimeString()}</span>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
              {frozen ? `🔴 +${formatElapsed(elapsed)} since capture` : '🟢 Live'}
            </span>
          </div>}
          <button onClick={() => setShowHistory(h => !h)} title="Reading History"
            style={{ padding: '0.35rem 0.6rem', borderRadius: 7, border: '1px solid var(--border)', background: showHistory ? 'var(--gold-faint)' : 'var(--surface-2)', cursor: 'pointer', fontSize: '0.85rem' }}>
            📋 {history.length}
          </button>
          {frozen && chart && <button onClick={() => window.print()} title="Print Reading"
            style={{ padding: '0.35rem 0.6rem', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface-2)', cursor: 'pointer', fontSize: '0.85rem' }}>
            🖨️
          </button>}
          <ThemeToggle />
        </div>
      </header>

      <main style={{ flex: 1, maxWidth: 1600, width: '100%', margin: '0 auto', padding: isMobile ? '1rem' : '1.25rem 1.5rem 4rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* ── Input Panel ──────────────────────────────────────────────────────── */}
        <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>

          {/* Row 1: Mode + Question + Location + Action */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            {/* Mode */}
            <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
              {(['krishneeyam', 'vedic', 'kp'] as KPMode[]).map(m => (
                <button key={m} onClick={() => setMode(m)} disabled={frozen}
                  className={`btn btn-sm ${mode === m ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ fontSize: '0.68rem', fontWeight: mode === m ? 700 : 400, whiteSpace: 'nowrap' }}>
                  {m === 'krishneeyam' ? '🔮 Kerala' : m === 'kp' ? '⭐ KP' : '🕉 Vedic'}
                </button>
              ))}
            </div>
            {mode === 'kp' && (
              <input type="number" className="input" placeholder="KP Number (1-249)" value={kpNumber} style={{ width: 160 }}
                onChange={e => setKpNumber(e.target.value === '' ? '' : Number(e.target.value))} disabled={frozen} />
            )}
            {/* Question */}
            <input type="text" className="input" placeholder="✍️ Your question (optional)…"
              value={questionText} onChange={e => setQuestionText(e.target.value)} disabled={frozen}
              style={{ flex: 1, minWidth: 180, fontSize: '0.82rem' }} />
            {/* Location */}
            <div style={{ flexShrink: 0 }}>
              <LocationPicker value={location} onChange={setLocation} label="Location" />
            </div>
            {/* Action */}
            <button onClick={handleAction}
              className={`btn ${frozen ? 'btn-secondary' : 'btn-primary'}`}
              style={{ height: 40, fontSize: '0.88rem', fontWeight: 700, letterSpacing: '0.04em', flexShrink: 0, whiteSpace: 'nowrap' }}>
              {frozen ? '↺ New Reading' : '⚡ Capture Moment'}
            </button>
          </div>

          {/* Row 2: Categories + Aroodha + Body Touch (Krishneeyam only) */}
          {mode === 'krishneeyam' && (
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
              {/* Category picker */}
              <div style={{ flex: 1, minWidth: 320 }}>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem' }}>Query Category</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '4px' }}>
                  {(Object.keys(CATEGORY_LABELS) as PrashnaCategory[]).map(cat => (
                    <button key={cat} onClick={() => setCategory(cat)} disabled={frozen}
                      title={CATEGORY_LABELS[cat]}
                      style={{
                        border: category === cat ? `2px solid ${verdictColor}` : '1px solid var(--border-soft)',
                        borderRadius: 7, padding: '0.3rem 0.15rem',
                        background: category === cat ? `${verdictColor}18` : 'var(--surface-2)',
                        cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                        transition: 'all 0.15s',
                      }}>
                      <span style={{ fontSize: '1rem' }}>{CATEGORY_ICONS[cat]}</span>
                      <span style={{ fontSize: '0.48rem', color: category === cat ? verdictColor : 'var(--text-muted)', fontWeight: 600, lineHeight: 1.2, textAlign: 'center' }}>
                        {CATEGORY_LABELS[cat].split(' ')[0]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Aroodha + Body Touch */}
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                <div style={{ minWidth: 155 }}>
                  <label style={{ display: 'block', fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 3 }}>Aroodha Rashi</label>
                  <select className="input" value={aroodha} disabled={frozen}
                    onChange={e => setAroodha(e.target.value === '' ? '' : Number(e.target.value))}>
                    <option value="">Auto (= Lagna)</option>
                    {RASHI_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                  <p style={{ fontSize: '0.56rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>Sign querist physically touches</p>
                </div>
                <div style={{ minWidth: 155 }}>
                  <label style={{ display: 'block', fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 3 }}>Body Touch</label>
                  <select className="input" value={bodyTouch} disabled={frozen} onChange={e => setBodyTouch(e.target.value)}>
                    {BODY_PARTS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                  </select>
                  <p style={{ fontSize: '0.56rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>Part touched while asking</p>
                </div>
              </div>
            </div>
          )}

          {/* Frozen timestamp */}
          {frozen && chart && (
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
              🔴 Frozen at <strong style={{ color: 'var(--rose)' }}>{chart.meta?.birthDate} {chart.meta?.birthTime}</strong>
            </div>
          )}
        </div>

        {/* ── History Panel ────────────────────────────────────────────────────── */}
        {showHistory && (
          <div className="card" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '0.9rem' }}>📋 Reading History ({history.length})</h3>
              <button onClick={() => { if (confirm('Clear all history?')) { setHistory([]); localStorage.removeItem('prashna_history') } }}
                style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', borderRadius: 5, border: '1px solid var(--border)', background: 'var(--surface-3)', cursor: 'pointer', color: 'var(--rose)' }}>
                Clear All
              </button>
            </div>
            {history.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>No readings saved yet. Capture a moment to begin.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: 320, overflowY: 'auto' }}>
                {history.map(h => {
                  const col = h.verdict === 'YES' ? 'var(--teal)' : h.verdict === 'NO' ? 'var(--rose)' : 'var(--amber)'
                  return (
                    <div key={h.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', padding: '0.45rem 0.65rem', background: 'var(--surface-2)', borderRadius: 7, border: '1px solid var(--border-soft)' }}>
                      <span style={{ fontWeight: 900, color: col, fontSize: '0.85rem', flexShrink: 0, width: 60, textAlign: 'center' }}>{h.verdict}<br/><span style={{ fontSize: '0.6rem', fontWeight: 400 }}>{h.confidence}%</span></span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.question || '(no question)'}</div>
                        <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{CATEGORY_ICONS[h.category]} {CATEGORY_LABELS[h.category]} · {h.location} · {new Date(h.ts).toLocaleString()}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Await state ──────────────────────────────────────────────────────── */}
        {!frozen && !loading && (
          <div style={{ height: '42vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-0)', borderRadius: 14, border: '1px dashed var(--border)', gap: '1.5rem' }}>
            <div style={{ width: 88, height: 88, borderRadius: '50%', background: 'var(--gold-faint)', border: '2px solid var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', animation: 'pulse 3s ease-in-out infinite' }}>🧿</div>
            <div style={{ textAlign: 'center', maxWidth: 500 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', opacity: 0.9, margin: '0 0 0.5rem' }}>Awaiting the Question</h2>
              <p style={{ opacity: 0.6, lineHeight: 1.7, fontSize: '0.85rem', margin: 0 }}>
                Clear your mind and focus on your question.<br />
                {mode === 'krishneeyam' && 'Choose the Aroodha (sign you face), body touch, and query category. '}
                When ready, press <strong>Capture Moment</strong>.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              {['📿 Aroodha', '👤 Body Touch', '🗂 Category', '⚡ Capture'].map((step, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 700 }}>{i + 1}</span>
                  {step}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Loading ───────────────────────────────────────────────────────────── */}
        {loading && (
          <div style={{ height: '55vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-1)', borderRadius: 14, border: '1px solid var(--gold-faint)', gap: '2rem' }}>
            <div className="oracle-spinner" />
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ color: 'var(--text-gold)', letterSpacing: '0.12em', textTransform: 'uppercase', fontSize: '1.1rem', margin: '0 0 0.5rem' }}>Consulting the Heavens</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Casting Prashna Kundali · Applying 524 Krishneeyam verses…</p>
            </div>
          </div>
        )}

        {/* ── Results ──────────────────────────────────────────────────────────── */}
        {frozen && chart && !loading && (
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1.25rem', alignItems: 'flex-start' }}>

            {/* ═══ LEFT: Chart Column ══════════════════════════════════════════ */}
            <div style={{ flex: '0 0 auto', width: isMobile ? '100%' : Math.max(chartSize + 40, 460), display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              {/* Chart */}
              <div className="card" style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>Prashna Kundali</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{questionText || 'Horary Chart'} · {location.name}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                    {(['D1', 'D9'] as const).map(v => (
                      <button key={v} onClick={() => setVarga(v)} className={`btn btn-sm ${varga === v ? 'btn-primary' : 'btn-ghost'}`}>{v}</button>
                    ))}
                    {(['north', 'south'] as ChartStyle[]).map(s => (
                      <button key={s} onClick={() => setStyle(s)} className={`btn btn-sm ${style === s ? 'btn-secondary' : 'btn-ghost'}`} style={{ fontSize: '0.65rem' }}>{s}</button>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <ChakraSelector
                    ascRashi={varga === 'D1' ? chart.lagnas.ascRashi : chart.vargaLagnas['D9']}
                    grahas={varga === 'D1' ? chart.grahas : chart.vargas['D9']}
                    arudhas={chart.arudhas} lagnas={chart.lagnas} vargaName={varga}
                    defaultStyle={style} size={chartSize} moonNakIndex={chart.panchang.nakshatra.index}
                    tithiNumber={chart.panchang.tithi.number} varaNumber={chart.panchang.vara.number} userPlan="platinum"
                  />
                </div>
                {/* Panchang chips */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem', marginTop: '0.75rem' }}>
                  {[
                    { label: 'Tithi', value: chart.panchang.tithi.name },
                    { label: 'Nakshatra', value: chart.panchang.nakshatra.name },
                    { label: 'Yoga', value: chart.panchang.yoga.name },
                    { label: 'Vara', value: chart.panchang.vara.name },
                    { label: 'Ascendant', value: `${RASHI_NAMES[chart.lagnas.ascRashi]} ${Math.floor(chart.lagnas.ascDegree % 30)}°` },
                    { label: 'Paksha', value: chart.panchang.tithi.paksha === 'shukla' ? '☀️ Shukla' : '🌑 Krishna' },
                  ].map(c => (
                    <div key={c.label} style={{ background: 'var(--surface-2)', borderRadius: 6, padding: '0.35rem 0.5rem', border: '1px solid var(--border-soft)' }}>
                      <div style={{ fontSize: '0.57rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{c.label}</div>
                      <div style={{ fontSize: '0.77rem', fontWeight: 700, color: 'var(--text-gold)' }}>{c.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Planetary Status */}
              <div className="card" style={{ padding: '1rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.75rem' }}>🪐 Planetary Status</div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)', opacity: 0.6 }}>
                        {['Planet', 'Sign', 'Nakshatra', 'Dignity', 'H', 'Notes'].map(h => (
                          <th key={h} style={{ padding: '0.4rem 0.35rem', textAlign: 'left', fontWeight: 600, fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {chart.grahas.filter(g => !['Ur', 'Ne', 'Pl'].includes(g.id)).map(g => {
                        const h = ((g.rashi - chart.lagnas.ascRashi + 12) % 12) + 1
                        const dignityColor = ['exalted', 'moolatrikona', 'own'].includes(g.dignity) ? 'var(--teal)' : ['debilitated', 'great_enemy', 'enemy'].includes(g.dignity) ? 'var(--rose)' : 'var(--text-secondary)'
                        return (
                          <tr key={g.id} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                            <td style={{ padding: '0.4rem 0.35rem', fontWeight: 700, color: 'var(--gold)' }}>{g.name}</td>
                            <td style={{ padding: '0.4rem 0.35rem' }}>{RASHI_NAMES[g.rashi]} {Math.floor(g.degree)}°</td>
                            <td style={{ padding: '0.4rem 0.35rem', color: 'var(--text-muted)' }}>{g.nakshatraName.slice(0, 7)}</td>
                            <td style={{ padding: '0.4rem 0.35rem' }}>
                              <span style={{ fontSize: '0.62rem', padding: '1px 5px', borderRadius: 3, background: 'var(--surface-3)', color: dignityColor, fontWeight: 600 }}>{g.dignity}</span>
                            </td>
                            <td style={{ padding: '0.4rem 0.35rem', textAlign: 'center', fontWeight: 700, color: 'var(--text-muted)' }}>H{h}</td>
                            <td style={{ padding: '0.4rem 0.35rem', fontSize: '0.62rem' }}>
                              {g.isRetro && <span style={{ color: 'var(--rose)', marginRight: 3 }}>℞</span>}
                              {g.isCombust && <span style={{ color: 'var(--amber)' }}>☀Cmb</span>}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Nakshatra Dial */}
              <div className="card" style={{ padding: '0.75rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.5rem', textAlign: 'center' }}>🌙 Nakshatra Chakra</div>
                <NakshatraDial moonNakIdx={chart.panchang.nakshatra.index} moonDeg={chart.grahas.find(g=>g.id==='Mo')?.totalDegree ?? 0} />
                <div style={{ textAlign: 'center', marginTop: '0.35rem', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  Moon in <strong style={{ color: 'var(--gold)' }}>{chart.panchang.nakshatra.name}</strong> · pada {chart.panchang.nakshatra.pada}
                </div>
              </div>
            </div>

            {/* ═══ RIGHT: Full Analysis Panel ══════════════════════════════════ */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

              {/* ── Krishneeyam Oracle ──────────────────────────────────────── */}
              {mode === 'krishneeyam' && krishneeyamResult && (() => {
                const r = krishneeyamResult
                return (
                  <>
                    {/* ═ VERDICT BANNER ═════════════════════════════════════ */}
                    <div style={{ borderRadius: 12, border: `2px solid ${verdictColor}`, background: `${verdictColor}0d`, overflow: 'hidden', position: 'relative' }}>
                      <div style={{ height: 4, background: `linear-gradient(90deg, ${verdictColor}, ${verdictColor}60)` }} />
                      <div style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.6rem', color: verdictColor, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                              ◆ Krishneeyam Oracle · {CATEGORY_ICONS[category]} {CATEGORY_LABELS[category]}
                            </div>
                            <h2 style={{ fontSize: isMobile ? '1.4rem' : '1.6rem', margin: '0 0 0.25rem', color: verdictColor, fontFamily: 'var(--font-display)', lineHeight: 1.2 }}>
                              {r.headline}
                            </h2>
                            {questionText && <p style={{ fontSize: '0.78rem', opacity: 0.7, fontStyle: 'italic', margin: '0 0 0.5rem' }}>"{questionText}"</p>}
                          </div>
                          <div style={{ textAlign: 'center', flexShrink: 0 }}>
                            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: verdictColor, lineHeight: 1, fontFamily: 'var(--font-display)' }}>{r.verdict}</div>
                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 2 }}>Verdict</div>
                          </div>
                        </div>

                        {/* Confidence meter */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                          <div style={{ flex: 1, height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${r.confidence}%`, background: `linear-gradient(90deg, ${verdictColor}80, ${verdictColor})`, borderRadius: 4, transition: 'width 0.6s ease' }} />
                          </div>
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: verdictColor, flexShrink: 0 }}>{r.confidence}% confidence</span>
                        </div>

                        {/* Rashmi Score */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                          <div style={{ flex: 1, height: 5, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${Math.min(100, r.rashmiScore / 25)}%`, background: 'linear-gradient(90deg, var(--amber)60, var(--amber))', borderRadius: 4 }} />
                          </div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--amber)', flexShrink: 0 }}>⚡ {r.rashmiScore} Rashmi</span>
                        </div>
                      </div>
                    </div>

                    {/* ═ CORE INDICATORS GRID ══════════════════════════════ */}
                    <SectionCard title="Core Astrological Indicators" icon="🔭" accent="var(--teal)">
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.4rem', marginBottom: '0.5rem' }}>
                        <Chip label="Ascendant Type" value={r.ascendantType} color={r.ascendantTypeResult === 'good' ? 'var(--teal)' : r.ascendantTypeResult === 'bad' ? 'var(--rose)' : 'var(--gold)'} />
                        <Chip label="Sign Mukha" value={r.signType} color={r.signTypeResult === 'good' ? 'var(--teal)' : r.signTypeResult === 'bad' ? 'var(--rose)' : 'var(--gold)'} />
                        <Chip label="Aroodha-Udaya" value={r.aroodhaUdayaRelation.split(' (')[0]} color={r.aroodhaUdayaResult === 'good' ? 'var(--teal)' : 'var(--rose)'} />
                        <Chip label="Chathra Rasi" value={`${RASHI_NAMES[r.chhatraRashi]} ${r.chhatraIsObstacle ? '⚠ Obstacle' : '✅ Favorable'}`} color={r.chhatraIsObstacle ? 'var(--rose)' : 'var(--teal)'} />
                      </div>
                      <IndicatorRow label="Ascendant" value={r.ascendantType} ok={r.ascendantTypeResult === 'good'} />
                      <IndicatorRow label="Sign Mukha" value={r.signType} ok={r.signTypeResult === 'good'} />
                      <IndicatorRow label="Aroodha-Udaya" value={r.aroodhaUdayaRelation} ok={r.aroodhaUdayaResult === 'good'} />
                      <IndicatorRow label="Chathra Rasi" value={`${RASHI_NAMES[r.chhatraRashi]} — ${r.chhatraIsObstacle ? 'Obstacle (6/8/12 from Lagna)' : 'Favorable'}`} ok={!r.chhatraIsObstacle} />
                      {r.bodyTouchResult && (
                        <div style={{ marginTop: '0.5rem', padding: '0.4rem 0.6rem', background: 'var(--surface-2)', borderRadius: 6, fontSize: '0.72rem', color: 'var(--gold)' }}>
                          ✋ <strong>Mushti Prashna (Body Touch):</strong> {r.bodyTouchResult}
                        </div>
                      )}
                      {r.planetInAscendantEffect && (
                        <div style={{ marginTop: '0.4rem', padding: '0.4rem 0.6rem', background: 'var(--surface-2)', borderRadius: 6, fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                          🪐 <strong>Planet in Ascendant:</strong> {r.planetInAscendantEffect}
                        </div>
                      )}
                    </SectionCard>

                    {/* ═ DREKKANA + ELEMENTS 2-col ══════════════════════════ */}
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0.75rem' }}>
                      {/* Drekkana */}
                      <SectionCard title="Drekkana Analysis" icon="🔺" accent="var(--teal)">
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Krishneeyam system (differs from Parasara)</div>
                        <div style={{ fontWeight: 700, color: 'var(--gold)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Lord: {r.drekkanaAnalysis.lord.split(' [')[0]}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.72rem' }}>
                          <div>Body Part: <strong style={{ color: 'var(--accent)' }}>{r.drekkanaAnalysis.bodyPart}</strong></div>
                          <div style={{ color: 'var(--text-muted)' }}>Right: {r.drekkanaAnalysis.rightSide}</div>
                          <div style={{ color: 'var(--text-muted)' }}>Left: {r.drekkanaAnalysis.leftSide}</div>
                          <div style={{ color: 'var(--text-muted)' }}>7th sign: {r.drekkanaAnalysis.seventhSign}</div>
                        </div>
                      </SectionCard>

                      {/* Five Elements + Height + Place */}
                      <SectionCard title="Element & Location" icon="🌍" accent="var(--amber)">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.73rem' }}>
                          <div style={{ padding: '0.3rem 0.5rem', background: 'var(--surface-2)', borderRadius: 5 }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.6rem' }}>FIVE ELEMENT [CH3:17]</span>
                            <div style={{ color: 'var(--accent)', fontWeight: 600 }}>{r.subjectElement}</div>
                          </div>
                          <div style={{ padding: '0.3rem 0.5rem', background: 'var(--surface-2)', borderRadius: 5 }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.6rem' }}>SIGN HEIGHT [CH1:19]</span>
                            <div style={{ color: 'var(--gold)', fontWeight: 600 }}>{r.signHeight}</div>
                          </div>
                          <div style={{ padding: '0.3rem 0.5rem', background: 'var(--surface-2)', borderRadius: 5 }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.6rem' }}>LOCATION [CH5:3]</span>
                            <div style={{ color: 'var(--teal)', fontWeight: 600 }}>{r.signPlace}</div>
                          </div>
                        </div>
                      </SectionCard>
                    </div>

                    {/* ═ TIMING ══════════════════════════════════════════════ */}
                    <SectionCard title="Timing of Fructification" icon="⏰" accent="var(--amber)">
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.4rem', marginBottom: '0.5rem' }}>
                        <div style={{ textAlign: 'center', padding: '0.5rem', background: 'var(--surface-2)', borderRadius: 7 }}>
                          <div style={{ fontSize: '0.57rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Earliest</div>
                          <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--teal)' }}>{r.timing.rangeMin}</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '0.5rem', background: 'var(--surface-2)', borderRadius: 7 }}>
                          <div style={{ fontSize: '0.57rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Significator</div>
                          <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--gold)' }}>{r.timing.significatorPlanet}</div>
                          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>planet</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '0.5rem', background: 'var(--surface-2)', borderRadius: 7 }}>
                          <div style={{ fontSize: '0.57rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Latest</div>
                          <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--rose)' }}>{r.timing.rangeMax}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{r.timing.description}</div>
                    </SectionCard>

                    {/* ═ QUERIST PROFILE + MOON YOGA + PAST/PRESENT/FUTURE ══ */}
                    <Collapsible id="querist" title="Querist Profile & Context" icon="👤" accent="var(--rose)">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {/* Guna */}
                        <div style={{ padding: '0.5rem 0.75rem', background: 'var(--surface-2)', borderRadius: 7, fontSize: '0.73rem' }}>
                          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 3 }}>Guna</div>
                          <div style={{ color: 'var(--gold)', fontWeight: 600 }}>{r.queristGuna}</div>
                        </div>
                        {/* Physical Features */}
                        <div style={{ padding: '0.5rem 0.75rem', background: 'var(--surface-2)', borderRadius: 7, fontSize: '0.72rem' }}>
                          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 3 }}>Physical Features</div>
                          <div style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>{r.planetPhysicalFeatures}</div>
                        </div>
                        {/* Moon Yoga */}
                        <div style={{ padding: '0.5rem 0.75rem', background: 'var(--surface-2)', borderRadius: 7, fontSize: '0.73rem', borderLeft: `3px solid ${r.moonYoga.result.includes('⚠') ? 'var(--rose)' : 'var(--teal)'}` }}>
                          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 3 }}>Moon Yoga</div>
                          <div style={{ fontWeight: 700, color: r.moonYoga.result.includes('⚠') ? 'var(--rose)' : 'var(--teal)', marginBottom: 2 }}>{r.moonYoga.name}</div>
                          <div style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>{r.moonYoga.result}</div>
                        </div>
                        {/* Past/Present/Future */}
                        <div style={{ padding: '0.5rem 0.75rem', background: 'var(--surface-2)', borderRadius: 7 }}>
                          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Past · Present · Future</div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.3rem', fontSize: '0.68rem' }}>
                            <div style={{ padding: '0.35rem', background: 'var(--surface-3)', borderRadius: 5, textAlign: 'center' }}>
                              <div style={{ color: 'var(--text-muted)', marginBottom: 3 }}>PAST (H9-12)</div>
                              <div style={{ color: 'var(--rose)', fontWeight: 600 }}>{r.pastPresentFuture.past.join(', ') || '—'}</div>
                            </div>
                            <div style={{ padding: '0.35rem', background: 'var(--surface-3)', borderRadius: 5, textAlign: 'center' }}>
                              <div style={{ color: 'var(--text-muted)', marginBottom: 3 }}>NOW (H1-4)</div>
                              <div style={{ color: 'var(--teal)', fontWeight: 600 }}>{r.pastPresentFuture.present.join(', ') || '—'}</div>
                            </div>
                            <div style={{ padding: '0.35rem', background: 'var(--surface-3)', borderRadius: 5, textAlign: 'center' }}>
                              <div style={{ color: 'var(--text-muted)', marginBottom: 3 }}>FUTURE (H5-8)</div>
                              <div style={{ color: 'var(--gold)', fontWeight: 600 }}>{r.pastPresentFuture.future.join(', ') || '—'}</div>
                            </div>
                          </div>
                        </div>
                        {/* Querist Facts (Ch12) */}
                        {r.queristFeatures.length > 0 && (
                          <div style={{ padding: '0.5rem 0.75rem', background: 'var(--surface-2)', borderRadius: 7 }}>
                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Querist Facts — Vishwasa Jananam</div>
                            <BulletList items={r.queristFeatures} />
                          </div>
                        )}
                      </div>
                    </Collapsible>

                    {/* ═ MATERIAL ANALYSIS (Ch9) + DMJ ═══════════════════════ */}
                    <Collapsible id="material" title="Material, Ornament & Flower Analysis" icon="⚗️" accent="var(--teal)">
                      {r.subjectMaterialDetail ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.73rem' }}>
                          {r.subjectMaterialDetail.split('. ').map((seg, i) => seg.trim() && (
                            <div key={i} style={{ padding: '0.35rem 0.55rem', background: 'var(--surface-2)', borderRadius: 5, color: 'var(--text-secondary)' }}>{seg}</div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>Select "What" or "Lost Article" or "Who" category for detailed material analysis</div>
                      )}
                      {/* DMJ dry/wet */}
                      <div style={{ marginTop: '0.5rem', padding: '0.4rem 0.6rem', background: 'var(--surface-2)', borderRadius: 6, fontSize: '0.72rem', color: 'var(--teal)' }}>
                        💧 <strong>Dry / Wet:</strong> {r.dryWetAnalysis}
                      </div>
                    </Collapsible>

                    {/* ═ THIEF / THEFT ANALYSIS ═══════════════════════════════ */}
                    {(category === 'who' || category === 'lost_article') && (
                      <SectionCard title="Theft & Lost Article Analysis" icon="🕵️" accent="var(--rose)">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {/* Thief Entry */}
                          <div style={{ padding: '0.4rem 0.6rem', background: 'var(--surface-2)', borderRadius: 6, fontSize: '0.72rem', borderLeft: '3px solid var(--rose)' }}>
                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: 2 }}>HOW THIEF ENTERED [CH3:2]</div>
                            <div style={{ color: 'var(--text-secondary)' }}>{r.thiefEntry}</div>
                          </div>
                          {/* Thief profile */}
                          {r.thief && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.3rem' }}>
                              {[
                                { k: 'Gender', v: r.thief.gender }, { k: 'Caste', v: r.thief.caste },
                                { k: 'Relation', v: r.thief.relation }, { k: 'Posture', v: r.thief.posture },
                                { k: 'Color', v: r.thief.color }, { k: 'Location Dir.', v: r.thief.location },
                              ].map(({ k, v }) => (
                                <div key={k} style={{ padding: '0.3rem 0.5rem', background: 'var(--surface-2)', borderRadius: 5, fontSize: '0.7rem' }}>
                                  <div style={{ fontSize: '0.57rem', color: 'var(--text-muted)' }}>{k}</div>
                                  <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{v}</div>
                                </div>
                              ))}
                            </div>
                          )}
                          {r.thief?.nameLetters && (
                            <div style={{ padding: '0.4rem 0.6rem', background: 'var(--gold-faint)', borderRadius: 6, border: '1px solid var(--gold-dim)', fontSize: '0.72rem' }}>
                              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: 2 }}>NAME LETTERS [CH30]</div>
                              <div style={{ fontWeight: 700, color: 'var(--gold)', fontSize: '0.9rem' }}>{r.thief.nameLetters}</div>
                              <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>{r.thief.nameLetterExplanation}</div>
                            </div>
                          )}
                          {r.thief?.features && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', padding: '0.4rem 0.6rem', background: 'var(--surface-2)', borderRadius: 6 }}>
                              <strong style={{ color: 'var(--text-gold)' }}>Physical appearance:</strong> {r.thief.features}
                            </div>
                          )}
                          {r.subjectNature && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--teal)', padding: '0.4rem 0.6rem', background: 'var(--surface-2)', borderRadius: 6 }}>
                              <strong>Recovery:</strong> {r.subjectNature}
                            </div>
                          )}
                        </div>
                      </SectionCard>
                    )}

                    {/* ═ HEALTH ANALYSIS [Ch13] ══════════════════════════════ */}
                    {category === 'health' && r.health && (
                      <SectionCard title="Health & Disease Analysis" icon="🏥" accent="var(--amber)">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.4rem', marginBottom: '0.5rem' }}>
                          <Chip label="Dosha" value={r.health.dosha} color="var(--amber)" />
                          <Chip label="Curability" value={r.health.curability} color={r.health.curability.toLowerCase().includes('curable') ? 'var(--teal)' : 'var(--rose)'} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.72rem' }}>
                          <IndicatorRow label="Body System" value={r.health.bodySystem} ok={null} />
                          <IndicatorRow label="Day of onset" value={r.health.dayOfStart} ok={null} />
                          <IndicatorRow label="Place of danger" value={r.health.placeOfDeath} ok={null} />
                          <IndicatorRow label="Cause" value={r.health.causeOfDeath} ok={null} />
                          <IndicatorRow label="Rebirth (if death)" value={r.health.rebirthNature} ok={null} />
                        </div>
                        {r.health.deathSymptoms && r.health.deathSymptoms.includes('CRITICAL') && (
                          <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.75rem', background: 'var(--rose)12', borderRadius: 6, border: '1px solid var(--rose)', fontSize: '0.73rem', color: 'var(--rose)' }}>
                            ⚠️ {r.health.deathSymptoms}
                          </div>
                        )}
                      </SectionCard>
                    )}

                    {/* ═ HOUSE QUERY [Ch15] ══════════════════════════════════ */}
                    {category === 'house_query' && r.houseQuery && (
                      <SectionCard title="House Query Analysis" icon="🏠" accent="var(--teal)">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.4rem' }}>
                          {[
                            { k: 'House Type', v: r.houseQuery.houseType },
                            { k: 'Direction', v: r.houseQuery.direction },
                            { k: 'Shape', v: r.houseQuery.shape },
                            { k: 'Ownership', v: r.houseQuery.ownership },
                          ].map(({ k, v }) => <Chip key={k} label={k} value={v} />)}
                        </div>
                        <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.75rem', background: r.houseQuery.hasTreasure.startsWith('YES') ? 'var(--gold-faint)' : 'var(--surface-2)', borderRadius: 6, border: `1px solid ${r.houseQuery.hasTreasure.startsWith('YES') ? 'var(--gold-dim)' : 'var(--border-soft)'}`, fontWeight: 700, color: r.houseQuery.hasTreasure.startsWith('YES') ? 'var(--gold)' : 'var(--text-muted)', fontSize: '0.78rem', textAlign: 'center' }}>
                          💰 Treasure: {r.houseQuery.hasTreasure}
                        </div>
                      </SectionCard>
                    )}

                    {/* ═ SPIRIT / BAADHA [Ch19] ══════════════════════════════ */}
                    {category === 'spirit' && r.spirit && (
                      <SectionCard title="Baadha / Spirit Analysis" icon="👁️" accent="var(--rose)">
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', marginBottom: '0.5rem' }}>
                          <Chip label="Spirit Type" value={r.spirit.type} color="var(--rose)" />
                          <Chip label="Deity" value={r.spirit.deity} color="var(--gold)" />
                        </div>
                        <div style={{ padding: '0.5rem 0.75rem', background: 'var(--teal)12', borderRadius: 6, border: '1px solid var(--teal)', fontSize: '0.73rem', color: 'var(--teal)' }}>
                          🙏 <strong>Remedy:</strong> {r.spirit.remedy}
                        </div>
                      </SectionCard>
                    )}

                    {/* ═ MARRIAGE / INTERCOURSE [Ch18] ══════════════════════ */}
                    {(category === 'marriage' || category === 'intercourse') && r.relationship && (
                      <SectionCard title="Relationship Analysis" icon="💍" accent="var(--gold)">
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.4rem' }}>
                          <Chip label="Quality" value={r.relationship.quality} color="var(--teal)" />
                          <Chip label="Partner" value={r.relationship.partner} />
                          <Chip label="Nature" value={r.relationship.nature} />
                        </div>
                      </SectionCard>
                    )}

                    {/* ═ FOOD [Ch16-17] ══════════════════════════════════════ */}
                    {category === 'food' && r.food && (
                      <SectionCard title="Food Query" icon="🍽️" accent="var(--amber)">
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.4rem' }}>
                          <Chip label="Quality" value={r.food.quality} color={r.food.quality.toLowerCase().includes('good') ? 'var(--teal)' : 'var(--rose)'} />
                          <Chip label="Type" value={r.food.type} />
                          <Chip label="Taste" value={r.food.taste} />
                        </div>
                      </SectionCard>
                    )}

                    {/* ═ PREGNANCY [Ch21] ════════════════════════════════════ */}
                    {category === 'pregnancy' && (
                      <SectionCard title="Pregnancy / Child" icon="👶" accent="var(--rose)">
                        <BulletList items={r.details.filter(d => d.toLowerCase().includes('ch21') || d.toLowerCase().includes('ketu') || d.toLowerCase().includes('pregnan') || d.toLowerCase().includes('child'))} />
                      </SectionCard>
                    )}

                    {/* ═ TRAVEL [Ch14] ═══════════════════════════════════════ */}
                    {category === 'travel' && (
                      <SectionCard title="Travel / Return" icon="✈️" accent="var(--teal)">
                        <BulletList items={r.details.filter(d => d.toLowerCase().includes('ch14') || d.toLowerCase().includes('travel') || d.toLowerCase().includes('return') || d.toLowerCase().includes('mode'))} />
                      </SectionCard>
                    )}

                    {/* ═ NAVAMSA + TRIMSAMSHA ══════════════════════════════════ */}
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0.75rem' }}>
                      {r.navamsaSignification && (
                        <SectionCard title="Navamsa" icon="🔬" accent="var(--gold)">
                          <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{r.navamsaSignification}</div>
                        </SectionCard>
                      )}
                      {r.trimsamshaTopics.length > 0 && (
                        <SectionCard title="Trimsamsha Topics" icon="📐" accent="var(--amber)">
                          <BulletList items={r.trimsamshaTopics} />
                        </SectionCard>
                      )}
                    </div>

                    {/* ═ ANIMAL QUERY [Ch11] ═════════════════════════════════ */}
                    {r.animalQuery && (
                      <SectionCard title="Animal Query" icon="🐾" accent="var(--amber)">
                        <div style={{ fontSize: '0.8rem', color: 'var(--gold)', fontWeight: 600 }}>{r.animalQuery}</div>
                      </SectionCard>
                    )}

                    {/* ═ LAWSUIT ANALYSIS ════════════════════════════════════ */}
                    {category === 'lawsuit' && r.lawsuit && (
                      <SectionCard title="Legal Dispute Analysis" icon="⚖️" accent="var(--rose)">
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', marginBottom: '0.5rem' }}>
                          <Chip label="Your Strength" value={r.lawsuit.queristStrength} color={r.lawsuit.queristStrength === 'Strong' ? 'var(--teal)' : r.lawsuit.queristStrength === 'Weak' ? 'var(--rose)' : 'var(--amber)'} />
                          <Chip label="Opponent Strength" value={r.lawsuit.opponentStrength} color={r.lawsuit.opponentStrength === 'Strong' ? 'var(--rose)' : r.lawsuit.opponentStrength === 'Weak' ? 'var(--teal)' : 'var(--amber)'} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.73rem' }}>
                          <div style={{ padding: '0.4rem 0.6rem', background: 'var(--surface-2)', borderRadius: 6 }}>
                            <strong style={{ color: 'var(--gold)' }}>Outcome:</strong> {r.lawsuit.outcome}
                          </div>
                          <IndicatorRow label="Timeline" value={r.lawsuit.timing} ok={null} />
                          <IndicatorRow label="Key Planet" value={r.lawsuit.keyPlanet} ok={null} />
                        </div>
                      </SectionCard>
                    )}

                    {/* ═ EXAM / ELECTION ANALYSIS ════════════════════════════ */}
                    {category === 'exam' && r.exam && (
                      <SectionCard title="Exam / Competition Analysis" icon="🎓" accent="var(--teal)">
                        <div style={{ padding: '0.5rem 0.75rem', background: r.exam.success.includes('Excellent') ? 'var(--teal)12' : r.exam.success.includes('Good') ? 'var(--gold-faint)' : 'var(--rose)12', borderRadius: 7, border: `1px solid ${r.exam.success.includes('Excellent') ? 'var(--teal)' : r.exam.success.includes('Good') ? 'var(--gold-dim)' : 'var(--rose)'}`, marginBottom: '0.5rem', fontWeight: 600, color: r.exam.success.includes('Excellent') ? 'var(--teal)' : r.exam.success.includes('Good') ? 'var(--gold)' : 'var(--rose)', fontSize: '0.8rem' }}>
                          🎯 {r.exam.success}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.73rem' }}>
                          <IndicatorRow label="Subject strength" value={r.exam.subject} ok={null} />
                          <IndicatorRow label="Key strength" value={r.exam.keyStrength} ok={null} />
                          <IndicatorRow label="Watch out" value={r.exam.weakness} ok={null} />
                          <IndicatorRow label="Best timing" value={r.exam.timing} ok={null} />
                        </div>
                      </SectionCard>
                    )}

                    {/* ═ RAHU IN ASCENDANT ════════════════════════════════════ */}
                    {r.rahuInAscendant && (
                      <SectionCard title="Rahu in Ascendant" icon="🐉" accent="var(--rose)">
                        <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{r.rahuInAscendant}</div>
                      </SectionCard>
                    )}

                    {/* ═ SCORECARD ════════════════════════════════════════════ */}
                    <Collapsible id="scorecard" title={`Score Breakdown (${r.scorecard.filter(s=>s.result==='good').length}✅ / ${r.scorecard.filter(s=>s.result==='bad').length}❌ of ${r.scorecard.filter(s=>s.weight>0).length} checks)`} icon="📊" accent="var(--teal)">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {r.scorecard.filter(s => s.weight > 0).map((item, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.5rem', background: 'var(--surface-2)', borderRadius: 6, border: `1px solid ${item.result === 'good' ? 'var(--teal)30' : item.result === 'bad' ? 'var(--rose)30' : 'var(--border-soft)'}` }}>
                            <span style={{ fontSize: '1rem', flexShrink: 0 }}>{item.result === 'good' ? '✅' : item.result === 'bad' ? '❌' : '〰️'}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '0.72rem', fontWeight: 600, color: item.result === 'good' ? 'var(--teal)' : item.result === 'bad' ? 'var(--rose)' : 'var(--gold)' }}>{item.label}</div>
                              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{item.detail}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Collapsible>

                    {/* ═ TIME STRENGTH NOTES ═══════════════════════════════════ */}
                    {r.timeStrengthNotes.length > 0 && (
                      <Collapsible id="timestrength" title="Planetary Time Strength" icon="⏱" accent="var(--amber)">
                        <BulletList items={r.timeStrengthNotes} />
                      </Collapsible>
                    )}

                    {/* ═ RULES APPLIED ═══════════════════════════════════════ */}
                    <Collapsible id="rules" title={`Rules Applied (${r.rules.length} Krishneeyam rules)`} icon="📜" accent="var(--teal)">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        {r.rules.map((rule, i) => (
                          <div key={i} style={{ display: 'flex', gap: '0.4rem', fontSize: '0.7rem', lineHeight: 1.5, padding: '0.3rem 0', borderBottom: '1px solid var(--border-soft)' }}>
                            <span style={{ color: 'var(--gold)', flexShrink: 0, fontSize: '0.65rem', marginTop: 1 }}>◆</span>
                            <span style={{ color: 'var(--text-secondary)' }}>{rule}</span>
                          </div>
                        ))}
                      </div>
                    </Collapsible>

                    {/* ═ DETAILED NOTES ══════════════════════════════════════ */}
                    <Collapsible id="details" title={`Engine Details (${r.details.length} notes)`} icon="🔬" accent="var(--text-muted)">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {r.details.map((d, i) => (
                          <p key={i} style={{ margin: 0, fontSize: '0.68rem', lineHeight: 1.6, borderBottom: '1px solid var(--border-soft)', paddingBottom: '0.25rem', color: 'var(--text-muted)' }}>• {d}</p>
                        ))}
                      </div>
                    </Collapsible>

                    {/* ═ REMEDIES ════════════════════════════════════════════ */}
                    {r.remedies.length > 0 && (
                      <SectionCard title="Remedies & Prescriptions" icon="🕯️" accent="var(--gold)">
                        <BulletList items={r.remedies.map(rem => `🕯️ ${rem}`)} />
                      </SectionCard>
                    )}

                    {/* ═ COPY BUTTON ═════════════════════════════════════════ */}
                    <button
                      style={{ padding: '0.65rem 1rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-secondary)', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}
                      onClick={() => {
                        const lines = [
                          `KRISHNEEYAM PRASHNA ANALYSIS`,
                          `=`.repeat(40),
                          questionText ? `Question: "${questionText}"` : '',
                          `Verdict: ${r.headline} (${r.confidence}% confidence)`,
                          `Rashmi Score: ${r.rashmiScore}`,
                          ``,
                          `CORE INDICATORS`,
                          `Ascendant: ${RASHI_NAMES[chart.lagnas.ascRashi]} · ${r.ascendantType}`,
                          `Sign Mukha: ${r.signType}`,
                          `Aroodha-Udaya: ${r.aroodhaUdayaRelation}`,
                          `Chathra Rasi: ${RASHI_NAMES[r.chhatraRashi]} (${r.chhatraIsObstacle ? 'Obstacle' : 'Favorable'})`,
                          ``,
                          `DREKKANA (Krishneeyam): Lord = ${r.drekkanaAnalysis.lord.split(' [')[0]}; Body = ${r.drekkanaAnalysis.bodyPart}`,
                          `Five Element: ${r.subjectElement}`,
                          `Sign Height: ${r.signHeight} | Location: ${r.signPlace}`,
                          ``,
                          `TIMING`,
                          `${r.timing.rangeMin} to ${r.timing.rangeMax} (${r.timing.significatorPlanet})`,
                          r.timing.description,
                          ``,
                          `QUERIST PROFILE`,
                          `Guna: ${r.queristGuna}`,
                          `Features: ${r.planetPhysicalFeatures}`,
                          `Moon Yoga: ${r.moonYoga.name} — ${r.moonYoga.result}`,
                          `Past: ${r.pastPresentFuture.past.join(', ') || 'none'}`,
                          `Present: ${r.pastPresentFuture.present.join(', ') || 'none'}`,
                          `Future: ${r.pastPresentFuture.future.join(', ') || 'none'}`,
                          r.queristFeatures.length ? `\nQUERIST FACTS\n${r.queristFeatures.map(f => `• ${f}`).join('\n')}` : '',
                          r.thief ? `\nTHIEF PROFILE\nEntry: ${r.thiefEntry}\nGender: ${r.thief.gender} | Caste: ${r.thief.caste} | Name letters: ${r.thief.nameLetters}` : '',
                          r.health ? `\nHEALTH\nDosha: ${r.health.dosha} | Body: ${r.health.bodySystem} | Curability: ${r.health.curability}` : '',
                          r.houseQuery ? `\nHOUSE\n${r.houseQuery.houseType} | ${r.houseQuery.direction} | Treasure: ${r.houseQuery.hasTreasure}` : '',
                          r.spirit ? `\nSPIRIT\nType: ${r.spirit.type} | Deity: ${r.spirit.deity} | Remedy: ${r.spirit.remedy}` : '',
                          r.subjectMaterialDetail ? `\nMATERIAL ANALYSIS\n${r.subjectMaterialDetail}` : '',
                          `\nRULES APPLIED\n${r.rules.map(rule => `• ${rule}`).join('\n')}`,
                          r.remedies.length ? `\nREMEDIES\n${r.remedies.map(rem => `• ${rem}`).join('\n')}` : '',
                        ].filter(Boolean).join('\n')
                        navigator.clipboard.writeText(lines)
                      }}>
                      📋 Copy Full Analysis to Clipboard
                    </button>
                  </>
                )
              })()}

              {/* KP / Vedic Mode */}
              {mode !== 'krishneeyam' && (
                <>
                  <div className="card">
                    <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Ruling Planets (KP)</h3>
                    {rulingPlanets.map((rp, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '0.4rem 0', borderBottom: '1px solid var(--border-soft)' }}>
                        <span style={{ opacity: 0.6 }}>{rp.label}</span>
                        <span style={{ fontWeight: 600, color: 'var(--gold)' }}>{typeof rp.value === 'string' ? rp.value : String(rp.value)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </main>

      <style>{`
        .oracle-spinner {
          width: 48px; height: 48px;
          border: 3px solid var(--border);
          border-top: 3px solid var(--gold);
          border-radius: 50%;
          animation: spin 1.2s linear infinite;
        }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(201,168,76,0.4); }
          50% { box-shadow: 0 0 0 14px rgba(201,168,76,0); }
        }
        @media print {
          header, .btn, button, select, input { display: none !important; }
          body { background: white !important; color: black !important; }
          .card { border: 1px solid #ccc !important; box-shadow: none !important; }
          * { color-scheme: light !important; }
        }
      `}</style>
    </div>
  )
}
