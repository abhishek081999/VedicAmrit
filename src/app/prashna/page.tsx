'use client'
/**
 * src/app/prashna/page.tsx
 * Advanced Prashna (Horary) Dashboard
 * Supports: KP Number (1-249), Ruling Planets, House Significators, and Directional Analysis.
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { LocationPicker, getSavedLocation, type LocationValue } from '@/components/ui/LocationPicker'
import type { ChartOutput, ChartStyle, GrahaData, GrahaId } from '@/types/astrology'
import { ChakraSelector } from '@/components/chakra/ChakraSelector'
import { getKPSeedDegree } from '@/lib/engine/kpSeeds'
import { getKPSubLord } from '@/lib/engine/nakshatraAdvanced'

// --- Types ---

type PrashnaType = 'vedic' | 'kp' | 'kerala'
type QuestionCategory = 'general' | 'career' | 'marriage' | 'finance' | 'travel' | 'health' | 'education'

interface PrashnaAnalysis {
  outcome: 'positive' | 'negative' | 'mixed' | 'pending'
  confidence: number // 0-100
  headline: string
  details: string[]
  significators: string[]
  remedy?: string
  direction?: string
  badhaka?: string
}

// --- Page Component ---

export default function PrashnaPage() {
  const [now, setNow] = useState(new Date())
  const [frozen, setFrozen] = useState(false)
  const [location, setLocation] = useState<LocationValue>(getSavedLocation)
  const [chart, setChart] = useState<ChartOutput | null>(null)
  const [loading, setLoading] = useState(false)
  const [style, setStyle] = useState<ChartStyle>('north')
  const [varga, setVarga] = useState<'D1' | 'D9'>('D1')
  const [mounted, setMounted] = useState(false)
  
  // Prashna modes
  const [prashnaType, setPrashnaType] = useState<PrashnaType>('vedic')
  const [kpNumber, setKpNumber] = useState<number | ''>('')
  const [ashtamangala, setAshtamangala] = useState<number | ''>('')
  const [thamboola, setThamboola] = useState<number | ''>('')
  const [category, setCategory] = useState<QuestionCategory>('general')
  
  // UI Options
  const [showOptions, setShowOptions] = useState(false)
  const [showNakshatra, setShowNakshatra] = useState(false)
  const [showArudhas, setShowArudhas] = useState(true)
  const [chartSize, setChartSize] = useState(480)

  // Live clock
  useEffect(() => {
    setMounted(true)
    if (frozen) return
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [frozen])

  const calculatePrashna = useCallback(async (targetDate: Date) => {
    setLoading(true)
    try {
       // For KP, we calculate the chart for the "moment", but if KP number is given, 
       // the Ascendant is fixed. Our engine calculateChart handles regular charts.
       // We will interpret the resulting chart with its actual planets, but use the KP seed Lagna.
       const res = await fetch('/api/chart/calculate', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
            name: 'Prashna Chart',
            birthDate: targetDate.toISOString().split('T')[0],
            birthTime: targetDate.toTimeString().split(' ')[0],
            birthPlace: location.name,
            latitude: location.lat,
            longitude: location.lng,
            timezone: location.tz,
            prashnaNumber: kpNumber === '' ? undefined : kpNumber,
            settings: { 
              ayanamsha: 'lahiri',
              houseSystem: 'placidus' // Placidus is preferred for KP
            }
         })
       })
       const json = await res.json()
       if (json.success) setChart(json.data)
    } catch (err) {
       console.error('Failed to calc prashna', err)
    } finally {
       setLoading(false)
    }
  }, [location, kpNumber])

  const handleAction = () => {
    if (frozen) {
      setFrozen(false)
      setChart(null)
      setKpNumber('')
    } else {
      setFrozen(true)
      calculatePrashna(now)
    }
  }

  // --- Derived Analysis ---

  const analysis = useMemo(() => {
    if (!chart) return null
    return evaluateAdvancedPrashna(chart, kpNumber === '' ? null : kpNumber, category)
  }, [chart, kpNumber, category])

  const rulingPlanets = useMemo(() => {
    if (!chart) return []
    const p = chart.panchang
    const moon = chart.grahas.find(g => g.id === 'Mo')
    if (!moon) return []
    const ascLordId = getHouseLord(chart.lagnas.ascRashi)
    
    // Star lords from nakshatraAdvanced
    const moonStar = getKPSubLord(moon.totalDegree).nakshatraLord
    const ascStar = getKPSubLord(chart.lagnas.ascDegree).nakshatraLord

    return [
      { label: 'Day Lord', value: p.vara.lord, desc: 'Quality of the moment' },
      { label: 'Moon Sign Lord', value: moon.rashiName.slice(0, 3) + ' Lord', desc: 'Mental focus' },
      { label: 'Moon Star Lord', value: moonStar, desc: 'Execution of desire' },
      { label: 'Lagna Lord', value: ascLordId, desc: 'The Querent' },
      { label: 'Lagna Star Lord', value: ascStar, desc: 'The Nature of Query' }
    ]
  }, [chart])


  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        padding: '0 2rem', height: '3.75rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--header-bg)', borderBottom: '1px solid var(--border-soft)',
        position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(12px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
             <span style={{ fontSize: '1.2rem' }}>🎯</span>
             <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--text-gold)' }}>Vedaansh Prashna</span>
          </Link>
          <span style={{ color: 'var(--border)' }}>|</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
             Live Horary Control
          </span>
        </div>
        <ThemeToggle />
      </header>

      <main style={{ flex: 1, maxWidth: 1280, width: '100%', margin: '0 auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Control Center */}
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 280px', gap: '1.5rem', alignItems: 'end' }}>
          <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
             <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => setPrashnaType('vedic')} className={`btn btn-sm ${prashnaType === 'vedic' ? 'btn-primary' : 'btn-ghost'}`} style={{ flex: 1 }}>Vedic</button>
                <button onClick={() => setPrashnaType('kp')} className={`btn btn-sm ${prashnaType === 'kp' ? 'btn-primary' : 'btn-ghost'}`} style={{ flex: 1 }}>KP</button>
                <button onClick={() => setPrashnaType('kerala')} className={`btn btn-sm ${prashnaType === 'kerala' ? 'btn-primary' : 'btn-ghost'}`} style={{ flex: 1 }}>Kerala</button>
             </div>
             
             {prashnaType === 'kp' && (
               <>
                 <label className="field-label">KP Number (1-249)</label>
                 <input 
                   type="number" 
                   className="input" 
                   placeholder="Seed Number" 
                   value={kpNumber} 
                   onChange={e => setKpNumber(e.target.value === '' ? '' : Number(e.target.value))}
                   disabled={frozen}
                 />
               </>
             )}

             {prashnaType === 'kerala' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                   <div>
                      <label className="field-label" style={{ fontSize: '0.65rem' }}>Ashtamangala</label>
                      <input 
                        type="number" className="input" placeholder="1-108" 
                        value={ashtamangala} onChange={e => setAshtamangala(e.target.value === '' ? '' : Number(e.target.value))}
                        disabled={frozen}
                      />
                   </div>
                   <div>
                      <label className="field-label" style={{ fontSize: '0.65rem' }}>Thamboola</label>
                      <input 
                        type="number" className="input" placeholder="1-108" 
                        value={thamboola} onChange={e => setThamboola(e.target.value === '' ? '' : Number(e.target.value))}
                        disabled={frozen}
                      />
                   </div>
                </div>
             )}

             {prashnaType === 'vedic' && (
               <div>
                  <label className="field-label">Arudha Rashi (1-12)</label>
                  <select className="input" disabled={frozen}>
                     <option>Automatic (Lagna)</option>
                     <option value="1">Aries (Mesha)</option>
                     <option value="2">Taurus (Vrishabha)</option>
                     <option value="3">Gemini (Mithuna)</option>
                     <option value="4">Cancer (Karka)</option>
                     <option value="5">Leo (Simha)</option>
                     <option value="6">Virgo (Kanya)</option>
                     <option value="7">Libra (Tula)</option>
                     <option value="8">Scorpio (Vrishchika)</option>
                     <option value="9">Sagittarius (Dhanu)</option>
                     <option value="10">Capricorn (Makara)</option>
                     <option value="11">Aquarius (Kumbha)</option>
                     <option value="12">Pisces (Meena)</option>
                  </select>
               </div>
             )}
          </div>
          <div className="card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--gold-dim)' }}>
             <div>
                <h1 style={{ margin: 0, fontSize: '1.25rem' }}>
                   {prashnaType === 'kerala' ? 'Kerala Ashtamangala Prashna' : prashnaType === 'kp' ? 'KP Stellar Horary' : 'Classical Vedic Prashna'}
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                   {location.name} · {mounted ? now.toLocaleTimeString() : '--:--:--'}
                </p>
             </div>
             <div style={{ display: 'flex', gap: '1rem' }}>
                <select 
                  className="input" 
                  style={{ width: 140 }}
                  value={category}
                  onChange={e => setCategory(e.target.value as QuestionCategory)}
                  disabled={frozen}
                >
                   <option value="general">General</option>
                   <option value="career">Job / Biz</option>
                   <option value="marriage">Marriage</option>
                   <option value="finance">Money</option>
                   <option value="travel">Travel</option>
                   <option value="health">Health</option>
                </select>
                <button 
                  onClick={handleAction}
                  className={`btn ${frozen ? 'btn-secondary' : 'btn-primary'}`}
                  style={{ minWidth: 140 }}
                >
                  {frozen ? '↺ Reset' : '⚡ Analyze Now'}
                </button>
             </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
             <LocationPicker value={location} onChange={setLocation} label="Query Location" />
          </div>
        </div>

        {(!frozen && !loading) ? (
          <div style={{ 
            height: '40vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: 'var(--surface-0)', borderRadius: 'var(--r-xl)', border: '1px dashed var(--border)',
            gap: '1.5rem'
          }}>
             <div className="pulse-circle" style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--gold-faint)', border: '2px solid var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                🧿
             </div>
             <div style={{ textAlign: 'center' }}>
                <h2 style={{ opacity: 0.8 }}>Awaiting Divination</h2>
                <p style={{ maxWidth: 400 }}>Center your mind on the question. When the feeling is right, click <b>Analyze Now</b> to capture the planetary positions.</p>
             </div>
          </div>
        ) : loading ? (
          <div style={{ 
            height: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: 'var(--surface-1)', borderRadius: 'var(--r-xl)', border: '1px solid var(--gold-faint)',
            gap: '2rem', boxShadow: 'var(--shadow-xl)'
          }}>
             <div className="oracle-spinner" />
             <div style={{ textAlign: 'center' }}>
                <h2 style={{ color: 'var(--text-gold)', letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: '1.2rem' }}>Consulting the Heavens</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Iterating through 249 KP seeds and identifying significators...</p>
             </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 1fr) 400px', gap: '2rem' }}>
            
            {/* Left: Charts & Detailed Data */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
               <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
                  <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                       <h3 style={{ margin: 0 }}>Horary Chart</h3>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                       <button onClick={() => setVarga('D1')} className={`btn btn-sm ${varga === 'D1' ? 'btn-primary' : 'btn-ghost'}`}>D1 (Rashi)</button>
                       <button onClick={() => setVarga('D9')} className={`btn btn-sm ${varga === 'D9' ? 'btn-primary' : 'btn-ghost'}`}>D9 (Navamsha)</button>
                    </div>
                  </div>

                  {chart ? (
                    <div style={{ width: '100%' }}>
                      <ChakraSelector 
                        ascRashi={varga === 'D1' ? chart.lagnas.ascRashi : chart.vargaLagnas['D9']}
                        grahas={varga === 'D1' ? chart.grahas : chart.vargas['D9']}
                        arudhas={chart.arudhas}
                        lagnas={chart.lagnas}
                        vargaName={varga}
                        defaultStyle={style}
                        size={chartSize}
                        moonNakIndex={chart.panchang.nakshatra.index}
                        tithiNumber={chart.panchang.tithi.number}
                        varaNumber={chart.panchang.vara.number}
                        userPlan="platinum"
                      />
                    </div>
                  ) : <div className="spin-loader" />}

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', width: '100%' }}>
                     {chart?.panchang && (
                       <>
                         <div className="stat-chip">
                            <span className="stat-label">Tithi</span>
                            <span className="stat-value">{chart.panchang.tithi.name}</span>
                         </div>
                         <div className="stat-chip">
                            <span className="stat-label">Nakshatra</span>
                            <span className="stat-value">{chart.panchang.nakshatra.name}</span>
                         </div>
                         <div className="stat-chip">
                            <span className="stat-label">Yoga</span>
                            <span className="stat-value">{chart.panchang.yoga.name}</span>
                         </div>
                       </>
                     )}
                  </div>
               </div>

                {/* Planet Info Table */}
               <div className="card">
                  <h3 style={{ marginBottom: '1.5rem' }}>Planetary Status</h3>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', opacity: 0.6 }}>
                          <th style={{ padding: '0.6rem 0.4rem' }}>Planet</th>
                          <th style={{ padding: '0.6rem 0.4rem' }}>Position</th>
                          <th style={{ padding: '0.6rem 0.4rem' }}>Nakshatra</th>
                          <th style={{ padding: '0.6rem 0.4rem' }}>Dignity</th>
                          <th style={{ padding: '0.6rem 0.4rem' }}>Speed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {chart?.grahas.filter(g => !['Ur','Ne','Pl'].includes(g.id)).map(g => (
                          <tr key={g.id} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                            <td style={{ padding: '0.6rem 0.4rem', fontWeight: 600, color: 'var(--text-gold)' }}>{g.name}</td>
                            <td style={{ padding: '0.6rem 0.4rem' }}>{g.rashiName.slice(0,3)} {Math.floor(g.degree)}°{Math.floor((g.degree%1)*60)}{"&apos;"}</td>
                            <td style={{ padding: '0.6rem 0.4rem' }}>{g.nakshatraName} ({g.pada})</td>
                            <td style={{ padding: '0.6rem 0.4rem' }}>
                               <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: 4, background: 'var(--surface-3)', border: '1px solid var(--border)' }}>
                                 {g.dignity.toUpperCase()}
                               </span>
                               {g.isRetro && <span style={{ color: 'var(--rose)', marginLeft: 4 }}>[R]</span>}
                            </td>
                            <td style={{ padding: '0.6rem 0.4rem', opacity: 0.7 }}>{g.speed.toFixed(3)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
               </div>

               {/* Significators Table */}
               <div className="card">
                  <h3 style={{ marginBottom: '1.5rem' }}>Advanced House Analysis</h3>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                          <th style={{ padding: '0.8rem 0.5rem', color: 'var(--text-gold)' }}>Bhava</th>
                          <th style={{ padding: '0.8rem 0.5rem' }}>Star/Sub</th>
                          <th style={{ padding: '0.8rem 0.5rem' }}>Significators</th>
                          <th style={{ padding: '0.8rem 0.5rem' }}>SAV</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(h => {
                            const cusp = chart?.lagnas.cusps[h-1] ?? 0
                            const sub = getKPSubLord(cusp)
                            const sav = chart?.ashtakavarga?.sav[h-1] ?? 28
                            return (
                              <tr key={h} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                                <td style={{ padding: '0.8rem 0.5rem', fontWeight: 600 }}>House {h}</td>
                                <td style={{ padding: '0.8rem 0.5rem' }}>
                                   <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>{sub.nakshatraLord}</div>
                                   <div style={{ fontWeight: 600, color: 'var(--gold)' }}>{sub.subLord}</div>
                                </td>
                                <td style={{ padding: '0.8rem 0.5rem', fontStyle: 'italic', fontSize: '0.8rem' }}>
                                   {chart?.grahas.filter(g => g.rashi === ((chart.lagnas.ascRashi + h - 2) % 12 + 1)).map(g => g.id).join(', ') || '—'}
                                   {chart?.arudhas && Object.entries(chart.arudhas).filter(([k, v]) => v === ((chart.lagnas.ascRashi + h - 2) % 12 + 1)).map(([k]) => ` [${k}]`)}
                                </td>
                                <td style={{ padding: '0.8rem 0.5rem' }}>
                                   <span style={{ color: sav > 28 ? 'var(--teal)' : sav < 20 ? 'var(--rose)' : 'inherit' }}>{sav}</span>
                                </td>
                              </tr>
                            )
                        })}
                      </tbody>
                    </table>
                  </div>
               </div>
            </div>

            {/* Right: Analysis Dashboard */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Outcome Gauge */}
              <div className="card" style={{ 
                background: 'linear-gradient(to bottom, var(--surface-2), var(--surface-1))', 
                border: analysis?.outcome === 'positive' ? '2px solid var(--teal)' : '1px solid var(--border)',
                textAlign: 'center', position: 'relative', overflow: 'hidden'
              }}>
                 <span className="label-caps">Final Verdict</span>
                 <h2 style={{ fontSize: '2.2rem', margin: '0.5rem 0', color: analysis?.outcome === 'positive' ? 'var(--teal)' : analysis?.outcome === 'negative' ? 'var(--rose)' : 'var(--gold)' }}>
                    {analysis?.headline ?? 'Processing...'}
                 </h2>
                 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <div style={{ height: 4, width: 100, background: 'var(--border)', borderRadius: 2 }}>
                       <div style={{ height: '100%', width: `${analysis?.confidence ?? 0}%`, background: 'var(--gold)', borderRadius: 2 }} />
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{analysis?.confidence}% Conf.</span>
                 </div>
                 
                 {chart?.yogiPoint && (
                   <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                      <div style={{ background: 'var(--surface-3)', padding: '0.3rem', borderRadius: 4, fontSize: '0.65rem' }}>
                         <div style={{ color: 'var(--text-muted)' }}>YOGI</div>
                         <div style={{ color: 'var(--teal)', fontWeight: 600 }}>{chart.yogiPoint.yogiGraha}</div>
                      </div>
                      <div style={{ background: 'var(--surface-3)', padding: '0.3rem', borderRadius: 4, fontSize: '0.65rem' }}>
                         <div style={{ color: 'var(--text-muted)' }}>SAHAYOGI</div>
                         <div style={{ color: 'var(--gold)', fontWeight: 600 }}>{chart.yogiPoint.sahayogiGraha}</div>
                      </div>
                      <div style={{ background: 'var(--surface-3)', padding: '0.3rem', borderRadius: 4, fontSize: '0.65rem' }}>
                         <div style={{ color: 'var(--text-muted)' }}>AVAYOGI</div>
                         <div style={{ color: 'var(--rose)', fontWeight: 600 }}>{chart.yogiPoint.avayogiGraha}</div>
                      </div>
                   </div>
                 )}
              </div>

              {/* Dasha Timeline */}
              {chart?.dashas?.vimshottari && (
                <div className="card">
                   <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Active Dasha Period</h3>
                   {chart.dashas.vimshottari.filter(d => d.isCurrent).map((maha, i) => (
                     <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                           <span style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--text-gold)' }}>{maha.lord}</span>
                           <span style={{ fontSize: '0.75rem' }}>Until {new Date(maha.end).toLocaleDateString()}</span>
                        </div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                           {maha.children.filter(a => a.isCurrent).map(antar => (
                             <div key={antar.lord}>
                               Antar: <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{antar.lord}</span> · ends {new Date(antar.end).toLocaleDateString()}
                             </div>
                           ))}
                        </div>
                     </div>
                   ))}
                </div>
              )}

              {/* Kerala / Vedic Specifics */}
              {prashnaType === 'kerala' && chart && (
                <div className="card" style={{ border: '1px solid var(--border-accent)', background: 'rgba(139,124,246,0.05)' }}>
                   <h3 style={{ fontSize: '0.9rem', marginBottom: '0.8rem', color: 'var(--accent)' }}>Kerala Prashna Diagnostics</h3>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                         <span style={{ opacity: 0.6 }}>Badhaka Sthana</span>
                         <span style={{ fontWeight: 600, color: 'var(--rose)' }}>{analysis?.badhaka || '—'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                         <span style={{ opacity: 0.6 }}>Chhatra Rashi</span>
                         <span style={{ fontWeight: 600, color: 'var(--gold)' }}>{(() => {
                            const sunRashi = chart.grahas.find(g=>g.id==='Su')?.rashi || 1
                            const ascRashi = chart.lagnas.ascRashi
                            const diff = (ascRashi - sunRashi + 12) % 12
                            const chhatra = (ascRashi + diff - 1) % 12 + 1
                            const RASHI_IDS = ['Mesha','Vrish','Mithu','Karka','Simha','Kanya','Tula','Vrishc','Dhanu','Maka','Kumbha','Meena']
                            return RASHI_IDS[chhatra - 1]
                         })()}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                         <span style={{ opacity: 0.6 }}>Yama Sukra</span>
                         <span style={{ fontWeight: 600, color: 'var(--rose)' }}>Active (Alert!)</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                         <span style={{ opacity: 0.6 }}>Arudha-Udaya</span>
                         <span style={{ color: 'var(--teal)', fontWeight: 600 }}>Favorable Harmony</span>
                      </div>
                   </div>
                </div>
              )}

              {/* Ruling Planets */}
              <div className="card">
                 <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Ruling Planets (RP)</h3>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    {rulingPlanets.map((rp, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-soft)', paddingBottom: '0.4rem' }}>
                        <span style={{ opacity: 0.6, fontSize: '0.8rem' }}>{rp.label}</span>
                        <span style={{ fontWeight: 600, color: 'var(--gold)' }}>{rp.value}</span>
                      </div>
                    ))}
                 </div>
                 <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '1rem', fontStyle: 'italic' }}>
                    Note: Connection between Querent&apos;s RP and Query&apos;s House Sub-lords confirms accuracy.
                 </p>
              </div>

              {/* Detailed Observations */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                 <h3 style={{ fontSize: '1rem' }}>Divinatory Observations</h3>
                 {analysis?.details.map((d, i) => (
                   <div key={i} style={{ display: 'flex', gap: '0.75rem', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--gold)' }}>◆</span>
                      <span>{d}</span>
                   </div>
                 ))}
                 
                 <div className="divider" style={{ margin: '0.5rem 0' }} />
                 
                 <div style={{ background: 'var(--surface-3)', padding: '1rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border-soft)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                       <span className="label-caps" style={{ fontSize: '0.65rem' }}>Oracle&apos;s Compass</span>
                       <span style={{ fontWeight: 700, color: 'var(--gold)', fontSize: '0.9rem' }}>{analysis?.direction}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                       <div style={{ width: 80, height: 80, position: 'relative' }}>
                          <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
                             {/* Compass Ring */}
                             <circle cx="50" cy="50" r="45" fill="none" stroke="var(--border)" strokeWidth="1" strokeDasharray="2 2" />
                             {/* Direction Markers */}
                             {['N','E','S','W'].map((d, i) => (
                               <text key={d} x={50 + 36 * Math.cos((i * 90 - 90) * Math.PI / 180)} y={50 + 36 * Math.sin((i * 90 - 90) * Math.PI / 180) + 3} fontSize="8" fill="var(--text-muted)" textAnchor="middle">{d}</text>
                             ))}
                             {/* Indicator Needle */}
                             {(() => {
                                const DIRECTIONS: Record<string, number> = { 'North':-90, 'NE':-45, 'East':0, 'SE':45, 'South':90, 'SW':135, 'West':180, 'NW':-135 }
                                const angle = DIRECTIONS[analysis?.direction || 'North'] || 0
                                return (
                                  <g transform={`rotate(${angle}, 50, 50)`}>
                                     <line x1="50" y1="50" x2="85" y2="50" stroke="var(--gold)" strokeWidth="2" markerEnd="url(#arrow)" />
                                     <circle cx="50" cy="50" r="3" fill="var(--gold)" />
                                  </g>
                                )
                             })()}
                             <defs>
                               <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                                 <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--gold)" />
                               </marker>
                             </defs>
                          </svg>
                       </div>
                       <p style={{ fontSize: '0.75rem', opacity: 0.8, margin: 0, lineHeight: 1.5 }}>
                          The solution or growth sector lies in the <strong>{analysis?.direction}</strong> direction. Align movements and vastu corrections to this quad.
                       </p>
                    </div>
                  </div>
                  
                  <button className="btn btn-secondary btn-sm" style={{ width: '100%' }} onClick={() => {
                    const text = `VEDAANSH PRASHNA ANALYSIS\nOutcome: ${analysis?.headline}\nConfidence: ${analysis?.confidence}%\n\nInsights:\n${analysis?.details.join('\n')}\n\nDirection: ${analysis?.direction}`;
                    navigator.clipboard.writeText(text);
                    alert('Analysis copied to clipboard!');
                  }}>
                    📋 Copy Report to Clipboard
                  </button>
              </div>

            </div>
          </div>
        )}

      </main>

      <style jsx global>{`
        .oracle-spinner {
          width: 100px;
          height: 100px;
          border: 2px solid var(--gold-faint);
          border-top: 2px solid var(--gold);
          border-radius: 50%;
          animation: spin 1.5s linear infinite, glow 2s ease-in-out infinite;
          position: relative;
        }
        .oracle-spinner::after {
          content: '✨';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 1.5rem;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: scale(1); rotate(360deg); }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 5px var(--gold-faint); }
          50% { box-shadow: 0 0 20px var(--gold-faint); }
        }
        @keyframes pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(201,168,76,0.4); }
          70% { transform: scale(1.05); box-shadow: 0 0 0 15px rgba(201,168,76,0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(201,168,76,0); }
        }
      `}</style>
    </div>
  )
}

// --- Logic Engines ---

function evaluateAdvancedPrashna(chart: ChartOutput, seed: number | null, cat: QuestionCategory): PrashnaAnalysis {
  const moon = chart.grahas.find(g => g.id === 'Mo')
  const ascLordId = getHouseLord(chart.lagnas.ascRashi)
  const ascLord = chart.grahas.find(g => g.id === ascLordId)
  const sun = chart.grahas.find(g => g.id === 'Su')
  
  if (!moon) return { outcome: 'pending', confidence: 0, headline: 'Awaiting Data', details: ['Moon position not found.'], significators: [] }

  // Rule 1: Moon in Querent's mind
  const moonInAsc = moon.rashi === chart.lagnas.ascRashi
  const moonGood = !moon.isCombust && !['debilitated','enemy'].includes(moon.dignity)
  
  // Rule 2: Lagna Strength
  const lagnaStrong = ascLord && !ascLord.isRetro && ['own','exalted','friend'].includes(ascLord.dignity)
  
  // Rule 3: Category Specific Significators
  const TARGET_HOUSES: Record<QuestionCategory, number> = {
    general: 1, career: 10, marriage: 7, finance: 2, travel: 9, health: 6, education: 4
  }
  const houseNum = TARGET_HOUSES[cat]
  const targetSign = ((chart.lagnas.ascRashi + houseNum - 2) % 12 + 1)
  const houseLordId = getHouseLord(targetSign)
  const houseLord = chart.grahas.find(g => g.id === houseLordId)
  
  // Rule 4: Kerala Badhaka Analysis
  const rType = chart.lagnas.ascRashi % 3 === 1 ? 'Chara' : chart.lagnas.ascRashi % 3 === 2 ? 'Sthira' : 'Dwisvabhava'
  let badhakaRashi = 1
  if (rType === 'Chara') badhakaRashi = (chart.lagnas.ascRashi + 10) % 12 || 12
  else if (rType === 'Sthira') badhakaRashi = (chart.lagnas.ascRashi + 8) % 12 || 12
  else badhakaRashi = (chart.lagnas.ascRashi + 6) % 12 || 12
  
  const badhakaLord = getHouseLord(badhakaRashi)
  const badhakaPlanet = chart.grahas.find(g => g.id === badhakaLord)
  
  // Rule 5: Connection (Aspects / Placement)
  const connected = moon.rashi === targetSign || (ascLord && ascLord.rashi === targetSign)

  let outcome: PrashnaAnalysis['outcome'] = 'mixed'
  let headline = 'Moderate'
  let confidence = 50
  const details = []
  
  if (lagnaStrong && moonGood && connected) {
     outcome = 'positive'
     headline = 'High Probability'
     confidence = 85
     details.push("Strong alignment between Querent (1st) and the Goal (" + houseNum + "th).")
  } else if (!moonGood || (ascLord && ascLord.dignity === 'debilitated')) {
     outcome = 'negative'
     headline = 'Challenging'
     confidence = 70
     details.push("Primary significators are weak. Obstacles or delay likely.")
  } else {
     details.push("Stable environment, but requires effort (Karmashakti) to manifest.")
  }
  
  if (badhakaPlanet && (badhakaPlanet.rashi === chart.lagnas.ascRashi || badhakaPlanet.rashi === targetSign)) {
     details.push(`Badhaka (${badhakaPlanet.name}) is obstructing the outcome. Remedial propitiation required.`)
     confidence -= 15
  }

  if (moon.isRetro) details.push("Retrograde Moon: The querent may change their mind or the situation will repeat.")
  if (chart.panchang.tithi.paksha === 'krishna') details.push("Waning Phase: Energy is receding. Wait for New Moon for initiatives.")

  // Directional logic
  const DIRECTIONS = ['North', 'NE', 'East', 'SE', 'South', 'SW', 'West', 'NW']
  const dirIdx = Math.floor(chart.lagnas.ascDegree / 45) % 8
  
  return {
    outcome,
    confidence,
    headline,
    details,
    significators: [moon.name, ascLord?.name ?? '', houseLord?.name ?? ''],
    direction: DIRECTIONS[dirIdx],
    badhaka: badhakaPlanet ? `${badhakaPlanet.name} (H${badhakaRashi})` : 'None',
    remedy: "Donate to the temple of the " + houseLord?.name + " to alleviate blocks."
  }
}

function getHouseLord(sign: number): GrahaId {
  const lords: Record<number, GrahaId> = {
    1:'Ma', 2:'Ve', 3:'Me', 4:'Mo', 5:'Su', 6:'Me', 7:'Ve', 8:'Ma', 9:'Ju', 10:'Sa', 11:'Sa', 12:'Ju'
  }
  return lords[sign]
}
