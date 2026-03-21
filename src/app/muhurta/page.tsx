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

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { LocationPicker, DELHI_DEFAULT, type LocationValue } from '@/components/ui/LocationPicker'

// ── Types ─────────────────────────────────────────────────────
interface DayPanchang {
  date:      string
  vara:      { name: string; lord: string; number: number }
  tithi:     { name: string; paksha: string; number: number }
  nakshatra: { name: string; lord: string; pada: number }
  yoga:      { name: string; quality: string }
  karana:    { name: string; isBhadra: boolean }
  sunrise:   string
  sunset:    string
  rahuKalam:      { start: string; end: string }
  gulikaKalam:    { start: string; end: string }
  abhijitMuhurta: { start: string; end: string } | null
}

interface MuhurtaResult {
  date:    string
  score:   number          // 0–100
  grade:   'A' | 'B' | 'C' | 'D'
  windows: string[]        // Auspicious time windows
  avoid:   string[]        // Inauspicious times to avoid
  reasons: string[]        // Why this day is good/bad
  panchang: DayPanchang
}

// ── Purpose definitions ───────────────────────────────────────
const PURPOSES = [
  { id: 'marriage',      label: 'Marriage / Vivāha',       icon: '💍' },
  { id: 'business',      label: 'Business Start',           icon: '💼' },
  { id: 'travel',        label: 'Travel / Journey',         icon: '✈️' },
  { id: 'education',     label: 'Education / Vidyārambha',  icon: '📚' },
  { id: 'medical',       label: 'Medical / Surgery',        icon: '🏥' },
  { id: 'property',      label: 'Property / Gṛhapravesh',  icon: '🏠' },
  { id: 'general',       label: 'General Auspicious',       icon: '✨' },
]

// ── Scoring rules per purpose ─────────────────────────────────
const PURPOSE_RULES: Record<string, {
  goodVara: number[]       // vara numbers (0=Sun…6=Sat)
  goodNak: string[]        // nakshatra names
  badTithi: number[]       // tithi numbers to avoid
  goodTithi: number[]      // preferred tithi numbers
}> = {
  marriage: {
    goodVara:  [1, 3, 4, 5],   // Mon, Wed, Thu, Fri
    goodNak:   ['Rohini','Mrigashira','Magha','Uttara Phalguni','Hasta','Swati','Anuradha','Mula','Uttara Ashadha','Uttara Bhadrapada','Revati'],
    badTithi:  [4, 8, 9, 12, 14, 15, 30],
    goodTithi: [2, 3, 5, 7, 10, 11, 13],
  },
  business: {
    goodVara:  [1, 3, 4, 5],   // Mon, Wed, Thu, Fri
    goodNak:   ['Rohini','Pushya','Hasta','Chitra','Anuradha','Shravana','Dhanishtha','Shatabhisha'],
    badTithi:  [4, 8, 12, 14],
    goodTithi: [2, 3, 5, 6, 7, 10, 11, 13],
  },
  travel: {
    goodVara:  [1, 3, 4],      // Mon, Wed, Thu
    goodNak:   ['Ashwini','Mrigashira','Punarvasu','Pushya','Hasta','Jyeshtha','Mula','Shravana'],
    badTithi:  [4, 8, 12, 14, 15],
    goodTithi: [2, 3, 5, 7, 11, 13],
  },
  education: {
    goodVara:  [1, 3, 4],      // Mon, Wed, Thu
    goodNak:   ['Rohini','Mrigashira','Punarvasu','Hasta','Chitra','Swati','Anuradha','Shravana'],
    badTithi:  [4, 8, 12, 14],
    goodTithi: [2, 5, 6, 7, 10, 11],
  },
  medical: {
    goodVara:  [1, 3],         // Mon, Wed (avoid surgery on Tue/Sat)
    goodNak:   ['Ashwini','Pushya','Hasta','Uttara Phalguni','Uttara Ashadha','Shravana'],
    badTithi:  [4, 8, 9, 12, 14],
    goodTithi: [1, 2, 3, 6, 7, 10, 11, 13],
  },
  property: {
    goodVara:  [1, 3, 4, 5],   // Mon, Wed, Thu, Fri
    goodNak:   ['Rohini','Uttara Phalguni','Hasta','Uttara Ashadha','Uttara Bhadrapada'],
    badTithi:  [4, 8, 12, 14],
    goodTithi: [2, 3, 5, 7, 10, 13],
  },
  general: {
    goodVara:  [1, 3, 4, 5],
    goodNak:   ['Rohini','Mrigashira','Pushya','Uttara Phalguni','Hasta','Chitra','Swati','Anuradha','Shravana','Dhanishtha','Revati'],
    badTithi:  [4, 8, 12, 14],
    goodTithi: [2, 3, 5, 7, 10, 11, 13],
  },
}

// ── Scoring function ──────────────────────────────────────────
function scorePanchang(p: DayPanchang, purpose: string): MuhurtaResult {
  const rules = PURPOSE_RULES[purpose] ?? PURPOSE_RULES.general
  let score = 50
  const reasons: string[] = []
  const windows: string[] = []
  const avoid:   string[] = []

  // Yoga
  if (p.yoga.quality === 'auspicious')    { score += 15; reasons.push(`✓ Auspicious yoga: ${p.yoga.name}`) }
  if (p.yoga.quality === 'inauspicious')  { score -= 15; reasons.push(`✗ Inauspicious yoga: ${p.yoga.name}`) }

  // Vara
  if (rules.goodVara.includes(p.vara.number)) { score += 10; reasons.push(`✓ Favorable weekday: ${p.vara.name}`) }
  else if (p.vara.number === 2 || p.vara.number === 6) { score -= 10; reasons.push(`✗ Avoid ${p.vara.name} for this purpose`) }

  // Nakshatra
  if (rules.goodNak.includes(p.nakshatra.name)) { score += 15; reasons.push(`✓ Favorable nakshatra: ${p.nakshatra.name}`) }

  // Tithi
  if (rules.goodTithi.includes(p.tithi.number)) { score += 10; reasons.push(`✓ Favorable tithi: ${p.tithi.name}`) }
  if (rules.badTithi.includes(p.tithi.number))  { score -= 15; reasons.push(`✗ Avoid tithi ${p.tithi.number}: ${p.tithi.name}`) }

  // Bhadra
  if (p.karana.isBhadra) { score -= 10; reasons.push(`✗ Bhadra karaṇa — avoid auspicious acts`) }

  // Abhijit window (always auspicious if available)
  if (p.abhijitMuhurta) {
    windows.push(`Abhijit Muhūrta: ${fmtTime(p.abhijitMuhurta.start)} – ${fmtTime(p.abhijitMuhurta.end)}`)
    score += 5
  }

  // Rahu / Gulika to avoid
  avoid.push(`Rāhu Kālam: ${fmtTime(p.rahuKalam.start)} – ${fmtTime(p.rahuKalam.end)}`)
  avoid.push(`Gulikā: ${fmtTime(p.gulikaKalam.start)} – ${fmtTime(p.gulikaKalam.end)}`)

  // Sunrise window (morning is generally auspicious)
  windows.push(`Morning window: ${fmtTime(p.sunrise)} – ${addMinutes(p.sunrise, 96)}`)

  score = Math.max(0, Math.min(100, score))
  const grade: 'A' | 'B' | 'C' | 'D' =
    score >= 75 ? 'A' : score >= 55 ? 'B' : score >= 35 ? 'C' : 'D'

  return { date: p.date, score, grade, windows, avoid, reasons, panchang: p }
}

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
        {/* Grade badge */}
        <div style={{
          width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
          background: gc.bg, border: `2px solid ${gc.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-display)', fontSize: '1.2rem',
          fontWeight: 700, color: gc.text,
        }}>
          {result.grade}
        </div>

        {/* Date */}
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {fmtDateShort(result.date)}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>
            {result.panchang.tithi.name} · {result.panchang.nakshatra.name} · {result.panchang.yoga.name}
          </div>
        </div>

        {/* Score bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 80, height: 6, background: 'var(--surface-3)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${result.score}%`, background: gc.text, borderRadius: 99 }} />
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: gc.text, fontWeight: 700 }}>
            {result.score}
          </span>
        </div>

        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', userSelect: 'none' }}>
          {open ? '▲' : '▼'}
        </span>
      </div>

      {open && (
        <div style={{ borderTop: `1px solid ${gc.border}`, padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {/* Auspicious windows */}
          {result.windows.length > 0 && (
            <div>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--teal)', fontFamily: 'var(--font-display)', marginBottom: 3 }}>✓ Auspicious windows</div>
              {result.windows.map(w => (
                <div key={w} style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', paddingLeft: 8 }}>{w}</div>
              ))}
            </div>
          )}
          {/* Avoid */}
          <div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--rose)', fontFamily: 'var(--font-display)', marginBottom: 3 }}>✗ Avoid</div>
            {result.avoid.map(a => (
              <div key={a} style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', paddingLeft: 8 }}>{a}</div>
            ))}
          </div>
          {/* Reasons */}
          <div style={{ borderTop: '1px solid var(--border-soft)', paddingTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {result.reasons.map(r => (
              <div key={r} style={{
                fontSize: '0.75rem', fontFamily: 'var(--font-display)',
                color: r.startsWith('✓') ? 'var(--teal)' : r.startsWith('✗') ? 'var(--rose)' : 'var(--text-muted)',
              }}>{r}</div>
            ))}
          </div>
          {/* Link to daily panchang */}
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
  const today = todayIST()
  const [purpose,   setPurpose]   = useState('general')
  const [fromDate,  setFromDate]  = useState(today)
  const [toDate,    setToDate]    = useState(addDays(today, 30))
  const [results,   setResults]   = useState<MuhurtaResult[]>([])
  const [loading,   setLoading]   = useState(false)
  const [progress,  setProgress]  = useState(0)
  const [error,     setError]     = useState<string | null>(null)
  const [minGrade,  setMinGrade]  = useState<'A' | 'B' | 'C' | 'D'>('B')

  const [location, setLocation] = useState<LocationValue>(DELHI_DEFAULT)

  const findMuhurta = useCallback(async () => {
    setLoading(true)
    setError(null)
    setResults([])
    setProgress(0)

    // Collect all dates in range
    const dates: string[] = []
    let d = fromDate
    while (d <= toDate && dates.length < 60) {   // max 60 days
      dates.push(d)
      d = addDays(d, 1)
    }

    const scored: MuhurtaResult[] = []

    // Fetch in batches of 5
    for (let i = 0; i < dates.length; i += 5) {
      const batch = dates.slice(i, i + 5)
      await Promise.all(batch.map(async (date) => {
        try {
          const res  = await fetch(`/api/panchang?date=${date}&lat=${location.lat}&lng=${location.lng}&tz=${encodeURIComponent(location.tz)}`)
          const json = await res.json()
          if (json.success) {
            const result = scorePanchang(json.data, purpose)
            scored.push(result)
          }
        } catch { /* skip failed days */ }
      }))
      setProgress(Math.round(((i + 5) / dates.length) * 100))
    }

    // Sort by score descending, filter by grade
    const minScoreMap: Record<'A'|'B'|'C'|'D', number> = { A: 75, B: 55, C: 35, D: 0 }
    const minScore = minScoreMap[minGrade as 'A'|'B'|'C'|'D']
    const filtered = scored
      .filter(r => r.score >= minScore)
      .sort((a, b) => b.score - a.score)

    setResults(filtered)
    setLoading(false)
    setProgress(100)
  }, [fromDate, toDate, purpose, minGrade, location.lat, location.lng, location.tz])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-page)' }}>

      {/* Header */}
      <header style={{
        padding: '0 2rem', height: '3.75rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        backdropFilter: 'blur(16px)', position: 'sticky', top: 0, zIndex: 50,
        background: 'var(--header-bg)', borderBottom: '1px solid var(--border-soft)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
            <span style={{ fontSize: '1.2rem' }}>🪐</span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-gold)' }}>Vedic Amrit</span>
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

      <main style={{ flex: 1, maxWidth: 820, width: '100%', margin: '0 auto', padding: 'clamp(1rem,3vw,2rem)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* Search panel */}
        <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            Find Auspicious Times
          </h1>

          {/* Purpose */}
          <div>
            <label style={{ fontSize: '0.72rem' }}>Purpose</label>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
              {PURPOSES.map(({ id, label, icon }) => (
                <button
                  key={id}
                  onClick={() => setPurpose(id)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    background: purpose === id ? 'rgba(201,168,76,0.15)' : 'var(--surface-2)',
                    border: `1px solid ${purpose === id ? 'var(--border-bright)' : 'var(--border)'}`,
                    borderRadius: 'var(--r-md)', cursor: 'pointer',
                    fontFamily: 'var(--font-display)', fontSize: '0.8rem',
                    fontWeight: purpose === id ? 700 : 400,
                    color: purpose === id ? 'var(--text-gold)' : 'var(--text-secondary)',
                  }}
                >
                  {icon} {label}
                </button>
              ))}
            </div>
          </div>

          {/* Date range + filters */}
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
              <select className="input" value={minGrade} onChange={e => setMinGrade(e.target.value as 'A'|'B'|'C'|'D')} style={{ marginTop: '0.35rem' }}>
                <option value="A">A — Excellent only</option>
                <option value="B">B — Good & above</option>
                <option value="C">C — Average & above</option>
                <option value="D">D — All days</option>
              </select>
            </div>
          </div>

          {/* Location */}
          <div style={{ maxWidth: 320 }}>
            <LocationPicker value={location} onChange={setLocation} label="📍 Location" />
          </div>

          <button
            onClick={findMuhurta}
            disabled={loading}
            className="btn btn-primary"
            style={{ alignSelf: 'flex-start', padding: '0.6rem 1.5rem' }}
          >
            {loading ? (
              <><span className="spin-loader" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /> Searching…</>
            ) : '🔍 Find Muhūrta'}
          </button>
        </div>

        {/* Progress */}
        {loading && (
          <div>
            <div style={{ height: 4, background: 'var(--surface-3)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: 'var(--gold)', borderRadius: 99, transition: 'width 0.3s' }} />
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
              Scanning {progress}%…
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ padding: '1rem', background: 'rgba(224,123,142,0.08)', border: '1px solid rgba(224,123,142,0.25)', borderRadius: 'var(--r-md)', color: 'var(--rose)', fontFamily: 'var(--font-display)' }}>
            {error}
          </div>
        )}

        {/* Results */}
        {!loading && results.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {results.length} auspicious day{results.length !== 1 ? 's' : ''} found
              </span>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                {(['A','B','C','D'] as const).map(g => {
                  const count = results.filter(r => r.grade === g).length
                  if (!count) return null
                  return (
                    <span key={g} style={{ padding: '0.1rem 0.45rem', borderRadius: 99, fontSize: '0.68rem', fontWeight: 700, background: GRADE_COLOR[g].bg, color: GRADE_COLOR[g].text, border: `1px solid ${GRADE_COLOR[g].border}`, fontFamily: 'var(--font-display)' }}>
                      {g}: {count}
                    </span>
                  )
                })}
              </div>
            </div>
            {results.map(r => <ResultCard key={r.date} result={r} />)}
          </div>
        )}

        {!loading && results.length === 0 && progress === 100 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>
            No auspicious days found with grade {minGrade} or better in this range. Try widening the date range or lowering the minimum grade.
          </div>
        )}

      </main>

      <footer style={{
        padding: '1rem 2rem', borderTop: '1px solid var(--border-soft)',
        textAlign: 'center', color: 'var(--text-muted)',
        fontFamily: 'var(--font-display)', fontSize: '0.8rem',
      }}>
        Muhūrta per classical Vedic principles · <span style={{ color: 'var(--text-gold)' }}>Swiss Ephemeris</span> · {location.name}
      </footer>
    </div>
  )
}