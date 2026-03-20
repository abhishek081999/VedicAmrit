// ─────────────────────────────────────────────────────────────
//  src/components/ui/GrahaTable.tsx
//  High-precision 'Micro-Details' table
//  Matches professional workstations (JHora/Devaguru)
// ─────────────────────────────────────────────────────────────
'use client'

import React from 'react'
import {
  GrahaData, LagnaData, RASHI_SHORT, NAKSHATRA_SHORT,
  GRAHA_NAMES, Rashi
} from '@/types/astrology'

// ── Helpers ──────────────────────────────────────────────────

function fmtDMS(totalDeg: number) {
  const rashiBase = Math.floor(totalDeg / 30)
  const degInRashi = totalDeg % 30
  const d = Math.floor(degInRashi)
  const m = Math.floor((degInRashi - d) * 60)
  const s = Math.floor(((degInRashi - d) * 60 - m) * 60)

  const rshort = RASHI_SHORT[(rashiBase % 12 + 1) as Rashi]
  return {
    display: `${String(d).padStart(2, '0')} ${rshort} ${String(m).padStart(2, '0')}' ${String(s).padStart(2, '0')}"`,
    rshort
  }
}

function getNakInfo(totalDeg: number) {
  const nakSize = 360 / 27
  const nakIdx = Math.floor(totalDeg / nakSize)
  const degInNak = totalDeg % nakSize
  const pada = Math.floor(degInNak / (nakSize / 4)) + 1
  return {
    name: NAKSHATRA_SHORT[nakIdx % 27],
    pada
  }
}

function getNavamsha(totalDeg: number): Rashi {
  const navSize = 30 / 9
  const navIdx = Math.floor((totalDeg % 360) / navSize)
  return (navIdx % 12 + 1) as Rashi
}

function dignityBadge(dignity: string) {
  const isGold = ['exalted', 'moolatrikona', 'own', 'great_friend'].includes(dignity)
  const isDanger = ['debilitated', 'great_enemy', 'enemy'].includes(dignity)

  let bg = 'rgba(255,255,255,0.03)'
  let color = 'var(--text-muted)'
  let text = dignity.replace('_', ' ')

  if (isGold) {
    bg = 'var(--gold-faint)'
    color = 'var(--text-gold)'
  } else if (isDanger) {
    bg = 'rgba(224,123,142,0.08)'
    color = 'var(--rose)'
  } else if (dignity === 'friend') {
    bg = 'rgba(78,205,196,0.08)'
    color = 'var(--teal)'
  }
  if (dignity === 'neutral') text = 'Neutral'

  return (
    <span style={{
      display: 'inline-block', padding: '0.15rem 0.5rem', borderRadius: '4px',
      background: bg, color: color, fontSize: '0.65rem', fontWeight: 600,
      textTransform: 'capitalize', letterSpacing: '0.02em', whiteSpace: 'nowrap',
      border: `1px solid ${color}22`
    }}>
      {text}
    </span>
  )
}

// ── Types ─────────────────────────────────────────────────────

interface BodyInfo {
  name: string
  totalDeg: number
  isRetro?: boolean
  karaka?: string | null
  color?: string
  avastha?: { baladi: string; jagradadi: string }
  dignity?: string
}

interface GrahaTableProps {
  grahas: GrahaData[]
  lagnas?: LagnaData
  upagrahas?: Record<string, GrahaData>
}

// ── Component ────────────────────────────────────────────────

export function GrahaTable({ grahas, lagnas, upagrahas }: GrahaTableProps) {

  // 1. Build a combined List of all bodies
  const bodies: BodyInfo[] = []

  // Add 9 Grahas
  grahas.forEach(g => {
    bodies.push({
      name: GRAHA_NAMES[g.id],
      totalDeg: g.totalDegree,
      isRetro: g.isRetro,
      karaka: g.charaKaraka,
      color: g.isRetro ? 'var(--rose)' : 'inherit',
      avastha: g.avastha,
      dignity: g.dignity
    })
  })

  // Add Lagnas
  if (lagnas) {
    const lagnaItems = [
      { name: 'Lagna', deg: lagnas.ascDegree },
      { name: 'Bhāva Lagna (BL)', deg: lagnas.bhavaLagna },
      { name: 'Hora Lagna (HL)', deg: lagnas.horaLagna },
      { name: 'Ghaṭi Lagna (GL)', deg: lagnas.ghatiLagna },
      { name: 'Prāṇapada (PP)', deg: lagnas.pranapada },
      { name: 'Śrī Lagna (SL)', deg: lagnas.sriLagna },
      { name: 'Varṇada Lagna (VL)', deg: lagnas.varnadaLagna },
    ]
    lagnaItems.forEach(l => {
      if (l.deg !== undefined && l.deg !== 0) {
        bodies.push({ name: l.name, totalDeg: l.deg, color: 'var(--text-gold)' })
      }
    })
  }

  // Add Upagrahas (Mandi, Gulika)
  if (upagrahas) {
    Object.entries(upagrahas).forEach(([id, data]) => {
      bodies.push({ name: data.name, totalDeg: data.totalDegree, color: 'var(--text-secondary)' })
    })
  }

  return (
    <div style={{ overflowX: 'auto', width: '100%', borderRadius: 'var(--r-md)', border: '1px solid var(--border-soft)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', background: 'var(--surface-1)' }}>
        <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
          <tr style={{ background: 'var(--surface-2)', borderBottom: '2px solid var(--primary-brand)' }}>
            {['BODY', 'LONGITUDE', 'NAKSHATRA (P)', 'RASHI (D9)', 'DIGNITY', 'AVASTHĀ'].map((h) => (
              <th key={h} style={{
                padding: '0.65rem 0.75rem', color: 'var(--primary-brand)', fontSize: '0.62rem',
                fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase'
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody style={{ fontFamily: 'var(--font-body)', fontSize: '0.82rem' }}>
          {bodies.map((b, i) => {
            const dms = fmtDMS(b.totalDeg)
            const nak = getNakInfo(b.totalDeg)
            const nav = getNavamsha(b.totalDeg)

            return (
              <tr
                key={`${b.name}-${i}`}
                style={{
                  borderBottom: '1px solid var(--border-soft)',
                  background: i % 2 === 0 ? 'rgba(0,0,0,0.02)' : 'transparent',
                  transition: 'background 0.15s'
                }}
              >
                {/* Body name + Karaka */}
                <td style={{ padding: '0.55rem 0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontWeight: 600, color: b.color || 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                      {b.name}
                      {b.isRetro && <span style={{ fontSize: '0.65rem', marginLeft: 4 }}>(R)</span>}
                    </span>
                    {b.karaka && (
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, padding: '1px 4px', background: 'var(--surface-3)', borderRadius: 3 }}>
                        {b.karaka}
                      </span>
                    )}
                  </div>
                </td>

                {/* Longitude */}
                <td style={{ padding: '0.55rem 0.75rem', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                  {dms.display}
                </td>

                {/* Nakshatra (P) */}
                <td style={{ padding: '0.55rem 0.75rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                  {nak.name} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({nak.pada})</span>
                </td>

                {/* Rashi (Navamsha) */}
                <td style={{ padding: '0.55rem 0.75rem', fontWeight: 600, color: 'var(--text-gold)' }}>
                  {dms.rshort} <span style={{ fontSize: '0.75rem', color: 'var(--primary-brand)', opacity: 0.7 }}>({RASHI_SHORT[nav]})</span>
                </td>

                {/* Dignity */}
                <td style={{ padding: '0.55rem 0.75rem' }}>
                  {b.dignity ? dignityBadge(b.dignity) : '—'}
                </td>

                {/* Awastha */}
                <td style={{ padding: '0.55rem 0.75rem' }}>
                  {b.avastha ? (
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: 500 }}>{b.avastha.baladi}</span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', background: 'var(--surface-2)', padding: '1px 5px', borderRadius: 3 }}>{b.avastha.jagradadi}</span>
                    </div>
                  ) : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
