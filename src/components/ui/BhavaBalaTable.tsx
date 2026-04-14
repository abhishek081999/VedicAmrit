'use client'

import React, { useMemo, useState } from 'react'
import type { BhavaBalaResult, Rashi } from '@/types/astrology'
import { RASHI_NAMES, RASHI_SANSKRIT } from '@/types/astrology'
import { LayoutGrid, List, Sparkles, BarChart3 } from 'lucide-react'

type ViewMode = 'grid' | 'table' | 'graph'

const HOUSE_NAMES = [
  'First (Lagna)', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth',
  'Seventh', 'Eighth', 'Ninth', 'Tenth', 'Eleventh', 'Twelfth'
]

const HOUSE_LABELS = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th']

function statusColor(rupa: number) {
  if (rupa >= 9) return 'var(--text-gold)'
  if (rupa >= 7.5) return 'var(--teal)'
  if (rupa >= 6) return 'var(--amber)'
  return 'var(--rose)'
}

export function BhavaBalaTable({ bhavaBala, chart }: { bhavaBala: BhavaBalaResult, chart: any }) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const { houses } = bhavaBala

  const ranked = useMemo(() => {
    return Object.values(houses).sort((a,b) => b.totalRupa - a.totalRupa)
  }, [houses])

  const maxRupa = useMemo(() => Math.max(...ranked.map(h => h.totalRupa), 10), [ranked])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Header Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <div className="label-caps">Bhāva Bala — House Strength</div>
        <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '0.2rem' }}>
          <button 
            className={`btn btn-xs ${viewMode === 'grid' ? 'active' : 'btn-ghost'}`} 
            style={{ 
              background: viewMode === 'grid' ? 'var(--surface-3)' : 'transparent',
              padding: '0.3rem 0.5rem'
            }}
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid size={13} />
          </button>
          <button 
            className={`btn btn-xs ${viewMode === 'graph' ? 'active' : 'btn-ghost'}`} 
            style={{ 
              background: viewMode === 'graph' ? 'var(--surface-3)' : 'transparent',
              padding: '0.3rem 0.5rem'
            }}
            onClick={() => setViewMode('graph')}
          >
            <BarChart3 size={13} />
          </button>
          <button 
            className={`btn btn-xs ${viewMode === 'table' ? 'active' : 'btn-ghost'}`} 
            style={{ 
              background: viewMode === 'table' ? 'var(--surface-3)' : 'transparent',
              padding: '0.3rem 0.5rem'
            }}
            onClick={() => setViewMode('table')}
          >
            <List size={13} />
          </button>
        </div>
      </div>

      {viewMode === 'graph' && <BhavaBalaBarChart bhavaBala={bhavaBala} ashtakavarga={chart.ashtakavarga} ascRashi={chart.lagnas.ascRashi} />}

      {viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
          {Array.from({ length: 12 }).map((_, i) => {
            const h = houses[i + 1]
            if (!h) return null
            const color = statusColor(h.totalRupa)
            return (
              <div key={h.house} className="card" style={{ 
                padding: '1.25rem', 
                borderTop: `3px solid ${color}`,
                display: 'flex', flexDirection: 'column', gap: '0.6rem',
                position: 'relative'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>House {h.house}</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>{HOUSE_NAMES[h.house-1]}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                     <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{RASHI_NAMES[h.rashi]}</div>
                     <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>{RASHI_SANSKRIT[h.rashi]}</div>
                  </div>
                </div>

                <div style={{ height: 4, width: '100%', background: 'var(--border-soft)', borderRadius: 2, margin: '0.5rem 0', overflow: 'hidden' }}>
                   <div style={{ 
                     height: '100%', 
                     width: `${(h.totalRupa / maxRupa) * 100}%`, 
                     background: color, 
                     borderRadius: 2,
                     boxShadow: `0 0 8px ${color}44`
                   }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginTop: '0.2rem' }}>
                   <div>
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Adhipati</div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{(h.adhipatiBala/60).toFixed(2)}</div>
                   </div>
                   <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Dig</div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{(h.digBala/60).toFixed(2)}</div>
                   </div>
                   <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Drishti</div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, fontFamily: 'var(--font-mono)', color: h.drishtiBala < 0 ? 'var(--rose)' : 'inherit' }}>{(h.drishtiBala/60).toFixed(2)}</div>
                   </div>
                </div>

                <div style={{ 
                  marginTop: '0.4rem', 
                  padding: '0.5rem 0.75rem', 
                  background: 'var(--surface-2)', 
                  borderRadius: 'var(--r-md)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  border: '1px solid var(--border)'
                }}>
                   <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>TOTAL STRENGTH</span>
                   <span style={{ fontSize: '1.1rem', fontWeight: 800, color, fontFamily: 'var(--font-mono)' }}>{h.totalRupa.toFixed(3)} R</span>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div style={{ 
          background: '#fff', 
          border: '1px solid #777', 
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          overflowX: 'auto'
        }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse', 
            fontSize: '1rem',
            fontFamily: '"Times New Roman", Times, serif'
          }}>
            <thead>
              <tr style={{ background: '#e0e0e0', borderBottom: '1px solid #999' }}>
                <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #999' }}>House</th>
                <th style={{ padding: '8px', textAlign: 'right', border: '1px solid #999' }}>Bhava Bala</th>
                <th style={{ padding: '8px', textAlign: 'right', border: '1px solid #999' }}>In rupas</th>
                <th style={{ padding: '8px', textAlign: 'right', border: '1px solid #999' }}>Lord&apos;s bala</th>
                <th style={{ padding: '8px', textAlign: 'right', border: '1px solid #999' }}>DigBala</th>
                <th style={{ padding: '8px', textAlign: 'right', border: '1px solid #999' }}>DrigBala</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 12 }).map((_, i) => {
                const h = houses[i + 1]
                if (!h) return null
                const isOdd = i % 2 !== 0
                return (
                  <tr key={h.house} style={{ background: isOdd ? '#f9f2e7' : '#fff' }}>
                    <td style={{ 
                      padding: '8px', 
                      color: '#a00', 
                      fontWeight: 'bold', 
                      border: '1px solid #ccc' 
                    }}>
                      {HOUSE_LABELS[i]}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right', border: '1px solid #ccc' }}>{h.totalShash.toFixed(2)}</td>
                    <td style={{ padding: '8px', textAlign: 'right', border: '1px solid #ccc' }}>{h.totalRupa.toFixed(2)}</td>
                    <td style={{ padding: '8px', textAlign: 'right', border: '1px solid #ccc' }}>{h.adhipatiBala.toFixed(2)}</td>
                    <td style={{ padding: '8px', textAlign: 'right', border: '1px solid #ccc' }}>{h.digBala.toFixed(2)}</td>
                    <td style={{ padding: '8px', textAlign: 'right', border: '1px solid #ccc' }}>{h.drishtiBala.toFixed(2)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Bhava Insights */}
      <div className="card" style={{ 
        padding: '1.5rem', 
        background: 'linear-gradient(135deg, rgba(201,168,76,0.1), transparent)',
        border: '1px solid rgba(201,168,76,0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
           <div style={{ background: 'var(--gold)', color: '#000', padding: '0.4rem', borderRadius: '50%', display: 'flex' }}>
             <Sparkles size={16} />
           </div>
           <div style={{ fontWeight: 700, fontSize: '1.1rem', fontFamily: 'var(--font-display)' }}>House Strength Analysis</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
           <div style={{ background: 'var(--surface-1)', padding: '1.25rem', borderRadius: 'var(--r-xl)', borderLeft: '4px solid var(--teal)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>STRONGEST HOUSE</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--teal)', fontFamily: 'var(--font-display)' }}>{bhavaBala.strongestHouse} — {HOUSE_NAMES[bhavaBala.strongestHouse-1]}</div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.75rem', lineHeight: 1.5 }}>
                The themes of the {bhavaBala.strongestHouse} house are exceptionally well-supported by positional, directional, and aspectual factors. Native will find natural ease and success in these areas of life.
              </p>
           </div>
           <div style={{ background: 'var(--surface-1)', padding: '1.25rem', borderRadius: 'var(--r-xl)', borderLeft: '4px solid var(--rose)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>WEAKEST HOUSE</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--rose)', fontFamily: 'var(--font-display)' }}>{bhavaBala.weakestHouse} — {HOUSE_NAMES[bhavaBala.weakestHouse-1]}</div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.75rem', lineHeight: 1.5 }}>
                The {bhavaBala.weakestHouse} house shows the lowest aggregate strength. This indicates areas where potential delays, obstacles, or a lack of external support might be experienced, requiring more conscious effort.
              </p>
           </div>
        </div>
      </div>
    </div>
  )
}

// ── Bar Chart Sub-component (Replicated Style) ────────────────

function BhavaBalaBarChart({ 
  bhavaBala, 
  ashtakavarga, 
  ascRashi 
}: { 
  bhavaBala: BhavaBalaResult, 
  ashtakavarga?: { sav: number[] },
  ascRashi?: number
}) {
  const houseLabels = HOUSE_LABELS
  
  // Data for Chart 1 (Shadbala)
  const shadData = Array.from({ length: 12 }).map((_, i) => bhavaBala.houses[i + 1].totalRupa)
  const maxShad = Math.max(...shadData, 12)

  // Data for Chart 2 (SAV) - Offset by Ascendant Rashi
  const savData = ashtakavarga && ascRashi ? Array.from({ length: 12 }).map((_, i) => {
    const rIndex = (ascRashi - 1 + i) % 12
    return ashtakavarga.sav[rIndex]
  }) : null
  const maxSav = savData ? Math.max(...savData, 40) : 40

  const renderSingleChart = (title: string, values: number[], max: number, color: string = '#a67c7c') => (
    <div style={{ 
      background: 'var(--surface-1)', 
      border: '1px solid var(--border-soft)',
      padding: '1.5rem 1rem 0.5rem 1rem',
      display: 'flex', flexDirection: 'column', gap: '1.5rem'
    }}>
      <h3 style={{ 
        textAlign: 'center', color: '#1e4d2b', fontSize: '1.4rem', 
        fontFamily: 'serif', margin: 0, letterSpacing: '0.02em' 
      }}>
        {title}
      </h3>
      
      <div style={{ 
        display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', 
        height: '240px', alignItems: 'flex-end', gap: '4px',
        borderBottom: '2px solid #5a5a5a',
        paddingBottom: '2px'
      }}>
        {values.map((v, i) => {
          const height = (v / max) * 100
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: '4px' }}>
              <span style={{ fontSize: '0.85rem', color: '#555', fontWeight: 600 }}>{v.toFixed(title.includes('SAV') ? 0 : 1)}</span>
              <div style={{ 
                width: '100%', 
                height: `${height}%`, 
                background: color,
                transition: 'height 0.8s ease-out'
              }} />
            </div>
          )
        })}
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '4px' }}>
        {houseLabels.map((l, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: '1rem', color: '#000080', fontWeight: 500 }}>
            {l}
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {renderSingleChart('Bhava Bala - Shadbala', shadData, maxShad)}
      {savData && renderSingleChart('Bhava Bala - SAV (D-1)', savData, maxSav)}
    </div>
  )
}
