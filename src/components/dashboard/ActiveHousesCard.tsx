'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/dashboard/ActiveHousesCard.tsx  — Compact flat list
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
      if (current.children) lords = [...lords, ...findCurrentLords(current.children)]
    }
    return lords
  }

  const activeLords = findCurrentLords(dashas.vimshottari || [])

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.75rem' }}>

      {/* ── Compact header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.25rem', borderBottom: '1px solid var(--border-soft)' }}>
        <span style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.07em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Houses</span>
        <div style={{ display: 'flex', gap: '0.6rem', fontSize: '0.58rem', color: 'var(--text-muted)', alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--gold)', display: 'inline-block' }} /> Dasha
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--teal)', display: 'inline-block' }} /> Transit
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            <span style={{ width: 8, height: 2, background: 'var(--gold)', opacity: 0.6, display: 'inline-block' }} /> Prog
          </span>
        </div>
      </div>

      {/* ── House rows ── */}
      {activeHouses.length > 0 ? (
        <div style={{ borderRadius: 6, border: '1px solid var(--border-soft)', overflow: 'hidden', background: 'var(--surface-1)' }}>
          {activeHouses.map((h, idx) => {
            const isTransit = h === transitMoonHouse
            const isProgression = h === progressionHouse
            const isDasha = activeLords.slice(0, 1).some(l => getHouseOfPlanet(l) === h)

            const indicators: React.ReactNode[] = []
            if (isTransit) indicators.push(<span key="tr" style={{ color: 'var(--teal)', fontSize: '0.58rem' }}>● Transit Moon</span>)
            if (isProgression) indicators.push(<span key="pr" style={{ color: 'var(--text-gold)', fontSize: '0.58rem' }}>● Yearly Prog</span>)
            activeLords.slice(0, 2).forEach((l, li) => {
              const isOcc = getHouseOfPlanet(l) === h
              const rashiOfHouse = ((ascRashi + h - 2) % 12) + 1
              const isRul = RASHI_LORD[rashiOfHouse] === l
              if (isOcc || isRul) {
                indicators.push(
                  <span key={`${l}-${li}`} style={{ color: 'var(--gold)', fontSize: '0.58rem' }}>
                    ● {li === 0 ? 'MD' : 'AD'} {l} ({isOcc ? 'in' : 'rules'})
                  </span>
                )
              }
            })

            const accentColor = isTransit ? 'var(--teal)' : isDasha ? 'var(--gold)' : isProgression ? 'var(--gold)' : 'var(--border-soft)'

            return (
              <div key={h} style={{
                display: 'flex', alignItems: 'flex-start', gap: '0.45rem',
                padding: '0.28rem 0.55rem',
                borderBottom: idx === activeHouses.length - 1 ? 'none' : '1px solid var(--border-soft)',
                borderLeft: `2px solid ${accentColor}`,
                background: 'transparent',
              }}>
                {/* House number badge */}
                <span style={{
                  flexShrink: 0, minWidth: '1.4rem', height: '1.4rem',
                  borderRadius: 4, background: 'var(--surface-2)',
                  border: '1px solid var(--border-soft)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-mono)', fontWeight: 700,
                  fontSize: '0.65rem', color: 'var(--text-gold)',
                }}>
                  {h}
                </span>
                {/* Topic + indicators */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                    {topics[h]}
                  </div>
                  {indicators.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.1rem' }}>
                      {indicators}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
          Calculate chart to see active houses.
        </div>
      )}
    </div>
  )
}
