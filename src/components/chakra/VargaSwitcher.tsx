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
    ? 'var(--gold-faint)'
    : state === 'secondary'
    ? 'var(--accent-glow)'
    : 'transparent'

  const border = state === 'primary'
    ? 'var(--gold)'
    : state === 'secondary'
    ? 'var(--accent)'
    : 'var(--border)'

  const color = state === 'primary'
    ? 'var(--gold)'
    : state === 'secondary'
    ? 'var(--accent)'
    : 'var(--text-muted)'

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
        fontWeight: state !== 'none' ? 'var(--fw-medium)' : 'var(--fw-base)',
      }}
    >
      {name}
    </button>
  )
}

// ── Chart header strip ────────────────────────────────────────

function ChartLabel({
  meta, accent, prefix
}: {
  meta: VargaMeta
  accent: 'gold' | 'blue'
  prefix?: string
}) {
  const isGold = accent === 'gold'
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', gap: '0.5rem',
      marginBottom: '0.5rem',
      paddingBottom: '0.4rem',
      borderBottom: `1px solid ${isGold ? 'var(--border)' : 'var(--border-accent)'}`,
    }}>
      <span style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '0.85rem',
        fontWeight: 'var(--fw-bold)',
        color: isGold ? 'var(--gold)' : 'var(--accent)',
      }}>
        {prefix}{meta.name}
      </span>
      <span style={{
        fontFamily: 'Cormorant Garamond, serif',
        fontSize: '1rem',
        color: 'var(--text-primary)',
      }}>
        {meta.full}
      </span>
      <span style={{
        fontFamily: 'Cormorant Garamond, serif',
        fontSize: '0.78rem',
        fontStyle: 'italic',
        color: 'var(--text-muted)',
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
  const [stacked, setStacked] = useState<boolean>(false)

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
  const chartSize = (secondaryMeta && !stacked) ? Math.min(size * 0.62, 380) : size

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

      {/* ── Pill row ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', flexWrap: 'wrap' }}>
        <span style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: '0.72rem', letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
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

      {/* ── Hint & Layout Controls ─────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{
          fontSize: '0.72rem',
          fontFamily: 'Cormorant Garamond, serif',
          fontStyle: 'italic',
          color: 'var(--text-muted)',
        }}>
          D1 is always shown · click any other varga to compare {stacked ? 'stacked' : 'side by side'} · click again to close
        </div>
        
        {secondaryMeta && (
          <button
            onClick={() => setStacked(!stacked)}
            style={{
              fontSize: '0.75rem', padding: '0.2rem 0.6rem',
              background: 'transparent', color: 'var(--text-secondary)',
              border: '1px solid var(--border-soft)', borderRadius: '4px',
              fontFamily: 'Cormorant Garamond, serif', cursor: 'pointer',
              display: 'flex', gap: '0.3rem', alignItems: 'center'
            }}
          >
            {stacked ? '◫ Show Side-by-Side' : '⬒ Show Stacked'}
          </button>
        )}
      </div>

      {/* ── Chart(s) ─────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        gap: '1.25rem',
        alignItems: stacked ? 'center' : 'flex-start',
        flexDirection: stacked ? 'column' : 'row',
        flexWrap: stacked ? 'wrap' : 'nowrap',
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
          <div style={{ 
            flex: '1 1 auto', minWidth: 0, 
            padding: '1rem', 
            background: 'var(--surface-2)', 
            border: '1px dashed var(--border-accent)', 
            borderRadius: '8px' 
          }}>
            <ChartLabel meta={secondaryMeta} accent="blue" prefix="Comparing: " />
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