'use client'
// ─────────────────────────────────────────────────────────────
//  src/app/panchang/page.tsx
//  Daily Pañcāṅga — location-aware, date-navigable
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react'
import { useChart } from '@/components/providers/ChartProvider'
import { LocationPicker, getSavedLocation, type LocationValue } from '@/components/ui/LocationPicker'
import { DailyPanchangView, type PanchangApiData } from '@/components/panchang/DailyPanchangView'
import { NAKSHATRA_NAMES, RASHI_NAMES } from '@/types/astrology'
import type { Rashi } from '@/types/astrology'

function todayIST(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date())
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

function fmtDateLong(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00Z')
  return `${WEEKDAYS[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

export default function PanchangPage() {
  const { chart } = useChart()
  const [date, setDate] = useState(todayIST)
  const [data, setData] = useState<PanchangApiData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [location, setLocation] = useState<LocationValue>(getSavedLocation)
  /** '' = do not send — no personal Tārā/Chandra bala */
  const [birthNakSel, setBirthNakSel] = useState<string>('')
  /** '' = auto-estimate natal Moon rāśi from nakṣatra middle */
  const [birthMoonSel, setBirthMoonSel] = useState<string>('')

  const fetchPanchang = useCallback(async (d: string) => {
    setLoading(true)
    setError(null)
    try {
      const qs = new URLSearchParams({
        date: d,
        lat: String(location.lat),
        lng: String(location.lng),
        tz: location.tz,
      })
      if (birthNakSel !== '') qs.set('birthNak', birthNakSel)
      if (birthMoonSel !== '') qs.set('birthMoonRashi', birthMoonSel)
      const res = await fetch(`/api/panchang?${qs.toString()}`)
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Failed')
      setData(json.data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [location, birthNakSel, birthMoonSel])

  useEffect(() => { fetchPanchang(date) }, [date, fetchPanchang])

  const isToday = date === todayIST()

  return (
    <main style={{
      maxWidth: 980,
      width: '100%',
      margin: '0 auto',
      padding: 'clamp(1rem, 4vw, 2rem) clamp(0.75rem, 3vw, 1.5rem)',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
        <div style={{ textAlign: 'center', minWidth: 0 }}>
          <div
            suppressHydrationWarning
            style={{
              fontFamily: 'var(--font-display)', fontSize: 'clamp(1.1rem, 2.5vw, 1.45rem)',
              fontWeight: 600, color: 'var(--text-primary)',
            }}
          >
            {fmtDateLong(date)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
            <label htmlFor="panchang-date" style={{ display: 'block', marginBottom: 6 }}>
              <span className="label-caps" style={{ fontSize: '0.58rem' }}>Jump to date</span>
            </label>
            <input
              id="panchang-date"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              style={{
                marginTop: 4,
                padding: '0.35rem 0.5rem',
                borderRadius: 'var(--r-sm)',
                border: '1px solid var(--border)',
                background: 'var(--surface-2)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem',
              }}
            />
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 10 }}>
            <LocationPicker
              value={location}
              onChange={setLocation}
              label=""
              birthLocation={chart ? { lat: chart.meta.latitude, lng: chart.meta.longitude, tz: chart.meta.timezone, name: chart.meta.birthPlace } : null}
            />
          </div>
          <div style={{ marginTop: 14, textAlign: 'left', maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>
            <div className="label-caps" style={{ fontSize: '0.58rem', marginBottom: 6 }}>Birth Moon — Tārā & Chandra bala</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', justifyContent: 'center' }}>
              <select
                value={birthNakSel}
                onChange={e => setBirthNakSel(e.target.value)}
                aria-label="Birth nakshatra for tara bala"
                style={{
                  flex: '1 1 200px',
                  maxWidth: '100%',
                  padding: '0.4rem 0.5rem',
                  borderRadius: 'var(--r-sm)',
                  border: '1px solid var(--border)',
                  background: 'var(--surface-2)',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.82rem',
                }}
              >
                <option value="">— Birth nakṣatra (optional) —</option>
                {NAKSHATRA_NAMES.map((name, i) => (
                  <option key={name} value={i}>{name}</option>
                ))}
              </select>
              <select
                value={birthMoonSel}
                onChange={e => setBirthMoonSel(e.target.value)}
                disabled={birthNakSel === ''}
                aria-label="Birth Moon rashi optional override"
                title="Leave on Auto to estimate natal Moon sign from nakṣatra"
                style={{
                  flex: '1 1 160px',
                  maxWidth: '100%',
                  padding: '0.4rem 0.5rem',
                  borderRadius: 'var(--r-sm)',
                  border: '1px solid var(--border)',
                  background: 'var(--surface-2)',
                  color: 'var(--text-primary)',
                  fontSize: '0.8rem',
                }}
              >
                <option value="">Auto rāśi from nakṣatra</option>
                {([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as Rashi[]).map((r) => (
                  <option key={r} value={r}>{RASHI_NAMES[r]}</option>
                ))}
              </select>
            </div>
            {chart && (
              <button
                type="button"
                onClick={() => {
                  const moon = chart.grahas.find(g => g.id === 'Mo')
                  if (moon) {
                    setBirthNakSel(String(moon.nakshatraIndex))
                    setBirthMoonSel(String(moon.rashi))
                  }
                }}
                style={{
                  marginTop: 8,
                  padding: '0.3rem 0.65rem',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-display)',
                  cursor: 'pointer',
                  borderRadius: 'var(--r-sm)',
                  border: '1px solid rgba(201,168,76,0.35)',
                  background: 'rgba(201,168,76,0.08)',
                  color: 'var(--text-gold)',
                }}
              >
                Use Moon from my loaded chart
              </button>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button
            type="button"
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
          <button
            type="button"
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
              type="button"
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
      </div>

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

      {data && !loading && <DailyPanchangView data={data} />}
    </main>
  )
}
