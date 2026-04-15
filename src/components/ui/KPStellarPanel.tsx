'use client'

import React, { useState } from 'react'
import type { ChartOutput, KPSignificatorLevels, GrahaId, Rashi } from '@/types/astrology'
import { RASHI_NAMES, RASHI_SHORT, GRAHA_NAMES } from '@/types/astrology'

interface KPStellarPanelProps {
  chart: ChartOutput
}

export function KPStellarPanel({ chart }: KPStellarPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<'significators' | 'cusps' | 'rp'>('significators')

  if (!chart.kp) {
    return (
      <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        KP Stellar analysis not available for this chart.
      </div>
    )
  }

  const { significators, cusps, rulingPlanets } = chart.kp

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header & Sub-tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-soft)', paddingBottom: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', color: 'var(--text-gold)', fontSize: '1.8rem' }}>Stellar Intelligence</h2>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Advanced Krishnamurti Padhdhati (KP) Analysis</p>
        </div>
        <div style={{ display: 'flex', background: 'var(--surface-2)', padding: '0.25rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border-soft)' }}>
          {(['significators', 'cusps', 'rp'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: 'calc(var(--r-md) - 2px)',
                border: 'none',
                background: activeSubTab === tab ? 'var(--gold-faint)' : 'transparent',
                color: activeSubTab === tab ? 'var(--gold)' : 'var(--text-muted)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'uppercase',
                transition: 'all 0.2s'
              }}
            >
              {tab === 'rp' ? 'Ruling Planets' : tab}
            </button>
          ))}
        </div>
      </div>

      {activeSubTab === 'significators' && <SignificatorsGrid significators={significators} grahas={chart.grahas} />}
      {activeSubTab === 'cusps' && <CuspalInterlinks cusps={cusps} />}
      {activeSubTab === 'rp' && <RulingPlanetsView rp={rulingPlanets} />}
    </div>
  )
}

// ── Significators View ─────────────────────────────────────────

function SignificatorsGrid({ significators, grahas }: { significators: any, grahas: any[] }) {
  const [viewMode, setViewMode] = useState<'house' | 'planet'>('house')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <button 
          onClick={() => setViewMode('house')}
          className={`btn btn-sm ${viewMode === 'house' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.7rem' }}
        >
          View by House
        </button>
        <button 
          onClick={() => setViewMode('planet')}
          className={`btn btn-sm ${viewMode === 'planet' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.7rem' }}
        >
          View by Planet
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead style={{ background: 'var(--surface-3)', borderBottom: '1px solid var(--border-soft)' }}>
            <tr>
              <th style={{ padding: '1rem', textAlign: 'left', width: 100 }}>{viewMode === 'house' ? 'House' : 'Planet'}</th>
              {viewMode === 'house' ? (
                <>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Level A (Strongest)</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Level B</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Level C</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Level D (Weakest)</th>
                </>
              ) : (
                <th style={{ padding: '1rem', textAlign: 'left' }}>Houses Signified</th>
              )}
            </tr>
          </thead>
          <tbody>
            {viewMode === 'house' ? (
              [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(h => (
                <tr key={h} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                  <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--gold)' }}>House {h}</td>
                  <td style={{ padding: '1rem' }}>{renderGrahaList(significators.houseSignificators[h].A)}</td>
                  <td style={{ padding: '1rem' }}>{renderGrahaList(significators.houseSignificators[h].B)}</td>
                  <td style={{ padding: '1rem' }}>{renderGrahaList(significators.houseSignificators[h].C)}</td>
                  <td style={{ padding: '1rem' }}>{renderGrahaList(significators.houseSignificators[h].D)}</td>
                </tr>
              ))
            ) : (
              grahas.map(g => (
                <tr key={g.id} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                  <td style={{ padding: '1rem', fontWeight: 600 }}>{GRAHA_NAMES[g.id as GrahaId]}</td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {(significators.planetSignificators[g.id] || []).map((h: number) => (
                        <span key={h} style={{ 
                          background: 'var(--teal-faint)', padding: '0.2rem 0.5rem', 
                          borderRadius: '4px', fontSize: '0.7rem', color: 'var(--teal)', fontWeight: 600 
                        }}>
                          H{h}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function renderGrahaList(ids: GrahaId[]) {
  if (!ids || ids.length === 0) return <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>—</span>
  return (
    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
      {ids.map(id => (
        <span key={id} style={{ 
          background: 'var(--gold-faint)', padding: '0.2rem 0.5rem', 
          borderRadius: '4px', fontSize: '0.75rem', color: 'var(--gold)', fontWeight: 600,
          border: '1px solid var(--border-soft)'
        }}>
          {id}
        </span>
      ))}
    </div>
  )
}

// ── Cuspal Interlinks View ─────────────────────────────────────

function CuspalInterlinks({ cusps }: { cusps: any[] }) {
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
        <thead style={{ background: 'var(--surface-3)', borderBottom: '1px solid var(--border-soft)' }}>
          <tr>
            <th style={{ padding: '1rem', textAlign: 'left' }}>House</th>
            <th style={{ padding: '1rem', textAlign: 'left' }}>Cusp Degree</th>
            <th style={{ padding: '1rem', textAlign: 'left' }}>Sign Lord</th>
            <th style={{ padding: '1rem', textAlign: 'left' }}>Star Lord</th>
            <th style={{ padding: '1rem', textAlign: 'left' }}>Sub Lord</th>
            <th style={{ padding: '1rem', textAlign: 'left' }}>Sub-Sub Lord</th>
          </tr>
        </thead>
        <tbody>
          {cusps.map((c, i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--border-soft)' }}>
              <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--gold)' }}>{c.house}</td>
              <td style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                   <span style={{ fontWeight: 600 }}>{RASHI_SHORT[c.rashi as Rashi]}</span>
                   <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{c.degree.toFixed(2)}°</span>
                </div>
              </td>
              <td style={{ padding: '1rem' }}>{renderLord(c.signLord)}</td>
              <td style={{ padding: '1rem' }}>{renderLord(c.starLord)}</td>
              <td style={{ padding: '1rem' }}>{renderLord(c.subLord, true)}</td>
              <td style={{ padding: '1rem' }}>{renderLord(c.subSubLord)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function renderLord(id: GrahaId, isSub = false) {
  return (
    <span style={{ 
      color: isSub ? 'var(--gold)' : 'var(--text-primary)', 
      fontWeight: isSub ? 700 : 500,
      fontSize: '0.85rem'
    }}>
      {GRAHA_NAMES[id]}
    </span>
  )
}

// ── Ruling Planets View ───────────────────────────────────────

function RulingPlanetsView({ rp }: { rp: any }) {
  const items = [
    { label: 'Day Lord', value: rp.dayLord, icon: '📅' },
    { label: 'Moon Sign Lord', value: rp.moonSignLord, icon: '🌙' },
    { label: 'Moon Star Lord', value: rp.moonStarLord, icon: '✨' },
    { label: 'Lagna Sign Lord', value: rp.lagnaSignLord, icon: '🌅' },
    { label: 'Lagna Star Lord', value: rp.lagnaStarLord, icon: '✦' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
        Calculated for the moment of query/event. Ruling Planets provide instant answers and time-rectification clues.
      </p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
        {items.map((item, i) => (
          <div key={i} className="card" style={{ 
            padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem',
            background: 'var(--gradient-gold-muted)', border: '1px solid var(--border-soft)'
          }}>
            <div style={{ fontSize: '1.5rem' }}>{item.icon}</div>
            <div>
              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>{item.label}</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--gold)' }}>{GRAHA_NAMES[item.value as GrahaId]}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: '1.25rem', background: 'var(--surface-2)', border: '1px dashed var(--border-soft)' }}>
        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--text-primary)' }}>RP Verification</h4>
        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          In KP, an event is promised only if the Ruling Planets (especially Lagna Star Lord and Moon Star Lord) are present in the significators of the houses concerned.
        </p>
      </div>
    </div>
  )
}
