// ─────────────────────────────────────────────────────────────
//  src/components/chakra/VargaSwitcher.tsx
//  Varga (divisional chart) selector
//  Kāla: D1, D9, D60
//  Velā: full 16 standard vargas
//  Horā: all 41 schemes
//
//  Renders ChakraSelector for the chosen varga's graha placements.
//  The API returns pre-calculated varga positions in chart.vargas.
// ─────────────────────────────────────────────────────────────
'use client'

import { useState } from 'react'
import { ChakraSelector } from './ChakraSelector'
import type { GrahaData, Rashi, UserPlan } from '@/types/astrology'

// ── Varga metadata ────────────────────────────────────────────

interface VargaMeta {
  name:  string           // D1, D9, etc.
  full:  string           // Rashi, Navamsha, etc.
  topic: string           // brief meaning
  tier:  'kala' | 'vela' | 'hora'
}

const VARGA_META: VargaMeta[] = [
  // Kāla
  { name:'D1',  full:'Rashi',            topic:'Body & overall life',         tier:'kala' },
  { name:'D9',  full:'Navamsha',         topic:'Spouse, dharma, inner self',  tier:'kala' },
  { name:'D60', full:'Shashtiamsha',     topic:'Past karma, overall picture', tier:'kala' },
  // Velā
  { name:'D2',  full:'Hora',             topic:'Wealth',                      tier:'vela' },
  { name:'D3',  full:'Drekkana',         topic:'Siblings, courage',           tier:'vela' },
  { name:'D4',  full:'Chaturthamsha',    topic:'Property, home',              tier:'vela' },
  { name:'D7',  full:'Saptamsha',        topic:'Children',                    tier:'vela' },
  { name:'D10', full:'Dashamsha',        topic:'Career, profession',          tier:'vela' },
  { name:'D12', full:'Dwadashamsha',     topic:'Parents',                     tier:'vela' },
  { name:'D16', full:'Shodashamsha',     topic:'Vehicles, comforts',          tier:'vela' },
  { name:'D20', full:'Vimshamsha',       topic:'Spiritual progress',          tier:'vela' },
  { name:'D24', full:'Chaturvimshamsha', topic:'Education, knowledge',        tier:'vela' },
  { name:'D27', full:'Bhamsha',          topic:'Strength, vitality',          tier:'vela' },
  { name:'D30', full:'Trimshamsha',      topic:'Evils, health problems',      tier:'vela' },
  { name:'D40', full:'Khavedamsha',      topic:'Auspicious effects',          tier:'vela' },
  { name:'D45', full:'Akshavedamsha',    topic:'General well-being',          tier:'vela' },
]

function tierLabel(tier: VargaMeta['tier']): string {
  if (tier === 'kala') return ''
  if (tier === 'vela') return 'Velā'
  return 'Horā'
}

// ── Props ─────────────────────────────────────────────────────

interface VargaSwitcherProps {
  // chart.vargas from API — key is varga name, value is graha array
  vargas:       Record<string, GrahaData[]>
  ascRashi:     Rashi
  userPlan?:    UserPlan
  size?:        number
  // Panchang for Sarvatobhadra overlay
  moonNakIndex?: number
  tithiNumber?:  number
  varaNumber?:   number
}

// ── Component ─────────────────────────────────────────────────

export function VargaSwitcher({
  vargas,
  ascRashi,
  userPlan     = 'kala',
  size         = 500,
  moonNakIndex = 0,
  tithiNumber  = 1,
  varaNumber   = 0,
}: VargaSwitcherProps) {
  const [selected, setSelected] = useState('D1')

  // Only show vargas that are available for the user's plan AND returned by API
  const available = VARGA_META.filter((v) => {
    if (!(v.name in vargas)) return false
    if (v.tier === 'kala')  return true
    if (v.tier === 'vela')  return userPlan === 'vela' || userPlan === 'hora'
    return userPlan === 'hora'
  })

  const current    = available.find((v) => v.name === selected) ?? available[0]
  const grahas     = vargas[current?.name ?? 'D1'] ?? vargas['D1'] ?? []
  const isD1       = current?.name === 'D1'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* ── Varga selector ──────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <span style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: '0.75rem', letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'rgba(201,168,76,0.5)',
          flexShrink: 0,
        }}>
          Varga
        </span>

        {/* Pill buttons for each available varga */}
        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
          {available.map((v) => {
            const active = v.name === current?.name
            const locked = !isD1 && v.tier !== 'kala' && userPlan === 'kala'
            return (
              <button
                key={v.name}
                onClick={() => !locked && setSelected(v.name)}
                title={`${v.full} — ${v.topic}${locked ? ' (Velā plan required)' : ''}`}
                disabled={locked}
                style={{
                  padding: '0.2rem 0.6rem',
                  fontSize: '0.8rem',
                  fontFamily: 'JetBrains Mono, monospace',
                  cursor: locked ? 'not-allowed' : 'pointer',
                  border: '1px solid',
                  borderRadius: '4px',
                  transition: 'all 0.12s',
                  background: active ? 'rgba(201,168,76,0.18)' : 'transparent',
                  borderColor: active ? 'rgba(201,168,76,0.55)' : 'rgba(201,168,76,0.18)',
                  color: locked
                    ? 'rgba(201,168,76,0.2)'
                    : active
                    ? 'rgba(201,168,76,0.95)'
                    : 'rgba(201,168,76,0.4)',
                }}
              >
                {v.name}
              </button>
            )
          })}
        </div>

        {/* Current varga info */}
        {current && (
          <div style={{
            marginLeft: 'auto',
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: '0.85rem',
            color: 'rgba(184,176,212,0.6)',
            fontStyle: 'italic',
            textAlign: 'right',
          }}>
            <span style={{ color: 'rgba(201,168,76,0.7)' }}>{current.full}</span>
            {' · '}
            {current.topic}
            {current.tier !== 'kala' && (
              <span style={{
                marginLeft: 8,
                fontSize: '0.7rem',
                fontStyle: 'normal',
                color: 'rgba(201,168,76,0.3)',
                background: 'rgba(201,168,76,0.06)',
                border: '1px solid rgba(201,168,76,0.15)',
                borderRadius: 4,
                padding: '0.1rem 0.4rem',
              }}>
                {tierLabel(current.tier)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Upsell for locked tiers ──────────────────────────── */}
      {userPlan === 'kala' && (
        <div style={{
          padding: '0.6rem 1rem',
          background: 'rgba(201,168,76,0.04)',
          border: '1px solid rgba(201,168,76,0.1)',
          borderRadius: 6,
          fontSize: '0.8rem',
          fontFamily: 'Cormorant Garamond, serif',
          color: 'rgba(201,168,76,0.4)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span>16 additional vargas (D2–D45) available on Velā · 41 total on Horā</span>
        </div>
      )}

      {/* ── Chart ───────────────────────────────────────────── */}
      <ChakraSelector
        ascRashi={ascRashi}
        grahas={grahas}
        size={size}
        userPlan={userPlan}
        moonNakIndex={moonNakIndex}
        tithiNumber={tithiNumber}
        varaNumber={varaNumber}
      />
    </div>
  )
}
