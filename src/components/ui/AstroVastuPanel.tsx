'use client'
import React, { useMemo, useState } from 'react'
import type { ChartOutput, GrahaId, GrahaData, Rashi } from '@/types/astrology'
import { RASHI_NAMES, GRAHA_NAMES, RASHI_SHORT } from '@/types/astrology'

interface AstroVastuPanelProps {
  chart: ChartOutput
}

// 16 Zonal Mapping (Mahavastu / Advanced Vastu)
const ZONES_16 = [
  { id: 'N',    name: 'North',            ruling: 'Me', element: 'Water', quality: 'Opportunities, Career', angle: 0 },
  { id: 'NNE',  name: 'North-North-East', ruling: 'Ju', element: 'Water', quality: 'Health, Immunity', angle: 22.5 },
  { id: 'NE',   name: 'North-East',       ruling: 'Ju', element: 'Water', quality: 'Wisdom, Clarity', angle: 45 },
  { id: 'ENE',  name: 'East-North-East',  ruling: 'Su', element: 'Air',   quality: 'Refreshment, Fun', angle: 67.5 },
  { id: 'E',    name: 'East',             ruling: 'Su', element: 'Air',   quality: 'Social Connectivity', angle: 90 },
  { id: 'ESE',  name: 'East-South-East',  ruling: 'Ve', element: 'Air',   quality: 'Churning, Anxiety', angle: 112.5 },
  { id: 'SE',   name: 'South-East',       ruling: 'Ve', element: 'Fire',  quality: 'Cash Flow, Confidence', angle: 135 },
  { id: 'SSE',  name: 'South-South-East', ruling: 'Ma', element: 'Fire',  quality: 'Strength, Confidence', angle: 157.5 },
  { id: 'S',    name: 'South',            ruling: 'Ma', element: 'Fire',  quality: 'Relaxation, Fame', angle: 180 },
  { id: 'SSW',  name: 'South-South-West', ruling: 'Ra', element: 'Earth', quality: 'Expenditure, Disposal', angle: 202.5 },
  { id: 'SW',   name: 'South-West',       ruling: 'Ra', element: 'Earth', quality: 'Skills, Relationship', angle: 225 },
  { id: 'WSW',  name: 'West-South-West',  ruling: 'Sa', element: 'Earth', quality: 'Education, Savings', angle: 247.5 },
  { id: 'W',    name: 'West',             ruling: 'Sa', element: 'Space', quality: 'Gains, Profits', angle: 270 },
  { id: 'WNW',  name: 'West-North-West',  ruling: 'Mo', element: 'Space', quality: 'Depression, Detox', angle: 292.5 },
  { id: 'NW',   name: 'North-West',       ruling: 'Mo', element: 'Air',   quality: 'Support, Banking', angle: 315 },
  { id: 'NNW',  name: 'North-North-West', ruling: 'Me', element: 'Air',   quality: 'Attraction, Sex', angle: 337.5 },
]

// 45 Deities Mapping (Name, x, y, w, h)
// Outer 32 (Perimeter)
const DEITY_MAP = [
  // North Edge (East to West)
  { id: 'shikhi', name: 'Shikhi', x: 8, y: 0, w: 1, h: 1, ang: [33.75, 45] },
  { id: 'parjanya', name: 'Parjanya', x: 7, y: 0, w: 1, h: 1, ang: [45, 56.25] },
  { id: 'jayant', name: 'Jayant', x: 6, y: 0, w: 1, h: 1, ang: [56.25, 67.5] },
  { id: 'indra', name: 'Indra', x: 5, y: 0, w: 1, h: 1, ang: [67.5, 78.75] },
  { id: 'surya', name: 'Surya', x: 4, y: 0, w: 1, h: 1, ang: [78.75, 90] },
  { id: 'satya', name: 'Satya', x: 3, y: 0, w: 1, h: 1, ang: [90, 101.25] },
  { id: 'bhrisha', name: 'Bhrisha', x: 2, y: 0, w: 1, h: 1, ang: [101.25, 112.5] },
  { id: 'antariksh', name: 'Antariksh', x: 1, y: 0, w: 1, h: 1, ang: [112.5, 123.75] },
  
  // East Edge (North to South)
  { id: 'agni', name: 'Agni', x: 8, y: 1, w: 1, h: 1, ang: [123.75, 135] },
  { id: 'pusha', name: 'Pusha', x: 8, y: 2, w: 1, h: 1, ang: [135, 146.25] },
  { id: 'vitatha', name: 'Vitatha', x: 8, y: 3, w: 1, h: 1, ang: [146.25, 157.5] },
  { id: 'grihakshat', name: 'Grihakshat', x: 8, y: 4, w: 1, h: 1, ang: [157.5, 168.75] },
  { id: 'yama', name: 'Yama', x: 8, y: 5, w: 1, h: 1, ang: [168.75, 180] },
  { id: 'gandharv', name: 'Gandharv', x: 8, y: 6, w: 1, h: 1, ang: [180, 191.25] },
  { id: 'bhringraj', name: 'Bhringraj', x: 8, y: 7, w: 1, h: 1, ang: [191.25, 202.5] },
  { id: 'mrigha', name: 'Mrigha', x: 8, y: 8, w: 1, h: 1, ang: [202.5, 213.75] },

  // South Edge (West to East)
  { id: 'pitru', name: 'Pitr', x: 1, y: 8, w: 1, h: 1, ang: [213.75, 225] },
  { id: 'dauvarik', name: 'Dauvarik', x: 2, y: 8, w: 1, h: 1, ang: [225, 236.25] },
  { id: 'sugriv', name: 'Sugriv', x: 3, y: 8, w: 1, h: 1, ang: [236.25, 247.5] },
  { id: 'pushpadant', name: 'Pushpadant', x: 4, y: 8, w: 1, h: 1, ang: [247.5, 258.75] },
  { id: 'varun', name: 'Varun', x: 5, y: 8, w: 1, h: 1, ang: [258.75, 270] },
  { id: 'asur', name: 'Asur', x: 6, y: 8, w: 1, h: 1, ang: [270, 281.25] },
  { id: 'shosh', name: 'Shosh', x: 7, y: 8, w: 1, h: 1, ang: [281.25, 292.5] },
  { id: 'papiyaksha', name: 'Papiyaksha', x: 0, y: 8, w: 1, h: 1, ang: [292.5, 303.75] },

  // West Edge (South to North)
  { id: 'roga', name: 'Roga', x: 0, y: 7, w: 1, h: 1, ang: [303.75, 315] },
  { id: 'naga', name: 'Naga', x: 0, y: 6, w: 1, h: 1, ang: [315, 326.25] },
  { id: 'mukhya', name: 'Mukhya', x: 0, y: 5, w: 1, h: 1, ang: [326.25, 337.5] },
  { id: 'bhallat', name: 'Bhallat', x: 0, y: 4, w: 1, h: 1, ang: [337.5, 348.75] },
  { id: 'soma', name: 'Soma', x: 0, y: 3, w: 1, h: 1, ang: [348.75, 360] },
  { id: 'bhujag', name: 'Bhujag', x: 0, y: 2, w: 1, h: 1, ang: [0, 11.25] },
  { id: 'aditi', name: 'Aditi', x: 0, y: 1, w: 1, h: 1, ang: [11.25, 22.5] },
  { id: 'diti', name: 'Diti', x: 0, y: 0, w: 1, h: 1, ang: [22.5, 33.75] },

  // Inner Deities (The 12)
  { id: 'apah', name: 'Apah', x: 7, y: 1, w: 1, h: 1, ang: [45, 90], inner: true },
  { id: 'apah_vatsa', name: 'Apah-vatsa', x: 7, y: 2, w: 1, h: 1, ang: [45, 90], inner: true },
  { id: 'aryama', name: 'Aryama', x: 7, y: 3, w: 1, h: 3, ang: [90, 135], inner: true },
  { id: 'savita', name: 'Savita', x: 7, y: 6, w: 1, h: 1, ang: [90, 135], inner: true },
  { id: 'savitra', name: 'Savitra', x: 7, y: 7, w: 1, h: 1, ang: [90, 135], inner: true },
  { id: 'vivaswan', name: 'Vivaswan', x: 3, y: 7, w: 3, h: 1, ang: [180, 225], inner: true },
  { id: 'indra_inner', name: 'Indra', x: 2, y: 7, w: 1, h: 1, ang: [180, 225], inner: true },
  { id: 'jaya', name: 'Jaya', x: 1, y: 7, w: 1, h: 1, ang: [180, 225], inner: true },
  { id: 'mitra', name: 'Mitra', x: 1, y: 3, w: 1, h: 3, ang: [270, 315], inner: true },
  { id: 'rudra', name: 'Rudra', x: 1, y: 2, w: 1, h: 1, ang: [270, 315], inner: true },
  { id: 'rajayakshma', name: 'Rājapaksha', x: 1, y: 1, w: 1, h: 1, ang: [270, 315], inner: true },
  { id: 'prithvi_dhara', name: 'Prithvi-dhara', x: 3, y: 1, w: 3, h: 1, ang: [0, 45], inner: true },

  // Center
  { id: 'brahma', name: 'BRAHMA', x: 3, y: 3, w: 3, h: 3, ang: [0, 360], center: true },
]

const ZONES_8 = [
  { id: 'N',    name: 'North',            ruling: 'Me', element: 'Water', quality: 'Opportunities, Career', angle: 0 },
  { id: 'NE',   name: 'North-East',       ruling: 'Ju', element: 'Water', quality: 'Wisdom, Clarity', angle: 45 },
  { id: 'E',    name: 'East',             ruling: 'Su', element: 'Air',   quality: 'Social Connectivity', angle: 90 },
  { id: 'SE',   name: 'South-East',       ruling: 'Ve', element: 'Fire',  quality: 'Cash Flow, Confidence', angle: 135 },
  { id: 'S',    name: 'South',            ruling: 'Ma', element: 'Fire',  quality: 'Relaxation, Fame', angle: 180 },
  { id: 'SW',   name: 'South-West',       ruling: 'Ra', element: 'Earth', quality: 'Skills, Relationship', angle: 225 },
  { id: 'W',    name: 'West',             ruling: 'Sa', element: 'Space', quality: 'Gains, Profits', angle: 270 },
  { id: 'NW',   name: 'North-West',       ruling: 'Mo', element: 'Air',   quality: 'Support, Banking', angle: 315 },
]

export function AstroVastuPanel({ chart }: AstroVastuPanelProps) {
  const { grahas } = chart
  const [mode, setMode] = useState<'8' | '16'>('16')
  const [selectedZone, setSelectedZone] = useState<string | null>(null)
  const [selectedDeity, setSelectedDeity] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const activeZones = mode === '16' ? ZONES_16 : ZONES_8
  const sectorAngle = mode === '16' ? 22.5 : 45

  const analysis = useMemo(() => {
    return activeZones.map(zone => {
      const occupants = grahas.filter(g => {
        // Map 12 Rashis to 16/8 Zones by angle
        const signAngle = ((g.rashi - 1) * 30 + 15) // Midpoint of sign
        const diff = Math.abs(signAngle - zone.angle)
        const threshold = mode === '16' ? 15 : 25
        return diff < threshold || Math.abs(signAngle - zone.angle - 360) < threshold
      })

      const rulingPlanet = grahas.find(g => g.id === zone.ruling)
      let score = 50 // Base neutral score
      
      if (rulingPlanet) {
        if (rulingPlanet.dignity === 'exalted') score += 30
        if (rulingPlanet.dignity === 'own') score += 20
        if (rulingPlanet.dignity === 'moolatrikona') score += 25
        if (rulingPlanet.dignity === 'debilitated') score -= 30
        if (rulingPlanet.isRetro) score -= 10
      }

      // Malefic influence logic
      const malefics = occupants.filter(g => ['Sa', 'Ra', 'Ke', 'Ma'].includes(g.id))
      if (['N', 'NE', 'E'].includes(zone.id) && malefics.length > 0) score -= 15

      return { ...zone, occupants, rulingPlanet, score }
    })
  }, [grahas, activeZones, mode])

  const bestEntrance = useMemo(() => {
    // Entrance logic (32 Dwara) - Simplified for 16 zones
    // Usually, N3, N4, E3, E4, S3, S4, W3, W4 are best
    const topZones = [...analysis]
      .filter(z => ['N', 'E', 'W', 'S'].includes(z.id))
      .sort((a, b) => b.score - a.score);
    return topZones[0] || analysis[0];
  }, [analysis]);

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', color: 'var(--text-primary)' }}>
      {/* Premium Header */}
      <section style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        borderBottom: '1px solid var(--border)', 
        paddingBottom: '1.5rem', 
        flexWrap: 'wrap', 
        gap: '1.5rem' 
      }}>
        <div style={{ flex: '1 1 300px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', filter: 'drop-shadow(0 0 10px var(--gold))' }}>☸</span>
            <h1 style={{ 
              margin: 0, 
              fontSize: 'clamp(1.8rem, 5vw, 2.8rem)', 
              fontWeight: 300, 
              fontFamily: 'var(--font-display)',
              lineHeight: 1.1
            }}>
              Advanced Astro-Vāstu
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 'clamp(0.9rem, 1.5vw, 1.1rem)', maxWidth: '700px', marginBottom: '1.5rem' }}>
            A high-precision analysis integrating Mahavastu principles with your specific planetary strengths.
          </p>
          
          {/* Mode Toggle */}
          <div style={{ display: 'flex', background: 'var(--surface-3)', padding: '4px', borderRadius: '12px', width: 'fit-content', border: '1px solid var(--border-soft)' }}>
            <button 
              onClick={() => { setMode('8'); setSelectedZone(null); }}
              style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', background: mode === '8' ? 'var(--gold)' : 'transparent', color: mode === '8' ? 'var(--text-on-gold)' : 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 600, fontSize: '0.8rem' }}
            >
              8 Directions
            </button>
            <button 
              onClick={() => { setMode('16'); setSelectedZone(null); }}
              style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', background: mode === '16' ? 'var(--gold)' : 'transparent', color: mode === '16' ? 'var(--text-on-gold)' : 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 600, fontSize: '0.8rem' }}
            >
              16 Directions
            </button>
          </div>
        </div>
        
        <div style={{ padding: '1rem 1.5rem', textAlign: 'center', minWidth: '140px', background: 'var(--gold-faint)', border: '1px solid var(--border-bright)', borderRadius: 'var(--r-md)' }}>
          <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-gold)', marginBottom: '0.25rem' }}>Analysis Grid</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>{mode}-Kona</div>
        </div>
      </section>

      {/* 16 Zone Circular Visualization */}
      <section style={{ 
        display: 'flex', 
        gap: isMobile ? '2rem' : '3rem', 
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'center' : 'flex-start' 
      }}>
        <div style={{ 
          width: '100%',
          maxWidth: '450px',
          position: 'relative', 
          display: 'flex', 
          justifyContent: 'center' 
        }}>
          <div className="vastu-compass-container" style={{ 
            position: 'relative', 
            width: '100%',
            aspectRatio: '1',
            maxWidth: '450px'
          }}>
             <svg viewBox="0 0 200 200" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
               {/* Segment Pieces */}
               {analysis.map((zone, i) => {
                 const startAngle = (i * sectorAngle) * (Math.PI / 180)
                 const endAngle = ((i + 1) * sectorAngle) * (Math.PI / 180)
                 const x1 = 100 + 90 * Math.cos(startAngle)
                 const y1 = 100 + 90 * Math.sin(startAngle)
                 const x2 = 100 + 90 * Math.cos(endAngle)
                 const y2 = 100 + 90 * Math.sin(endAngle)
                 
                 const color = zone.score > 70 ? 'var(--teal)' : zone.score < 40 ? 'var(--rose)' : 'var(--gold)'
                 const isActive = selectedZone === zone.id

                 return (
                   <path
                     key={zone.id}
                     onClick={() => setSelectedZone(zone.id)}
                     className="zone-segment"
                     d={`M 100 100 L ${x1} ${y1} A 90 90 0 0 1 ${x2} ${y2} Z`}
                     fill={isActive ? color : 'var(--surface-3)'}
                     stroke="var(--border)"
                     strokeWidth="0.5"
                     style={{ cursor: 'pointer', transition: 'all 0.3s', opacity: isActive ? 0.35 : 0.15 }}
                   />
                 )
               })}
               {/* Center Hub */}
               <circle cx="100" cy="100" r="25" fill="var(--surface-1)" stroke="var(--gold)" strokeWidth="1" />
               <text x="100" y="102" textAnchor="middle" fill="var(--text-gold)" fontSize="6" fontWeight="800" transform="rotate(90 100 100)">BRAHM</text>
               
               {/* Labels */}
               {analysis.map((zone, i) => {
                  const angle = (i * sectorAngle + (sectorAngle/2)) * (Math.PI / 180)
                  const tx = 100 + 72 * Math.cos(angle)
                  const ty = 100 + 72 * Math.sin(angle)
                  return (
                    <text 
                      key={'label-'+zone.id} 
                      x={tx} y={ty} 
                      textAnchor="middle" 
                      fill="var(--text-muted)" 
                      fontSize={mode === '16' ? '3.5' : '5'} 
                      transform={`rotate(90 ${tx} ${ty})`}
                    >
                      {zone.id}
                    </text>
                  )
               })}
             </svg>
             {/* Precise Collision-Avoidance for Planets (Iterative Sorting) */}
             {(() => {
               // Calculate relative scaling for planets based on container width
               // The radius for planets needs to be relative to the 200px (internal SVG scale)
               // But they are positioned absolute over the 450px container.
               
               // 1. Calculate base positions
               let positioned = grahas.map(p => {
                 const baseAngle = ((p.rashi - 1) * 30 + (p.degree)) - 90
                 // radius in pixels relative to a 450px container
                 return { ...p, angle: baseAngle, r: 105 } 
               })

               // 2. Sort by angle to handle sequential collisions
               positioned.sort((a,b) => a.angle - b.angle)

               // 3. Cumulative push logic
               for (let i = 0; i < positioned.length; i++) {
                 let stackCount = 0
                 for (let j = 0; j < i; j++) {
                    const angleDiff = Math.abs(positioned[i].angle - positioned[j].angle)
                    if (angleDiff < 8 || angleDiff > 352) {
                       stackCount++
                    }
                 }
                 positioned[i].r += (stackCount * 22)
               }

               return positioned.map(p => (
                 <div key={p.id} style={{
                   position: 'absolute', top: '50%', left: '50%',
                   transform: `rotate(${p.angle}deg) translateX(${isMobile ? (p.r * 0.8) : p.r}px)`,
                   background: 'var(--surface-4)', borderRadius: '50%', width: isMobile ? '24px' : '30px', height: isMobile ? '24px' : '30px',
                   display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? '0.6rem' : '0.7rem',
                   border: `2px solid ${p.isRetro ? 'var(--rose)' : 'var(--gold)'}`, 
                   boxShadow: '0 4px 15px rgba(0,0,0,0.5)', zIndex: 10 + (p.r / 10),
                   transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
                   cursor: 'help'
                 }} title={`${GRAHA_NAMES[p.id as GrahaId]} at ${Math.floor(p.degree)}° ${RASHI_NAMES[p.rashi]}`}>
                   <span style={{ transform: `rotate(${-p.angle}deg)`, fontWeight: 800 }}>{p.id}</span>
                 </div>
               ))
             })()}
          </div>
        </div>

        {/* Info Panel for Selected Zone */}
        <div style={{ 
          flex: isMobile ? '1 1 100%' : '1 1 350px', 
          width: '100%' 
        }}>
          {selectedZone ? (
            <div className="card fade-in" style={{ 
              padding: isMobile ? '1.25rem' : '2rem', 
              height: '100%', 
              border: '1px solid var(--gold)' 
            }}>
              {(() => {
                const z = analysis.find(z => z.id === selectedZone)!
                return (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <h2 style={{ margin: 0, color: 'var(--text-gold)', fontSize: isMobile ? '1.4rem' : '1.8rem' }}>{z.name} ({z.id})</h2>
                      <span className="badge badge-gold" style={{ padding: '0.4rem 1rem' }}>Score: {z.score}</span>
                    </div>
                    <div style={{ margin: '1rem 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      <strong>Attribute:</strong> {z.quality}
                    </div>
                    <div className="divider" style={{ margin: '1rem 0' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Zonal Lord</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ fontSize: '1.2rem' }}>{z.rulingPlanet?.dignity === 'exalted' ? '💎' : '🪐'}</span>
                          <span style={{ fontWeight: 600 }}>{GRAHA_NAMES[z.ruling as GrahaId]}</span>
                          <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>({z.rulingPlanet?.dignity || 'Neutral'})</span>
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Chart Occupants</div>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {z.occupants.map(o => <span key={o.id} className="badge badge-accent">{o.id}</span>)}
                          {z.occupants.length === 0 && <span style={{ opacity: 0.4, fontSize: '0.8rem' }}>No planets in this segment</span>}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Remedy</div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
                          {z.score < 50 ? `Balance with ${z.element} elemental markers. Perform ${GRAHA_NAMES[z.ruling as GrahaId]} Shanti.` : `Ideal spot for ${z.id.includes('N') ? 'financial' : 'creative'} activity.`}
                        </p>
                      </div>
                    </div>
                  </>
                )
              })()}
            </div>
          ) : (
            <div className="card" style={{ padding: '2rem', textAlign: 'center', opacity: 0.6, display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', minHeight: '200px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🧭</div>
              <h3 style={{ fontSize: '1.2rem' }}>Select a Zone on the Compass</h3>
              <p style={{ fontSize: '0.9rem' }}>Click any segment to view detailed astral-spatial correlations and remedial measures.</p>
            </div>
          )}
        </div>
      </section>

      {/* Detailed Insights Tabs */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        
        {/* Room Usage Guide */}
        <div className="card" style={{ padding: isMobile ? '1.25rem' : '2rem' }}>
          <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-gold)', fontSize: isMobile ? '1.1rem' : '1.3rem' }}>
            🏠 Global Room Usage Guide
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { room: 'Kitchen', best: 'SE, NW', desc: 'Focus on Fire & Transformation' },
              { room: 'Bedroom', best: 'SW, S', desc: 'Earth energy for stability' },
              { room: 'Living Room', best: 'E, NE, N', desc: 'Air & Water for social flow' },
              { room: 'Storage/Toilet', best: 'SSW, WNW', desc: 'Ideal for disposal/expenditure' },
              { room: 'Pooja/Study', best: 'NE, N', desc: 'Concentrated Wisdom zone' },
            ].map(r => (
              <div key={r.room} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--surface-3)', borderRadius: '10px' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{r.room}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.desc}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-gold)', fontWeight: 700 }}>{r.best}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--teal)' }}>Auspicious</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Color Therapy & Interior Design */}
        <div className="card" style={{ padding: isMobile ? '1.25rem' : '2rem' }}>
          <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-gold)', fontSize: isMobile ? '1.1rem' : '1.3rem' }}>
            🎨 Zonal Color Therapy
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(4, 1fr)', gap: '1rem' }}>
            {[
              { zone: 'N', color: '#3182ce', name: 'Blue' },
              { zone: 'E', color: '#38a169', name: 'Green' },
              { zone: 'S', color: '#e53e3e', name: 'Red' },
              { zone: 'W', color: '#edf2f7', name: 'White' },
              { zone: 'NE', color: '#ebf8ff', name: 'Sky Bl' },
              { zone: 'SE', color: '#fbd38d', name: 'Orange' },
              { zone: 'SW', color: '#ecc94b', name: 'Yellow' },
              { zone: 'NW', color: '#cbd5e0', name: 'Grey' },
            ].map(c => (
              <div key={c.zone} style={{ textAlign: 'center' }}>
                <div style={{ width: '100%', aspectRatio: '1', background: c.color, borderRadius: '50%', border: '4px solid var(--surface-3)', boxShadow: '0 4px 10px rgba(0,0,0,0.2)', marginBottom: '0.5rem' }} />
                <div style={{ fontSize: '0.7rem', fontWeight: 600 }}>{c.zone}</div>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{c.name}</div>
              </div>
            ))}
          </div>
          <p style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4, fontStyle: 'italic' }}>
            Applying these colors in your interior decor helps balance the corresponding planetary energies in your horoscope.
          </p>
        </div>
      </section>

      {/* Advanced Logic Sections */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        
        {/* Dig Bala (Directional Strength) Analysis */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: 'var(--text-gold)' }}>
             <span>📐</span> Dig Bala (Directional Strength)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
             {[
               { planet: 'Ju', dir: 'East (1H)', label: 'Jupiter' },
               { planet: 'Su', dir: 'South (10H)', label: 'Sun' },
               { planet: 'Sa', dir: 'West (7H)', label: 'Saturn' },
               { planet: 'Mo', dir: 'North (4H)', label: 'Moon' },
             ].map(d => {
               const p = grahas.find(g => g.id === d.planet)!
               // Simplified Dig Bala check: check if it's near its preferred bhava
               // This is a complex engine calc, but we can visualize the potential
               return (
                 <div key={d.planet} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem', borderBottom: '1px solid var(--border-soft)' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="badge badge-accent">{p.id}</span>
                      <span style={{ fontSize: '0.85rem' }}>{d.label}</span>
                   </div>
                   <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Optimum: {d.dir}</div>
                 </div>
               )
             })}
          </div>
        </div>

        {/* Vastu Purusha Deities (Devatas) Insights */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: 'var(--text-gold)' }}>
             <span>🙏</span> Deity (Devatā) Highlights
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
             {[
               { node: 'NE', deity: 'Ishana', planet: 'Ju', desc: 'Inner Wisdom & Health' },
               { node: 'SE', deity: 'Agni',   planet: 'Ve', desc: 'Cash Flow & Fire' },
               { node: 'SW', deity: 'Nirriti', planet: 'Ra', desc: 'Stability & Lineage' },
             ].map(d => {
               const p = grahas.find(g => g.id === d.planet)!
               const isStrong = p.dignity === 'exalted' || p.dignity === 'own'
               return (
                 <div key={d.deity} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <div>
                     <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{d.deity} Segment</div>
                     <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{d.desc}</div>
                   </div>
                   <div style={{ color: isStrong ? 'var(--teal)' : 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 700 }}>
                     {isStrong ? 'Propitious' : 'Average'}
                   </div>
                 </div>
               )
             })}
          </div>
        </div>

        {/* Element Balance Radar */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: 'var(--text-gold)' }}>
             <span>🌊</span> Elemental Equilibrium
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {['Water', 'Air', 'Fire', 'Earth', 'Space'].map(elem => {
              const count = analysis.filter(z => z.element === elem).reduce((acc, z) => acc + (z.occupants.length + (z.score / 20)), 0)
              const percentage = Math.min(100, (count / 15) * 100)
              return (
                <div key={elem}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                    <span>{elem}</span>
                    <span>{Math.round(percentage)}%</span>
                  </div>
                  <div style={{ height: '4px', background: 'var(--surface-3)', borderRadius: '2px' }}>
                    <div style={{ height: '100%', width: `${percentage}%`, background: 'var(--gold)', borderRadius: '2px' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </section>
      
      {/* Even More Advanced Insights */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        
        {/* House Facing Compatibility */}
        <div className="card" style={{ padding: isMobile ? '1.25rem' : '2rem', border: '1px solid var(--accent)' }}>
           <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--accent)', fontSize: isMobile ? '1.1rem' : '1.3rem' }}>
             <span>🧭</span> Personalized House Facing
           </h3>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
             {(() => {
                const lagnaRashi = chart.lagnas.ascRashi
                const facing = lagnaRashi % 4 === 1 ? 'East' : lagnaRashi % 4 === 2 ? 'South' : lagnaRashi % 4 === 3 ? 'West' : 'North'
                return (
                  <div style={{ padding: '1.25rem', background: 'var(--surface-3)', borderRadius: '12px', border: '1px solid var(--accent-glow)' }}>
                     <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Best Facing for you</div>
                     <div style={{ fontSize: '1.8rem', fontWeight: 600, color: 'var(--accent)' }}>{facing}-Facing</div>
                     <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                       Based on your {RASHI_NAMES[lagnaRashi as Rashi]} Ascendant, a {facing} oriented property resonates best with your bio-rhythm.
                     </p>
                  </div>
                )
             })()}
             <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--text-primary)' }}>Why?</strong> Facing logic ensures your individual energy aligns with the magnetic pull of the earth at your time of birth.
             </div>
           </div>
        </div>

        {/* Anatomical Vastu Purusha */}
        <div className="card" style={{ padding: isMobile ? '1.25rem' : '2rem' }}>
           <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-gold)', fontSize: isMobile ? '1.1rem' : '1.3rem' }}>
             <span>🧘</span> Anatomical Vāstu
           </h3>
           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                 {['Head', 'Heart', 'Abdomen', 'Feet'].map(part => (
                   <div key={part} style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem', background: 'var(--surface-2)', borderRadius: '6px' }}>{part}</div>
                 ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                 <div style={{ fontSize: '0.85rem', color: 'var(--text-gold)' }}>→ North-East (NE)</div>
                 <div style={{ fontSize: '0.85rem', color: 'var(--text-gold)' }}>→ Center (Brahma)</div>
                 <div style={{ fontSize: '0.85rem', color: 'var(--text-gold)' }}>→ North/East</div>
                 <div style={{ fontSize: '0.85rem', color: 'var(--text-gold)' }}>→ South-West (SW)</div>
              </div>
           </div>
           <p style={{ marginTop: '1rem', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              Avoid heavy weights in NE (Head) and keep SW (Feet) firm and non-porous.
           </p>
        </div>

        {/* Zonal Object Remedies Library */}
        <div className="card" style={{ padding: isMobile ? '1.25rem' : '2rem' }}>
           <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-gold)', fontSize: isMobile ? '1.1rem' : '1.3rem' }}>
             <span>🐚</span> Vāstu Objects & Remedies
           </h3>
           <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              {[
                { obj: 'Water Fountain', zone: 'N, NE' },
                { obj: 'Plants/Wood', zone: 'E, ENE' },
                { obj: 'Brass Items', zone: 'S, SE' },
                { obj: 'Lead/Heavy Stone', zone: 'SW' },
                { obj: 'Iron/Steel', zone: 'W' },
                { obj: 'Crystals', zone: 'Center' },
              ].map(item => (
                <div key={item.obj} style={{ padding: '0.5rem 0.8rem', background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.8rem' }}>
                   <span style={{ fontWeight: 600 }}>{item.obj}</span>
                   <span style={{ color: 'var(--text-gold)', marginLeft: '0.5rem' }}>{item.zone}</span>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* Heatmap and Strategic Matrix */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        
        {/* Zonal Potency Heatmap */}
        <div className="card" style={{ padding: '2rem' }}>
           <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-gold)' }}>
             <span>🔥</span> Zonal Potency Heatmap
           </h3>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {analysis.slice(0, 8).map(z => (
                <div key={z.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                   <div style={{ width: 40, fontSize: '0.7rem', fontWeight: 800 }}>{z.id}</div>
                   <div style={{ flex: 1, height: 10, background: 'var(--surface-3)', borderRadius: 5, overflow: 'hidden' }}>
                      <div style={{ 
                        height: '100%', 
                        width: `${z.score}%`, 
                        background: `linear-gradient(90deg, ${z.score > 70 ? 'var(--teal)' : z.score < 40 ? 'var(--rose)' : 'var(--gold)'} 0%, transparent 100%)`,
                        opacity: 0.8
                      }} />
                   </div>
                   <div style={{ width: 40, fontSize: '0.7rem', textAlign: 'right' }}>{z.score}%</div>
                </div>
              ))}
           </div>
           <p style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Heatmap indicates relative energy saturation. Zones with &gt;75% are your &quot;Power Corridors&quot;.
           </p>
        </div>

        {/* Strategic Activity Matrix */}
        <div className="card" style={{ padding: '2rem' }}>
           <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-gold)' }}>
             <span>🎯</span> Strategic Activity Matrix
           </h3>
           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {[
                { activity: 'Office/Work', best: 'N, W, SW', icon: '💻' },
                { activity: 'Meditation', best: 'NE, Center', icon: '🧘' },
                { activity: 'Exercise/Gym', best: 'S, SE', icon: '🏋️' },
                { activity: 'Sleep/Rest', best: 'SW, S', icon: '🛌' },
                { activity: 'Children Study', best: 'W, WNW', icon: '📚' },
                { activity: 'Dining', best: 'W', icon: '🍽' },
              ].map(a => (
                <div key={a.activity} style={{ padding: '1rem', background: 'var(--surface-2)', borderRadius: '12px', border: '1px solid var(--border-soft)' }}>
                   <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>{a.icon}</div>
                   <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{a.activity}</div>
                   <div style={{ fontSize: '0.75rem', color: 'var(--text-gold)', marginTop: '0.2rem' }}>Zone: {a.best}</div>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* Opposite Hit Analysis (Veedhi Shoola Logic) */}
      <section className="card" style={{ padding: isMobile ? '1.25rem' : '2rem', borderLeft: '5px solid var(--rose)' }}>
         <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--rose)', fontSize: isMobile ? '1.1rem' : '1.3rem' }}>
           <span>⚔</span> Opposite Axis Conflict (Hit Analysis)
         </h3>
         <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {(() => {
               // Logic to check if opposites have conflicting planets
               const opposites = [['N','S'], ['E','W'], ['NE','SW'], ['SE','NW']]
               return opposites.map(([a,b]) => {
                  const za = analysis.find(z => z.id === a)!
                  const zb = analysis.find(z => z.id === b)!
                  const conflict = (za.score > 70 && zb.score < 30) || (za.score < 30 && zb.score > 70)
                  return (
                    <div key={a+b} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: conflict ? 'rgba(224,123,142,0.1)' : 'var(--surface-3)', borderRadius: '8px' }}>
                       <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{a} ⟷ {b} Axis</div>
                       <div style={{ fontSize: '0.8rem', color: conflict ? 'var(--rose)' : 'var(--teal)' }}>
                          {conflict ? '⚡ Internal Tension - Align Elements' : '✅ Balanced Axis'}
                       </div>
                    </div>
                  )
               })
            })()}
         </div>
      </section>

      {/* 45 Deities Analysis & Remedy Priorities */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        
        {/* 45 Deities (Devatas) Grid Analysis */}
        <div className="card" style={{ padding: isMobile ? '1.25rem' : '2rem', gridColumn: '1 / -1' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', marginBottom: '2rem', flexDirection: isMobile ? 'column' : 'row', gap: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-gold)', fontSize: isMobile ? '1.1rem' : '1.3rem' }}>
                  <span>💠</span> 45 Deities (Vastu Mandala)
                </h3>
                <p style={{ margin: '0.4rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Interactive 81-pada grid (Ekashitipada) showing internal energy fields and planetary hits.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.7rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><span style={{ width: 8, height: 8, background: 'var(--teal)', borderRadius: 2 }}></span> Blessed</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><span style={{ width: 8, height: 8, background: 'var(--rose)', borderRadius: 2 }}></span> Afflicted</span>
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'var(--surface-3)', padding: '4px 10px', borderRadius: '4px', border: '1px solid var(--border-soft)' }}>EKASHITI PADA</span>
              </div>
           </div>
           
           <div style={{ 
              display: 'flex', 
              flexDirection: isMobile ? 'column' : 'row', 
              gap: isMobile ? '1.5rem' : '3rem', 
              alignItems: 'start' 
           }}>
              {/* Mandala SVG Grid */}
              <div style={{ 
                position: 'relative', 
                width: '100%', 
                maxWidth: isMobile ? '400px' : '550px', 
                margin: '0 auto', 
                aspectRatio: '1' 
              }}>
                 <svg viewBox="0 0 90 90" style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 10px 25px rgba(0,0,0,0.3))' }}>
                    {(() => {
                      return (
                        <>
                          {/* 81 Padas Grid (Background) */}
                          <defs>
                            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="var(--border-soft)" strokeWidth="0.1"/>
                            </pattern>
                          </defs>
                          <rect width="90" height="90" fill="url(#grid)" stroke="var(--border)" strokeWidth="0.5" />

                          {/* Deity Cells */}
                          {DEITY_MAP.map(d => {
                            const hits = grahas.filter(p => {
                              const angle = ((p.rashi - 1) * 30 + p.degree) % 360
                              if (d.center) return false // Brahma is special
                              if (d.ang[0] > d.ang[1]) { // Handles crossing 360/0
                                return angle >= d.ang[0] || angle < d.ang[1]
                              }
                              return angle >= d.ang[0] && angle < d.ang[1]
                            })
                            const maleficHit = hits.some(h => ['Sa', 'Ra', 'Ke', 'Ma'].includes(h.id))
                            const beneficHit = hits.some(h => ['Ju', 'Ve', 'Mo', 'Me'].includes(h.id))
                            const isActive = selectedDeity === d.id
                            
                            let color = 'transparent'
                            if (maleficHit) color = 'var(--rose)'
                            else if (beneficHit) color = 'var(--teal)'
                            else if (d.center) color = 'var(--gold)'

                            return (
                              <g 
                                key={d.id} 
                                style={{ cursor: 'pointer' }}
                                onClick={() => setSelectedDeity(d.id)}
                              >
                                <rect 
                                  x={d.x * 10} y={d.y * 10} 
                                  width={d.w * 10} height={d.h * 10}
                                  fill={color}
                                  fillOpacity={isActive ? 0.3 : color === 'transparent' ? 0 : 0.15}
                                  stroke={isActive ? 'var(--gold)' : 'var(--border-soft)'}
                                  strokeWidth={isActive ? 0.8 : 0.2}
                                  style={{ transition: 'all 0.2s' }}
                                />
                                {d.w >= 1 && d.h >= 1 && (
                                  <text 
                                    x={d.x * 10 + (d.w * 5)} 
                                    y={d.y * 10 + (d.h * 5)} 
                                    fontSize={d.center ? '4' : '2.2'} 
                                    textAnchor="middle" 
                                    dominantBaseline="middle"
                                    fill={isActive ? 'var(--text-gold)' : 'var(--text-muted)'}
                                    fontWeight={d.center ? 800 : (isActive || maleficHit || beneficHit ? 700 : 400)}
                                    style={{ pointerEvents: 'none', transition: 'all 0.2s' }}
                                  >
                                    {d.name.substring(0, 10)}
                                  </text>
                                )}
                                {hits.length > 0 && (
                                  <circle 
                                    cx={d.x * 10 + (d.w * 10) - 2} 
                                    cy={d.y * 10 + 2} 
                                    r="1.2" 
                                    fill={maleficHit ? 'var(--rose)' : 'var(--teal)'} 
                                  />
                                )}
                              </g>
                            )
                          })}
                        </>
                      )
                    })()}
                 </svg>
              </div>

              {/* Deity Detail Panel */}
              <div className="card fade-in" style={{ 
                padding: isMobile ? '1.25rem' : '1.5rem', 
                background: 'var(--surface-2)', 
                border: '1px solid var(--border)', 
                width: '100%',
                minHeight: isMobile ? 'auto' : '350px' 
              }}>
                {selectedDeity ? (
                  (() => {
                    const DEITY_DESC: Record<string, string> = {
                      brahma: 'The Absolute Consciousness. Ruling of Center. Anchor for all energy.',
                      shikhi: 'The point where idea becomes a thought. Pure creative impulse.',
                      parjanya: 'The rain-giver. Fertilty and creation of life.',
                      jayant: 'Victorious. Provides momentum to win and succeed.',
                      indra: 'The King. Management, administration and skill.',
                      surya: 'Solar power. Integrity, social connection, and visibility.',
                      satya: 'Truth. Goodwill and social reputation.',
                      bhrisha: 'The power of focus. Thinking and execution.',
                      antariksh: 'Inner space. Spiritual realization.',
                      agni: 'Transformation. Cash flow and confidence.',
                      pusha: 'Nutrient. Power to nourish and progress.',
                      vitatha: 'The power of pretending. Use for marketing or acting.',
                      grihakshat: 'The limit-setter. Managing household and boundaries.',
                      yama: 'Upholder of Dharma. Rule, order, and social duty.',
                      gandharv: 'Cosmic music. Bliss, relaxation and entertainment.',
                      bhringraj: 'Discriminator. Sorting what is needed and what is not.',
                      mrigha: 'The seeker. Seeking knowledge and curiosity.',
                      pitru: 'The portal to ancestors. Stability, lineage, and root energy.',
                      dauvarik: 'Gatekeeper. Filters who enters your life/business.',
                      sugriv: 'Friend with a good neck. Supportive contacts and networking.',
                      pushpadant: 'The blossom of teeth. Financial growth and success.',
                      varun: 'God of cosmic waters. Oversight of all contracts and promises.',
                      asur: 'The depth of darkness. Secrecy and internal strength.',
                      shosh: 'The power of drying out. Removes stagnation and heals depression.',
                      papiyaksha: 'The accumulation of wrong-doings. Mental blocks.',
                      roga: 'Healing. The point where sickness is overcome.',
                      naga: 'Connectivity. The desire to reach and interact.',
                      mukhya: 'The Main door energy. Direction and purpose.',
                      bhallat: 'The power of abundance. Financial gains and health.',
                      soma: 'Moon energy. Refreshment and the container of bliss (Soma).',
                      bhujag: 'Mental strength. Power of endurance.',
                      aditi: 'Mother of Gods. Security and protection.',
                      diti: 'The splitter. Power to separate and choose.',
                      apah: 'Healing water. Immunity and health.',
                      apah_vatsa: 'The carrier. Carrying ideas into manifestation.',
                      aryama: 'The noble. Patron of marriage and support.',
                      savita: 'The stimulator. Starting new things.',
                      savitra: 'The radiator. Spreading awareness.',
                      vivaswan: 'The expansive. Social reach and growth.',
                      indra_inner: 'Executive power. Managing internal affairs.',
                      jaya: 'Success in skills. Mastering a craft.',
                      mitra: 'The friend. Universal friendship and calm.',
                      rudra: 'The transformer. Healing and destruction of old patterns.',
                      rajayakshma: 'The consumption. Enjoyment of luxury.',
                      prithvi_dhara: 'The foundation. Support and structure.',
                    }
                    // Fetch deity info from the map logic (duplicated here for UI logic but could be refactored)
                    const d = selectedDeity // This is just the ID
                    const name = selectedDeity.charAt(0).toUpperCase() + selectedDeity.slice(1).replace('_', ' ')
                    
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ padding: '4px 10px', background: 'var(--gold-faint)', color: 'var(--text-gold)', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Devatā Detail</div>
                            {selectedDeity === 'brahma' && <span style={{ fontSize: '1.2rem' }}>☀️</span>}
                         </div>
                         
                         <div>
                            <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', color: 'var(--text-primary)', fontSize: '1.8rem' }}>{name}</h2>
                            <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                              {DEITY_DESC[d] || 'A vital energy field in the Vāstu Mandala representing specific cosmic attributes and psychographic influences.'}
                            </p>
                         </div>

                         <div className="divider" style={{ opacity: 0.1 }} />

                         <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                               <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Planetary Hit Analysis</div>
                               {(() => {
                                  const deityData = DEITY_MAP.find(dm => dm.id === d)
                                  if (!deityData) return null
                                  
                                  const hits = grahas.filter(p => {
                                     const angle = ((p.rashi - 1) * 30 + p.degree) % 360
                                     if (deityData.center) return false
                                     if (deityData.ang[0] > deityData.ang[1]) {
                                        return angle >= deityData.ang[0] || angle < deityData.ang[1]
                                     }
                                     return angle >= deityData.ang[0] && angle < deityData.ang[1]
                                  })

                                  const maleficHits = hits.filter(h => ['Sa', 'Ra', 'Ke', 'Ma'].includes(h.id))
                                  const beneficHits = hits.filter(h => ['Ju', 'Ve', 'Mo', 'Me'].includes(h.id))
                                  
                                  return (
                                     <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {maleficHits.map(h => (
                                          <span key={h.id} className="badge badge-rose" style={{ background: 'var(--rose-faint)', color: 'var(--rose)', border: '1px solid var(--rose)' }}>⚠ Afflicted: {h.name}</span>
                                        ))}
                                        {beneficHits.map(h => (
                                          <span key={h.id} className="badge badge-teal" style={{ background: 'var(--teal-faint)', color: 'var(--teal)', border: '1px solid var(--teal)' }}>✓ Blessed: {h.name}</span>
                                        ))}
                                        {hits.length === 0 && (
                                          <span className="badge badge-accent" style={{ background: 'var(--teal-faint)', color: 'var(--teal)', border: '1px solid var(--teal)' }}>✓ No Malefic Affliction</span>
                                        )}
                                     </div>
                                  )
                               })()}
                            </div>

                            <div>
                               <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Manifestation</div>
                               <div style={{ padding: '0.8rem', background: 'var(--surface-3)', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                  {selectedDeity === 'agni' ? 'Ensures steady wealth and digestion.' : selectedDeity === 'pitru' ? 'Provides family roots and progeny.' : 'Maintains zonal equilibrium.'}
                                </div>
                            </div>
                         </div>
                      </div>
                    )
                  })()
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', opacity: 0.4 }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💠</div>
                    <p style={{ fontSize: '1rem', fontWeight: 300, maxWidth: '200px' }}>Select a deity on the grid to see detailed properties.</p>
                  </div>
                )}
              </div>
           </div>
        </div>

        {/* Priority Remedy Checklist */}
        <div className="card" style={{ padding: isMobile ? '1.25rem' : '2rem' }}>
           <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-gold)', fontSize: isMobile ? '1.1rem' : '1.3rem' }}>
             <span>⚡</span> Remedial Priority List
           </h3>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[...analysis].filter(a => a.score < 45).sort((a,b) => a.score - b.score).slice(0, 5).map((z, idx) => (
                <div key={z.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1rem', background: 'var(--surface-3)', borderRadius: '12px' }}>
                   <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--rose)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{idx+1}</div>
                   <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>Fix {z.name} ({z.id})</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Low Energy: {z.score}%. High impact on {z.quality}.</div>
                   </div>
                   <div style={{ fontSize: '0.65rem', padding: '4px 8px', background: 'rgba(224,123,142,0.1)', color: 'var(--rose)', borderRadius: '4px', fontWeight: 700 }}>HIGH PRIORITY</div>
                </div>
              ))}
              {analysis.every(a => a.score >= 45) && (
                <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.5 }}>
                   🏆 No High-Priority Remedial actions required. Your space and chart are in harmony.
                </div>
              )}
           </div>
        </div>

      </section>

      {/* Wealth & Health Focus Zones */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        
        {/* Wealth & Cash Flow Optimizer */}
        <div className="card-gold" style={{ padding: isMobile ? '1.25rem' : '2rem' }}>
           <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: isMobile ? '1.1rem' : '1.3rem' }}>
             <span>💰</span> Financial Vāstu Focus
           </h3>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { zone: 'North', focus: 'New Opportunities', planet: 'Mercury', icon: '🌊' },
                { zone: 'South-East', focus: 'Cash Flow & Liquidity', planet: 'Venus', icon: '🔥' },
                { zone: 'West', focus: 'Profits & Gains', planet: 'Saturn', icon: '⛰' },
              ].map(f => {
                const z = analysis.find(zone => zone.name.includes(f.zone))
                if (!z) return null
                return (
                  <div key={f.zone} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(201,168,76,0.2)' }}>
                     <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{f.zone} {f.icon}</div>
                        <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>{f.focus}</div>
                     </div>
                     <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: z.score > 60 ? 'var(--teal)' : 'var(--rose)' }}>{z.score}% Power</div>
                        <div style={{ fontSize: '0.6rem', opacity: 0.6 }}>Lord: {f.planet}</div>
                     </div>
                  </div>
                )
              })}
           </div>
        </div>

        {/* Health & Vitality Monitor */}
        <div className="card" style={{ padding: isMobile ? '1.25rem' : '2rem', border: '1px solid var(--teal)' }}>
           <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--teal)', fontSize: isMobile ? '1.1rem' : '1.3rem' }}>
             <span>🏥</span> Health & Vitality Vāstu
           </h3>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { zone: 'North-East', focus: 'Mental Clarity', planet: 'Jupiter', val: 'Immunity' },
                { zone: 'North-North-East', focus: 'Healing & Support', planet: 'Jupiter', val: 'Health' },
                { zone: 'East', focus: 'Social Connection', planet: 'Sun', val: 'Vitality' },
              ].map(f => {
                const z = analysis.find(zone => zone.name === f.zone)
                if (!z) return null
                return (
                  <div key={f.zone} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-soft)' }}>
                     <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{f.zone}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{f.focus}</div>
                     </div>
                     <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{f.val}</div>
                        <div style={{ fontSize: '0.7rem', color: z.score > 50 ? 'var(--teal)' : 'var(--rose)' }}>{z.score > 50 ? 'Stable' : 'Unbalanced'}</div>
                     </div>
                  </div>
                )
              })}
           </div>
        </div>

        {/* Zonal Nakshatras Mapping */}
        <div className="card" style={{ padding: '2rem' }}>
           <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-gold)' }}>
             <span>✨</span> Zonal Nakshatras
           </h3>
           <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {[
                { dir: 'N', star: 'Ashwini, Bharani' },
                { dir: 'NE', star: 'Rohini, Mrig' },
                { dir: 'E', star: 'Ardra, Punar' },
                { dir: 'SE', star: 'Pushya, Ashl' },
                { dir: 'S', star: 'Magha, PPhal' },
                { dir: 'SW', star: 'UPhal, Hasta' },
                { dir: 'W', star: 'Chitra, Swati' },
                { dir: 'NW', star: 'Vishakha, Anu' },
              ].map(n => (
                <div key={n.dir} style={{ padding: '0.5rem', background: 'var(--surface-3)', borderRadius: '8px', flex: '1 1 120px' }}>
                   <div style={{ fontSize: '0.7rem', color: 'var(--text-gold)', fontWeight: 800 }}>{n.dir}</div>
                   <div style={{ fontSize: '0.65rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.star}</div>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* Relationship, Skills & Guardians */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        
        {/* Relationship & Skill Mastery */}
        <div className="card" style={{ padding: isMobile ? '1.25rem' : '2rem', border: '1px solid var(--rose)' }}>
           <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--rose)', fontSize: isMobile ? '1.1rem' : '1.3rem' }}>
             <span>💞</span> Relationships & Skills
           </h3>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              {[
                { zone: 'South-West', focus: 'Stability & Marriage', lord: 'Rahu/Pitru' },
                { zone: 'West-South-West', focus: 'Skills & Education', lord: 'Saturn' },
                { zone: 'East-North-East', focus: 'Social Fun & Joy', lord: 'Sun' },
              ].map(f => {
                const z = analysis.find(zone => zone.name === f.zone)
                if (!z) return null
                return (
                  <div key={f.zone}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                       <span style={{ fontWeight: 600 }}>{f.zone}</span>
                       <span style={{ color: z.score > 55 ? 'var(--teal)' : 'var(--rose)' }}>{z.score}% Mastery</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{f.focus} — Ruled by {f.lord}</div>
                    <div style={{ height: '4px', background: 'var(--surface-3)', borderRadius: '2px', marginTop: '4px' }}>
                       <div style={{ height: '100%', width: `${z.score}%`, background: 'var(--rose)', borderRadius: '2px', opacity: 0.6 }} />
                    </div>
                  </div>
                )
              })}
           </div>
        </div>

        {/* Ashta Dikpalas (Directional Guardians) */}
        <div className="card" style={{ padding: '2rem' }}>
           <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-gold)' }}>
             <span>🛡️</span> Ashta Dikpālas (Guardians)
           </h3>
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              {[
                { dir: 'N', deity: 'Kubera', power: 'Wealth' },
                { dir: 'NE', deity: 'Ishana', power: 'Wisdom' },
                { dir: 'E', deity: 'Indra', power: 'Kingship' },
                { dir: 'SE', deity: 'Agni', power: 'Energy' },
                { dir: 'S', deity: 'Yama', power: 'Dharma' },
                { dir: 'SW', deity: 'Nirriti', power: 'Stability' },
                { dir: 'W', deity: 'Varuna', power: 'Waters' },
                { dir: 'NW', deity: 'Vayu', power: 'Speed' },
              ].map(d => (
                <div key={d.dir} style={{ padding: '0.5rem', borderBottom: '1px solid var(--border-soft)' }}>
                   <div style={{ fontSize: '0.75rem', fontWeight: 800 }}>{d.dir}: {d.deity}</div>
                   <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Power: {d.power}</div>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* Property Executive Summary Report */}
      <section className="card-gold" style={{ padding: isMobile ? '1.5rem' : '2.5rem', borderRadius: 'var(--r-lg)' }}>
         <div style={{ 
           display: 'flex', 
           justifyContent: 'space-between', 
           alignItems: isMobile ? 'flex-start' : 'center', 
           marginBottom: '2rem',
           flexDirection: isMobile ? 'column' : 'row',
           gap: '1rem' 
         }}>
            <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: isMobile ? '1.5rem' : '2rem' }}>Property Potential Analysis</h2>
            <div className="badge badge-gold" style={{ padding: isMobile ? '6px 12px' : '10px 20px', fontSize: isMobile ? '0.85rem' : '1rem' }}>Overall Grade: {analysis.length > 0 ? (analysis.reduce((acc,z) => acc + (z?.score || 0), 0) / analysis.length > 70 ? 'A+' : 'B') : 'N/A'}</div>
         </div>
         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: isMobile ? '2rem' : '3rem' }}>
            <div style={{ borderRight: isMobile ? 'none' : '1px solid rgba(201,168,76,0.2)', paddingBottom: isMobile ? '1.5rem' : 0, borderBottom: isMobile ? '1px solid rgba(201,168,76,0.1)' : 'none' }}>
               <h4 style={{ textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.1em', marginBottom: '0.75rem', color: 'var(--text-gold)' }}>Primary Strength</h4>
               <p style={{ fontSize: isMobile ? '0.95rem' : '1.1rem', fontWeight: 300, lineHeight: 1.5 }}>
                 The <strong>{[...analysis].sort((a,b)=>b.score-a.score)[0]?.name}</strong> zone is your strongest asset. This creates a natural resonance for success in {[...analysis].sort((a,b)=>b.score-a.score)[0]?.quality}.
               </p>
            </div>
            <div style={{ paddingBottom: isMobile ? '1.5rem' : 0, borderBottom: isMobile ? '1px solid rgba(201,168,76,0.1)' : 'none' }}>
               <h4 style={{ textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.1em', marginBottom: '0.75rem', color: 'var(--rose)' }}>Primary Weakness</h4>
               <p style={{ fontSize: isMobile ? '0.95rem' : '1.1rem', fontWeight: 300, lineHeight: 1.5 }}>
                  The <strong>{[...analysis].sort((a,b)=>a.score-b.score)[0]?.name}</strong> area shows significant depletion. This may manifest as issues in {[...analysis].sort((a,b)=>a.score-b.score)[0]?.quality}.
               </p>
            </div>
            <div style={{ borderLeft: isMobile ? 'none' : '1px solid rgba(201,168,76,0.2)' }}>
               <h4 style={{ textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.1em', marginBottom: '0.75rem', color: 'var(--teal)' }}>Key Recommendation</h4>
               <p style={{ fontSize: isMobile ? '0.95rem' : '1.1rem', fontWeight: 300, lineHeight: 1.5 }}>
                 Focus on activating the <strong>{bestEntrance.name}</strong> corridor and balancing the <strong>{analysis.find(z=>z.id === 'NE')?.element}</strong> element in the North-East.
               </p>
            </div>
         </div>
         <div className="divider" style={{ margin: '2rem 0', opacity: 0.2 }} />
         <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
           © {new Array(1).fill(new Date().getFullYear())} Advanced Astro-Vāstu Engine. Generated based on Natal planetary longitudes and Zonal Dignity mapping.
         </p>
      </section>

      <div style={{ padding: '1rem', background: 'rgba(201,168,76,0.05)', borderRadius: 'var(--r-md)', border: '1px dashed var(--gold)', fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
          Note: Advanced Vastu mapping uses the 360° chart projection. Ensure your property compass is aligned with Magnetic North for accurate remedial deployment.
      </div>
    </div>
  )
}
