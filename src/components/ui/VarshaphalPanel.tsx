// ─────────────────────────────────────────────────────────────
//  src/components/ui/VarshaphalPanel.tsx
//  Solar Return (Varshaphal) chart viewer
//  Redesigned as a full-page workspace
// ─────────────────────────────────────────────────────────────
'use client'

import { useState, useCallback } from 'react'
import type { ChartOutput, GrahaData } from '@/types/astrology'
import { VargaSwitcher } from '@/components/chakra/VargaSwitcher'
import { ChakraSelector } from '@/components/chakra/ChakraSelector'
import { GRAHA_NAMES, RASHI_NAMES } from '@/types/astrology'

interface VarshaphalPanelProps {
  natalChart: ChartOutput
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function fmtDateTime(iso: string): string {
  const d = new Date(iso)
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}  ${String(d.getUTCHours()).padStart(2,'0')}:${String(d.getUTCMinutes()).padStart(2,'0')} UTC`
}

export function VarshaphalPanel({ natalChart }: VarshaphalPanelProps) {
  const birthYear  = parseInt(natalChart.meta.birthDate.slice(0, 4))
  const thisYear   = new Date().getFullYear()

  const [year,     setYear]     = useState(thisYear)
  const [loading,  setLoading]  = useState(false)
  const [result,   setResult]   = useState<{ chart: ChartOutput; meta: { returnDateUTC: string; returnYear: number; natalSunSidereal: number } } | null>(null)
  const [error,    setError]    = useState<string | null>(null)

  // Get natal Sun sidereal longitude
  const natalSun = natalChart.grahas.find((g: GrahaData) => g.id === 'Su')

  const calculate = useCallback(async () => {
    if (!natalSun) return
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res  = await fetch('/api/chart/varshaphal', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          natalSunSidereal: natalSun.totalDegree,
          returnYear:       year,
          latitude:         natalChart.meta.latitude,
          longitude:        natalChart.meta.longitude,
          timezone:         natalChart.meta.timezone,
          birthPlace:       natalChart.meta.birthPlace,
          settings:         natalChart.meta.settings,
          natalName:        natalChart.meta.name,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setResult(json)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Calculation failed')
    } finally {
      setLoading(false)
    }
  }, [year, natalSun, natalChart])

  const years = Array.from({ length: 15 }, (_, i) => thisYear - 5 + i)
    .filter(y => y >= birthYear)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ── Feature Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap',
        padding: '1.25rem 1.5rem',
        background: 'linear-gradient(135deg, rgba(201,168,76,0.12) 0%, rgba(201,168,76,0.05) 100%)',
        border: '1px solid rgba(201,168,76,0.25)',
        borderRadius: 'var(--r-md)',
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(201,168,76,0.3) 0%, transparent 70%)',
          border: '1px solid rgba(201,168,76,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.8rem', flexShrink: 0
        }}>☀️</div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.1 }}>
            Varshaphal <span style={{ color: 'var(--text-gold)', marginLeft: 8 }}>{year}</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.5, maxWidth: 600 }}>
            Solar Return Analysis — The chart for the exact moment the Sun returns to its natal position. 
            Used for predicting themes and events for the current year.
            {natalSun && (
              <span style={{ marginLeft: 8, color: 'var(--text-gold)', fontWeight: 600 }}>
                · Natal Sun: {natalSun.totalDegree.toFixed(3)}°
              </span>
            )}
          </div>
        </div>
        
        {/* Quick Year Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div className="label-caps" style={{ fontSize: '0.6rem' }}>Select Return Year</div>
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            {years.map(y => (
              <button key={y} onClick={() => { setYear(y); if (result?.meta.returnYear !== y) setResult(null) }} style={{
                padding: '0.35rem 0.75rem',
                background: year === y ? 'var(--gold)' : 'var(--surface-3)',
                border: `1px solid ${year === y ? 'var(--gold)' : 'var(--border-soft)'}`,
                borderRadius: 'var(--r-sm)', cursor: 'pointer',
                fontFamily: 'var(--font-mono)', fontSize: '0.82rem',
                fontWeight: year === y ? 700 : 400,
                color: year === y ? '#000' : 'var(--text-secondary)',
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: '4px'
              }}>
                {y}
                {y === thisYear && <span style={{ fontSize: '0.62rem', opacity: 0.8 }}>•</span>}
              </button>
            ))}
          </div>
          <button 
            onClick={calculate} 
            disabled={loading || !natalSun}
            className="btn btn-primary btn-sm"
            style={{ marginTop: '0.25rem' }}
          >
            {loading ? (
               <><span className="spin-loader" style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', marginRight: 6 }} /> Calculating…</>
            ) : `Cast ${year} Solar Return`}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '0.75rem', background: 'rgba(224,123,142,0.08)', border: '1px solid rgba(224,123,142,0.25)', borderRadius: 'var(--r-md)', color: 'var(--rose)', fontFamily: 'var(--font-display)', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      {/* ── Results Content ── */}
      {result ? (
        <div className="fade-up" style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          
          {/* LEFT: The Charts (Main focus) */}
          <div style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', gap: '1.5rem', minWidth: 0 }}>
             <div className="card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                   <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', fontWeight: 700 }}>
                      Varshaphal Chart · {result.chart.meta.name}
                   </div>
                   <div style={{ fontSize: '0.7rem', color: 'var(--text-gold)', background: 'var(--gold-faint)', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
                      {year} Return
                   </div>
                </div>
                <VargaSwitcher
                  vargas={result.chart.vargas}
                  vargaLagnas={result.chart.vargaLagnas ?? {}}
                  ascRashi={result.chart.lagnas.ascRashi}
                  lagnas={result.chart.lagnas}
                  arudhas={result.chart.arudhas}
                  userPlan="free"
                  moonNakIndex={result.chart.grahas.find((g: GrahaData) => g.id === 'Mo')?.nakshatraIndex ?? 0}
                />
             </div>
          </div>

          {/* RIGHT: Diagnostics & Info */}
          <div style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
             
             {/* Natal Reference Chart */}
             <div className="card" style={{ padding: '1rem', border: '1px solid var(--gold-faint)' }}>
                <div className="label-caps" style={{ marginBottom: '1rem', fontSize: '0.65rem', color: 'var(--text-gold)' }}>Janma Kundalī (Natal)</div>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                   <ChakraSelector
                      ascRashi={natalChart.lagnas.ascRashi}
                      grahas={natalChart.vargas?.D1 ?? natalChart.grahas}
                      moonNakIndex={natalChart.grahas.find(g => g.id === 'Mo')?.nakshatraIndex ?? 0}
                      arudhas={natalChart.arudhas}
                      tithiNumber={natalChart.panchang.tithi.number}
                      varaNumber={natalChart.panchang.vara.number}
                      defaultStyle="north"
                      size={240} 
                   />
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.85rem', fontFamily: 'var(--font-display)' }}>
                   <strong style={{ color: 'var(--text-secondary)' }}>{natalChart.meta.name}</strong> · {(RASHI_NAMES as any)[natalChart.lagnas.ascRashi]} Lagna
                </div>
             </div>

             {/* Return Moment Info */}
             <div className="card" style={{ padding: '1rem' }}>
                <div className="label-caps" style={{ marginBottom: '1rem', fontSize: '0.65rem' }}>Moment Analysis</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                   <div>
                      <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Precise Moment (UTC)</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', color: 'var(--text-primary)', marginTop: 2 }}>
                        {fmtDateTime(result.meta.returnDateUTC)}
                      </div>
                   </div>
                   <div style={{ height: 1, background: 'var(--border-soft)' }} />
                   <div>
                      <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Sun Position</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', color: 'var(--text-gold)', marginTop: 2 }}>
                        {result.meta.natalSunSidereal.toFixed(4)}° (sidereal)
                      </div>
                   </div>
                   <div style={{ height: 1, background: 'var(--border-soft)' }} />
                   <div>
                      <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Reference Location</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                        {natalChart.meta.birthPlace}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2 }}>{natalChart.meta.latitude.toFixed(2)}N, {natalChart.meta.longitude.toFixed(2)}E</div>
                   </div>
                </div>
             </div>

             {/* Planet Positions Table */}
             <div className="card" style={{ padding: '1rem' }}>
                <div className="label-caps" style={{ marginBottom: '0.75rem', fontSize: '0.65rem' }}>Solar Return Planets</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                   {result.chart.grahas.slice(0, 11).map(g => (
                      <div key={g.id} style={{
                         display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                         padding: '0.4rem 0.6rem', background: 'var(--surface-3)', borderRadius: 'var(--r-sm)',
                         border: '1px solid var(--border-soft)'
                      }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-muted)', width: 22 }}>{g.id}</span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 500 }}>{(GRAHA_NAMES as any)[g.id] || g.id}</span>
                         </div>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                               {g.totalDegree.toFixed(2)}°
                               {g.isRetro && <span style={{ color: 'var(--rose)', marginLeft: 3 }}>℞</span>}
                            </span>
                            <span style={{ 
                               fontSize: '0.6rem', color: g.dignity === 'exalted' ? 'var(--teal)' : g.dignity === 'debilitated' ? 'var(--rose)' : 'var(--text-muted)',
                               fontStyle: 'italic', minWidth: 50, textAlign: 'right'
                            }}>{g.dignity}</span>
                         </div>
                      </div>
                   ))}
                </div>
             </div>

             <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0 0.5rem' }}>
                * Varshaphal cast using Janma place and {natalChart.meta.settings.ayanamsha} ayanamsha.
             </div>

          </div>
        </div>
      ) : (
        /* Empty State -> with Natal Reference */
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
           <div className="card fade-up" style={{ flex: '1 1 450px', padding: '3rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.25rem', border: '1px dashed var(--border)' }}>
              <div style={{ fontSize: '3rem', opacity: 0.15 }}>🌞</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                 Generate Solar Return for <strong>{year}</strong>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', maxWidth: 400, lineHeight: 1.6 }}>
                 Compare your Janma Kundalī (right) with the upcoming Solar Return energies for {year}.
              </p>
              <button 
                onClick={calculate} 
                className="btn btn-primary btn-lg"
                style={{ padding: '0.85rem 2.5rem' }}
              >
                 Cast {year} Solar Return
              </button>
           </div>

           <div className="card fade-up" style={{ flex: '0 0 320px', padding: '1.25rem', border: '1px solid var(--gold-faint)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div className="label-caps" style={{ marginBottom: '1.25rem', fontSize: '0.65rem', color: 'var(--text-gold)', width: '100%' }}>Natal Reference (Janma)</div>
              <ChakraSelector
                 ascRashi={natalChart.lagnas.ascRashi}
                 grahas={natalChart.vargas?.D1 ?? natalChart.grahas}
                 moonNakIndex={natalChart.grahas.find(g => g.id === 'Mo')?.nakshatraIndex ?? 0}
                 arudhas={natalChart.arudhas}
                 tithiNumber={natalChart.panchang.tithi.number}
                 varaNumber={natalChart.panchang.vara.number}
                 defaultStyle="north"
                 size={250} 
              />
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '1rem', fontFamily: 'var(--font-display)' }}>
                 {natalChart.meta.name} · {(RASHI_NAMES as any)[natalChart.lagnas.ascRashi]} Lagna
              </div>
           </div>
        </div>
      )}
    </div>
  )
}
