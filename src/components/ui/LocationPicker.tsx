'use client'
// src/components/ui/LocationPicker.tsx
// Atlas-backed location typeahead with:
// - localStorage persistence (remembers last location)
// - "Use birth location" quick button
// - Browser geolocation ("My location")

import { useState, useRef, useCallback, useEffect } from 'react'

export interface LocationValue {
  lat:  number
  lng:  number
  tz:   string
  name: string
}

interface AtlasResult {
  name:      string
  country:   string
  admin1:    string
  latitude:  number
  longitude: number
  timezone:  string
}

interface Props {
  value:         LocationValue
  onChange:      (loc: LocationValue) => void
  label?:        string
  birthLocation?: LocationValue | null
}

export const DELHI_DEFAULT: LocationValue = {
  lat: 28.6139, lng: 77.209, tz: 'Asia/Kolkata', name: 'New Delhi, India',
}

const LS_KEY = 'vedaansh-panchang-location'

export function getSavedLocation(): LocationValue {
  if (typeof window === 'undefined') return DELHI_DEFAULT
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) return JSON.parse(raw) as LocationValue
  } catch {}
  return DELHI_DEFAULT
}

function saveLocation(loc: LocationValue) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(loc)) } catch {}
}

export function LocationPicker({ value, onChange, label = 'Location', birthLocation }: Props) {
  const [query,      setQuery]      = useState(value.name)
  const [results,    setResults]    = useState<AtlasResult[]>([])
  const [open,       setOpen]       = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [geoLoading, setGeoLoading] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const timer   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setQuery(value.name) }, [value.name])

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return }
    setLoading(true)
    try {
      const res  = await fetch(`/api/atlas/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setResults(data.results ?? [])
      setOpen(true)
    } catch { setResults([]) }
    finally { setLoading(false) }
  }, [])

  function handleInput(val: string) {
    setQuery(val)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => search(val), 220)
  }

  function handleSelect(r: AtlasResult) {
    const name = [r.name, r.admin1, r.country].filter(Boolean).join(', ')
    const loc: LocationValue = { lat: r.latitude, lng: r.longitude, tz: r.timezone, name }
    setQuery(name); setOpen(false); setResults([])
    saveLocation(loc); onChange(loc)
  }

  function handleBirthLocation() {
    if (!birthLocation) return
    saveLocation(birthLocation); onChange(birthLocation)
  }

  async function handleGeolocate() {
    if (!navigator.geolocation) return
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        try {
          const res  = await fetch(`/api/atlas/search?lat=${lat.toFixed(4)}&lng=${lng.toFixed(4)}`)
          const data = await res.json()
          if (data.results?.length > 0) { handleSelect(data.results[0]); return }
        } catch {}
        const loc: LocationValue = {
          lat, lng,
          tz:   Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
          name: `${lat.toFixed(2)}\u00b0, ${lng.toFixed(2)}\u00b0`,
        }
        saveLocation(loc); onChange(loc); setGeoLoading(false)
      },
      () => setGeoLoading(false),
      { timeout: 8000 },
    )
  }

  const showBirthHighlight = birthLocation &&
    (Math.abs(birthLocation.lat - value.lat) > 0.01 || Math.abs(birthLocation.lng - value.lng) > 0.01)

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      {label && (
        <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
          {label}
        </label>
      )}

      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={handleGeolocate}
          disabled={geoLoading}
          title="Use my current location"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
            padding: '0.2rem 0.55rem', fontSize: '0.7rem', fontFamily: 'inherit',
            background: 'var(--surface-3)', border: '1px solid var(--border-soft)',
            borderRadius: 'var(--r-sm)', color: 'var(--text-secondary)',
            cursor: geoLoading ? 'wait' : 'pointer', opacity: geoLoading ? 0.6 : 1,
            transition: 'all 0.15s',
          }}
        >
          {geoLoading ? '\u27f3' : '\ud83d\udccd'} {geoLoading ? 'Locating\u2026' : 'My location'}
        </button>

        {birthLocation && (
          <button
            type="button"
            onClick={handleBirthLocation}
            title={`Use birth location: ${birthLocation.name}`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
              padding: '0.2rem 0.55rem', fontSize: '0.7rem', fontFamily: 'inherit',
              background: showBirthHighlight ? 'rgba(184,134,11,0.08)' : 'var(--surface-3)',
              border: `1px solid ${showBirthHighlight ? 'rgba(184,134,11,0.3)' : 'var(--border-soft)'}`,
              borderRadius: 'var(--r-sm)',
              color: showBirthHighlight ? 'var(--text-gold)' : 'var(--text-muted)',
              cursor: 'pointer', transition: 'all 0.15s',
              maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}
          >
            \u2726 Birth: {birthLocation.name.split(',')[0]}
          </button>
        )}
      </div>

      <div style={{ position: 'relative' }}>
        <input
          className="input"
          type="text"
          value={query}
          onChange={e => handleInput(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search city\u2026"
          autoComplete="off"
          style={{ width: '100%', paddingRight: loading ? '2rem' : undefined }}
        />
        {loading && (
          <span style={{
            position: 'absolute', right: '0.5rem', top: '50%',
            transform: 'translateY(-50%)', fontSize: '0.72rem', color: 'var(--text-muted)',
          }}>\u27f3</span>
        )}
      </div>

      {open && results.length > 0 && isMobile && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.35)',
            zIndex: 3000,
          }}
        />
      )}

      {open && results.length > 0 && (
        <div style={{
          position: isMobile ? 'fixed' : 'absolute',
          zIndex: isMobile ? 3001 : 200,
          top: isMobile ? 'auto' : 'calc(100% + 4px)',
          bottom: isMobile ? 12 : 'auto',
          left: isMobile ? 12 : 0,
          right: isMobile ? 12 : 0,
          background: 'var(--surface-2)', border: '1px solid var(--border-soft)',
          borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          maxHeight: isMobile ? 'min(55vh, 420px)' : 260, overflowY: 'auto',
        }}>
          {results.map((r, i) => (
            <button
              key={i}
              onMouseDown={() => handleSelect(r)}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '0.55rem 0.85rem', background: 'none', border: 'none',
                cursor: 'pointer',
                borderBottom: i < results.length - 1 ? '1px solid var(--border-soft)' : 'none',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-3)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500 }}>{r.name}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {[r.admin1, r.country, r.timezone].filter(Boolean).join(' \u00b7 ')}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
