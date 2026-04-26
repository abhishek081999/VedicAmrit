'use client'
// ─────────────────────────────────────────────────────────────
//  AstroCartographyAnalysis.tsx
//  Tabbed ACG analysis: Top Cities · Parans · Planetary Guide
// ─────────────────────────────────────────────────────────────
import React, { useMemo, useState } from 'react'
import { ACG_INTERPRETATIONS } from '@/lib/engine/astroInterpretation'
import type { GrahaId } from '@/types/astrology'

// ─── Data ────────────────────────────────────────────────────

const MAJOR_CITIES = [
  // India
  { name: 'Delhi',      lat: 28.6139,  lng: 77.2090,  flag: '🇮🇳' },
  { name: 'Mumbai',     lat: 19.0760,  lng: 72.8777,  flag: '🇮🇳' },
  { name: 'Bengaluru',  lat: 12.9716,  lng: 77.5946,  flag: '🇮🇳' },
  { name: 'Chennai',    lat: 13.0827,  lng: 80.2707,  flag: '🇮🇳' },
  { name: 'Kolkata',    lat: 22.5726,  lng: 88.3639,  flag: '🇮🇳' },
  // SE Asia & Oceania
  { name: 'Singapore',  lat: 1.3521,   lng: 103.8198, flag: '🇸🇬' },
  { name: 'Tokyo',      lat: 35.6895,  lng: 139.6917, flag: '🇯🇵' },
  { name: 'Sydney',     lat: -33.8688, lng: 151.2093, flag: '🇦🇺' },
  { name: 'Melbourne',  lat: -37.8136, lng: 144.9631, flag: '🇦🇺' },
  { name: 'Hong Kong',  lat: 22.3193,  lng: 114.1694, flag: '🇭🇰' },
  { name: 'Bangkok',    lat: 13.7563,  lng: 100.5018, flag: '🇹🇭' },
  { name: 'Kuala Lumpur',lat:3.1390,  lng: 101.6869, flag: '🇲🇾' },
  // Middle East
  { name: 'Dubai',      lat: 25.2048,  lng: 55.2708,  flag: '🇦🇪' },
  { name: 'Riyadh',     lat: 24.7136,  lng: 46.6753,  flag: '🇸🇦' },
  { name: 'Istanbul',   lat: 41.0082,  lng: 28.9784,  flag: '🇹🇷' },
  // Africa
  { name: 'Johannesburg',lat:-26.2041, lng: 28.0473,  flag: '🇿🇦' },
  { name: 'Cairo',      lat: 30.0444,  lng: 31.2357,  flag: '🇪🇬' },
  // Europe
  { name: 'London',     lat: 51.5074,  lng: -0.1278,  flag: '🇬🇧' },
  { name: 'Paris',      lat: 48.8566,  lng: 2.3522,   flag: '🇫🇷' },
  { name: 'Berlin',     lat: 52.5200,  lng: 13.4050,  flag: '🇩🇪' },
  { name: 'Zurich',     lat: 47.3769,  lng: 8.5417,   flag: '🇨🇭' },
  { name: 'Rome',       lat: 41.9028,  lng: 12.4964,  flag: '🇮🇹' },
  { name: 'Madrid',     lat: 40.4168,  lng: -3.7038,  flag: '🇪🇸' },
  { name: 'Amsterdam',  lat: 52.3676,  lng: 4.9041,   flag: '🇳🇱' },
  // North America
  { name: 'New York',   lat: 40.7128,  lng: -74.0060, flag: '🇺🇸' },
  { name: 'Los Angeles',lat: 34.0522,  lng: -118.2437,flag: '🇺🇸' },
  { name: 'San Francisco',lat:37.7749, lng: -122.4194,flag: '🇺🇸' },
  { name: 'Chicago',    lat: 41.8781,  lng: -87.6298, flag: '🇺🇸' },
  { name: 'Toronto',    lat: 43.6532,  lng: -79.3832, flag: '🇨🇦' },
  { name: 'Vancouver',  lat: 49.2827,  lng: -123.1207,flag: '🇨🇦' },
  // South America
  { name: 'Sao Paulo',  lat: -23.5505, lng: -46.6333, flag: '🇧🇷' },
  { name: 'Buenos Aires',lat:-34.6037, lng: -58.3816, flag: '🇦🇷' },
  { name: 'Mexico City',lat: 19.4326,  lng: -99.1332, flag: '🇲🇽' },
]

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

// Known paran pair interpretations
const PARAN_LIBRARY: Record<string, string> = {
  'Su-Mo': 'Vitality meets emotion — a place of integrated personal power and authentic self-expression.',
  'Su-Ju': 'Power meets wisdom — exceptional for career growth, recognition, and spiritual expansion.',
  'Su-Ve': 'Confidence meets beauty — highly creative, socially magnetic, ideal for arts and leadership.',
  'Su-Ma': 'Drive meets visibility — intense ambition and physical vitality. Best for competitive goals.',
  'Su-Sa': 'Discipline under the spotlight — hard-earned success and lasting achievement.',
  'Mo-Ve': 'Emotions meet harmony — deeply nurturing, romantic, and artistically fertile.',
  'Mo-Ju': 'Feelings meet abundance — emotional security and spiritual nourishment.',
  'Mo-Ma': 'Emotion meets action — dynamic but intense; best channelled into creative work.',
  'Ju-Ve': 'Abundance meets harmony — one of the most auspicious crossings for love and prosperity.',
  'Ju-Me': 'Wisdom meets communication — outstanding for teaching, publishing, and strategic business.',
  'Ma-Ju': 'Drive meets expansion — powerful for athletics, entrepreneurship, and competitive success.',
  'Ve-Me': 'Charm meets intellect — gifted in diplomacy, writing, and aesthetic communication.',
  'Sa-Ju': 'Structure meets growth — serious long-term ambitions with practical wisdom.',
  'Sa-Me': 'Precision meets thought — analytical depth; excellent for research and engineering.',
  'Ra-Ju': 'Transformation meets opportunity — unconventional paths to great success.',
}

function getParanMeaning(p1: string, p2: string): string {
  const k1 = `${p1}-${p2}`, k2 = `${p2}-${p1}`
  return PARAN_LIBRARY[k1] ?? PARAN_LIBRARY[k2] ??
    `${NAMES[p1] || p1} and ${NAMES[p2] || p2} energies intersect — a zone of powerful planetary synthesis.`
}

// ─── Types ───────────────────────────────────────────────────

interface ACGLineData {
  grahaId: GrahaId; mcLine: number; icLine: number;
  zenith: [number, number]; aspects: any[];
  asCurve: [number, number][][]; dsCurve: [number, number][][];
}
interface ACGParan { p1: GrahaId; p2: GrahaId; lat: number; lon: number; type?: string }
interface Props { visiblePlanets: Set<GrahaId>; parans: ACGParan[]; natalData?: ACGLineData[] }

type Tab      = 'cities' | 'parans' | 'guide'
type LifeArea = 'all' | 'career' | 'love' | 'home' | 'identity'

const ANGLE_MAP: Record<LifeArea, string[]> = {
  all:      ['AS', 'MC', 'DS', 'IC'],
  career:   ['MC'],
  love:     ['DS'],
  home:     ['IC'],
  identity: ['AS'],
}

const ANGLE_META: Record<string, { label: string; icon: string; desc: string }> = {
  AS: { label: 'Identity',     icon: '↑', desc: 'How you appear and feel about yourself here.' },
  MC: { label: 'Career',       icon: '⌃', desc: 'Professional visibility and public reputation.' },
  DS: { label: 'Relationships',icon: '↓', desc: 'Partner energies and relational dynamics.' },
  IC: { label: 'Home',         icon: '⌄', desc: 'Domestic environment and ancestral roots.' },
}

// ─── Main Component ──────────────────────────────────────────

export function AstroCartographyAnalysis({ visiblePlanets, parans, natalData }: Props) {
  const planets = Array.from(visiblePlanets)
  const [tab, setTab]           = useState<Tab>('cities')
  const [lifeArea, setLifeArea] = useState<LifeArea>('all')
  const [expandedCity, setExpandedCity] = useState<number | null>(null)

  // ── City scoring ──
  const topCities = useMemo(() => {
    if (!natalData || natalData.length === 0) return []

    const results = MAJOR_CITIES.map(city => {
      let score = 0
      let closestPlanet: GrahaId | null = null
      let minOffset = 999
      let lineType  = 'MC'
      const activePlanets: { planet: GrahaId; line: string; offset: number }[] = []

      natalData.forEach(p => {
        if (!visiblePlanets.has(p.grahaId)) return
        const mcOff = Math.abs(city.lng - p.mcLine)
        const icOff = Math.abs(city.lng - p.icLine)
        const off   = Math.min(mcOff, icOff)

        if (off < 1.0)       score += 55
        else if (off < 2.5)  score += 22
        else if (off < 5.0)  score += 8

        if (off < 8) activePlanets.push({ planet: p.grahaId, line: mcOff < icOff ? 'MC' : 'IC', offset: off })

        if (off < minOffset) {
          minOffset = off
          closestPlanet = p.grahaId
          lineType = mcOff < icOff ? 'MC' : 'IC'
        }

        parans.forEach(pa => {
          if (Math.abs(city.lat - pa.lat) < 1.0)       score += 35
          else if (Math.abs(city.lat - pa.lat) < 2.5)  score += 12
        })
      })

      return { ...city, score, closestPlanet, lineType, minOffset, activePlanets }
    })

    return results.sort((a, b) => b.score - a.score).filter(c => c.score > 0).slice(0, 8)
  }, [natalData, parans, visiblePlanets])

  const maxScore = topCities[0]?.score || 1

  const activeAngles = ANGLE_MAP[lifeArea]

  // ─── Render ───────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: '3px', background: 'var(--surface-2)', padding: '3px', borderRadius: '12px' }}>
        {([
          ['cities', '🌐', 'Top Cities'],
          ['parans', '✨', 'Crossings'],
          ['guide',  '📖', 'Guide'],
        ] as [Tab, string, string][]).map(([t, icon, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1, padding: '7px 6px', borderRadius: '9px',
              background: tab === t ? 'var(--surface-0)' : 'transparent',
              border: 'none', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700,
              color: tab === t ? 'var(--text-primary)' : 'var(--text-muted)',
              display: 'flex', gap: '4px', alignItems: 'center', justifyContent: 'center',
              boxShadow: tab === t ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            <span>{icon}</span><span>{label}</span>
          </button>
        ))}
      </div>

      {/* ── Cities Tab ─────────────────────────────────────── */}
      {tab === 'cities' && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: 1.5, padding: '0 0.25rem' }}>
            Cities scored by proximity to your natal planetary lines and paran latitudes.
          </div>

          {topCities.length === 0 ? (
            <EmptyState icon="🌍" message="Activate planetary layers to discover your top resonance cities." />
          ) : (
            topCities.map((c, i) => {
              const expanded = expandedCity === i
              const barPct   = (c.score / maxScore) * 100
              const barColor = i === 0 ? 'var(--gold)' : c.closestPlanet ? COLORS[c.closestPlanet] : 'var(--gold)'

              return (
                <div
                  key={i}
                  onClick={() => setExpandedCity(expanded ? null : i)}
                  style={{
                    padding: '0.875rem',
                    border: `1px solid ${i === 0 ? 'var(--gold)' : 'var(--border-soft)'}`,
                    borderRadius: '14px',
                    background: i === 0
                      ? 'linear-gradient(135deg, rgba(255,215,0,0.06) 0%, transparent 100%)'
                      : 'var(--surface-1)',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    boxShadow: expanded ? '0 4px 20px rgba(0,0,0,0.15)' : 'none',
                  }}
                  onMouseEnter={e => { if (i !== 0) e.currentTarget.style.borderColor = 'var(--border-bright)' }}
                  onMouseLeave={e => { if (i !== 0) e.currentTarget.style.borderColor = 'var(--border-soft)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      {/* Rank badge */}
                      <div style={{
                        width: 26, height: 26, borderRadius: '7px', flexShrink: 0,
                        background: i === 0 ? 'var(--gold)' : i === 1 ? 'rgba(192,192,192,0.3)' : i === 2 ? 'rgba(180,140,90,0.3)' : 'var(--surface-2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.6rem', fontWeight: 900,
                        color: i === 0 ? '#000' : 'var(--text-muted)',
                      }}>
                        {i === 0 ? '⭐' : `#${i + 1}`}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <span>{c.flag}</span> {c.name}
                        </div>
                        {c.closestPlanet && (
                          <div style={{ fontSize: '0.62rem', color: COLORS[c.closestPlanet], fontWeight: 700, marginTop: '1px' }}>
                            {GLYPHS[c.closestPlanet]} {NAMES[c.closestPlanet]} {c.lineType}
                            {c.minOffset < 20 ? ` · ${c.minOffset.toFixed(1)}° offset` : ''}
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ fontSize: '1rem', fontWeight: 900, color: barColor, fontFamily: 'var(--font-mono)' }}>{c.score}</div>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'none' }}>▾</span>
                    </div>
                  </div>

                  {/* Score bar */}
                  <div style={{ height: 4, borderRadius: 4, background: 'var(--surface-2)', overflow: 'hidden', marginBottom: expanded ? '0.75rem' : 0 }}>
                    <div style={{ height: '100%', width: `${barPct}%`, background: barColor, borderRadius: 4, transition: 'width 0.9s ease' }} />
                  </div>

                  {/* Expanded: active planets near this city */}
                  {expanded && c.activePlanets.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '0.5rem' }}>
                      {c.activePlanets.map((ap, ai) => (
                        <div key={ai} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '20px', background: `${COLORS[ap.planet]}12`, border: `1px solid ${COLORS[ap.planet]}25`, fontSize: '0.65rem', fontWeight: 700, color: COLORS[ap.planet] }}>
                          <span>{GLYPHS[ap.planet]}</span>
                          <span>{ap.line}</span>
                          <span style={{ opacity: 0.7 }}>({ap.offset.toFixed(1)}°)</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </section>
      )}

      {/* ── Parans Tab ─────────────────────────────────────── */}
      {tab === 'parans' && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: 1.5, padding: '0 0.25rem' }}>
            Parans are latitudinal bands where two planetary lines cross — zones of intensified combined energy.
          </div>

          {parans.length === 0 ? (
            <EmptyState icon="✨" message="No power crossings found within the selected planetary layers." />
          ) : (
            parans.slice(0, 10).map((p, i) => (
              <div key={i} style={{ background: 'var(--surface-1)', borderRadius: '14px', border: '1px solid var(--border-soft)', overflow: 'hidden' }}>
                {/* Header row */}
                <div style={{ padding: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.875rem', borderBottom: '1px solid var(--border-soft)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
                    <span style={{ fontSize: '1.3rem', color: COLORS[p.p1], filter: `drop-shadow(0 0 6px ${COLORS[p.p1]}80)` }}>{GLYPHS[p.p1]}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>×</span>
                    <span style={{ fontSize: '1.3rem', color: COLORS[p.p2], filter: `drop-shadow(0 0 6px ${COLORS[p.p2]}80)` }}>{GLYPHS[p.p2]}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>{NAMES[p.p1]} × {NAMES[p.p2]}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--gold)', fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: '1px' }}>
                      {Math.abs(p.lat).toFixed(2)}°{p.lat >= 0 ? 'N' : 'S'} · {Math.abs(p.lon).toFixed(2)}°{p.lon >= 0 ? 'E' : 'W'}
                    </div>
                  </div>
                  {/* Dual color swatch */}
                  <div style={{ display: 'flex', borderRadius: '6px', overflow: 'hidden', flexShrink: 0 }}>
                    <div style={{ width: 8, height: 24, background: COLORS[p.p1] }} />
                    <div style={{ width: 8, height: 24, background: COLORS[p.p2] }} />
                  </div>
                </div>
                {/* Interpretation */}
                <div style={{ padding: '0.75rem 0.875rem' }}>
                  <p style={{ margin: 0, fontSize: '0.73rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                    {getParanMeaning(p.p1, p.p2)}
                  </p>
                </div>
              </div>
            ))
          )}
        </section>
      )}

      {/* ── Guide Tab ──────────────────────────────────────── */}
      {tab === 'guide' && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Life-area filter */}
          <div>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Filter by life area</div>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {([
                ['all',      '🌐', 'All Lines'],
                ['career',   '🏆', 'MC · Career'],
                ['love',     '❤️',  'DS · Love'],
                ['home',     '🏠', 'IC · Home'],
                ['identity', '✦',  'AS · Identity'],
              ] as [LifeArea, string, string][]).map(([a, icon, label]) => (
                <button
                  key={a}
                  onClick={() => setLifeArea(a)}
                  style={{
                    padding: '5px 10px', borderRadius: '8px', fontSize: '0.68rem', fontWeight: 700,
                    background: lifeArea === a ? 'var(--gold-faint)' : 'transparent',
                    border: `1px solid ${lifeArea === a ? 'var(--gold)' : 'var(--border)'}`,
                    color: lifeArea === a ? 'var(--gold)' : 'var(--text-muted)',
                    cursor: 'pointer', display: 'flex', gap: '4px', alignItems: 'center', transition: 'all 0.2s',
                  }}
                >
                  <span>{icon}</span><span>{label}</span>
                </button>
              ))}
            </div>

            {/* Angle description */}
            {lifeArea !== 'all' && (
              <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.75rem', background: 'var(--surface-2)', borderRadius: '8px', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                {ANGLE_META[ANGLE_MAP[lifeArea][0]]?.desc}
              </div>
            )}
          </div>

          {planets.length === 0 ? (
            <EmptyState icon="🧿" message="Activate planetary layers on the map to unlock relocation insights." />
          ) : (
            planets.map(id => (
              <div key={id} style={{ background: 'var(--surface-1)', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-soft)' }}>
                {/* Planet header */}
                <div style={{ padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', background: `${COLORS[id]}07`, borderBottom: '1px solid var(--border-soft)' }}>
                  <div style={{ width: 42, height: 42, borderRadius: '12px', background: `${COLORS[id]}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.55rem', color: COLORS[id], border: `1px solid ${COLORS[id]}30`, flexShrink: 0 }}>
                    {GLYPHS[id]}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.975rem' }}>{NAMES[id]} Lines</div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: '1px' }}>
                      {activeAngles.length === 1 ? `${activeAngles[0]} · ${ANGLE_META[activeAngles[0]].label}` : 'All Angles'}
                    </div>
                  </div>
                  {/* Color bar accent */}
                  <div style={{ marginLeft: 'auto', width: 4, height: 36, borderRadius: 3, background: COLORS[id], opacity: 0.7 }} />
                </div>

                {/* Angle boxes */}
                <div style={{ display: 'grid', gridTemplateColumns: activeAngles.length === 1 ? '1fr' : '1fr 1fr', gap: 0 }}>
                  {(['AS', 'MC', 'DS', 'IC'] as const).filter(a => activeAngles.includes(a)).map(angle => (
                    <AngleBox
                      key={angle}
                      angle={angle}
                      color={COLORS[id]}
                      desc={ACG_INTERPRETATIONS[id as GrahaId]?.[angle]}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </section>
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────

function EmptyState({ icon, message }: { icon: string; message: string }) {
  return (
    <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', border: '1px dashed var(--border)', borderRadius: '16px', lineHeight: 1.55 }}>
      <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{icon}</div>
      {message}
    </div>
  )
}

function AngleBox({ angle, desc, color }: { angle: string; desc?: string; color: string }) {
  const meta = ANGLE_META[angle]
  return (
    <div
      style={{ padding: '0.75rem', margin: '3px', borderRadius: '10px', cursor: 'default', transition: 'background 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.background = `${color}0e` }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
        <span style={{ fontSize: '0.58rem', fontWeight: 900, color, padding: '2px 6px', background: `${color}18`, borderRadius: '4px' }}>{angle}</span>
        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{meta?.label}</span>
      </div>
      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.52, margin: 0 }}>{desc ?? 'Interpretation pending.'}</p>
    </div>
  )
}
