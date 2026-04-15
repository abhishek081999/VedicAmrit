'use client'

/**
 * src/components/ui/SarvatobhadraChakra.tsx
 *
 * Interactive 9×9 Sarvatobhadra Chakra grid.
 * All colours are driven by CSS custom properties defined in globals.css
 * so the grid adapts automatically to Dark / Light / Classic themes.
 */

import { useState, useMemo, useCallback, CSSProperties } from 'react'
import type { SBCCell, PlanetOnSBC } from '@/lib/engine/sarvatobhadra'
import { PLANET_SYMBOL, PLANET_COLOR } from '@/lib/engine/sarvatobhadra'
import type { GrahaId } from '@/types/astrology'

// ─────────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────────

interface Props {
  grid:            SBCCell[][]
  natalPlanets:    PlanetOnSBC[]
  transitPlanets:  PlanetOnSBC[]
  onCellClick?:    (cell: SBCCell) => void
  /** Total pixel width — height equals width. Default 612 */
  size?:           number
  /** Multiple for text size. Default 1.0 */
  fontScale?:      number
  /** Font weight for cell labels. Default 600 */
  fontWeight?:     number | string
}

// ─────────────────────────────────────────────────────────────
//  CSS variable getters for each cell type / state
//  These read from the current theme's --sbc-* custom properties.
// ─────────────────────────────────────────────────────────────

function cellBg(type: string, isVedha: boolean): string {
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

// ─────────────────────────────────────────────────────────────
//  Component
// ─────────────────────────────────────────────────────────────

export function SarvatobhadraChakra({
  grid,
  natalPlanets,
  transitPlanets,
  onCellClick,
  size = 612,
  fontScale = 1.0,
  fontWeight = 600,
}: Props) {
  const [hovered, setHovered] = useState<[number, number] | null>(null)

  const cs = Math.floor(size / 9)      // cell size px
  const fs = Math.max(6, cs * 0.105) * fontScale // base font size px

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

  // ── Vedha sets ──────────────────────────────────────────────
  const { vedhaSet, natalActivatedSet } = useMemo(() => {
    const vedha = new Set<string>()
    const activated = new Set<string>()
    if (!hovered) return { vedhaSet: vedha, natalActivatedSet: activated }
    const [hr, hc] = hovered
    for (let i = 0; i < 9; i++) {
      if (i !== hc) vedha.add(`${hr},${i}`)
      if (i !== hr) vedha.add(`${i},${hc}`)
    }
    vedha.forEach(k => { if (natalMap.has(k)) activated.add(k) })
    return { vedhaSet: vedha, natalActivatedSet: activated }
  }, [hovered, natalMap])

  // ── Cell style ──────────────────────────────────────────────
  const cellStyle = useCallback((cell: SBCCell): CSSProperties => {
    const k       = `${cell.row},${cell.col}`
    const isHov   = hovered?.[0] === cell.row && hovered?.[1] === cell.col
    const isVedha = vedhaSet.has(k)
    const isAct   = natalActivatedSet.has(k)

    let border = '1px solid transparent'
    let shadow = 'none'
    let zIndex: number | 'auto' = 'auto'

    if (isHov) {
      border = '1px solid var(--sbc-hov-bdr)'
      shadow = 'var(--sbc-hov-shd)'
      zIndex = 3
    } else if (isAct) {
      border = '1px solid var(--sbc-act-bdr)'
      shadow = 'var(--sbc-act-shd)'
      zIndex = 2
    } else if (isVedha) {
      border = '1px solid var(--sbc-vdh-bdr)'
      zIndex = 1
    }

    return {
      width:          cs,
      height:         cs,
      background:     cellBg(cell.type, isVedha),
      border,
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
      transition:     'background 0.18s ease, border-color 0.13s ease, box-shadow 0.13s ease',
    }
  }, [cs, hovered, vedhaSet, natalActivatedSet])

  // ─────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        display:             'grid',
        gridTemplateColumns: `repeat(9, ${cs}px)`,
        gridTemplateRows:    `repeat(9, ${cs}px)`,
        gap:                 1,
        background:          'var(--sbc-grid-bg)',
        borderRadius:        10,
        padding:             1,
        border:              '1px solid var(--sbc-grid-bdr)',
        boxShadow:           '0 4px 32px rgba(0,0,0,0.15)',
      }}
    >
      {grid.flat().map(cell => {
        const k           = `${cell.row},${cell.col}`
        const cellNatal   = natalMap.get(k) ?? []
        const cellTransit = transitMap.get(k) ?? []
        const hasAny      = cellNatal.length > 0 || cellTransit.length > 0
        const badgeSize   = Math.max(9, cs * 0.17)
        const type        = cell.type

        return (
          <div
            key={k}
            style={cellStyle(cell)}
            onMouseEnter={() => setHovered([cell.row, cell.col])}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onCellClick?.(cell)}
          >
            {/* ── Label ─────────────────────────────────────── */}
            <div style={{
              textAlign:   'center',
              lineHeight:   1.15,
              paddingBottom: hasAny ? badgeSize + 2 : 0,
            }}>
              {type === 'nakshatra' ? (
                cell.label.split(' ').map((word, wi) => (
                  <span key={wi} style={{
                    display:    'block',
                    fontSize:   `${fs * 0.86}px`,
                    fontWeight: fontWeight,
                    color:      cellTextColor(type),
                    fontFamily: 'var(--font-display)',
                    letterSpacing: '-0.02em',
                  }}>
                    {word}
                  </span>
                ))
              ) : (
                <>
                  <div style={{
                    fontSize:  type === 'vowel' || type === 'consonant'
                      ? `${fs * 1.45}px`
                      : type === 'center' ? `${fs * 0.88}px`
                      : `${fs * 1.1}px`,
                    fontWeight: fontWeight,
                    color:      cellTextColor(type),
                    fontFamily: type === 'vowel' || type === 'consonant'
                      ? '"Noto Sans Devanagari", "Mangal", "Devanagari", serif'
                      : 'var(--font-display)',
                    lineHeight: 1.15,
                  }}>
                    {cell.label}
                  </div>
                  {cell.sublabel && (type === 'vara') && (
                    <div style={{
                      fontSize:   `${Math.max(5, fs * 0.68)}px`,
                      color:      cellTextColor(type),
                      opacity:    0.55,
                      fontFamily: 'var(--font-display)',
                      marginTop:  1,
                      lineHeight: 1,
                    }}>
                      {cell.sublabel}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ── Planet badges ──────────────────────────────── */}
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
                    title={`${p._natal ? '● Natal' : '◌ Transit'} ${p.planet}`}
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
                      boxShadow:      `0 0 4px ${PLANET_COLOR[p.planet as GrahaId] ?? '#888'}88`,
                    }}
                  >
                    {PLANET_SYMBOL[p.planet as GrahaId] ?? p.planet[0]}
                  </div>
                ))}
              </div>
            )}

            {/* ── Center cell border accent ──────────────────── */}
            {type === 'center' && (
              <div style={{
                position:      'absolute',
                inset:         2,
                border:        '1.5px solid var(--sbc-center-bdr)',
                borderRadius:  4,
                pointerEvents: 'none',
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}
