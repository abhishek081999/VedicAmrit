// ─────────────────────────────────────────────────────────────
//  src/components/chakra/VargaSwitcher.tsx
//  Dual varga chart selector
//  • D1 is always primary (gold) — fixed default
//  • Click any other pill → select as secondary (blue) for comparison
//  • Click active secondary → deselect (back to D1 alone)
//  • Shows 1 or 2 ChakraSelectors side by side (stacked on mobile)
// ─────────────────────────────────────────────────────────────
'use client'

import { useState } from 'react'
import { ChakraSelector } from './ChakraSelector'
import type { GrahaData, Rashi, UserPlan, ArudhaData } from '@/types/astrology'

// ── Varga metadata ────────────────────────────────────────────

interface VargaMeta {
  name:  string
  full:  string
  topic: string
}

const VARGA_META: VargaMeta[] = [
  { name:'D1',  full:'Rashi',           topic:'Lagna chart — personality, body, overall life'                },
  { name:'D9',  full:'Navamsha',        topic:'Spouse & marriage — inner self, manifests after age 35-37'    },
  { name:'D60', full:'Shastyamsha',     topic:'Past-life karma — karmic influences, soul evolution'          },
  { name:'D2',  full:'Hora',            topic:'Wealth & assets — income, Sun Hora & Moon Hora'               },
  { name:'D3',  full:'Drekkana',        topic:'Siblings — relationships, talents, abilities, challenges'     },
  { name:'D4',  full:'Chaturthamsha',   topic:'Home & property — dwelling, ancestral property, real estate'  },
  { name:'D7',  full:'Saptamsha',       topic:'Children — progeny, offspring, influence of children'         },
  { name:'D10', full:'Dasamsha',        topic:'Career — profession, achievements, reputation'                },
  { name:'D12', full:'Dwadasamsha',     topic:'Parents — relationship with parents and their influence'      },
  { name:'D16', full:'Shodasamsha',     topic:'Vehicles & comforts — transport, luxuries, comfort'           },
  { name:'D20', full:'Vimsamsha',       topic:'Spirituality — religious actions, devotion, higher knowledge' },
  { name:'D24', full:'Chaturvimsamsha', topic:'Education — learning, academic achievements, knowledge'       },
  { name:'D27', full:'Saptavimsamsha',  topic:'Innate strength — inherent qualities, talents, weaknesses'    },
  { name:'D30', full:'Trimsamsha',      topic:'Obstacles — negative influences, karmic challenges'           },
  { name:'D40', full:'Khavedamsha',     topic:'Life events & mother — auspicious/inauspicious, maternal line'},
  { name:'D45', full:'Akshavedamsha',   topic:'All life matters & father — comprehensive, paternal lineage'  },
]

// ── Props ─────────────────────────────────────────────────────

interface VargaSwitcherProps {
  vargas:        Record<string, GrahaData[]>
  vargaLagnas:   Record<string, Rashi>
  ascRashi:      Rashi
  arudhas?:      ArudhaData
  userPlan?:     UserPlan
  size?:         number
  moonNakIndex?: number
  tithiNumber?:  number
  varaNumber?:   number
}

// ── Pill button ───────────────────────────────────────────────

function Pill({
  name, full, topic, state, onClick,
}: {
  key?: string
  name: string
  full: string
  topic: string
  state: 'primary' | 'secondary' | 'none'
  onClick: () => void
}) {
  const bg = state === 'primary'
    ? 'rgba(201,168,76,0.20)'
    : state === 'secondary'
    ? 'rgba(100,140,240,0.18)'
    : 'transparent'

  const border = state === 'primary'
    ? 'rgba(201,168,76,0.60)'
    : state === 'secondary'
    ? 'rgba(100,140,240,0.55)'
    : 'rgba(201,168,76,0.18)'

  const color = state === 'primary'
    ? 'rgba(220,185,90,1.0)'
    : state === 'secondary'
    ? 'rgba(140,170,255,1.0)'
    : 'rgba(201,168,76,0.40)'

  return (
    <button
      onClick={onClick}
      title={`${full} — ${topic}`}
      style={{
        padding: '0.22rem 0.6rem',
        fontSize: '0.78rem',
        fontFamily: 'JetBrains Mono, monospace',
        cursor: 'pointer',
        border: '1px solid',
        borderRadius: '4px',
        transition: 'all 0.12s',
        background: bg,
        borderColor: border,
        color,
        fontWeight: state !== 'none' ? 600 : 400,
      }}
    >
      {name}
    </button>
  )
}

// ── Chart header strip ────────────────────────────────────────

function ChartLabel({
  meta, accent,
}: {
  meta: VargaMeta
  accent: 'gold' | 'blue'
}) {
  const c = accent === 'gold' ? 'rgba(220,185,90,' : 'rgba(140,170,255,'
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', gap: '0.5rem',
      marginBottom: '0.5rem',
      paddingBottom: '0.4rem',
      borderBottom: `1px solid ${c}0.25)`,
    }}>
      <span style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '0.85rem',
        fontWeight: 700,
        color: `${c}0.95)`,
      }}>
        {meta.name}
      </span>
      <span style={{
        fontFamily: 'Cormorant Garamond, serif',
        fontSize: '1rem',
        color: `${c}0.75)`,
      }}>
        {meta.full}
      </span>
      <span style={{
        fontFamily: 'Cormorant Garamond, serif',
        fontSize: '0.78rem',
        fontStyle: 'italic',
        color: `${c}0.45)`,
        marginLeft: 4,
      }}>
        — {meta.topic.split(' — ')[1] ?? meta.topic}
      </span>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────

export function VargaSwitcher({
  vargas,
  vargaLagnas,
  ascRashi,
  arudhas,
  userPlan     = 'kala',
  size         = 500,
  moonNakIndex = 0,
  tithiNumber  = 1,
  varaNumber   = 0,
}: VargaSwitcherProps) {
  const primary = 'D1'  // always fixed
  const [secondary, setSecondary] = useState<string | null>(null)

  const available = VARGA_META.filter(v => v.name in vargas)

  function handlePillClick(name: string) {
    if (name === primary) return          // D1 is always fixed primary
    if (name === secondary) {
      setSecondary(null)                  // click active secondary → deselect
    } else {
      setSecondary(name)                  // any other → set as secondary
    }
  }

  function pillState(name: string): 'primary' | 'secondary' | 'none' {
    if (name === primary)   return 'primary'
    if (name === secondary) return 'secondary'
    return 'none'
  }

  const primaryMeta    = available.find(v => v.name === primary) ?? available[0]
  const secondaryMeta  = secondary ? available.find(v => v.name === secondary) : null

  function chartProps(name: string) {
    const grahas      = vargas[name] ?? vargas['D1'] ?? []
    const varAscRashi = (vargaLagnas[name] ?? ascRashi) as Rashi
    return { grahas, varAscRashi }
  }

  const { grahas: pGrahas, varAscRashi: pAsc } = chartProps(primaryMeta?.name ?? 'D1')
  const secProps = secondaryMeta ? chartProps(secondaryMeta.name) : null

  // Chart size — shrink when showing two side by side
  const chartSize = secondaryMeta ? Math.min(size * 0.62, 380) : size

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

      {/* ── Pill row ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', flexWrap: 'wrap' }}>
        <span style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: '0.72rem', letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'rgba(201,168,76,0.45)',
          flexShrink: 0,
          paddingTop: '0.3rem',
        }}>
          Varga
        </span>

        <div style={{ display: 'flex', gap: '0.28rem', flexWrap: 'wrap', flex: 1 }}>
          {available.map(v => (
            <Pill
              key={v.name}
              name={v.name}
              full={v.full}
              topic={v.topic}
              state={pillState(v.name)}
              onClick={() => handlePillClick(v.name)}
            />
          ))}
        </div>
      </div>

      {/* ── Hint ─────────────────────────────────────────────── */}
      <div style={{
        fontSize: '0.72rem',
        fontFamily: 'Cormorant Garamond, serif',
        fontStyle: 'italic',
        color: 'rgba(201,168,76,0.30)',
      }}>
        D1 is always shown · click any other varga to compare side by side · click again to close
      </div>

      {/* ── Chart(s) ─────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        gap: '1.25rem',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
      }}>
        {/* Primary */}
        <div style={{ flex: '1 1 auto', minWidth: 0 }}>
          {primaryMeta && (
            <ChartLabel meta={primaryMeta} accent="gold" />
          )}
          <ChakraSelector
            ascRashi={pAsc}
            grahas={pGrahas}
            size={chartSize}
            userPlan={userPlan}
            defaultStyle="north"
            arudhas={arudhas}
            moonNakIndex={moonNakIndex}
            tithiNumber={tithiNumber}
            varaNumber={varaNumber}
          />
        </div>

        {/* Secondary */}
        {secondaryMeta && secProps && (
          <div style={{ flex: '1 1 auto', minWidth: 0 }}>
            <ChartLabel meta={secondaryMeta} accent="blue" />
            <ChakraSelector
              ascRashi={secProps.varAscRashi}
              grahas={secProps.grahas}
              size={chartSize}
              userPlan={userPlan}
              defaultStyle="north"
              arudhas={arudhas}
              moonNakIndex={moonNakIndex}
              tithiNumber={tithiNumber}
              varaNumber={varaNumber}
            />
          </div>
        )}
      </div>
    </div>
  )
}