'use client'
// ─────────────────────────────────────────────────────────────
//  src/app/panchang/page.tsx
//  Daily Panchang — location-aware, date-navigable
//  Shows: Vara · Tithi · Nakshatra · Yoga · Karana
//         Rahu Kalam · Gulika · Abhijit · Hora table
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

// ── Types ─────────────────────────────────────────────────────

interface PanchangData {
  date: string
  location: { lat: number; lng: number; tz: string }
  vara:      { number: number; name: string; sanskrit: string; lord: string }
  tithi:     { number: number; name: string; paksha: string; lord: string; percent: number }
  nakshatra: { index: number; name: string; pada: number; lord: string; degree: number }
  sunNakshatra: { index: number; name: string; pada: number; lord: string }
  yoga:      { number: number; name: string; quality: string; percent: number }
  karana:    { number: number; name: string; type: string; isBhadra: boolean }
  sunrise:   string
  sunset:    string
  rahuKalam:      { start: string; end: string }
  gulikaKalam:    { start: string; end: string }
  yamaganda:      { start: string; end: string }
  abhijitMuhurta: { start: string; end: string } | null
  horaTable: { lord: string; start: string; end: string; isDaytime: boolean }[]
  sunLongitudeSidereal:  number
  moonLongitudeSidereal: number
  julianDay: number
}

// ── Constants ─────────────────────────────────────────────────

const GRAHA_COLOR: Record<string, string> = {
  Su: '#e8a730', Mo: '#b0c8e0', Ma: '#e05050',
  Me: '#50c878', Ju: '#f5d06e', Ve: '#f0a0c0',
  Sa: '#9988cc', Ra: '#9b59b6', Ke: '#e67e22',
}

const GRAHA_SYMBOL: Record<string, string> = {
  Su: '☀', Mo: '☽', Ma: '♂', Me: '☿',
  Ju: '♃', Ve: '♀', Sa: '♄', Ra: '☊', Ke: '☋',
}

const PAKSHA_COLOR = { shukla: 'var(--gold-light)', krishna: 'var(--text-muted)' }

function toLocaleDateISO(d: Date): string {
  return d.toLocaleDateString('en-CA')   // YYYY-MM-DD
}

function todayIST(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date())
}

function fmtTime(iso: string): string {
  // Server-safe time formatter — avoids locale mismatch on hydration
  const d   = new Date(iso)
  const hrs = d.getHours()
  const min = String(d.getMinutes()).padStart(2, '0')
  const ampm = hrs >= 12 ? 'PM' : 'AM'
  const h12  = hrs % 12 || 12
  return `${h12}:${min} ${ampm}`
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

const WEEKDAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const MONTHS   = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December']

function fmtDateLong(dateStr: string): string {
  // Server-safe: avoids toLocaleDateString locale mismatch
  const d = new Date(dateStr + 'T12:00:00Z')
  return `${WEEKDAYS[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

function isNow(start: string, end: string): boolean {
  const now = Date.now()
  return now >= new Date(start).getTime() && now <= new Date(end).getTime()
}

// ── Subcomponents ─────────────────────────────────────────────

function PanchangCard({
  label, value, sub, icon, highlight = false, warning = false,
}: {
  label: string; value: string; sub?: string; icon?: string
  highlight?: boolean; warning?: boolean
}) {
  return (
    <div
      className="stat-chip fade-up"
      style={{
        background: highlight
          ? 'linear-gradient(135deg, rgba(201,168,76,0.12), rgba(201,168,76,0.06))'
          : warning
          ? 'rgba(224,123,142,0.07)'
          : 'var(--surface-2)',
        border: `1px solid ${highlight ? 'rgba(201,168,76,0.30)' : warning ? 'rgba(224,123,142,0.20)' : 'var(--border)'}`,
        borderRadius: 'var(--r-lg)',
        padding: '1rem 1.1rem',
        display: 'flex', flexDirection: 'column', gap: '0.3rem',
      }}
    >
      <div style={{
        fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: highlight ? 'var(--text-gold)' : warning ? 'var(--rose)' : 'var(--text-muted)',
        fontFamily: 'var(--font-display)',
      }}>
        {icon && <span style={{ marginRight: 5 }}>{icon}</span>}{label}
      </div>
      <div style={{
        fontSize: '1.05rem', fontWeight: 600,
        fontFamily: 'var(--font-display)',
        color: highlight ? 'var(--text-gold)' : 'var(--text-primary)',
      }}>
        {value}
      </div>
      {sub && (
        <div style={{
          fontSize: '0.75rem', color: 'var(--text-muted)',
          fontFamily: 'var(--font-display)', fontStyle: 'italic',
        }}>
          {sub}
        </div>
      )}
    </div>
  )
}

function MuhurtaBar({
  label, start, end, color, bg,
}: {
  label: string; start: string; end: string; color: string; bg: string
}) {
  const active = isNow(start, end)
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.75rem',
      padding: '0.65rem 1rem',
      background: active ? `${bg}22` : `${bg}09`,
      border: `1px solid ${active ? `${bg}55` : `${bg}22`}`,
      borderRadius: 'var(--r-md)',
      transition: 'all 0.2s',
    }}>
      <div style={{
        width: 8, height: 8, borderRadius: '50%',
        background: color,
        boxShadow: active ? `0 0 8px ${color}` : 'none',
        flexShrink: 0,
      }} />
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em',
          textTransform: 'uppercase', color,
          fontFamily: 'var(--font-display)',
        }}>
          {label}{active && <span style={{ marginLeft: 6, fontStyle: 'italic', fontWeight: 400, opacity: 0.8 }}>← now</span>}
        </div>
        <div style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginTop: 2 }}>
          {fmtTime(start)} – {fmtTime(end)}
        </div>
      </div>
    </div>
  )
}

function HoraRow({ hora }: { hora: PanchangData['horaTable'][0]; key?: number }) {
  const active = isNow(hora.start, hora.end)
  const col    = GRAHA_COLOR[hora.lord] ?? '#888'
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.75rem',
      padding: '0.5rem 0.85rem',
      background: active ? `${col}18` : 'transparent',
      borderLeft: `3px solid ${active ? col : 'transparent'}`,
      borderRadius: '0 var(--r-sm) var(--r-sm) 0',
      transition: 'background 0.15s',
    }}>
      <span style={{ fontSize: '1.1rem', width: 22, textAlign: 'center' }}>
        {GRAHA_SYMBOL[hora.lord] ?? hora.lord}
      </span>
      <div style={{ flex: 1 }}>
        <span style={{
          fontFamily: 'var(--font-display)', fontWeight: 600,
          color: active ? col : 'var(--text-primary)', fontSize: '0.9rem',
        }}>
          {hora.lord === 'Su' ? 'Sun' : hora.lord === 'Mo' ? 'Moon' :
           hora.lord === 'Ma' ? 'Mars' : hora.lord === 'Me' ? 'Mercury' :
           hora.lord === 'Ju' ? 'Jupiter' : hora.lord === 'Ve' ? 'Venus' :
           hora.lord === 'Sa' ? 'Saturn' : hora.lord}
        </span>
        {active && (
          <span style={{ marginLeft: 8, fontSize: '0.7rem', fontStyle: 'italic', color: col, opacity: 0.85 }}>
            ← current hora
          </span>
        )}
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
        {fmtTime(hora.start)} – {fmtTime(hora.end)}
      </div>
      <div style={{
        fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.06em',
        textTransform: 'uppercase', color: hora.isDaytime ? 'var(--amber)' : 'var(--accent)',
        fontFamily: 'var(--font-display)', opacity: 0.7, minWidth: 32,
      }}>
        {hora.isDaytime ? 'Day' : 'Night'}
      </div>
    </div>
  )
}

// ── Tithi progress bar ────────────────────────────────────────

function TithiProgress({ percent, paksha }: { percent: number; paksha: string }) {
  const isShukla = paksha === 'shukla'
  return (
    <div style={{ marginTop: '0.4rem' }}>
      <div style={{
        height: 4, borderRadius: 99,
        background: 'var(--surface-3)',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${Math.min(100, percent)}%`,
          background: isShukla
            ? 'linear-gradient(90deg, var(--gold-dim), var(--gold-light))'
            : 'linear-gradient(90deg, var(--accent-dim, #4a4080), var(--accent))',
          borderRadius: 99,
          transition: 'width 0.6s ease',
        }} />
      </div>
      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 3, fontFamily: 'var(--font-mono)' }}>
        {percent.toFixed(1)}% elapsed
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────

export default function PanchangPage() {
  const [date,     setDate]     = useState(todayIST)
  const [data,     setData]     = useState<PanchangData | null>(null)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [location] = useState({ lat: 28.6139, lng: 77.209, tz: 'Asia/Kolkata', name: 'New Delhi' })
  const [horaOpen, setHoraOpen] = useState(false)
  const [tick,     setTick]     = useState(0)   // forces re-render each minute for "now" highlighting

  // Tick every 60s to refresh "active" highlighting
  useEffect(() => {
    const id = setInterval(() => setTick((t: number) => t + 1), 60_000)
    return () => clearInterval(id)
  }, [])

  const fetchPanchang = useCallback(async (d: string) => {
    setLoading(true)
    setError(null)
    try {
      const url = `/api/panchang?date=${d}&lat=${location.lat}&lng=${location.lng}&tz=${encodeURIComponent(location.tz)}`
      const res  = await fetch(url)
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Failed')
      setData(json.data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [location])

  useEffect(() => { fetchPanchang(date) }, [date, fetchPanchang])

  const isToday = date === todayIST()

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* ── Header ─────────────────────────────────────── */}
      <header style={{
        padding: '0 2rem',
        height: '3.75rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        backdropFilter: 'blur(16px)',
        position: 'sticky', top: 0, zIndex: 50,
        background: 'var(--header-bg)',
        borderBottom: '1px solid var(--border-soft)',
      }}>
        <Link href="/" style={{
          display: 'flex', alignItems: 'baseline', gap: '0.6rem',
          textDecoration: 'none',
        }}>
          <span style={{ fontSize: '1.25rem' }}>🪐</span>
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: '1.25rem',
            fontWeight: 600, letterSpacing: '0.04em', color: 'var(--text-gold)',
          }}>
            Jyotiṣa
          </span>
          <span style={{
            fontSize: '0.7rem', color: 'var(--text-muted)',
            fontFamily: 'var(--font-display)', fontStyle: 'italic',
          }}>
            The Eye of the Vedas
          </span>
        </Link>

        <nav style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: '0.9rem',
            color: 'var(--text-gold)', fontWeight: 600,
          }}>
            Pañcāṅga
          </span>
          <Link href="/" style={{
            fontFamily: 'var(--font-display)', fontSize: '0.9rem',
            color: 'var(--text-secondary)', textDecoration: 'none',
          }}>
            Chart
          </Link>
          <ThemeToggle />
        </nav>
      </header>

      <main style={{
        flex: 1, maxWidth: 900, width: '100%',
        margin: '0 auto', padding: '2rem 1.5rem',
        display: 'flex', flexDirection: 'column', gap: '1.75rem',
      }}>

        {/* ── Date navigator ──────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setDate((d: string) => addDays(d, -1))}
            style={{
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)', padding: '0.45rem 0.9rem',
              cursor: 'pointer', color: 'var(--text-secondary)',
              fontFamily: 'var(--font-display)', fontSize: '1rem',
            }}
          >
            ← Prev
          </button>

          <div style={{ flex: 1, textAlign: 'center' }}>
            <div
              suppressHydrationWarning
              style={{
                fontFamily: 'var(--font-display)', fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)',
                fontWeight: 600, color: 'var(--text-primary)',
              }}>
              {fmtDateLong(date)}
            </div>
            <div style={{
              fontSize: '0.75rem', color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)', marginTop: 2,
            }}>
              {location.name} · {location.tz}
            </div>
          </div>

          <button
            onClick={() => setDate((d: string) => addDays(d, 1))}
            style={{
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)', padding: '0.45rem 0.9rem',
              cursor: 'pointer', color: 'var(--text-secondary)',
              fontFamily: 'var(--font-display)', fontSize: '1rem',
            }}
          >
            Next →
          </button>

          {!isToday && (
            <button
              onClick={() => setDate(todayIST())}
              style={{
                background: 'rgba(201,168,76,0.10)', border: '1px solid rgba(201,168,76,0.30)',
                borderRadius: 'var(--r-md)', padding: '0.45rem 0.9rem',
                cursor: 'pointer', color: 'var(--text-gold)',
                fontFamily: 'var(--font-display)', fontSize: '0.85rem', fontWeight: 600,
              }}
            >
              Today
            </button>
          )}
        </div>

        {/* ── Loading / Error ─────────────────────────── */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <div className="spin-loader" style={{
              width: 36, height: 36, margin: '0 auto 1rem',
              border: '3px solid var(--border)',
              borderTopColor: 'var(--gold)',
            }} />
            <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>
              Consulting the ephemeris…
            </div>
          </div>
        )}

        {error && (
          <div style={{
            padding: '1rem', borderRadius: 'var(--r-md)',
            background: 'rgba(224,123,142,0.08)', border: '1px solid rgba(224,123,142,0.25)',
            color: 'var(--rose)', fontFamily: 'var(--font-display)',
          }}>
            {error}
          </div>
        )}

        {data && !loading && (
          <>
            {/* ── Sunrise / Sunset bar ─────────────────── */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '2rem', padding: '0.85rem 1.5rem',
              background: 'linear-gradient(135deg, rgba(201,168,76,0.08), rgba(139,124,246,0.06))',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-lg)',
            }}>
              {[
                { icon: '🌅', label: 'Sunrise', time: data.sunrise, color: '#f59e42' },
                { icon: '🌇', label: 'Sunset',  time: data.sunset,  color: '#e07b8e' },
              ].map(({ icon, label, time, color }) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.4rem' }}>{icon}</div>
                  <div style={{
                    fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em',
                    textTransform: 'uppercase', color: 'var(--text-muted)',
                    fontFamily: 'var(--font-display)',
                  }}>
                    {label}
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-mono)', fontSize: '1rem',
                    fontWeight: 600, color,
                  }}>
                    {fmtTime(time)}
                  </div>
                </div>
              ))}
              <div style={{ width: 1, height: 40, background: 'var(--border)' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.4rem' }}>⏱</div>
                <div style={{
                  fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em',
                  textTransform: 'uppercase', color: 'var(--text-muted)',
                  fontFamily: 'var(--font-display)',
                }}>Day Length</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {(() => {
                    const mins = Math.round((new Date(data.sunset).getTime() - new Date(data.sunrise).getTime()) / 60000)
                    return `${Math.floor(mins / 60)}h ${mins % 60}m`
                  })()}
                </div>
              </div>
            </div>

            {/* ── Pancha Anga — the 5 limbs ────────────── */}
            <div>
              <div className="label-caps" style={{ marginBottom: '0.75rem' }}>
                Pañca Aṅga — Five Limbs
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                gap: '0.75rem',
              }}>
                {/* Vara */}
                <PanchangCard
                  label="Vara (Weekday)"
                  value={data.vara.name}
                  sub={`${data.vara.sanskrit} · Lord: ${data.vara.lord}`}
                  icon="☀"
                  highlight
                />

                {/* Tithi */}
                <div
                  className="fade-up"
                  style={{
                    background: 'var(--surface-2)', border: '1px solid var(--border)',
                    borderRadius: 'var(--r-lg)', padding: '1rem 1.1rem',
                  }}
                >
                  <div style={{
                    fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em',
                    textTransform: 'uppercase', color: 'var(--text-muted)',
                    fontFamily: 'var(--font-display)', marginBottom: '0.3rem',
                  }}>
                    🌙 Tithi
                  </div>
                  <div style={{
                    fontSize: '1.05rem', fontWeight: 600,
                    fontFamily: 'var(--font-display)', color: 'var(--text-primary)',
                  }}>
                    {data.tithi.name}
                  </div>
                  <div style={{
                    fontSize: '0.75rem', color: 'var(--text-muted)',
                    fontFamily: 'var(--font-display)', fontStyle: 'italic', marginBottom: '0.4rem',
                  }}>
                    {data.tithi.paksha === 'shukla' ? 'Śukla Pakṣa' : 'Kṛṣṇa Pakṣa'}
                    {' · '}Lord: {data.tithi.lord}
                  </div>
                  <TithiProgress percent={data.tithi.percent} paksha={data.tithi.paksha} />
                </div>

                {/* Nakshatra */}
                <PanchangCard
                  label="Nakshatra"
                  value={data.nakshatra.name}
                  sub={`Pada ${data.nakshatra.pada} · Lord: ${data.nakshatra.lord}`}
                  icon="⭐"
                />

                {/* Yoga */}
                <div
                  className="fade-up"
                  style={{
                    background: data.yoga.quality === 'auspicious'
                      ? 'rgba(78,205,196,0.06)' : data.yoga.quality === 'inauspicious'
                      ? 'rgba(224,123,142,0.06)' : 'var(--surface-2)',
                    border: `1px solid ${data.yoga.quality === 'auspicious'
                      ? 'rgba(78,205,196,0.20)' : data.yoga.quality === 'inauspicious'
                      ? 'rgba(224,123,142,0.20)' : 'var(--border)'}`,
                    borderRadius: 'var(--r-lg)', padding: '1rem 1.1rem',
                  }}
                >
                  <div style={{
                    fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em',
                    textTransform: 'uppercase', color: 'var(--text-muted)',
                    fontFamily: 'var(--font-display)', marginBottom: '0.3rem',
                  }}>
                    ☯ Yoga
                  </div>
                  <div style={{
                    fontSize: '1.05rem', fontWeight: 600,
                    fontFamily: 'var(--font-display)',
                    color: data.yoga.quality === 'auspicious' ? 'var(--teal)'
                      : data.yoga.quality === 'inauspicious' ? 'var(--rose)'
                      : 'var(--text-primary)',
                  }}>
                    {data.yoga.name}
                  </div>
                  <div style={{
                    fontSize: '0.72rem', fontFamily: 'var(--font-display)',
                    fontStyle: 'italic', marginTop: 2,
                    color: data.yoga.quality === 'auspicious' ? 'var(--teal)'
                      : data.yoga.quality === 'inauspicious' ? 'var(--rose)'
                      : 'var(--text-muted)',
                  }}>
                    {data.yoga.quality}
                  </div>
                </div>

                {/* Karana */}
                <PanchangCard
                  label="Karaṇa"
                  value={data.karana.name}
                  sub={data.karana.isBhadra ? '⚠ Bhadra — avoid auspicious acts' : data.karana.type}
                  icon="✦"
                  warning={data.karana.isBhadra}
                />
              </div>
            </div>

            {/* ── Muhurta Windows ─────────────────────── */}
            <div>
              <div className="label-caps" style={{ marginBottom: '0.75rem' }}>
                Muhūrta Windows
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <MuhurtaBar
                  label="Rāhu Kālam"
                  start={data.rahuKalam.start}
                  end={data.rahuKalam.end}
                  color="var(--rose)"
                  bg="#e07b8e"
                />
                <MuhurtaBar
                  label="Gulikā Kālam"
                  start={data.gulikaKalam.start}
                  end={data.gulikaKalam.end}
                  color="var(--rose)"
                  bg="#e07b8e"
                />
                <MuhurtaBar
                  label="Yamagaṇḍa"
                  start={data.yamaganda.start}
                  end={data.yamaganda.end}
                  color="var(--amber)"
                  bg="#f59e42"
                />
                {data.abhijitMuhurta && (
                  <MuhurtaBar
                    label="Abhijit Muhūrta ✦ Auspicious"
                    start={data.abhijitMuhurta.start}
                    end={data.abhijitMuhurta.end}
                    color="var(--teal)"
                    bg="#4ecdc4"
                  />
                )}
              </div>
            </div>

            {/* ── Sun Nakshatra ────────────────────────── */}
            <div style={{
              display: 'flex', gap: '0.75rem', flexWrap: 'wrap',
            }}>
              <div style={{
                flex: 1, minWidth: 200,
                padding: '0.85rem 1.1rem',
                background: 'rgba(232,167,48,0.07)',
                border: '1px solid rgba(232,167,48,0.20)',
                borderRadius: 'var(--r-md)',
              }}>
                <div style={{
                  fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em',
                  textTransform: 'uppercase', color: '#e8a730',
                  fontFamily: 'var(--font-display)', marginBottom: 4,
                }}>
                  ☀ Sun Nakshatra
                </div>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {data.sunNakshatra.name}
                </span>
                <span style={{ marginLeft: 8, fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  Pada {data.sunNakshatra.pada} · Lord {data.sunNakshatra.lord}
                </span>
              </div>
              <div style={{
                flex: 1, minWidth: 200,
                padding: '0.85rem 1.1rem',
                background: 'rgba(176,200,224,0.07)',
                border: '1px solid rgba(176,200,224,0.20)',
                borderRadius: 'var(--r-md)',
              }}>
                <div style={{
                  fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em',
                  textTransform: 'uppercase', color: '#b0c8e0',
                  fontFamily: 'var(--font-display)', marginBottom: 4,
                }}>
                  ☽ Moon Nakshatra
                </div>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {data.nakshatra.name}
                </span>
                <span style={{ marginLeft: 8, fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  Pada {data.nakshatra.pada} · Lord {data.nakshatra.lord}
                </span>
              </div>
            </div>

            {/* ── Hora Table ───────────────────────────── */}
            <div>
              <button
                onClick={() => setHoraOpen((o: boolean) => !o)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--font-display)', fontSize: '0.75rem',
                  fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  marginBottom: horaOpen ? '0.75rem' : 0,
                  padding: 0,
                }}
              >
                <span style={{
                  display: 'inline-block',
                  transform: horaOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.15s', fontSize: '0.65rem',
                }}>▶</span>
                Hora Table — {data.horaTable.length} horās
              </button>

              {horaOpen && (
                <div style={{
                  background: 'var(--surface-1)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-lg)',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    borderBottom: '1px solid var(--border-soft)',
                  }}>
                    {['Day Horās', 'Night Horās'].map(label => (
                      <div key={label} style={{
                        padding: '0.5rem 0.85rem',
                        fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.09em',
                        textTransform: 'uppercase', color: 'var(--text-muted)',
                        fontFamily: 'var(--font-display)',
                        borderRight: label === 'Day Horās' ? '1px solid var(--border-soft)' : 'none',
                      }}>
                        {label}
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                    <div style={{ borderRight: '1px solid var(--border-soft)' }}>
                      {data.horaTable.filter((h: PanchangData['horaTable'][0]) => h.isDaytime).map((h: PanchangData['horaTable'][0], i: number) => (
                        <HoraRow key={i} hora={h} />
                      ))}
                    </div>
                    <div>
                      {data.horaTable.filter((h: PanchangData['horaTable'][0]) => !h.isDaytime).map((h: PanchangData['horaTable'][0], i: number) => (
                        <HoraRow key={i} hora={h} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Footer meta ─────────────────────────── */}
            <div style={{
              fontSize: '0.72rem', color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)', textAlign: 'center',
              paddingTop: '0.5rem',
              borderTop: '1px solid var(--border-soft)',
            }}>
              JD {data.julianDay.toFixed(4)} · Lahiri ayanamsha · {data.location.tz}
            </div>
          </>
        )}
      </main>

      {/* ── Footer ─────────────────────────────────────── */}
      <footer style={{
        padding: '1rem 2rem', borderTop: '1px solid var(--border-soft)',
        textAlign: 'center', color: 'var(--text-muted)',
        fontFamily: 'var(--font-display)', fontSize: '0.8rem',
      }}>
        Powered by <span style={{ color: 'var(--text-gold)' }}>Swiss Ephemeris</span>
        {' '}· Lahiri ayanamsha · Kāla — free forever
      </footer>
    </div>
  )
}