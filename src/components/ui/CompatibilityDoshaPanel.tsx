'use client'

import React, { useMemo } from 'react'
import { ChartOutput } from '@/types/astrology'
import { calculateManglik, calculatePapeSamya } from '@/lib/engine/doshas'

/**
 * Advanced Relationship & Stability Analysis Suite
 * Handles: Manglik, Malefic Balance, and soon Dasha Compatibility
 */
export function CompatibilityDoshaPanel({ chartA, chartB }: { chartA: ChartOutput; chartB?: ChartOutput }) {
  const m1 = useMemo(() => calculateManglik(chartA.grahas, [], chartA.lagnas.ascRashi), [chartA])
  const p1 = useMemo(() => calculatePapeSamya(chartA.grahas, chartA.lagnas.ascRashi), [chartA])
  
  const m2 = useMemo(() => chartB ? calculateManglik(chartB.grahas, [], chartB.lagnas.ascRashi) : null, [chartB])
  const p2 = useMemo(() => chartB ? calculatePapeSamya(chartB.grahas, chartB.lagnas.ascRashi) : null, [chartB])

  const nameA = chartA.meta.name
  const nameB = chartB?.meta.name ?? 'Partner'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Manglik Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
        <ManglikCard name={nameA} analysis={m1} />
        {chartB && m2 && <ManglikCard name={nameB} analysis={m2} />}
      </div>

      {/* Pape Samya Balance */}
      {chartB && p1 && p2 && (
        <PapeSamyaComparison 
          p1={p1} p2={p2} 
          nameA={nameA} nameB={nameB} 
        />
      )}

      <div style={{ 
        padding: '1rem', background: 'var(--surface-2)', borderRadius: 'var(--r-md)', 
        fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', border: '1px solid var(--border)' 
      }}>
        Professional relationship analysis considers the balance of malefic energy and specific Martian afflictions. High Kuja Dosha (Manglik) in one chart should ideally be matched with a similar intensity in the other for stability.
      </div>
    </div>
  )
}

function ManglikCard({ name, analysis }: { name: string; analysis: any }) {
  const intensity = analysis.intensity
  const isManglik = analysis.isManglik
  
  const color = 
    intensity === 'High' ? 'var(--rose)' : 
    intensity === 'Low' ? 'var(--amber)' : 
    'var(--teal)'

  return (
    <div className="card" style={{ 
      padding: '1.25rem', 
      border: `1px solid ${intensity !== 'None' ? color : 'var(--border)'}`,
      background: `linear-gradient(135deg, var(--surface-1) 0%, ${color}05 100%)`
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div>
          <div className="label-caps" style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{name}</div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: isManglik ? 'var(--text-primary)' : 'var(--teal)' }}>
            {isManglik ? 'Kuja (Manglik) Dosha' : 'Non-Manglik'}
          </h3>
        </div>
        <div style={{ 
          padding: '2px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 800, 
          background: `${color}15`, color: color, border: `1px solid ${color}30`
        }}>
          {intensity.toUpperCase()}
        </div>
      </div>

      {isManglik ? (
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Mars is located in the <strong>{analysis.house}th House</strong>. This placement can indicate passionate but intense energy in partnerships. 
          {intensity === 'High' && ' Classical remedial measures or matching with a Manglik partner is advised.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--teal)', fontWeight: 600 }}>
            {analysis.cancellations.length > 0 ? 'Dosha Cancelled/Neutralized' : 'No affliction present in focal houses.'}
          </div>
          {analysis.cancellations.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {analysis.cancellations.map((c: string) => (
                <span key={c} style={{ fontSize: '0.65rem', background: 'var(--teal-faint)', color: 'var(--teal)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--teal)30' }}>
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function PapeSamyaComparison({ p1, p2, nameA, nameB }: { p1: any; p2: any; nameA: string; nameB: string }) {
  const w1 = p1.totalWeight
  const w2 = p2.totalWeight
  const max = Math.max(w1, w2, 4)
  const diff = Math.abs(w1 - w2)
  const isBalanced = diff <= 1.25

  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      <div className="label-caps" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Pāpe-Sāmya (Malefic Balance)</div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {/* Row Chart A */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 100, textAlign: 'right', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-gold)' }}>{nameA}</div>
          <div style={{ flex: 1, height: 10, background: 'var(--surface-3)', borderRadius: 5, overflow: 'hidden' }}>
            <div style={{ width: `${(w1/max)*100}%`, height: '100%', background: 'var(--rose)', opacity: 0.8 }} />
          </div>
          <div style={{ width: 40, fontSize: '0.85rem', fontWeight: 800 }}>{w1.toFixed(2)}</div>
        </div>

        {/* Row Chart B */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 100, textAlign: 'right', fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)' }}>{nameB}</div>
          <div style={{ flex: 1, height: 10, background: 'var(--surface-3)', borderRadius: 5, overflow: 'hidden' }}>
            <div style={{ width: `${(w2/max)*100}%`, height: '100%', background: 'var(--rose)', opacity: 0.8 }} />
          </div>
          <div style={{ width: 40, fontSize: '0.85rem', fontWeight: 800 }}>{w2.toFixed(2)}</div>
        </div>

        <div style={{ 
          marginTop: '1rem', padding: '1rem', borderRadius: 'var(--r-md)', textAlign: 'center',
          background: isBalanced ? 'rgba(78,205,196,0.08)' : 'rgba(224,123,142,0.08)',
          border: `1px solid ${isBalanced ? 'var(--teal)' : 'var(--rose)'}30`,
          color: isBalanced ? 'var(--teal)' : 'var(--rose)',
          fontSize: '0.85rem'
        }}>
          {isBalanced ? (
            <span>✅ <strong>Stable Balance</strong>: The malefic burdens are well compensated between both charts.</span>
          ) : (
            <span>⚠️ <strong>Imbalance Detected</strong>: There is a significant malefic weight mismatch ({diff.toFixed(2)} pts). This may require conscious adjustment in the relationship.</span>
          )}
        </div>
      </div>
    </div>
  )
}
