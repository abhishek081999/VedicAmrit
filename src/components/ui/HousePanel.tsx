'use client'
import React, { useState } from 'react'
import type { ChartOutput, Rashi } from '@/types/astrology'
import { RASHI_NAMES, RASHI_SHORT, GRAHA_NAMES } from '@/types/astrology'
import { getNakshatra } from '@/lib/engine/nakshatra'
import { HouseProgressionPanel } from './HouseProgressionPanel'

const SIGN_LORDS: Record<number, string> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
  7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

const SIGN_SYMBOLS: Record<number, string> = {
  1: '♈', 2: '♉', 3: '♊', 4: '♋', 5: '♌', 6: '♍',
  7: '♎', 8: '♏', 9: '♐', 10: '♑', 11: '♒', 12: '♓',
}

const GRAHA_SYMBOLS: Record<string, string> = {
  Su: '🌞', Mo: '🌙', Ma: '♂', Me: '☿', Ju: '♃', Ve: '♀', Sa: '♄', Ra: '☊', Ke: '☋',
}

export function HousePanel({ chart }: { chart: ChartOutput }) {
  const [activeTab, setActiveTab] = useState<'analysis' | 'progression'>('analysis')
  const { lagnas, grahas, meta } = chart
  const houseSystem = meta.settings.houseSystem

  const fmt = (val: number) => {
    const normalized = ((val % 360) + 360) % 360
    const r = (Math.floor(normalized / 30) + 1) as Rashi
    const deg = Math.floor(normalized % 30)
    const mTotal = (normalized % 1) * 60
    const min = Math.floor(mTotal)
    const sec = Math.floor((mTotal % 1) * 60)
    return <span style={{ fontFamily: 'var(--font-mono)' }}>{RASHI_SHORT[r]} {deg}° {min}′ {sec}″</span>
  }

  const { ascDegree } = lagnas
  const houseData = Array.from({ length: 12 }, (_, i) => {
    const houseNum = i + 1
    const cuspLon = ((ascDegree + (i * 30)) + 360) % 360
    const rashi = (Math.floor(((cuspLon % 360) + 360) % 360 / 30) + 1) as Rashi
    const degree = (((cuspLon % 360) + 360) % 360) % 30
    const nak = getNakshatra(cuspLon)
    const lordId = SIGN_LORDS[rashi]
    
    const bhavaStart = ((cuspLon - 15) + 360) % 360
    const bhavaEnd   = ((cuspLon + 15) + 360) % 360

    const planetsInHouse = grahas.filter(g => {
      const lon = g.lonSidereal
      if (bhavaEnd > bhavaStart) {
        return lon >= bhavaStart && lon < bhavaEnd
      } else {
        return lon >= bhavaStart || lon < bhavaEnd
      }
    })

    return {
      houseNum,
      cuspLon,
      bhavaStart,
      bhavaEnd,
      rashi,
      degree,
      nak,
      lordId,
      planetsInHouse
    }
  })

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-end', 
        flexWrap: 'wrap', 
        gap: '1rem',
        borderBottom: '1px solid var(--border-soft)',
        paddingBottom: '1.25rem'
      }}>
        <div>
          <div className="label-caps" style={{ color: 'var(--text-gold)', marginBottom: '0.4rem', fontSize: '0.65rem' }}>House & Bhāva Workspace</div>
          <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            Bhāva Analysis
          </h2>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem', color: 'var(--text-muted)', maxWidth: '600px', lineHeight: 1.5 }}>
            Explore house starting points (cusps), planetary occupation, and cyclical house progressions (BCP).
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ 
            padding: '0.6rem 1rem', 
            background: 'var(--surface-2)', 
            borderRadius: 'var(--r-md)', 
            border: '1px solid var(--border-soft)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Lagna Degree</span>
            <div style={{ width: 1, height: 14, background: 'var(--border-soft)' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-gold)', letterSpacing: '0.04em' }}>
              {fmt(lagnas.ascDegree)} <span style={{ opacity: 0.6, fontWeight: 400, fontSize: '0.75rem' }}>({lagnas.ascDegree.toFixed(3)}°)</span>
            </span>
          </div>

          <div style={{ 
            padding: '0.6rem 1rem', 
            background: 'var(--surface-2)', 
            borderRadius: 'var(--r-md)', 
            border: '1px solid var(--border-soft)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>System</span>
            <div style={{ width: 1, height: 14, background: 'var(--border-soft)' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-gold)', letterSpacing: '0.02em' }}>
              {houseSystem.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </span>
          </div>
        </div>
      </div>

      {/* Internal Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '4px', 
        background: 'var(--surface-3)', 
        padding: '4px', 
        borderRadius: 'var(--r-md)',
        border: '1px solid var(--border-soft)',
        width: 'fit-content'
      }}>
        {[
          { id: 'analysis', label: 'Bhāva Analysis', icon: '🔍' },
          { id: 'progression', label: 'House Progression (BCP)', icon: '⏳' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            style={{
              padding: '0.5rem 1.25rem',
              background: activeTab === t.id ? 'var(--surface-1)' : 'transparent',
              border: 'none',
              borderRadius: 'calc(var(--r-md) - 2px)',
              cursor: 'pointer',
              color: activeTab === t.id ? 'var(--text-gold)' : 'var(--text-muted)',
              fontWeight: activeTab === t.id ? 700 : 500,
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s',
              boxShadow: activeTab === t.id ? 'var(--shadow-sm)' : 'none'
            }}
          >
            <span>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'analysis' ? (
        <>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 380px), 1fr))', 
            gap: '1.25rem' 
          }}>
            {houseData.map((h, idx) => (
              <div 
                key={h.houseNum} 
                className="card"
                style={{ 
                  padding: '1.5rem', 
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  background: 'var(--surface-1)',
                  border: '1px solid var(--border-soft)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.25rem'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--border-bright)'
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = 'var(--shadow-deep), 0 0 15px var(--gold-faint)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border-soft)'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                {/* House Number Background Decoration */}
                <div style={{ 
                  position: 'absolute', 
                  top: '-10px', 
                  right: '-10px', 
                  fontSize: '5rem', 
                  fontWeight: 900, 
                  color: 'var(--text-gold)', 
                  opacity: 0.04, 
                  pointerEvents: 'none',
                  fontFamily: 'var(--font-display)'
                }}>
                  {h.houseNum}
                </div>

                {/* Header info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{ 
                      width: 44, height: 44, borderRadius: 'var(--r-md)', 
                      background: 'var(--gold-faint)', border: '1px solid var(--gold)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-gold)',
                      fontFamily: 'var(--font-display)'
                    }}>
                      {h.houseNum}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>House / Bhāva</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {RASHI_NAMES[h.rashi]} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>Cusp</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.2rem', color: 'var(--gold)' }}>{SIGN_SYMBOLS[h.rashi]}</div>
                    <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{h.degree.toFixed(2)}°</div>
                  </div>
                </div>

                {/* Details Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ padding: '0.85rem', background: 'var(--surface-2)', borderRadius: 'var(--r-md)', border: '1px solid var(--border-soft)' }}>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>Nakshatra</div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{h.nak.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-gold)' }}>Pada {h.nak.pada}</div>
                  </div>
                  <div style={{ padding: '0.85rem', background: 'var(--surface-2)', borderRadius: 'var(--r-md)', border: '1px solid var(--border-soft)' }}>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>House Lord</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontSize: '1rem' }}>{GRAHA_SYMBOLS[h.lordId] || h.lordId}</span>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{GRAHA_NAMES[h.lordId as keyof typeof GRAHA_NAMES] || h.lordId}</span>
                    </div>
                  </div>
                </div>

                {/* Occupants */}
                <div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span>🪐</span> Occupants ({h.planetsInHouse.length})
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {h.planetsInHouse.length > 0 ? (
                      h.planetsInHouse.map(p => (
                        <div key={p.id} style={{ 
                          padding: '0.4rem 0.65rem', 
                          background: 'var(--surface-3)', 
                          borderRadius: 'var(--r-sm)', 
                          border: '1px solid var(--border-soft)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          fontSize: '0.82rem',
                          transition: 'all 0.2s'
                        }} className="planet-tag">
                          <span style={{ fontSize: '1rem' }}>{GRAHA_SYMBOLS[p.id] || p.id}</span>
                          <span style={{ fontWeight: 600 }}>{p.id}</span>
                          <div style={{ width: 1, height: 10, background: 'var(--border-soft)' }} />
                          <span style={{ fontSize: '0.72rem', opacity: 0.7, fontFamily: 'var(--font-mono)' }}>{p.degree.toFixed(1)}°</span>
                        </div>
                      ))
                    ) : (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.4rem' }}>No planets currently inhabiting this bhava</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '2rem' }}>
            <h3 className="label-caps" style={{ marginBottom: '1.25rem', color: 'var(--text-gold)', fontSize: '0.7rem' }}>Detailed Bhāva Table</h3>
            <div className="card" style={{ padding: 0, overflowX: 'auto', background: 'var(--surface-1)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border-soft)' }}>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.65rem' }}>H#</th>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.65rem' }}>Bhāva Start</th>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.65rem' }}>Cusp (Mid)</th>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.65rem' }}>Bhāva End</th>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.65rem' }}>Nakṣatra</th>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.65rem' }}>Rāśi (Lord)</th>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.65rem' }}>Occupants</th>
                  </tr>
                </thead>
                <tbody>
                  {houseData.map((h, i) => {
                    return (
                      <tr key={h.houseNum} style={{ borderBottom: i === 11 ? 'none' : '1px solid var(--border-soft)' }}>
                        <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--text-gold)' }}>{h.houseNum}</td>
                        <td style={{ padding: '1rem' }}>{fmt(h.bhavaStart)}</td>
                        <td style={{ padding: '1rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', opacity: 0.8 }}>
                           <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{fmt(h.cuspLon)}</div>
                           <div style={{ fontSize: '0.7rem' }}>{h.cuspLon.toFixed(3)}°</div>
                        </td>
                        <td style={{ padding: '1rem' }}>{fmt(h.bhavaEnd)}</td>
                        <td style={{ padding: '1rem' }}>
                           <div style={{ fontWeight: 500 }}>{h.nak.name}</div>
                           <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>Pada {h.nak.pada}</div>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                             <span style={{ color: 'var(--gold)' }}>{SIGN_SYMBOLS[h.rashi]}</span>
                             <span>{RASHI_NAMES[h.rashi]} ({h.lordId})</span>
                          </div>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                            {h.planetsInHouse.map(p => (
                              <span key={p.id} style={{ 
                                padding: '1px 6px', background: 'var(--surface-3)', borderRadius: 4, border: '1px solid var(--border-soft)',
                                fontSize: '0.75rem'
                              }}>
                                {p.id}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <HouseProgressionPanel chart={chart} />
      )}
    </div>
  )
}
