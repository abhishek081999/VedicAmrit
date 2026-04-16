'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/AstroCartographyAnalysis.tsx
//  Master ACG Analysis — High-Resonance City Detection
// ─────────────────────────────────────────────────────────────

import React, { useMemo } from 'react'
import { ACG_INTERPRETATIONS } from '@/lib/engine/astroInterpretation'
import type { GrahaId } from '@/types/astrology'

const MAJOR_CITIES = [
  // India
  { name: 'Delhi', lat: 28.6139, lng: 77.2090 }, { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
  { name: 'Bengaluru', lat: 12.9716, lng: 77.5946 }, { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
  // SE Asia & Oceania
  { name: 'Singapore', lat: 1.3521, lng: 103.8198 }, { name: 'Tokyo', lat: 35.6895, lng: 139.6917 },
  { name: 'Sydney', lat: -33.8688, lng: 151.2093 }, { name: 'Melbourne', lat: -37.8136, lng: 144.9631 },
  { name: 'Hong Kong', lat: 22.3193, lng: 114.1694 }, { name: 'Bangkok', lat: 13.7563, lng: 100.5018 },
  // Middle East & Africa
  { name: 'Dubai', lat: 25.2048, lng: 55.2708 }, { name: 'Riyadh', lat: 24.7136, lng: 46.6753 },
  { name: 'Johannesburg', lat: -26.2041, lng: 28.0473 }, { name: 'Cairo', lat: 30.0444, lng: 31.2357 },
  // Europe
  { name: 'London', lat: 51.5074, lng: -0.1278 }, { name: 'Paris', lat: 48.8566, lng: 2.3522 },
  { name: 'Berlin', lat: 52.5200, lng: 13.4050 }, { name: 'Zurich', lat: 47.3769, lng: 8.5417 },
  { name: 'Rome', lat: 41.9028, lng: 12.4964 }, { name: 'Madrid', lat: 40.4168, lng: -3.7038 },
  // North America
  { name: 'New York', lat: 40.7128, lng: -74.0060 }, { name: 'Los Angeles', lat: 34.0522, lng: -118.2437 },
  { name: 'San Francisco', lat: 37.7749, lng: -122.4194 }, { name: 'Chicago', lat: 41.8781, lng: -87.6298 },
  { name: 'Toronto', lat: 43.6532, lng: -79.3832 }, { name: 'Vancouver', lat: 49.2827, lng: -123.1207 },
  // South America
  { name: 'Sao Paulo', lat: -23.5505, lng: -46.6333 }, { name: 'Buenos Aires', lat: -34.6037, lng: -58.3816 },
  { name: 'Mexico City', lat: 19.4326, lng: -99.1332 }
]

const COLORS: Record<string, string> = {
  Su: '#FFD700', Mo: '#FFFFFF', Ma: '#FF4500', Me: '#00FF7F', Ju: '#FFA500', Ve: '#FF69B4', Sa: '#8A2BE2', Ra: '#A9A9A9',
}
const GLYPHS: Record<string, string> = { Su: '☉', Mo: '☽', Ma: '♂', Me: '☿', Ju: '♃', Ve: '♀', Sa: '♄', Ra: '☊' }
const NAMES: Record<string, string> = { Su: 'Sun', Mo: 'Moon', Ma: 'Mars', Me: 'Mercury', Ju: 'Jupiter', Ve: 'Venus', Sa: 'Saturn', Ra: 'Rahu' }

interface ACGLineData { grahaId: GrahaId; mcLine: number; icLine: number; zenith: [number, number]; aspects: any[]; asCurve: [number, number][][]; dsCurve: [number, number][][]; }
interface ACGParan { p1: GrahaId; p2: GrahaId; lat: number; lon: number; type: string; }

interface Props {
  visiblePlanets: Set<GrahaId>
  parans: ACGParan[]
  natalData?: ACGLineData[]
}

export function AstroCartographyAnalysis({ visiblePlanets, parans, natalData }: Props) {
  const planets = Array.from(visiblePlanets)

  // ── High-Resonance City Detection Logic ──
  const topCities = useMemo(() => {
    if (!natalData || natalData.length === 0) return []
    
    const results = MAJOR_CITIES.map(city => {
        let score = 0
        let closestPlanet: GrahaId | null = null
        let minOffset = 999

        natalData.forEach(p => {
            if (!visiblePlanets.has(p.grahaId)) return
            const mcOffset = Math.abs(city.lng - p.mcLine)
            const icOffset = Math.abs(city.lng - p.icLine)
            const off = Math.min(mcOffset, icOffset)
            
            if (off < 1.0) score += 50
            else if (off < 2.5) score += 20
            if (off < minOffset) { minOffset = off; closestPlanet = p.grahaId; }

            parans.forEach(pa => {
                if (Math.abs(city.lat - pa.lat) < 1.0) score += 30
            })
        })
        return { ...city, score, closestPlanet }
    })

    return results.sort((a,b) => b.score - a.score).filter(c => c.score > 0).slice(0, 4)
  }, [natalData, parans, visiblePlanets])

  return (
    <div className="acg-analysis-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* ── Resonance Intelligence ── */}
      {topCities.length > 0 && (
          <section className="card glass-glow" style={{ padding: '1.5rem', border: '1px solid var(--border-bright)', background: 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, transparent 100%)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                  <span style={{ fontSize: '1.2rem' }}>🌐</span>
                  <h3 style={{ fontSize: '0.75rem', fontWeight: 900, color: '#3B82F6', margin: 0, letterSpacing: '0.1em', textTransform: 'uppercase' }}>High Resonance Hubs</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
                  {topCities.map((c, i) => (
                      <div key={i} style={{ 
                        background: 'rgba(255,255,255,0.03)', 
                        padding: '1rem', 
                        borderRadius: '16px', 
                        border: '1px solid rgba(255,255,255,0.05)',
                        position: 'relative',
                        overflow: 'hidden'
                      }}>
                          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 700 }}>Rank #{i+1}</div>
                          <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '4px' }}>{c.name}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: COLORS[c.closestPlanet || 'Su'], fontWeight: 700 }}>
                            {c.closestPlanet ? GLYPHS[c.closestPlanet] : ''} {c.closestPlanet ? NAMES[c.closestPlanet] : ''} Match
                          </div>
                      </div>
                  ))}
              </div>
          </section>
      )}

      {/* ── Active Parans (Crossings) ── */}
      {parans.length > 0 && (
        <section className="card" style={{ padding: '1.25rem', border: '1px solid var(--gold-faint)', background: 'var(--surface-0)' }}>
          <header style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--gold)', margin: 0, letterSpacing: '0.1em', textTransform: 'uppercase' }}>✨ Power Crossings (Parans)</h3>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 4 }}>Latitudinal nodes where planetary vibrations intersect.</div>
          </header>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {parans.slice(0, 5).map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', background: 'var(--surface-2)', borderRadius: '12px', border: '1px solid var(--border-soft)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ color: COLORS[p.p1], fontSize: '1.1rem' }}>{GLYPHS[p.p1]}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>×</span>
                    <span style={{ color: COLORS[p.p2], fontSize: '1.1rem' }}>{GLYPHS[p.p2]}</span>
                </div>
                <div style={{ flex: 1, fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{NAMES[p.p1]} • {NAMES[p.p2]}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--gold)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{Math.abs(p.lat).toFixed(1)}°{p.lat > 0 ? 'N' : 'S'}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Line Meanings ── */}
      <section className="card glass" style={{ padding: '1.5rem', background: 'var(--surface-1)' }}>
        <header style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, fontFamily: 'var(--font-display)' }}>Terrestrial Blueprints</h3>
          <span className="badge-gold" style={{ fontSize: '0.6rem' }}>{planets.length} Active Orbs</span>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {planets.length === 0 && (
            <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', border: '1px dashed var(--border)', borderRadius: '16px' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🧿</div>
              Activate planetary layers on the map to unlock relocation insights.
            </div>
          )}

          {planets.map(id => (
            <div key={id} style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ 
                  width: 44, height: 44, borderRadius: '12px', background: `${COLORS[id]}15`, 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.8rem', color: COLORS[id], border: `1px solid ${COLORS[id]}33`
                }}>
                  {GLYPHS[id]}
                </div>
                <div>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{NAMES[id]} Frequency</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Planetary Influence Zone</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <AngleBox angle="AS" title="Identity" color={COLORS[id]} desc={ACG_INTERPRETATIONS[id]?.AS} />
                <AngleBox angle="MC" title="Vocation" color={COLORS[id]} desc={ACG_INTERPRETATIONS[id]?.MC} />
                <AngleBox angle="DS" title="Relatedness" color={COLORS[id]} desc={ACG_INTERPRETATIONS[id]?.DS} />
                <AngleBox angle="IC" title="Foundations" color={COLORS[id]} desc={ACG_INTERPRETATIONS[id]?.IC} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function AngleBox({ angle, title, desc, color }: any) {
  return (
    <div style={{ 
        background: 'rgba(255,255,255,0.02)', 
        padding: '0.85rem', 
        borderRadius: '14px', 
        border: '1px solid var(--border-soft)',
        transition: 'all 0.2s ease',
        cursor: 'default'
    }} 
    onMouseEnter={e => e.currentTarget.style.borderColor = color + '44'}
    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-soft)'}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.6rem', fontWeight: 900, color: color, padding: '2px 4px', background: color + '15', borderRadius: '4px' }}>{angle}</span>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{title}</span>
      </div>
      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.45, margin: 0 }}>{desc}</p>
    </div>
  )
}

