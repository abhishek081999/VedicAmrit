'use client'
// ─────────────────────────────────────────────────────────────
//  src/app/panchang/calendar/page.tsx
//  Monthly Panchang Calendar
//  Shows Tithi, Nakshatra, Vara, Yoga for every day of a month
//  Fetches each day on demand, cached by Redis server-side
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { useChart } from '@/components/providers/ChartProvider'
import { LocationPicker, getSavedLocation, type LocationValue } from '@/components/ui/LocationPicker'

// ── Types ─────────────────────────────────────────────────────
interface DayData {
  date:      string
  vara:      { name: string; lord: string; number: number }
  tithi:     { name: string; paksha: string; number: number; percent: number }
  nakshatra: { name: string; pada: number; lord: string }
  yoga:      { name: string; quality: string }
  karana:    { name: string; isBhadra: boolean }
  sunrise:   string
  sunset:    string
}

type DayMap = Record<string, DayData | 'loading' | 'error'>

// ── Constants ─────────────────────────────────────────────────
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]
const WEEKDAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

const VARA_COLOR: Record<number, string> = {
  0: '#e8a730',  // Sun — gold
  1: '#b0c8e0',  // Moon — silver
  2: '#e05050',  // Mars — red
  3: '#50c878',  // Mercury — green
  4: '#f5d06e',  // Jupiter — yellow
  5: '#f0a0c0',  // Venus — pink
  6: '#9988cc',  // Saturn — purple
}

const YOGA_COLOR: Record<string, string> = {
  auspicious:   'rgba(78,205,196,0.18)',
  inauspicious: 'rgba(224,123,142,0.14)',
  neutral:      'transparent',
}

const PAKSHA_SYMBOL: Record<string, string> = {
  shukla:  '🌕', // waxing
  krishna: '🌑', // waning
}

// ── Helpers ───────────────────────────────────────────────────
function todayIST(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date())
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function firstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

function fmtTime(iso: string): string {
  const d   = new Date(iso)
  const hrs = d.getHours()
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${hrs % 12 || 12}:${min} ${hrs >= 12 ? 'PM' : 'AM'}`
}

function dateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

// ── Day cell ──────────────────────────────────────────────────
function DayCell({
  date, day, isToday, data, onClick, selected,
}: {
  key?:     string
  date:     string
  day:      number
  isToday:  boolean
  data:     DayData | 'loading' | 'error' | undefined
  onClick:  () => void
  selected: boolean
}) {
  const isLoading = data === 'loading'
  const isError   = data === 'error'
  const d         = typeof data === 'object' ? data : null
  const varaCol   = d ? (VARA_COLOR[d.vara.number] ?? 'var(--gold)') : 'var(--border)'
  const yogaBg    = d ? (YOGA_COLOR[d.yoga.quality] ?? 'transparent') : 'transparent'

  return (
    <div
      onClick={onClick}
      style={{
        minHeight: 90,
        background: selected
          ? 'rgba(139,124,246,0.15)'
          : isToday
          ? 'rgba(201,168,76,0.08)'
          : yogaBg || 'var(--surface-1)',
        border: `1px solid ${selected ? 'rgba(139,124,246,0.50)' : isToday ? 'rgba(201,168,76,0.45)' : 'var(--border-soft)'}`,
        borderTop: `3px solid ${isLoading || isError ? 'var(--border)' : varaCol}`,
        borderRadius: 'var(--r-sm)',
        padding: '0.35rem 0.4rem',
        cursor: 'pointer',
        transition: 'border-color 0.15s, background 0.15s',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        overflow: 'hidden',
      }}
    >
      {/* Day number */}
      <div style={{
        fontSize: '0.82rem',
        fontWeight: isToday ? 700 : 500,
        fontFamily: 'var(--font-mono)',
        color: isToday ? 'var(--text-gold)' : 'var(--text-primary)',
      }}>
        {day}
      </div>

      {isLoading && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spin-loader" style={{
            width: 12, height: 12,
            border: '2px solid var(--border)',
            borderTopColor: 'var(--gold)',
          }} />
        </div>
      )}

      {d && (
        <>
          {/* Tithi */}
          <div style={{
            fontSize: '0.65rem', fontWeight: 600,
            fontFamily: 'var(--font-display)',
            color: d.tithi.paksha === 'shukla' ? 'var(--text-gold)' : 'var(--text-muted)',
            lineHeight: 1.2,
            display: 'flex', alignItems: 'center', gap: 2,
          }}>
            <span>{PAKSHA_SYMBOL[d.tithi.paksha]}</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {d.tithi.name}
            </span>
          </div>

          {/* Nakshatra */}
          <div style={{
            fontSize: '0.6rem', color: 'var(--text-secondary)',
            fontFamily: 'var(--font-display)', fontStyle: 'italic',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            ⭐ {d.nakshatra.name} P{d.nakshatra.pada}
          </div>

          {/* Yoga */}
          <div style={{
            fontSize: '0.58rem', color: d.yoga.quality === 'auspicious'
              ? 'var(--teal)' : d.yoga.quality === 'inauspicious'
              ? 'var(--rose)' : 'var(--text-muted)',
            fontFamily: 'var(--font-display)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            ☯ {d.yoga.name}
          </div>

          {/* Bhadra warning */}
          {d.karana.isBhadra && (
            <div style={{ fontSize: '0.55rem', color: 'var(--rose)', fontWeight: 700 }}>
              ⚠ Bhadra
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Day detail panel ──────────────────────────────────────────
function DayDetail({ data, date }: { data: DayData; date: string }) {
  const d = new Date(date + 'T12:00:00Z')
  const label = `${WEEKDAYS[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`

  const items = [
    { icon: '☀',  label: 'Vara',      value: `${data.vara.name}`,          sub: `Lord: ${data.vara.lord}` },
    { icon: '🌙', label: 'Tithi',     value: data.tithi.name,               sub: data.tithi.paksha === 'shukla' ? 'Śukla Pakṣa' : 'Kṛṣṇa Pakṣa' },
    { icon: '⭐', label: 'Nakshatra', value: data.nakshatra.name,           sub: `Pada ${data.nakshatra.pada} · ${data.nakshatra.lord}` },
    { icon: '☯',  label: 'Yoga',      value: data.yoga.name,                sub: data.yoga.quality },
    { icon: '✦',  label: 'Karaṇa',   value: data.karana.name,              sub: data.karana.isBhadra ? '⚠ Bhadra' : '' },
    { icon: '🌅', label: 'Sunrise',   value: fmtTime(data.sunrise),         sub: '' },
    { icon: '🌇', label: 'Sunset',    value: fmtTime(data.sunset),          sub: '' },
  ]

  return (
    <div style={{
      background: 'var(--surface-1)',
      border: '1px solid var(--border-bright)',
      borderRadius: 'var(--r-lg)',
      padding: '1.1rem',
      display: 'flex', flexDirection: 'column', gap: '0.75rem',
    }}>
      <div style={{
        fontFamily: 'var(--font-display)', fontSize: '0.95rem',
        fontWeight: 600, color: 'var(--text-primary)',
        borderBottom: '1px solid var(--border-soft)', paddingBottom: '0.5rem',
      }}>
        {label}
      </div>
      {items.map(({ icon, label: l, value, sub }) => (
        <div key={l} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '0.8rem', width: 18, flexShrink: 0 }}>{icon}</span>
          <div>
            <div style={{
              fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: 'var(--text-muted)',
              fontFamily: 'var(--font-display)',
            }}>{l}</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
              {value}
            </div>
            {sub && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic', fontFamily: 'var(--font-display)' }}>{sub}</div>}
          </div>
        </div>
      ))}
      <Link
        href={`/panchang?date=${date}`}
        style={{
          display: 'block', textAlign: 'center',
          padding: '0.4rem', background: 'rgba(201,168,76,0.08)',
          border: '1px solid var(--border-bright)',
          borderRadius: 'var(--r-md)', textDecoration: 'none',
          fontFamily: 'var(--font-display)', fontSize: '0.78rem',
          fontWeight: 600, color: 'var(--text-gold)',
          marginTop: '0.25rem',
        }}
      >
        Full Pañcāṅga →
      </Link>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────
export default function MonthlyPanchangPage() {
  const { chart } = useChart()
  const today      = todayIST()
  const todayYear  = parseInt(today.slice(0, 4))
  const todayMonth = parseInt(today.slice(5, 7)) - 1

  const [year,     setYear]     = useState(todayYear)
  const [month,    setMonth]    = useState(todayMonth)
  const [dayMap,   setDayMap]   = useState<DayMap>({})
  const [selected, setSelected] = useState<string | null>(today)
  const fetchQueue = useRef<Set<string>>(new Set())

  const [location, setLocation] = useState<LocationValue>(getSavedLocation)

  // Fetch a single day
  const fetchDay = useCallback(async (date: string) => {
    if (fetchQueue.current.has(date)) return
    fetchQueue.current.add(date)

    setDayMap(prev => ({ ...prev, [date]: 'loading' }))
    try {
      const res  = await fetch(`/api/panchang?date=${date}&lat=${location.lat}&lng=${location.lng}&tz=${encodeURIComponent(location.tz)}`)
      const json = await res.json()
      if (json.success) {
        setDayMap(prev => ({ ...prev, [date]: json.data }))
      } else {
        setDayMap(prev => ({ ...prev, [date]: 'error' }))
      }
    } catch {
      setDayMap(prev => ({ ...prev, [date]: 'error' }))
    }
  }, [location.lat, location.lng, location.tz])

  // Fetch all days of the current month
  useEffect(() => {
    const days = daysInMonth(year, month)
    for (let d = 1; d <= days; d++) {
      const date = dateStr(year, month, d)
      if (!dayMap[date]) fetchDay(date)
    }
  }, [year, month]) // eslint-disable-line react-hooks/exhaustive-deps

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
    setSelected(null)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
    setSelected(null)
  }

  const totalDays  = daysInMonth(year, month)
  const firstDay   = firstDayOfMonth(year, month)
  const selectedData = selected ? dayMap[selected] : null

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
            <Image src="/veda-icon.png" alt="Vedaansh" width={22} height={22} style={{ objectFit: 'contain' }} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-gold)' }}>Vedaansh</span>
          </Link>
          <span style={{ color: 'var(--border)', fontSize: '1rem' }}>|</span>
          <Link href="/panchang" style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', color: 'var(--text-secondary)', textDecoration: 'none' }}>
            Daily Pañcāṅga
          </Link>
        </div>
        <ThemeToggle />
      </header>

      <main style={{ flex: 1, maxWidth: 1100, width: '100%', margin: '0 auto', padding: 'clamp(1rem,3vw,2rem)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* Month navigator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={prevMonth} style={{
            background: 'var(--surface-2)', border: '1px solid var(--border)',
            borderRadius: 'var(--r-md)', padding: '0.4rem 0.9rem',
            cursor: 'pointer', color: 'var(--text-secondary)',
            fontFamily: 'var(--font-display)', fontSize: '1rem',
          }}>← Prev</button>

          <div style={{ flex: 1, textAlign: 'center' }}>
            <h1 style={{
              fontFamily: 'var(--font-display)', fontSize: 'clamp(1.2rem, 3vw, 1.75rem)',
              fontWeight: 600, color: 'var(--text-primary)', margin: 0,
            }}>
              {MONTHS[month]} {year}
            </h1>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
              <LocationPicker
                value={location}
                onChange={(loc) => { setLocation(loc); setDayMap({}) }}
                label=""
                birthLocation={chart ? { lat: chart.meta.latitude, lng: chart.meta.longitude, tz: chart.meta.timezone, name: chart.meta.birthPlace } : null}
              />
            </div>
          </div>

          <button onClick={nextMonth} style={{
            background: 'var(--surface-2)', border: '1px solid var(--border)',
            borderRadius: 'var(--r-md)', padding: '0.4rem 0.9rem',
            cursor: 'pointer', color: 'var(--text-secondary)',
            fontFamily: 'var(--font-display)', fontSize: '1rem',
          }}>Next →</button>

          {(year !== todayYear || month !== todayMonth) && (
            <button onClick={() => { setYear(todayYear); setMonth(todayMonth); setSelected(today) }} style={{
              background: 'rgba(201,168,76,0.10)', border: '1px solid rgba(201,168,76,0.30)',
              borderRadius: 'var(--r-md)', padding: '0.4rem 0.8rem',
              cursor: 'pointer', color: 'var(--text-gold)',
              fontFamily: 'var(--font-display)', fontSize: '0.85rem', fontWeight: 600,
            }}>Today</button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>

          {/* Calendar grid */}
          <div style={{ flex: '1 1 600px', minWidth: 0 }}>
            {/* Weekday headers */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 4, marginBottom: 4,
            }}>
              {WEEKDAYS.map((d, i) => (
                <div key={d} style={{
                  textAlign: 'center',
                  fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.07em',
                  textTransform: 'uppercase',
                  color: i === 0 ? 'var(--rose)' : i === 6 ? 'var(--accent)' : 'var(--text-muted)',
                  fontFamily: 'var(--font-display)',
                  padding: '0.3rem 0',
                }}>
                  {d}
                </div>
              ))}
            </div>

            {/* Day grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
              {/* Empty cells before first day */}
              {Array.from({ length: firstDay }, (_, i) => (
                <div key={`empty-${i}`} style={{ minHeight: 90 }} />
              ))}

              {/* Day cells */}
              {Array.from({ length: totalDays }, (_, i) => {
                const day  = i + 1
                const date = dateStr(year, month, day)
                return (
                  <DayCell
                    key={date}
                    date={date}
                    day={day}
                    isToday={date === today}
                    data={dayMap[date]}
                    selected={selected === date}
                    onClick={() => setSelected(date === selected ? null : date)}
                  />
                )
              })}
            </div>
          </div>

          {/* Detail panel */}
          <div style={{ flex: '0 0 220px', minWidth: 200, position: 'sticky', top: '5rem' }}>
            {/* Legend */}
            <div style={{
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)', padding: '0.75rem',
              marginBottom: '0.75rem',
              display: 'flex', flexDirection: 'column', gap: '0.4rem',
            }}>
              <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', marginBottom: 2 }}>Legend</div>
              {[
                { color: 'rgba(78,205,196,0.30)',  label: 'Auspicious yoga' },
                { color: 'rgba(224,123,142,0.20)', label: 'Inauspicious yoga' },
                { color: 'rgba(201,168,76,0.20)',  label: 'Today' },
                { color: 'rgba(139,124,246,0.25)', label: 'Selected' },
              ].map(({ color, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: color, flexShrink: 0 }} />
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>{label}</span>
                </div>
              ))}
              <div style={{ marginTop: 4, fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>
                Top border = Vara (weekday lord color)
              </div>
            </div>

            {/* Selected day detail */}
            {selected && selectedData && typeof selectedData === 'object' && (
              <DayDetail data={selectedData} date={selected} />
            )}

            {selected && selectedData === 'loading' && (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                <div className="spin-loader" style={{ width: 24, height: 24, margin: '0 auto 0.5rem', border: '2px solid var(--border)', borderTopColor: 'var(--gold)' }} />
                <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '0.82rem' }}>Loading…</div>
              </div>
            )}

            {!selected && (
              <div style={{
                padding: '1.5rem', textAlign: 'center',
                border: '1px dashed var(--border-soft)', borderRadius: 'var(--r-lg)',
                color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '0.82rem',
              }}>
                Click any day to see details
              </div>
            )}
          </div>
        </div>

        {/* Vara color guide */}
        <div style={{
          display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center',
          padding: '0.6rem 0.9rem',
          background: 'var(--surface-2)', border: '1px solid var(--border)',
          borderRadius: 'var(--r-md)',
        }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>Vara lords:</span>
          {[
            { n: 0, name: 'Sun·Sun' }, { n: 1, name: 'Mon·Moon' }, { n: 2, name: 'Tue·Mars' },
            { n: 3, name: 'Wed·Mercury' }, { n: 4, name: 'Thu·Jupiter' },
            { n: 5, name: 'Fri·Venus' }, { n: 6, name: 'Sat·Saturn' },
          ].map(({ n, name }) => (
            <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: VARA_COLOR[n] }} />
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>{name}</span>
            </div>
          ))}
        </div>

      </main>

      <footer style={{
        padding: '1rem 2rem', borderTop: '1px solid var(--border-soft)',
        textAlign: 'center', color: 'var(--text-muted)',
        fontFamily: 'var(--font-display)', fontSize: '0.8rem',
      }}>
        Vedic Pañcāṅga · Powered by <span style={{ color: 'var(--text-gold)' }}>Swiss Ephemeris</span>
        {' '}· {location.name} · Lahiri ayanamsha
      </footer>
    </div>
  )
}