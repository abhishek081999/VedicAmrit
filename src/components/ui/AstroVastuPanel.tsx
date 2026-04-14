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
    const topZones = analysis
      .filter(z => ['N', 'E', 'W', 'S'].includes(z.id))
      .sort((a, b) => b.score - a.score)
    return topZones[0] || analysis[0]
  }, [analysis])

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', color: 'var(--text-primary)' }}>
      {/* Premium Header */}
      <section style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: '2rem', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '2.5rem', filter: 'drop-shadow(0 0 10px var(--gold))' }}>☸</span>
            <h1 style={{ margin: 0, fontSize: '2.8rem', fontWeight: 300, fontFamily: 'var(--font-display)' }}>Advanced Astro-Vāstu</h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '700px', marginBottom: '1.5rem' }}>
            A high-precision analysis integrating Mahavastu principles with your specific planetary strengths.
          </p>
          
          {/* Mode Toggle */}
          <div style={{ display: 'flex', background: 'var(--surface-3)', padding: '4px', borderRadius: '12px', width: 'fit-content', border: '1px solid var(--border-soft)' }}>
            <button 
              onClick={() => { setMode('8'); setSelectedZone(null); }}
              style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', border: 'none', background: mode === '8' ? 'var(--gold)' : 'transparent', color: mode === '8' ? 'var(--text-on-gold)' : 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 600, fontSize: '0.85rem' }}
            >
              8 Directions
            </button>
            <button 
              onClick={() => { setMode('16'); setSelectedZone(null); }}
              style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', border: 'none', background: mode === '16' ? 'var(--gold)' : 'transparent', color: mode === '16' ? 'var(--text-on-gold)' : 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 600, fontSize: '0.85rem' }}
            >
              16 Directions
            </button>
          </div>
        </div>
        
        <div className="card-gold hide-mobile" style={{ padding: '1.5rem', textAlign: 'center', minWidth: '180px' }}>
          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-gold)' }}>Analysis Grid</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{mode}-Kona</div>
        </div>
      </section>

      {/* 16 Zone Circular Visualization */}
      <section style={{ display: 'flex', gap: '3rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 450px', position: 'relative', display: 'flex', justifyContent: 'center' }}>
          <div className="vastu-compass-container" style={{ position: 'relative', width: '450px', height: '450px' }}>
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
               // 1. Calculate base positions
               let positioned = grahas.map(p => {
                 const baseAngle = ((p.rashi - 1) * 30 + (p.degree)) - 90
                 return { ...p, angle: baseAngle, r: 110 }
               })

               // 2. Sort by angle to handle sequential collisions
               positioned.sort((a,b) => a.angle - b.angle)

               // 3. Cumulative push logic
               for (let i = 0; i < positioned.length; i++) {
                 let stackCount = 0
                 for (let j = 0; j < i; j++) {
                    const angleDiff = Math.abs(positioned[i].angle - positioned[j].angle)
                    if (angleDiff < 6 || angleDiff > 354) {
                       stackCount++
                    }
                 }
                 positioned[i].r += (stackCount * 24) // Compact stacking to fit in 225px radius
               }

               return positioned.map(p => (
                 <div key={p.id} style={{
                   position: 'absolute', top: '50%', left: '50%',
                   transform: `rotate(${p.angle}deg) translateX(${p.r}px)`,
                   background: 'var(--surface-4)', borderRadius: '50%', width: '30px', height: '30px',
                   display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem',
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
        <div style={{ flex: '1 1 350px' }}>
          {selectedZone ? (
            <div className="card fade-in" style={{ padding: '2rem', height: '100%', border: '1px solid var(--gold)' }}>
              {(() => {
                const z = analysis.find(z => z.id === selectedZone)!
                return (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h2 style={{ margin: 0, color: 'var(--text-gold)' }}>{z.name} ({z.id})</h2>
                      <span className="badge badge-gold" style={{ padding: '0.4rem 1rem' }}>Score: {z.score}</span>
                    </div>
                    <div style={{ margin: '1rem 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      <strong>Attribute:</strong> {z.quality}
                    </div>
                    <div className="divider" />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Zonal Lord</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ fontSize: '1.2rem' }}>{z.rulingPlanet?.dignity === 'exalted' ? '💎' : '🪐'}</span>
                          <span style={{ fontWeight: 600 }}>{GRAHA_NAMES[z.ruling as GrahaId]}</span>
                          <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>({z.rulingPlanet?.dignity || 'Neutral'})</span>
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Chart Occupants</div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {z.occupants.map(o => <span key={o.id} className="badge badge-accent">{o.id}</span>)}
                          {z.occupants.length === 0 && <span style={{ opacity: 0.4, fontSize: '0.8rem' }}>No planets in this segment</span>}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Remedy</div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                          {z.score < 50 ? `Balance with ${z.element} elemental markers. Perform ${GRAHA_NAMES[z.ruling as GrahaId]} Shanti.` : `Ideal spot for ${z.id.includes('N') ? 'financial' : 'creative'} activity.`}
                        </p>
                      </div>
                    </div>
                  </>
                )
              })()}
            </div>
          ) : (
            <div className="card" style={{ padding: '2rem', textAlign: 'center', opacity: 0.6, display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🧭</div>
              <h3>Select a Zone on the Compass</h3>
              <p>Click any segment to view detailed astral-spatial correlations and remedial measures.</p>
            </div>
          )}
        </div>
      </section>

      {/* Detailed Insights Tabs */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        
        {/* Room Usage Guide */}
        <div className="card" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-gold)' }}>
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
        <div className="card" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-gold)' }}>
            🎨 Zonal Color Therapy
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
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
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        
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
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
        
        {/* House Facing Compatibility */}
        <div className="card" style={{ padding: '2rem', border: '1px solid var(--accent)' }}>
           <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--accent)' }}>
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
        <div className="card" style={{ padding: '2rem' }}>
           <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-gold)' }}>
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
        <div className="card" style={{ padding: '2rem' }}>
           <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-gold)' }}>
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
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        
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
      <section className="card" style={{ padding: '2rem', borderLeft: '5px solid var(--rose)' }}>
         <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--rose)' }}>
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
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2rem' }}>
        
        {/* 45 Deities (Devatas) Grid Analysis */}
        <div className="card" style={{ padding: '2rem' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-gold)' }}>
                <span>💠</span> 45 Deities (Vāstu Purusha Mandala)
              </h3>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'var(--surface-3)', padding: '2px 8px', borderRadius: '4px' }}>EKASHITI PADA</span>
           </div>
           
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '0.5rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {(() => {
                // Precise 45 Deity Mapping (Simplifying Square to 360-degree radial for dashboard)
                const DEITIES = [
                  { name: 'Shikhi', start: 33.75, end: 45, zone: 'NE' },
                  { name: 'Parjanya', start: 45, end: 56.25, zone: 'NE' },
                  { name: 'Jayant', start: 56.25, end: 67.5, zone: 'NE' },
                  { name: 'Indra', start: 67.5, end: 78.75, zone: 'E' },
                  { name: 'Surya', start: 78.75, end: 90, zone: 'E' },
                  { name: 'Satya', start: 90, end: 101.25, zone: 'E' },
                  { name: 'Bhrisha', start: 101.25, end: 112.5, zone: 'E' },
                  { name: 'Antariksh', start: 112.5, end: 123.75, zone: 'SE' },
                  { name: 'Agni', start: 123.75, end: 135, zone: 'SE' },
                  { name: 'Pusha', start: 135, end: 146.25, zone: 'SE' },
                  { name: 'Vitatha', start: 146.25, end: 157.5, zone: 'S' },
                  { name: 'Grihakshat', start: 157.5, end: 168.75, zone: 'S' },
                  { name: 'Yama', start: 168.75, end: 180, zone: 'S' },
                  { name: 'Gandharv', start: 180, end: 191.25, zone: 'S' },
                  { name: 'Bhringraj', start: 191.25, end: 202.5, zone: 'SW' },
                  { name: 'Mrigha', start: 202.5, end: 213.75, zone: 'SW' },
                  { name: 'Pitru', start: 213.75, end: 225, zone: 'SW' },
                  { name: 'Dauvarik', start: 225, end: 236.25, zone: 'W' },
                  { name: 'Sugriv', start: 236.25, end: 247.5, zone: 'W' },
                  { name: 'Pushpadant', start: 247.5, end: 258.75, zone: 'W' },
                  { name: 'Varun', start: 258.75, end: 270, zone: 'W' },
                  { name: 'Asur', start: 270, end: 281.25, zone: 'W' },
                  { name: 'Shosh', start: 281.25, end: 292.5, zone: 'NW' },
                  { name: 'Papiyaksha', start: 292.5, end: 303.75, zone: 'NW' },
                  { name: 'Roga', start: 303.75, end: 315, zone: 'NW' },
                  { name: 'Naga', start: 315, end: 326.25, zone: 'N' },
                  { name: 'Mukhya', start: 326.25, end: 337.5, zone: 'N' },
                  { name: 'Bhallat', start: 337.5, end: 348.75, zone: 'N' },
                  { name: 'Soma', start: 348.75, end: 360, zone: 'N' },
                  { name: 'Aditi', start: 0, end: 11.25, zone: 'N' },
                  { name: 'Diti', start: 11.25, end: 22.5, zone: 'NE' },
                  { name: 'Brahma', start: 0, end: 360, zone: 'Center' }, // Special handling for center
                ]

                return DEITIES.map(d => {
                  // Check for planetary hits in this deity's angle range
                  const hits = grahas.filter(p => {
                    const angle = (p.rashi - 1) * 30 + p.degree
                    if (d.name === 'Brahma') return false // Simplified
                    return angle >= d.start && angle < d.end
                  })

                  const maleficHit = hits.some(h => ['Sa', 'Ra', 'Ke', 'Ma'].includes(h.id))
                  const beneficHit = hits.some(h => ['Ju', 'Ve', 'Mo', 'Me'].includes(h.id))
                  
                  let status = 'Neutral'
                  let color = 'var(--text-muted)'
                  
                  if (maleficHit) { status = 'Afflicted'; color = 'var(--rose)' }
                  else if (beneficHit) { status = 'Blessed'; color = 'var(--teal)' }

                  return (
                    <div key={d.name} style={{ 
                      padding: '0.5rem', background: 'var(--surface-2)', borderRadius: '6px', 
                      border: `1px solid ${color === 'var(--text-muted)' ? 'var(--border-soft)' : color}`,
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '0.65rem', fontWeight: 800 }}>{d.name}</div>
                      <div style={{ fontSize: '0.55rem', color: color, marginTop: '2px' }}>{status}</div>
                    </div>
                  )
                })
              })()}
           </div>
           <p style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              Micro-analysis of internal energy fields. &quot;Afflicted&quot; indicates a malefic planet occupying that deity&apos;s specific degree segment.
           </p>
        </div>

        {/* Priority Remedy Checklist */}
        <div className="card" style={{ padding: '2rem' }}>
           <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-gold)' }}>
             <span>⚡</span> Remedial Priority List
           </h3>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {analysis.filter(a => a.score < 45).sort((a,b) => a.score - b.score).slice(0, 5).map((z, idx) => (
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
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        
        {/* Wealth & Cash Flow Optimizer */}
        <div className="card-gold" style={{ padding: '2rem' }}>
           <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
        <div className="card" style={{ padding: '2rem', border: '1px solid var(--teal)' }}>
           <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--teal)' }}>
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
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
        
        {/* Relationship & Skill Mastery */}
        <div className="card" style={{ padding: '2rem', border: '1px solid var(--rose)' }}>
           <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--rose)' }}>
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
      <section className="card-gold" style={{ padding: '2.5rem', borderRadius: 'var(--r-lg)' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '2rem' }}>Property Potential Analysis</h2>
            <div className="badge badge-gold" style={{ padding: '10px 20px', fontSize: '1rem' }}>Overall Grade: {analysis.reduce((acc,z) => acc+z.score, 0) / analysis.length > 70 ? 'A+' : 'B'}</div>
         </div>
         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '3rem' }}>
            <div style={{ borderRight: '1px solid rgba(201,168,76,0.2)' }}>
               <h4 style={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.1em', marginBottom: '1rem', color: 'var(--text-gold)' }}>Primary Strength</h4>
               <p style={{ fontSize: '1.1rem', fontWeight: 300, lineHeight: 1.5 }}>
                 The <strong>{analysis.sort((a,b)=>b.score-a.score)[0].name}</strong> zone is your strongest asset. This creates a natural resonance for success in {analysis.sort((a,b)=>b.score-a.score)[0].quality}.
               </p>
            </div>
            <div>
               <h4 style={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.1em', marginBottom: '1rem', color: 'var(--rose)' }}>Primary Weakness</h4>
               <p style={{ fontSize: '1.1rem', fontWeight: 300, lineHeight: 1.5 }}>
                  The <strong>{analysis.sort((a,b)=>a.score-b.score)[0].name}</strong> area shows significant depletion. This may manifest as issues in {analysis.sort((a,b)=>a.score-b.score)[0].quality}.
               </p>
            </div>
            <div style={{ borderLeft: '1px solid rgba(201,168,76,0.2)' }}>
               <h4 style={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.1em', marginBottom: '1rem', color: 'var(--teal)' }}>Key Recommendation</h4>
               <p style={{ fontSize: '1.1rem', fontWeight: 300, lineHeight: 1.5 }}>
                 Focus on activating the <strong>{bestEntrance.name}</strong> corridor and balancing the <strong>{analysis.find(z=>z.id === 'NE')?.element}</strong> element in the North-East.
               </p>
            </div>
         </div>
         <div className="divider" style={{ margin: '2rem 0', opacity: 0.2 }} />
         <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
           © {new Array(1).fill(new Date().getFullYear())} Advanced Astro-Vāstu Engine. Generated based on Natal planetary longitudes and Zonal Dignity mapping.
         </p>
      </section>

      <div style={{ padding: '1rem', background: 'rgba(201,168,76,0.05)', borderRadius: 'var(--r-md)', border: '1px dashed var(--gold)', fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
          Note: Advanced Vastu mapping uses the 360° chart projection. Ensure your property compass is aligned with Magnetic North for accurate remedial deployment.
      </div>
    </div>
  )
}
