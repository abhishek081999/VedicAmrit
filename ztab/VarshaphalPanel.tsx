// ─────────────────────────────────────────────────────────────
//  src/components/ui/VarshaphalPanel.tsx
//  Solar Return (Varshaphal) chart viewer
//  Shown as a tab in the main chart page
// ─────────────────────────────────────────────────────────────
'use client'

import { useState, useCallback } from 'react'
import type { ChartOutput, GrahaData } from '@/types/astrology'
import { VargaSwitcher } from '@/components/chakra/VargaSwitcher'

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

  const years = Array.from({ length: 10 }, (_, i) => thisYear - 2 + i)
    .filter(y => y > birthYear)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Header info */}
      <div style={{
        padding: '0.85rem 1rem',
        background: 'rgba(201,168,76,0.07)',
        border: '1px solid rgba(201,168,76,0.20)',
        borderRadius: 'var(--r-md)',
        fontSize: '0.82rem', color: 'var(--text-secondary)',
        fontFamily: 'var(--font-display)',
      }}>
        <strong style={{ color: 'var(--text-gold)' }}>Varshaphal</strong> (Solar Return) — the chart cast for the exact moment the Sun returns to its natal position each year. Used for yearly predictions and life themes.
        {natalSun && (
          <span style={{ marginLeft: 8, fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Natal Sun: {natalSun.totalDegree.toFixed(4)}°
          </span>
        )}
      </div>

      {/* Year selector + Calculate */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div>
          <label style={{ fontSize: '0.72rem', display: 'block', marginBottom: '0.35rem' }}>Select Year</label>
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            {years.map(y => (
              <button key={y} onClick={() => setYear(y)} style={{
                padding: '0.3rem 0.65rem',
                background: year === y ? 'rgba(201,168,76,0.15)' : 'var(--surface-2)',
                border: `1px solid ${year === y ? 'var(--border-bright)' : 'var(--border)'}`,
                borderRadius: 'var(--r-md)', cursor: 'pointer',
                fontFamily: 'var(--font-mono)', fontSize: '0.82rem',
                fontWeight: year === y ? 700 : 400,
                color: year === y ? 'var(--text-gold)' : 'var(--text-secondary)',
              }}>
                {y}
                {y === thisYear && <span style={{ marginLeft: 3, fontSize: '0.6rem', color: 'var(--teal)' }}>●</span>}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={calculate}
          disabled={loading || !natalSun}
          className="btn btn-primary btn-sm"
          style={{ alignSelf: 'flex-end' }}
        >
          {loading ? (
            <><span className="spin-loader" style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /> Calculating…</>
          ) : `Cast ${year} Solar Return`}
        </button>
      </div>

      {error && (
        <div style={{ padding: '0.75rem', background: 'rgba(224,123,142,0.08)', border: '1px solid rgba(224,123,142,0.25)', borderRadius: 'var(--r-md)', color: 'var(--rose)', fontFamily: 'var(--font-display)', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Return moment */}
          <div style={{
            display: 'flex', gap: '1rem', flexWrap: 'wrap',
            padding: '0.75rem 1rem',
            background: 'var(--surface-2)', border: '1px solid var(--border)',
            borderRadius: 'var(--r-md)',
          }}>
            <div>
              <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>Solar Return Moment (UTC)</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--text-primary)', marginTop: 2 }}>
                {fmtDateTime(result.meta.returnDateUTC)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>Sun Longitude</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--text-gold)', marginTop: 2 }}>
                {result.meta.natalSunSidereal.toFixed(4)}° (sidereal)
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>Location</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                {natalChart.meta.birthPlace}
              </div>
            </div>
          </div>

          {/* Varshaphal chart */}
          <div>
            <div className="label-caps" style={{ marginBottom: '0.75rem' }}>
              {result.chart.meta.name}
            </div>
            <VargaSwitcher
              vargas={result.chart.vargas}
              vargaLagnas={result.chart.vargaLagnas ?? {}}
              ascRashi={result.chart.lagnas.ascRashi}
              arudhas={result.chart.arudhas}
              userPlan="kala"
              moonNakIndex={result.chart.grahas.find((g: GrahaData) => g.id === 'Mo')?.nakshatraIndex ?? 0}
            />
          </div>

          {/* Key planets */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '0.5rem',
          }}>
            {result.chart.grahas.slice(0, 9).map(g => (
              <div key={g.id} style={{
                padding: '0.5rem 0.75rem',
                background: 'var(--surface-2)', border: '1px solid var(--border)',
                borderRadius: 'var(--r-sm)',
                display: 'flex', alignItems: 'center', gap: '0.5rem',
              }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-secondary)', minWidth: 24 }}>{g.id}</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.78rem', color: 'var(--text-primary)' }}>
                  {g.totalDegree.toFixed(2)}°
                  {g.isRetro && <span style={{ color: 'var(--rose)', marginLeft: 3 }}>℞</span>}
                </span>
                <span style={{
                  marginLeft: 'auto', fontSize: '0.65rem', fontFamily: 'var(--font-display)',
                  color: g.dignity === 'exalted' ? 'var(--teal)' : g.dignity === 'debilitated' ? 'var(--rose)' : 'var(--text-muted)',
                  fontStyle: 'italic',
                }}>{g.dignity}</span>
              </div>
            ))}
          </div>

          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontStyle: 'italic', textAlign: 'center', paddingTop: '0.5rem', borderTop: '1px solid var(--border-soft)' }}>
            Varshaphal chart cast at natal location · {natalChart.meta.settings.ayanamsha} ayanamsha
          </div>
        </div>
      )}
    </div>
  )
}
