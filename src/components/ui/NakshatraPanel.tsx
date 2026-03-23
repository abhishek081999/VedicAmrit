'use client'
// src/components/ui/NakshatraPanel.tsx
// Full-page Nakshatra workspace: D1 chart (left) + 8-tab analysis (right)

import React, { useState, useMemo } from 'react'
import {
  getNakshatraCharacteristics, getNavtaraChakra, checkPanchaka,
  getGraNakPositions, getNakCompatibility, TARA_QUALITIES, TARA_NAMES,
  NAKSHATRA_GANA, NAKSHATRA_NADI, NAKSHATRA_YONI,
  type TaraName, type NakshatraCharacteristics,
} from '@/lib/engine/nakshatraAdvanced'
import {
  getMonthlyForecast, getNakshatraMuhurtaRating, NAKSHATRA_REMEDIES,
  type DayForecast, type ActivityType,
} from '@/lib/engine/nakshatraRemedies'
import { ChakraSelector } from '@/components/chakra/ChakraSelector'
import { NAKSHATRA_NAMES as NAK_NAMES, GRAHA_NAMES } from '@/types/astrology'
import type { ChartOutput, GrahaId, Rashi } from '@/types/astrology'

// ── helpers ───────────────────────────────────────────────────
const QC = {
  auspicious:   { bg:'rgba(78,205,196,.08)',  border:'rgba(78,205,196,.3)',  text:'var(--teal)' },
  inauspicious: { bg:'rgba(224,123,142,.08)', border:'rgba(224,123,142,.3)', text:'var(--rose)' },
  neutral:      { bg:'rgba(245,158,66,.08)',  border:'rgba(245,158,66,.25)', text:'var(--amber)' },
}
const GANA_COL: Record<string,string> = { Deva:'#818cf8', Manushya:'#34d399', Rakshasa:'#f87171' }
const ICON: Record<string,string> = {
  Su:'☉',Mo:'☽',Ma:'♂',Me:'☿',Ju:'♃',Ve:'♀',Sa:'♄',Ra:'☊',Ke:'☋',Ur:'⛢',Ne:'♆',Pl:'♇',
}
const RATING_COL: Record<string,string> = {
  Excellent:'#4ade80',Good:'#86efac',Neutral:'#fbbf24',Avoid:'#f87171',
}

// ── Sub-tabs ──────────────────────────────────────────────────
type SubTab='overview'|'navtara'|'bestdays'|'muhurta'|'panchaka'|'planet'|'compat'|'remedies'
const TABS: {id:SubTab;label:string;icon:string}[] = [
  {id:'navtara',  label:'Navtara',    icon:'🔯'},
  {id:'bestdays', label:'Best Days',  icon:'📅'},
  {id:'muhurta',  label:'Muhurta',    icon:'⚡'},
  {id:'panchaka', label:'Panchaka',   icon:'🔥'},
  {id:'planet',   label:'Planet',     icon:'✦'},
  {id:'compat',   label:'Compat',     icon:'🔗'},
  {id:'remedies', label:'Remedies',   icon:'🙏'},
]

// ── Main ─────────────────────────────────────────────────────
export function NakshatraPanel({ chart, initialTab = 'navtara' }: { chart: ChartOutput; initialTab?: SubTab }) {
  const [subTab, setSubTab] = useState<SubTab>(initialTab === 'overview' ? 'navtara' : initialTab)

  React.useEffect(() => {
    if (initialTab) {
      setSubTab(initialTab === 'overview' ? 'navtara' : initialTab)
    }
  }, [initialTab])

  const moon = chart.grahas.find(g => g.id === 'Mo')
  const birthNakIdx = moon?.nakshatraIndex ?? 0
  const birthNakPada = moon?.pada ?? 1
  const moonLon = moon?.lonSidereal ?? 0

  const chars    = useMemo(() => getNakshatraCharacteristics(birthNakIdx, birthNakPada), [birthNakIdx, birthNakPada])
  const navtara  = useMemo(() => getNavtaraChakra(birthNakIdx), [birthNakIdx])

  const planetPos = useMemo(() => {
    // 9 planets
    const base = getGraNakPositions(chart.grahas.filter(g=>!['Ur','Ne','Pl'].includes(g.id)))
    // Lagna manual calculation
    const ascDeg = chart.lagnas.ascDegree
    const lagNakIdx = Math.floor(ascDeg / (360/27))
    const lagNakPada = Math.floor(((ascDeg % (360/27)) / (360/27)) * 4) + 1
    const lagChars = getNakshatraCharacteristics(lagNakIdx, lagNakPada)
    
    const lagPosition = {
      grahaId: 'As' as any,
      grahaName: 'Lagna',
      nakshatraIndex: lagNakIdx,
      nakshatraName: NAK_NAMES[lagNakIdx],
      pada: lagNakPada,
      lord: lagChars.lord,
      gana: lagChars.gana,
      degree: ascDeg,
      panchaka: checkPanchaka(lagNakIdx).panchaka
    }
    
    return [lagPosition, ...base]
  }, [chart.grahas, chart.lagnas])

  const remedy   = NAKSHATRA_REMEDIES[birthNakIdx]

  // D1 chart props
  const d1Grahas   = chart.vargas?.D1 ?? chart.grahas
  const ascRashi   = chart.lagnas.ascRashi as Rashi
  const moonNakIdx = moon?.nakshatraIndex ?? 0
  const tithiNum   = chart.panchang.tithi.number
  const varaNum    = chart.panchang.vara.number

  return (
    <div style={{display:'flex',flexDirection:'column',gap:'1.5rem'}}>

      {/* ── Header strip ── */}
      <div style={{display:'flex',alignItems:'center',gap:'1rem',flexWrap:'wrap',padding:'1rem 1.25rem',background:'linear-gradient(135deg,rgba(139,124,246,.12) 0%,rgba(201,168,76,.08) 100%)',border:'1px solid rgba(139,124,246,.2)',borderRadius:'var(--r-md)'}}>
        <div style={{width:52,height:52,borderRadius:'50%',background:'radial-gradient(circle,rgba(139,124,246,.35) 0%,transparent 70%)',border:'1px solid rgba(139,124,246,.4)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.75rem',flexShrink:0}}>🌙</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontFamily:'var(--font-display)',fontSize:'1.6rem',fontWeight:600,color:'var(--text-primary)',lineHeight:1}}>Nakshatra Workspace</div>
          <div style={{fontSize:'0.75rem',color:'var(--text-muted)',marginTop:4,display:'flex',gap:'1rem',flexWrap:'wrap'}}>
            <span>Birth Moon · <strong style={{color:'var(--gold)'}}>{chars.name}</strong> Pada {chars.pada}</span>
            <span>Lord · <strong style={{color:'var(--text-gold)'}}>{GRAHA_NAMES[chars.lord]}</strong></span>
            <span>Gana · <strong style={{color:GANA_COL[chars.gana]}}>{chars.gana}</strong></span>
            <span>Deity · <strong style={{color:'#c084fc'}}>{chars.deity}</strong></span>
          </div>
        </div>
      </div>

      {/* ── Two-column layout: chart + permanent overview ── */}
      <div style={{display:'flex',gap:'1.5rem',alignItems:'flex-start',flexWrap:'wrap'}}>

        {/* LEFT: D1 Chart */}
        <div style={{ flex: '1 1 480px', maxWidth: '520px', display: 'flex', justifyContent: 'center' }}>
          <div className="card" style={{ padding: '1rem', width: '100%' }}>
            <div style={{fontSize:'0.62rem',textTransform:'uppercase',letterSpacing:'0.1em',color:'var(--text-muted)',marginBottom:'0.6rem'}}>
              D1 · Rashi Chart — Janma Lagna
            </div>
            <ChakraSelector
              ascRashi={ascRashi}
              grahas={d1Grahas}
              moonNakIndex={moonNakIdx}
              arudhas={chart.arudhas}
              tithiNumber={tithiNum}
              varaNumber={varaNum}
              defaultStyle="north"
              size={360} 
            />
            {/* Quick nakshatra badge */}
            <div style={{marginTop:'0.75rem',padding:'0.6rem',background:'var(--surface-2)',borderRadius:'var(--r-sm)',fontSize:'0.72rem',color:'var(--text-muted)',lineHeight:1.6}}>
              <span style={{color:'var(--gold)',fontWeight:600}}>Moon</span> in {chars.name} Pada {chars.pada} · 
              <span style={{color:'#818cf8',marginLeft:4}}>Nakshatra Lord: {GRAHA_NAMES[chars.lord]}</span>
            </div>
          </div>
        </div>

        {/* RIGHT: Permanent Overview Analysis + Tabs */}
        <div style={{flex:'1 1 400px',width: '100%', minWidth:320,display:'flex',flexDirection:'column',gap:'1.25rem'}}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
             <div className="label-caps" style={{ fontSize: '0.65rem', color: 'var(--text-gold)', marginBottom: '0.25rem' }}>Janma Nakshatra Overview</div>
             <OverviewTab chars={chars} />
          </div>

          <div style={{ height: '1px', background: 'var(--border-soft)', margin: '0.5rem 0' }} />

          {/* BOTTOM: Analysis Tabs (Dynamic content) */}
          <div style={{display:'flex',flexDirection:'column',gap:'1.25rem'}}>
            {/* Sub-tab bar */}
            <div className="mobile-tab-scroll" style={{display:'flex',gap:'3px',flexWrap:'nowrap',background:'var(--surface-3)',borderRadius:'var(--r-md)',padding:'4px',border:'1px solid var(--border-soft)', overflowX: 'auto'}}>
              {TABS.map(t=>(
                <button key={t.id} onClick={()=>setSubTab(t.id)} style={{
                  flex:'1 1 auto',padding:'0.42rem 0.5rem',
                  background:subTab===t.id?'var(--surface-1)':'transparent',
                  border:'none',borderRadius:'calc(var(--r-md) - 2px)',cursor:'pointer',
                  color:subTab===t.id?'var(--text-gold)':'var(--text-muted)',
                  fontWeight:subTab===t.id?700:400,fontSize:'0.7rem',
                  boxShadow:subTab===t.id?'0 2px 8px rgba(0,0,0,.2)':'none',
                  transition:'all 0.2s',display:'flex',alignItems:'center',justifyContent:'center',gap:'0.25rem',
                }}>
                  <span>{t.icon}</span><span style={{whiteSpace:'nowrap'}}>{t.label}</span>
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
              {subTab==='navtara'   && <NavtaraTab navtara={navtara} birthNakIdx={birthNakIdx} />}
              {subTab==='bestdays'  && <BestDaysTab birthNakIdx={birthNakIdx} moonLon={moonLon} />}
              {subTab==='muhurta'   && <MuhurtaTab nakIdx={birthNakIdx} />}
              {subTab==='panchaka'  && <PanchakaTab grahas={chart.grahas} />}
              {subTab==='planet'    && <PlanetTab positions={planetPos} moonNakIdx={birthNakIdx} />}
              {subTab==='compat'    && <CompatTab birthNakIdx={birthNakIdx} />}
              {subTab==='remedies'  && <RemediesTab remedy={remedy} nakIdx={birthNakIdx} />}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

// ── Overview ─────────────────────────────────────────────────
function OverviewTab({ chars }: { chars: NakshatraCharacteristics }) {
  const rows=[
    {label:'Deity',value:chars.deity,icon:'🙏',color:'#c084fc'},
    {label:'Gana',value:chars.gana,icon:'⚡',color:GANA_COL[chars.gana]},
    {label:'Yoni',value:chars.yoni,icon:'🐾',color:'var(--text-secondary)'},
    {label:'Varna',value:chars.varna,icon:'👑',color:'var(--text-secondary)'},
    {label:'Nature',value:chars.nature,icon:'🌿',color:'var(--text-secondary)'},
    {label:'Body Part',value:chars.bodyPart,icon:'🫀',color:'var(--text-secondary)'},
    {label:'Symbol',value:chars.symbol,icon:'✦',color:'var(--gold)'},
  ]
  return (
    <div style={{display:'flex',flexDirection:'column',gap:'0.875rem'}}>
      <div style={{padding:'1rem 1.125rem',background:'linear-gradient(135deg,rgba(139,124,246,.12),rgba(201,168,76,.08))',border:'1px solid rgba(139,124,246,.25)',borderRadius:'var(--r-md)'}}>
        <div style={{fontSize:'0.6rem',textTransform:'uppercase',letterSpacing:'0.1em',color:'var(--text-muted)',marginBottom:'0.35rem'}}>Shakti — Primordial Power</div>
        <div style={{fontFamily:'var(--font-display)',fontSize:'0.95rem',color:'var(--text-primary)',lineHeight:1.55,fontStyle:'italic'}}>"{chars.shakti}"</div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.55rem'}}>
        {rows.map(({label,value,icon,color})=>(
          <div key={label} style={{padding:'0.7rem',background:'var(--surface-2)',border:'1px solid var(--border-soft)',borderRadius:'var(--r-md)',transition:'border-color .2s'}}
            onMouseEnter={e=>e.currentTarget.style.borderColor='var(--border-bright)'}
            onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border-soft)'}>
            <div style={{fontSize:'0.58rem',textTransform:'uppercase',letterSpacing:'.1em',color:'var(--text-muted)',marginBottom:'0.2rem'}}>{icon} {label}</div>
            <div style={{fontFamily:'var(--font-display)',fontSize:'0.9rem',color,fontWeight:500}}>{value}</div>
          </div>
        ))}
      </div>
      {/* Pada map */}
      <PadaMap nakIdx={chars.index} pada={chars.pada} />
    </div>
  )
}

function PadaMap({nakIdx,pada}:{nakIdx:number;pada:number}) {
  const SIGNS=['Ar','Ta','Ge','Cn','Le','Vi','Li','Sc','Sg','Cp','Aq','Pi']
  const STARTS: Record<number,number>={0:0,1:0,2:1,3:1,4:2,5:2,6:3,7:3,8:4,9:5,10:5,11:6,12:7,13:7,14:8,15:9,16:9,17:10,18:11,19:11,20:0,21:1,22:2,23:2,24:3,25:4,26:4}
  return (
    <div style={{display:'flex',gap:'0.5rem',padding:'0.75rem',background:'var(--gold-faint)',border:'1px solid var(--border)',borderRadius:'var(--r-md)'}}>
      {[1,2,3,4].map(p=>(
        <div key={p} style={{flex:1,textAlign:'center',opacity:p===pada?1:0.4}}>
          <div style={{fontSize:'0.58rem',color:'var(--text-muted)',marginBottom:'0.2rem'}}>Pada {p}</div>
          <div style={{fontFamily:'var(--font-display)',fontSize:'0.9rem',color:p===pada?'var(--text-gold)':'var(--text-primary)',fontWeight:p===pada?700:400}}>
            {SIGNS[((STARTS[nakIdx]??0)+p-1)%12]}
          </div>
          {p===pada&&<div style={{width:4,height:4,borderRadius:'50%',background:'var(--gold)',margin:'0.3rem auto 0'}}/>}
        </div>
      ))}
    </div>
  )
}

// ── Navtara ───────────────────────────────────────────────────
function NavtaraTab({navtara,birthNakIdx}:{navtara:ReturnType<typeof getNavtaraChakra>;birthNakIdx:number}) {
  const groups = useMemo(()=>{
    const g: Record<string,typeof navtara>={}
    navtara.forEach(n=>{if(!g[n.tara])g[n.tara]=[]; g[n.tara].push(n)})
    return g
  },[navtara])
  return (
    <div style={{display:'flex',flexDirection:'column',gap:'0.55rem'}}>
      <p style={{fontSize:'0.75rem',color:'var(--text-muted)',fontStyle:'italic',margin:0,lineHeight:1.6}}>All 27 Nakshatras categorised into 9 Tara groups from birth Nakshatra ({NAK_NAMES[birthNakIdx]}).</p>
      {(TARA_NAMES as TaraName[]).map((tara,idx)=>{
        const group=groups[tara]||[]
        const q=TARA_QUALITIES[tara]
        const c=QC[q.quality]
        return (
          <div key={tara} style={{padding:'0.75rem',background:c.bg,border:`1px solid ${c.border}`,borderRadius:'var(--r-md)',display:'flex',gap:'0.75rem',alignItems:'flex-start'}}>
            <div style={{width:24,height:24,borderRadius:'50%',background:c.border,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.65rem',fontWeight:700,flexShrink:0,color:'var(--text-primary)'}}>{idx+1}</div>
            <div style={{flex:1}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.25rem',flexWrap:'wrap',gap:'0.3rem'}}>
                <span style={{fontFamily:'var(--font-display)',fontWeight:600,fontSize:'0.95rem',color:c.text}}>{tara} Tara</span>
                <span style={{fontSize:'0.55rem',textTransform:'uppercase',letterSpacing:'.1em',padding:'2px 6px',borderRadius:4,background:c.border,color:c.text,fontWeight:700}}>{q.quality}</span>
              </div>
              <div style={{display:'flex',gap:'0.3rem',flexWrap:'wrap',marginBottom:'0.3rem'}}>
                {group.map(n=>(
                  <span key={n.nakshatraIndex} style={{fontSize:'0.68rem',padding:'2px 7px',background:'var(--surface-2)',borderRadius:20,color:'var(--text-primary)',border:'1px solid var(--border-soft)',fontWeight:n.nakshatraIndex===birthNakIdx?700:400}}>
                    {n.nakshatraIndex===birthNakIdx&&'★ '}{n.nakshatraName}
                  </span>
                ))}
              </div>
              <div style={{fontSize:'0.7rem',color:'var(--text-muted)',lineHeight:1.5}}>{q.recommendation}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Best Days ─────────────────────────────────────────────────
function BestDaysTab({birthNakIdx,moonLon}:{birthNakIdx:number;moonLon:number}) {
  const now = new Date()
  const [month,setMonth] = useState(now.getMonth()+1)
  const [year,setYear]   = useState(now.getFullYear())

  const days = useMemo(()=>getMonthlyForecast(birthNakIdx,moonLon,year,month),[birthNakIdx,moonLon,year,month])
  const top5 = useMemo(()=>[...days].sort((a,b)=>b.score-a.score).slice(0,5),[days])

  const MONTHS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const col=(q:'auspicious'|'inauspicious'|'neutral')=>QC[q]

  return (
    <div style={{display:'flex',flexDirection:'column',gap:'1.5rem'}}>
      {/* Month Header & selector */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'1rem',paddingBottom:'1rem',borderBottom:'1px solid var(--border-soft)'}}>
        <div style={{display:'flex',flexDirection:'column'}}>
           <h3 style={{fontFamily:'var(--font-display)',fontSize:'1.3rem',margin:0,color:'var(--text-gold)'}}>Monthly Forecast</h3>
           <span style={{fontSize:'0.65rem',color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'.1em'}}>Best Days for {MONTHS[month-1]} {year}</span>
        </div>
        <div style={{display:'flex',gap:'0.4rem',alignItems:'center'}}>
          <select value={month} onChange={e=>setMonth(Number(e.target.value))} style={{padding:'0.5rem 0.75rem',background:'var(--surface-3)',border:'1px solid var(--border)',borderRadius:'var(--r-md)',color:'var(--text-primary)',fontSize:'0.82rem',cursor:'pointer',outline:'none'}}>
            {MONTHS.map((m,i)=><option key={i} value={i+1}>{m}</option>)}
          </select>
          <select value={year} onChange={e=>setYear(Number(e.target.value))} style={{padding:'0.5rem 0.75rem',background:'var(--surface-3)',border:'1px solid var(--border)',borderRadius:'var(--r-md)',color:'var(--text-primary)',fontSize:'0.82rem',cursor:'pointer',outline:'none'}}>
            {[2024,2025,2026,2027,2028].map(y=><option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Top 3 best highlight */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:'0.75rem'}}>
        {top5.slice(0,3).map((d,i)=>{
          const c=col(d.quality)
          return (
            <div key={d.dayOfMonth} style={{padding:'1rem',background:'var(--surface-2)',border:`1px solid ${c.border}`,borderRadius:'var(--r-md)',position:'relative',overflow:'hidden'}}>
               <div style={{position:'absolute',top:'-10px',right:'-10px',fontSize:'3.5rem',opacity:0.05,color:c.text}}>{i+1}</div>
               <div style={{fontSize:'0.65rem',color:'var(--text-muted)',marginBottom:'0.25rem'}}>{d.dayName}</div>
               <div style={{fontSize:'1.5rem',fontWeight:800,color:c.text,fontFamily:'var(--font-display)'}}>{d.dayOfMonth}</div>
               <div style={{fontSize:'0.75rem',fontWeight:600,color:'var(--text-primary)',marginTop:4}}>{d.nakshatra}</div>
               <div style={{fontSize:'0.58rem',color:c.text,fontWeight:600,textTransform:'uppercase',marginTop:2}}>{d.tara} Tara</div>
            </div>
          )
        })}
      </div>

      {/* Month calendar grid */}
      <div style={{padding:'1rem',background:'var(--surface-2)',borderRadius:'var(--r-lg)',border:'1px solid var(--border-soft)'}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:'8px'}}>
          {['SUN','MON','TUE','WED','THU','FRI','SAT'].map((d,i)=><div key={i} style={{textAlign:'center',fontSize:'0.6rem',color:'var(--text-muted)',padding:'5px 0',fontWeight:700,letterSpacing:'.05em'}}>{d}</div>)}
          {Array.from({length:days[0]?.date.getDay()??0}).map((_,i)=><div key={`e${i}`}/>)}
          {days.map(d=>{
            const c=col(d.quality)
            const isToday=d.date.toDateString()===new Date().toDateString()
            return (
              <div key={d.dayOfMonth} title={`${d.dayName}: ${d.nakshatra} — ${d.tara}`} style={{
                aspectRatio:'1',borderRadius:10,background:c.bg,
                border:`1px solid ${isToday?'var(--gold)':c.border}`,
                display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
                cursor:'pointer',transition:'all .2s cubic-bezier(0.16, 1, 0.3, 1)',position:'relative',
                boxShadow:'0 2px 4px rgba(0,0,0,0.05)'
              }}
                onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 8px 16px rgba(0,0,0,0.1)'}}
                onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 2px 4px rgba(0,0,0,0.05)'}}>
                <div style={{fontSize:'1.1rem',fontWeight:800,color:c.text,fontFamily:'var(--font-display)'}}>{d.dayOfMonth}</div>
                <div style={{fontSize:'0.62rem',color:'var(--text-muted)',fontWeight:600,textAlign:'center',marginTop:2,lineHeight:1}}>{d.tara.toUpperCase().slice(0,4)}</div>
                {d.panchaka && <div style={{position:'absolute',top:4,right:4,width:6,height:6,borderRadius:'50%',background:'#f87171',boxShadow:'0 0 5px #f87171'}} />}
                {isToday && <div style={{position:'absolute',bottom:4,fontSize:'0.75rem',color:'var(--gold)'}}>✦</div>}
              </div>
            )
          })}
        </div>
        <div style={{display:'flex',gap:'1.25rem',marginTop:'1.25rem',justifyContent:'center',paddingTop:'1rem',borderTop:'1px solid var(--border-soft)'}}>
          {(['auspicious','neutral','inauspicious'] as const).map(q=>(
            <div key={q} style={{display:'flex',alignItems:'center',gap:'0.4rem',fontSize:'0.75rem',color:'var(--text-secondary)'}}>
              <div style={{width:10,height:10,borderRadius:3,background:QC[q].bg,border:`1px solid ${QC[q].border}`}}/>
              <span style={{textTransform:'capitalize',fontWeight:500}}>{q}</span>
            </div>
          ))}
          <div style={{display:'flex',alignItems:'center',gap:'0.4rem',fontSize:'0.75rem',color:'var(--text-secondary)'}}>
            <div style={{width:8,height:8,borderRadius:'50%',background:'#f87171'}}/>
            <span style={{fontWeight:500}}>Panchaka</span>
          </div>
        </div>
      </div>

      <div style={{padding:'1rem',background:'var(--surface-3)',border:'1px solid var(--border-bright)',borderRadius:'var(--r-md)',fontSize:'0.82rem',color:'var(--text-primary)',lineHeight:1.6,borderLeft:'4px solid var(--gold)'}}>
        <div style={{display:'flex',alignItems:'center',gap:'0.5rem',marginBottom:'0.5rem'}}>
          <span style={{fontSize:'1.1rem'}}>💡</span>
          <strong style={{color:'var(--text-gold)'}}>Planning Strategy:</strong>
        </div>
        Plan major activities like <span style={{color:'var(--teal)',fontWeight:600}}>business launches</span> and <span style={{color:'var(--teal)',fontWeight:600}}>travel</span> on <span style={{color:'var(--gold)',fontWeight:700}}>Auspicious</span> days. 
        Avoid signing critical legal documents or major medical visits during <span style={{color:'var(--rose)',fontWeight:600}}>Inauspicious</span> or <span style={{color:'var(--rose)',fontWeight:600}}>Panchaka</span> periods.
      </div>
    </div>
  )
}

// ── Muhurta ───────────────────────────────────────────────────
const ACTIVITIES: {id:ActivityType;label:string;icon:string}[] = [
  {id:'marriage',  label:'Marriage',   icon:'💍'},
  {id:'travel',    label:'Travel',     icon:'✈️'},
  {id:'business',  label:'Business',   icon:'💼'},
  {id:'education', label:'Education',  icon:'📚'},
  {id:'medical',   label:'Medical',    icon:'🏥'},
  {id:'spiritual', label:'Spiritual',  icon:'🕉️'},
  {id:'property',  label:'Property',   icon:'🏠'},
  {id:'career',    label:'Career',     icon:'🎯'},
  {id:'finance',   label:'Finance',    icon:'💰'},
]

function MuhurtaTab({nakIdx}:{nakIdx:number}) {
  const ratings = useMemo(()=>ACTIVITIES.map(a=>({...a, ...getNakshatraMuhurtaRating(nakIdx,a.id)})),[nakIdx])
  return (
    <div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
      <p style={{fontSize:'0.75rem',color:'var(--text-muted)',fontStyle:'italic',margin:0,lineHeight:1.6}}>Muhurta suitability of your birth Nakshatra ({NAK_NAMES[nakIdx]}) for various life activities.</p>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.55rem'}}>
        {ratings.map(r=>(
          <div key={r.id} style={{padding:'0.75rem',background:'var(--surface-2)',border:`1px solid var(--border-soft)`,borderRadius:'var(--r-md)',transition:'all .2s'}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=RATING_COL[r.rating]+'66'; e.currentTarget.style.transform='translateY(-2px)'}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border-soft)'; e.currentTarget.style.transform='translateY(0)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.35rem'}}>
              <span style={{fontSize:'0.88rem'}}>{r.icon}</span>
              <span style={{fontSize:'0.58rem',fontWeight:700,padding:'2px 7px',borderRadius:20,background:RATING_COL[r.rating]+'22',color:RATING_COL[r.rating],border:`1px solid ${RATING_COL[r.rating]}55`,textTransform:'uppercase',letterSpacing:'.08em'}}>{r.rating}</span>
            </div>
            <div style={{fontWeight:600,color:'var(--text-primary)',fontSize:'0.8rem',marginBottom:'0.25rem'}}>{r.label}</div>
            <div style={{fontSize:'0.65rem',color:'var(--text-muted)',lineHeight:1.5}}>{r.note}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Panchaka ─────────────────────────────────────────────────
function PanchakaTab({grahas}:{grahas:ChartOutput['grahas']}) {
  const panchaka = useMemo(()=>grahas.map(g=>({graha:g.id,name:g.name,...checkPanchaka(g.nakshatraIndex)})),[grahas])
  const allNaks  = useMemo(()=>NAK_NAMES.map((_,i)=>checkPanchaka(i)),[])
  return (
    <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
      <p style={{fontSize:'0.75rem',color:'var(--text-muted)',fontStyle:'italic',margin:0,lineHeight:1.6}}>Panchaka Dosha — Moon transiting the last 5 Nakshatras (Dhanishtha→Revati) creates specific inauspicious energies.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'0.45rem'}}>
        {panchaka.map(p=>{
          if(!p.panchaka)return null
          return (
            <div key={p.graha} style={{padding:'0.75rem',background:'rgba(239,68,68,.07)',border:'1px solid rgba(239,68,68,.25)',borderRadius:'var(--r-md)',display:'flex',gap:'0.65rem',alignItems:'flex-start'}}>
              <span style={{fontSize:'1.2rem'}}>{ICON[p.graha]}</span>
              <div>
                <div style={{fontWeight:600,fontSize:'0.85rem',color:'var(--text-primary)'}}>{p.name} in {p.nakshatraName}</div>
                <div style={{fontSize:'0.7rem',color:'#f87171',fontWeight:700,marginTop:2}}>{p.panchaka}</div>
                <div style={{fontSize:'0.68rem',color:'var(--text-muted)',marginTop:3,lineHeight:1.5}}>{p.description}</div>
              </div>
            </div>
          )
        })}
        {panchaka.every(p=>!p.panchaka)&&<div style={{padding:'1rem',background:'rgba(34,197,94,.07)',border:'1px solid rgba(34,197,94,.2)',borderRadius:'var(--r-md)',color:'#4ade80',fontSize:'0.85rem',textAlign:'center'}}>✓ No planets in Panchaka zone at birth</div>}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))',gap:'0.4rem'}}>
        {allNaks.map((n,i)=>{
          const hp=panchaka.find(p=>p.nakshatraIndex===i)
          return (
            <div key={i} style={{padding:'0.45rem 0.6rem',background:n.panchaka?'rgba(239,68,68,.07)':'var(--surface-2)',border:`1px solid ${n.panchaka?'rgba(239,68,68,.25)':'var(--border-soft)'}`,borderRadius:'var(--r-sm)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <div style={{fontSize:'0.7rem',color:'var(--text-primary)',fontWeight:hp?700:400}}>{n.nakshatraName.split(' ')[0]}</div>
                {n.panchaka&&<div style={{fontSize:'0.55rem',color:'#f87171',fontWeight:600}}>{n.panchaka.replace(' Panchaka','')}</div>}
              </div>
              {hp&&<span style={{fontSize:'0.85rem'}}>{ICON[hp.graha]}</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Planet Nakshatras ─────────────────────────────────────────
function PlanetTab({positions, moonNakIdx}:{positions:any[], moonNakIdx:number}) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
      <p style={{fontSize:'0.75rem',color:'var(--text-muted)',fontStyle:'italic',margin:0}}>Graha Nakshatras — Planet positions with their Pada and Navtara relative to Birth Moon ({NAK_NAMES[moonNakIdx]}).</p>
      <div style={{ overflowX: 'auto', border: '1px solid var(--border-soft)', borderRadius: 'var(--r-md)', background: 'var(--surface-1)' }}>
        <table style={{width:'100%', minWidth: '500px', borderCollapse:'collapse',fontSize:'0.75rem',color:'var(--text-secondary)'}}>
          <thead>
            <tr>{['Planet','Nakshatra','Pada','Lord','Navtara','Gana'].map(c=><th key={c} style={{padding:'0.45rem 0.6rem',textAlign:'left',fontSize:'0.58rem',textTransform:'uppercase',letterSpacing:'.1em',color:'var(--text-muted)',borderBottom:'1px solid var(--border)',whiteSpace:'nowrap'}}>{c}</th>)}</tr>
          </thead>
          <tbody>
            {positions.map((p,i)=>{
              const taraIdx = (p.nakshatraIndex - moonNakIdx + 27) % 9
              const taraName = TARA_NAMES[taraIdx]
              const q = TARA_QUALITIES[taraName].quality
              return (
                <tr key={p.grahaId} style={{background:i%2===0?'transparent':'rgba(255,255,255,.02)'}}>
                  <td style={{padding:'0.5rem 0.6rem',borderBottom:'1px solid var(--border-soft)'}}><div style={{display:'flex',alignItems:'center',gap:'0.35rem'}}><span>{p.grahaId==='As'?'Asc':ICON[p.grahaId]}</span><span style={{fontWeight:600,color:'var(--text-primary)'}}>{p.grahaName}</span></div></td>
                  <td style={{padding:'0.5rem 0.6rem',borderBottom:'1px solid var(--border-soft)',color:'var(--text-primary)'}}>{p.nakshatraName}</td>
                  <td style={{padding:'0.5rem 0.6rem',borderBottom:'1px solid var(--border-soft)'}}>{p.pada}</td>
                  <td style={{padding:'0.5rem 0.6rem',borderBottom:'1px solid var(--border-soft)',color:'var(--text-gold)'}}>{GRAHA_NAMES[p.lord as GrahaId] || '—'}</td>
                  <td style={{padding:'0.5rem 0.6rem',borderBottom:'1px solid var(--border-soft)'}}>
                    <span style={{color:QC[q].text,fontWeight:600}}>{taraName}</span>
                  </td>
                  <td style={{padding:'0.5rem 0.6rem',borderBottom:'1px solid var(--border-soft)'}}><span style={{color:GANA_COL[p.gana],fontWeight:600}}>{p.gana}</span></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Compatibility ─────────────────────────────────────────────
function CompatTab({birthNakIdx}:{birthNakIdx:number}) {
  const [cmp,setCmp]=useState(0)
  const compat=useMemo(()=>getNakCompatibility(birthNakIdx,cmp),[birthNakIdx,cmp])
  const SC: Record<string,string>={Excellent:'#4ade80',Good:'#86efac',Average:'#fbbf24',Poor:'#f97316',Incompatible:'#f87171'}
  const miniGrid=useMemo(()=>NAK_NAMES.map((_,i)=>({idx:i,...getNakCompatibility(birthNakIdx,i)})),[birthNakIdx])
  return (
    <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr auto 1fr',gap:'0.65rem',alignItems:'center'}}>
        <div style={{padding:'0.65rem',background:'var(--gold-faint)',border:'1px solid var(--border-bright)',borderRadius:'var(--r-md)',textAlign:'center'}}>
          <div style={{fontSize:'0.58rem',color:'var(--text-muted)',marginBottom:'0.15rem'}}>Birth Nakshatra</div>
          <div style={{fontFamily:'var(--font-display)',fontWeight:600,color:'var(--text-gold)',fontSize:'0.9rem'}}>{NAK_NAMES[birthNakIdx]}</div>
        </div>
        <div style={{fontSize:'1.1rem',color:'var(--text-muted)'}}>↔</div>
        <select value={cmp} onChange={e=>setCmp(Number(e.target.value))} style={{padding:'0.6rem 0.7rem',background:'var(--surface-2)',border:'1px solid var(--border)',borderRadius:'var(--r-md)',color:'var(--text-primary)',fontFamily:'var(--font-display)',fontSize:'0.85rem',cursor:'pointer'}}>
          {NAK_NAMES.map((n,i)=><option key={i} value={i}>{n}</option>)}
        </select>
      </div>
      <div style={{padding:'1.1rem',background:'var(--surface-2)',border:'1px solid var(--border)',borderRadius:'var(--r-md)'}}>
        <div style={{textAlign:'center',marginBottom:'1rem'}}>
          <div style={{fontSize:'2.5rem',fontWeight:800,fontFamily:'var(--font-display)',color:SC[compat.summary],textShadow:`0 0 20px ${SC[compat.summary]}44`}}>{compat.score}%</div>
          <div style={{fontWeight:600,color:SC[compat.summary],fontSize:'0.95rem'}}>{compat.summary}</div>
        </div>
        <div style={{height:5,background:'var(--surface-3)',borderRadius:3,overflow:'hidden',marginBottom:'1rem'}}>
          <div style={{height:'100%',width:`${compat.score}%`,background:`linear-gradient(90deg,${SC[compat.summary]},${SC[compat.summary]}bb)`,borderRadius:3,transition:'width .5s'}}/>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.5rem'}}>
          {[
            {label:'Tarabala',score:compat.taraScore,max:3,extra:compat.taraName,color:'#818cf8'},
            {label:'Gana Milan',score:compat.ganaScore,max:3,extra:compat.ganaMatch?'Match':'Mismatch',color:'#34d399'},
            {label:'Nadi Dosha',score:compat.nadiScore,max:3,extra:compat.nadiMatch?'⚠ Same Nadi':'✓ Different',color:compat.nadiMatch?'#f87171':'#4ade80'},
            {label:'Yoni Milan',score:compat.yoniScore,max:4,extra:'',color:'#fbbf24'},
          ].map(({label,score,max,extra,color})=>(
            <div key={label} style={{padding:'0.6rem',background:'var(--surface-3)',borderRadius:'var(--r-sm)'}}>
              <div style={{fontSize:'0.6rem',color:'var(--text-muted)',marginBottom:'0.25rem'}}>{label}</div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontWeight:700,color,fontSize:'1rem'}}>{score}/{max}</span>
                <span style={{fontSize:'0.62rem',color:'var(--text-muted)'}}>{extra}</span>
              </div>
              <div style={{height:3,background:'var(--surface-2)',borderRadius:2,marginTop:'0.35rem'}}><div style={{height:'100%',width:`${(score/max)*100}%`,background:color,borderRadius:2,transition:'width .4s'}}/></div>
            </div>
          ))}
        </div>
      </div>
      {/* Heat-map */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(9,1fr)',gap:'3px'}}>
        {miniGrid.map(n=>{
          const c=SC[n.summary]
          return (
            <div key={n.idx} onClick={()=>setCmp(n.idx)} title={`${NAK_NAMES[n.idx]}: ${n.score}%`} style={{aspectRatio:'1',borderRadius:5,cursor:'pointer',background:`${c}22`,border:`1px solid ${c}55`,display:'flex',alignItems:'center',justifyContent:'center',transition:'transform .15s'}}
              onMouseEnter={e=>e.currentTarget.style.transform='scale(1.15)'}
              onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}>
              <div style={{fontSize:'0.48rem',color:c,fontWeight:700}}>{n.score}</div>
              {n.idx===cmp&&<div style={{position:'absolute',inset:0,border:`2px solid ${c}`,borderRadius:4,pointerEvents:'none'}}/>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Remedies ──────────────────────────────────────────────────
function RemediesTab({remedy,nakIdx}:{remedy: (typeof NAKSHATRA_REMEDIES)[number]; nakIdx:number}) {
  if(!remedy) return <div style={{color:'var(--text-muted)',padding:'2rem',textAlign:'center'}}>Remedy data unavailable.</div>
  const sections=[
    {title:'Mantras & Seed',icon:'🕉',items:[
      {label:'Mantra',value:remedy.mantra},
      {label:'Beej Mantra',value:remedy.beej},
    ]},
    {title:'Gemstone & Metals',icon:'💎',items:[
      {label:'Gemstone',value:remedy.gemstone},
      {label:'Metal',value:remedy.metal},
      {label:'Color',value:remedy.color},
    ]},
    {title:'Nature Offerings',icon:'🌿',items:[
      {label:'Flower',value:remedy.flower},
      {label:'Sacred Tree',value:remedy.tree},
    ]},
    {title:'Worship',icon:'🙏',items:[
      {label:'Deity',value:remedy.deity},
      {label:'Upasana',value:remedy.upasana},
      {label:'Fasting',value:remedy.fasting},
    ]},
    {title:'Service & Health',icon:'❤️',items:[
      {label:'Charity',value:remedy.charity},
      {label:'Health Watch',value:remedy.dosha},
    ]},
  ]
  return (
    <div style={{display:'flex',flexDirection:'column',gap:'0.875rem'}}>
      <p style={{fontSize:'0.75rem',color:'var(--text-muted)',fontStyle:'italic',margin:0,lineHeight:1.6}}>Traditional remedies for <strong style={{color:'var(--gold)'}}>{NAK_NAMES[nakIdx]}</strong> Nakshatra — deity worship, mantra, gemstones, and acts of service.</p>
      {sections.map(s=>(
        <div key={s.title} style={{padding:'0.875rem',background:'var(--surface-2)',border:'1px solid var(--border-soft)',borderRadius:'var(--r-md)'}}>
          <div style={{fontSize:'0.65rem',textTransform:'uppercase',letterSpacing:'.1em',color:'var(--text-gold)',fontWeight:700,marginBottom:'0.6rem'}}>{s.icon} {s.title}</div>
          <div style={{display:'flex',flexDirection:'column',gap:'0.4rem'}}>
            {s.items.map(({label,value})=>(
              <div key={label} style={{display:'flex',gap:'0.5rem',fontSize:'0.78rem'}}>
                <span style={{color:'var(--text-muted)',minWidth:90,flexShrink:0}}>{label}:</span>
                <span style={{color:'var(--text-primary)',fontWeight:500}}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
