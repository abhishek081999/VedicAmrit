'use client'
/**
 * SarvatobhadraChakra.tsx
 *
 * Interactive 9×9 Sarvatobhadra Chakra grid.
 * Colours are driven by CSS custom properties (--sbc-*) from globals.css,
 * adapting automatically to Dark / Light / Classic themes.
 *
 * New in v2:
 *  - birthNakshatraIndex / nameNakshatraIndex — special cell highlights
 *  - Diagonal vedha display for Ma, Ju, Sa, Ra, Ke
 *  - Directional compass labels around the perimeter
 *  - Planet hover tooltip
 */

import { useState, useMemo, useCallback, CSSProperties } from 'react'
import type { SBCCell, PlanetOnSBC } from '@/lib/engine/sarvatobhadra'
import { PLANET_SYMBOL, PLANET_COLOR, DIAGONAL_PLANETS } from '@/lib/engine/sarvatobhadra'
import type { GrahaId } from '@/types/astrology'

// ─── Types ────────────────────────────────────────────────────

interface Props {
  grid:                   SBCCell[][]
  natalPlanets:           PlanetOnSBC[]
  transitPlanets:         PlanetOnSBC[]
  onCellClick?:           (cell: SBCCell) => void
  size?:                  number
  fontScale?:             number
  fontWeight?:            number | string
  /** Nakshatra index (0-26) to highlight as birth star */
  birthNakshatraIndex?:   number
  /** Nakshatra index (0-26) to highlight as name star */
  nameNakshatraIndex?:    number
  /** Show diagonal vedha lines on hover */
  showDiagonalVedha?:     boolean
}

// ─── Cell styling helpers ──────────────────────────────────────

function cellBg(type: string, isVedha: boolean, isDiagVedha: boolean): string {
  if (isDiagVedha) {
    const diagMap: Record<string, string> = {
      nakshatra: 'rgba(139,90,220,0.28)',
      rashi:     'rgba(200,148,40,0.22)',
      vara:      'rgba(130,80,230,0.22)',
      vowel:     'rgba(40,160,180,0.18)',
      consonant: 'rgba(80,80,120,0.18)',
    }
    return diagMap[type] ?? 'rgba(120,80,200,0.15)'
  }
  const map: Record<string, [string, string]> = {
    nakshatra: ['var(--sbc-nak-bg)',    'var(--sbc-nak-vdh)'],
    rashi:     ['var(--sbc-rashi-bg)',  'var(--sbc-rashi-vdh)'],
    vara:      ['var(--sbc-vara-bg)',   'var(--sbc-vara-vdh)'],
    vowel:     ['var(--sbc-vowel-bg)',  'var(--sbc-vowel-vdh)'],
    consonant: ['var(--sbc-cons-bg)',   'var(--sbc-cons-vdh)'],
    center:    ['var(--sbc-center-bg)', 'var(--sbc-center-bg)'],
    empty:     ['var(--sbc-empty-bg)',  'var(--sbc-empty-bg)'],
  }
  const pair = map[type] ?? map.empty
  return isVedha ? pair[1] : pair[0]
}

function cellTextColor(type: string): string {
  const map: Record<string, string> = {
    nakshatra: 'var(--sbc-nak-txt)',
    rashi:     'var(--sbc-rashi-txt)',
    vara:      'var(--sbc-vara-txt)',
    vowel:     'var(--sbc-vowel-txt)',
    consonant: 'var(--sbc-cons-txt)',
    center:    'var(--sbc-center-txt)',
    empty:     'var(--text-muted)',
  }
  return map[type] ?? 'var(--text-muted)'
}

// ─── Component ────────────────────────────────────────────────

export function SarvatobhadraChakra({
  grid,
  natalPlanets,
  transitPlanets,
  onCellClick,
  size = 612,
  fontScale = 1.0,
  fontWeight = 600,
  birthNakshatraIndex,
  nameNakshatraIndex,
  showDiagonalVedha = true,
}: Props) {
  const [hovered, setHovered] = useState<[number, number] | null>(null)

  const cs = Math.floor(size / 9)
  const fs = Math.max(6, cs * 0.105) * fontScale

  // ── Planet lookup maps ──────────────────────────────────────
  const natalMap = useMemo(() => {
    const m = new Map<string, PlanetOnSBC[]>()
    natalPlanets.forEach(p => {
      const k = `${p.row},${p.col}`
      if (!m.has(k)) m.set(k, [])
      m.get(k)!.push(p)
    })
    return m
  }, [natalPlanets])

  const transitMap = useMemo(() => {
    const m = new Map<string, PlanetOnSBC[]>()
    transitPlanets.forEach(p => {
      const k = `${p.row},${p.col}`
      if (!m.has(k)) m.set(k, [])
      m.get(k)!.push(p)
    })
    return m
  }, [transitPlanets])

  // ── Special nakshatra cell keys ─────────────────────────────
  const birthKey = birthNakshatraIndex !== undefined
    ? (() => { const [r, c] = findNakPos(grid, birthNakshatraIndex); return r >= 0 ? `${r},${c}` : null })()
    : null

  const nameKey = nameNakshatraIndex !== undefined
    ? (() => { const [r, c] = findNakPos(grid, nameNakshatraIndex); return r >= 0 ? `${r},${c}` : null })()
    : null

  // ── Vedha sets on hover ─────────────────────────────────────
  const { vedhaSet, diagVedhaSet, natalActivatedSet } = useMemo(() => {
    const vedha     = new Set<string>()
    const diagVedha = new Set<string>()
    const activated = new Set<string>()
    if (!hovered) return { vedhaSet: vedha, diagVedhaSet: diagVedha, natalActivatedSet: activated }

    const [hr, hc] = hovered

    // Row + column (all cells)
    for (let i = 0; i < 9; i++) {
      if (i !== hc) vedha.add(`${hr},${i}`)
      if (i !== hr) vedha.add(`${i},${hc}`)
    }

    // Diagonal — only show if any diagonal planet is in the hovered cell
    if (showDiagonalVedha) {
      const cellKey     = `${hr},${hc}`
      const hasNatal    = (natalMap.get(cellKey) ?? []).some(p => DIAGONAL_PLANETS.has(p.planet))
      const hasTransit  = (transitMap.get(cellKey) ?? []).some(p => DIAGONAL_PLANETS.has(p.planet))
      if (hasNatal || hasTransit) {
        for (let i = 1; i < 9; i++) {
          const deltas: [number, number][] = [[i, i], [i, -i], [-i, i], [-i, -i]]
          deltas.forEach(([dr, dc]) => {
            const r = hr + dr, c = hc + dc
            if (r >= 0 && r < 9 && c >= 0 && c < 9) {
              const k = `${r},${c}`
              if (!vedha.has(k)) diagVedha.add(k)
            }
          })
        }
      }
    }

    vedha.forEach(k => { if (natalMap.has(k)) activated.add(k) })
    diagVedha.forEach(k => { if (natalMap.has(k)) activated.add(k) })
    return { vedhaSet: vedha, diagVedhaSet: diagVedha, natalActivatedSet: activated }
  }, [hovered, natalMap, transitMap, showDiagonalVedha])

  // ── Cell style ──────────────────────────────────────────────
  const cellStyle = useCallback((cell: SBCCell): CSSProperties => {
    const k        = `${cell.row},${cell.col}`
    const isHov    = hovered?.[0] === cell.row && hovered?.[1] === cell.col
    const isVedha  = vedhaSet.has(k)
    const isDiag   = diagVedhaSet.has(k)
    const isAct    = natalActivatedSet.has(k)
    const isBirth  = k === birthKey
    const isName   = k === nameKey

    let border = '1px solid transparent'
    let shadow = 'none'
    let zIndex: number | 'auto' = 'auto'
    let outline = 'none'

    if (isHov) {
      border = '1px solid var(--sbc-hov-bdr)'
      shadow = 'var(--sbc-hov-shd)'
      zIndex = 4
    } else if (isBirth) {
      border = '2px solid rgba(255,215,0,0.9)'
      shadow = '0 0 12px rgba(255,215,0,0.55), inset 0 0 8px rgba(255,215,0,0.15)'
      zIndex = 3
    } else if (isName) {
      border = '2px solid rgba(135,206,250,0.9)'
      shadow = '0 0 12px rgba(135,206,250,0.5), inset 0 0 8px rgba(135,206,250,0.12)'
      zIndex = 3
    } else if (isAct) {
      border = '1px solid var(--sbc-act-bdr)'
      shadow = 'var(--sbc-act-shd)'
      zIndex = 2
    } else if (isDiag) {
      border = '1px dashed rgba(170,100,255,0.50)'
      zIndex = 1
    } else if (isVedha) {
      border = '1px solid var(--sbc-vdh-bdr)'
      zIndex = 1
    }

    return {
      background:     cellBg(cell.type, isVedha || isDiag, isDiag),
      border,
      outline,
      boxShadow:      shadow,
      zIndex,
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      position:       'relative',
      cursor:         'pointer',
      overflow:       'hidden',
      boxSizing:      'border-box',
      transition:     'background 0.15s ease, border-color 0.12s ease, box-shadow 0.12s ease',
    }
  }, [hovered, vedhaSet, diagVedhaSet, natalActivatedSet, birthKey, nameKey])

  // ─────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      {/* North label */}
      <DirectionLabel label="NORTH" sub="↑ Uttara" size={size} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {/* West label */}
        <DirectionLabel label="WEST" sub="← Paschim" size={size} vertical />

        {/* Grid */}
        <div
          style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(9, 1fr)',
            gridTemplateRows:    'repeat(9, 1fr)',
            gap:                 1,
            background:          'var(--sbc-grid-bg)',
            borderRadius:        10,
            padding:             1,
            border:              '1px solid var(--sbc-grid-bdr)',
            boxShadow:           '0 4px 32px rgba(0,0,0,0.18)',
            width:               '100%',
            maxWidth:            size,
            aspectRatio:         '1 / 1',
            touchAction:         'manipulation',
          }}
        >
          {grid.flat().map(cell => {
            const k           = `${cell.row},${cell.col}`
            const cellNatal   = natalMap.get(k) ?? []
            const cellTransit = transitMap.get(k) ?? []
            const hasAny      = cellNatal.length > 0 || cellTransit.length > 0
            const badgeSize   = Math.max(9, cs * 0.17)
            const type        = cell.type
            const isBirth     = k === birthKey
            const isName      = k === nameKey

            return (
              <div
                key={k}
                style={cellStyle(cell)}
                onMouseEnter={() => setHovered([cell.row, cell.col])}
                onMouseLeave={() => setHovered(null)}
                onClick={() => onCellClick?.(cell)}
              >
                {/* Birth/Name star badge */}
                {(isBirth || isName) && (
                  <div style={{
                    position: 'absolute', top: 2, left: 2, zIndex: 5,
                    fontSize: `${Math.max(7, cs * 0.14)}px`,
                    lineHeight: 1,
                    filter: 'drop-shadow(0 0 4px currentColor)',
                  }}>
                    {isBirth ? '⭐' : '🔤'}
                  </div>
                )}

                {/* ── Label ─────────────────────────────────── */}
                <div style={{
                  textAlign:     'center',
                  lineHeight:    1.15,
                  paddingBottom: hasAny ? badgeSize + 2 : 0,
                }}>
                  {type === 'nakshatra' ? (
                    cell.label.split(' ').map((word, wi) => (
                      <span key={wi} style={{
                        display:     'block',
                        fontSize:    `${fs * 0.86}px`,
                        fontWeight,
                        color:       isBirth ? 'rgba(255,215,0,1)' : isName ? 'rgba(135,206,250,1)' : cellTextColor(type),
                        fontFamily:  'var(--font-display)',
                        letterSpacing: '-0.02em',
                      }}>
                        {word}
                      </span>
                    ))
                  ) : (
                    <>
                      <div style={{
                        fontSize: type === 'vowel' || type === 'consonant'
                          ? `${fs * 1.45}px`
                          : type === 'center' ? `${fs * 0.88}px`
                          : `${fs * 1.1}px`,
                        fontWeight,
                        color:     cellTextColor(type),
                        fontFamily: type === 'vowel' || type === 'consonant'
                          ? '"Noto Sans Devanagari", "Mangal", "Devanagari", serif'
                          : 'var(--font-display)',
                        lineHeight: 1.15,
                      }}>
                        {cell.label}
                      </div>
                      {cell.sublabel && type === 'vara' && (
                        <div style={{
                          fontSize:  `${Math.max(5, fs * 0.68)}px`,
                          color:     cellTextColor(type),
                          opacity:   0.55,
                          fontFamily:'var(--font-display)',
                          marginTop: 1,
                          lineHeight:1,
                        }}>
                          {cell.sublabel}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* ── Planet badges ────────────────────────── */}
                {hasAny && (
                  <div style={{
                    position:       'absolute',
                    bottom:         2,
                    left:           '50%',
                    transform:      'translateX(-50%)',
                    display:        'flex',
                    gap:            2,
                    flexWrap:       'wrap',
                    justifyContent: 'center',
                    maxWidth:       cs - 4,
                  }}>
                    {[
                      ...cellNatal.map(p   => ({ ...p, _natal: true  })),
                      ...cellTransit.map(p => ({ ...p, _natal: false })),
                    ].slice(0, 6).map((p, i) => (
                      <div
                        key={`${p.planet}-${i}`}
                        title={`${p._natal ? '● Natal' : '◌ Transit'} ${p.planet}${DIAGONAL_PLANETS.has(p.planet) ? ' (diagonal vedha)' : ''}`}
                        style={{
                          width:          badgeSize,
                          height:         badgeSize,
                          borderRadius:   '50%',
                          background:     PLANET_COLOR[p.planet as GrahaId] ?? '#888',
                          border:         p._natal
                            ? `1.5px solid rgba(255,255,255,0.85)`
                            : `1.5px dashed rgba(255,255,255,0.60)`,
                          display:        'flex',
                          alignItems:     'center',
                          justifyContent: 'center',
                          fontSize:       `${Math.max(5, badgeSize * 0.52)}px`,
                          color:          '#fff',
                          fontWeight:     700,
                          flexShrink:     0,
                          boxShadow:      `0 0 5px ${PLANET_COLOR[p.planet as GrahaId] ?? '#888'}99`,
                          outline:        DIAGONAL_PLANETS.has(p.planet) ? `1.5px dotted rgba(255,255,255,0.5)` : 'none',
                          outlineOffset:  1,
                        }}
                      >
                        {PLANET_SYMBOL[p.planet as GrahaId] ?? p.planet[0]}
                      </div>
                    ))}
                  </div>
                )}

                {/* ── Center cell inner border ─────────────── */}
                {type === 'center' && (
                  <div style={{
                    position:     'absolute', inset: 2,
                    border:       '1.5px solid var(--sbc-center-bdr)',
                    borderRadius: 4,
                    pointerEvents:'none',
                  }} />
                )}

                {/* ── Diagonal indicator on hoverable planets ─ */}
                {type === 'nakshatra' && (cellNatal.some(p => DIAGONAL_PLANETS.has(p.planet)) || cellTransit.some(p => DIAGONAL_PLANETS.has(p.planet))) && (
                  <div style={{
                    position:  'absolute', bottom: 2, right: 2,
                    fontSize:  `${Math.max(4, cs * 0.09)}px`,
                    color:     'rgba(200,150,255,0.7)',
                    lineHeight:1,
                    pointerEvents: 'none',
                  }} title="Planet with diagonal vedha">✦</div>
                )}
              </div>
            )
          })}
        </div>

        {/* East label */}
        <DirectionLabel label="EAST" sub="→ Purva" size={size} vertical />
      </div>

      {/* South label */}
      <DirectionLabel label="SOUTH" sub="↓ Dakshina" size={size} />

      {/* Legend row */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', marginTop: 4 }}>
        {birthKey && (
          <LegendItem color="rgba(255,215,0,0.85)" border="2px solid rgba(255,215,0,0.9)" label="Birth Star" icon="⭐" />
        )}
        {nameKey && (
          <LegendItem color="rgba(135,206,250,0.6)" border="2px solid rgba(135,206,250,0.9)" label="Name Star" icon="🔤" />
        )}
        <LegendItem color="var(--sbc-nak-vdh)" border="1px solid var(--sbc-vdh-bdr)" label="Vedha Zone" />
        <LegendItem color="rgba(139,90,220,0.22)" border="1px dashed rgba(170,100,255,0.5)" label="Diagonal Vedha" />
        <LegendItem color="transparent" border="1px solid var(--sbc-act-bdr)" label="Natal Activated" />
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────

function findNakPos(grid: SBCCell[][], nakIdx: number): [number, number] {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c].nakshatraIndex === nakIdx) return [r, c]
    }
  }
  return [-1, -1]
}

function DirectionLabel({ label, sub, size, vertical }: { label: string; sub: string; size: number; vertical?: boolean }) {
  const style: CSSProperties = vertical
    ? { writingMode: 'vertical-rl', textOrientation: 'mixed', padding: '4px', minWidth: 18 }
    : { textAlign: 'center', padding: '2px 0' }

  return (
    <div style={{ ...style, display: 'flex', flexDirection: vertical ? 'column' : 'row', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
      <span style={{ fontSize: '0.55rem', fontWeight: 900, color: 'var(--gold)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</span>
      <span style={{ fontSize: '0.48rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>{sub}</span>
    </div>
  )
}

function LegendItem({ color, border, label, icon }: { color: string; border: string; label: string; icon?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.62rem', color: 'var(--text-muted)' }}>
      <div style={{ width: 11, height: 11, borderRadius: 2, background: color, border, flexShrink: 0 }} />
      {icon && <span style={{ fontSize: '0.65rem' }}>{icon}</span>}
      <span>{label}</span>
    </div>
  )
}
