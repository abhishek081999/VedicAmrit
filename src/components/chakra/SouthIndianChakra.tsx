// ─────────────────────────────────────────────────────────────
//  src/components/chakra/SouthIndianChakra.tsx
//  South Indian chart — 4×4 fixed sign grid (12 border cells)
//  Signs are FIXED; Lagna cell is highlighted by ascRashi
//
//  Pi  Ar  Ta  Ge
//  Aq   ·   ·  Cn
//  Cp   ·   ·  Le
//  Sg  Sc  Li  Vi
// ─────────────────────────────────────────────────────────────
'use client'

import type { GrahaData, Rashi, ArudhaData, LagnaData } from '@/types/astrology'
import { getNakshatra } from '@/lib/engine/nakshatra'
import { NAKSHATRA_SHORT } from '@/types/astrology'
import React, { useState, useRef, useEffect, useMemo } from 'react'
import { PlanetTooltipCard, type PlanetTooltipData } from '@/components/ui/PlanetHoverTooltip'
import { getAspectedHouses } from '@/lib/engine/aspects'
import type { GrahaId } from '@/types/astrology'



// ── Fixed sign → [row, col] in 4×4 grid ──────────────────────

const SIGN_CELLS: Record<number, [number, number]> = {
  12: [0, 0], 1: [0, 1], 2: [0, 2],  3: [0, 3],
  11: [1, 0],                          4: [1, 3],
  10: [2, 0],                          5: [2, 3],
   9: [3, 0], 8: [3, 1], 7: [3, 2],  6: [3, 3],
}

const SIGN_ABBR: Record<number, string> = {
  1:'Ar', 2:'Ta', 3:'Ge', 4:'Cn', 5:'Le', 6:'Vi',
  7:'Li', 8:'Sc', 9:'Sg', 10:'Cp', 11:'Aq', 12:'Pi',
}

const ARUDHA_KEYS = [
  'AL','A2','A3','A4','A5','A6','A7','A8','A9','A10','A11','A12',
] as const

function dignityColor(dignity: string, isRetro: boolean): string {
  if (isRetro) return 'var(--dig-retro)'
  switch (dignity) {
    case 'exalted':      return 'var(--dig-exalted)'
    case 'moolatrikona': return 'var(--dig-moola)'
    case 'own':          return 'var(--dig-own)'
    case 'debilitated':  return 'var(--dig-debilitate)'
    default:             return 'var(--dig-neutral)'
  }
}


// Standard display labels for Arudha Padas
const ARUDHA_LABEL: Record<string, string> = {
  AL:  'AL',   // Arudha Lagna
  A2:  'A2',
  A3:  'A3',
  A4:  'A4',
  A5:  'A5',
  A6:  'A6',
  A7:  'A7',   // also known as Darapada
  A8:  'A8',
  A9:  'A9',
  A10: 'A10',
  A11: 'A11',
  A12: 'UL',   // Upapada Lagna
}

// ── Props ─────────────────────────────────────────────────────

interface SouthIndianProps {
  ascRashi:       Rashi
  grahas:         GrahaData[]
  size?:          number
  showDegrees?:   boolean
  showNakshatra?: boolean
  showKaraka?:    boolean
  showArudha?:    boolean
  arudhas?:       ArudhaData
  lagnas?:        LagnaData
  transitGrahas?: GrahaData[]
  comparisonGrahas?: GrahaData[]
  interactive?:   boolean
  onCellClick?:   (rashi: Rashi) => void
  highlightRashi?:Rashi | null
  fontScale?:     number
  planetScale?:   number
  arudhaScale?:   number
  infoScale?:     number
  highlightHouses?: number[]
}

// ── Component ─────────────────────────────────────────────────

export function SouthIndianChakra({
  ascRashi,
  grahas,
  size          = 480,
  showDegrees   = true,
  showNakshatra = false,
  showKaraka    = false,
  showArudha    = false,
  arudhas,
  lagnas,
  transitGrahas,
  comparisonGrahas,
  interactive   = false,
  onCellClick,
  highlightRashi = null,
  fontScale      = 1.0,
  planetScale    = 1.0,
  arudhaScale    = 1.0,
  infoScale      = 1.0,
  highlightHouses = [],
}: SouthIndianProps) {
  const cell = size / 4
  const [hoveredPlanet, setHoveredPlanet] = useState<PlanetTooltipData | null>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [isMounted, setIsMounted] = useState(false)
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { setIsMounted(true) }, [])

  const handlePlanetMouseEnter = (e: React.MouseEvent, g: any) => {
    const isMainPlanet = ['Su','Mo','Ma','Me','Ju','Ve','Sa','Ra','Ke'].includes(g.id as string)
    if (!isMainPlanet) return

    setMousePos({ x: e.clientX, y: e.clientY })
    if (hoverTimer.current) clearTimeout(hoverTimer.current)
    hoverTimer.current = setTimeout(() => {
      setHoveredPlanet({
        id: g.id,
        name: g.name || g.id,
        totalDeg: g.totalDegree || (g.rashi -1)*30 + g.degree,
        isRetro: g.isRetro,
        dignity: g.dignity,
        nakshatraIndex: g.nakshatraIndex,
        nakshatraName: g.nakshatraName,
        pada: g.pada,
        charaKaraka: g.charaKaraka,
        avastha: g.avastha,
        house: ((g.rashi - ascRashi + 12) % 12) + 1
      })
    }, 200)
  }

  const handlePlanetTouchStart = (e: React.TouchEvent, g: any) => {
    const isMainPlanet = ['Su','Mo','Ma','Me','Ju','Ve','Sa','Ra','Ke'].includes(g.id as string)
    if (!isMainPlanet) return

    if (hoveredPlanet && hoveredPlanet.id === g.id) {
      setHoveredPlanet(null)
    } else {
      setMousePos({ x: e.touches[0].clientX, y: e.touches[0].clientY })
      setHoveredPlanet({
        id: g.id,
        name: g.name || g.id,
        totalDeg: g.totalDegree || (g.rashi -1)*30 + g.degree,
        isRetro: g.isRetro,
        dignity: g.dignity,
        nakshatraIndex: g.nakshatraIndex,
        nakshatraName: g.nakshatraName,
        pada: g.pada,
        charaKaraka: g.charaKaraka,
        avastha: g.avastha,
        house: ((g.rashi - ascRashi + 12) % 12) + 1
      })
    }
  }


  const handlePlanetMouseLeave = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current)
    setHoveredPlanet(null)
  }

  const handlePlanetMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY })
  }


  const aspectHighlights = useMemo(() => {
    if (!hoveredPlanet || !hoveredPlanet.house) return []
    const targets = getAspectedHouses(hoveredPlanet.id as GrahaId, hoveredPlanet.house)
    return targets.map(h => ((ascRashi - 1 + h - 1) % 12) + 1)
  }, [hoveredPlanet, ascRashi])

  // Planets grouped by rashi (signs are fixed in South Indian)
  const byRashi: Record<number, GrahaData[]> = {}
  for (const g of grahas) {
    if (!byRashi[g.rashi]) byRashi[g.rashi] = []
    byRashi[g.rashi].push(g)
  }

  // Arudhas grouped by rashi
  const arudhaByRashi: Record<number, string[]> = {}
  if (showArudha && arudhas) {
    for (const key of ARUDHA_KEYS) {
      const rashi = arudhas[key] as Rashi | undefined
      if (!rashi) continue
      if (!arudhaByRashi[rashi]) arudhaByRashi[rashi] = []
      arudhaByRashi[rashi].push(key)
    }
  }

  const fs = {
    sign:   Math.round(cell * 0.09 * fontScale),
    graha:  Math.round(cell * 0.115 * fontScale * planetScale),
    degree: Math.round(cell * 0.082 * fontScale * infoScale),
    arudha: Math.round(cell * 0.080 * fontScale * arudhaScale),
    lagna:  Math.round(cell * 0.085 * fontScale),
  }

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      style={{ display: 'block', maxWidth: '100%', height: 'auto', overflow: 'visible' }}
      aria-label="South Indian birth chart"
    >
      {/* Background — transparent for parchment theme */}
      <rect width={size} height={size} fill="transparent" />

      {/* Grid cells */}
      {Object.entries(SIGN_CELLS).map(([signStr, [row, col]]) => {
        const sign       = Number(signStr) as Rashi
        const isAsc      = sign === ascRashi
        const isHi       = sign === highlightRashi
        const x          = col * cell
        const y          = row * cell
        const cellGrahas = byRashi[sign] ?? []
        const cellArudhas = arudhaByRashi[sign] ?? []
        
        const houseOfSign = ((sign - ascRashi + 12) % 12) + 1
        const isHouseHi  = highlightHouses.includes(houseOfSign)
        const isAspected = aspectHighlights.includes(sign)

        const nGrahas = cellGrahas.length
        const useTwoCol = nGrahas > 3
        
        // Multiplier to figure out how many distinct text lines per planet
        const linesPerGraha = 1
          + (showDegrees || showKaraka ? 1 : 0)
          + (showNakshatra ? 1 : 0)

        // Calculate rows based on zig-zag
        const rows = useTwoCol ? Math.ceil(nGrahas / 2) : nGrahas
        const totalRows = rows * linesPerGraha + cellArudhas.length * 0.8
        
        const lineH = nGrahas
          ? Math.min(
              cell * 0.16,
              (cell * 0.65) / Math.max(totalRows, 1)
            )
          : cell * 0.16

        return (
          <g
            key={sign}
            onClick={() => interactive && onCellClick?.(sign)}
            style={{ cursor: interactive ? 'pointer' : 'default' }}
          >
            {/* Cell background */}
            <rect
              x={x + 0.5} y={y + 0.5}
              width={cell - 1} height={cell - 1}
              fill={
                isHouseHi ? 'rgba(253, 230, 138, 0.12)' :
                isAspected ? 'var(--gold-faint)' :
                isHi  ? 'var(--accent-glow)' :
                isAsc ? 'var(--gold-faint)' :
                        'transparent'
              }
              stroke={isHouseHi ? 'var(--gold)' : (isAsc ? 'var(--gold)' : 'var(--border-bright)')}
              strokeWidth={isHouseHi ? 2.5 : (isAsc ? 2.5 : 1.25)}
            />

            {/* Sign number — top-left */}
            <text
              x={x + cell * 0.07}
              y={y + cell * 0.18}
              fontSize={fs.sign}
              fill={isAsc ? 'var(--gold)' : 'var(--chart-sign-green)'}
              fontFamily="var(--font-display)"
              fontWeight={isAsc ? 'var(--fw-bold)' : 'var(--fw-base)'}
            >
              {sign}
            </text>

            {/* Sign abbreviation — top-right */}
            <text
              x={x + cell * 0.93}
              y={y + cell * 0.18}
              fontSize={fs.sign}
              fill="var(--chart-label-muted)"
              fontFamily="var(--font-chart-planets)"
              textAnchor="end"
            >
              {SIGN_ABBR[sign]}
            </text>

            {/* Lagna marker (Natal) */}
            {(lagnas ? lagnas.ascRashi === sign : isAsc) && (
              <g stroke="var(--chart-label-muted)" strokeWidth="1" strokeLinecap="round">
                <line x1={x + 4} y1={y + 4} x2={x + cell * 0.22} y2={y + 4} />
                <line x1={x + 4} y1={y + 4} x2={x + 4} y2={y + cell * 0.22} />
                <text
                  x={x + cell * 0.5}
                  y={y + cell * 0.96}
                  fontSize={fs.lagna}
                  fill="var(--chart-label-muted)"
                  fontFamily="var(--font-chart-planets)"
                  textAnchor="middle"
                  fontStyle="italic"
                >
                  {lagnas 
                    ? `AS ${Math.floor(lagnas.ascDegreeInRashi)}°${String(Math.floor((lagnas.ascDegreeInRashi % 1) * 60)).padStart(2, '0')}'` 
                    : 'Asc'}
                </text>
                {showNakshatra && lagnas && (() => {
                  const ascNak = getNakshatra(lagnas.ascDegree)
                  return (
                    <text
                      x={x + cell * 0.5}
                      y={y + cell * 0.82}
                      fontSize={fs.degree * 0.88}
                      fill="var(--text-muted)"
                      fontFamily="var(--font-chart-planets)"
                      textAnchor="middle"
                      fontStyle="italic"
                    >
                      {NAKSHATRA_SHORT[ascNak.index]}{ascNak.pada}
                    </text>
                  )
                })()}
              </g>
            )}

            {/* ── Planets ── */}
            {cellGrahas.map((g, i) => {
              const col   = useTwoCol ? (i % 2) : 0
              const pRow  = useTwoCol ? Math.floor(i / 2) : i
              
              const px    = x + cell * (useTwoCol ? (col === 0 ? 0.10 : 0.55) : 0.12)
              const yPos  = y + cell * 0.28 + pRow * lineH * linesPerGraha
              
              const color = dignityColor(g.dignity, g.isRetro)
              const ret   = g.isRetro ? 'ᴿ' : ''
              const deg   = showDegrees
                ? ` ${Math.floor(g.degree)}°${String(Math.floor((g.degree % 1) * 60)).padStart(2,'0')}'`
                : ''
              const kar   = showKaraka && g.charaKaraka ? ` [${g.charaKaraka}]` : ''

              return (
                <g 
                  key={g.id}
                  onMouseEnter={(e) => handlePlanetMouseEnter(e, g)}
                  onMouseLeave={handlePlanetMouseLeave}
                  onMouseMove={handlePlanetMouseMove}
                  onTouchStart={(e) => handlePlanetTouchStart(e, g)}
                  style={{ cursor: 'help' }}
                >

                  <text
                    x={px}
                    y={yPos}
                    fontSize={fs.graha}
                    fill={color}
                    fontFamily="var(--font-chart-planets)"
                    fontWeight="var(--fw-medium)"
                  >
                    {g.id}{ret}
                  </text>
                  {(showDegrees || showKaraka) && (
                    <text
                      x={px}
                      y={yPos + lineH * 0.9}
                      fontSize={fs.degree}
                      fill="var(--text-muted)"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {deg}{kar}
                    </text>
                  )}
                  {showNakshatra && (
                    <text
                      x={px}
                      y={yPos + lineH * (showDegrees || showKaraka ? 1.8 : 0.9)}
                      fontSize={fs.degree * 0.88}
                      fill="var(--text-muted)"
                      fontFamily="var(--font-chart-planets)"
                      fontStyle="italic"
                    >
                      {g.nakshatraIndex !== undefined ? NAKSHATRA_SHORT[g.nakshatraIndex] : ''}{g.pada}
                    </text>
                  )}
                </g>
              )
            })}

            {/* ── Āruḍhas — italic amber, below planets ── */}
            {(() => {
              if (!cellArudhas.length) return null

              const planetBlockH = rows * lineH * linesPerGraha
              const baseY = y + cell * 0.28 + planetBlockH + fs.arudha * 1.35
              
              const chunks = []
              for (let i = 0; i < cellArudhas.length; i += 3) {
                chunks.push(cellArudhas.slice(i, i + 3).map(k => ARUDHA_LABEL[k] ?? k).join(' · '))
              }

              return chunks.map((textStr, ci) => (
                <text
                  key={`arudha-row-${ci}`}
                  x={x + cell * 0.12}
                  y={baseY + ci * fs.arudha * 1.4}
                  fontSize={fs.arudha}
                  fill="var(--text-gold)"
                  fontFamily="var(--font-chart-planets)"
                  fontStyle="italic"
                  fontWeight="var(--fw-bold)"
                >
                  {textStr}
                </text>
              ))
            })()}
          </g>
        )
      })}

      {/* ── Transit planet overlay ── */}
      {transitGrahas && Object.entries(SIGN_CELLS).map(([signStr, [row, col]]) => {
        const sign = Number(signStr) as Rashi
        const tPlanets = transitGrahas.filter(tg => tg.rashi === sign)
        if (!tPlanets.length) return null
        const cx = col * cell + cell * 0.5
        const cy = row * cell + cell * 0.72
        const tFont = cell * 0.115 * fontScale * planetScale
        return tPlanets.map((tg, ti) => (
          <text
            key={`transit-s-${tg.id}-${ti}`}
            x={cx + (tPlanets.length > 1 && ti % 2 === 1 ? cell * 0.18 : tPlanets.length > 1 ? -cell * 0.18 : 0)}
            y={cy + Math.floor(ti / 2) * tFont * 1.5}
            textAnchor="middle" dominantBaseline="middle"
            fontSize={Math.round(tFont * 0.85)}
            fontWeight={700}
            fontFamily="var(--font-mono)"
            fill={tg.isRetro ? 'rgba(200,140,255,0.90)' : 'rgba(139,124,246,0.90)'}
            style={{ filter: 'drop-shadow(0 0 3px rgba(139,124,246,0.5))' }}
          >
            {tg.id}{tg.isRetro ? '℞' : ''}{showDegrees ? ` ${Math.floor(tg.degree)}°` : ''}
          </text>
        ))
      })}

      {/* ── Comparison planet overlay (Synastry) ── */}
      {comparisonGrahas && Object.entries(SIGN_CELLS).map(([signStr, [row, col]]) => {
        const sign = Number(signStr) as Rashi
        const cPlanets = comparisonGrahas.filter(cg => cg.rashi === sign)
        if (!cPlanets.length) return null
        const cx = col * cell + cell * 0.5
        const cy = row * cell + cell * 0.85
        const cFont = cell * 0.115 * fontScale * planetScale
        return cPlanets.map((cg, ci) => (
          <text
            key={`compare-s-${cg.id}-${ci}`}
            x={cx + (cPlanets.length > 1 && ci % 2 === 1 ? cell * 0.18 : cPlanets.length > 1 ? -cell * 0.18 : 0)}
            y={cy + Math.floor(ci / 2) * cFont * 1.5}
            textAnchor="middle" dominantBaseline="middle"
            fontSize={Math.round(cFont * 0.85)}
            fontWeight={800}
            fontFamily="var(--font-mono)"
            fill={cg.isRetro ? 'var(--rose)' : 'var(--text-gold)'}
            style={{ filter: 'drop-shadow(0 0 3px rgba(184,134,11,0.3))' }}
          >
            {cg.id}{cg.isRetro ? '℞' : ''}{showDegrees ? ` ${Math.floor(cg.degree)}°` : ''}
          </text>
        ))
      })}

      {/* Centre decorative lines */}
      <g opacity="0.85">
        <line x1={cell} y1={cell} x2={cell*3} y2={cell}   stroke="var(--border-bright)" strokeWidth="0.75" />
        <line x1={cell} y1={cell*3} x2={cell*3} y2={cell*3} stroke="var(--border-bright)" strokeWidth="0.75" />
        <line x1={cell} y1={cell} x2={cell} y2={cell*3}   stroke="var(--border-bright)" strokeWidth="0.75" />
        <line x1={cell*3} y1={cell} x2={cell*3} y2={cell*3} stroke="var(--border-bright)" strokeWidth="0.75" />
        <line x1={cell} y1={cell} x2={cell*3} y2={cell*3} stroke="var(--border)" strokeWidth="0.5" />
        <line x1={cell*3} y1={cell} x2={cell} y2={cell*3} stroke="var(--border)" strokeWidth="0.5" />
      </g>

      {/* ── Tooltip Portal ── */}
      {isMounted && hoveredPlanet && (
        <PlanetTooltipCard 
          planet={hoveredPlanet} 
          x={mousePos.x} y={mousePos.y} 
          onClose={() => setHoveredPlanet(null)} 
        />
      )}
    </svg>


  )
}