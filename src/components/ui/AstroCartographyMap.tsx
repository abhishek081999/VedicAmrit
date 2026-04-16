'use client'
import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip, ZoomControl, useMapEvents, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import dynamic from 'next/dynamic'
import type { GrahaId, Rashi } from '@/types/astrology'
import { RASHI_NAMES } from '@/types/astrology'

const MAJOR_CITIES = [
  { name: 'London', lat: 51.5074, lng: -0.1278 }, { name: 'New York', lat: 40.7128, lng: -74.0060 },
  { name: 'Tokyo', lat: 35.6895, lng: 139.6917 }, { name: 'Dubai', lat: 25.2048, lng: 55.2708 },
  { name: 'Singapore', lat: 1.3521, lng: 103.8198 }, { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
  { name: 'Paris', lat: 48.8566, lng: 2.3522 }, { name: 'Sydney', lat: -33.8688, lng: 151.2093 },
  { name: 'Los Angeles', lat: 34.0522, lng: -118.2437 }, { name: 'San Francisco', lat: 37.7749, lng: -122.4194 },
  { name: 'Hong Kong', lat: 22.3193, lng: 114.1694 }, { name: 'Bangkok', lat: 13.7563, lng: 100.5018 },
  { name: 'Berlin', lat: 52.5200, lng: 13.4050 }, { name: 'Seoul', lat: 37.5665, lng: 126.9780 }
]

const COLORS: Record<string, string> = { Su: '#FFD700', Mo: '#FFFFFF', Ma: '#FF4500', Me: '#00FF7F', Ju: '#FFA500', Ve: '#FF69B4', Sa: '#8A2BE2', Ra: '#A9A9A9' }
const GLYPHS: Record<string, string> = { Su: '☉', Mo: '☽', Ma: '♂', Me: '☿', Ju: '♃', Ve: '♀', Sa: '♄', Ra: '☊' }
const NAMES: Record<string, string> = { Su: 'Sun', Mo: 'Moon', Ma: 'Mars', Me: 'Mercury', Ju: 'Jupiter', Ve: 'Venus', Sa: 'Saturn', Ra: 'Rahu' }

const THEMES = [
  { id: 'all', label: 'All Layers', icon: '🌌', planets: ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra'] },
  { id: 'wealth', label: 'Abundance', icon: '💰', planets: ['Ju', 'Ve', 'Me'] },
  { id: 'love', label: 'Harmony', icon: '❤️', planets: ['Ve', 'Mo'] },
  { id: 'career', label: 'Power', icon: '🏆', planets: ['Su', 'Ma', 'Ju'] },
]

interface ACGLineData { grahaId: GrahaId; mcLine: number; icLine: number; aspects: any[]; asCurve: [number, number][][]; dsCurve: [number, number][][]; zenith: [number, number]; localSpaceBearing: number; }
interface ACGParan { p1: GrahaId; p2: GrahaId; lat: number; lon: number; }
interface Props { jd: number; birthCoords?: [number, number]; onVisiblePlanetsChange?: (planets: Set<GrahaId>, parans: ACGParan[], natalData?: any[]) => void }

function CitySearch({ onSelect, isDark, isMobile }: any) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const map = useMap()
  const search = async (val: string) => {
    setQ(val); if (val.length < 2) { setResults([]); return }
    const res = await fetch(`/api/atlas/search?q=${val}`); const json = await res.json()
    if (json.results) setResults(json.results)
  }
  return (
    <div style={{ position: 'absolute', top: isMobile ? 12 : 25, left: isMobile ? 12 : 25, zIndex: 1000, width: isMobile ? 'calc(100% - 80px)' : 340 }}>
      <input value={q} onChange={e => search(e.target.value)} onFocus={() => setOpen(true)} placeholder="Search destinations..." 
        style={{ width: '100%', padding: '14px 20px 14px 45px', borderRadius: '16px', border: '1px solid var(--border-bright)', background: isDark ? 'rgba(15,15,30,0.85)' : '#fff', color: isDark ? '#fff' : '#000', fontSize: '0.9rem', outline: 'none', boxShadow: '0 12px 40px rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)' }} 
      />
      {open && results.length > 0 && (
        <div style={{ marginTop: 10, background: isDark ? '#0c0c1c' : '#fff', borderRadius: 16, border: '1px solid var(--border-bright)', maxHeight: 250, overflowY: 'auto', boxShadow: '0 15px 50px rgba(0,0,0,0.7)' }}>
          {results.map((r, i) => (
            <div key={i} onClick={() => { map.flyTo([r.latitude, r.longitude], 8); onSelect(r.latitude, r.longitude); setOpen(false); setQ(r.name) }} 
                 style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-soft)', cursor: 'pointer', fontSize: '0.85rem', color: isDark ? '#eee' : '#333' }}>
              {r.name}, {r.admin1} ({r.country})
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({ click(e) { if (e?.latlng) onClick(e.latlng.lat, e.latlng.lng) } }); return null;
}

const getIcon = (glyph: string, color: string, glow = false) => L.divIcon({
  html: `<div style="color: ${color}; font-size: 1.2rem; text-shadow: 0 0 ${glow ? '12px' : '6px'} ${color};">${glyph}</div>`,
  className: 'acg-glyph', iconSize: [24, 24], iconAnchor: [12, 12]
})

export default function AstroCartographyMap({ jd: natalJd, birthCoords, onVisiblePlanetsChange }: Props) {
  const [natalData, setNatalData] = useState<ACGLineData[]>([])
  const [transitData, setTransitData] = useState<ACGLineData[]>([])
  const [natalParans, setNatalParans] = useState<ACGParan[]>([])
  const [loading, setLoading] = useState(true)
  const [visiblePlanets, setVisiblePlanets] = useState<Set<GrahaId>>(new Set(['Su', 'Mo', 'Ju', 'Ve']))
  const [viewMode, setViewMode] = useState<'natal' | 'transit' | 'both'>('natal')
  const [mapTheme, setMapTheme] = useState<'dark' | 'light'>('dark')
  const [showPlanetControls, setShowPlanetControls] = useState(false)
  const [showAspects, setShowAspects] = useState(false)
  const [relocatedPoint, setRelocatedPoint] = useState<[number, number] | null>(null)
  const [relocationStats, setRelocationStats] = useState<any>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768); check();
    window.addEventListener('resize', check); return () => window.removeEventListener('resize', check);
  }, [])

  // Sync with global theme
  useEffect(() => {
    const sync = () => {
      const t = document.documentElement.getAttribute('data-theme') || 'dark'
      setMapTheme(t === 'light' ? 'light' : 'dark')
    }
    sync()
    const observer = new MutationObserver(sync)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const filtered = natalParans.filter(p => visiblePlanets.has(p.p1) && visiblePlanets.has(p.p2));
    onVisiblePlanetsChange?.(visiblePlanets, filtered, natalData);
  }, [visiblePlanets, natalParans, natalData, onVisiblePlanetsChange])

  const lastFetch = React.useRef('')
  useEffect(() => {
    const lat = birthCoords?.[0], lng = birthCoords?.[1]
    const currentKey = `${natalJd}-${lat}-${lng}`
    if (lastFetch.current === currentKey) return
    
    async function fetchAll() {
      setLoading(true)
      try {
        const hasCoords = lat !== undefined && lng !== undefined
        const nRes = await fetch(`/api/chart/astrocartography?jd=${natalJd}${hasCoords ? `&lat=${lat}&lng=${lng}` : ''}`)
        const nJson = await nRes.json(); if (nJson.success) { setNatalData(nJson.lines); setNatalParans(nJson.parans); }
        const tJson = await (await fetch(`/api/chart/astrocartography?jd=${(Date.now()/86400000)+2440587.5}${hasCoords ? `&lat=${lat}&lng=${lng}` : ''}`)).json()
        if (tJson.success) setTransitData(tJson.lines)
        lastFetch.current = currentKey
      } catch (e) {} finally { setLoading(false) }
    }
    fetchAll()
  }, [natalJd, birthCoords?.[0], birthCoords?.[1]])

  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    setRelocatedPoint([lat, lng])
    try {
      const res = await fetch('/api/chart/relocate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jd: viewMode === 'transit' ? (Date.now()/86400000)+2440587.5 : natalJd, lat, lng }) })
      const json = await res.json(); 
      if (json.success) {
          let nearest = { planet: 'Su' as GrahaId, dist: 999, lineType: 'MC' }
          natalData.forEach(p => { const dMC = Math.abs(lng - p.mcLine), dIC = Math.abs(lng - p.icLine); if (dMC < nearest.dist) nearest = { planet: p.grahaId, dist: dMC, lineType: 'MC' }; if (dIC < nearest.dist) nearest = { planet: p.grahaId, dist: dIC, lineType: 'IC' } })
          setRelocationStats({ ...json, nearest })
      }
    } catch (e) {}
  }, [viewMode, natalJd, natalData])

  if (loading) return <div style={{ height: '100%', background: '#0b0b14', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)' }}>Calculating Vectors...</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', height: '100%', position: 'relative' }}>
      
      {/* Themes */}
      <div 
        className="acg-theme-panel"
        style={{ display: 'flex', gap: '0.5rem', padding: '0.5rem 1rem', background: 'var(--surface-0)', overflowX: 'auto', borderBottom: '1px solid var(--border-soft)' }}
      >
        <style dangerouslySetInnerHTML={{ __html: `
          .acg-theme-panel::-webkit-scrollbar { height: 3px; }
          .acg-theme-panel::-webkit-scrollbar-track { background: transparent; }
          .acg-theme-panel::-webkit-scrollbar-thumb { background: var(--gold-faint); border-radius: 10px; }
        ` }} />
        {THEMES.map(t => (
          <button key={t.id} onClick={() => setVisiblePlanets(new Set(t.planets as GrahaId[]))} 
                  style={{ padding: '8px 14px', borderRadius: '12px', background: 'var(--surface-2)', border: '1px solid var(--border)', cursor: 'pointer', whiteSpace: 'nowrap', color: 'var(--text-secondary)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>{t.icon}</span> <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Control Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 1rem', background: 'var(--surface-1)', borderBottom: '1px solid var(--border-soft)' }}>
        <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.2)', padding: '3px', borderRadius: '10px' }}>
          <button onClick={() => setViewMode('natal')} style={{ background: viewMode === 'natal' ? 'var(--gold)' : 'none', border: 'none', padding: '6px 15px', borderRadius: '8px', color: viewMode === 'natal' ? '#000' : '#888', cursor: 'pointer' }}>Natal</button>
          <button onClick={() => setViewMode('transit')} style={{ background: viewMode === 'transit' ? '#00FF7F' : 'none', border: 'none', padding: '6px 15px', borderRadius: '8px', color: viewMode === 'transit' ? '#000' : '#888', cursor: 'pointer' }}>Transit</button>
          <button onClick={() => setViewMode('both')} style={{ background: viewMode === 'both' ? '#3B82F6' : 'none', border: 'none', padding: '6px 15px', borderRadius: '8px', color: viewMode === 'both' ? '#000' : '#888', cursor: 'pointer' }}>Overlay</button>
        </div>
        <button onClick={() => setShowAspects(!showAspects)} style={{ background: showAspects ? 'var(--gold-faint)' : 'none', border: '1px solid var(--gold)', color: 'var(--gold)', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.7rem' }}>Aspects</button>
      </div>

      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        
        {/* ── Planet Control Toggle (Mobile) ── */}
        {isMobile && (
          <button 
            onClick={() => setShowPlanetControls(!showPlanetControls)}
            style={{
              position: 'absolute', 
              top: 12, 
              right: 12, 
              zIndex: 1100,
              background: 'var(--gold)', 
              border: 'none', 
              borderRadius: '12px',
              width: 44, 
              height: 44, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              cursor: 'pointer', 
              fontSize: '1.4rem'
            }}
          >
            {showPlanetControls ? '✕' : '🪐'}
          </button>
        )}

        {/* ── Planet Sidebar ── */}
        <div style={{ 
          position: 'absolute', 
          top: isMobile ? 12 : 20, 
          right: isMobile ? (showPlanetControls ? 12 : -220) : 20, 
          zIndex: 1000, 
          background: mapTheme === 'dark' ? 'rgba(15,15,35,0.92)' : 'rgba(255,255,255,0.95)', 
          backdropFilter: 'blur(24px)', 
          padding: '1.5rem', 
          borderRadius: '24px', 
          border: '1px solid var(--border-bright)', 
          width: 200, 
          maxHeight: isMobile ? 'calc(100% - 140px)' : 'calc(100% - 60px)', 
          overflowY: 'auto',
          color: mapTheme === 'dark' ? '#fff' : '#000',
          transition: 'all 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)'
        }}>
           <div className="label-caps" style={{ fontSize: '0.6rem', color: 'var(--gold)', marginBottom: '1rem', fontWeight: 900, letterSpacing: '0.1em' }}>Visible Orbs</div>
           <div style={{ display: 'grid', gap: '4px' }}>
            {['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra'].map(id => {
              const active = visiblePlanets.has(id as GrahaId)
              return (
                <button 
                  key={id} 
                  onClick={() => setVisiblePlanets(prev => { const n = new Set(prev); if (n.has(id as GrahaId)) n.delete(id as GrahaId); else n.add(id as GrahaId); return n; })} 
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '0.85rem', background: active ? 'rgba(255,255,255,0.05)' : 'none', 
                    border: 'none', cursor: 'pointer', fontSize: '0.85rem', padding: '8px 12px', borderRadius: '12px',
                    width: '100%', color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                    transition: 'all 0.2s ease',
                    textAlign: 'left'
                  }}
                >
                  <span style={{ fontSize: '1.3rem', color: COLORS[id], filter: active ? `drop-shadow(0 0 8px ${COLORS[id]}66)` : 'none' }}>{GLYPHS[id]}</span> 
                  <span style={{ fontWeight: active ? 700 : 400 }}>{NAMES[id]}</span>
                </button>
              )
            })}
           </div>
        </div>

        {/* Relocation Drawer */}
        {relocatedPoint && relocationStats && (
            <div style={{ position: 'absolute', bottom: isMobile ? 0 : 25, left: isMobile ? 0 : 25, right: isMobile ? 0 : 'auto', zIndex: 1100, background: mapTheme === 'dark' ? '#0a0a18' : '#fff', padding: '1.5rem', borderRadius: isMobile ? '20px 20px 0 0' : '20px', border: '1px solid var(--gold)', width: isMobile ? '100%' : 400 }}>
              <div style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '8px' }}>{RASHI_NAMES[(Math.floor((relocationStats.relocatedAsc||0)/30)+1) as Rashi]} Ascendant</div>
              <button onClick={() => setRelocatedPoint(null)} style={{ position: 'absolute', top: 15, right: 15, background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>✕</button>
              {relocationStats.nearest && <div style={{ fontSize: '0.85rem', color: COLORS[relocationStats.nearest.planet] }}>Nearest Line: {NAMES[relocationStats.nearest.planet]} {relocationStats.nearest.lineType}</div>}
            </div>
        )}

        <MapContainer key={`${birthCoords?.[0]}-${birthCoords?.[1]}-${natalJd}`} center={birthCoords || [20,0]} zoom={2} zoomControl={false} style={{ height: '100%', width: '100%' }}>
          <CitySearch onSelect={handleMapClick} isDark={mapTheme === 'dark'} isMobile={isMobile} />
          <ClickHandler onClick={handleMapClick} /><ZoomControl position="bottomright" />
          <TileLayer url={mapTheme === 'dark' ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"} />

          {/* Natal Lines */}
          {(viewMode === 'natal' || viewMode === 'both') && natalData.filter(p => visiblePlanets.has(p.grahaId)).map(p => (
            <React.Fragment key={`n-${p.grahaId}`}>
              <Polyline positions={[[-85, p.mcLine], [85, p.mcLine]]} pathOptions={{ color: COLORS[p.grahaId], weight: 2 }} />
              <Polyline positions={[[-85, p.icLine], [85, p.icLine]]} pathOptions={{ color: COLORS[p.grahaId], weight: 1, dashArray: '5,10' }} />
              {p.asCurve.map((seg, i) => <Polyline key={`as-${i}`} positions={seg} pathOptions={{ color: COLORS[p.grahaId], weight: 2 }} />)}
              {p.dsCurve.map((seg, i) => <Polyline key={`ds-${i}`} positions={seg} pathOptions={{ color: COLORS[p.grahaId], weight: 2 }} />)}
              <Marker position={[75, p.mcLine]} icon={getIcon(GLYPHS[p.grahaId], COLORS[p.grahaId])} />
            </React.Fragment>
          ))}

          {/* Transit Lines */}
          {(viewMode === 'transit' || viewMode === 'both') && transitData.filter(p => visiblePlanets.has(p.grahaId)).map(p => (
            <React.Fragment key={`t-${p.grahaId}`}>
              <Polyline positions={[[-85, p.mcLine], [85, p.mcLine]]} pathOptions={{ color: COLORS[p.grahaId], weight: 1.5, dashArray: '10,15' }} />
              {p.asCurve.map((seg, i) => <Polyline key={`tas-${i}`} positions={seg} pathOptions={{ color: COLORS[p.grahaId], weight: 1.5, dashArray: '10,15' }} />)}
            </React.Fragment>
          ))}

          {birthCoords && <CircleMarker center={birthCoords} radius={6} pathOptions={{ color: 'var(--gold)', fillColor: '#fff', fillOpacity: 1 }} />}
        </MapContainer>
      </div>
    </div>
  )
}
