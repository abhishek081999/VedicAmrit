'use client'
import React, { useMemo } from 'react'
import { ChakraSelector } from '@/components/chakra/ChakraSelector'
import { GrahaTable } from '@/components/ui/GrahaTable'
import { PlanetDetailCard } from '@/components/ui/PlanetDetailCard'
import { AdvancedAnalysisPanel } from '@/components/ui/AdvancedAnalysisPanel'
import { YogiPointPanel } from '@/components/ui/YogiPointPanel'
import { InterpretationPanel } from '@/components/ui/InterpretationPanel'
import { getGraNakPositions, getNakshatraCharacteristics } from '@/lib/engine/nakshatraAdvanced'
import { NAKSHATRA_NAMES as NAK_NAMES, RASHI_NAMES } from '@/types/astrology'
import type { ChartOutput, Rashi } from '@/types/astrology'

interface PlanetsWorkspaceProps {
  chart: ChartOutput
}

export function PlanetsWorkspace({ chart }: PlanetsWorkspaceProps) {
  const moonNakIndex = chart.grahas.find((g) => g.id === 'Mo')?.nakshatraIndex ?? 0
  
  const mergedPlanets = useMemo(() => {
    const base = getGraNakPositions(chart.grahas.filter(g => !['Ur', 'Ne', 'Pl'].includes(g.id)))
    const ascDeg = chart.lagnas.ascDegree
    const lagNakIdx = Math.floor(ascDeg / (360 / 27))
    const lagNakPada = Math.floor(((ascDeg % (360 / 27)) / (360 / 27)) * 4) + 1
    const lagChars = getNakshatraCharacteristics(lagNakIdx, lagNakPada)

    const lagPosition = {
      grahaId: 'As' as any,
      grahaName: 'Lagna',
      nakshatraIndex: lagNakIdx,
      nakshatraName: NAK_NAMES[lagNakIdx],
      pada: lagNakPada,
      lord: lagChars.lord,
      gana: lagChars.gana,
      deity: lagChars.deity,
      degree: ascDeg,
    }

    return [lagPosition, ...base].map(p => {
      const full = chart.grahas.find(g => g.id === p.grahaId)
      const shad = chart.shadbala?.planets[p.grahaId]
      return { ...p, ...full, shadbala: shad }
    })
  }, [chart.grahas, chart.lagnas, chart.shadbala])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* ── Header: Charts & Quick Diagnostics ────────────────── */}
      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        
        {/* D1 Chart */}
        <div style={{ flex: '1 1 320px', maxWidth: '420px' }}>
          <div className="card" style={{ padding: '0.75rem' }}>
            <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              D1 · Rashi Chart
            </div>
            <ChakraSelector
              ascRashi={chart.lagnas.ascRashi as Rashi}
              grahas={chart.vargas?.D1 ?? chart.grahas}
              moonNakIndex={moonNakIndex}
              arudhas={chart.arudhas}
              tithiNumber={chart.panchang.tithi.number}
              varaNumber={chart.panchang.vara.number}
              defaultStyle="north"
              size={320}
            />
          </div>
        </div>

        {/* D9 Chart */}
        <div style={{ flex: '1 1 320px', maxWidth: '420px' }}>
          <div className="card" style={{ padding: '0.75rem' }}>
            <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              D9 · Navāmśa Chart
            </div>
            <ChakraSelector
              ascRashi={chart.vargaLagnas?.D9 ?? 1}
              grahas={chart.vargas?.D9 ?? []}
              moonNakIndex={moonNakIndex}
              defaultStyle="north"
              size={320}
            />
          </div>
        </div>

        {/* Quick Diagnostics Table */}
        <div style={{ flex: '1 1 400px', minWidth: '350px' }}>
          <div className="card" style={{ padding: '1rem', height: '100%' }}>
            <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-gold)', marginBottom: '0.85rem' }}>
              Planetary Micro-Details
            </div>
            <GrahaTable grahas={chart.grahas} lagnas={chart.lagnas} upagrahas={chart.upagrahas} />
          </div>
        </div>
      </div>

      {/* ── Analysis Section: Full Width Grid ─────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--text-gold)', margin: 0 }}>
            Deep Planetary Analysis
          </h3>
          <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, var(--border-soft), transparent)' }} />
        </div>
        
        {/* The Grid that uses "Free Space" */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
          gap: '1.25rem' 
        }}>
          {mergedPlanets.map((p) => (
            <PlanetDetailCard 
              key={p.grahaId} 
              p={p} 
              moonNakIdx={moonNakIndex} 
              ascRashi={chart.lagnas.ascRashi} 
            />
          ))}
        </div>
      </div>

      {/* ── Yogi Point System ──────────────────────────────────── */}
      {chart.yogiPoint && (
        <div style={{ marginTop: '1rem' }}>
          <YogiPointPanel 
            yogiPoint={chart.yogiPoint} 
            grahas={chart.grahas.map(g => ({ id: g.id, lonSidereal: g.lonSidereal, name: g.name }))}
          />
        </div>
      )}

      {/* ── Interpretation Layer ───────────────────────────────── */}
      {chart.interpretation && (
        <div style={{ marginTop: '1rem' }}>
          <InterpretationPanel interpretation={chart.interpretation} />
        </div>
      )}

      {/* ── Advanced Analysis: Gandanta, Pushkara, Mrityu ───────── */}
      <div style={{ marginTop: '1rem' }}>
        <AdvancedAnalysisPanel grahas={chart.grahas} />
      </div>
    </div>
  )
}
