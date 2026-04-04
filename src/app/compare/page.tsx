'use client'
// src/app/compare/page.tsx — Chart Comparison (synastry)
import { useState } from 'react'
import React from 'react'
import Link from 'next/link'
import { ThemeToggle }   from '@/components/ui/ThemeToggle'
import { BirthForm }     from '@/components/ui/BirthForm'
import { useSession } from 'next-auth/react'
import { VargaSwitcher } from '@/components/chakra/VargaSwitcher'
import { DashaTree }     from '@/components/dasha/DashaTree'
import { AshtakavargaGrid } from '@/components/ui/AshtakavargaGrid'
import { ShadbalaTable } from '@/components/ui/ShadbalaTable'
import { YogaList }      from '@/components/ui/YogaList'
import type { ChartOutput, GrahaData } from '@/types/astrology'
import { RASHI_NAMES } from '@/types/astrology'
import { calculateAshtakoot } from '@/lib/engine/ashtakoot'

// ── Compatibility ─────────────────────────────────────────────
interface CompatItem { label: string; score: number; reason: string }

function signOf(deg: number): number {
  return Math.floor(((deg % 360) + 360) % 360 / 30) + 1
}
function signDiff(a: number, b: number): number {
  const d = Math.abs(a - b); return Math.min(d, 12 - d)
}
function rn(s: number): string {
  return RASHI_NAMES[s as keyof typeof RASHI_NAMES] ?? '—'
}

function getCompatibility(a: ChartOutput, b: ChartOutput): CompatItem[] {
  const items: CompatItem[] = []
  const aM = a.grahas.find((g: GrahaData) => g.id === 'Mo')
  const bM = b.grahas.find((g: GrahaData) => g.id === 'Mo')
  const aV = a.grahas.find((g: GrahaData) => g.id === 'Ve')
  const bV = b.grahas.find((g: GrahaData) => g.id === 'Ve')
  const aJ = a.grahas.find((g: GrahaData) => g.id === 'Ju')
  const bJ = b.grahas.find((g: GrahaData) => g.id === 'Ju')
  const aS = a.grahas.find((g: GrahaData) => g.id === 'Su')
  const bS = b.grahas.find((g: GrahaData) => g.id === 'Su')

  // Moon sign
  if (aM && bM) {
    const mA = signOf(aM.totalDegree), mB = signOf(bM.totalDegree)
    const d = signDiff(mA, mB)
    items.push({ label: 'Moon Sign (Rāśi Maitri)', score: d===0?2:d<=2?1:d===6?-1:d>=5?-1:0, reason: `${rn(mA)} ↔ ${rn(mB)} (${d} signs apart)` })
  }
  // Lagna
  const aA = a.lagnas.ascRashi, bA = b.lagnas.ascRashi
  if (aA && bA) {
    const d = signDiff(aA, bA)
    items.push({ label: 'Ascendant Compatibility', score: d===0?2:d<=2?1:d===6?-1:0, reason: `${rn(aA)} ↔ ${rn(bA)}` })
  }
  // Venus–Moon
  if (aV && bM) {
    const d = signDiff(signOf(aV.totalDegree), signOf(bM.totalDegree))
    if (d <= 2) items.push({ label: "A's Venus ↔ B's Moon", score: 2, reason: `${rn(signOf(aV.totalDegree))} ↔ ${rn(signOf(bM.totalDegree))}` })
  }
  if (bV && aM) {
    const d = signDiff(signOf(bV.totalDegree), signOf(aM.totalDegree))
    if (d <= 2) items.push({ label: "B's Venus ↔ A's Moon", score: 2, reason: `${rn(signOf(bV.totalDegree))} ↔ ${rn(signOf(aM.totalDegree))}` })
  }
  // Jupiter blessings
  if (aJ && bM) {
    const d = signDiff(signOf(aJ.totalDegree), signOf(bM.totalDegree))
    if (d <= 1 || d === 4 || d === 8) items.push({ label: "A's Jupiter blesses B's Moon", score: 1, reason: `${rn(signOf(aJ.totalDegree))} aspects ${rn(signOf(bM.totalDegree))}` })
  }
  if (bJ && aM) {
    const d = signDiff(signOf(bJ.totalDegree), signOf(aM.totalDegree))
    if (d <= 1 || d === 4 || d === 8) items.push({ label: "B's Jupiter blesses A's Moon", score: 1, reason: `${rn(signOf(bJ.totalDegree))} aspects ${rn(signOf(aM.totalDegree))}` })
  }
  // Sun signs
  if (aS && bS) {
    const d = signDiff(signOf(aS.totalDegree), signOf(bS.totalDegree))
    items.push({ label: 'Sun Sign Affinity', score: d===0?1:d<=2?1:d===6?-1:0, reason: `${rn(signOf(aS.totalDegree))} ↔ ${rn(signOf(bS.totalDegree))}` })
  }
  // 7th house
  if (aA) {
    const h7lord = [,'Ma','Ve','Me','Mo','Su','Me','Ve','Ma','Ju','Sa','Sa','Ju'][((aA+5)%12)+1]
    const bMoonS = bM ? signOf(bM.totalDegree) : null
    const lord7 = a.grahas.find((g: GrahaData) => g.id === h7lord)
    if (lord7 && bMoonS) {
      const d = signDiff(signOf(lord7.totalDegree), bMoonS)
      if (d <= 2) items.push({ label: "A's 7th lord near B's Moon", score: 1, reason: `${h7lord} in ${rn(signOf(lord7.totalDegree))}` })
    }
  }
  return items
}

function grade(score: number) {
  if (score >= 6) return { g: 'A', label: 'Excellent',  color: 'var(--teal)' }
  if (score >= 3) return { g: 'B', label: 'Good',       color: 'var(--text-gold)' }
  if (score >= 0) return { g: 'C', label: 'Moderate',   color: 'var(--accent)' }
  return              { g: 'D', label: 'Challenging', color: 'var(--rose)' }
}

function PanchangPanel({ p }: { p: ChartOutput['panchang'] }) {
  const fmtTime = (d: Date | string) =>
    new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

  const items = [
    { label: 'Tithi',     value: p.tithi.name },
    { label: 'Nakshatra', value: p.nakshatra.name },
    { label: 'Yoga',      value: p.yoga.name },
    { label: 'Karana',    value: p.karana.name },
  ]
  const muhurtas = [
    { label: 'Rāhu Kālam',      times: p.rahuKalam,      color: 'var(--rose)',  neutral: false },
    { label: 'Gulikā Kālam',    times: p.gulikaKalam,    color: 'var(--rose)',  neutral: false },
    ...(p.abhijitMuhurta ? [{ label: 'Abhijit Muhūrta', times: p.abhijitMuhurta, color: 'var(--teal)', neutral: true }] : []),
  ]

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ background: 'var(--gradient-dark, linear-gradient(135deg, #4A0E17 0%, #2A0810 100%))', backgroundColor: '#350a11', padding: '1.5rem', borderRadius: 'var(--r-md)', color: '#ffffff', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
          <span style={{ color: 'var(--gold)', filter: 'drop-shadow(0 0 4px rgba(201,168,76,0.5))', fontSize: '1.2rem' }}>☀️</span>
          <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 600, letterSpacing: '0.02em', color: '#fff' }}>Daily Panchang</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {items.map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' }}>
              <span style={{ textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.6)' }}>{label}</span>
              <span style={{ fontWeight: 600, fontSize: '0.95rem', fontFamily: 'Cormorant Garamond, serif', color: 'var(--gold-light, #fde68a)' }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="label-caps" style={{ marginBottom: '0.75rem' }}>Muhūrta Windows</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
          {muhurtas.map(({ label, times, color, neutral }) => (
            <div key={label} style={{ padding: '0.85rem 1rem', background: neutral ? 'rgba(78,205,196,0.06)' : 'rgba(224,123,142,0.06)', border: `1px solid ${neutral ? 'rgba(78,205,196,0.2)' : 'rgba(224,123,142,0.2)'}`, borderRadius: 'var(--r-md)' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color, marginBottom: '0.35rem' }}>{label}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{fmtTime(times.start)} – {fmtTime(times.end)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const GRAHA_ORDER = ['Su','Mo','Ma','Me','Ju','Ve','Sa','Ra','Ke']
const GRAHA_SYM: Record<string,string> = { Su:'☀',Mo:'☽',Ma:'♂',Me:'☿',Ju:'♃',Ve:'♀',Sa:'♄',Ra:'☊',Ke:'☋' }

type View = 'compat' | 'charts' | 'planets' | 'dasha' | 'ashtakavarga' | 'shadbala' | 'yogas' | 'panchang' | 'ashtakoot' | 'all'

export default function ComparePage() {
  const { data: session } = useSession()
  const userPlan = ((session?.user as any)?.plan ?? 'free') as 'free' | 'gold' | 'platinum'
  const [step,   setStep]   = useState<'a'|'b'|'done'>('a')
  const [chartA, setChartA] = useState<ChartOutput|null>(null)
  const [chartB, setChartB] = useState<ChartOutput|null>(null)
  const [view,   setView]   = useState<View>('compat')

  const items = chartA && chartB ? getCompatibility(chartA, chartB) : []
  const total = items.reduce((s,i) => s+i.score, 0)
  const g     = grade(total)

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-page)' }}>
     

      <main style={{ flex: 1, maxWidth: 1100, width: '100%', margin: '0 auto', padding: 'clamp(1rem,3vw,2rem)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* Steps */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {[{s:'a',l:'1. Chart A',done:step!=='a'},{s:'b',l:'2. Chart B',done:step==='done'},{s:'done',l:'3. Result',done:false}].map(({s,l,done},i,arr)=>(
            <React.Fragment key={s}>
              <span style={{ padding:'0.2rem 0.7rem',borderRadius:99,fontSize:'0.75rem',fontWeight:600,fontFamily:'var(--font-display)',background:step===s?'rgba(201,168,76,0.15)':done?'rgba(78,205,196,0.10)':'var(--surface-2)',color:step===s?'var(--text-gold)':done?'var(--teal)':'var(--text-muted)',border:`1px solid ${step===s?'var(--border-bright)':done?'rgba(78,205,196,0.30)':'var(--border)'}`}}>
                {done?'✓ ':''}{l}
              </span>
              {i < arr.length-1 && <div style={{width:20,height:1,background:'var(--border)'}}/>}
            </React.Fragment>
          ))}
        </div>

        {/* Form A */}
        {step === 'a' && (
          <div style={{ maxWidth: 480 }}>
            <h2 style={{ fontFamily:'var(--font-display)',fontSize:'1.1rem',fontWeight:600,color:'var(--text-primary)',marginBottom:'1rem' }}>First person's birth details</h2>
            <div className="card" style={{ padding:'1.5rem' }}>
              <BirthForm onResult={d => { setChartA(d); setStep('b') }} />
            </div>
          </div>
        )}

        {/* Form B */}
        {step === 'b' && chartA && (
          <div style={{ maxWidth: 480 }}>
            <div style={{ marginBottom:'1rem',padding:'0.7rem 1rem',background:'rgba(201,168,76,0.08)',border:'1px solid rgba(201,168,76,0.20)',borderRadius:'var(--r-md)' }}>
              <div style={{ fontSize:'0.65rem',fontWeight:700,letterSpacing:'0.07em',textTransform:'uppercase',color:'var(--text-gold)',fontFamily:'var(--font-display)' }}>Chart A loaded ✓</div>
              <div style={{ fontFamily:'var(--font-display)',fontWeight:600,color:'var(--text-primary)' }}>{chartA.meta.name}</div>
              <div style={{ fontSize:'0.75rem',color:'var(--text-muted)',fontFamily:'var(--font-mono)' }}>{chartA.meta.birthDate} · {chartA.meta.birthPlace}</div>
            </div>
            <h2 style={{ fontFamily:'var(--font-display)',fontSize:'1.1rem',fontWeight:600,color:'var(--text-primary)',marginBottom:'1rem' }}>Second person's birth details</h2>
            <div className="card" style={{ padding:'1.5rem' }}>
              <BirthForm onResult={d => { setChartB(d); setStep('done') }} />
            </div>
          </div>
        )}

        {/* Results */}
        {step === 'done' && chartA && chartB && (
          <div style={{ display:'flex',flexDirection:'column',gap:'1.25rem' }}>

            {/* Score card */}
            <div style={{ display:'flex',gap:'1.5rem',flexWrap:'wrap',alignItems:'center',padding:'1.25rem 1.5rem',background:'var(--surface-1)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)' }}>
              <div style={{ width:72,height:72,borderRadius:'50%',flexShrink:0,background:`${g.color}18`,border:`3px solid ${g.color}`,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center' }}>
                <span style={{ fontFamily:'var(--font-display)',fontSize:'1.6rem',fontWeight:700,color:g.color,lineHeight:1 }}>{g.g}</span>
                <span style={{ fontSize:'0.52rem',color:g.color,fontFamily:'var(--font-display)',fontWeight:700,letterSpacing:'0.05em' }}>{g.label.toUpperCase()}</span>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:'var(--font-display)',fontSize:'1.1rem',fontWeight:600,marginBottom:4 }}>
                  <span style={{ color:'var(--text-gold)' }}>{chartA.meta.name}</span>
                  <span style={{ color:'var(--text-muted)',margin:'0 0.5rem' }}>↔</span>
                  <span style={{ color:'var(--accent)' }}>{chartB.meta.name}</span>
                </div>
                <div style={{ fontSize:'0.78rem',color:'var(--text-muted)',fontFamily:'var(--font-display)',marginBottom:'0.5rem' }}>
                  Compatibility score: <strong style={{ color:g.color }}>{total}</strong> points
                </div>
                <div style={{ height:6,background:'var(--surface-3)',borderRadius:99,overflow:'hidden' }}>
                  <div style={{ height:'100%',width:`${Math.max(0,Math.min(100,((total+6)/12)*100))}%`,background:g.color,borderRadius:99,transition:'width 0.6s' }}/>
                </div>
              </div>
            </div>

            {/* View tabs */}
            <div className="no-print" style={{ display:'flex',gap:'0.4rem',flexWrap:'wrap' }}>
              {([
                ['compat','🔮 Compatibility'],
                ['ashtakoot', '🎎 Aṣṭakūṭa (36 Point)'],
                ['charts','◯ Charts'],
                ['planets','✦ Planet Table'],
                ['dasha', '⏳ Dasha'],
                ['ashtakavarga', '⬡ Ashtakavarga'],
                ['shadbala', '⚖ Shadbala'],
                ['yogas', '✧ Yogas'],
                ['panchang', '📅 Panchang'],
                ['all', '🖨 Show All (for Print)'],
              ] as [View,string][]).map(([id,label])=>(
                <button key={id} onClick={()=>setView(id)} style={{ padding:'0.3rem 0.85rem',background:view===id?'rgba(201,168,76,0.15)':'var(--surface-2)',border:`1px solid ${view===id?'var(--border-bright)':'var(--border)'}`,borderRadius:'var(--r-md)',cursor:'pointer',fontFamily:'var(--font-display)',fontSize:'0.82rem',fontWeight:view===id?700:400,color:view===id?'var(--text-gold)':'var(--text-secondary)' }}>{label}</button>
              ))}
            </div>

            {/* Compatibility */}
            {(view === 'compat' || view === 'all') && (
              <div className="card" style={{ padding:'1.5rem' }}>
                <div className="label-caps" style={{ marginBottom:'1rem' }}>Compatibility Factors</div>
                <div style={{ display:'flex',flexDirection:'column',gap:'0.55rem' }}>
                  {items.map((item,i)=>(
                    <div key={i} style={{ display:'flex',alignItems:'center',gap:'0.75rem',padding:'0.6rem 0.9rem',background:item.score>0?'rgba(78,205,196,0.06)':item.score<0?'rgba(224,123,142,0.06)':'var(--surface-2)',border:`1px solid ${item.score>0?'rgba(78,205,196,0.20)':item.score<0?'rgba(224,123,142,0.20)':'var(--border)'}`,borderRadius:'var(--r-md)' }}>
                      <span style={{ fontSize:'0.9rem',flexShrink:0 }}>{item.score>=2?'⭐':item.score===1?'✓':item.score===0?'○':'✗'}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontFamily:'var(--font-display)',fontSize:'0.85rem',fontWeight:600,color:'var(--text-primary)' }}>{item.label}</div>
                        <div style={{ fontSize:'0.72rem',color:'var(--text-muted)',fontStyle:'italic',fontFamily:'var(--font-display)' }}>{item.reason}</div>
                      </div>
                      <span style={{ fontSize:'0.8rem',fontWeight:700,fontFamily:'var(--font-mono)',color:item.score>0?'var(--teal)':item.score<0?'var(--rose)':'var(--text-muted)',minWidth:24,textAlign:'right' }}>
                        {item.score>0?'+':''}{item.score}
                      </span>
                    </div>
                  ))}
                  {items.length === 0 && <p style={{ color:'var(--text-muted)',fontStyle:'italic',fontFamily:'var(--font-display)' }}>No significant compatibility factors found.</p>}
                </div>
                <p style={{ fontSize:'0.7rem',color:'var(--text-muted)',fontFamily:'var(--font-display)',fontStyle:'italic',marginTop:'1rem',textAlign:'center',borderTop:'1px solid var(--border-soft)',paddingTop:'0.75rem' }}>
                  Per classical Jyotish · Moon sign, Venus–Moon, Jupiter aspects & Lagna compatibility
                </p>
              </div>
            )}

            {/* Ashtakoot */}
            {(view === 'ashtakoot' || view === 'all') && (
              <div className="card fade-up" style={{ padding:'2rem', maxWidth: 1000, margin: '0 auto', width: '100%' }}>
                <div className="label-caps" style={{ marginBottom:'1.5rem', textAlign: 'center', fontSize: '0.8rem' }}>Vedic Matchmaking — 36 Point System</div>
                {(() => {
                  const aMoon = chartA.grahas.find((g: GrahaData) => g.id === 'Mo');
                  const bMoon = chartB.grahas.find((g: GrahaData) => g.id === 'Mo');
                  if (!aMoon || !bMoon) return <p>Moon position missing.</p>;
                  
                  // Nakshatra is 1-indexed (1 to 27)
                  const aNak = Math.floor(aMoon.totalDegree / (360/27)) + 1;
                  const bNak = Math.floor(bMoon.totalDegree / (360/27)) + 1;
                  const aSign = signOf(aMoon.totalDegree);
                  const bSign = signOf(bMoon.totalDegree);
                  
                  const score = calculateAshtakoot(aNak, aSign, bNak, bSign);
                  
                  const rows = [
                    { koota: 'Varṇa', max: 1, p: score.varna.points, b: score.varna.p1, g: score.varna.p2, desc: 'Ego & Work alignment' },
                    { koota: 'Vaśya', max: 2, p: score.vashya.points, b: score.vashya.p1, g: score.vashya.p2, desc: 'Mutual Attraction & Dominance' },
                    { koota: 'Tārā', max: 3, p: score.tara.points, b: score.tara.p1, g: score.tara.p2, desc: 'Health, Destiny & Longevity' },
                    { koota: 'Yoni', max: 4, p: score.yoni.points, b: score.yoni.p1, g: score.yoni.p2, desc: 'Physical Intimacy & Compatibility' },
                    { koota: 'Graha Maitrī', max: 5, p: score.maitri.points, b: `${score.maitri.p1} Lord`, g: `${score.maitri.p2} Lord`, desc: 'Mental & Psychological Bond' },
                    { koota: 'Gaṇa', max: 6, p: score.gana.points, b: score.gana.p1, g: score.gana.p2, desc: 'Temperament & Behavior' },
                    { koota: 'Bhakūṭa', max: 7, p: score.bhakoot.points, b: rn(aSign), g: rn(bSign), desc: 'Love, Family & Growth' },
                    { koota: 'Nāḍī', max: 8, p: score.nadi.points, b: score.nadi.p1, g: score.nadi.p2, desc: 'Genetic Health & Progeny' },
                  ];
                  
                  return (
                    <div>
                      <div style={{ display:'flex', justifyContent:'space-between', fontFamily:'var(--font-display)', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-soft)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>PERSON 1 (Mapped as Boy)</span>
                          <span style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-gold)' }}>{chartA.meta.name}</span>
                          <span style={{ fontSize: '0.85rem' }}>Moon: {rn(aSign)}, Nakshatra: {Math.floor(aMoon.totalDegree / (360/27)) + 1}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', textAlign: 'right' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>PERSON 2 (Mapped as Girl)</span>
                          <span style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--accent)' }}>{chartB.meta.name}</span>
                          <span style={{ fontSize: '0.85rem' }}>Moon: {rn(bSign)}, Nakshatra: {Math.floor(bMoon.totalDegree / (360/27)) + 1}</span>
                        </div>
                      </div>
                      
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ minWidth: 650, width:'100%', borderCollapse:'collapse', fontFamily:'var(--font-mono)', fontSize:'0.85rem' }}>
                          <thead>
                            <tr style={{ borderBottom: '2px solid var(--border)', textAlign:'left' }}>
                              <th style={{ padding:'0.75rem 0.5rem', color: 'var(--text-muted)', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-display)' }}>Kūṭa (Factor)</th>
                              <th style={{ padding:'0.75rem 0.5rem', color: 'var(--text-gold)', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-display)' }}>{chartA.meta.name}</th>
                              <th style={{ padding:'0.75rem 0.5rem', color: 'var(--accent)', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-display)' }}>{chartB.meta.name}</th>
                              <th style={{ padding:'0.75rem 0.5rem', textAlign:'center', color: 'var(--text-muted)', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-display)' }}>Max</th>
                              <th style={{ padding:'0.75rem 0.5rem', textAlign:'right', color: 'var(--text-primary)', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-display)' }}>Score</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rows.map(r => (
                              <tr key={r.koota} style={{ borderBottom:'1px solid var(--border-soft)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                <td style={{ padding:'0.85rem 0.5rem' }}>
                                  <div style={{ color:'var(--text-primary)', fontWeight:600, fontFamily: 'var(--font-display)', fontSize: '1rem' }}>{r.koota}</div>
                                  <div style={{ color:'var(--text-muted)', fontSize: '0.7rem' }}>{r.desc}</div>
                                </td>
                                <td style={{ padding:'0.85rem 0.5rem', color:'var(--text-secondary)' }}>
                                  <span style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)', padding: '0.2rem 0.5rem', borderRadius: '4px', color: 'var(--text-gold)' }}>{r.b}</span>
                                </td>
                                <td style={{ padding:'0.85rem 0.5rem', color:'var(--text-secondary)' }}>
                                  <span style={{ background: 'rgba(78,205,196,0.1)', border: '1px solid rgba(78,205,196,0.2)', padding: '0.2rem 0.5rem', borderRadius: '4px', color: 'var(--accent)' }}>{r.g}</span>
                                </td>
                                <td style={{ padding:'0.85rem 0.5rem', textAlign:'center', color: 'var(--text-muted)' }}>{r.max}</td>
                                <td style={{ padding:'0.85rem 0.5rem', textAlign:'right', color: r.p === 0 ? 'var(--rose)' : r.p === r.max ? 'var(--teal)' : 'var(--text-gold)', fontWeight:700, fontSize: '1.2rem' }}>
                                  {r.p}
                                </td>
                              </tr>
                            ))}
                            <tr style={{ background:'var(--surface-2)', borderTop: '2px solid var(--border)' }}>
                              <td colSpan={3} style={{ padding:'1.2rem 1rem', fontWeight:700, fontFamily:'var(--font-display)', fontSize:'1.25rem', color:'var(--text-primary)' }}>Total Aṣṭakūṭa Score</td>
                              <td style={{ padding:'1.2rem 0.5rem', textAlign:'center', fontWeight:700, color: 'var(--text-muted)' }}>36</td>
                              <td style={{ padding:'1.2rem 1rem', textAlign:'right', fontWeight:700, color: score.total >= 18 ? 'var(--teal)' : 'var(--rose)', fontSize:'1.6rem' }}>{score.total}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      
                      <div style={{ marginTop:'1.5rem', padding: '1rem', background: score.total >= 18 ? 'rgba(78,205,196,0.05)' : 'rgba(224,123,142,0.05)', borderRadius: 'var(--r-md)', border: `1px solid ${score.total >= 18 ? 'rgba(78,205,196,0.2)' : 'rgba(224,123,142,0.2)'}` }}>
                        <p style={{ margin: 0, fontSize:'0.85rem', color: score.total >= 18 ? 'var(--teal)' : 'var(--rose)', textAlign:'center', fontFamily:'var(--font-display)' }}>
                          <strong>{score.total >= 18 ? 'Acceptable Match' : 'Challenging Match'}</strong> · A total score &gt; 18 is traditionally considered acceptable. 
                          <span style={{ display: 'block', marginTop: '0.4rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontStyle: 'italic' }}>* For directional parameters, Person 1 is evaluated as Boy and Person 2 as Girl.</span>
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Compare side-by-side charts */}
            {(view === 'charts' || view === 'all') && (
              <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))',gap:'1.25rem' }}>
                {([{chart:chartA,color:'var(--text-gold)'},{chart:chartB,color:'var(--accent)'}] as {chart:ChartOutput,color:string}[]).map(({chart,color},i)=>(
                  <div key={i}>
                    <div style={{ fontFamily:'var(--font-display)',fontSize:'0.9rem',fontWeight:700,color,marginBottom:'0.5rem',textAlign:'center' }}>
                      {chart.meta.name}
                      <span style={{ fontWeight:400,color:'var(--text-muted)',marginLeft:6,fontSize:'0.72rem' }}>{chart.meta.birthDate}</span>
                    </div>
                    <VargaSwitcher vargas={chart.vargas} vargaLagnas={chart.vargaLagnas??{}} ascRashi={chart.lagnas.ascRashi} lagnas={chart.lagnas} arudhas={chart.arudhas} userPlan={userPlan} direction="column" />
                  </div>
                ))}
              </div>
            )}

            {/* Planet table */}
            {(view === 'planets' || view === 'all') && (
              <div className="card" style={{ padding:'1.5rem',overflowX:'auto' }}>
                <div className="label-caps" style={{ marginBottom:'1rem' }}>Planet Positions</div>
                <table style={{ width:'100%',borderCollapse:'collapse',fontFamily:'var(--font-mono)',fontSize:'0.8rem' }}>
                  <thead>
                    <tr style={{ borderBottom:'1px solid var(--border)' }}>
                      <th style={{ padding:'0.4rem 0.75rem',textAlign:'left',color:'var(--text-muted)',fontSize:'0.65rem',fontFamily:'var(--font-display)',letterSpacing:'0.07em',textTransform:'uppercase' }}>Planet</th>
                      <th style={{ padding:'0.4rem 0.75rem',color:'var(--text-gold)',fontSize:'0.65rem',fontFamily:'var(--font-display)',letterSpacing:'0.07em',textTransform:'uppercase' }}>{chartA.meta.name}</th>
                      <th style={{ padding:'0.4rem 0.75rem',color:'var(--accent)',fontSize:'0.65rem',fontFamily:'var(--font-display)',letterSpacing:'0.07em',textTransform:'uppercase' }}>{chartB.meta.name}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {GRAHA_ORDER.map(id=>{
                      const gA = chartA.grahas.find(g=>g.id===id)
                      const gB = chartB.grahas.find(g=>g.id===id)
                      const sA = gA ? rn(signOf(gA.totalDegree)) : '—'
                      const sB = gB ? rn(signOf(gB.totalDegree)) : '—'
                      const same = gA && gB && signOf(gA.totalDegree) === signOf(gB.totalDegree)
                      return (
                        <tr key={id} style={{ borderBottom:'1px solid var(--border-soft)',background:same?'rgba(201,168,76,0.04)':'transparent' }}>
                          <td style={{ padding:'0.4rem 0.75rem',color:'var(--text-muted)' }}>{GRAHA_SYM[id]} {id}</td>
                          <td style={{ padding:'0.4rem 0.75rem',color:'var(--text-secondary)' }}>{sA} {gA?`${gA.totalDegree.toFixed(1)}°`:''}  {gA?.isRetro?'℞':''}</td>
                          <td style={{ padding:'0.4rem 0.75rem',color:'var(--text-secondary)' }}>{sB} {gB?`${gB.totalDegree.toFixed(1)}°`:''}  {gB?.isRetro?'℞':''} {same?<span style={{color:'var(--text-gold)',fontSize:'0.7rem'}}>● same</span>:null}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Additional Views Grid (Side-by-side components) */}
            {(['dasha', 'ashtakavarga', 'shadbala', 'yogas', 'panchang'].includes(view) || view === 'all') && (
              <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))',gap:'1.25rem' }}>
                {([{chart:chartA,color:'var(--text-gold)'},{chart:chartB,color:'var(--accent)'}] as {chart:ChartOutput,color:string}[]).map(({chart,color},i)=>(
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ fontFamily:'var(--font-display)',fontSize:'0.9rem',fontWeight:700,color,textAlign:'center' }}>
                      {chart.meta.name}
                    </div>

                    {(view === 'dasha' || view === 'all') && (
                      <div className="card" style={{ padding: '1.25rem' }}>
                        <h3 className="label-caps" style={{ marginBottom: '0.75rem', fontSize: '0.65rem' }}>Vimshottari Timeline</h3>
                        <DashaTree nodes={chart.dashas.vimshottari} birthDate={new Date(chart.meta.birthDate)} />
                      </div>
                    )}

                    {(view === 'ashtakavarga' || view === 'all') && (
                      <div className="card fade-up" style={{ padding: '1.25rem' }}>
                        <h3 className="label-caps" style={{ marginBottom: '1rem', fontSize: '0.65rem' }}>Ashtakavarga</h3>
                        {chart.ashtakavarga ? <AshtakavargaGrid ashtakavarga={chart.ashtakavarga} ascRashi={chart.lagnas.ascRashi ?? 1} /> : <p style={{ color:'var(--text-muted)' }}>Unavailable.</p>}
                      </div>
                    )}

                    {(view === 'shadbala' || view === 'all') && (
                      <div className="card fade-up" style={{ padding: '1.25rem' }}>
                        <h3 className="label-caps" style={{ marginBottom: '1rem', fontSize: '0.65rem' }}>Shadbala Strength</h3>
                        {chart.shadbala ? <ShadbalaTable shadbala={chart.shadbala} /> : <p style={{ color:'var(--text-muted)' }}>Unavailable.</p>}
                      </div>
                    )}

                    {(view === 'yogas' || view === 'all') && (
                      <div className="card fade-up" style={{ padding: '1.25rem' }}>
                        <h3 className="label-caps" style={{ marginBottom: '1rem', fontSize: '0.65rem' }}>Graha Yogas</h3>
                        {chart.yogas ? <YogaList yogas={chart.yogas} /> : <p style={{ color:'var(--text-muted)' }}>Unavailable.</p>}
                      </div>
                    )}

                    {(view === 'panchang' || view === 'all') && (
                      <div className="card fade-up" style={{ padding: '1.25rem' }}>
                        <h3 className="label-caps" style={{ marginBottom: '1rem', fontSize: '0.65rem' }}>Natal Panchang</h3>
                        <PanchangPanel p={chart.panchang} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
      <footer style={{ padding:'1rem 2rem',textAlign:'center',color:'var(--text-muted)',fontFamily:'var(--font-display)',fontSize:'0.8rem',borderTop:'1px solid var(--border-soft)' }}>
        Vedic Chart Comparison · <span style={{ color:'var(--text-gold)' }}>Swiss Ephemeris</span>
      </footer>
    </div>
  )
}
