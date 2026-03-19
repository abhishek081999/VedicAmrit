'use client'
// ─────────────────────────────────────────────────────────────
//  src/app/page.tsx
//  Home page — birth form + full chart result with tabs
//  Tabs: Chart (Varga Switcher) · Planets · Arudhas · Dasha · Pañcāṅga
// ─────────────────────────────────────────────────────────────

import { useState } from 'react'
import { BirthForm }       from '@/components/ui/BirthForm'
import { VargaSwitcher }   from '@/components/chakra/VargaSwitcher'
import { DashaTree }       from '@/components/dasha/DashaTree'
import { GrahaTable }      from '@/components/ui/GrahaTable'
import type { ChartOutput, Rashi } from '@/types/astrology'
import { RASHI_NAMES, RASHI_SHORT } from '@/types/astrology'

// ── Tab type ──────────────────────────────────────────────────

type Tab = 'chart' | 'planets' | 'arudhas' | 'dasha' | 'panchang'

// ── Panchang panel ────────────────────────────────────────────

function PanchangPanel({ p }: { p: ChartOutput['panchang'] }) {
  const fmtTime = (d: Date | string) =>
    new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

  const items = [
    { label: 'Vara',      value: p.vara.name,       sub: `Lord: ${p.vara.lord}` },
    { label: 'Tithi',     value: p.tithi.name,       sub: `${p.tithi.paksha === 'shukla' ? 'Śukla Pakṣa' : 'Kṛṣṇa Pakṣa'}` },
    { label: 'Nakshatra', value: p.nakshatra.name,   sub: `Pada ${p.nakshatra.pada} · lord ${p.nakshatra.lord}` },
    { label: 'Yoga',      value: p.yoga.name,        sub: `#${p.yoga.number}` },
    { label: 'Karana',    value: p.karana.name,      sub: `#${p.karana.number}` },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: '0.75rem' }}>
        {items.map(({ label, value, sub }) => (
          <div key={label} className="card" style={{ padding: '1rem' }}>
            <div style={{
              fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase',
              color: 'rgba(201,168,76,0.6)', fontFamily: 'Cormorant Garamond, serif',
              marginBottom: '0.4rem',
            }}>
              {label}
            </div>
            <div style={{ fontSize: '1.05rem', fontFamily: 'Cormorant Garamond, serif', color: 'var(--text-primary)' }}>
              {value}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2, fontFamily: 'Cormorant Garamond, serif' }}>
              {sub}
            </div>
          </div>
        ))}
      </div>

      {/* Muhurta times */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
        <div className="card" style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--rose)', fontFamily: 'Cormorant Garamond, serif', marginBottom: '0.4rem' }}>
            Rāhu Kālam
          </div>
          <div style={{ fontSize: '0.9rem', fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-secondary)' }}>
            {fmtTime(p.rahuKalam.start)} – {fmtTime(p.rahuKalam.end)}
          </div>
        </div>

        <div className="card" style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--rose)', fontFamily: 'Cormorant Garamond, serif', marginBottom: '0.4rem' }}>
            Gulikā Kālam
          </div>
          <div style={{ fontSize: '0.9rem', fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-secondary)' }}>
            {fmtTime(p.gulikaKalam.start)} – {fmtTime(p.gulikaKalam.end)}
          </div>
        </div>

        {p.abhijitMuhurta && (
          <div className="card" style={{ padding: '1rem' }}>
            <div style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--teal)', fontFamily: 'Cormorant Garamond, serif', marginBottom: '0.4rem' }}>
              Abhijit Muhūrta
            </div>
            <div style={{ fontSize: '0.9rem', fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-secondary)' }}>
              {fmtTime(p.abhijitMuhurta.start)} – {fmtTime(p.abhijitMuhurta.end)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Arudha panel ──────────────────────────────────────────────

const ARUDHA_TOPICS: Record<string, string> = {
  AL:  'Public image / worldly self',
  A2:  'Wealth, speech, sustenance',
  A3:  'Courage, siblings, skills',
  A4:  'Home, mother, property',
  A5:  'Intellect, children, past karma',
  A6:  'Debts, enemies, service',
  A7:  'Spouse, partnerships (Darapada)',
  A8:  'Longevity, hidden matters',
  A9:  'Dharma, father, fortune',
  A10: 'Career, status, action',
  A11: 'Gains, elder siblings, wishes',
  A12: 'Loss, liberation (Upapada)',
}

function ArudhaPanel({ arudhas, ascRashi }: { arudhas: ChartOutput['arudhas']; ascRashi: Rashi }) {
  const keys = ['AL','A2','A3','A4','A5','A6','A7','A8','A9','A10','A11','A12'] as const

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{
        fontSize: '0.78rem', color: 'rgba(201,168,76,0.45)',
        fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
      }}>
        Bhāva Āruḍhas — mirror of worldly reality. Calculated by BPHS algorithm.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.6rem' }}>
        {keys.map((key) => {
          const rashi = arudhas[key] as Rashi | undefined
          if (!rashi) return null
          const isAL  = key === 'AL'
          return (
            <div
              key={key}
              style={{
                padding: '0.7rem 1rem',
                background: isAL ? 'rgba(201,168,76,0.07)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${isAL ? 'rgba(201,168,76,0.35)' : 'rgba(201,168,76,0.1)'}`,
                borderRadius: 8,
                display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
              }}
            >
              <span style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.78rem',
                color: isAL ? 'rgba(201,168,76,0.9)' : 'rgba(201,168,76,0.45)',
                minWidth: 28,
                paddingTop: 2,
              }}>
                {key}
              </span>
              <div>
                <div style={{
                  fontFamily: 'Cormorant Garamond, serif',
                  fontSize: '1rem',
                  color: 'var(--text-primary)',
                  fontWeight: isAL ? 500 : 400,
                }}>
                  {RASHI_NAMES[rashi]}
                  <span style={{
                    marginLeft: 6,
                    fontSize: '0.72rem',
                    fontFamily: 'JetBrains Mono, monospace',
                    color: 'rgba(201,168,76,0.3)',
                  }}>
                    {RASHI_SHORT[rashi]}
                  </span>
                </div>
                <div style={{
                  fontSize: '0.73rem',
                  color: 'var(--text-muted)',
                  fontFamily: 'Cormorant Garamond, serif',
                  fontStyle: 'italic',
                  marginTop: 1,
                }}>
                  {ARUDHA_TOPICS[key]}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Upapada and Darapada callout */}
      <div style={{
        display: 'flex', gap: '0.75rem', flexWrap: 'wrap',
        paddingTop: '0.75rem',
        borderTop: '1px solid rgba(201,168,76,0.1)',
        fontSize: '0.82rem',
        fontFamily: 'Cormorant Garamond, serif',
        color: 'var(--text-muted)',
      }}>
        <span>
          <span style={{ color: 'rgba(201,168,76,0.6)' }}>Upapada Lagna (A12):</span>{' '}
          {arudhas.A12 ? RASHI_NAMES[arudhas.A12] : '—'} · quality of marriage
        </span>
        <span>
          <span style={{ color: 'rgba(201,168,76,0.6)' }}>Darapada (A7):</span>{' '}
          {arudhas.A7 ? RASHI_NAMES[arudhas.A7] : '—'} · partner's public image
        </span>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────

export default function HomePage() {
  const [chart,     setChart]     = useState<ChartOutput | null>(null)
  const [loading,   setLoading]   = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('chart')

  // Derive panchang props for Sarvatobhadra once chart is loaded
  const moonNakIndex = chart?.grahas.find((g: import('@/types/astrology').GrahaData) => g.id === 'Mo')?.nakshatraIndex ?? 0
  const tithiNumber  = chart?.panchang.tithi.number ?? 1
  const varaNumber   = chart?.panchang.vara.number  ?? 0

  const TABS: { id: Tab; label: string }[] = [
    { id: 'chart',    label: 'Chart' },
    { id: 'planets',  label: 'Planets' },
    { id: 'arudhas',  label: 'Āruḍhas' },
    { id: 'dasha',    label: 'Daśā' },
    { id: 'panchang', label: 'Pañcāṅga' },
  ]

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* ── Header ────────────────────────────────────────── */}
      <header style={{
        padding: '1.25rem 2rem',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(14,14,22,0.88)',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.4rem' }}>🪐</span>
          <h1 style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: '1.35rem', fontWeight: 300,
            letterSpacing: '0.06em',
            color: 'var(--text-gold)',
            margin: 0,
          }}>
            Jyotiṣa
          </h1>
          <span style={{
            fontSize: '0.72rem', color: 'var(--text-muted)',
            fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
            letterSpacing: '0.04em',
          }}>
            The Eye of the Vedas
          </span>
        </div>

        <nav style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <a href="/panchang" style={{
            color: 'var(--text-secondary)', fontFamily: 'Cormorant Garamond, serif',
            fontSize: '0.95rem', textDecoration: 'none', letterSpacing: '0.02em',
          }}>
            Pañcāṅga
          </a>
          <span style={{
            padding: '0.2rem 0.65rem',
            background: 'rgba(201,168,76,0.1)',
            border: '1px solid rgba(201,168,76,0.2)',
            borderRadius: 99,
            fontSize: '0.72rem',
            color: 'rgba(201,168,76,0.65)',
            fontFamily: 'Cormorant Garamond, serif',
            letterSpacing: '0.06em',
          }}>
            Kāla · Free
          </span>
        </nav>
      </header>

      {/* ── Main layout ───────────────────────────────────── */}
      <main style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: chart ? '360px 1fr' : '360px 1fr',
        maxWidth: '1400px',
        width: '100%',
        margin: '0 auto',
        padding: '2rem',
        gap: '2rem',
        transition: 'max-width 0.35s ease',
        alignItems: 'start',
      }}>

        {/* ── Left: form ──────────────────────────────────── */}
        <div style={{ position: 'sticky', top: '5rem' }}>
            <div className="card fade-up">
            <BirthForm
              onResult={(data) => { setChart(data); setActiveTab('chart') }}
              onLoading={setLoading}
              autoSubmit={true}
            />
          </div>

          {/* Mini asc info below form when chart is shown */}
          {chart && (
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem 1rem',
              background: 'rgba(201,168,76,0.05)',
              border: '1px solid rgba(201,168,76,0.12)',
              borderRadius: 8,
              fontSize: '0.78rem',
              fontFamily: 'Cormorant Garamond, serif',
              color: 'var(--text-muted)',
            }}>
              <div style={{ marginBottom: 4, color: 'rgba(201,168,76,0.5)', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Chart summary
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span>
                  <span style={{ color: 'rgba(201,168,76,0.65)' }}>Ascendant: </span>
                  {RASHI_NAMES[chart.lagnas.ascRashi as import('@/types/astrology').Rashi]} {chart.lagnas.ascDegreeInRashi.toFixed(1)}°
                </span>
                <span>
                  <span style={{ color: 'rgba(201,168,76,0.65)' }}>Ayanamsha: </span>
                  {chart.meta.settings.ayanamsha} · {chart.meta.ayanamshaValue.toFixed(3)}°
                </span>
                <span>
                  <span style={{ color: 'rgba(201,168,76,0.65)' }}>JD: </span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem' }}>
                    {chart.meta.julianDay.toFixed(4)}
                  </span>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ── Right: chart result ──────────────────────────── */}
        {chart && (
          <div className="fade-up" style={{ minWidth: 0 }}>

            {/* Name + birth info */}
            <div style={{ marginBottom: '1.25rem' }}>
              <h2 style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: '1.75rem', fontWeight: 300,
                color: 'var(--text-primary)',
                marginBottom: '0.2rem',
              }}>
                {chart.meta.name}
              </h2>
              <div style={{
                color: 'var(--text-muted)',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.78rem',
                display: 'flex', gap: '1.25rem', flexWrap: 'wrap',
              }}>
                <span>{chart.meta.birthDate} · {chart.meta.birthTime}</span>
                <span>{chart.meta.birthPlace}</span>
                <span style={{ fontFamily: 'Cormorant Garamond, serif', color: 'rgba(201,168,76,0.55)', fontStyle: 'italic' }}>
                  {chart.meta.timezone}
                </span>
              </div>
            </div>

            {/* Tabs */}
            <div style={{
              display: 'flex', gap: '0',
              borderBottom: '1px solid rgba(201,168,76,0.15)',
              marginBottom: '1.5rem',
              overflowX: 'auto',
            }}>
              {TABS.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  style={{
                    padding: '0.5rem 1.1rem',
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontFamily: 'Cormorant Garamond, serif',
                    fontSize: '1rem',
                    color: activeTab === id ? 'var(--text-gold)' : 'var(--text-muted)',
                    borderBottom: `2px solid ${activeTab === id ? 'rgba(201,168,76,0.7)' : 'transparent'}`,
                    marginBottom: -1,
                    transition: 'color 0.15s',
                    letterSpacing: '0.02em',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="fade-up">

              {activeTab === 'chart' && (
                <VargaSwitcher
                  vargas={chart.vargas}
                  vargaLagnas={chart.vargaLagnas ?? {}}
                  ascRashi={chart.lagnas.ascRashi}
                  arudhas={chart.arudhas}
                  size={500}
                  moonNakIndex={moonNakIndex}
                  tithiNumber={tithiNumber}
                  varaNumber={varaNumber}
                />
              )}

              {activeTab === 'planets' && (
                <div className="card">
                  <GrahaTable grahas={chart.grahas} />
                </div>
              )}

              {activeTab === 'arudhas' && (
                <div className="card">
                  <ArudhaPanel
                    arudhas={chart.arudhas}
                    ascRashi={chart.lagnas.ascRashi}
                  />
                </div>
              )}

              {activeTab === 'dasha' && (
                <div className="card">
                  <DashaTree
                    nodes={chart.dashas.vimshottari}
                    birthDate={new Date(chart.meta.birthDate)}
                  />
                </div>
              )}

              {activeTab === 'panchang' && (
                <PanchangPanel p={chart.panchang} />
              )}

            </div>
          </div>
        )}
      </main>

      {/* ── Loading overlay ───────────────────────────────── */}
      {loading && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(14,14,22,0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200,
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 48, height: 48,
              border: '3px solid rgba(201,168,76,0.2)',
              borderTopColor: 'var(--gold)',
              borderRadius: '50%',
              animation: 'spin-slow 0.8s linear infinite',
              margin: '0 auto 1rem',
            }} />
            <p style={{
              fontFamily: 'Cormorant Garamond, serif',
              color: 'var(--text-gold)', fontSize: '1.1rem', fontStyle: 'italic',
            }}>
              Consulting the ephemeris…
            </p>
          </div>
        </div>
      )}

      {/* ── Footer ────────────────────────────────────────── */}
      <footer style={{
        padding: '1.25rem 2rem',
        borderTop: '1px solid rgba(201,168,76,0.08)',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontFamily: 'Cormorant Garamond, serif',
        fontSize: '0.82rem',
        letterSpacing: '0.04em',
      }}>
        Calculations powered by{' '}
        <span style={{ color: 'var(--text-gold)' }}>Swiss Ephemeris</span>
        {' '}· Lahiri ayanamsha · Kāla tier — free forever
      </footer>
    </div>
  )
}