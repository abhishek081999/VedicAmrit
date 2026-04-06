'use client'
import React from 'react'
import {
  GRAHA_NAMES, GRAHA_SANSKRIT, RASHI_NAMES, 
  type GrahaId, type Rashi 
} from '@/types/astrology'
import { 
  SIGN_INTERPRETATIONS, NAKSHATRA_INTERPRETATIONS, DIGNITY_INTERPRETATIONS 
} from '@/lib/engine/interpretations'
import { TARA_NAMES, TARA_QUALITIES } from '@/lib/engine/nakshatraAdvanced'

export const QC = {
  auspicious:   { bg:'rgba(78,205,196,.08)',  border:'rgba(78,205,196,.3)',  text:'var(--teal)' },
  inauspicious: { bg:'rgba(224,123,142,.08)', border:'rgba(224,123,142,.3)', text:'var(--rose)' },
  neutral:      { bg:'rgba(245,158,66,.08)',  border:'rgba(245,158,66,.25)', text:'var(--amber)' },
}

export const GANA_COL: Record<string,string> = { Deva:'#818cf8', Manushya:'#34d399', Rakshasa:'#f87171' }

export const ICON: Record<string,string> = {
  Su:'☉',Mo:'☽',Ma:'♂',Me:'☿',Ju:'♃',Ve:'♀',Sa:'♄',Ra:'☊',Ke:'☋',Ur:'⛢',Ne:'♆',Pl:'♇',
}

interface PlanetDetailCardProps {
  p: any
  moonNakIdx: number
  ascRashi: number
}

export function PlanetDetailCard({ p, moonNakIdx, ascRashi }: PlanetDetailCardProps) {
  const isAsc = p.grahaId === 'As'
  const taraIdx = isAsc ? 0 : (p.nakshatraIndex - moonNakIdx + 27) % 9
  const taraName = TARA_NAMES[taraIdx]
  const q = TARA_QUALITIES[taraName].quality
  
  // Calculate ruled houses (Whole Sign)
  const ruledSigns: number[] = []
  const OWNERS: Record<string, number[]> = {
    Su: [5], Mo:[4], Ma:[1,8], Me:[3,6], Ju:[9,12], Ve:[2,7], Sa:[10,11]
  }
  if (OWNERS[p.grahaId]) {
    OWNERS[p.grahaId].forEach(s => {
      const house = (s - ascRashi + 12) % 12 + 1
      ruledSigns.push(house)
    })
  }
  
  const statusColor = p.isRetro ? 'var(--rose)' : p.isCombust ? 'var(--amber)' : 'var(--teal)'
  
  // Dignity formatting
  const dignityLabel = (p.dignity || 'neutral').replace('_', ' ')
  const digColor = 
    p.dignity === 'exalted' ? '#4ade80' : 
    p.dignity === 'debilitated' ? '#f87171' : 
    p.dignity === 'own' ? 'var(--gold)' : 
    p.dignity === 'moolatrikona' ? '#c084fc' : 'var(--text-muted)'

  return (
    <div className="card" style={{
      padding:'0',
      overflow:'hidden',
      border:'1px solid var(--border-soft)',
      background:'linear-gradient(180deg, var(--surface-2) 0%, var(--surface-1) 100%)',
      transition:'transform 0.2s ease, border-color 0.2s ease'
    }}
    onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--border-bright)'; e.currentTarget.style.transform='translateY(-4px)'}}
    onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border-soft)'; e.currentTarget.style.transform='translateY(0)'}}>
      
      {/* Card Header & Status */}
      <div style={{padding:'0.85rem',borderBottom:'1px solid var(--border-soft)',display:'flex',justifyContent:'space-between',alignItems:'center',background:'rgba(255,255,255,0.02)'}}>
        <div style={{display:'flex',gap:'0.75rem',alignItems:'center'}}>
          <div style={{width:32,height:32,borderRadius:'50%',background:'var(--surface-3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.2rem',border:'1px solid var(--border-soft)'}}>
            {isAsc ? 'Å' : ICON[p.grahaId]}
          </div>
          <div>
            <div style={{fontWeight:700,fontSize:'0.9rem',color:'var(--text-primary)',lineHeight:1.1}}>{p.grahaName || p.id}</div>
            {!isAsc && <div style={{fontSize:'0.6rem',color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.05em'}}>{GRAHA_SANSKRIT[p.grahaId as GrahaId] || ''}</div>}
          </div>
        </div>
        <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:'3px'}}>
          {p.isRetro && <span style={{fontSize:'0.55rem',background:'rgba(224,123,142,0.15)',color:'var(--rose)',padding:'2px 6px',borderRadius:4,fontWeight:700,border:'1px solid rgba(224,123,142,0.3)'}}>RETROGRADE</span>}
          {p.isCombust && <span style={{fontSize:'0.55rem',background:'rgba(245,158,66,0.15)',color:'var(--amber)',padding:'2px 6px',borderRadius:4,fontWeight:700,border:'1px solid rgba(245,158,66,0.3)'}}>COMBUST</span>}
          {!isAsc && <span style={{fontSize:'0.6rem',color:digColor,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em'}}>{dignityLabel}</span>}
        </div>
      </div>

      {/* Body Content */}
      <div style={{padding:'0.85rem',display:'flex',flexDirection:'column',gap:'0.85rem'}}>
        {/* Sign & Degree */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{display:'flex',flexDirection:'column'}}>
            <span style={{fontSize:'0.6rem',color:'var(--text-muted)',textTransform:'uppercase'}}>Sign & Position</span>
            <span style={{fontSize:'0.85rem',fontWeight:600,color:'var(--text-primary)'}}>
              {RASHI_NAMES[Math.floor((p.degree || p.totalDegree) / 30) + 1 as Rashi]} {Math.floor((p.degree || p.totalDegree) % 30)}° {Math.floor((((p.degree || p.totalDegree) % 30) % 1) * 60)}&apos;
            </span>
          </div>
          {p.charaKaraka && (
            <div style={{textAlign:'right'}}>
              <span style={{fontSize:'0.6rem',color:'var(--text-muted)',textTransform:'uppercase'}}>Chara Karaka</span>
              <div style={{fontSize:'0.8rem',fontWeight:700,color:'var(--gold)'}}>{p.charaKaraka}</div>
            </div>
          )}
        </div>

        {/* Nakshatra Bubble */}
        <div style={{padding:'0.65rem',background:'var(--surface-3)',borderRadius:'var(--r-md)',border:'1px solid var(--border-soft)'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.4rem'}}>
            <span style={{fontSize:'0.8rem',fontWeight:700,color:'var(--text-gold)'}}>{p.nakshatraName}</span>
            <span style={{fontSize:'0.65rem',color:'var(--text-muted)'}}>Pada {p.pada}</span>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.4rem',fontSize:'0.68rem'}}>
            <div style={{color:'var(--text-secondary)'}}>Lord: <span style={{color:'var(--text-primary)',fontWeight:500}}>{GRAHA_NAMES[p.lord as GrahaId] || '—'}</span></div>
            <div style={{color:'var(--text-secondary)',textAlign:'right'}}>Deity: <span style={{color:'var(--text-primary)',fontWeight:500}}>{p.deity}</span></div>
            <div style={{color:'var(--text-secondary)'}}>Gana: <span style={{color:GANA_COL[p.gana],fontWeight:600}}>{p.gana}</span></div>
            <div style={{color:'var(--text-secondary)',textAlign:'right'}}>Tara: <span style={{color:QC[q as keyof typeof QC].text,fontWeight:700}}>{taraName}</span></div>
          </div>
        </div>

        {/* KP, Avastha & Lordship Grid */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem'}}>
          <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
             <span style={{fontSize:'0.55rem',color:'var(--text-muted)',textTransform:'uppercase'}}>KP Sub-Lords</span>
             <div style={{fontSize:'0.7rem',display:'flex',gap:'4px',flexWrap:'wrap'}}>
               <span style={{padding:'2px 5px',background:'rgba(129,140,248,0.1)',borderRadius:3,border:'1px solid rgba(129,140,248,0.2)',color:'#818cf8'}}>Sub: {p.kp?.subLord || '—'}</span>
               <span style={{padding:'2px 5px',background:'rgba(52,211,153,0.1)',borderRadius:3,border:'1px solid rgba(52,211,153,0.2)',color:'#34d399'}}>SS: {p.kp?.subSubLord || '—'}</span>
             </div>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:'4px',textAlign:'right'}}>
             <span style={{fontSize:'0.55rem',color:'var(--text-muted)',textTransform:'uppercase'}}>House Ruler</span>
             <div style={{fontSize:'0.72rem',fontWeight:600,color:'var(--text-gold)'}}>
               {ruledSigns.length > 0 ? `L-${ruledSigns.join(', ')}` : '—'}
             </div>
          </div>
        </div>

        {/* Interpretations Analysis */}
        {!isAsc && (
          <div style={{padding:'0.75rem',background:'var(--surface-2)',borderRadius:'var(--r-md)',border:'1px solid var(--border-soft)',borderLeft:'3px solid var(--gold)'}}>
             <div style={{fontSize:'0.55rem',color:'var(--text-gold)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:'0.35rem'}}>Analysis</div>
             <div style={{fontSize:'0.72rem',color:'var(--text-primary)',lineHeight:1.5,fontStyle:'italic'}}>
               {p.interpretation || SIGN_INTERPRETATIONS[p.grahaId as string]?.[Math.floor((p.degree || p.totalDegree)/30)+1] || NAKSHATRA_INTERPRETATIONS[p.nakshatraIndex]}
               <div style={{marginTop:'0.4rem',color:'var(--text-muted)',fontSize:'0.65rem'}}>
                 {DIGNITY_INTERPRETATIONS[p.dignity || 'neutral']}
               </div>
             </div>
          </div>
        )}

        {/* Shadbala & Avastha Footer */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginTop:'0.25rem',paddingTop:'0.6rem',borderTop:'1px solid var(--border-soft)'}}>
           {p.shadbala ? (
             <div>
               <span style={{fontSize:'0.55rem',color:'var(--text-muted)',textTransform:'uppercase',display:'block'}}>Total Strength</span>
               <span style={{fontSize:'0.9rem',fontWeight:700,color:p.shadbala.isStrong?'var(--teal)':'var(--rose)'}}>
                 {p.shadbala.total.toFixed(2)} <span style={{fontSize:'0.6rem'}}>Rupas</span>
               </span>
             </div>
           ) : <div/>}
           {p.avastha && (
             <div style={{textAlign:'right'}}>
               <span style={{fontSize:'0.55rem',color:'var(--text-muted)',textTransform:'uppercase',display:'block',marginBottom:2}}>Avastha</span>
               <div style={{fontSize:'0.65rem',color:'var(--text-primary)',background:'var(--surface-3)',padding:'2px 6px',borderRadius:4,border:'1px solid var(--border-soft)'}}>
                 {p.avastha.baladi} · {p.avastha.jagradadi}
               </div>
             </div>
           )}
        </div>
      </div>
    </div>
  )
}
