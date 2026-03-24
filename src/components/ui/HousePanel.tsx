'use client'
import React, { useState } from 'react'
import type { ChartOutput, Rashi } from '@/types/astrology'
import { RASHI_NAMES, RASHI_SHORT, GRAHA_NAMES } from '@/types/astrology'
import { getNakshatra } from '@/lib/engine/nakshatra'
import { HouseProgressionPanel } from './HouseProgressionPanel'
import { ChakraSelector } from '@/components/chakra/ChakraSelector'

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
  const { lagnas, grahas, meta, panchang, arudhas } = chart
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

  // D1 Chart Data
  const d1Grahas = chart.vargas?.D1 ?? grahas
  const ascRashi = lagnas.ascRashi as Rashi
  const moon = grahas.find(g => g.id === 'Mo')
  const moonNakIdx = moon?.nakshatraIndex ?? 0

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
            Explore house cusps, planetary occupation, and cyclical house progressions (BCP).
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
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Calculation</span>
            <div style={{ width: 1, height: 14, background: 'var(--border-soft)' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-gold)', letterSpacing: '0.02em' }}>
              {houseSystem.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        
        {/* LEFT: D1 Chart */}
        <div style={{ 
          flex: '1 1 420px', 
          maxWidth: '520px', 
          display: 'flex', 
          flexDirection: 'column',
          gap: '1rem',
          position: 'sticky',
          top: '2rem'
        }}>
          <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="label-caps" style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>D1 · Rashi Chart</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-gold)', fontWeight: 600 }}>Lagna: {ascRashi} {SIGN_SYMBOLS[ascRashi]}</div>
            </div>
            
            <div style={{ background: 'var(--surface-2)', padding: '0.5rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border-soft)' }}>
              <ChakraSelector
                ascRashi={ascRashi}
                grahas={d1Grahas}
                moonNakIndex={moonNakIdx}
                arudhas={arudhas}
                tithiNumber={panchang.tithi.number}
                varaNumber={panchang.vara.number}
                defaultStyle="north"
                size={340} 
              />
            </div>

            <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={{ padding: '0.75rem', background: 'var(--surface-3)', borderRadius: 'var(--r-sm)', border: '1px solid var(--border-soft)' }}>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Asc Degree</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-gold)' }}>{fmt(ascDegree)}</div>
              </div>
              <div style={{ padding: '0.75rem', background: 'var(--surface-3)', borderRadius: 'var(--r-sm)', border: '1px solid var(--border-soft)' }}>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current House</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-gold)' }}>
                  House {(Math.floor((new Date().getFullYear() - new Date(meta.birthDate).getFullYear()) % 12) + 1)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Tabs & Analysis */}
        <div style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
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
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', 
                gap: '1.25rem' 
              }}>
                {houseData.map((h, idx) => (
                  <div 
                    key={h.houseNum} 
                    className="card"
                    style={{ 
                      padding: '1.25rem', 
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                      background: 'var(--surface-1)',
                      border: '1px solid var(--border-soft)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1rem'
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
                    {/* Header info */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <div style={{ 
                          width: 36, height: 36, borderRadius: 'var(--r-sm)', 
                          background: 'var(--gold-faint)', border: '1px solid var(--gold)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-gold)',
                          fontFamily: 'var(--font-display)'
                        }}>
                          {h.houseNum}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {RASHI_NAMES[h.rashi]}
                          </div>
                          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{h.lordId} Lord</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.1rem', color: 'var(--gold)' }}>{SIGN_SYMBOLS[h.rashi]}</div>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div style={{ padding: '0.5rem', background: 'var(--surface-2)', borderRadius: 'var(--r-sm)' }}>
                        <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Nakshatra</div>
                        <div style={{ fontWeight: 600, fontSize: '0.75rem' }}>{h.nak.name}</div>
                      </div>
                      <div style={{ padding: '0.5rem', background: 'var(--surface-2)', borderRadius: 'var(--r-sm)' }}>
                        <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Cusp Mid</div>
                        <div style={{ fontWeight: 600, fontSize: '0.75rem' }}>{h.degree.toFixed(1)}°</div>
                      </div>
                    </div>

                    {/* Occupants */}
                    <div>
                      {h.planetsInHouse.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                          {h.planetsInHouse.map(p => (
                            <div key={p.id} style={{ 
                              padding: '2px 6px', background: 'var(--surface-3)', borderRadius: '4px', border: '1px solid var(--border-soft)',
                              fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px'
                            }}>
                              <span>{GRAHA_SYMBOLS[p.id] || p.id}</span>
                              <span style={{ fontWeight: 600 }}>{p.id}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Empty House</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '1rem' }}>
                <h3 className="label-caps" style={{ marginBottom: '1.25rem', color: 'var(--text-gold)', fontSize: '0.7rem' }}>Detailed Bhāva Table</h3>
                <div className="card" style={{ padding: 0, overflowX: 'auto', background: 'var(--surface-1)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                    <thead>
                      <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border-soft)' }}>
                        <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.65rem' }}>H#</th>
                        <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.65rem' }}>Bhāva Start</th>
                        <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.65rem' }}>Cusp (Mid)</th>
                        <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.65rem' }}>Bhāva End</th>
                        <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.65rem' }}>Rāśi (Lord)</th>
                        <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.65rem' }}>Occupants</th>
                      </tr>
                    </thead>
                    <tbody>
                      {houseData.map((h, i) => {
                        return (
                          <tr key={h.houseNum} style={{ borderBottom: i === 11 ? 'none' : '1px solid var(--border-soft)' }}>
                            <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--text-gold)' }}>{h.houseNum}</td>
                            <td style={{ padding: '0.75rem 1rem' }}>{h.bhavaStart.toFixed(2)}°</td>
                            <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{fmt(h.cuspLon)}</td>
                            <td style={{ padding: '0.75rem 1rem' }}>{h.bhavaEnd.toFixed(2)}°</td>
                            <td style={{ padding: '0.75rem 1rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                 <span style={{ color: 'var(--gold)' }}>{SIGN_SYMBOLS[h.rashi]}</span>
                                 <span>{RASHI_SHORT[h.rashi]} ({h.lordId})</span>
                              </div>
                            </td>
                            <td style={{ padding: '0.75rem 1rem' }}>
                              <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                                {h.planetsInHouse.map(p => (
                                  <span key={p.id} style={{ fontSize: '0.8rem' }} title={p.id}>{GRAHA_SYMBOLS[p.id] || p.id}</span>
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
      </div>
    </div>
  )
}
