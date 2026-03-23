'use client'
// src/components/chakra/CircleChakra.tsx
// Circle/Wheel chakra — 12 equal pie slices, ascendant at 9 o'clock

import React from 'react'
import type { GrahaData, Rashi, ArudhaData } from '@/types/astrology'
import { RASHI_SHORT } from '@/types/astrology'

const SIGN_ELEMENT: Record<number, string> = {
  1:'fire',2:'earth',3:'air',4:'water',5:'fire',6:'earth',
  7:'air',8:'water',9:'fire',10:'earth',11:'air',12:'water',
}
const ELEM_FILL: Record<string,string> = {
  fire:'rgba(232,100,70,0.10)',earth:'rgba(80,180,100,0.10)',
  air:'rgba(100,160,230,0.10)',water:'rgba(140,100,220,0.10)',
}
const DIGNITY_COLORS: Record<string,string> = {
  exalted:'#4ecdc4',moolatrikona:'#f7dc6f',own:'#82e0aa',
  great_friend:'#abebc6',friend:'#a9cce3',neutral:'#aaaaaa',
  enemy:'#f0b27a',great_enemy:'#ec7063',debilitated:'#e74c3c',
}
const GRAHA_SHORT: Record<string,string> = {
  Su:'Su',Mo:'Mo',Ma:'Ma',Me:'Me',Ju:'Ju',Ve:'Ve',Sa:'Sa',Ra:'Ra',Ke:'Ke',
}

function polar(cx:number,cy:number,r:number,deg:number):[number,number]{
  const rad=deg*Math.PI/180; return [cx+r*Math.cos(rad),cy+r*Math.sin(rad)]
}
function slicePath(cx:number,cy:number,r:number,s:number,e:number):string{
  const[x1,y1]=polar(cx,cy,r,s),[x2,y2]=polar(cx,cy,r,e)
  const large=Math.abs(e-s)>180?1:0
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`
}

interface Props{
  ascRashi:Rashi;grahas:GrahaData[];size?:number
  showDegrees?:boolean;showNakshatra?:boolean;showKaraka?:boolean
  showArudha?:boolean;arudhas?:ArudhaData;transitGrahas?:GrahaData[]
  fontScale?:number;planetScale?:number
}

export function CircleChakra({
  ascRashi,grahas,size=480,showDegrees=true,showNakshatra=false,
  showKaraka=false,showArudha=false,arudhas,transitGrahas=[],
  fontScale=1.0,planetScale=1.0,
}:Props){
  const cx=size/2,cy=size/2
  const outerR=(size/2)-6,signR=outerR-26,planetR=signR-8,innerR=planetR-50
  const bf=11*fontScale,pf=11*planetScale

  // House 1 starts at 180deg (9 o'clock), houses go anti-clockwise
  function houseStart(h:number){return 180-(h-1)*30}
  function houseMid(h:number){return houseStart(h)-15}
  function houseSign(h:number):Rashi{return ((ascRashi-1+h-1)%12+1) as Rashi}
  function grahaHouse(rashi:Rashi){return((rashi-ascRashi+12)%12)+1}

  const byHouse:Record<number,GrahaData[]>={},tByHouse:Record<number,GrahaData[]>={}
  for(let h=1;h<=12;h++){byHouse[h]=[];tByHouse[h]=[]}
  grahas.forEach(g=>{byHouse[grahaHouse(g.rashi)].push(g)})
  transitGrahas.forEach(g=>{tByHouse[grahaHouse(g.rashi)].push(g)})

  return(
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{fontFamily:'Arial,sans-serif'}}>
      {Array.from({length:12},(_,i)=>{
        const h=i+1,sign=houseSign(h),start=houseStart(h),end=start-30
        const mid=houseMid(h),fill=ELEM_FILL[SIGN_ELEMENT[sign]]||'transparent'
        const[lx,ly]=polar(cx,cy,(signR+outerR)/2,mid)
        const[nx,ny]=polar(cx,cy,innerR+20,mid)
        return(<g key={h}>
          <path d={slicePath(cx,cy,outerR,end,start)} fill={h===1?'rgba(46,109,164,0.15)':fill} stroke="var(--border,#555)" strokeWidth={h===1?1.5:0.5}/>
          <text x={lx} y={ly} textAnchor="middle" dominantBaseline="central" fontSize={bf} fontWeight={h===1?700:400} fill={h===1?'#2e6da4':'var(--text-muted,#888)'}>{RASHI_SHORT[sign]}</text>
          <text x={nx} y={ny} textAnchor="middle" dominantBaseline="central" fontSize={bf-1} fill="var(--text-muted,#666)" opacity={0.6}>{h}</text>
        </g>)
      })}
      {Array.from({length:12},(_,i)=>{
        const angle=houseStart(i+1)
        const[x1,y1]=polar(cx,cy,innerR,angle),[x2,y2]=polar(cx,cy,outerR,angle)
        return(<line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={i===0?'rgba(46,109,164,0.7)':'var(--border,#555)'} strokeWidth={i===0?1.5:0.5}/>)
      })}
      <circle cx={cx} cy={cy} r={innerR} fill="var(--surface-1,#1a1a2a)" stroke="var(--border,#555)" strokeWidth={0.5}/>
      <text x={cx} y={cy-innerR+16} textAnchor="middle" dominantBaseline="central" fontSize={bf-1} fill="#2e6da4" fontWeight={700}>As</text>
      {Array.from({length:12},(_,i)=>{
        const h=i+1,planets=byHouse[h],transits=tByHouse[h]
        if(!planets.length&&!transits.length)return null
        const mid=houseMid(h)
        return(<g key={h}>
          {planets.map((g,pi)=>{
            const sp=Math.min(20,24/Math.max(planets.length,1))
            const off=(pi-(planets.length-1)/2)*sp
            const[px,py]=polar(cx,cy,planetR-18,mid+off)
            const col=DIGNITY_COLORS[g.dignity]||'#aaa'
            const label=(GRAHA_SHORT[g.id]||g.id)+(g.isRetro?'\u1D3F':'')
            return(<g key={g.id}>
              <text x={px} y={py} textAnchor="middle" dominantBaseline="central" fontSize={pf} fontWeight={600} fill={col}>{label}{showDegrees?` ${Math.floor(g.degree)}°`:''}</text>
              {showNakshatra&&<text x={px} y={py+pf+1} textAnchor="middle" dominantBaseline="central" fontSize={pf-2} fill="var(--text-muted,#888)">{g.nakshatraName?.slice(0,3)}</text>}
              {showKaraka&&g.charaKaraka&&<text x={px} y={py-pf} textAnchor="middle" dominantBaseline="central" fontSize={pf-2} fill="#8b5cf6">{g.charaKaraka}</text>}
            </g>)
          })}
          {transits.map((g,pi)=>{
            const sp=Math.min(20,24/Math.max(transits.length,1))
            const off=(pi-(transits.length-1)/2)*sp
            const[px,py]=polar(cx,cy,planetR+10,mid+off)
            return(<text key={`t-${g.id}`} x={px} y={py} textAnchor="middle" dominantBaseline="central" fontSize={pf-1} fontWeight={600} fill="rgba(139,124,246,0.9)">{GRAHA_SHORT[g.id]||g.id}</text>)
          })}
        </g>)
      })}
      {showArudha&&arudhas&&(['AL','A2','A3','A4','A5','A6','A7','A8','A9','A10','A11','A12'] as const).map(key=>{
        const rashi=arudhas[key] as Rashi
        if(!rashi)return null
        const[ax,ay]=polar(cx,cy,signR-28,houseMid(((rashi-ascRashi+12)%12)+1))
        return(<text key={key} x={ax} y={ay} textAnchor="middle" dominantBaseline="central" fontSize={bf-1} fill="#8b5cf6" opacity={0.85}>{key==='A12'?'UL':key}</text>)
      })}
    </svg>
  )
}
