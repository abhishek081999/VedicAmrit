'use client'
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { LocationPicker, getSavedLocation, type LocationValue } from '@/components/ui/LocationPicker'
import type { ChartOutput, ChartStyle, GrahaId } from '@/types/astrology'
import { ChakraSelector } from '@/components/chakra/ChakraSelector'
import { getKPSubLord } from '@/lib/engine/nakshatraAdvanced'

type PrashnaType = 'vedic' | 'kp' | 'kerala'
type QuestionCategory = 'general' | 'career' | 'marriage' | 'finance' | 'travel' | 'health' | 'education'

interface PrashnaAnalysis {
  outcome: 'positive' | 'negative' | 'mixed' | 'pending'
  confidence: number
  headline: string
  details: string[]
  significators: string[]
  remedy?: string
  direction?: string
  badhaka?: string
}

export function PrashnaPanel({ chart: externalChart }: { chart?: ChartOutput | null }) {
  const [now, setNow] = useState(new Date())
  const [frozen, setFrozen] = useState(false)
  const [location, setLocation] = useState<LocationValue>(getSavedLocation)
  const [chart, setChart] = useState<ChartOutput | null>(null)
  const [loading, setLoading] = useState(false)
  const [style, setStyle] = useState<ChartStyle>('north')
  const [varga, setVarga] = useState<'D1' | 'D9'>('D1')
  
  const [prashnaType, setPrashnaType] = useState<PrashnaType>('vedic')
  const [kpNumber, setKpNumber] = useState<number | ''>('')
  const [ashtamangala, setAshtamangala] = useState<number | ''>('')
  const [thamboola, setThamboola] = useState<number | ''>('')
  const [category, setCategory] = useState<QuestionCategory>('general')
  const [chartSize, setChartSize] = useState(480)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 1100
      setIsMobile(mobile)
      setChartSize(mobile ? Math.min(window.innerWidth - 40, 420) : 480)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    if (frozen) return
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [frozen])

  const calculatePrashna = useCallback(async (targetDate: Date) => {
    setLoading(true)
    try {
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
            settings: { ayanamsha: 'lahiri', houseSystem: 'placidus' }
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
    const moonStar = getKPSubLord(moon.totalDegree).nakshatraLord
    const ascStar = getKPSubLord(chart.lagnas.ascDegree).nakshatraLord

    return [
      { label: 'Day Lord', value: p.vara.lord },
      { label: 'Moon Sign Lord', value: moon.rashiName.slice(0, 3) },
      { label: 'Moon Star Lord', value: moonStar },
      { label: 'Lagna Lord', value: ascLordId },
      { label: 'Lagna Star Lord', value: ascStar }
    ]
  }, [chart])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1.5rem', alignItems: isMobile ? 'stretch' : 'end' }}>
          <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', background: 'var(--surface-2)' }}>
             <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => setPrashnaType('vedic')} className={`btn btn-sm ${prashnaType === 'vedic' ? 'btn-primary' : 'btn-ghost'}`} style={{ flex: 1 }}>Vedic</button>
                <button onClick={() => setPrashnaType('kp')} className={`btn btn-sm ${prashnaType === 'kp' ? 'btn-primary' : 'btn-ghost'}`} style={{ flex: 1 }}>KP</button>
                <button onClick={() => setPrashnaType('kerala')} className={`btn btn-sm ${prashnaType === 'kerala' ? 'btn-primary' : 'btn-ghost'}`} style={{ flex: 1 }}>Kerala</button>
             </div>
             {prashnaType === 'kp' && (
               <input type="number" className="input" placeholder="KP Seed (1-249)" value={kpNumber} onChange={e => setKpNumber(e.target.value === '' ? '' : Number(e.target.value))} disabled={frozen} />
             )}
             {prashnaType === 'kerala' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                   <input type="number" className="input" placeholder="Ashtamangala" value={ashtamangala} onChange={e => setAshtamangala(e.target.value === '' ? '' : Number(e.target.value))} disabled={frozen} />
                   <input type="number" className="input" placeholder="Thamboola" value={thamboola} onChange={e => setThamboola(e.target.value === '' ? '' : Number(e.target.value))} disabled={frozen} />
                </div>
             )}
          </div>
          <div className="card" style={{ flex: 1, padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--gold-dim)' }}>
             <div>
                <h3 style={{ margin: 0 }}>{prashnaType.toUpperCase()} Prashna</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>{location.name} · {now.toLocaleTimeString()}</p>
             </div>
             <div style={{ display: 'flex', gap: '0.75rem' }}>
                <select className="input" style={{ width: 120 }} value={category} onChange={e => setCategory(e.target.value as QuestionCategory)} disabled={frozen}>
                   <option value="general">General</option>
                   <option value="career">Career</option>
                   <option value="marriage">Marriage</option>
                   <option value="finance">Finance</option>
                </select>
                <button onClick={handleAction} className={`btn ${frozen ? 'btn-secondary' : 'btn-primary'}`}>{frozen ? 'Reset' : 'Analyze Now'}</button>
             </div>
          </div>
          <LocationPicker value={location} onChange={setLocation} label="" />
        </div>

        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center' }}><div className="spin-loader" style={{ margin: '0 auto' }} /><p>Consulting the Oracle...</p></div>
        ) : chart ? (
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '2rem' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
               <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h4 style={{ margin: 0 }}>Prashna Kundali</h4>
                    <div style={{ display: 'flex', gap: '4px' }}>
                       <button onClick={() => setVarga('D1')} className={`btn btn-sm ${varga === 'D1' ? 'btn-primary' : 'btn-ghost'}`}>D1</button>
                       <button onClick={() => setVarga('D9')} className={`btn btn-sm ${varga === 'D9' ? 'btn-primary' : 'btn-ghost'}`}>D9</button>
                    </div>
                  </div>
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
                  />
               </div>
            </div>
            <div style={{ width: isMobile ? '100%' : '380px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
               <div className="card" style={{ textAlign: 'center', border: `2px solid ${analysis?.outcome === 'positive' ? 'var(--teal)' : 'var(--border)'}` }}>
                  <span className="label-caps">Outcome</span>
                  <h2 style={{ color: analysis?.outcome === 'positive' ? 'var(--teal)' : 'var(--gold)' }}>{analysis?.headline}</h2>
                  <p style={{ fontSize: '0.85rem' }}>{analysis?.confidence}% Confidence</p>
               </div>
               <div className="card" style={{ padding: '1rem' }}>
                  <h4 style={{ marginBottom: '0.5rem' }}>Observations</h4>
                  {analysis?.details.map((d, i) => <p key={i} style={{ fontSize: '0.8rem', borderBottom: '1px solid var(--border-soft)', paddingBottom: '0.4rem' }}>• {d}</p>)}
               </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: '4rem', textAlign: 'center', opacity: 0.5 }}>
            <h2 style={{ fontFamily: 'var(--font-display)' }}>🧿 Awaiting the Moment</h2>
            <p>Capturing the celestial signature of your question.</p>
          </div>
        )}
    </div>
  )
}

function evaluateAdvancedPrashna(chart: ChartOutput, seed: number | null, cat: QuestionCategory): PrashnaAnalysis {
  const moon = chart.grahas.find(g => g.id === 'Mo')
  const ascLordId = getHouseLord(chart.lagnas.ascRashi)
  const ascLord = chart.grahas.find(g => g.id === ascLordId)
  
  if (!moon) return { outcome: 'pending', confidence: 0, headline: 'No Data', details: [], significators: [] }

  const moonGood = !moon.isCombust && !['debilitated','enemy'].includes(moon.dignity)
  const lagnaStrong = ascLord && ['own','exalted','friend'].includes(ascLord.dignity)
  
  const TARGET_HOUSES: Record<QuestionCategory, number> = { general: 1, career: 10, marriage: 7, finance: 2, travel: 9, health: 6, education: 4 }
  const houseNum = TARGET_HOUSES[cat]
  const targetSign = ((chart.lagnas.ascRashi + houseNum - 2) % 12 + 1)
  const connected = moon.rashi === targetSign || (ascLord && ascLord.rashi === targetSign)

  let outcome: PrashnaAnalysis['outcome'] = (lagnaStrong && moonGood && connected) ? 'positive' : 'mixed'
  
  return {
    outcome,
    confidence: outcome === 'positive' ? 85 : 50,
    headline: outcome === 'positive' ? 'Auspicious' : 'Moderate Success',
    details: [
      `Lagna Lord ${ascLord?.name} is ${ascLord?.dignity}.`,
      `Moon is in ${moon.nakshatraName} nakshatra.`,
      connected ? "Strong connection to target house significators." : "Indirect connection to target house."
    ],
    significators: [moon.name, ascLord?.name ?? ''],
    direction: 'North'
  }
}

function getHouseLord(sign: number): GrahaId {
  const lords: Record<number, GrahaId> = { 1:'Ma', 2:'Ve', 3:'Me', 4:'Mo', 5:'Su', 6:'Me', 7:'Ve', 8:'Ma', 9:'Ju', 10:'Sa', 11:'Sa', 12:'Ju' }
  return lords[sign]

}
