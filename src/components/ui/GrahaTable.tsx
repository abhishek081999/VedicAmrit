// ─────────────────────────────────────────────────────────────
//  src/components/ui/GrahaTable.tsx
//  High-precision 'Micro-Details' table — clean, non-distorted
// ─────────────────────────────────────────────────────────────
'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'

import {
  GrahaData, LagnaData, RASHI_SHORT, RASHI_NAMES, NAKSHATRA_SHORT, NAKSHATRA_NAMES,
  GRAHA_NAMES, GRAHA_SANSKRIT, RASHI_SANSKRIT, Rashi, GrahaId
} from '@/types/astrology'
import { SIGN_INTERPRETATIONS, NAKSHATRA_INTERPRETATIONS, DIGNITY_INTERPRETATIONS } from '@/lib/engine/interpretations'
import { PlanetTooltipCard, type PlanetTooltipData } from '@/components/ui/PlanetHoverTooltip'

import { useAppLayout } from '@/components/providers/LayoutProvider'
import { ConditionBadges } from '@/components/ui/AdvancedAnalysisPanel'
import { VARGA_META, getVargaPosition, SHODASHA_VARGAS } from '@/lib/engine/vargas'

// ── Helpers ──────────────────────────────────────────────────

function fmtDeg(totalDeg: number) {
  const rashiBase   = Math.floor(totalDeg / 30)
  const degInRashi  = totalDeg % 30
  const d = Math.floor(degInRashi)
  const m = Math.floor((degInRashi - d) * 60)
  const s = Math.floor(((degInRashi - d) * 60 - m) * 60)
  const rshort = RASHI_SHORT[(rashiBase % 12 + 1) as Rashi]
  return {
    deg:      d,
    min:      m,
    sec:      s,
    rshort,
    rashiIdx: (rashiBase % 12 + 1) as Rashi,
  }
}

function getNak(totalDeg: number) {
  const nakSize   = 360 / 27
  const nakIdx    = Math.floor(totalDeg / nakSize)
  const degInNak  = totalDeg % nakSize
  const pada      = Math.floor(degInNak / (nakSize / 4)) + 1
  return { name: NAKSHATRA_SHORT[nakIdx % 27], pada }
}

function getNav(totalDeg: number): Rashi {
  const navSize = 30 / 9
  return (Math.floor((totalDeg % 360) / navSize) % 12 + 1) as Rashi
}

const DIGNITY_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  exalted:       { bg: 'rgba(201,168,76,0.12)',  color: 'var(--gold)',  label: 'Exalted'   },
  moolatrikona:  { bg: 'rgba(201,168,76,0.10)',  color: 'var(--gold)',  label: 'Moola'     },
  own:           { bg: 'rgba(201,168,76,0.10)',  color: 'var(--gold)',  label: 'Own'       },
  great_friend:  { bg: 'rgba(78,205,196,0.10)',  color: 'var(--teal)',  label: 'Gr.Friend' },
  friend:        { bg: 'rgba(78,205,196,0.08)',  color: 'var(--teal)',  label: 'Friend'    },
  neutral:       { bg: 'transparent',            color: 'var(--text-muted)', label: 'Neutral' },
  enemy:         { bg: 'rgba(224,123,142,0.08)', color: 'var(--rose)',  label: 'Enemy'     },
  great_enemy:   { bg: 'rgba(224,123,142,0.08)', color: 'var(--rose)',  label: 'Gr.Enemy'  },
  debilitated:   { bg: 'rgba(224,123,142,0.12)', color: 'var(--rose)',  label: 'Debil.'    },
}

function DignityCell({ dignity }: { dignity: string }) {
  const s = DIGNITY_STYLE[dignity] ?? DIGNITY_STYLE.neutral
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 7px',
      borderRadius: 4,
      background: s.bg,
      color: s.color,
      fontSize: '0.68rem',
      fontWeight: 600,
      whiteSpace: 'nowrap',
      border: `1px solid ${s.color}33`,
    }}>
      {s.label}
    </span>
  )
}

// ── Legend badge ─────────────────────────────────────────────

function LBadge({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <span style={{
      background: bg, color, padding: '1px 5px',
      borderRadius: 3, fontSize: '0.6rem', fontWeight: 700,
      lineHeight: 1.4, display: 'inline-block',
    }}>
      {label}
    </span>
  )
}

// ── Types ─────────────────────────────────────────────────────

interface BodyInfo {
  id?:      GrahaId | string
  name:     string
  totalDeg: number
  isRetro?: boolean
  karaka?:  string | null
  color?:   string
  avastha?: { baladi: string; jagradadi: string }
  dignity?: string
  conditions?: any
}



interface GrahaTableProps {
  grahas:     GrahaData[]
  lagnas?:    LagnaData
  upagrahas?: Record<string, GrahaData>
  limited?:   boolean
  vargas?:      Record<string, GrahaData[]>
  vargaLagnas?: Record<string, Rashi>
  activeVarga?: string
  onVargaChange?: (v: string) => void
}



// ── Component ────────────────────────────────────────────

export function GrahaTable({ grahas, lagnas, upagrahas, limited = false, vargas, vargaLagnas, activeVarga, onVargaChange }: GrahaTableProps) {
  const { language } = useAppLayout()
  const isSa = language === 'sa'
  const [selectedVarga, setSelectedVarga] = React.useState<string>(activeVarga || 'D1')
  const [hoveredPlanet, setHoveredPlanet] = useState<PlanetTooltipData | null>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [isMounted, setIsMounted] = useState(false)
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { setIsMounted(true) }, [])

  // Sync with prop ONLY if it changes from its previous value
  const lastActiveVarga = useRef(activeVarga)
  useEffect(() => {
    if (activeVarga !== lastActiveVarga.current) {
      if (activeVarga) setSelectedVarga(activeVarga)
      lastActiveVarga.current = activeVarga
    }
  }, [activeVarga])

  // 1. Identify which Graha set to use for coordinates
  // Use the selected varga's grahas if available, otherwise fallback to root grahas (D1)
  const currentVargaGrahas = (vargas && vargas[selectedVarga]) ? vargas[selectedVarga] : grahas

  // 2. Prepare the bodies list for the table
  const bodies = useMemo(() => {
    const list: BodyInfo[] = []
    const mainIds = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']
    
    // Filter and map the planets for the current varga
    currentVargaGrahas
      .filter(g => !limited || mainIds.includes(g.id))
      .forEach(g => {
        list.push({
          id:       g.id,
          name:     isSa ? GRAHA_SANSKRIT[g.id] : GRAHA_NAMES[g.id],
          totalDeg: g.totalDegree,
          isRetro:  g.isRetro,
          karaka:   g.charaKaraka,
          color:    g.isRetro ? 'var(--rose)' : 'inherit',
          avastha:  g.avastha,
          dignity:  g.dignity,
          conditions: g,
        })
      })

    // Handle Lagnas (Ascendants)
    if (selectedVarga === 'D1' && lagnas) {
      const items = [
        { name: 'Lagna',              deg: lagnas.ascDegree    },
        ...(!limited ? [
          { name: 'BH (Bhāva)',       deg: lagnas.bhavaLagna   },
          { name: 'HL (Hora)',        deg: lagnas.horaLagna    },
          { name: 'GL (Ghaṭi)',       deg: lagnas.ghatiLagna   },
          { name: 'PP (Prāṇapada)',   deg: lagnas.pranapada    },
          { name: 'SL (Śrī)',         deg: lagnas.sriLagna     },
          { name: 'VL (Varṇada)',     deg: lagnas.varnadaLagna },
        ] : []),
      ]
      items.forEach(l => {
        if (l.deg !== undefined && l.deg !== 0) {
          list.push({ name: l.name, totalDeg: l.deg, color: 'var(--text-gold)' })
        }
      })
    } else if (lagnas) {
      // Find the specific Varga Lagna rashi
      const vLagnaRashi = (vargaLagnas && vargaLagnas[selectedVarga]) || lagnas.ascRashi || 1
      const vPosition = getVargaPosition(lagnas.ascDegree, selectedVarga as any)
      
      list.push({ 
        name: `Lagna (${selectedVarga})`, 
        totalDeg: vPosition ? vPosition.totalDegree : (vLagnaRashi - 1) * 30,
        color: 'var(--text-gold)' 
      })
    }

    // Upagrahas only in D1
    if (upagrahas && !limited && selectedVarga === 'D1') {
      Object.values(upagrahas).forEach(d => {
        list.push({ name: d.name, totalDeg: d.totalDegree, color: 'var(--text-secondary)' })
      })
    }

    return list
  }, [currentVargaGrahas, selectedVarga, lagnas, upagrahas, vargaLagnas, isSa, limited])

  const vargaOptions = vargas ? Object.keys(vargas)
    .filter(opt => SHODASHA_VARGAS.includes(opt as any) || opt === 'D1')
    .sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, '') || '0', 10)
      const numB = parseInt(b.replace(/\D/g, '') || '0', 10)
      return numA - numB || a.localeCompare(b)
    }) : ['D1']

  // Normalized Lagna for house calculations
  const currentLagnaRashi = (selectedVarga === 'D1')
    ? (lagnas?.ascRashi || 1)
    : ((vargaLagnas && vargaLagnas[selectedVarga]) || (lagnas?.ascRashi || 1))

  return (
    <div style={{ width: '100%', borderRadius: 'var(--r-md)', border: '1px solid var(--border-soft)', overflow: 'hidden' }}>

      {/* ── Header with Varga Selector ─────────────────── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.6rem 0.9rem',
        background: 'var(--surface-3)',
        borderBottom: '1px solid var(--border-soft)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontSize: '0.9rem' }}>✦</span>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
            Micro-Details {selectedVarga !== 'D1' ? ` — ${selectedVarga}` : ''}
          </span>
        </div>
        
        {vargas && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Switch Varga:</span>
            <select 
              value={selectedVarga}
              onChange={(e) => {
                const val = e.target.value
                setSelectedVarga(val)
                if (onVargaChange) onVargaChange(val)
              }}
              style={{
                background: 'var(--primary-brand)',
                color: '#fff',
                border: '1px solid var(--gold)',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                padding: '4px 10px',
                cursor: 'pointer',
                outline: 'none',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              }}
            >
              {vargaOptions.map(opt => (
                <option key={opt} value={opt}>
                  {opt} {VARGA_META[opt]?.full ? `(${VARGA_META[opt].full})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div style={{ overflowX: 'auto', width: '100%' }}>
        <table style={{ width: '100%', minWidth: 520, borderCollapse: 'collapse', background: 'var(--surface-1)', tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '22%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '16%' }} />
            <col style={{ width: '18%' }} />
            <col style={{ width: '13%' }} />
            <col style={{ width: '16%' }} />
          </colgroup>

          <thead>
            <tr style={{ background: 'var(--surface-2)', borderBottom: '2px solid var(--primary-brand)' }}>
              {['Body', 'Deg  ′  ″', 'Nakshatra', selectedVarga === 'D1' ? 'Rashi · D9' : 'Natal · Varga', 'Dignity', 'Avasthā'].map((h, idx) => (
                <th key={h} style={{
                  padding: '0.55rem 0.7rem', color: 'var(--primary-brand)', fontSize: '0.6rem', fontWeight: 800,
                  letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: idx === 0 ? 'left' : 'center',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody style={{ fontSize: '0.8rem' }}>
            {bodies.map((b, i) => {
              const { deg, min, sec, rshort, rashiIdx } = fmtDeg(b.totalDeg)
              const nak = getNak(b.totalDeg)
              const nav = getNav(b.totalDeg)
              // Lookup natal graha for cross-reference
              const natalGraha = b.id ? grahas.find(g => g.id === b.id) : undefined
              const isMainPlanet = ['Su','Mo','Ma','Me','Ju','Ve','Sa','Ra','Ke'].includes(b.id as string)

              return (
                <tr key={`${b.name}-${i}`} style={{ borderBottom: '1px solid var(--border-soft)', background: i % 2 === 0 ? 'rgba(0,0,0,0.015)' : 'transparent' }}>
                  <td style={{ padding: '0.45rem 0.7rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span 
                        onMouseEnter={(e) => {
                          if (!isMainPlanet || !natalGraha) return
                          setMousePos({ x: e.clientX, y: e.clientY })
                          if (hoverTimer.current) clearTimeout(hoverTimer.current)
                          hoverTimer.current = setTimeout(() => {
                            const nak = getNak(b.totalDeg)
                            const house = ((rashiIdx - currentLagnaRashi + 12) % 12) + 1
                            setHoveredPlanet({
                              id: String(b.id), name: b.name, totalDeg: b.totalDeg,
                              isRetro: b.isRetro, dignity: b.dignity, avastha: b.avastha,
                              nakshatraName: nak.name, pada: nak.pada, house,
                              nakshatraIndex: Math.floor(b.totalDeg / (360/27)) % 27,
                              charaKaraka: b.karaka ?? undefined,
                              isCombust: natalGraha.isCombust,
                              gandanta: b.conditions?.gandanta,
                              pushkara: b.conditions?.pushkara,
                              mrityuBhaga: b.conditions?.mrityuBhaga,
                            })
                          }, 200)
                        }}
                        onMouseLeave={() => {
                          if (hoverTimer.current) clearTimeout(hoverTimer.current)
                          setHoveredPlanet(null)
                        }}
                        style={{ fontWeight: 600, color: b.color || 'var(--text-primary)', fontSize: '0.82rem', cursor: isMainPlanet ? 'help' : 'default' }}>
                        {b.name} {b.isRetro && <span style={{ fontSize: '0.58rem' }}>℞</span>}
                      </span>
                      {b.karaka && <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)', fontWeight: 700, padding: '0 3px', background: 'var(--surface-3)', borderRadius: 3 }}>{b.karaka}</span>}
                    </div>
                    {b.conditions && <div style={{ marginTop: '0.15rem' }}><ConditionBadges graha={b.conditions} /></div>}
                  </td>
                  <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.76rem' }}>
                    <span style={{ fontWeight: 600 }}>{deg}°</span> {String(min).padStart(2, '0')}′ {String(sec).padStart(2, '0')}″
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ fontWeight: 600 }}>{nak.name}</span> <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>({nak.pada})</span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {selectedVarga === 'D1' ? (
                      <>
                        <span style={{ fontWeight: 700, color: 'var(--text-gold)' }}>{isSa ? RASHI_SANSKRIT[rashiIdx] : rshort}</span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--primary-brand)', marginLeft: 4 }}>({isSa ? RASHI_SANSKRIT[nav] : RASHI_SHORT[nav]})</span>
                      </>
                    ) : (
                      <>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{natalGraha ? (isSa ? RASHI_SANSKRIT[natalGraha.rashi] : RASHI_SHORT[natalGraha.rashi]) : '—'}</span>
                        <span style={{ color: 'var(--border-bright)', margin: '0 4px' }}>→</span>
                        <span style={{ fontWeight: 700, color: 'var(--text-gold)' }}>{isSa ? RASHI_SANSKRIT[rashiIdx] : rshort}</span>
                      </>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>{b.dignity ? <DignityCell dignity={b.dignity} /> : '—'}</td>
                  <td style={{ textAlign: 'center' }}>{b.avastha ? <div style={{ fontSize: '0.76rem' }}>{b.avastha.baladi}<div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{b.avastha.jagradadi}</div></div> : '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── Tooltip Portal ── */}
      {isMounted && hoveredPlanet && (
        <PlanetTooltipCard 
          planet={hoveredPlanet} 
          x={mousePos.x} y={mousePos.y} 
          onClose={() => setHoveredPlanet(null)} 
        />
      )}

      {/* ── Legend ── */}
      <div style={{ padding: '0.5rem 0.9rem', background: 'var(--surface-2)', borderTop: '1px solid var(--border-soft)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <span style={{ fontSize: '0.6rem', background: 'rgba(244,63,94,0.1)', color: '#fb7185', padding: '1px 4px', borderRadius: 3, border: '1px solid rgba(244,63,94,0.3)', fontWeight: 700 }}>G</span>
          <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Gandanta</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <span style={{ fontSize: '0.6rem', background: 'rgba(78,205,196,0.1)', color: 'var(--teal)', padding: '1px 4px', borderRadius: 3, border: '1px solid rgba(78,205,196,0.3)', fontWeight: 700 }}>P</span>
          <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Pushkara</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <span style={{ fontSize: '0.6rem', background: 'rgba(251,146,60,0.1)', color: '#fb923c', padding: '1px 4px', borderRadius: 3, border: '1px solid rgba(251,146,60,0.3)', fontWeight: 700 }}>M</span>
          <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Mrityu Bhaga</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <span style={{ fontSize: '0.6rem', background: 'rgba(129,140,248,0.1)', color: '#818cf8', padding: '1px 4px', borderRadius: 3, border: '1px solid rgba(129,140,248,0.3)', fontWeight: 700 }}>Y</span>
          <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Yuddha (War)</span>
        </div>
      </div>
      
    </div>
  )
}
