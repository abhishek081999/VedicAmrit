// ─────────────────────────────────────────────────────────────
//  src/components/ui/BirthForm.tsx
//  Birth data entry form with location autocomplete
//  Defaults: Delhi · current date/time · Asia/Kolkata
// ─────────────────────────────────────────────────────────────
'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import type { ChartOutput, ChartSettings } from '@/types/astrology'
import { DEFAULT_SETTINGS } from '@/types/astrology'
import { parseCoordinate } from '@/lib/atlas/coords'

// ── Delhi defaults ────────────────────────────────────────────

const DELHI_DEFAULT = {
  name: 'Delhi',
  place: 'New Delhi, Delhi, IN',
  lat: 28.6139,
  lng: 77.2090,
  tz: 'Asia/Kolkata',
}

const FALLBACK_TZ_LIST = [
  'Asia/Kolkata', 'Asia/Kathmandu', 'Asia/Dubai', 'Asia/Singapore', 
  'UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 
  'Europe/Paris', 'Australia/Sydney', 'Asia/Tokyo', 'Asia/Hong_Kong'
]

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
  name: string
  country: string
  admin1: string
  latitude: number
  longitude: number
  timezone: string
}

interface BirthFormProps {
  onResult: (data: ChartOutput) => void
  onLoading?: (loading: boolean) => void
  autoSubmit?: boolean   // calculate immediately on mount with defaults
  initialName?: string
  initialData?: {
    name: string; birthDate: string; birthTime: string; birthPlace: string
    latitude: number; longitude: number; timezone: string; settings?: ChartSettings
  }
}

// ── Component ────────────────────────────────────────────────

export function BirthForm({ onResult, onLoading, autoSubmit = false, initialName = 'Transit', initialData }: BirthFormProps) {
  const { date: todayDate, time: nowTime } = nowIST()
  const searchParams = useSearchParams()

  const [name, setName] = useState(initialData?.name || initialName)
  const [date, setDate] = useState(initialData?.birthDate || todayDate)
  const [time, setTime] = useState(initialData?.birthTime || nowTime)
  const [place, setPlace] = useState(initialData?.birthPlace || DELHI_DEFAULT.place)
  const [lat, setLat] = useState<number | null>(initialData?.latitude ?? DELHI_DEFAULT.lat)
  const [lng, setLng] = useState<number | null>(initialData?.longitude ?? DELHI_DEFAULT.lng)
  const [tz, setTz] = useState(initialData?.timezone || DELHI_DEFAULT.tz)
  const [settings, setSettings] = useState<ChartSettings>(initialData?.settings || DEFAULT_SETTINGS)

  const [locationResults, setLocationResults] = useState<LocationResult[]>([])
  const [searchOpen, setSearchOpen] = useState(false)
  const [searching, setSearching] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [manualMode, setManualMode] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  
  // Timezone list for manual entry
  // Initialized with fallback list to avoid hydration mismatch between server/client
  const [tzList, setTzList] = useState(FALLBACK_TZ_LIST)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    // Populate full IANA list on client mount
    if (typeof Intl !== 'undefined' && (Intl as any).supportedValuesOf) {
      try {
        const fullList = (Intl as any).supportedValuesOf('timeZone') as string[]
        // Ensure both modern and legacy names are available for common Indian zones
        if (!fullList.includes('Asia/Kolkata')) fullList.push('Asia/Kolkata')
        if (!fullList.includes('Asia/Calcutta')) fullList.push('Asia/Calcutta')

        const sorted = [...new Set(fullList)].sort((a, b) => {
          const aAsia = a.startsWith('Asia/')
          const bAsia = b.startsWith('Asia/')
          if (aAsia && !bAsia) return -1
          if (!aAsia && bAsia) return 1
          return a.localeCompare(b)
        })
        setTzList(sorted)
      } catch (e) {
        console.warn("Full timezone list not supported", e)
      }
    }
  }, [])

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchCache = useRef<Map<string, LocationResult[]>>(new Map())
  const dropdownRef = useRef<HTMLDivElement>(null)
  const didAutoSubmit = useRef(false)

  // ── Pre-fill and Auto-submit from URL ────────────────────────

  useEffect(() => {
    if (didAutoSubmit.current) return

    const pName = searchParams.get('name')
    const pDate = searchParams.get('birthDate')
    const pTime = searchParams.get('birthTime')
    const pPlace = searchParams.get('birthPlace')
    const pLat = searchParams.get('lat')
    const pLng = searchParams.get('lng')
    const pTz = searchParams.get('tz')

    if (pName && pDate && pTime && pLat && pLng) {
      didAutoSubmit.current = true
      const n = pName
      const d = pDate
      const t = pTime
      const pl = pPlace || ''
      const lt = parseFloat(pLat)
      const lg = parseFloat(pLng)
      const tzone = pTz || '' // Start empty if not provided from URL

      setName(n)
      setDate(d)
      setTime(t)
      setPlace(pl)
      setLat(lt)
      setLng(lg)
      
      if (tzone) {
        setTz(tzone)
        setTimeout(() => submitChart(n, d, t, pl, lt, lg, tzone, settings), 150)
      } else {
        // If coords provided but no TZ, we MUST resolve it first to avoid UTC bug
        fetch(`/api/atlas/search?lat=${lt}&lng=${lg}`)
          .then(r => r.json())
          .then(data => {
            const resolvedTz = data.results?.[0]?.timezone || 'Asia/Kolkata' // Default to IST if all else fails
            setTz(resolvedTz)
            submitChart(n, d, t, pl, lt, lg, resolvedTz, settings)
          })
          .catch(() => {
            setTz('Asia/Kolkata')
            submitChart(n, d, t, pl, lt, lg, 'Asia/Kolkata', settings)
          })
      }
    } else if (autoSubmit && initialData) {
      didAutoSubmit.current = true
      const resolvedTz = initialData.timezone || 'Asia/Kolkata'
      setTz(resolvedTz)
      setTimeout(() => submitChart(
        initialData.name,
        initialData.birthDate,
        initialData.birthTime,
        initialData.birthPlace,
        initialData.latitude,
        initialData.longitude,
        resolvedTz,
        initialData.settings || DEFAULT_SETTINGS
      ), 150)
    } else if (autoSubmit) {
      didAutoSubmit.current = true
      setTz(DELHI_DEFAULT.tz)
      setTimeout(() => submitChart(
        DELHI_DEFAULT.name,
        todayDate,
        nowTime,
        DELHI_DEFAULT.place,
        DELHI_DEFAULT.lat,
        DELHI_DEFAULT.lng,
        DELHI_DEFAULT.tz,
        DEFAULT_SETTINGS,
      ), 150)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, autoSubmit, initialData])

  // ── Location search ───────────────────────────────────────

  const searchLocations = useCallback(async (q: string) => {
    const query = q.trim().toLowerCase()
    if (query.length < 2) { setLocationResults([]); return }
    
    // Check cache first
    if (searchCache.current.has(query)) {
      setLocationResults(searchCache.current.get(query) || [])
      setSearchOpen(true)
      return
    }

    setSearching(true)
    try {
      const res = await fetch(`/api/atlas/search?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      let results = data.results ?? []
      
      // Client-side fix: If any result still says UTC but is in SAARC region, fix it
      results = results.map((loc: LocationResult) => {
        if (loc.timezone === 'UTC') {
          const isNepal = loc.country === 'Nepal' || (loc.latitude > 26.0 && loc.latitude < 30.5 && loc.longitude > 80.0 && loc.longitude < 88.5)
          const isIndia = !isNepal && (loc.latitude > 6.7 && loc.latitude < 37.5 && loc.longitude > 68.1 && loc.longitude < 97.4)
          if (isNepal) return { ...loc, timezone: 'Asia/Kathmandu' }
          if (isIndia) return { ...loc, timezone: 'Asia/Kolkata' }
        }
        return loc
      })
      
      // Only cache if results are GOOD (no UTC for India/Nepal)
      const hasBadUTC = results.some((r: LocationResult) => 
        r.timezone === 'UTC' && r.latitude > 6.7 && r.latitude < 37.5 && r.longitude > 68.1 && r.longitude < 97.4
      )
      
      if (!hasBadUTC && results.length > 0) {
        searchCache.current.set(query, results)
      }
      
      setLocationResults(results)
      setSearchOpen(true)
    } catch {
      setLocationResults([])
    } finally {
      setSearching(false)
    }
  }, [])

  const useMyLocation = () => {
    if (!navigator.geolocation) return
    setSearching(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lt, longitude: lg } = pos.coords
        setLat(lt)
        setLng(lg)
        // Reverse geocode via atlas search (approximate)
        try {
          const res = await fetch(`/api/atlas/search?lat=${lt}&lng=${lg}`)
          const data = await res.json()
          if (data.results?.[0]) {
            const loc = data.results[0]
            setPlace(`${loc.name}, ${loc.country}`)
            setTz(loc.timezone)
          } else {
            setPlace(`Current Location (${lt.toFixed(2)}, ${lg.toFixed(2)})`)
          }
        } catch {
          setPlace(`Current Location (${lt.toFixed(2)}, ${lg.toFixed(2)})`)
        } finally {
          setSearching(false)
        }
      },
      () => setSearching(false)
    )
  }

  const resolveTimezoneFromCoords = async () => {
    if (lat === null || lng === null) return
    setSearching(true)
    try {
      const res = await fetch(`/api/atlas/search?lat=${lat}&lng=${lng}`)
      const data = await res.json()
      if (data.results?.[0]?.timezone) {
        let resolvedTz = data.results[0].timezone
        // Client-side fix for UTC fallback in SAARC
        if (resolvedTz === 'UTC') {
          const loc = data.results[0]
          const isNepal = loc.country === 'Nepal' || (lat > 26.0 && lat < 30.5 && lng > 80.0 && lng < 88.5)
          const isIndia = !isNepal && (lat > 6.7 && lat < 37.5 && lng > 68.1 && lng < 97.4)
          if (isNepal) resolvedTz = 'Asia/Kathmandu'
          else if (isIndia) resolvedTz = 'Asia/Kolkata'
        }
        setTz(resolvedTz)
      }
    } catch {
      // ignore
    } finally {
      setSearching(false)
    }
  }

  // Auto-calculate is disabled — chart only recalculates on explicit button click.
  // (The initial autoSubmit on mount still works via the URL/defaults effect above.)

  const handlePlaceChange = (val: string) => {
    setPlace(val)
    setLat(null); setLng(null)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    
    // If it's in cache, show it immediately
    const query = val.trim().toLowerCase()
    if (query.length >= 2 && searchCache.current.has(query)) {
        setLocationResults(searchCache.current.get(query)!)
        setSearchOpen(true)
    }

    searchTimer.current = setTimeout(() => searchLocations(val), 75)
  }

  const selectLocation = (loc: LocationResult) => {
    setPlace(`${loc.name}${loc.admin1 ? ', ' + loc.admin1 : ''}, ${loc.country}`)
    setLat(loc.latitude)
    setLng(loc.longitude)
    setTz(loc.timezone)
    setLocationResults([])
    setSearchOpen(false)
    setManualMode(false) // Exit manual mode if picking from list
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
          name: nameVal.trim() || 'Delhi',
          birthDate: dateVal,
          birthTime: safeTime,
          birthPlace: placeVal,
          latitude: latVal,
          longitude: lngVal,
          timezone: tzVal,
          settings: settingsVal,
          _t: Date.now(), // Cache buster to force re-calculation
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
    if (!date) { setError('Please enter birth date'); return }
    if (lat === null || lng === null) { 
      setError('Please select a location or enter coordinates manually'); 
      return 
    }

    // If in manual mode, use the coordinates as the place name
    const finalPlace = manualMode 
      ? `Manual (${lat.toFixed(4)}, ${lng.toFixed(4)})` 
      : place

    await submitChart(name, date, time, finalPlace, lat, lng, tz, settings)
  }

  // ── Date Part Handlers ────────────────────────────────────

  const handleDatePartChange = (part: 'y' | 'm' | 'd', val: number) => {
    if (isNaN(val)) return
    const parts = date.split('-')
    let y = parseInt(parts[0]) || 2000
    let m = parseInt(parts[1]) || 1
    let d = parseInt(parts[2]) || 1
    
    if (part === 'y') y = val
    else if (part === 'm') m = val
    else if (part === 'd') d = val

    // Validate day count for the month (e.g. Feb 31 -> Feb 28/29)
    const maxDays = new Date(y, m, 0).getDate()
    if (d > maxDays) d = maxDays

    const dStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    setDate(dStr)
  }

  const handleTimePartChange = (part: 'h' | 'm' | 's' | 'p', val: string | number) => {
    const parts = time.split(':')
    let h24 = parseInt(parts[0]) || 0
    let m = parseInt(parts[1]) || 0
    let s = parseInt(parts[2]) || 0
    
    // Current 12h state
    let h12 = h24 % 12 || 12
    let ampm = h24 >= 12 ? 'PM' : 'AM'

    if (part === 'h') h12 = val as number
    else if (part === 'm') m = val as number
    else if (part === 's') s = val as number
    else if (part === 'p') ampm = val as string

    // Back to 24h
    let newH24 = h12 % 12
    if (ampm === 'PM') newH24 += 12
    
    const tStr = `${String(newH24).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    setTime(tStr)
  }

  // ── Refresh to now ────────────────────────────────────────

  const setToNow = () => {
    const { date: d, time: t } = nowIST()
    setDate(d)
    setTime(t)
  }

  // Format time for input display (HH:MM:SS)
  const formatTimeForInput = (timeStr: string) => {
    if (!timeStr) return '00:00:00'
    const parts = timeStr.split(':')
    if (parts.length === 2) {
      return `${parts[0]}:${parts[1]}:00`
    }
    if (parts.length >= 3) {
      return `${parts[0]}:${parts[1]}:${parts[2]}`
    }
    return timeStr
  }

  // Handle time input change (supports HH:MM, HH:MM:SS, and step values)
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value
    // If the input doesn't have seconds, append :00
    if (value && value.split(':').length === 2) {
      value = `${value}:00`
    }
    setTime(value)
  }

  // ── Incremental Time Adjusters ───────────────────────────

  const adjustTime = (minutes: number) => {
    const current = new Date(`${date}T${formatTimeForInput(time)}`)
    if (isNaN(current.getTime())) return
    current.setMinutes(current.getMinutes() + minutes)
    
    const yyyy = current.getFullYear()
    const mm = String(current.getMonth() + 1).padStart(2, '0')
    const dd = String(current.getDate()).padStart(2, '0')
    const hh = String(current.getHours()).padStart(2, '0')
    const mins = String(current.getMinutes()).padStart(2, '0')
    const ss = String(current.getSeconds()).padStart(2, '0')
    
    setDate(`${yyyy}-${mm}-${dd}`)
    setTime(`${hh}:${mins}:${ss}`)
  }

  // ── Render ────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', overflow: 'visible' }}>
      



      {/* Name Field */}
      <div style={{ width: '100%' }}>
        <label className="field-label" style={{ marginBottom: '0.15rem' }}>Name / Label</label>
        <input
          className="input"
          type="text"
          placeholder="e.g. Ravi Kumar"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="off"
          style={{ width: '100%', boxSizing: 'border-box' }}
        />
      </div>

      {/* Date + Time section */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr 1.15fr' : '1fr 1.1fr', 
        gap: isMobile ? '0.65rem' : '1.25rem', 
        width: '100%' 
      }}>
        {/* Date Field */}
        <div style={{ width: '100%', minWidth: 0 }}>
          <label className="field-label" style={{ marginBottom: '0.25rem' }}>Date</label>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center',
            background: 'var(--surface-2)',
            border: '1px solid var(--border-soft)',
            borderRadius: 'var(--r-md)',
            height: '42px',
            overflow: 'hidden'
          }}>
            <select
              value={parseInt(date.split('-')[2]) || 1}
              onChange={(e) => handleDatePartChange('d', parseInt(e.target.value))}
              style={{ 
                width: isMobile ? '38px' : '48px', background: 'transparent', border: 'none', 
                padding: isMobile ? '0 0 0 6px' : '0 4px', fontSize: '0.9rem', color: 'var(--text-primary)',
                cursor: 'pointer', appearance: 'none', textAlign: 'center'
              }}
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                <option key={d} value={d}>{String(d).padStart(2, '0')}</option>
              ))}
            </select>
            <div style={{ width: '1px', height: '16px', background: 'var(--border-soft)', opacity: 0.6 }} />
            <select
              value={parseInt(date.split('-')[1]) || 1}
              onChange={(e) => handleDatePartChange('m', parseInt(e.target.value))}
              style={{ 
                flex: 1, background: 'transparent', border: 'none', 
                padding: '0 4px', fontSize: '0.9rem', color: 'var(--text-primary)',
                cursor: 'pointer', appearance: 'none', textAlign: 'center'
              }}
            >
              {[
                'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
              ].map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
            <div style={{ width: '1px', height: '16px', background: 'var(--border-soft)', opacity: 0.6 }} />
            <input
              type="number"
              value={date.split('-')[0]}
              onChange={(e) => handleDatePartChange('y', parseInt(e.target.value))}
              style={{ 
                width: isMobile ? '48px' : '65px', background: 'transparent', border: 'none', 
                padding: isMobile ? '0 6px 0 2px' : '0 8px', fontSize: '0.9rem', color: 'var(--text-primary)',
                textAlign: 'center', appearance: 'none'
              }}
            />
          </div>
        </div>

        {/* Time Field - Same Pill Design */}
        <div style={{ width: '100%', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
            <label className="field-label" style={{ marginBottom: 0 }}>Time</label>
            <button
              type="button"
              onClick={setToNow}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--gold)', fontSize: '0.6rem',
                fontFamily: 'var(--font-body)', letterSpacing: '0.04em',
                padding: 0, textTransform: 'uppercase', fontWeight: 600,
              }}
            >
              Now ↺
            </button>
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center',
            background: 'var(--surface-2)',
            border: '1px solid var(--border-soft)',
            borderRadius: 'var(--r-md)',
            height: '42px',
            overflow: 'hidden'
          }}>
            {/* Hours */}
            <select
              value={parseInt(time.split(':')[0]) % 12 || 12}
              onChange={(e) => handleTimePartChange('h', parseInt(e.target.value))}
              style={{ 
                width: isMobile ? '32px' : '42px', background: 'transparent', border: 'none', 
                padding: isMobile ? '0 0 0 4px' : '0 4px', fontSize: '0.9rem', color: 'var(--text-primary)',
                cursor: 'pointer', appearance: 'none', textAlign: 'center'
              }}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                <option key={h} value={h}>{String(h).padStart(2, '0')}</option>
              ))}
            </select>
            <div style={{ width: '1px', height: '16px', background: 'var(--border-soft)', opacity: 0.6 }} />
            
            {/* Minutes */}
            <select
              value={parseInt(time.split(':')[1]) || 0}
              onChange={(e) => handleTimePartChange('m', parseInt(e.target.value))}
              style={{ 
                width: isMobile ? '32px' : '42px', background: 'transparent', border: 'none', 
                padding: '0', fontSize: '0.9rem', color: 'var(--text-primary)',
                cursor: 'pointer', appearance: 'none', textAlign: 'center'
              }}
            >
              {Array.from({ length: 60 }, (_, i) => i).map(m => (
                <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
              ))}
            </select>
            <div style={{ width: '1px', height: '16px', background: 'var(--border-soft)', opacity: 0.6 }} />
            
            {/* Seconds */}
            <select
              value={parseInt(time.split(':')[2]) || 0}
              onChange={(e) => handleTimePartChange('s', parseInt(e.target.value))}
              style={{ 
                width: isMobile ? '32px' : '42px', background: 'transparent', border: 'none', 
                padding: '0', fontSize: '0.9rem', color: 'var(--text-primary)',
                cursor: 'pointer', appearance: 'none', textAlign: 'center'
              }}
            >
              {Array.from({ length: 60 }, (_, i) => i).map(s => (
                <option key={s} value={s}>{String(s).padStart(2, '0')}</option>
              ))}
            </select>
            <div style={{ width: '1px', height: '16px', background: 'var(--border-soft)', opacity: 0.6 }} />
            
            {/* AM/PM */}
            <select
              value={parseInt(time.split(':')[0]) >= 12 ? 'PM' : 'AM'}
              onChange={(e) => handleTimePartChange('p', e.target.value)}
              style={{ 
                flex: 1, background: 'transparent', border: 'none', 
                padding: '0 4px 0 2px', fontSize: '0.9rem', color: 'var(--text-gold)',
                cursor: 'pointer', appearance: 'none', textAlign: 'center', fontWeight: 600
              }}
            >
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
          </div>
        </div>
      </div>

      {/* Time Adjuster Stepper */}
      <div style={{
        display: 'flex', gap: '0.25rem', justifyContent: 'center', width: '100%',
        marginTop: '-0.45rem', marginBottom: '0.2rem', flexWrap: 'nowrap'
      }}>
        {[
          { label: '-1d', val: -1440 },
          { label: '-1h', val: -60 },
          { label: '-1m', val: -1 },
          { label: '+1m', val: 1 },
          { label: '+1h', val: 60 },
          { label: '+1d', val: 1440 },
        ].map(btn => (
          <button
            key={btn.label}
            type="button"
            onClick={() => adjustTime(btn.val)}
            disabled={loading}
            style={{
              flex: '1',
              padding: '0.2rem 0',
              background: 'var(--surface-2)',
              border: '1px solid var(--border-soft)',
              borderRadius: 'var(--r-sm)',
              fontSize: '0.65rem',
              color: 'var(--text-secondary)',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-mono)',
              minWidth: '32px'
            }}
            onMouseEnter={e => {
              if (!loading) e.currentTarget.style.borderColor = 'var(--border-bright)'
            }}
            onMouseLeave={e => {
              if (!loading) e.currentTarget.style.borderColor = 'var(--border-soft)'
            }}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Location Field with autocomplete */}
      <div style={{ position: 'relative', width: '100%' }} ref={dropdownRef}>
        <label className="field-label" style={{ marginBottom: '0.15rem', display: 'flex', alignItems: 'center' }}>
          Place
          {searching && (
            <span style={{ marginLeft: 8, fontSize: '0.62rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              searching…
            </span>
          )}
          <button
            type="button"
            onClick={useMyLocation}
            title="Use current device location"
            style={{
              marginLeft: 'auto',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--gold)', fontSize: '0.62rem',
              fontFamily: 'var(--font-body)', letterSpacing: '0.04em',
              padding: 0, textTransform: 'uppercase', fontWeight: 600,
            }}
          >
            Use My Location 📍
          </button>
        </label>
        {/* Mode Toggler */}
        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', marginBottom: '0.15rem' }}>
          <button
            type="button"
            onClick={() => setManualMode(!manualMode)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: manualMode ? 'var(--gold)' : 'var(--text-muted)',
              fontSize: '0.58rem', fontWeight: 600, letterSpacing: '0.04em',
              textTransform: 'uppercase', padding: '0 2px'
            }}
          >
            {manualMode ? '✓ Search City' : '✎ Enter Lat/Lng'}
          </button>
        </div>

        {manualMode ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem', background: 'var(--surface-2)', border: '1px solid var(--border-soft)', borderRadius: 'var(--r-md)', animation: 'fadeUp 0.3s cubic-bezier(0.22,1,0.36,1) both' }}>
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Latitude (-90 to 90)</label>
                  <input 
                    type="text" placeholder="e.g. 28:02 or 28.0333" 
                    className="input" style={{ width: '100%' }}
                    value={lat ?? ''} 
                    onChange={e => setLat(parseCoordinate(e.target.value))}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Longitude (-180 to 180)</label>
                  <input 
                    type="text" placeholder="e.g. 73:31 or 73.5167" 
                    className="input" style={{ width: '100%' }}
                    value={lng ?? ''} 
                    onChange={e => setLng(parseCoordinate(e.target.value))}
                  />
                </div>
             </div>
          </div>
        ) : (
          <>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                type="text"
                placeholder="City, Country"
                value={place}
                onChange={(e) => handlePlaceChange(e.target.value)}
                onFocus={() => {
                  if (locationResults.length > 0) setSearchOpen(true)
                  else if (place.length >= 2) searchLocations(place)
                }}
                autoComplete="off"
                style={{ width: '100%', boxSizing: 'border-box' }}
              />

              {/* Dropdown moved here to be relative to input */}
              {searchOpen && locationResults.length > 0 && isMobile && (
                <div
                  onClick={() => setSearchOpen(false)}
                  style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.35)',
                    zIndex: 1200,
                  }}
                />
              )}

              {searchOpen && locationResults.length > 0 && (
                <div style={{
                  position: isMobile ? 'fixed' : 'absolute',
                  zIndex: isMobile ? 1201 : 100,
                  width: isMobile ? 'auto' : '100%',
                  top: isMobile ? 'auto' : '100%',
                  left: isMobile ? '12px' : 'auto',
                  right: isMobile ? '12px' : 'auto',
                  bottom: isMobile ? '12px' : 'auto',
                  marginTop: isMobile ? 0 : '6px',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border-bright)',
                  borderRadius: 12,
                  boxShadow: '0 12px 30px rgba(0,0,0,0.15), 0 4px 10px rgba(0,0,0,0.1)',
                  maxHeight: isMobile ? 'min(55vh, 420px)' : 300,
                  overflowY: 'auto',
                  boxSizing: 'border-box',
                  animation: 'fadeUp 0.2s ease-out'
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
                        boxSizing: 'border-box',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(201,168,76,0.07)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: '1rem', color: 'var(--text-primary)' }}>
                        {loc.name}
                        {loc.admin1 && (
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>, {loc.admin1}</span>
                        )}
                      </span>
                      <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', display: 'flex', gap: '0.75rem' }}>
                        <span>{loc.country}</span>
                        <span>{loc.latitude.toFixed(2)}°, {loc.longitude.toFixed(2)}°</span>
                        <span style={{ color: loc.timezone === 'UTC' ? 'var(--rose)' : 'var(--text-gold)', fontWeight: loc.timezone === 'UTC' ? 400 : 700 }}>{loc.timezone}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Coords display overlay */}
            {lat !== null && lng !== null && (
              <div style={{
                marginTop: 4, fontSize: '0.72rem',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
                display: 'flex', gap: '0.8rem', flexWrap: 'wrap',
                alignItems: 'center'
              }}>
                <span title="Latitude">{lat.toFixed(4)}° N</span>
                <span title="Longitude">{lng.toFixed(4)}° E</span>
              </div>
            )}
          </>
        )}

        {/* Unified Timezone Selection */}
        <div style={{ marginTop: '0.65rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.15rem' }}>
            <label className="field-label" style={{ marginBottom: 0 }}>Timezone (IANA)</label>
            {manualMode && (
              <button 
                type="button" 
                onClick={resolveTimezoneFromCoords}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--gold)', fontSize: '0.62rem', fontWeight: 600,
                  textTransform: 'uppercase', padding: 0, letterSpacing: '0.04em'
                }}
              >
                Resolve from Coords ⟲
              </button>
            )}
          </div>
          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              placeholder="Search e.g. Asia/Kolkata" 
              className="input" 
              style={{ width: '100%', boxSizing: 'border-box', cursor: 'pointer' }}
              value={tz} 
              onChange={e => setTz(e.target.value)}
              onFocus={e => e.target.select()}
              onMouseUp={e => e.preventDefault()} // Fix for some browsers not keeping selection on click
              list="tz-datalist"
              autoComplete="off"
            />
            <datalist id="tz-datalist">
               {/* Explicitly prioritize the most common ones at the very top */}
               <option value="Asia/Kolkata" />
               <option value="Asia/Kathmandu" />
               <option value="Asia/Calcutta" />
               <option value="Asia/Dubai" />
               <option value="Asia/Singapore" />
               <option value="UTC" />
               <option value="America/New_York" />
               <option value="Europe/London" />
               
               {/* Then the rest of the Asia/ zones and finally the global list */}
               {tzList
                 .filter(t => !['Asia/Kolkata', 'Asia/Kathmandu', 'Asia/Calcutta', 'Asia/Dubai', 'Asia/Singapore', 'UTC', 'America/New_York', 'Europe/London'].includes(t))
                 .map(t => <option key={t} value={t} />)
               }
            </datalist>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-gold)', marginTop: 2, fontStyle: 'italic', opacity: 0.8 }}>
              Selected: {tz}
            </div>
          </div>
        </div>
      </div>

      {/* Advanced settings */}
      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced((o) => !o)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)',
            fontSize: '0.8rem', fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: '0.4rem', padding: 0,
            letterSpacing: '0.03em',
          }}
        >
          <span style={{
            display: 'inline-block',
            transform: showAdvanced ? 'rotate(90deg)' : 'rotate(0)',
            transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)',
            fontSize: '0.55rem',
          }}>▶</span>
          Advanced settings
        </button>

        {showAdvanced && (
          <div className="grid-responsive-2" style={{
            marginTop: '0.75rem', padding: '1rem',
            background: 'var(--surface-2)', borderRadius: 'var(--r-md)',
            border: '1px solid var(--border-soft)',
            animation: 'fadeUp 0.3s cubic-bezier(0.22,1,0.36,1) both',
          }}>
            <div>
              <label className="field-label">Ayanamsha</label>
              <select className="input" value={settings.ayanamsha}
                onChange={(e) => setSettings((s) => ({ ...s, ayanamsha: e.target.value as any }))}
                style={{ width: '100%', boxSizing: 'border-box' }}>
                <option value="lahiri">Lahiri (default)</option>
                <option value="true_chitra">True Chitra</option>
                <option value="raman">Raman</option>
                <option value="true_revati">True Revati</option>
                <option value="usha_shashi">Usha-Shashi</option>
                <option value="yukteshwar">Yukteshwar</option>
              </select>
            </div>
            <div>
              <label className="field-label">House system</label>
              <select className="input" value={settings.houseSystem}
                onChange={(e) => setSettings((s) => ({ ...s, houseSystem: e.target.value as any }))}
                style={{ width: '100%', boxSizing: 'border-box' }}>
                <option value="whole_sign">Whole Sign</option>
                <option value="placidus">Placidus</option>
                <option value="equal">Equal House</option>
                <option value="bhava_chalita">Bhava Chalita</option>
              </select>
            </div>
            <div>
              <label className="field-label">Karaka scheme</label>
              <select className="input" value={settings.karakaScheme}
                onChange={(e) => setSettings((s) => ({ ...s, karakaScheme: Number(e.target.value) as 7 | 8 }))}
                style={{ width: '100%', boxSizing: 'border-box' }}>
                <option value={8}>8 Karakas (standard)</option>
                <option value={7}>7 Karakas</option>
              </select>
            </div>
            <div>
              <label className="field-label">Rāhu / Ketu nodes</label>
              <select className="input" value={settings.nodeMode}
                onChange={(e) => setSettings((s) => ({ ...s, nodeMode: e.target.value as any }))}
                style={{ width: '100%', boxSizing: 'border-box' }}>
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
          fontFamily: 'var(--font-body)',
          fontSize: '0.92rem',
        }}>
          {error}
        </div>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={loading}
        className="btn btn-primary"
        style={{
          width: '100%',
          justifyContent: 'center',
          padding: '0.85rem',
          fontSize: '0.95rem',
          fontFamily: 'var(--font-body)',
          letterSpacing: '0.04em',
          opacity: loading ? 0.75 : 1,
          transition: 'opacity 0.2s',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
        }}
      >
        {loading ? (
          <>
            <span style={{
              width: 14, height: 14,
              border: '2px solid rgba(255,255,255,0.3)',
              borderTopColor: '#fff',
              borderRadius: '50%',
              animation: 'spin-slow 0.7s linear infinite',
              display: 'inline-block',
              flexShrink: 0,
            }} />
            Consulting the stars…
          </>
        ) : (
          <>🪐 Calculate Chart</>
        )}
      </button>
    </form>
  )
}