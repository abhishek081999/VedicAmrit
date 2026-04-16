'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/AstroCartographyMap.tsx
//  Master Elite ACG — With Thematic Intelligence & City Resonance
// ─────────────────────────────────────────────────────────────

import React, { useEffect, useState, useMemo } from 'react'
import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip, ZoomControl, useMapEvents, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
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

interface ACGAspectLine { type: 'Trine' | 'Square'; lon: number; }
interface ACGLineData {
  grahaId: GrahaId; mcLine: number; icLine: number; aspects: ACGAspectLine[];
  asCurve: [number, number][][]; dsCurve: [number, number][][];
  zenith: [number, number]; localSpaceBearing: number;
}
interface ACGParan { p1: GrahaId; p2: GrahaId; lat: number; lon: number; type: string; }

function CitySearch({ onSelect, isDark }: { onSelect: (lat: number, lng: number) => void, isDark: boolean }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const map = useMap()

  const search = async (val: string) => {
    setQ(val)
    if (val.length < 2) { setResults([]); return }
    const res = await fetch(`/api/atlas/search?q=${val}`)
    const json = await res.json()
    if (json.results) setResults(json.results)
  }

  return (
    <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 1000, width: 280 }}>
      <input 
        value={q} 
        onChange={e => search(e.target.value)} 
        onFocus={() => setOpen(true)}
        placeholder="Type a city (e.g. Dubai, NYC)..." 
        style={{ 
          width: '100%', padding: '12px 18px', borderRadius: '12px', border: '1px solid var(--gold)', 
          background: isDark ? 'rgba(10,10,20,0.95)' : '#fff', color: isDark ? '#fff' : '#000',
          fontSize: '0.85rem', fontWeight: 600, outline: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
        }} 
      />
      {open && results.length > 0 && (
        <div style={{ 
          marginTop: 8, background: isDark ? 'rgba(10,10,20,0.98)' : '#fff', borderRadius: 12, border: '1px solid var(--border-soft)', 
          maxHeight: 300, overflowY: 'auto' 
        }}>
          {results.map((r, i) => (
            <div 
              key={i} 
              onClick={() => { map.flyTo([r.latitude, r.longitude], 8); onSelect(r.latitude, r.longitude); setOpen(false); setQ(r.name) }} 
              style={{ padding: '10px 15px', borderBottom: '1px solid var(--border-soft)', cursor: 'pointer', fontSize: '0.8rem', color: isDark ? '#ccc' : '#444' }}
            >
              <strong>{r.name}</strong>, {r.country}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const COLORS: Record<string, string> = {
  Su: '#FFD700', Mo: '#FFFFFF', Ma: '#FF4500', Me: '#00FF7F', Ju: '#FFA500', Ve: '#FF69B4', Sa: '#8A2BE2', Ra: '#A9A9A9',
}
const GLYPHS: Record<string, string> = { Su: '☉', Mo: '☽', Ma: '♂', Me: '☿', Ju: '♃', Ve: '♀', Sa: '♄', Ra: '☊' }
const NAMES: Record<string, string> = { Su: 'Sun', Mo: 'Moon', Ma: 'Mars', Me: 'Mercury', Ju: 'Jupiter', Ve: 'Venus', Sa: 'Saturn', Ra: 'Rahu' }

const THEMES = [
  { id: 'all', label: 'All Planets', icon: '🌌', planets: ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra'] },
  { id: 'wealth', label: 'Wealth & Biz', icon: '💰', planets: ['Ju', 'Ve', 'Me'] },
  { id: 'love', label: 'Love & Home', icon: '❤️', planets: ['Ve', 'Mo'] },
  { id: 'career', label: 'Career & Fame', icon: '🏆', planets: ['Su', 'Ma', 'Ju'] },
  { id: 'spirit', label: 'Spirituality', icon: '🧘', planets: ['Ju', 'Ra', 'Mo'] },
  { id: 'focus', label: 'Discipline', icon: '⚔️', planets: ['Sa', 'Ma'] },
]

interface Props { jd: number; birthCoords?: [number, number]; onVisiblePlanetsChange?: (planets: Set<GrahaId>, parans: ACGParan[], natalData?: any[]) => void }

function ClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({ 
    click(e) { 
        if (e && e.latlng) {
            onClick(e.latlng.lat, e.latlng.lng)
        }
    } 
  }); 
  return null;
}

const GLYPH_ICONS: Record<string, any> = {}
const getIcon = (glyph: string, color: string, glow = false) => {
    const key = `${glyph}-${color}-${glow}`
    if (!GLYPH_ICONS[key]) {
        GLYPH_ICONS[key] = L.divIcon({
            html: `<div style="color: ${color}; font-size: ${glow ? '0.9rem' : '1.1rem'}; font-weight: bold; text-shadow: 0 0 ${glow ? '8px' : '4px'} ${color}; opacity: ${glow ? 0.8 : 1};">${glyph}</div>`,
            className: 'acg-glyph', iconSize: [20, 20], iconAnchor: [10, 10]
        })
    }
    return GLYPH_ICONS[key]
}

function getDestination(lat: number, lng: number, bearing: number, distance: number) {
    const R = 6371; 
    const ad = distance / R;
    const la1 = lat * Math.PI / 180;
    const lo1 = lng * Math.PI / 180;
    const br = bearing * Math.PI / 180;

    const la2 = Math.asin(Math.sin(la1) * Math.cos(ad) + Math.cos(la1) * Math.sin(ad) * Math.cos(br));
    const lo2 = lo1 + Math.atan2(Math.sin(br) * Math.sin(ad) * Math.cos(la1), Math.cos(ad) - Math.sin(la1) * Math.sin(la2));

    return [la2 * 180 / Math.PI, ((lo2 * 180 / Math.PI + 540) % 360) - 180];
}

export default function AstroCartographyMap({ jd: natalJd, birthCoords, onVisiblePlanetsChange }: Props) {
  const [natalData, setNatalData] = useState<ACGLineData[]>([])
  const [transitData, setTransitData] = useState<ACGLineData[]>([])
  const [natalParans, setNatalParans] = useState<ACGParan[]>([])
  const [currentDashaLord, setCurrentDashaLord] = useState<GrahaId | null>(null)
  const [loading, setLoading] = useState(true)
  const [visiblePlanets, setVisiblePlanets] = useState<Set<GrahaId>>(new Set(['Su', 'Mo', 'Ju', 'Ve']))
  const [viewMode, setViewMode] = useState<'natal' | 'transit' | 'both'>('natal')
  const [activeTheme, setActiveTheme] = useState('all')
  const [showAspects, setShowAspects] = useState(false)
  const [showLocalSpace, setShowLocalSpace] = useState(false)
  const [mapTheme, setMapTheme] = useState<'dark' | 'light'>('dark')
  
  const [relocatedPoint, setRelocatedPoint] = useState<[number, number] | null>(null)
  const [relocationStats, setRelocationStats] = useState<any>(null)

  const birthLat = birthCoords?.[0]
  const birthLng = birthCoords?.[1]

  useEffect(() => {
    const filtered = natalParans.filter(p => visiblePlanets.has(p.p1) && visiblePlanets.has(p.p2));
    onVisiblePlanetsChange?.(visiblePlanets, filtered, natalData);
  }, [visiblePlanets, natalParans, natalData, onVisiblePlanetsChange])

  useEffect(() => {
    async function fetchAll() {
      setLoading(true)
      try {
        const natalUrl = `/api/chart/astrocartography?jd=${natalJd}${birthCoords ? `&lat=${birthCoords[0]}&lng=${birthCoords[1]}` : ''}`
        const nRes = await fetch(natalUrl); const nJson = await nRes.json()
        if (nJson.success) { 
          setNatalData(nJson.lines); 
          setNatalParans(nJson.parans); 
          if (nJson.currentDashaLord) setCurrentDashaLord(nJson.currentDashaLord);
        }

        const todayJd = (Date.now() / 86400000) + 2440587.5;
        const transitUrl = `/api/chart/astrocartography?jd=${todayJd}${birthCoords ? `&lat=${birthCoords[0]}&lng=${birthCoords[1]}` : ''}`
        const tRes = await fetch(transitUrl); const tJson = await tRes.json()
        if (tJson.success) setTransitData(tJson.lines);
      } catch (err) {} finally { setLoading(false) }
    }
    fetchAll()
  }, [natalJd, birthLat, birthLng])

  const setPlanetaryTheme = (themeId: string) => {
    setActiveTheme(themeId)
    const t = THEMES.find(th => th.id === themeId)
    if (t) setVisiblePlanets(new Set(t.planets as GrahaId[]))
  }

  const handleMapClick = React.useCallback(async (lat: number, lng: number) => {
    if (lat === undefined || lng === undefined) return
    setRelocatedPoint([lat, lng])
    const activeJd = viewMode === 'transit' ? (Date.now() / 86400000) + 2440587.5 : natalJd;
    try {
      const res = await fetch('/api/chart/relocate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jd: activeJd, lat, lng }) })
      const json = await res.json(); 
      if (json.success) {
          // Find nearest planet line (MC/IC)
          let nearest = { planet: '' as GrahaId, dist: 999, lineType: '' }
          natalData.forEach(p => {
              const dMC = Math.abs(lng - p.mcLine)
              const dIC = Math.abs(lng - p.icLine)
              if (dMC < nearest.dist) nearest = { planet: p.grahaId, dist: dMC, lineType: 'MC' }
              if (dIC < nearest.dist) nearest = { planet: p.grahaId, dist: dIC, lineType: 'IC' }
          })
          setRelocationStats({ ...json, nearest })
      }
    } catch (e) {}
  }, [viewMode, natalJd, natalData])

  if (loading) return <div style={{ height: 600, background: '#0b0b14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="loader" /></div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      
      {/* ── Theme Presets Panel ── */}
      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', padding: '0.5rem', background: 'var(--surface-1)', borderRadius: 12, border: '1px solid var(--border)' }}>
        {THEMES.map(t => (
          <button 
            key={t.id} 
            onClick={() => setPlanetaryTheme(t.id)} 
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.5rem', 
              padding: '8px 14px', borderRadius: 8, border: activeTheme === t.id ? '2px solid var(--gold)' : '1px solid var(--border-soft)',
              background: activeTheme === t.id ? 'var(--gold-faint)' : 'none',
              cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700,
              color: activeTheme === t.id ? 'var(--gold)' : 'var(--text-muted)'
            }}
          >
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '0.6rem', background: 'var(--surface-2)', borderRadius: 14, border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: 4, borderRadius: 10 }}>
             <button onClick={() => setViewMode('natal')} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', background: viewMode === 'natal' ? 'var(--gold)' : 'none', color: viewMode === 'natal' ? '#000' : '#888', fontSize: '0.75rem', fontWeight: 800 }}>NATAL</button>
             <button onClick={() => setViewMode('transit')} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', background: viewMode === 'transit' ? '#00FF7F' : 'none', color: viewMode === 'transit' ? '#000' : '#888', fontSize: '0.75rem', fontWeight: 800 }}>TRANSIT</button>
             <button onClick={() => setViewMode('both')} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', background: viewMode === 'both' ? '#3B82F6' : 'none', color: viewMode === 'both' ? '#fff' : '#888', fontSize: '0.75rem', fontWeight: 800 }}>⭐ BOTH</button>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => setShowAspects(!showAspects)} style={{ background: showAspects ? 'var(--gold)' : 'none', border: '1px solid var(--gold)', borderRadius: 6, padding: '6px 12px', fontSize: '0.65rem', color: showAspects ? '#000' : 'var(--gold)', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>{showAspects ? 'Aspects: ON' : 'Show Aspects'}</button>
            <button onClick={() => setShowLocalSpace(!showLocalSpace)} style={{ background: showLocalSpace ? '#3B82F6' : 'none', border: '1px solid #3B82F6', borderRadius: 6, padding: '6px 12px', fontSize: '0.65rem', color: showLocalSpace ? '#fff' : '#3B82F6', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>{showLocalSpace ? 'Local Space: ON' : 'Show Local Space'}</button>
          </div>
      </div>

      <div style={{ position: 'relative', width: '100%', height: 750, borderRadius: 'var(--r-lg)', overflow: 'hidden', border: '1px solid var(--border)' }}>
        
        <div style={{
          position: 'absolute', top: 20, right: 20, zIndex: 1000,
          background: mapTheme === 'dark' ? 'rgba(12,12,25,0.95)' : 'rgba(255,255,255,0.95)', 
          backdropFilter: 'blur(16px)', padding: '1.25rem', borderRadius: '18px', 
          border: '1px solid var(--border-soft)', width: 175, color: mapTheme === 'dark' ? '#fff' : '#000'
        }}>
          {THEMES[0].planets.map(gid => {
            const id = gid as GrahaId
            return (
              <button key={id} onClick={() => setVisiblePlanets(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; })} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', padding: '5px 0', width: '100%', color: visiblePlanets.has(id) ? (mapTheme === 'dark' ? '#fff' : '#000') : '#555' }}>
                <span style={{ fontSize: '1.2rem', color: COLORS[id] }}>{GLYPHS[id]}</span>
                <span style={{ fontWeight: visiblePlanets.has(id) ? 700 : 400 }}>{NAMES[id]}</span>
              </button>
            )
          })}
          <div style={{ height: 1, background: 'var(--border-soft)', margin: '15px 0' }} />
          <button onClick={() => setMapTheme(mapTheme === 'dark' ? 'light' : 'dark')} style={{ margin: '0 auto', display: 'block', background: 'none', border: 'none', color: '#888', fontSize: '0.6rem', cursor: 'pointer' }}>🌗 Theme: {mapTheme.toUpperCase()}</button>
          {currentDashaLord && (
            <div style={{ marginTop: 15, textAlign: 'center' }}>
              <div style={{ fontSize: '0.55rem', color: COLORS[currentDashaLord], fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Dasha Lord</div>
              <div style={{ fontSize: '0.9rem', color: COLORS[currentDashaLord], fontWeight: 900 }}>{NAMES[currentDashaLord]} Highlighted</div>
            </div>
          )}
        </div>

        {relocatedPoint && relocationStats && (
            <div style={{ position: 'absolute', bottom: 20, left: 20, right: 20, zIndex: 1000, background: mapTheme === 'dark' ? 'rgba(10,10,20,0.98)' : '#fff', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--gold)', display: 'flex', gap: '2rem', alignItems: 'center', boxShadow: '0 20px 80px rgba(0,0,0,0.8)' }}>
                <div>
                   <div style={{ fontSize: '0.6rem', color: 'var(--gold)', fontWeight: 800 }}>CITY ANALYSIS</div>
                   <div style={{ color: mapTheme === 'dark' ? '#fff' : '#000', fontSize: '1.1rem', fontWeight: 800 }}>{RASHI_NAMES[(Math.floor((relocationStats.relocatedAsc || 0) / 30) + 1) as Rashi]} ASC</div>
                </div>
                <div style={{ flex: 1, fontSize: '0.8rem', color: mapTheme === 'dark' ? '#ccc' : '#444' }}>
                   Analyzing this region against your {activeTheme} goals. The {RASHI_NAMES[(Math.floor((relocationStats.relocatedAsc || 0) / 30) + 1) as Rashi]} rising sign creates a different life foundation.
                   {relocationStats.nearest && relocationStats.nearest.dist < 5 && (
                       <div style={{ marginTop: 5, color: COLORS[relocationStats.nearest.planet], fontWeight: 800 }}>
                           🎯 {relocationStats.nearest.dist.toFixed(1)}° from {NAMES[relocationStats.nearest.planet]} {relocationStats.nearest.lineType} Line
                       </div>
                   )}
                </div>
                <button onClick={() => setRelocatedPoint(null)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>✕</button>
            </div>
        )}

        <MapContainer center={birthCoords || [20,0]} zoom={2} zoomControl={false} style={{ height: '100%', width: '100%' }}>
          <CitySearch onSelect={handleMapClick} isDark={mapTheme === 'dark'} />
          <ClickHandler onClick={handleMapClick} /><ZoomControl position="bottomright" />
          <TileLayer url={mapTheme === 'dark' ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"} />

          {/* Major Cities Markers */}
          {MAJOR_CITIES.map(city => (
              <Marker key={city.name} position={[city.lat, city.lng]} icon={L.divIcon({ html: '<div style="width: 4px; height: 4px; background: #666; border-radius: 50%;"></div>', className: '' })}>
                <Tooltip direction="top" opacity={0.6}><strong>{city.name}</strong></Tooltip>
              </Marker>
          ))}

          {/* Natal Layer */}
          {(viewMode === 'natal' || viewMode === 'both') && natalData.filter(p => visiblePlanets.has(p.grahaId)).map(p => {
              const isDashaActive = p.grahaId === currentDashaLord;
              const weight = isDashaActive ? 4 : 2;
              const opacity = isDashaActive ? 1 : 0.8;
              
              return (
              <React.Fragment key={`natal-${p.grahaId}`}>
                <Polyline key={`nmc-${p.grahaId}`} positions={[[-85, p.mcLine], [85, p.mcLine]]} pathOptions={{ color: COLORS[p.grahaId], weight, opacity }} />
                <Polyline key={`nic-${p.grahaId}`} positions={[[-85, p.icLine], [85, p.icLine]]} pathOptions={{ color: COLORS[p.grahaId], weight: weight/2, dashArray: '5,5', opacity: opacity * 0.5 }} />
                {showAspects && p.aspects.map((asp, idx) => (
                   <Polyline key={`nasp-${p.grahaId}-${idx}`} positions={[[-70, asp.lon], [70, asp.lon]]} pathOptions={{ color: COLORS[p.grahaId], weight: 1, dashArray: asp.type === 'Trine' ? '12,12' : '4,8', opacity: 0.6 }} />
                ))}
                {p.asCurve.map((seg, i) => <Polyline key={`nas-${p.grahaId}-${i}`} positions={seg} pathOptions={{ color: COLORS[p.grahaId], weight, opacity }} />)}
                {p.dsCurve.map((seg, i) => <Polyline key={`nds-${p.grahaId}-${i}`} positions={seg} pathOptions={{ color: COLORS[p.grahaId], weight, opacity }} />)}
                <Marker key={`nmg-${p.grahaId}`} position={[80, p.mcLine]} icon={getIcon(GLYPHS[p.grahaId], COLORS[p.grahaId], isDashaActive)} />
                <CircleMarker key={`nz-${p.grahaId}`} center={p.zenith} radius={isDashaActive ? 8 : 5} pathOptions={{ fillColor: COLORS[p.grahaId], color: '#000', weight: 1.5, fillOpacity: 1 }} />
              </React.Fragment>
              )
          })}

          {/* Transit Layer */}
          {(viewMode === 'transit' || viewMode === 'both') && transitData.filter(p => visiblePlanets.has(p.grahaId)).map(p => (
              <React.Fragment key={`transit-${p.grahaId}`}>
                <Polyline key={`tmc-${p.grahaId}`} positions={[[-85, p.mcLine], [85, p.mcLine]]} pathOptions={{ color: COLORS[p.grahaId], weight: 1.5, dashArray: '10,12', opacity: 0.8 }} />
                {p.asCurve.map((seg, i) => <Polyline key={`tas-${p.grahaId}-${i}`} positions={seg} pathOptions={{ color: COLORS[p.grahaId], weight: 1.5, dashArray: '10,12' }} />)}
                <Marker key={`tmg-${p.grahaId}`} position={[-80, p.mcLine]} icon={getIcon(GLYPHS[p.grahaId], COLORS[p.grahaId], true)} />
              </React.Fragment>
          ))}

          {/* Local Space Lines */}
          {showLocalSpace && birthCoords && natalData.filter(p => visiblePlanets.has(p.grahaId)).map(p => {
              // Convert bearing: swisseph azalt is from South (0) clockwise.
              // Standard destination formula uses bearing from North (0) clockwise.
              const bearingFromNorth = (p.localSpaceBearing + 180) % 360;
              const dest = getDestination(birthCoords[0], birthCoords[1], bearingFromNorth, 15000); // 15,000 km ray
              return (
                <Polyline 
                  key={`ls-${p.grahaId}`} 
                  positions={[birthCoords, dest as [number, number]]} 
                  pathOptions={{ color: COLORS[p.grahaId], weight: 1, dashArray: '10,5', opacity: 0.7 }}
                >
                    <Tooltip sticky>Local Space Ray: {NAMES[p.grahaId]}</Tooltip>
                </Polyline>
              )
          })}

          {/* Parans */}
          {(viewMode === 'natal' || viewMode === 'both') && natalParans.filter(p => visiblePlanets.has(p.p1) && visiblePlanets.has(p.p2)).map((p, i) => (
             <CircleMarker key={`pn-${p.p1}-${p.p2}-${i}`} center={[p.lat, p.lon]} radius={4} pathOptions={{ color: '#FF4500', weight: 1, fillColor: '#FFD700', fillOpacity: 1 }}>
                <Tooltip sticky><strong>{NAMES[p.p1]} / {NAMES[p.p2]} Intersection</strong></Tooltip>
             </CircleMarker>
          ))}
          {birthCoords && <CircleMarker center={birthCoords} radius={6} pathOptions={{ fillColor: 'var(--gold)', color: '#fff', weight: 2, fillOpacity: 1 }} />}
        </MapContainer>
      </div>
    </div>
  )
}
