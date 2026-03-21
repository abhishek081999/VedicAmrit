'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/LocationPicker.tsx
//  Shared atlas-backed location typeahead for Panchang,
//  Panchang Calendar, and Muhurta pages.
//
//  Usage:
//    <LocationPicker value={location} onChange={setLocation} />
//
//  Where `location` is { lat, lng, tz, name }.
// ─────────────────────────────────────────────────────────────

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
  value:    LocationValue
  onChange: (loc: LocationValue) => void
  /** Label shown above the input. Defaults to "Location" */
  label?: string
}

export const DELHI_DEFAULT: LocationValue = {
  lat: 28.6139, lng: 77.209, tz: 'Asia/Kolkata', name: 'New Delhi, India',
}

export function LocationPicker({ value, onChange, label = 'Location' }: Props) {
  const [query,    setQuery]    = useState(value.name)
  const [results,  setResults]  = useState<AtlasResult[]>([])
  const [open,     setOpen]     = useState(false)
  const [loading,  setLoading]  = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  // Keep query in sync if parent resets value
  useEffect(() => { setQuery(value.name) }, [value.name])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
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
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  function handleInput(val: string) {
    setQuery(val)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => search(val), 220)
  }

  function handleSelect(r: AtlasResult) {
    const name = [r.name, r.admin1, r.country].filter(Boolean).join(', ')
    setQuery(name)
    setOpen(false)
    setResults([])
    onChange({ lat: r.latitude, lng: r.longitude, tz: r.timezone, name })
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          className="input"
          type="text"
          value={query}
          onChange={e => handleInput(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search city…"
          autoComplete="off"
          style={{ width: '100%', paddingRight: loading ? '2rem' : undefined }}
        />
        {loading && (
          <span style={{
            position: 'absolute', right: '0.5rem', top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '0.72rem', color: 'var(--text-muted)',
          }}>⟳</span>
        )}
      </div>

      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', zIndex: 200, top: 'calc(100% + 4px)', left: 0, right: 0,
          background: 'var(--surface-2)', border: '1px solid var(--border-soft)',
          borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          maxHeight: 260, overflowY: 'auto',
        }}>
          {results.map((r, i) => {
            const display = [r.name, r.admin1, r.country].filter(Boolean).join(', ')
            return (
              <button
                key={i}
                onMouseDown={() => handleSelect(r)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '0.55rem 0.85rem', background: 'none', border: 'none',
                  cursor: 'pointer', borderBottom: i < results.length - 1 ? '1px solid var(--border-soft)' : 'none',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-3)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500 }}>{r.name}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {[r.admin1, r.country, r.timezone].filter(Boolean).join(' · ')}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
