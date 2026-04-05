// ─────────────────────────────────────────────────────────────
//  src/components/ui/GrahaTable.tsx
//  High-precision 'Micro-Details' table — clean, non-distorted
// ─────────────────────────────────────────────────────────────
'use client'

import React from 'react'
import {
  GrahaData, LagnaData, RASHI_SHORT, NAKSHATRA_SHORT,
  GRAHA_NAMES, GRAHA_SANSKRIT, RASHI_SANSKRIT, Rashi, GrahaId
} from '@/types/astrology'
import { useAppLayout } from '@/components/providers/LayoutProvider'
import { ConditionBadges } from '@/components/ui/AdvancedAnalysisPanel'

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
}

interface GrahaTableProps {
  grahas:     GrahaData[]
  lagnas?:    LagnaData
  upagrahas?: Record<string, GrahaData>
  limited?:   boolean
}

// ── Component ────────────────────────────────────────────────

export function GrahaTable({ grahas, lagnas, upagrahas, limited = false }: GrahaTableProps) {
  const { language } = useAppLayout()
  const isSa = language === 'sa'

  // Build combined body list
  const bodies: BodyInfo[] = []
  const main9 = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']

  grahas
    .filter(g => !limited || main9.includes(g.id))
    .forEach(g => {
      bodies.push({
        id:       g.id,
        name:     isSa ? GRAHA_SANSKRIT[g.id] : GRAHA_NAMES[g.id],
        totalDeg: g.totalDegree,
        isRetro:  g.isRetro,
        karaka:   g.charaKaraka,
        color:    g.isRetro ? 'var(--rose)' : 'inherit',
        avastha:  g.avastha,
        dignity:  g.dignity,
      })
    })

  if (lagnas) {
    const items = [
      { name: 'Lagna',              deg: lagnas.ascDegree    },
      ...(!limited ? [
        { name: 'Bhāva Lagna (BL)', deg: lagnas.bhavaLagna  },
        { name: 'Hora Lagna (HL)',  deg: lagnas.horaLagna   },
        { name: 'Ghaṭi Lagna (GL)',deg: lagnas.ghatiLagna  },
        { name: 'Prāṇapada (PP)',  deg: lagnas.pranapada   },
        { name: 'Śrī Lagna (SL)',  deg: lagnas.sriLagna    },
        { name: 'Varṇada (VL)',    deg: lagnas.varnadaLagna },
      ] : []),
    ]
    items.forEach(l => {
      if (l.deg !== undefined && l.deg !== 0)
        bodies.push({ name: l.name, totalDeg: l.deg, color: 'var(--text-gold)' })
    })
  }

  if (upagrahas && !limited) {
    Object.values(upagrahas).forEach(d => {
      bodies.push({ name: d.name, totalDeg: d.totalDegree, color: 'var(--text-secondary)' })
    })
  }

  // ── Render ────────────────────────────────────────────────
  return (
    <div style={{ width: '100%', borderRadius: 'var(--r-md)', border: '1px solid var(--border-soft)', overflow: 'hidden' }}>

      {/* ── Legend ─────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '0.5rem 1rem',
        padding: '0.5rem 0.9rem',
        background: 'var(--surface-2)',
        borderBottom: '1px solid var(--border-soft)',
        fontSize: '0.68rem',
        color: 'var(--text-muted)',
        lineHeight: 1.5,
      }}>
        <span style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)' }}>
          Conditions:
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
          <LBadge label="G" bg="rgba(224,123,142,0.15)" color="var(--rose)" /> Gandanta
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
          <LBadge label="P" bg="rgba(78,205,196,0.12)" color="var(--teal)" /> Puṣkara
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
          <LBadge label="M" bg="rgba(245,158,66,0.12)" color="var(--amber, #f59e42)" /> Mṛtyu Bhāga
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
          <LBadge label="YW" bg="rgba(78,205,196,0.15)" color="var(--teal)" />
          <LBadge label="YL" bg="rgba(224,123,142,0.15)" color="var(--rose)" />
          &nbsp;Yuddha
        </span>
      </div>

      {/* ── Scrollable table wrapper ────────────────────────── */}
      <div style={{ overflowX: 'auto', width: '100%' }}>
        <table style={{
          width: '100%',
          minWidth: 520,
          borderCollapse: 'collapse',
          background: 'var(--surface-1)',
          tableLayout: 'fixed',
        }}>
          <colgroup>
            <col style={{ width: '22%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '16%' }} />
            <col style={{ width: '16%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '16%' }} />
          </colgroup>

          <thead>
            <tr style={{ background: 'var(--surface-2)', borderBottom: '2px solid var(--primary-brand)' }}>
              {['Body', 'Deg  ′  ″', 'Nakshatra', 'Rashi · D9', 'Dignity', 'Avasthā'].map((h, idx) => (
                <th key={h} style={{
                  padding: '0.55rem 0.7rem',
                  color: 'var(--primary-brand)',
                  fontSize: '0.6rem',
                  fontWeight: 800,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  textAlign: idx === 0 ? 'left' : 'center', // Center analysis columns
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
              const graha = b.id ? grahas.find(g => g.id === b.id) : undefined

              return (
                <tr
                  key={`${b.name}-${i}`}
                  style={{
                    borderBottom: '1px solid var(--border-soft)',
                    background: i % 2 === 0 ? 'rgba(0,0,0,0.015)' : 'transparent',
                  }}
                >
                  {/* ── Body ──────────────────────────────── */}
                  <td style={{ padding: '0.45rem 0.7rem', verticalAlign: 'middle', textAlign: 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'nowrap' }}>
                      <span style={{
                        fontWeight: 600,
                        color: b.color || 'var(--text-primary)',
                        fontSize: '0.82rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '7rem',
                      }}>
                        {b.name}
                        {b.isRetro && (
                          <span style={{ fontSize: '0.58rem', marginLeft: 3, verticalAlign: 'super', opacity: 0.8 }}>R</span>
                        )}
                      </span>
                      {b.karaka && (
                        <span style={{
                          fontSize: '0.58rem', color: 'var(--text-muted)', fontWeight: 700,
                          padding: '0 3px', background: 'var(--surface-3)', borderRadius: 3,
                          flexShrink: 0,
                        }}>
                          {b.karaka}
                        </span>
                      )}
                    </div>
                    {/* Condition badges on same row below name — compact */}
                    {graha && (
                      <div style={{ marginTop: '0.15rem' }}>
                        <ConditionBadges graha={graha} />
                      </div>
                    )}
                  </td>

                  {/* ── Deg ───────────────────────────────── */}
                  <td style={{
                    padding: '0.45rem 0.7rem',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.76rem',
                    color: 'var(--text-secondary)',
                    whiteSpace: 'nowrap',
                    verticalAlign: 'middle',
                    textAlign: 'center',
                  }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{deg}°</span>
                    <span style={{ color: 'var(--text-muted)', margin: '0 1px' }}>{String(min).padStart(2, '0')}′</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{String(sec).padStart(2, '0')}″</span>
                  </td>

                  {/* ── Nakshatra ─────────────────────────── */}
                  <td style={{ padding: '0.45rem 0.7rem', verticalAlign: 'middle', textAlign: 'center' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.8rem' }}>
                      {nak.name}
                    </span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginLeft: 3 }}>
                      ({nak.pada})
                    </span>
                  </td>

                  {/* ── Rashi · D9 ────────────────────────── */}
                  <td style={{ padding: '0.45rem 0.7rem', verticalAlign: 'middle', textAlign: 'center' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-gold)', fontSize: '0.8rem' }}>
                      {isSa ? RASHI_SANSKRIT[rashiIdx] : rshort}
                    </span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--primary-brand)', marginLeft: 4, opacity: 0.8 }}>
                      ({isSa ? RASHI_SANSKRIT[nav] : RASHI_SHORT[nav]})
                    </span>
                  </td>

                  {/* ── Dignity ───────────────────────────── */}
                  <td style={{ padding: '0.45rem 0.7rem', verticalAlign: 'middle', textAlign: 'center' }}>
                    {b.dignity ? <DignityCell dignity={b.dignity} /> : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>

                  {/* ── Avasthā ───────────────────────────── */}
                  <td style={{ padding: '0.45rem 0.7rem', verticalAlign: 'middle', textAlign: 'center' }}>
                    {b.avastha ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.76rem', color: 'var(--text-primary)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                          {b.avastha.baladi}
                        </span>
                        <span style={{
                          fontSize: '0.62rem', color: 'var(--text-muted)',
                          background: 'var(--surface-2)', padding: '0 5px',
                          borderRadius: 3, whiteSpace: 'nowrap',
                          display: 'inline-block', width: 'fit-content',
                        }}>
                          {b.avastha.jagradadi}
                        </span>
                      </div>
                    ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
