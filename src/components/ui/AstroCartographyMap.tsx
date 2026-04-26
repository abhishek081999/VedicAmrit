'use client'
import React, { useEffect, useState, useCallback, useRef } from 'react'
import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip, ZoomControl, useMapEvents, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { GrahaId, Rashi } from '@/types/astrology'
import { RASHI_NAMES } from '@/types/astrology'
import { ACG_INTERPRETATIONS } from '@/lib/engine/astroInterpretation'

const COLORS: Record<string, string> = {
  Su: '#FFD700', Mo: '#B8D4F0', Ma: '#FF4500', Me: '#00E56B',
  Ju: '#FFA500', Ve: '#FF69B4', Sa: '#9B7FD4', Ra: '#A9A9A9',
}
const GLYPHS: Record<string, string> = {
  Su: '☉', Mo: '☽', Ma: '♂', Me: '☿', Ju: '♃', Ve: '♀', Sa: '♄', Ra: '☊',
}
const NAMES: Record<string, string> = {
  Su: 'Sun', Mo: 'Moon', Ma: 'Mars', Me: 'Mercury',
  Ju: 'Jupiter', Ve: 'Venus', Sa: 'Saturn', Ra: 'Rahu',
}
const PLANET_THEMES: Record<string, string> = {
  Su: 'Power & Visibility', Mo: 'Emotions & Home', Ma: 'Energy & Drive',
  Me: 'Mind & Communication', Ju: 'Growth & Wisdom', Ve: 'Love & Beauty',
  Sa: 'Discipline & Legacy', Ra: 'Transformation',
}

const THEMES = [
  { id: 'all',    label: 'All',      icon: '🌌', planets: ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra'] },
  { id: 'wealth', label: 'Abundance', icon: '💰', planets: ['Ju', 'Ve', 'Me'] },
  { id: 'love',   label: 'Love',     icon: '❤️',  planets: ['Ve', 'Mo'] },
  { id: 'career', label: 'Career',   icon: '🏆', planets: ['Su', 'Ma', 'Ju'] },
  { id: 'spirit', label: 'Spirit',   icon: '🧿', planets: ['Mo', 'Ju', 'Sa'] },
]

const ALL_PLANETS: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra']

interface ACGLineData {
  grahaId: GrahaId; mcLine: number; icLine: number; aspects: any[];
  asCurve: [number, number][][]; dsCurve: [number, number][][];
  zenith: [number, number]; localSpaceBearing: number;
}
interface ACGParan { p1: GrahaId; p2: GrahaId; lat: number; lon: number; }
interface Props {
  jd: number
  birthCoords?: [number, number]
  onVisiblePlanetsChange?: (planets: Set<GrahaId>, parans: ACGParan[], natalData?: any[]) => void
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CitySearch({ onSelect, isDark, isMobile }: { onSelect: (lat: number, lng: number) => void; isDark: boolean; isMobile: boolean }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const map = useMap()

  const search = async (val: string) => {
    setQ(val)
    if (val.length < 2) { setResults([]); return }
    try {
      const res = await fetch(`/api/atlas/search?q=${encodeURIComponent(val)}`)
      const json = await res.json()
      if (json.results) setResults(json.results)
    } catch {}
  }

  const clear = () => { setQ(''); setResults([]); setOpen(false) }

  const panelBg  = isDark ? 'rgba(8,8,22,0.92)'     : 'rgba(255,255,255,0.96)'
  const inputBg  = isDark ? 'rgba(10,10,28,0.88)'   : 'rgba(255,255,255,0.94)'
  const textCol  = isDark ? '#f0f0f0'               : '#111'
  const hoverBg  = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'

  return (
    <div style={{ position: 'absolute', top: isMobile ? 12 : 20, left: isMobile ? 12 : 20, zIndex: 1000, width: isMobile ? 'calc(100% - 80px)' : 320 }}>
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', fontSize: '0.9rem', opacity: 0.45, pointerEvents: 'none' }}>🔍</span>
        <input
          value={q}
          onChange={e => search(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 180)}
          placeholder="Search destinations…"
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: '11px 36px 11px 38px', borderRadius: '14px',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`,
            background: inputBg, color: textCol, fontSize: '0.875rem', outline: 'none',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)', backdropFilter: 'blur(16px)',
          }}
        />
        {q && (
          <button onClick={clear} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', opacity: 0.5, color: textCol, padding: 0, lineHeight: 1 }}>✕</button>
        )}
      </div>

      {open && results.length > 0 && (
        <div style={{ marginTop: 6, background: panelBg, borderRadius: 12, border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`, maxHeight: 220, overflowY: 'auto', boxShadow: '0 16px 48px rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)' }}>
          {results.map((r, i) => (
            <div
              key={i}
              onMouseDown={() => {
                map.flyTo([r.latitude, r.longitude], 8, { animate: true, duration: 1.2 })
                onSelect(r.latitude, r.longitude)
                setOpen(false)
                setQ(`${r.name}${r.country ? `, ${r.country}` : ''}`)
              }}
              style={{ padding: '10px 16px', borderBottom: i < results.length - 1 ? `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}` : 'none', cursor: 'pointer', fontSize: '0.82rem', color: isDark ? '#e0e0e0' : '#333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'background 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = hoverBg }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              <span>{r.name}{r.admin1 ? `, ${r.admin1}` : ''}</span>
              <span style={{ fontSize: '0.7rem', opacity: 0.45 }}>{r.country}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({ click(e) { if (e?.latlng) onClick(e.latlng.lat, e.latlng.lng) } })
  return null
}

function MapController({ mapRef }: { mapRef: React.MutableRefObject<L.Map | null> }) {
  const map = useMap()
  useEffect(() => { mapRef.current = map }, [map, mapRef])
  return null
}

const getGlyphIcon = (glyph: string, color: string) => L.divIcon({
  html: `<div style="color:${color};font-size:1.05rem;text-shadow:0 0 8px ${color}99,0 0 18px ${color}44;line-height:1;user-select:none;">${glyph}</div>`,
  className: 'acg-glyph-icon',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AstroCartographyMap({ jd: natalJd, birthCoords, onVisiblePlanetsChange }: Props) {
  const [natalData, setNatalData]     = useState<ACGLineData[]>([])
  const [transitData, setTransitData] = useState<ACGLineData[]>([])
  const [natalParans, setNatalParans] = useState<ACGParan[]>([])
  const [loading, setLoading]         = useState(true)
  const [visiblePlanets, setVisiblePlanets] = useState<Set<GrahaId>>(new Set(['Su', 'Mo', 'Ju', 'Ve']))
  const [viewMode, setViewMode]       = useState<'natal' | 'transit' | 'both'>('natal')
  const [mapTheme, setMapTheme]       = useState<'dark' | 'light'>('light')
  const [showSidebar, setShowSidebar] = useState(false)
  const [relocatedPoint, setRelocatedPoint] = useState<[number, number] | null>(null)
  const [relocationStats, setRelocationStats] = useState<any>(null)
  const [isMobile, setIsMobile]       = useState(false)
  const [lineStyle, setLineStyle]     = useState<'vivid' | 'subtle'>('vivid')
  const [activeTheme, setActiveTheme] = useState('all')
  const mapRef = useRef<L.Map | null>(null)
  const birthLat = birthCoords?.[0]
  const birthLng = birthCoords?.[1]

  // ── Responsive ──
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // ── Theme sync ──
  useEffect(() => {
    const sync = () => {
      const t = document.documentElement.getAttribute('data-theme') || 'classic'
      setMapTheme(t === 'dark' ? 'dark' : 'light')
    }
    sync()
    const obs = new MutationObserver(sync)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => obs.disconnect()
  }, [])

  // ── Propagate selection up ──
  useEffect(() => {
    const filtered = natalParans.filter(p => visiblePlanets.has(p.p1) && visiblePlanets.has(p.p2))
    onVisiblePlanetsChange?.(visiblePlanets, filtered, natalData)
  }, [visiblePlanets, natalParans, natalData, onVisiblePlanetsChange])

  // ── Data fetch ──
  const lastFetch = useRef('')
  useEffect(() => {
    const key = `${natalJd}-${birthLat}-${birthLng}`
    if (lastFetch.current === key) return

    async function fetchAll() {
      setLoading(true)
      try {
        const hasCoords = birthLat !== undefined && birthLng !== undefined
        const coords   = hasCoords ? `&lat=${birthLat}&lng=${birthLng}` : ''
        const nRes     = await fetch(`/api/chart/astrocartography?jd=${natalJd}${coords}`)
        const nJson    = await nRes.json()
        if (nJson.success) { setNatalData(nJson.lines); setNatalParans(nJson.parans) }

        const transitJd = (Date.now() / 86400000) + 2440587.5
        const tJson = await (await fetch(`/api/chart/astrocartography?jd=${transitJd}${coords}`)).json()
        if (tJson.success) setTransitData(tJson.lines)
        lastFetch.current = key
      } catch {}
      finally { setLoading(false) }
    }
    fetchAll()
  }, [natalJd, birthLat, birthLng])

  // ── Map click → relocation ──
  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    setRelocatedPoint([lat, lng])
    try {
      const jdToUse = viewMode === 'transit' ? (Date.now() / 86400000) + 2440587.5 : natalJd
      const res  = await fetch('/api/chart/relocate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jd: jdToUse, lat, lng }),
      })
      const json = await res.json()
      if (json.success) {
        let nearest = { planet: 'Su' as GrahaId, dist: 999, lineType: 'MC' }
        natalData.forEach(p => {
          const dMC = Math.abs(lng - p.mcLine), dIC = Math.abs(lng - p.icLine)
          if (dMC < nearest.dist) nearest = { planet: p.grahaId, dist: dMC, lineType: 'MC' }
          if (dIC < nearest.dist) nearest = { planet: p.grahaId, dist: dIC, lineType: 'IC' }
          p.asCurve.forEach(seg => {
            seg.forEach(([slat, slng]) => {
              const d = Math.sqrt((lat - slat) ** 2 + (lng - slng) ** 2)
              if (d < nearest.dist) nearest = { planet: p.grahaId, dist: d, lineType: 'AS' }
            })
          })
        })
        setRelocationStats({ ...json, nearest })
      }
    } catch {}
  }, [viewMode, natalJd, natalData])

  const togglePlanet = useCallback((id: GrahaId) => {
    setActiveTheme('custom')
    setVisiblePlanets(prev => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id); else n.add(id)
      return n
    })
  }, [])

  const applyTheme = useCallback((t: typeof THEMES[0]) => {
    setActiveTheme(t.id)
    setVisiblePlanets(new Set(t.planets as GrahaId[]))
  }, [])

  const isDark   = mapTheme === 'dark'
  const opacity  = lineStyle === 'vivid' ? 0.9 : 0.45
  const panelBg  = isDark ? 'rgba(8,8,22,0.94)'     : 'rgba(255,255,255,0.97)'
  const panelBdr = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.09)'

  // ── Loading ──
  if (loading) return (
    <div style={{ height: '100%', background: 'var(--surface-1)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.875rem', color: 'var(--gold)' }}>
      <div style={{ fontSize: '2.5rem', animation: 'acg-spin 4s linear infinite' }}>🌍</div>
      <div style={{ fontSize: '0.875rem', fontWeight: 700, letterSpacing: '0.04em' }}>Calculating Planetary Vectors…</div>
      <style>{`@keyframes acg-spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }`}</style>
    </div>
  )

  // ── Relocation drawer data ──
  const ascDeg    = relocationStats?.relocatedAsc ?? 0
  const rashiIdx  = ((Math.floor(ascDeg / 30) + 1) as Rashi)
  const rashiName = RASHI_NAMES[rashiIdx] ?? '—'
  const nearest   = relocationStats?.nearest
  const nearestInterp = nearest ? ACG_INTERPRETATIONS[nearest.planet as GrahaId]?.[nearest.lineType] : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>

      {/* ── Top Control Bar ─────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.45rem 0.875rem', background: 'var(--surface-0)', borderBottom: '1px solid var(--border-soft)', gap: '0.5rem', flexWrap: 'wrap' }}>

        {/* View mode pills */}
        <div style={{ display: 'flex', gap: '3px', background: 'var(--surface-2)', padding: '3px', borderRadius: '10px', flexShrink: 0 }}>
          {(['natal', 'transit', 'both'] as const).map(m => {
            const active = viewMode === m
            const activeColor = m === 'natal' ? 'var(--gold)' : m === 'transit' ? '#22c55e' : '#3b82f6'
            return (
              <button key={m} onClick={() => setViewMode(m)} style={{
                background: active ? activeColor : 'transparent', border: 'none',
                padding: '4px 12px', borderRadius: '7px', cursor: 'pointer', fontSize: '0.72rem',
                fontWeight: 700, color: active ? '#000' : 'var(--text-muted)', transition: 'all 0.2s',
              }}>
                {m === 'both' ? 'Overlay' : m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            )
          })}
        </div>

        {/* Quick-theme filters */}
        <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', flex: 1, justifyContent: 'center' }}>
          {THEMES.map(t => {
            const active = activeTheme === t.id
            return (
              <button key={t.id} onClick={() => applyTheme(t)} style={{
                padding: '4px 10px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 700,
                background: active ? 'var(--gold-faint)' : 'transparent',
                border: `1px solid ${active ? 'var(--gold)' : 'var(--border)'}`,
                color: active ? 'var(--gold)' : 'var(--text-muted)',
                cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', gap: '4px', alignItems: 'center', transition: 'all 0.2s',
              }}>
                <span>{t.icon}</span><span>{t.label}</span>
              </button>
            )
          })}
        </div>

        {/* Vivid / Subtle toggle */}
        <button
          onClick={() => setLineStyle(s => s === 'vivid' ? 'subtle' : 'vivid')}
          title="Toggle line opacity"
          style={{ padding: '4px 11px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.68rem', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}
        >
          {lineStyle === 'vivid' ? '◉ Vivid' : '○ Subtle'}
        </button>
      </div>

      {/* ── Map + Overlays ──────────────────────────────────────── */}
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>

        {/* Mobile sidebar toggle */}
        {isMobile && (
          <button
            onClick={() => setShowSidebar(s => !s)}
            style={{ position: 'absolute', top: 12, right: 12, zIndex: 1100, background: 'var(--gold)', border: 'none', borderRadius: '12px', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', cursor: 'pointer', fontSize: '1.3rem' }}
          >
            {showSidebar ? '✕' : '🪐'}
          </button>
        )}

        {/* ── Planet Sidebar ── */}
        <div style={{
          position: 'absolute',
          top: isMobile ? 12 : 14,
          right: isMobile ? (showSidebar ? 12 : -230) : 14,
          zIndex: 1000,
          background: panelBg,
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          border: `1px solid ${panelBdr}`,
          width: 215,
          maxHeight: isMobile ? 'calc(100% - 140px)' : 'calc(100% - 32px)',
          overflowY: 'auto',
          transition: 'right 0.4s cubic-bezier(0.16,1,0.3,1)',
          boxShadow: isDark ? '0 20px 60px rgba(0,0,0,0.7)' : '0 12px 40px rgba(0,0,0,0.15)',
        }}>
          {/* Header */}
          <div style={{ padding: '0.875rem 1rem 0.5rem', borderBottom: `1px solid ${panelBdr}` }}>
            <div style={{ fontSize: '0.58rem', fontWeight: 900, color: 'var(--gold)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Planetary Layers</div>
            <div style={{ fontSize: '0.68rem', color: isDark ? '#777' : '#999', marginTop: '2px' }}>{visiblePlanets.size} of {ALL_PLANETS.length} active</div>
          </div>

          {/* Line-type legend */}
          <div style={{ padding: '0.45rem 1rem', borderBottom: `1px solid ${panelBdr}`, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 0' }}>
            {[
              { type: 'MC', desc: 'Midheaven', dash: false },
              { type: 'IC', desc: 'Nadir',     dash: true  },
              { type: 'AS', desc: 'Ascendant', dash: false },
              { type: 'DS', desc: 'Descendant',dash: true  },
            ].map(({ type, desc, dash }) => (
              <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.6rem', color: isDark ? '#777' : '#aaa' }}>
                <svg width="18" height="6" viewBox="0 0 18 6" style={{ flexShrink: 0 }}>
                  <line x1="0" y1="3" x2="18" y2="3" stroke={isDark ? '#888' : '#bbb'} strokeWidth="1.5" strokeDasharray={dash ? '4 3' : undefined} />
                </svg>
                <span style={{ fontWeight: 700 }}>{type}</span>
                <span style={{ opacity: 0.7 }}>{desc}</span>
              </div>
            ))}
          </div>

          {/* Planet list */}
          <div style={{ padding: '0.4rem 0.5rem' }}>
            {ALL_PLANETS.map(id => {
              const active = visiblePlanets.has(id as GrahaId)
              return (
                <button
                  key={id}
                  onClick={() => togglePlanet(id as GrahaId)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.625rem',
                    background: active ? `${COLORS[id]}12` : 'transparent',
                    border: `1px solid ${active ? COLORS[id] + '35' : 'transparent'}`,
                    cursor: 'pointer', padding: '6px 9px', borderRadius: '10px',
                    width: '100%', marginBottom: '2px', textAlign: 'left',
                    color: active ? (isDark ? '#f0f0f0' : '#111') : (isDark ? '#4a4a5a' : '#bbb'),
                    transition: 'all 0.18s ease',
                  }}
                >
                  <span style={{ fontSize: '1.2rem', color: active ? COLORS[id] : (isDark ? '#3a3a4a' : '#ddd'), filter: active ? `drop-shadow(0 0 5px ${COLORS[id]}80)` : 'none', transition: 'all 0.2s', lineHeight: 1, flexShrink: 0 }}>
                    {GLYPHS[id]}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: active ? 700 : 400 }}>{NAMES[id]}</div>
                    {active && <div style={{ fontSize: '0.58rem', color: COLORS[id], opacity: 0.85, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{PLANET_THEMES[id]}</div>}
                  </div>
                  {active && <div style={{ width: 6, height: 6, borderRadius: '50%', background: COLORS[id], flexShrink: 0, boxShadow: `0 0 6px ${COLORS[id]}` }} />}
                </button>
              )
            })}
          </div>

          {/* Fly-to-birth button */}
          {birthCoords && (
            <div style={{ padding: '0.5rem', borderTop: `1px solid ${panelBdr}` }}>
              <button
                onClick={() => mapRef.current?.flyTo(birthCoords, 4, { animate: true, duration: 1.5 })}
                style={{ width: '100%', padding: '8px', borderRadius: '10px', background: 'var(--gold-faint)', border: '1px solid var(--gold)', color: 'var(--gold)', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                ⊕ Fly to Birth Location
              </button>
            </div>
          )}
        </div>

        {/* ── Relocation Drawer ── */}
        {relocatedPoint && relocationStats && (
          <div style={{
            position: 'absolute',
            bottom: isMobile ? 0 : 18, left: isMobile ? 0 : 18,
            right: isMobile ? 0 : 'auto',
            zIndex: 1100,
            background: isDark ? 'rgba(6,6,18,0.97)' : 'rgba(255,255,255,0.98)',
            backdropFilter: 'blur(20px)',
            padding: '1.1rem',
            borderRadius: isMobile ? '20px 20px 0 0' : '18px',
            border: `1px solid ${nearest ? COLORS[nearest.planet] + '40' : 'var(--border)'}`,
            width: isMobile ? '100%' : 360,
            boxSizing: 'border-box',
            boxShadow: `0 20px 60px rgba(0,0,0,0.45), 0 0 0 1px ${nearest ? COLORS[nearest.planet] + '20' : 'transparent'}`,
          }}>
            <button
              onClick={() => { setRelocatedPoint(null); setRelocationStats(null) }}
              style={{ position: 'absolute', top: 11, right: 11, background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', border: 'none', borderRadius: '50%', width: 26, height: 26, cursor: 'pointer', fontSize: '0.72rem', color: isDark ? '#aaa' : '#777', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>

            {/* Title row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '0.875rem' }}>
              {nearest && (
                <div style={{ width: 42, height: 42, borderRadius: '12px', background: `${COLORS[nearest.planet]}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: COLORS[nearest.planet], border: `1px solid ${COLORS[nearest.planet]}30`, flexShrink: 0 }}>
                  {GLYPHS[nearest.planet]}
                </div>
              )}
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.975rem', color: isDark ? '#fff' : '#111' }}>{rashiName} Rising</div>
                {nearest && (
                  <div style={{ fontSize: '0.68rem', color: COLORS[nearest.planet], fontWeight: 700, marginTop: '1px' }}>
                    {NAMES[nearest.planet]} {nearest.lineType} · {nearest.dist.toFixed(1)}° away
                  </div>
                )}
              </div>
            </div>

            {/* Interpretation */}
            {nearestInterp && (
              <p style={{ margin: '0 0 0.75rem', fontSize: '0.76rem', color: isDark ? '#c8c8c8' : '#555', lineHeight: 1.55, background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', padding: '0.625rem 0.75rem', borderRadius: '10px', borderLeft: `3px solid ${nearest ? COLORS[nearest.planet] + '70' : 'var(--gold)'}` }}>
                {nearestInterp}
              </p>
            )}

            {/* Coordinates */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              {[
                { label: 'Latitude',  val: `${Math.abs(relocatedPoint[0]).toFixed(3)}°${relocatedPoint[0] >= 0 ? 'N' : 'S'}` },
                { label: 'Longitude', val: `${Math.abs(relocatedPoint[1]).toFixed(3)}°${relocatedPoint[1] >= 0 ? 'E' : 'W'}` },
              ].map(({ label, val }) => (
                <div key={label} style={{ padding: '0.45rem 0.625rem', background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.55rem', color: isDark ? '#666' : '#aaa', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em' }}>{label}</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: isDark ? '#ddd' : '#333', fontFamily: 'monospace' }}>{val}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Leaflet Map ── */}
        <MapContainer
          key={`${birthCoords?.[0]}-${birthCoords?.[1]}-${natalJd}`}
          center={birthCoords ?? [20, 0]}
          zoom={2}
          zoomControl={false}
          style={{ height: '100%', width: '100%' }}
        >
          <MapController mapRef={mapRef} />
          <CitySearch onSelect={handleMapClick} isDark={isDark} isMobile={isMobile} />
          <ClickHandler onClick={handleMapClick} />
          <ZoomControl position="bottomright" />

          <TileLayer
            url={isDark
              ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
              : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'}
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          />

          {/* ── Natal Lines ── */}
          {(viewMode === 'natal' || viewMode === 'both') && natalData.filter(p => visiblePlanets.has(p.grahaId)).map(p => (
            <React.Fragment key={`n-${p.grahaId}`}>
              {/* MC — solid, primary weight */}
              <Polyline positions={[[-85, p.mcLine], [85, p.mcLine]]} pathOptions={{ color: COLORS[p.grahaId], weight: 2.5, opacity }}>
                <Tooltip sticky className="acg-tt">{GLYPHS[p.grahaId]} {NAMES[p.grahaId]} MC — Midheaven · Career &amp; Fame</Tooltip>
              </Polyline>
              {/* IC — dashed, lighter */}
              <Polyline positions={[[-85, p.icLine], [85, p.icLine]]} pathOptions={{ color: COLORS[p.grahaId], weight: 1.5, opacity: opacity * 0.65, dashArray: '7 11' }}>
                <Tooltip sticky className="acg-tt">{GLYPHS[p.grahaId]} {NAMES[p.grahaId]} IC — Nadir · Home &amp; Roots</Tooltip>
              </Polyline>
              {/* AS curves */}
              {p.asCurve.map((seg, i) => (
                <Polyline key={`as-${i}`} positions={seg} pathOptions={{ color: COLORS[p.grahaId], weight: 2.5, opacity }}>
                  {i === 0 && <Tooltip sticky className="acg-tt">{GLYPHS[p.grahaId]} {NAMES[p.grahaId]} AS — Ascendant · Identity</Tooltip>}
                </Polyline>
              ))}
              {/* DS curves — lighter dashed */}
              {p.dsCurve.map((seg, i) => (
                <Polyline key={`ds-${i}`} positions={seg} pathOptions={{ color: COLORS[p.grahaId], weight: 1.5, opacity: opacity * 0.65, dashArray: '5 9' }}>
                  {i === 0 && <Tooltip sticky className="acg-tt">{GLYPHS[p.grahaId]} {NAMES[p.grahaId]} DS — Descendant · Relationships</Tooltip>}
                </Polyline>
              ))}
              {/* Glyph label at top */}
              <Marker position={[73, p.mcLine]} icon={getGlyphIcon(GLYPHS[p.grahaId], COLORS[p.grahaId])} />
            </React.Fragment>
          ))}

          {/* ── Transit Lines ── */}
          {(viewMode === 'transit' || viewMode === 'both') && transitData.filter(p => visiblePlanets.has(p.grahaId)).map(p => (
            <React.Fragment key={`t-${p.grahaId}`}>
              <Polyline positions={[[-85, p.mcLine], [85, p.mcLine]]} pathOptions={{ color: COLORS[p.grahaId], weight: 1.5, opacity: opacity * 0.55, dashArray: '10 16' }}>
                <Tooltip sticky className="acg-tt">⟳ {NAMES[p.grahaId]} MC (Transit)</Tooltip>
              </Polyline>
              {p.asCurve.map((seg, i) => (
                <Polyline key={`tas-${i}`} positions={seg} pathOptions={{ color: COLORS[p.grahaId], weight: 1.5, opacity: opacity * 0.55, dashArray: '10 16' }}>
                  {i === 0 && <Tooltip sticky className="acg-tt">⟳ {NAMES[p.grahaId]} AS (Transit)</Tooltip>}
                </Polyline>
              ))}
            </React.Fragment>
          ))}

          {/* Birth location marker */}
          {birthCoords && (
            <CircleMarker center={birthCoords} radius={7} pathOptions={{ color: '#FFD700', fillColor: '#fff', fillOpacity: 1, weight: 2.5 }}>
              <Tooltip direction="top" permanent className="acg-tt acg-tt-birth">Birth</Tooltip>
            </CircleMarker>
          )}

          {/* Relocated point marker */}
          {relocatedPoint && (
            <CircleMarker center={relocatedPoint} radius={6} pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.85, weight: 2 }}>
              <Tooltip direction="top" permanent className="acg-tt acg-tt-sel">Selected</Tooltip>
            </CircleMarker>
          )}
        </MapContainer>

        {/* ── Bottom Legend Bar ── */}
        <div style={{
          position: 'absolute', bottom: isMobile ? 6 : 10,
          left: '50%', transform: 'translateX(-50%)',
          zIndex: 900, pointerEvents: 'none',
          background: isDark ? 'rgba(6,6,18,0.82)' : 'rgba(255,255,255,0.88)',
          backdropFilter: 'blur(12px)',
          padding: '5px 14px', borderRadius: '20px',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
          display: 'flex', gap: '12px', alignItems: 'center',
          fontSize: '0.62rem', color: isDark ? '#aaa' : '#777',
          whiteSpace: 'nowrap',
        }}>
          {[
            { label: 'MC · Career',    dash: false, w: 2.5 },
            { label: 'IC · Home',      dash: true,  w: 1.5 },
            { label: 'AS · Identity',  dash: false, w: 2.5 },
            { label: 'DS · Relations', dash: true,  w: 1.5 },
          ].map(({ label, dash, w }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <svg width="18" height="8" viewBox="0 0 18 8">
                <line x1="0" y1="4" x2="18" y2="4" stroke={isDark ? '#aaa' : '#777'} strokeWidth={w} strokeDasharray={dash ? '4 3' : undefined} />
              </svg>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Global styles for Leaflet tooltips + glyph icons */}
      <style>{`
        .acg-tt {
          font-size: 0.76rem !important;
          font-weight: 600 !important;
          border-radius: 8px !important;
          padding: 4px 10px !important;
          white-space: nowrap !important;
          border: none !important;
          box-shadow: 0 4px 16px rgba(0,0,0,0.25) !important;
        }
        .acg-tt-birth, .acg-tt-sel {
          font-size: 0.65rem !important;
          padding: 2px 7px !important;
          font-weight: 700 !important;
        }
        .acg-glyph-icon {
          background: none !important;
          border: none !important;
        }
      `}</style>
    </div>
  )
}
