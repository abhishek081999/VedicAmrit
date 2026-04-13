'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/dashboard/ActiveHousesCard.tsx
//  Displays which astrological houses are currently "active"
//  based on the current dasha and transit moon.
// ─────────────────────────────────────────────────────────────

import React from 'react'
import { ChartOutput } from '@/types/astrology'
import { getActiveHouses, getHouseTopics, getProgressionHouse } from '@/lib/engine/activeHouses'

interface ActiveHousesCardProps {
  chart: ChartOutput
  transitMoonLon?: number
}

const RASHI_LORD: Record<number, string> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
  7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju'
}

export function ActiveHousesCard({ chart, transitMoonLon }: ActiveHousesCardProps) {
  const { lagnas, grahas, dashas } = chart
  const ascRashi = lagnas.ascRashi
  const topics = getHouseTopics()
  const activeHouses = getActiveHouses(chart, transitMoonLon)

  const findCurrentLords = (nodes: any[]): string[] => {
    let lords: string[] = []
    const current = nodes.find(n => n.isCurrent)
    if (current) {
      lords.push(current.lord)
      if (current.children) {
        lords = [...lords, ...findCurrentLords(current.children)]
      }
    }
    return lords
  }

  const activeLords = findCurrentLords(dashas.vimshottari || [])
  const mdLord = activeLords[0]
  const adLord = activeLords[1]

  const getHouseOfPlanet = (gid: string) => {
    const g = grahas.find(p => p.id === gid)
    return g ? (((g.rashi - ascRashi + 12) % 12) + 1) : null
  }

  let transitMoonHouse: number | null = null
  if (transitMoonLon !== undefined) {
    const tMoonRashi = Math.floor(transitMoonLon / 30) + 1
    transitMoonHouse = (((tMoonRashi - ascRashi + 12) % 12) + 1)
  }

  const progressionHouse = getProgressionHouse(chart.meta.birthDate)

  return (
    <div className="card fade-up" style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
            <h3 className="label-caps" style={{ margin: 0, fontSize: '0.65rem' }}>Currently Active Houses</h3>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Areas of life spotlighted by Dasha, Transit & Progression</p>
        </div>
        <div style={{ fontSize: '1.2rem' }}>🏠</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {activeHouses.length > 0 ? activeHouses.map(h => (
           <div key={h} style={{ 
             display: 'flex', gap: '1rem', alignItems: 'center', 
             padding: '0.75rem', background: 'var(--surface-2)', 
             borderRadius: 'var(--r-md)', border: '1px solid var(--border-soft)',
             position: 'relative', overflow: 'hidden'
           }}>
             {(h === transitMoonHouse) && (
                 <div style={{ 
                   position: 'absolute', top: 0, left: 0, bottom: 0, width: 3, 
                   background: 'var(--teal)' 
                 }} title="Transit Focus" />
             )}
              {activeLords.slice(0,1).some(l => getHouseOfPlanet(l) === h) && (
                 <div style={{ 
                   position: 'absolute', top: 0, right: 0, bottom: 0, width: 3, 
                   background: 'var(--gold)' 
                 }} title="Dasha Focus" />
             )}
             {(h === progressionHouse) && (
                 <div style={{ 
                   position: 'absolute', bottom: 0, left: 3, right: 3, height: 2, 
                   background: 'var(--gold)', opacity: 0.6
                 }} title="Progression Focus" />
             )}

             <div style={{ 
               width: 32, height: 32, borderRadius: 'var(--r-sm)', 
               background: 'var(--surface-3)', display: 'flex', 
               alignItems: 'center', justifyContent: 'center',
               fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-gold)',
               fontSize: '0.9rem', border: '1px solid var(--border-soft)'
             }}>
               {h}
             </div>
             <div style={{ flex: 1 }}>
               <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                 {topics[h]}
               </div>
               <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem', marginTop: '0.1rem', flexWrap: 'wrap' }}>
                 {h === transitMoonHouse && <span style={{ color: 'var(--teal)' }}>● Transit Moon</span>}
                 {h === progressionHouse && <span style={{ color: 'var(--text-gold)' }}>● Yearly Progression</span>}
                 {activeLords.slice(0,2).map((l, idx) => {
                     const isOccupying = getHouseOfPlanet(l) === h
                     const rashiOfHouse = ((ascRashi + h - 2) % 12) + 1
                     const isRuling = RASHI_LORD[rashiOfHouse] === l
                     if (isOccupying || isRuling) {
                         return <span key={l} style={{ color: 'var(--gold)' }}>
                             ● {idx === 0 ? 'MD' : 'AD'} Lord {l} ({isOccupying ? 'in' : 'rules'})
                         </span>
                     }
                     return null
                 })}
               </div>
             </div>
           </div>
        )) : (
            <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Calculate chart to see active houses.
            </div>
        )}
      </div>

      <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', fontSize: '0.65rem', color: 'var(--text-muted)', padding: '0.5rem 0', borderTop: '1px solid var(--border-soft)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)' }} /> Dasha
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--teal)' }} /> Transit
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <span style={{ width: 6, height: 2, background: 'var(--gold)' }} /> Progression
          </span>
      </div>
    </div>
  )
}
