// ─────────────────────────────────────────────────────────────
//  src/components/ui/GrahaTable.tsx
//  High-precision 'Micro-Details' table — clean, non-distorted
// ─────────────────────────────────────────────────────────────
'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'

import {
  GrahaData, LagnaData, UpagrahaData, RASHI_SHORT, RASHI_NAMES, NAKSHATRA_SHORT, NAKSHATRA_NAMES,
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
      padding: '1px 5px',
      borderRadius: 3,
      background: s.bg,
      color: s.color,
      fontSize: '0.62rem',
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
  upagrahas?: Record<string, UpagrahaData>
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
        list.push({ name: d.name, totalDeg: d.lonSidereal, color: 'var(--text-secondary)' })
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
    <div style={{ width: '100%', borderRadius: 'var(--r-sm)', border: '1px solid var(--border-soft)', overflow: 'hidden' }}>

      {/* ── Compact header ─────────────────────────────── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0.36rem 0.7rem',
        background: 'var(--surface-3)',
        borderBottom: '1px solid var(--border-soft)',
      }}>
        <span style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
          ✦ Micro-Details{selectedVarga !== 'D1' ? ` · ${selectedVarga}` : ''}
        </span>
        {vargas && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Varga:</span>
            <select
              value={selectedVarga}
              onChange={(e) => { const val = e.target.value; setSelectedVarga(val); if (onVargaChange) onVargaChange(val) }}
              style={{
                background: 'var(--primary-brand)', color: '#fff',
                border: '1px solid var(--gold)', borderRadius: '4px',
                fontSize: '0.74rem', fontWeight: 600,
                padding: '2px 6px', cursor: 'pointer', outline: 'none',
              }}
            >
              {vargaOptions.map(opt => (
                <option key={opt} value={opt}>
                  {opt}{VARGA_META[opt]?.full ? ` (${VARGA_META[opt].full})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div style={{ overflowX: 'auto', width: '100%' }}>
        <table style={{ width: '100%', minWidth: 460, borderCollapse: 'collapse', background: 'var(--surface-1)', tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '20%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '17%' }} />
            <col style={{ width: '13%' }} />
            <col style={{ width: '21%' }} />
          </colgroup>

          <thead>
            <tr style={{ background: 'var(--surface-2)', borderBottom: '2px solid var(--primary-brand)' }}>
              {['Body', 'Deg ′ ″', 'Nakshatra', selectedVarga === 'D1' ? 'Rashi·D9' : 'Natal→Varga', 'Dignity', 'Avasthā'].map((h, idx) => (
                <th key={h} style={{
                  padding: '0.25rem 0.45rem', color: 'var(--primary-brand)', fontSize: '0.55rem', fontWeight: 800,
                  letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: idx === 0 ? 'left' : 'center',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody style={{ fontSize: '0.76rem', fontFamily: 'var(--font-body)' }}>
            {bodies.map((b, i) => {
              const { deg, min, sec, rshort, rashiIdx } = fmtDeg(b.totalDeg)
              const nak = getNak(b.totalDeg)
              const nav = getNav(b.totalDeg)
              const natalGraha = b.id ? grahas.find(g => g.id === b.id) : undefined
              const isMainPlanet = ['Su','Mo','Ma','Me','Ju','Ve','Sa','Ra','Ke'].includes(b.id as string)

              return (
                <tr key={`${b.name}-${i}`} style={{ borderBottom: '1px solid var(--border-soft)', background: i % 2 === 0 ? 'rgba(0,0,0,0.012)' : 'transparent' }}>
                  {/* Body */}
                  <td style={{ padding: '0.2rem 0.45rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexWrap: 'wrap' }}>
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
                              yuddha: b.conditions?.yuddha,
                            })
                          }, 200)
                        }}
                        onMouseLeave={() => { if (hoverTimer.current) clearTimeout(hoverTimer.current); setHoveredPlanet(null) }}
                        style={{ fontWeight: 600, color: b.color || 'var(--text-primary)', fontSize: '0.78rem', cursor: isMainPlanet ? 'help' : 'default' }}>
                        {b.name}{b.isRetro && <sup style={{ fontSize: '0.5rem', marginLeft: 1 }}>℞</sup>}
                      </span>
                      {b.karaka && <span style={{ fontSize: '0.52rem', color: 'var(--text-muted)', fontWeight: 700, padding: '0 2px', background: 'var(--surface-3)', borderRadius: 2 }}>{b.karaka}</span>}
                      {b.conditions && <ConditionBadges graha={b.conditions} />}
                    </div>
                  </td>
                  {/* Degree — single line */}
                  <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
                    <b>{deg}°</b>{String(min).padStart(2,'0')}′{String(sec).padStart(2,'0')}″
                  </td>
                  {/* Nakshatra */}
                  <td style={{ textAlign: 'center', fontSize: '0.72rem' }}>
                    <b>{nak.name}</b> <span style={{ color: 'var(--text-muted)', fontSize: '0.6rem' }}>({nak.pada})</span>
                  </td>
                  {/* Rashi · D9 */}
                  <td style={{ textAlign: 'center', fontSize: '0.72rem' }}>
                    {selectedVarga === 'D1' ? (
                      <>
                        <b style={{ color: 'var(--text-gold)' }}>{isSa ? RASHI_SANSKRIT[rashiIdx] : rshort}</b>
                        <span style={{ fontSize: '0.6rem', color: 'var(--primary-brand)', marginLeft: 3 }}>({isSa ? RASHI_SANSKRIT[nav] : RASHI_SHORT[nav]})</span>
                      </>
                    ) : (
                      <>
                        <span style={{ color: 'var(--text-muted)' }}>{natalGraha ? (isSa ? RASHI_SANSKRIT[natalGraha.rashi] : RASHI_SHORT[natalGraha.rashi]) : '—'}</span>
                        <span style={{ color: 'var(--border-bright)', margin: '0 2px' }}>›</span>
                        <b style={{ color: 'var(--text-gold)' }}>{isSa ? RASHI_SANSKRIT[rashiIdx] : rshort}</b>
                      </>
                    )}
                  </td>
                  {/* Dignity */}
                  <td style={{ textAlign: 'center' }}>{b.dignity ? <DignityCell dignity={b.dignity} /> : <span style={{ color: 'var(--text-muted)', fontSize: '0.6rem' }}>—</span>}</td>
                  {/* Avastha */}
                  <td style={{ textAlign: 'center', fontSize: '0.7rem' }}>
                    {b.avastha
                      ? <span>{b.avastha.baladi} <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>{b.avastha.jagradadi}</span></span>
                      : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
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
      <div style={{ padding: '0.28rem 0.7rem', background: 'var(--surface-2)', borderTop: '1px solid var(--border-soft)', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {[
          { code: 'C', label: 'Combust',     bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: 'rgba(245,158,11,0.35)' },
          { code: 'G', label: 'Gandanta',    bg: 'rgba(244,63,94,0.1)',   color: '#fb7185',  border: 'rgba(244,63,94,0.3)'   },
          { code: 'P', label: 'Pushkara',    bg: 'rgba(78,205,196,0.1)',  color: 'var(--teal)', border: 'rgba(78,205,196,0.3)' },
          { code: 'M', label: 'Mrityu Bh.', bg: 'rgba(251,146,60,0.1)',  color: '#fb923c',  border: 'rgba(251,146,60,0.3)'  },
          { code: 'Y', label: 'Yuddha',      bg: 'rgba(129,140,248,0.1)', color: '#818cf8',  border: 'rgba(129,140,248,0.3)' },
        ].map(({ code, label, bg, color, border }) => (
          <div key={code} style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            <span style={{ fontSize: '0.55rem', background: bg, color, padding: '0 3px', borderRadius: 2, border: `1px solid ${border}`, fontWeight: 700 }}>{code}</span>
            <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>{label}</span>
          </div>
        ))}
      </div>
      
    </div>
  )
}
