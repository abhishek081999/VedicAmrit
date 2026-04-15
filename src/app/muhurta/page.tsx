'use client'
// ─────────────────────────────────────────────────────────────
//  src/app/muhurta/page.tsx
//  Muhurta Finder — search auspicious time windows
//  Scans a date range, scores each day on:
//    • Yoga quality (auspicious/inauspicious)
//    • Tithi (certain tithis avoided for specific acts)
//    • Nakshatra (favorable for purpose)
//    • Vara (weekday lord)
//    • Rahu Kalam / Gulika (inauspicious windows to avoid)
//    • Abhijit Muhurta (most auspicious window of the day)
// ─────────────────────────────────────────────────────────────

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { useChart } from '@/components/providers/ChartProvider'
import { LocationPicker, getSavedLocation, type LocationValue } from '@/components/ui/LocationPicker'
import { calcTaraBala, calcChandraBala } from '@/lib/engine/muhurtaPersonal'
import { MuhurtaTimeline } from '@/components/ui/MuhurtaTimeline'
import { analyzeMuhurta, type MuhurtaActivity } from '@/lib/engine/muhurtaAnalysis'

// ── Types ─────────────────────────────────────────────────────
interface DayPanchang {
  date:      string
  vara:      { name: string; lord: string; number: number }
  tithi:     { name: string; paksha: string; number: number }
  nakshatra: { name: string; lord: string; pada: number; index: number }
  yoga:      { name: string; quality: string }
  karana:    { name: string; isBhadra: boolean }
  sunrise:   string
  sunset:    string
  rahuKalam:      { start: string; end: string }
  gulikaKalam:    { start: string; end: string }
  abhijitMuhurta: { start: string; end: string } | null
  moonLongitudeSidereal: number
}

interface MuhurtaResult {
  date:    string
  score:   number          // 0–100
  grade:   'A' | 'B' | 'C' | 'D'
  windows: string[]        // Auspicious time windows
  avoid:   string[]        // Inauspicious times to avoid
  reasons: string[]        // Why this day is good/bad
  panchang: DayPanchang
  personal?: {
    taraBala:    { name: string; score: number; desc: string }
    chandraBala: { position: number; score: number; desc: string }
  }
}

// ── Purpose definitions ───────────────────────────────────────
const PURPOSES = [
  { id: 'MARRIAGE',    label: 'Marriage / Vivāha',       icon: '💍' },
  { id: 'BUSINESS',    label: 'Business Start',           icon: '💼' },
  { id: 'TRAVEL',      label: 'Travel / Journey',         icon: '✈️' },
  { id: 'EDUCATION',   label: 'Education / Vidyārambha',  icon: '📚' },
  { id: 'HEALTH',      label: 'Medical / Surgery',        icon: '🏥' },
  { id: 'REAL_ESTATE', label: 'Property / Gṛhapravesh',  icon: '🏠' },
  { id: 'GENERAL',     label: 'General Auspicious',       icon: '✨' },
]

// Purpose rules are now managed in src/lib/engine/muhurtaAnalysis.ts

// ── Helpers ───────────────────────────────────────────────────
function fmtTime(iso: string): string {
  const d = new Date(iso)
  const h = d.getHours(); const m = String(d.getMinutes()).padStart(2,'0')
  return `${h % 12 || 12}:${m} ${h >= 12 ? 'PM' : 'AM'}`
}
function addMinutes(iso: string, mins: number): string {
  const d = new Date(new Date(iso).getTime() + mins * 60000)
  const h = d.getHours(); const m = String(d.getMinutes()).padStart(2,'0')
  return `${h % 12 || 12}:${m} ${h >= 12 ? 'PM' : 'AM'}`
}
function todayIST(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date())
}
function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
function fmtDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00Z')
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
  return `${days[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`
}

const GRADE_COLOR: Record<string, { bg: string; border: string; text: string }> = {
  A: { bg: 'rgba(78,205,196,0.15)',  border: 'rgba(78,205,196,0.50)',  text: 'var(--teal)' },
  B: { bg: 'rgba(201,168,76,0.12)',  border: 'rgba(201,168,76,0.40)',  text: 'var(--text-gold)' },
  C: { bg: 'rgba(245,158,66,0.10)',  border: 'rgba(245,158,66,0.30)',  text: 'var(--amber)' },
  D: { bg: 'rgba(224,123,142,0.10)', border: 'rgba(224,123,142,0.35)', text: 'var(--rose)' },
}

// ── Scoring function ──────────────────────────────────────────
function scorePanchang(p: DayPanchang, purpose: string, natal: { moonNak: number; moonSign: number }): MuhurtaResult {
  const result = analyzeMuhurta(purpose as MuhurtaActivity, {
    tithi: p.tithi as any,
    nakshatra: p.nakshatra as any,
    yoga: p.yoga as any,
    karana: p.karana as any,
    vara: p.vara as any,
    isRahuKalam: false, 
    isGulikaKalam: false,
    isYamaganda: false,
    isAbhijit: !!p.abhijitMuhurta,
  }, natal)

  const windows: string[] = []
  if (p.abhijitMuhurta) windows.push(`Abhijit: ${fmtTime(p.abhijitMuhurta.start)} - ${fmtTime(p.abhijitMuhurta.end)}`)
  
  const avoid = [
    `Rahu Kalam: ${fmtTime(p.rahuKalam.start)} - ${fmtTime(p.rahuKalam.end)}`,
    `Gulika: ${fmtTime(p.gulikaKalam.start)} - ${fmtTime(p.gulikaKalam.end)}`
  ]

  return { 
    date: p.date, 
    score: result.score, 
    grade: result.label === 'Excellent' ? 'A' : result.label === 'Good' ? 'B' : result.label === 'Neutral' ? 'C' : 'D',
    windows, 
    avoid, 
    reasons: result.factors, 
    panchang: p 
  }
}

// ── Result card ───────────────────────────────────────────────
function ResultCard({ result }: { result: MuhurtaResult; key?: string }) {
  const [open, setOpen] = useState(false)
  const gc = GRADE_COLOR[result.grade]
  return (
    <div style={{
      background: gc.bg, border: `1px solid ${gc.border}`,
      borderRadius: 'var(--r-md)', overflow: 'hidden',
    }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{ padding: '0.75rem 1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}
      >
        <div style={{
          width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
          background: gc.bg, border: `2px solid ${gc.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-display)', fontSize: '1.2rem',
          fontWeight: 700, color: gc.text,
        }}>
          {result.grade}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {fmtDateShort(result.date)}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>
            {result.panchang.tithi.name} · {result.panchang.nakshatra.name} · {result.panchang.yoga.name}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 80, height: 6, background: 'var(--surface-3)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${result.score}%`, background: gc.text, borderRadius: 99 }} />
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: gc.text, fontWeight: 700 }}>
            {Math.round(result.score)}
          </span>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', userSelect: 'none' }}>
          {open ? '▲' : '▼'}
        </span>
      </div>

      {open && (
        <div style={{ borderTop: `1px solid ${gc.border}`, padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {result.windows.length > 0 && (
            <div>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--teal)', fontFamily: 'var(--font-display)', marginBottom: 3 }}>✓ Auspicious windows</div>
              {result.windows.map(w => (
                <div key={w} style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', paddingLeft: 8 }}>{w}</div>
              ))}
            </div>
          )}
          <div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--rose)', fontFamily: 'var(--font-display)', marginBottom: 3 }}>✗ Avoid</div>
            {result.avoid.map(a => (
              <div key={a} style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', paddingLeft: 8 }}>{a}</div>
            ))}
          </div>
          {result.personal && (
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.4rem' }}>
                <div style={{ padding: '0.5rem', background: 'var(--surface-3)', borderRadius: '6px' }}>
                   <div style={{ fontSize: '0.6rem', opacity: 0.6, textTransform: 'uppercase' }}>Tara Bala</div>
                   <div style={{ fontSize: '0.85rem', fontWeight: 700, color: result.personal.taraBala.score > 50 ? 'var(--teal)' : 'var(--rose)' }}>{result.personal.taraBala.name}</div>
                </div>
                <div style={{ padding: '0.5rem', background: 'var(--surface-3)', borderRadius: '6px' }}>
                   <div style={{ fontSize: '0.6rem', opacity: 0.6, textTransform: 'uppercase' }}>Chandra Bala</div>
                   <div style={{ fontSize: '0.85rem', fontWeight: 700, color: result.personal.chandraBala.score > 50 ? 'var(--teal)' : 'var(--rose)' }}>{result.personal.chandraBala.position}th Pos</div>
                </div>
             </div>
          )}
          <div style={{ borderTop: '1px solid var(--border-soft)', paddingTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {result.reasons.map(r => (
              <div key={r} style={{
                fontSize: '0.75rem', fontFamily: 'var(--font-display)',
                color: r.startsWith('✓') ? 'var(--teal)' : r.startsWith('✗') ? 'var(--rose)' : 'var(--text-muted)',
              }}>{r}</div>
            ))}
          </div>
          <Link href={`/panchang?date=${result.date}`} style={{
            display: 'inline-block', fontSize: '0.72rem',
            color: 'var(--text-gold)', textDecoration: 'none',
            fontFamily: 'var(--font-display)', fontWeight: 600,
          }}>
            Full Pañcāṅga for this day →
          </Link>
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────
export default function MuhurtaPage() {
  const { chart } = useChart()
  const today = todayIST()
  const [purpose,   setPurpose]   = useState('GENERAL')
  const [fromDate,  setFromDate]  = useState(today)
  const [toDate,    setToDate]    = useState(addDays(today, 30))
  const [results,   setResults]   = useState<MuhurtaResult[]>([])
  const [loading,   setLoading]   = useState(false)
  const [progress,  setProgress]  = useState(0)
  const [error,     setError]     = useState<string | null>(null)
  const [minGrade,  setMinGrade]  = useState<'A' | 'B' | 'C' | 'D'>('B')

  const [location, setLocation] = useState<LocationValue>(getSavedLocation)
  const [timelineData, setTimelineData] = useState<any[]>([])
  const [timelineLoading, setTimelineLoading] = useState(false)

  // Fetch 24h timeline
  const fetchTimeline = useCallback(async () => {
    setTimelineLoading(true)
    try {
      const natalNak = chart?.panchang?.nakshatra?.index ?? 0
      const natalSign = chart?.grahas.find(g => g.id === 'Mo')?.rashi ?? 1
      const res = await fetch(`/api/muhurta/timeline?lat=${location.lat}&lng=${location.lng}&tz=${encodeURIComponent(location.tz)}&natalNak=${natalNak}&natalSign=${natalSign}`)
      const data = await res.json()
      if (Array.isArray(data)) setTimelineData(data)
    } catch (e) {
      console.error(e)
    } finally {
      setTimelineLoading(false)
    }
  }, [location, chart])

  useEffect(() => {
    fetchTimeline()
  }, [fetchTimeline])

  const findMuhurta = useCallback(async () => {
    setLoading(true)
    setError(null)
    setResults([])
    setProgress(0)

    const dates: string[] = []
    const natal = chart ? { 
      moonNak: chart.grahas.find(g => g.id === 'Mo')?.nakshatraIndex ?? 0,
      moonSign: chart.grahas.find(g => g.id === 'Mo')?.rashi ?? 1
    } : undefined

    let d = fromDate
    while (d <= toDate && dates.length < 60) {
      dates.push(d)
      d = addDays(d, 1)
    }

    const scored: MuhurtaResult[] = []

    for (let i = 0; i < dates.length; i += 5) {
      const batch = dates.slice(i, i + 5)
      await Promise.all(batch.map(async (date) => {
        try {
          const res  = await fetch(`/api/panchang?date=${date}&lat=${location.lat}&lng=${location.lng}&tz=${encodeURIComponent(location.tz)}`)
          const json = await res.json()
          if (json.success) {
            const result = scorePanchang(json.data, purpose, natal || { moonNak: 0, moonSign: 1 })
            scored.push(result)
          }
        } catch { }
      }))
      setProgress(Math.round(((i + i/batch.length) / dates.length) * 100))
    }

    const minScoreMap: Record<'A'|'B'|'C'|'D', number> = { A: 75, B: 55, C: 35, D: 0 }
    const minScore = minScoreMap[minGrade]
    const filtered = scored
      .filter(r => r.score >= minScore)
      .sort((a, b) => b.score - a.score)

    setResults(filtered)
    setLoading(false)
    setProgress(100)
  }, [fromDate, toDate, purpose, minGrade, location, chart])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-page)' }}>
      <header style={{
        padding: '0 2rem', height: '3.75rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        backdropFilter: 'blur(16px)', position: 'sticky', top: 0, zIndex: 50,
        background: 'var(--header-bg)', borderBottom: '1px solid var(--border-soft)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
            <span style={{ fontSize: '1.2rem' }}>🪐</span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-gold)' }}>Vedaansh</span>
          </Link>
          <span style={{ color: 'var(--border)' }}>|</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', color: 'var(--text-gold)', fontWeight: 600 }}>
            Muhūrta Finder
          </span>
        </div>
        <nav style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Link href="/panchang" style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', color: 'var(--text-secondary)', textDecoration: 'none' }}>Daily Pañcāṅga</Link>
          <ThemeToggle />
        </nav>
      </header>

      <main style={{ flex: 1, maxWidth: 820, width: '100%', margin: '0 auto', padding: 'clamp(1rem,3vw,2rem)', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Advanced Personal Timeline */}
        <section>
          <MuhurtaTimeline data={timelineData} loading={timelineLoading} />
        </section>

        <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            Find Auspicious Times
          </h1>
          <div>
            <label style={{ fontSize: '0.72rem' }}>Purpose</label>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
              {PURPOSES.map(({ id, label, icon }) => (
                <button key={id} onClick={() => setPurpose(id)} style={{
                  padding: '0.35rem 0.75rem',
                  background: purpose === id ? 'rgba(201,168,76,0.15)' : 'var(--surface-2)',
                  border: `1px solid ${purpose === id ? 'var(--border-bright)' : 'var(--border)'}`,
                  borderRadius: 'var(--r-md)', cursor: 'pointer',
                  fontFamily: 'var(--font-display)', fontSize: '0.8rem',
                  fontWeight: purpose === id ? 700 : 400,
                  color: purpose === id ? 'var(--text-gold)' : 'var(--text-secondary)',
                }}>
                  {icon} {label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, minWidth: 140 }}>
              <label style={{ fontSize: '0.72rem' }}>From</label>
              <input type="date" className="input" value={fromDate} min={today}
                onChange={e => setFromDate(e.target.value)} style={{ marginTop: '0.35rem' }} />
            </div>
            <div style={{ flex: 1, minWidth: 140 }}>
              <label style={{ fontSize: '0.72rem' }}>To (max 60 days)</label>
              <input type="date" className="input" value={toDate} min={fromDate}
                onChange={e => setToDate(e.target.value)} style={{ marginTop: '0.35rem' }} />
            </div>
            <div style={{ flex: 1, minWidth: 120 }}>
              <label style={{ fontSize: '0.72rem' }}>Min grade</label>
              <select className="input" value={minGrade} onChange={e => setMinGrade(e.target.value as any)} style={{ marginTop: '0.35rem' }}>
                <option value="A">A — Excellent only</option>
                <option value="B">B — Good & above</option>
                <option value="C">C — Average & above</option>
                <option value="D">D — All days</option>
              </select>
            </div>
          </div>
          <div style={{ maxWidth: 320 }}>
            <LocationPicker value={location} onChange={setLocation} label="📍 Location" />
          </div>
          <button onClick={findMuhurta} disabled={loading} className="btn btn-primary" style={{ alignSelf: 'flex-start', padding: '0.6rem 1.5rem' }}>
            {loading ? <><span className="spin-loader" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /> Searching…</> : '🔍 Find Muhūrta'}
          </button>
        </div>
        {loading && (
          <div>
            <div style={{ height: 4, background: 'var(--surface-3)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: 'var(--gold)', borderRadius: 99, transition: 'width 0.3s' }} />
            </div>
          </div>
        )}
        {!loading && results.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {results.map(r => <ResultCard key={r.date} result={r} />)}
          </div>
        )}
      </main>
    </div>
  )
}