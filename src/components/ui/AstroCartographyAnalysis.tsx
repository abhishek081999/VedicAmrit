'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/AstroCartographyAnalysis.tsx
//  Master ACG Analysis — High-Resonance City Detection
// ─────────────────────────────────────────────────────────────

import React, { useMemo } from 'react'
import { ACG_INTERPRETATIONS } from '@/lib/engine/astroInterpretation'
import type { GrahaId } from '@/types/astrology'

const MAJOR_CITIES = [
  { name: 'London', lat: 51.5074, lng: -0.1278 }, { name: 'New York', lat: 40.7128, lng: -74.0060 },
  { name: 'Tokyo', lat: 35.6895, lng: 139.6917 }, { name: 'Dubai', lat: 25.2048, lng: 55.2708 },
  { name: 'Singapore', lat: 1.3521, lng: 103.8198 }, { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
  { name: 'Paris', lat: 48.8566, lng: 2.3522 }, { name: 'Sydney', lat: -33.8688, lng: 151.2093 },
  { name: 'Los Angeles', lat: 34.0522, lng: -118.2437 }, { name: 'Hong Kong', lat: 22.3193, lng: 114.1694 },
  { name: 'Zurich', lat: 47.3769, lng: 8.5417 }, { name: 'Berlin', lat: 52.5200, lng: 13.4050 }
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

            // 1. Check vertical lines (MC/IC)
            const mcOffset = Math.abs(city.lng - p.mcLine)
            const icOffset = Math.abs(city.lng - p.icLine)
            const off = Math.min(mcOffset, icOffset)
            
            if (off < 1.0) score += 50
            else if (off < 2.5) score += 20

            if (off < minOffset) { minOffset = off; closestPlanet = p.grahaId; }

            // 2. Check Parans (Latitude Crossings)
            parans.forEach(pa => {
                if (Math.abs(city.lat - pa.lat) < 1.0) score += 30
            })
        })

        return { ...city, score, closestPlanet }
    })

    return results.sort((a,b) => b.score - a.score).filter(c => c.score > 0).slice(0, 5)
  }, [natalData, parans, visiblePlanets])

  return (
    <div className="acg-analysis-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* ── Top Resonance Cities (New Feature!) ── */}
      {topCities.length > 0 && (
          <section className="card" style={{ padding: '1.25rem', border: '1px solid #3B82F6', background: 'rgba(59,130,246,0.04)' }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 900, color: '#3B82F6', margin: '0 0 1rem', letterSpacing: '0.05em' }}>🌍 TOP RESONANCE DESTINATIONS</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {topCities.map((c, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <span style={{ fontSize: '1rem' }}>{i === 0 ? '👑' : '📍'}</span>
                              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{c.name}</div>
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#3B82F6', fontWeight: 800 }}>
                              {c.closestPlanet ? GLYPHS[c.closestPlanet] : ''} MATCH
                          </div>
                      </div>
                  ))}
              </div>
          </section>
      )}

      {/* ── Active Parans (Crossings) ── */}
      {parans.length > 0 && (
        <section className="card" style={{ padding: '1.25rem', border: '1px solid var(--gold-faint)', background: 'rgba(201,168,76,0.03)' }}>
          <header style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--gold)', margin: 0, letterSpacing: '0.05em' }}>✨ POWER CROSSINGS (PARANS)</h3>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2 }}>Latitude-based intersections of planetary influence.</div>
            </div>
          </header>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {parans.slice(0, 5).map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem', padding: '0.5rem', background: 'var(--surface-2)', borderRadius: 6 }}>
                <span style={{ color: COLORS[p.p1] }}>{GLYPHS[p.p1]}</span>
                <span style={{ color: 'var(--text-muted)' }}>×</span>
                <span style={{ color: COLORS[p.p2] }}>{GLYPHS[p.p2]}</span>
                <div style={{ flex: 1, fontWeight: 600, fontSize: '0.75rem' }}>{NAMES[p.p1]} / {NAMES[p.p2]}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--gold)', fontFamily: 'var(--font-mono)' }}>{Math.abs(p.lat).toFixed(1)}°{p.lat > 0 ? 'N' : 'S'}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Line Meanings ── */}
      <section className="card" style={{ padding: '1.5rem', background: 'var(--surface-1)' }}>
        <header style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Planetary Line Guide</h3>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {planets.length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Select planets on the map to see their relocation insights.
            </div>
          )}

          {planets.map(id => (
            <div key={id} style={{ borderBottom: '1px solid var(--border-soft)', paddingBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <span style={{ fontSize: '1.5rem', color: COLORS[id] }}>{GLYPHS[id]}</span>
                <div style={{ fontWeight: 800, fontSize: '1rem' }}>{NAMES[id]} Focus</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <AngleBox angle="AS" title="Self & Body" desc={ACG_INTERPRETATIONS[id]?.AS} />
                <AngleBox angle="MC" title="Career & Status" desc={ACG_INTERPRETATIONS[id]?.MC} />
                <AngleBox angle="DS" title="Connections" desc={ACG_INTERPRETATIONS[id]?.DS} />
                <AngleBox angle="IC" title="Home & Roots" desc={ACG_INTERPRETATIONS[id]?.IC} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function AngleBox({ angle, title, desc }: any) {
  return (
    <div style={{ background: 'var(--surface-2)', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-soft)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
        <span style={{ fontSize: '0.6rem', fontWeight: 900, color: 'var(--gold)' }}>{angle}</span>
        <span style={{ fontSize: '0.7rem', fontWeight: 700, opacity: 0.8 }}>{title}</span>
      </div>
      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.3, margin: 0 }}>{desc}</p>
    </div>
  )
}
