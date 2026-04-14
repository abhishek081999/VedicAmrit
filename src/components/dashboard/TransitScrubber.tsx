'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'
import type { ChartOutput, GrahaData, Rashi } from '@/types/astrology'
import { RASHI_NAMES, GRAHA_NAMES, RASHI_SHORT } from '@/types/astrology'

const VargaSwitcher = dynamic(() => import('@/components/chakra/VargaSwitcher').then(m => m.VargaSwitcher), { ssr: false })

interface TransitScrubberProps {
  natalChart: ChartOutput
  onTransitChange: (grahas: GrahaData[] | null) => void
}

export function TransitScrubber({ natalChart, onTransitChange }: TransitScrubberProps) {
  const [offsetDays, setOffsetDays] = useState(0)
  const [loading, setLoading] = useState(false)
  const [transitData, setTransitData] = useState<GrahaData[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const activeDate = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + offsetDays)
    return d
  }, [offsetDays])

  const dateString = activeDate.toISOString().split('T')[0]

  const fetchTransit = useCallback(async (d: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/chart/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Transit Scrub',
          birthDate: d,
          birthTime: '12:00:00', // Noon for general transit
          birthPlace: natalChart.meta.birthPlace,
          latitude: natalChart.meta.latitude,
          longitude: natalChart.meta.longitude,
          timezone: natalChart.meta.timezone,
          settings: natalChart.meta.settings,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setTransitData(json.data.grahas)
      onTransitChange(json.data.grahas)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [natalChart, onTransitChange])

  // Fetch when scrubber stops moving (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTransit(dateString)
    }, 400)
    return () => clearTimeout(timer)
  }, [dateString, fetchTransit])

  const handleDayChange = (delta: number) => {
    setOffsetDays(prev => prev + delta)
  }

  const handleMonthChange = (delta: number) => {
    setOffsetDays(prev => prev + (delta * 30))
  }

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header */}
      <section style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: '2rem', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '2.5rem', filter: 'drop-shadow(0 0 10px var(--gold))' }}>⏳</span>
            <h1 style={{ margin: 0, fontSize: '2.8rem', fontWeight: 300, fontFamily: 'var(--font-display)' }}>Interactive Time Scrubber</h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '700px' }}>
            Shift through time to see how planetary transits move through the houses of your natal chart.
          </p>
        </div>
        
        <div className="card-gold" style={{ padding: '1.5rem', textAlign: 'center', minWidth: '200px' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-gold)', marginBottom: '0.5rem' }}>Target Date</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{dateString}</div>
          {offsetDays !== 0 && (
            <div style={{ fontSize: '0.8rem', color: offsetDays > 0 ? 'var(--teal)' : 'var(--rose)', marginTop: '0.25rem' }}>
              {offsetDays > 0 ? `+${offsetDays}` : offsetDays} days from today
            </div>
          )}
        </div>
      </section>

      {/* Scrubber Controls */}
      <section className="card" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => handleMonthChange(-1)} className="btn btn-ghost" style={{ padding: '0.5rem 1rem' }}>-1 Month</button>
          <button onClick={() => handleDayChange(-1)} className="btn btn-ghost" style={{ padding: '0.5rem 1rem' }}>-1 Day</button>
          
          <div style={{ flex: 1, minWidth: '300px', padding: '0 2rem', position: 'relative' }}>
            <input 
              type="range" 
              min="-365" 
              max="365" 
              value={offsetDays} 
              onChange={(e) => setOffsetDays(parseInt(e.target.value))}
              style={{
                width: '100%',
                height: '8px',
                borderRadius: '4px',
                background: 'var(--surface-3)',
                outline: 'none',
                WebkitAppearance: 'none',
                cursor: 'pointer'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              <span>-1 Year</span>
              <span>Today</span>
              <span>+1 Year</span>
            </div>
          </div>

          <button onClick={() => handleDayChange(1)} className="btn btn-ghost" style={{ padding: '0.5rem 1rem' }}>+1 Day</button>
          <button onClick={() => handleMonthChange(1)} className="btn btn-ghost" style={{ padding: '0.5rem 1rem' }}>+1 Month</button>
          
          <button onClick={() => setOffsetDays(0)} className="btn btn-primary" style={{ padding: '0.5rem 1.5rem', background: 'var(--gold-faint)', color: 'var(--text-gold)', border: '1px solid var(--gold)' }}>Reset to Today</button>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', color: 'var(--text-gold)', fontSize: '0.9rem', fontStyle: 'italic' }}>
            <span className="spin-loader" style={{ display: 'inline-block', width: '12px', height: '12px', marginRight: '8px' }} />
            Recalculating planetary gears...
          </div>
        )}
      </section>

      {/* Live Chart Visualization */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
        <div style={{ maxWidth: '700px', width: '100%' }}>
          <VargaSwitcher
            vargas={natalChart.vargas}
            vargaLagnas={natalChart.vargaLagnas ?? {}}
            ascRashi={natalChart.lagnas.ascRashi}
            lagnas={natalChart.lagnas}
            arudhas={natalChart.arudhas}
            transitGrahas={transitData ?? undefined}
            chart={natalChart}
            size={600}
            direction="column"
          />
        </div>
      </section>

      {/* Analysis Grid */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
        
        {/* Transit House Occupancy */}
        <div className="card" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-gold)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span>🏠</span> Transit-Natal House Overlay
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
            {Array.from({ length: 12 }, (_, i) => {
              const house = i + 1;
              const natalAscRashi = natalChart.lagnas.ascRashi;
              const houseRashi = (((natalAscRashi - 1 + house - 1) % 12) + 1) as Rashi;
              const planets = transitData?.filter(g => g.rashi === houseRashi) || [];
              const isLagna = house === 1;

              return (
                <div key={house} style={{ 
                  padding: '1rem', 
                  background: isLagna ? 'var(--gold-faint)' : 'var(--surface-3)', 
                  borderRadius: '12px', 
                  border: `1px solid ${isLagna ? 'var(--gold)' : 'var(--border-soft)'}`,
                  minHeight: '80px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)' }}>H{house}</span>
                    <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-gold)' }}>{RASHI_SHORT[houseRashi]}</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {planets.map(p => (
                      <span key={p.id} className="badge badge-accent" style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem' }}>
                        {p.id} {p.isRetro ? '℞' : ''}
                      </span>
                    ))}
                    {planets.length === 0 && <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', opacity: 0.4 }}>Empty</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Strategic Insights */}
        <div className="card" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-gold)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span>🔭</span> Dynamic Insights
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {(() => {
              if (!transitData) return <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Scrub the timeline to see interpretations.</div>;
              
              const insights = [];
              const saturn = transitData.find(g => g.id === 'Sa');
              const jupiter = transitData.find(g => g.id === 'Ju');
              const rahu = transitData.find(g => g.id === 'Ra');
              
              if (saturn) {
                const h = ((saturn.rashi - natalChart.lagnas.ascRashi + 12) % 12) + 1;
                if (h === 1) insights.push({ title: 'Saturn on Ascendant', desc: 'A period of heavy responsibility and personal restructuring.', type: 'caution' });
                else if (h === 10) insights.push({ title: 'Saturn in 10th House', desc: 'Focus on career consolidation and long-term professional growth.', type: 'neutral' });
              }
              
              if (jupiter) {
                const h = ((jupiter.rashi - natalChart.lagnas.ascRashi + 12) % 12) + 1;
                const houses = [1, 5, 9];
                if (houses.includes(h)) insights.push({ title: 'Jupiter Blessing', desc: `Jupiter transiting your House ${h} brings expansion and positive alignment.`, type: 'supportive' });
              }

              if (insights.length === 0) insights.push({ title: 'Balanced Flow', desc: 'No major planetary conflicts detected on this target date.', type: 'supportive' });

              return insights.map((insight, idx) => (
                <div key={idx} style={{ padding: '1.25rem', background: 'var(--surface-2)', borderRadius: '12px', borderLeft: `4px solid ${insight.type === 'supportive' ? 'var(--teal)' : insight.type === 'caution' ? 'var(--rose)' : 'var(--gold)'}` }}>
                   <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.25rem' }}>{insight.title}</div>
                   <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{insight.desc}</div>
                </div>
              ));
            })()}
          </div>
        </div>
      </section>

      {/* Visualization Legend */}
      <section className="card-primary" style={{ padding: '1.5rem', textAlign: 'center' }}>
        <p style={{ margin: 0, color: 'var(--text-on-gold)', fontSize: '0.9rem', fontWeight: 500 }}>
          💡 <strong>Tip:</strong> Pay close attention to the slow-movers (Saturn, Jupiter, Rahu/Ketu). Their transit into a new house often marks a 1.5 to 2.5 year shift in life focus.
        </p>
      </section>

    </div>
  )
}
