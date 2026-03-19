// ─────────────────────────────────────────────────────────────
//  src/components/ui/BirthForm.tsx
//  Birth data entry form with location autocomplete
//  Defaults: Delhi · current date/time · Asia/Kolkata
// ─────────────────────────────────────────────────────────────
'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import type { ChartOutput, ChartSettings } from '@/types/astrology'
import { DEFAULT_SETTINGS } from '@/types/astrology'

// ── Delhi defaults ────────────────────────────────────────────

const DELHI_DEFAULT = {
  name:      'Delhi',
  place:     'New Delhi, Delhi, IN',
  lat:       28.6139,
  lng:       77.2090,
  tz:        'Asia/Kolkata',
}

function nowIST(): { date: string; time: string } {
  // Use current moment in IST
  const now = new Date()
  // Format in IST
  const istOpts: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Kolkata',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  }
  const parts = new Intl.DateTimeFormat('en-CA', istOpts).formatToParts(now)
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '00'
  const date = `${get('year')}-${get('month')}-${get('day')}`
  const time = `${get('hour').replace('24', '00')}:${get('minute')}:${get('second')}`
  return { date, time }
}

// ── Types ─────────────────────────────────────────────────────

interface LocationResult {
  name:      string
  country:   string
  admin1:    string
  latitude:  number
  longitude: number
  timezone:  string
}

interface BirthFormProps {
  onResult:    (data: ChartOutput) => void
  onLoading?:  (loading: boolean) => void
  autoSubmit?: boolean   // calculate immediately on mount with defaults
}

// ── Component ────────────────────────────────────────────────

export function BirthForm({ onResult, onLoading, autoSubmit = false }: BirthFormProps) {
  const { date: todayDate, time: nowTime } = nowIST()

  const [name,      setName]      = useState(DELHI_DEFAULT.name)
  const [date,      setDate]      = useState(todayDate)
  const [time,      setTime]      = useState(nowTime)
  const [place,     setPlace]     = useState(DELHI_DEFAULT.place)
  const [lat,       setLat]       = useState<number | null>(DELHI_DEFAULT.lat)
  const [lng,       setLng]       = useState<number | null>(DELHI_DEFAULT.lng)
  const [tz,        setTz]        = useState(DELHI_DEFAULT.tz)
  const [settings,  setSettings]  = useState<ChartSettings>(DEFAULT_SETTINGS)

  const [locationResults, setLocationResults] = useState<LocationResult[]>([])
  const [searchOpen,      setSearchOpen]      = useState(false)
  const [searching,       setSearching]       = useState(false)
  const [loading,         setLoading]         = useState(false)
  const [error,           setError]           = useState<string | null>(null)
  const [showAdvanced,    setShowAdvanced]     = useState(false)

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const didAutoSubmit = useRef(false)

  // ── Auto-submit on mount ──────────────────────────────────

  useEffect(() => {
    if (autoSubmit && !didAutoSubmit.current) {
      didAutoSubmit.current = true
      // Small delay so the page can paint before the fetch
      setTimeout(() => submitChart(
        DELHI_DEFAULT.name,
        todayDate,
        nowTime,
        DELHI_DEFAULT.place,
        DELHI_DEFAULT.lat,
        DELHI_DEFAULT.lng,
        DELHI_DEFAULT.tz,
        DEFAULT_SETTINGS,
      ), 120)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSubmit])

  // ── Location search ───────────────────────────────────────

  const searchLocations = useCallback(async (q: string) => {
    if (q.length < 2) { setLocationResults([]); return }
    setSearching(true)
    try {
      const res  = await fetch(`/api/atlas/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setLocationResults(data.results ?? [])
      setSearchOpen(true)
    } catch {
      setLocationResults([])
    } finally {
      setSearching(false)
    }
  }, [])

  const handlePlaceChange = (val: string) => {
    setPlace(val)
    setLat(null); setLng(null)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => searchLocations(val), 200)
  }

  const selectLocation = (loc: LocationResult) => {
    setPlace(`${loc.name}${loc.admin1 ? ', ' + loc.admin1 : ''}, ${loc.country}`)
    setLat(loc.latitude)
    setLng(loc.longitude)
    setTz(loc.timezone)
    setLocationResults([])
    setSearchOpen(false)
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Core calculation ──────────────────────────────────────

  async function submitChart(
    nameVal: string, dateVal: string, timeVal: string,
    placeVal: string, latVal: number, lngVal: number,
    tzVal: string, settingsVal: ChartSettings,
  ) {
    setError(null)
    setLoading(true)
    onLoading?.(true)

    try {
      const safeTime = /^\d{2}:\d{2}:\d{2}$/.test(timeVal) ? timeVal : `${timeVal}:00`
      const res = await fetch('/api/chart/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:       nameVal.trim() || 'Delhi',
          birthDate:  dateVal,
          birthTime:  safeTime,
          birthPlace: placeVal,
          latitude:   latVal,
          longitude:  lngVal,
          timezone:   tzVal,
          settings:   settingsVal,
        }),
      })

      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Calculation failed')
        return
      }
      onResult(json.data)
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
      onLoading?.(false)
    }
  }

  // ── Form submit ───────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('Please enter a name'); return }
    if (!date)        { setError('Please enter birth date'); return }
    if (!lat || !lng) { setError('Please select a location from the list'); return }
    await submitChart(name, date, time, place, lat, lng, tz, settings)
  }

  // ── Refresh to now ────────────────────────────────────────

  const setToNow = () => {
    const { date: d, time: t } = nowIST()
    setDate(d)
    setTime(t)
  }

  // ── Render ────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

      {/* Name */}
      <div>
        <label>Name / Label</label>
        <input
          className="input"
          type="text"
          placeholder="e.g. Ravi Kumar"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="off"
        />
      </div>

      {/* Date + Time row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
        <div>
          <label>Date</label>
          <input
            className="input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ colorScheme: 'dark' }}
          />
        </div>
        <div>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Time</span>
            <button
              type="button"
              onClick={setToNow}
              title="Set to current time"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(201,168,76,0.5)', fontSize: '0.68rem',
                fontFamily: 'Cormorant Garamond, serif',
                letterSpacing: '0.06em', padding: 0,
                textTransform: 'uppercase',
              }}
            >
              Now ↺
            </button>
          </label>
          <input
            className="input"
            type="time"
            value={time.slice(0, 5)}
            onChange={(e) => setTime(e.target.value)}
            step="1"
            style={{ colorScheme: 'dark' }}
          />
        </div>
      </div>

      {/* Location with autocomplete */}
      <div style={{ position: 'relative' }} ref={dropdownRef}>
        <label>
          Place
          {searching && (
            <span style={{ marginLeft: 8, fontSize: '0.68rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              searching…
            </span>
          )}
        </label>
        <input
          className="input"
          type="text"
          placeholder="City, Country"
          value={place}
          onChange={(e) => handlePlaceChange(e.target.value)}
          onFocus={() => locationResults.length > 0 && setSearchOpen(true)}
          autoComplete="off"
        />

        {/* Coords display */}
        {lat !== null && lng !== null && (
          <div style={{
            marginTop: 4, fontSize: '0.72rem',
            color: 'var(--text-muted)',
            fontFamily: 'JetBrains Mono, monospace',
            display: 'flex', gap: '1rem', flexWrap: 'wrap',
          }}>
            <span>{lat.toFixed(4)}° N</span>
            <span>{lng.toFixed(4)}° E</span>
            <span style={{ color: 'var(--text-gold)', fontFamily: 'Cormorant Garamond, serif' }}>{tz}</span>
          </div>
        )}

        {/* Dropdown */}
        {searchOpen && locationResults.length > 0 && (
          <div style={{
            position: 'absolute', zIndex: 100, width: '100%', top: '100%', marginTop: 4,
            background: 'var(--surface-2)',
            border: '1px solid var(--border-bright)',
            borderRadius: 8,
            boxShadow: 'var(--shadow-deep)',
            maxHeight: 280, overflowY: 'auto',
          }}>
            {locationResults.map((loc, i) => (
              <button
                key={i}
                type="button"
                onClick={() => selectLocation(loc)}
                style={{
                  display: 'flex', flexDirection: 'column', gap: 2,
                  width: '100%', textAlign: 'left',
                  padding: '0.6rem 1rem',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  borderBottom: i < locationResults.length - 1
                    ? '1px solid var(--border-soft)' : 'none',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(201,168,76,0.07)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1rem', color: 'var(--text-primary)' }}>
                  {loc.name}
                  {loc.admin1 && (
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>, {loc.admin1}</span>
                  )}
                </span>
                <span style={{ fontSize: '0.72rem', fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-muted)', display: 'flex', gap: '0.75rem' }}>
                  <span>{loc.country}</span>
                  <span>{loc.latitude.toFixed(2)}°, {loc.longitude.toFixed(2)}°</span>
                  <span style={{ color: 'var(--text-gold)', fontFamily: 'Cormorant Garamond, serif' }}>{loc.timezone}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Advanced settings */}
      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced((o) => !o)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', fontFamily: 'Cormorant Garamond, serif',
            fontSize: '0.82rem', letterSpacing: '0.06em',
            display: 'flex', alignItems: 'center', gap: '0.4rem', padding: 0,
          }}
        >
          <span style={{ transform: showAdvanced ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.15s', fontSize: '0.6rem' }}>▶</span>
          Advanced settings
        </button>

        {showAdvanced && (
          <div style={{
            marginTop: '0.75rem', padding: '1rem',
            background: 'var(--surface-2)', borderRadius: 8,
            border: '1px solid var(--border-soft)',
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem',
          }}>
            <div>
              <label style={{ fontSize: '0.7rem' }}>Ayanamsha</label>
              <select className="input" value={settings.ayanamsha}
                onChange={(e) => setSettings((s) => ({ ...s, ayanamsha: e.target.value as any }))}
                style={{ colorScheme: 'dark' }}>
                <option value="lahiri">Lahiri (default)</option>
                <option value="true_chitra">True Chitra</option>
                <option value="raman">Raman</option>
                <option value="true_revati">True Revati</option>
                <option value="usha_shashi">Usha-Shashi</option>
                <option value="yukteshwar">Yukteshwar</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.7rem' }}>House system</label>
              <select className="input" value={settings.houseSystem}
                onChange={(e) => setSettings((s) => ({ ...s, houseSystem: e.target.value as any }))}
                style={{ colorScheme: 'dark' }}>
                <option value="whole_sign">Whole Sign</option>
                <option value="placidus">Placidus</option>
                <option value="equal">Equal House</option>
                <option value="bhava_chalita">Bhava Chalita</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.7rem' }}>Karaka scheme</label>
              <select className="input" value={settings.karakaScheme}
                onChange={(e) => setSettings((s) => ({ ...s, karakaScheme: Number(e.target.value) as 7 | 8 }))}
                style={{ colorScheme: 'dark' }}>
                <option value={8}>8 Karakas (standard)</option>
                <option value={7}>7 Karakas</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.7rem' }}>Rāhu / Ketu nodes</label>
              <select className="input" value={settings.nodeMode}
                onChange={(e) => setSettings((s) => ({ ...s, nodeMode: e.target.value as any }))}
                style={{ colorScheme: 'dark' }}>
                <option value="mean">Mean nodes</option>
                <option value="true">True nodes</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={{
          padding: '0.7rem 1rem',
          background: 'rgba(212,120,138,0.1)',
          border: '1px solid rgba(212,120,138,0.3)',
          borderRadius: 8,
          color: 'var(--rose)',
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: '0.92rem',
        }}>
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="btn btn-primary"
        style={{ width: '100%', justifyContent: 'center', fontSize: '1.05rem', padding: '0.7rem', opacity: loading ? 0.7 : 1 }}
      >
        {loading ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{
              width: 14, height: 14,
              border: '2px solid rgba(0,0,0,0.25)',
              borderTopColor: 'rgba(0,0,0,0.7)',
              borderRadius: '50%',
              animation: 'spin-slow 0.7s linear infinite',
              display: 'inline-block',
            }} />
            Calculating…
          </span>
        ) : (
          <>🪐 Calculate Chart</>
        )}
      </button>
    </form>
  )
}