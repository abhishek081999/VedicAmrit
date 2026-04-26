'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import { useChart } from '@/components/providers/ChartProvider'
import Link from 'next/link'

const AstroVastuPanel = dynamic(
  () => import('@/components/ui/AstroVastuPanel').then(m => m.AstroVastuPanel),
  { ssr: false }
)

const ChakraSelector = dynamic(
  () => import('@/components/chakra/ChakraSelector').then(m => m.ChakraSelector),
  { ssr: false }
)

// ── Graha abbreviations for key-stat display ─────────────────────
const GRAHA_NAMES: Record<string, string> = {
  Su: 'Sun', Mo: 'Moon', Ma: 'Mars', Me: 'Mercury', Ju: 'Jupiter',
  Ve: 'Venus', Sa: 'Saturn', Ra: 'Rahu', Ke: 'Ketu',
}

const RASHI_NAMES: Record<number, string> = {
  1: 'Aries', 2: 'Taurus', 3: 'Gemini', 4: 'Cancer',
  5: 'Leo', 6: 'Virgo', 7: 'Libra', 8: 'Scorpio',
  9: 'Sagittarius', 10: 'Capricorn', 11: 'Aquarius', 12: 'Pisces',
}

export default function VastuPage() {
  const { chart } = useChart()
  const [chartExpanded, setChartExpanded] = useState(false)

  if (!chart) {
    return (
      <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem' }}>
        <div style={{ maxWidth: '520px', width: '100%', textAlign: 'center' }}>
          {/* Decorative compass glyph */}
          <div style={{
            width: 90, height: 90, borderRadius: '50%',
            background: 'var(--gold-faint)',
            border: '1px solid var(--border-bright)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 2rem',
            boxShadow: '0 0 40px rgba(201,168,76,0.15)',
            fontSize: '2.5rem',
          }}>
            ☸
          </div>

          <div style={{ display: 'inline-block', padding: '4px 14px', background: 'var(--gold-faint)', color: 'var(--text-gold)', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', border: '1px solid var(--border-bright)', marginBottom: '1.25rem' }}>
            Advanced Module
          </div>

          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', color: 'var(--text-primary)', margin: '0 0 1rem', fontWeight: 300 }}>
            Birth Chart Required
          </h2>

          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: 1.7, fontSize: '1rem' }}>
            Astro-Vāstu maps your natal planetary positions across the 16 cosmic directions of your living space using Mahavastu principles.
            We need your birth details to generate your personalized spatial analysis.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center' }}>
            <Link href="/?new=true" className="btn btn-primary" style={{ padding: '0.85rem 2.5rem', textDecoration: 'none', fontSize: '1rem' }}>
              Enter Birth Details
            </Link>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Requires date, time, and place of birth for accurate analysis
            </p>
          </div>

          {/* Feature highlights */}
          <div style={{ marginTop: '3rem', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', textAlign: 'left' }}>
            {[
              { icon: '🧭', title: '16-Zone Compass', desc: 'Mahavastu directional mapping' },
              { icon: '💠', title: '45 Deities Grid', desc: 'Ekashitipada mandala analysis' },
              { icon: '🏠', title: 'Room Placement', desc: 'Personalized space optimization' },
              { icon: '⚡', title: 'Remedy Engine', desc: 'Planetary correction protocols' },
            ].map(f => (
              <div key={f.title} style={{ padding: '0.9rem', background: 'var(--surface-1)', borderRadius: '10px', border: '1px solid var(--border-soft)' }}>
                <div style={{ fontSize: '1.2rem', marginBottom: '0.35rem' }}>{f.icon}</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.15rem' }}>{f.title}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // derive key chart stats for the header strip
  const lagnaRashi   = chart.lagnas.ascRashi as number
  const lagnaName    = RASHI_NAMES[lagnaRashi] ?? '—'
  const atmakaraka   = chart.karakas?.AK ?? ''
  const moonGraha    = chart.grahas.find((g: { id: string }) => g.id === 'Mo')
  const moonRashi    = moonGraha ? (RASHI_NAMES[moonGraha.rashi as number] ?? '—') : '—'
  const moonNakIndex = chart.panchang?.nakshatra?.index ?? 0
  const tithiNumber  = chart.panchang?.tithi?.number ?? 1
  const varaNumber   = chart.panchang?.vara?.number  ?? 0

  return (
    <div className="fade-up" style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '1.25rem',
      padding: 'var(--spacing-md, 1rem)',
      maxWidth: '1400px',
      margin: '0 auto',
      width: '100%',
    }}>

      {/* ── Lagna Kundali Card ─────────────────────────────────── */}
      <div style={{
        background: 'var(--surface-1)',
        border: '1px solid rgba(201,168,76,0.25)',
        borderRadius: 'var(--r-lg, 16px)',
        overflow: 'hidden',
      }}>
        {/* Header bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.9rem 1.25rem',
          background: 'linear-gradient(135deg, rgba(201,168,76,0.1) 0%, rgba(139,92,246,0.06) 100%)',
          borderBottom: '1px solid rgba(201,168,76,0.15)',
          flexWrap: 'wrap', gap: '0.75rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 38, height: 38, borderRadius: '50%',
              background: 'rgba(201,168,76,0.15)', border: '1.5px solid rgba(201,168,76,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.2rem', flexShrink: 0,
            }}>☸</div>
            <div>
              <h2 style={{ margin: 0, fontSize: 'clamp(0.95rem, 2.5vw, 1.15rem)', fontWeight: 700, color: 'var(--text-gold)', fontFamily: 'var(--font-display)' }}>
                {chart.meta.name || 'Lagna Kundali'}
              </h2>
              <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {chart.meta.birthDate} · {chart.meta.birthTime} · {chart.meta.birthPlace}
              </p>
            </div>
          </div>

          {/* Key stat chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
            {[
              { label: 'Lagna', value: lagnaName },
              { label: 'Moon', value: moonRashi },
              { label: 'AK', value: GRAHA_NAMES[atmakaraka] || atmakaraka },
            ].filter(s => s.value && s.value !== '—').map(s => (
              <div key={s.label} style={{
                display: 'flex', alignItems: 'center', gap: '0.25rem',
                background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)',
                borderRadius: '20px', padding: '3px 10px',
              }}>
                <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</span>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-gold)' }}>{s.value}</span>
              </div>
            ))}

            {/* Expand / collapse toggle */}
            <button
              onClick={() => setChartExpanded(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.35rem',
                padding: '4px 12px', borderRadius: '20px', fontSize: '0.72rem',
                border: '1px solid rgba(201,168,76,0.35)',
                background: chartExpanded ? 'rgba(201,168,76,0.15)' : 'transparent',
                color: 'var(--text-gold)', cursor: 'pointer', transition: 'all 0.2s',
                whiteSpace: 'nowrap',
              }}
            >
              {chartExpanded ? '▲ Hide Chart' : '▼ Show Chart'}
            </button>
          </div>
        </div>

        {/* Chart body — collapsible */}
        {chartExpanded && (
          <div style={{ padding: '1rem 1.25rem 1.5rem' }}>
            <ChakraSelector
              ascRashi={chart.lagnas.ascRashi}
              grahas={chart.grahas}
              lagnas={chart.lagnas}
              arudhas={chart.arudhas}
              moonNakIndex={moonNakIndex}
              tithiNumber={tithiNumber}
              varaNumber={varaNumber}
              defaultStyle="north"
              size={460}
            />
          </div>
        )}

        {/* Collapsed: mini planet strip */}
        {!chartExpanded && (
          <div style={{ padding: '0.6rem 1.25rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {chart.grahas
              .filter((g: { id: string }) => !['Ur','Ne','Pl'].includes(g.id))
              .map((g: { id: string; rashi: number; isRetro?: boolean }) => (
                <div key={g.id} style={{
                  display: 'flex', alignItems: 'center', gap: '0.25rem',
                  background: 'var(--surface-2)', border: '1px solid var(--border-soft)',
                  borderRadius: '6px', padding: '2px 8px',
                }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)', fontFamily: 'var(--font-chart-planets)' }}>
                    {g.id}{g.isRetro ? 'ᴿ' : ''}
                  </span>
                  <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{RASHI_NAMES[g.rashi] ?? g.rashi}</span>
                </div>
              ))}
          </div>
        )}
      </div>

      <AstroVastuPanel chart={chart} />

      <footer style={{
        marginTop: '2rem',
        padding: 'clamp(1.25rem, 4vw, 2rem)',
        background: 'var(--surface-2)',
        borderRadius: 'var(--r-md)',
        border: '1px solid var(--border-soft)',
      }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--text-gold)', marginBottom: '0.75rem', fontWeight: 400 }}>
          Vedic Directional Wisdom
        </h3>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.7, margin: 0 }}>
          Astro-Vāstu bridges the micro-cosmos (your horoscope) and the macro-cosmos (your environment).
          By balancing the Pancha Bhutas based on your strongest and weakest planets, you create a
          resonance that amplifies prosperity and well-being. The 45 Devatas of the Vastu Purusha Mandala
          represent specific psychographic energies that can be harmonized through conscious spatial design.
        </p>
      </footer>
    </div>
  )
}
