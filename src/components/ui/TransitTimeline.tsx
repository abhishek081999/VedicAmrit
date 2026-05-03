// ─────────────────────────────────────────────────────────────
//  src/components/ui/TransitTimeline.tsx
//  Visual 12-Month Cosmic Roadmap Component
// ─────────────────────────────────────────────────────────────

'use client'

import React, { useState, useEffect } from 'react'
import { GRAHA_NAMES, RASHI_NAMES, type GrahaId } from '@/types/astrology'

interface TransitEvent {
  planetId:    GrahaId
  date:        string
  type:        'sign_change' | 'house_change' | 'nakshatra_change' | 'pada_change' | 'retrograde_start' | 'retrograde_end'
  description: string
  house:       number
  sign:        number
  nakshatra:   string
  pada:        number
  isMajor:     boolean
}

interface TransitPosition {
  planetId: GrahaId
  sign: number
  house: number
  nakshatra: string
  pada: number
  isRetro: boolean
}

interface TransitTimelineProps {
  ascRashi: number
}

export function TransitTimeline({ ascRashi }: TransitTimelineProps) {
  const [events, setEvents] = useState<TransitEvent[]>([])
  const [positions, setPositions] = useState<TransitPosition[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'major' | 'rashi' | 'nakshatra' | 'pada'>('major')
  const [planetScope, setPlanetScope] = useState<'all_planets' | 'major_planets'>('major_planets')
  const [planetWise, setPlanetWise] = useState<'all' | GrahaId>('all')
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 900)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    async function fetchTransits() {
      try {
        const res = await fetch(`/api/transit?ascRashi=${ascRashi}&months=12`)
        const json = await res.json()
        if (json.success) {
          setEvents(json.data)
          setPositions(json.currentPositions || [])
        }
      } catch (err) {
        console.error('Failed to fetch transits:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchTransits()
  }, [ascRashi])

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <div className="spin-loader" style={{ margin: '0 auto 1.5rem', width: 40, height: 40, border: '3px solid var(--border-soft)', borderTopColor: 'var(--gold)', borderRadius: '50%' }} />
        <div style={{ color: 'var(--text-gold)', fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>Calculating your personal roadmap...</div>
      </div>
    )
  }

  const MAJOR_PLANETS = new Set<GrahaId>(['Ju', 'Sa', 'Ra', 'Ke'])

  const filteredEvents = events.filter((ev) => {
    if (planetScope === 'major_planets' && !MAJOR_PLANETS.has(ev.planetId)) return false
    if (planetWise !== 'all' && ev.planetId !== planetWise) return false
    if (filter === 'major') return ev.isMajor
    if (filter === 'rashi') return ev.type === 'sign_change'
    if (filter === 'nakshatra') return ev.type === 'nakshatra_change'
    if (filter === 'pada') return ev.type === 'pada_change'
    return true
  })

  const filteredPositions = positions.filter((p) => {
    if (planetScope === 'major_planets') return MAJOR_PLANETS.has(p.planetId)
    if (planetWise !== 'all' && p.planetId !== planetWise) return false
    return true
  })

  const planetOptions: Array<{ id: 'all' | GrahaId; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'Su', label: 'Sun' },
    { id: 'Mo', label: 'Moon' },
    { id: 'Ma', label: 'Mars' },
    { id: 'Me', label: 'Mercury' },
    { id: 'Ju', label: 'Jupiter' },
    { id: 'Ve', label: 'Venus' },
    { id: 'Sa', label: 'Saturn' },
    { id: 'Ra', label: 'Rahu' },
    { id: 'Ke', label: 'Ketu' },
  ]

  const GRAHA_ICONS: Record<string, string> = {
    'Su': '☉',
    'Mo': '☾',
    'Ma': '♂',
    'Me': '☿',
    'Ju': '♃',
    'Ve': '♀',
    'Sa': '♄',
    'Ra': '☊',
    'Ke': '☋',
  }

  const GRAHA_COLORS: Record<string, string> = {
    'Su': 'var(--amber)',
    'Mo': 'var(--text-secondary)',
    'Ma': 'var(--rose)',
    'Me': 'var(--teal)',
    'Ju': 'var(--teal)',
    'Ve': '#d986ff',
    'Sa': 'var(--gold)',
    'Ra': 'var(--rose)',
    'Ke': 'var(--amber)',
  }

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '1.25rem' : '2rem' }}>
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'flex-end', gap: isMobile ? '1rem' : '1.5rem', borderBottom: '1px solid var(--border-soft)', paddingBottom: '1.5rem' }}>
        <div>
          <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: isMobile ? '1.4rem' : '2rem', color: 'var(--text-gold)', fontWeight: 800 }}>Cosmic Roadmap</h2>
          <p style={{ margin: '0.4rem 0 0', color: 'var(--text-muted)', fontSize: isMobile ? '0.8rem' : '0.9rem' }}>Major and full transits for all grahas in rashi, nakshatra, and pada.</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', width: isMobile ? '100%' : 'auto' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Transit by Planets</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', background: 'var(--surface-3)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-soft)', gap: '0.2rem' }}>
            <button
              onClick={() => setPlanetScope('all_planets')}
              style={{
                padding: '0.4rem 0.8rem', borderRadius: '6px', border: 'none',
                background: planetScope === 'all_planets' ? 'var(--gold)' : 'transparent',
                color: planetScope === 'all_planets' ? 'var(--text-on-gold)' : 'var(--text-secondary)',
                cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700,
              }}
            >All Planets</button>
            <button
              onClick={() => setPlanetScope('major_planets')}
              style={{
                padding: '0.4rem 0.8rem', borderRadius: '6px', border: 'none',
                background: planetScope === 'major_planets' ? 'var(--gold)' : 'transparent',
                color: planetScope === 'major_planets' ? 'var(--text-on-gold)' : 'var(--text-secondary)',
                cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700,
              }}
            >Major Planets</button>
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Planet Wise</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', background: 'var(--surface-3)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-soft)', gap: '0.2rem' }}>
            {planetOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setPlanetWise(option.id)}
                style={{
                  padding: '0.35rem 0.65rem', borderRadius: '6px', border: 'none',
                  background: planetWise === option.id ? 'var(--gold)' : 'transparent',
                  color: planetWise === option.id ? 'var(--text-on-gold)' : 'var(--text-secondary)',
                  cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700,
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Transit by Movement</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', background: 'var(--surface-3)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-soft)', gap: '0.2rem' }}>
            <button 
              onClick={() => setFilter('major')}
              style={{ 
                padding: '0.4rem 0.8rem', borderRadius: '6px', border: 'none', 
                background: filter === 'major' ? 'var(--gold)' : 'transparent',
                color: filter === 'major' ? 'var(--text-on-gold)' : 'var(--text-secondary)',
                cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700
              }}
            >Major</button>
            <button 
              onClick={() => setFilter('all')}
              style={{ 
                padding: '0.4rem 0.8rem', borderRadius: '6px', border: 'none', 
                background: filter === 'all' ? 'var(--gold)' : 'transparent',
                color: filter === 'all' ? 'var(--text-on-gold)' : 'var(--text-secondary)',
                cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700
              }}
            >All</button>
            <button
              onClick={() => setFilter('rashi')}
              style={{
                padding: '0.4rem 0.8rem', borderRadius: '6px', border: 'none',
                background: filter === 'rashi' ? 'var(--gold)' : 'transparent',
                color: filter === 'rashi' ? 'var(--text-on-gold)' : 'var(--text-secondary)',
                cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700,
              }}
            >Rashi</button>
            <button
              onClick={() => setFilter('nakshatra')}
              style={{
                padding: '0.4rem 0.8rem', borderRadius: '6px', border: 'none',
                background: filter === 'nakshatra' ? 'var(--gold)' : 'transparent',
                color: filter === 'nakshatra' ? 'var(--text-on-gold)' : 'var(--text-secondary)',
                cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700,
              }}
            >Nakshatra</button>
            <button
              onClick={() => setFilter('pada')}
              style={{
                padding: '0.4rem 0.8rem', borderRadius: '6px', border: 'none',
                background: filter === 'pada' ? 'var(--gold)' : 'transparent',
                color: filter === 'pada' ? 'var(--text-on-gold)' : 'var(--text-secondary)',
                cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700,
              }}
            >Pada</button>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: isMobile ? '0.9rem' : '1.2rem' }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem', fontWeight: 700 }}>
          Current Transit Snapshot (All Planets)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, minmax(0, 1fr))', gap: '0.55rem' }}>
          {filteredPositions.map((p) => (
            <div key={p.planetId} style={{ border: '1px solid var(--border-soft)', borderRadius: '10px', padding: '0.6rem 0.7rem', background: 'var(--surface-2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <strong style={{ color: 'var(--text-primary)' }}>{GRAHA_NAMES[p.planetId]}</strong>
                <span style={{ fontSize: '0.75rem', color: p.isRetro ? 'var(--rose)' : 'var(--text-muted)' }}>{p.isRetro ? 'Rx' : 'Direct'}</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {RASHI_NAMES[p.sign as keyof typeof RASHI_NAMES]} | {p.nakshatra} P{p.pada} | H{p.house}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline: grid aligns date column, dot column, and a single straight vertical spine */}
      {filteredEvents.length === 0 ? (
        <div className="card" style={{ padding: isMobile ? '1rem' : '1.25rem', color: 'var(--text-muted)' }}>
          No transit events available for this filter.
        </div>
      ) : (
      <div style={{ position: 'relative' }}>
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: isMobile ? '11px' : '99px',
            top: '0.75rem',
            bottom: '0.75rem',
            width: 2,
            transform: 'translateX(-50%)',
            borderRadius: 1,
            background: 'linear-gradient(to bottom, var(--gold) 0%, var(--border-soft) 100%)',
            opacity: 0.38,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '22px minmax(0, 1fr)' : '88px 22px minmax(0, 1fr)',
            columnGap: isMobile ? '0.75rem' : '1rem',
            rowGap: isMobile ? '1.5rem' : '2.5rem',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {filteredEvents.map((ev, i) => {
            const date = new Date(ev.date)
            const month = date.toLocaleString('default', { month: 'short' })
            const day = date.getDate()
            const color = GRAHA_COLORS[ev.planetId] || 'var(--gold)'

            const PLANET_LABELS: Record<string, string> = {
              Su: 'Surya (Sun)',
              Mo: 'Chandra (Moon)',
              Ma: 'Mangal (Mars)',
              Me: 'Budha (Mercury)',
              Ju: 'Guru (Jupiter)',
              Ve: 'Shukra (Venus)',
              Sa: 'Shani (Saturn)',
              Ra: 'Rahu (North Node)',
              Ke: 'Ketu (South Node)',
            }
            const planetLabel = PLANET_LABELS[ev.planetId] || ev.planetId
            const dotSize = isMobile ? 10 : 12

            const dateCell = !isMobile ? (
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                      lineHeight: 1.2,
                      textAlign: 'right',
                      paddingRight: '0.15rem',
                      alignSelf: 'start',
                      paddingTop: '0.2rem',
                    }}
                  >
                    <div style={{ fontWeight: 800, color: 'var(--text-secondary)' }}>{day}</div>
                    <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', opacity: 0.7 }}>{month}</div>
                  </div>
            ) : null

            const dotCell = (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'flex-start',
                    paddingTop: isMobile ? '0.35rem' : '0.25rem',
                  }}
                >
                  <div
                    style={{
                      width: dotSize,
                      height: dotSize,
                      borderRadius: '50%',
                      background: color,
                      border: '3px solid var(--bg-page)',
                      boxShadow: `0 0 10px ${color}88`,
                      flexShrink: 0,
                    }}
                  />
                </div>
            )

            const cardCell = (
                <div
                  className="card"
                  style={{
                    padding: isMobile ? '1rem' : '1.25rem',
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: isMobile ? '0.75rem' : '1.25rem',
                    alignItems: isMobile ? 'flex-start' : 'center',
                    background: `linear-gradient(90deg, ${color}08 0%, transparent 100%)`,
                    borderLeft: `4px solid ${color}`,
                    transition: 'transform 0.2s',
                    cursor: 'default',
                  }}
                  onMouseOver={e => !isMobile && (e.currentTarget.style.transform = 'translateX(5px)')}
                  onMouseOut={e => !isMobile && (e.currentTarget.style.transform = 'translateX(0)')}
                >
                  {isMobile && (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        width: '100%',
                        alignItems: 'center',
                        marginBottom: '0.25rem',
                      }}
                    >
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 800 }}>
                        {day} {month}
                      </div>
                      <div
                        style={{
                          fontSize: '0.85rem',
                          fontWeight: 800,
                          color: ev.type.includes('house') ? 'var(--text-gold)' : 'var(--text-secondary)',
                        }}
                      >
                        H{ev.house} Focus
                      </div>
                    </div>
                  )}

                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: 'var(--surface-3)',
                      border: '1px solid var(--border-soft)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      color,
                      boxShadow: `inset 0 0 10px ${color}15`,
                    }}
                  >
                    {GRAHA_ICONS[ev.planetId]}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                      <span
                        className="badge"
                        style={{
                          background: `${color}15`,
                          color,
                          fontSize: '0.6rem',
                          fontWeight: 800,
                          border: `1px solid ${color}33`,
                        }}
                      >
                        {ev.type.replace('_', ' ').toUpperCase()}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>{planetLabel}</span>
                    </div>
                    <div
                      style={{
                        fontSize: isMobile ? '0.95rem' : '1.1rem',
                        fontWeight: 500,
                        color: 'var(--text-primary)',
                        lineHeight: 1.4,
                      }}
                    >
                      {ev.description}
                    </div>
                    <div style={{ marginTop: '0.45rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {RASHI_NAMES[ev.sign as keyof typeof RASHI_NAMES]} | {ev.nakshatra} | Pada {ev.pada}
                    </div>
                  </div>

                  {!isMobile && (
                    <div style={{ textAlign: 'right', minWidth: '90px' }}>
                      <div
                        style={{
                          fontSize: '0.6rem',
                          color: 'var(--text-muted)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        Activation
                      </div>
                      <div
                        style={{
                          fontSize: '0.95rem',
                          fontWeight: 700,
                          color: ev.type.includes('house') ? 'var(--text-gold)' : 'var(--text-secondary)',
                        }}
                      >
                        House {ev.house}
                      </div>
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Focus Area</div>
                    </div>
                  )}
                </div>
            )

            return isMobile ? (
              <React.Fragment key={i}>
                {dotCell}
                {cardCell}
              </React.Fragment>
            ) : (
              <React.Fragment key={i}>
                {dateCell}
                {dotCell}
                {cardCell}
              </React.Fragment>
            )
          })}
        </div>
      </div>
      )}

      <div style={{ 
        marginTop: '2rem', padding: '1.5rem', background: 'var(--surface-2)', 
        borderRadius: 'var(--r-md)', border: '1px dashed var(--border-soft)',
        fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.6
      }}>
        💡 <strong>Analytical Tip:</strong> Use Major for cycle-level shifts, and switch to Rashi/Nakshatra/Pada tabs for precise timing windows in your personal chart.
      </div>
    </div>
  )
}
