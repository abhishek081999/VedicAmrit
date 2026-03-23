'use client'
// src/components/chakra/BhavaChakra.tsx
// Bhava Chakra — unequal houses using actual sidereal cusps

import React from 'react'
import type { GrahaData, Rashi, ArudhaData } from '@/types/astrology'
import { RASHI_SHORT } from '@/types/astrology'

const DIGNITY_COLORS: Record<string,string> = {
  exalted:'#4ecdc4',moolatrikona:'#f7dc6f',own:'#82e0aa',
  great_friend:'#abebc6',friend:'#a9cce3',neutral:'#aaaaaa',
  enemy:'#f0b27a',great_enemy:'#ec7063',debilitated:'#e74c3c',
}
const GRAHA_SHORT: Record<string,string> = {
  Su:'Su',Mo:'Mo',Ma:'Ma',Me:'Me',Ju:'Ju',Ve:'Ve',Sa:'Sa',Ra:'Ra',Ke:'Ke',
}

function polar(cx:number,cy:number,r:number,deg:number):[number,number]{
  const rad=deg*Math.PI/180;return[cx+r*Math.cos(rad),cy+r*Math.sin(rad)]
}
function slicePath(cx:number,cy:number,r:number,s:number,e:number):string{
  const[x1,y1]=polar(cx,cy,r,s),[x2,y2]=polar(cx,cy,r,e)
  let diff=e-s;while(diff<0)diff+=360;while(diff>360)diff-=360
  return`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${diff>180?1:0} 1 ${x2} ${y2} Z`
}
function lonToAngle(lon:number,ascLon:number):number{
  let d=lon-ascLon;while(d<0)d+=360;while(d>=360)d-=360;return(180+d)%360
}

interface Props{
  ascRashi:Rashi;ascDegree:number;cusps:number[];grahas:GrahaData[]
  size?:number;showDegrees?:boolean;showNakshatra?:boolean;showKaraka?:boolean
  showArudha?:boolean;arudhas?:ArudhaData;transitGrahas?:GrahaData[]
  fontScale?:number;planetScale?:number;showCuspDegrees?:boolean;label?:string
}

export function BhavaChakra({
  ascRashi,ascDegree,cusps,grahas,size=480,showDegrees=true,showNakshatra=false,
  showKaraka=false,showArudha=false,arudhas,transitGrahas=[],
  fontScale=1.0,planetScale=1.0,showCuspDegrees=false,label='Bhava',
}:Props){
  const cx=size/2,cy=size/2
  const outerR=(size/2)-6,cuspR=outerR-22,planetR=cuspR-14,innerR=planetR-52
  const ascLon=ascDegree
  const bf=10*fontScale,pf=11*planetScale

  const safe=cusps.length===12?cusps:Array.from({length:12},(_,i)=>((ascLon+i*30)%360))
  const cuspAngles=safe.map(c=>lonToAngle(c,ascLon))

  function houseMidAngle(h:number):number{
    const s=cuspAngles[h-1],e=cuspAngles[h%12]
    let d=e-s;while(d<=0)d+=360;return(s+d/2)%360
  }
  function houseMidSign(h:number):Rashi{
    const s=cuspAngles[h-1],e=cuspAngles[h%12]
    let d=e-s;while(d<=0)d+=360
    let mid=ascLon+(s+d/2)%360-180;while(mid<0)mid+=360;while(mid>=360)mid-=360
    return(Math.floor(mid/30)%12+1) as Rashi
  }
  function grahaHouseByLon(lon:number):number{
    let rel=lon-ascLon;while(rel<0)rel+=360;while(rel>=360)rel-=360
    for(let h=12;h>=1;h--){
      let c=safe[h-1]-ascLon;while(c<0)c+=360;while(c>=360)c-=360
      if(rel>=c)return h
    }
    return 1
  }

  const byHouse:Record<number,GrahaData[]>={},tByHouse:Record<number,GrahaData[]>={}
  for(let h=1;h<=12;h++){byHouse[h]=[];tByHouse[h]=[]}
  grahas.forEach(g=>{byHouse[grahaHouseByLon(g.lonSidereal)].push(g)})
  transitGrahas.forEach(g=>{tByHouse[grahaHouseByLon(g.lonSidereal)].push(g)})

  return(
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{fontFamily:'Arial,sans-serif'}}>
      <text x={cx} y={14} textAnchor="middle" fontSize={9} fill="var(--text-muted,#888)" fontStyle="italic">{label}</text>
      {Array.from({length:12},(_,i)=>{
        const h=i+1,s=cuspAngles[i],e=cuspAngles[(i+1)%12]
        const mid=houseMidAngle(h),sign=houseMidSign(h)
        const[sx,sy]=polar(cx,cy,(cuspR+outerR)/2,mid)
        const[nx,ny]=polar(cx,cy,innerR+20,mid)
        return(<g key={h}>
          <path d={slicePath(cx,cy,outerR,s,e)} fill={h===1?'rgba(46,109,164,0.18)':'var(--surface-2,rgba(255,255,255,0.03))'} stroke="var(--border,#555)" strokeWidth={h===1?1.5:0.5}/>
          <text x={sx} y={sy} textAnchor="middle" dominantBaseline="central" fontSize={bf} fill="var(--text-muted,#777)">{RASHI_SHORT[sign]}</text>
          <text x={nx} y={ny} textAnchor="middle" dominantBaseline="central" fontSize={bf-1} fill={h===1?'#2e6da4':'var(--text-muted,#666)'} fontWeight={h===1?700:400}>{h}</text>
        </g>)
      })}
      {cuspAngles.map((angle,i)=>{
        const[x1,y1]=polar(cx,cy,innerR,angle),[x2,y2]=polar(cx,cy,outerR,angle)
        const d=safe[i]%30,deg=Math.floor(d),mn=Math.floor((d-deg)*60)
        const[lx,ly]=polar(cx,cy,cuspR,angle)
        return(<g key={i}>
          <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={i===0?'rgba(46,109,164,0.8)':'var(--border,#555)'} strokeWidth={i===0?1.5:0.5} strokeDasharray={i===0?undefined:'4,3'}/>
          {showCuspDegrees&&<text x={lx} y={ly} textAnchor="middle" dominantBaseline="central" fontSize={bf-2} fill="var(--text-muted,#777)" opacity={0.7}>{deg}°{String(mn).padStart(2,'0')}'</text>}
        </g>)
      })}
      <circle cx={cx} cy={cy} r={innerR} fill="var(--surface-1,#1a1a2a)" stroke="var(--border,#555)" strokeWidth={0.5}/>
      <text x={cx} y={cy-innerR+16} textAnchor="middle" dominantBaseline="central" fontSize={bf} fill="#2e6da4" fontWeight={700}>As {Math.floor(ascDegree%30)}°</text>
      {Array.from({length:12},(_,i)=>{
        const h=i+1,planets=byHouse[h],transits=tByHouse[h]
        if(!planets.length&&!transits.length)return null
        const mid=houseMidAngle(h)
        return(<g key={h}>
          {planets.map((g,pi)=>{
            const sp=Math.min(18,22/Math.max(planets.length,1))
            const off=(pi-(planets.length-1)/2)*sp
            const[px,py]=polar(cx,cy,planetR-14,mid+off)
            const col=DIGNITY_COLORS[g.dignity]||'#aaa'
            const lbl=(GRAHA_SHORT[g.id]||g.id)+(g.isRetro?'\u1D3F':'')
            return(<g key={g.id}>
              <text x={px} y={py} textAnchor="middle" dominantBaseline="central" fontSize={pf} fontWeight={600} fill={col}>{lbl}{showDegrees?` ${Math.floor(g.degree)}°`:''}</text>
              {showNakshatra&&<text x={px} y={py+pf+1} textAnchor="middle" dominantBaseline="central" fontSize={pf-2} fill="var(--text-muted,#888)">{g.nakshatraName?.slice(0,3)}</text>}
              {showKaraka&&g.charaKaraka&&<text x={px} y={py-pf} textAnchor="middle" dominantBaseline="central" fontSize={pf-2} fill="#8b5cf6">{g.charaKaraka}</text>}
            </g>)
          })}
          {transits.map((g,pi)=>{
            const sp=Math.min(18,22/Math.max(transits.length,1))
            const off=(pi-(transits.length-1)/2)*sp
            const[px,py]=polar(cx,cy,planetR+8,mid+off)
            return(<text key={`t-${g.id}`} x={px} y={py} textAnchor="middle" dominantBaseline="central" fontSize={pf-1} fontWeight={600} fill="rgba(139,124,246,0.9)">{GRAHA_SHORT[g.id]||g.id}</text>)
          })}
        </g>)
      })}
    </svg>
  )
}
