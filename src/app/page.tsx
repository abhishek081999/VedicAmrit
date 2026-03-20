'use client'
// ─────────────────────────────────────────────────────────────
//  src/app/page.tsx
//  Home — birth form + full chart result
//  Redesigned: themed, animated, cleaner visual hierarchy
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import { BirthForm }     from '@/components/ui/BirthForm'
import { VargaSwitcher } from '@/components/chakra/VargaSwitcher'
import { DashaTree }     from '@/components/dasha/DashaTree'
import { GrahaTable }    from '@/components/ui/GrahaTable'
import { ThemeToggle }   from '@/components/ui/ThemeToggle'
import type { ChartOutput, Rashi } from '@/types/astrology'
import { RASHI_NAMES, RASHI_SHORT } from '@/types/astrology'

type Tab = 'chart' | 'planets' | 'arudhas' | 'dasha' | 'panchang'

// ─────────────────────────────────────────────────────────────
//  Panchang Panel
// ─────────────────────────────────────────────────────────────

function PanchangPanel({ p }: { p: ChartOutput['panchang'] }) {
  const fmtTime = (d: Date | string) =>
    new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

  const items = [
    { label: 'Vara',      value: p.vara.name,     sub: `Lord: ${p.vara.lord}`,                      icon: '☀' },
    { label: 'Tithi',     value: p.tithi.name,    sub: p.tithi.paksha === 'shukla' ? 'Śukla Pakṣa' : 'Kṛṣṇa Pakṣa', icon: '🌙' },
    { label: 'Nakshatra', value: p.nakshatra.name, sub: `Pada ${p.nakshatra.pada} · ${p.nakshatra.lord}`, icon: '⭐' },
    { label: 'Yoga',      value: p.yoga.name,     sub: `#${p.yoga.number}`,                          icon: '☯' },
    { label: 'Karana',    value: p.karana.name,   sub: `#${p.karana.number}`,                        icon: '✦' },
  ]

  const muhurtas = [
    { label: 'Rāhu Kālam',      times: p.rahuKalam,      color: 'var(--rose)',  neutral: false },
    { label: 'Gulikā Kālam',    times: p.gulikaKalam,    color: 'var(--rose)',  neutral: false },
    ...(p.abhijitMuhurta ? [{ label: 'Abhijit Muhūrta', times: p.abhijitMuhurta, color: 'var(--teal)', neutral: true }] : []),
  ]

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))', gap: '0.75rem' }}>
        {items.map(({ label, value, sub, icon }, i) => (
          <div
            key={label}
            className="stat-chip"
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <div className="stat-label">{label}</div>
            <div className="stat-value">
              <span style={{ marginRight: 6, opacity: 0.7 }}>{icon}</span>
              {value}
            </div>
            <div className="stat-sub">{sub}</div>
          </div>
        ))}
      </div>

      <div>
        <div className="label-caps" style={{ marginBottom: '0.6rem' }}>Muhūrta Windows</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.6rem' }}>
          {muhurtas.map(({ label, times, color, neutral }) => (
            <div key={label} style={{
              padding: '0.85rem 1rem',
              background: neutral ? 'rgba(78,205,196,0.06)' : 'rgba(224,123,142,0.06)',
              border: `1px solid ${neutral ? 'rgba(78,205,196,0.2)' : 'rgba(224,123,142,0.2)'}`,
              borderRadius: 'var(--r-md)',
            }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color, marginBottom: '0.35rem' }}>
                {label}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                {fmtTime(times.start)} – {fmtTime(times.end)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  Arudha Panel
// ─────────────────────────────────────────────────────────────

const ARUDHA_TOPICS: Record<string, string> = {
  AL:  'Public image · worldly self',
  A2:  'Wealth · speech · sustenance',
  A3:  'Courage · siblings · skills',
  A4:  'Home · mother · property',
  A5:  'Intellect · children · karma',
  A6:  'Debts · enemies · service',
  A7:  'Spouse · partnerships',
  A8:  'Longevity · hidden matters',
  A9:  'Dharma · father · fortune',
  A10: 'Career · status · action',
  A11: 'Gains · elder siblings · wishes',
  A12: 'Loss · liberation',
}

function ArudhaPanel({ arudhas }: { arudhas: ChartOutput['arudhas'] }) {
  const keys = ['AL','A2','A3','A4','A5','A6','A7','A8','A9','A10','A11','A12'] as const

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <p style={{ fontSize: '0.82rem', fontStyle: 'italic', color: 'var(--text-muted)', margin: 0 }}>
        Bhāva Āruḍhas — mirror of worldly reality, calculated by the BPHS algorithm.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '0.55rem' }}>
        {keys.map((key, i) => {
          const rashi = arudhas[key] as Rashi | undefined
          if (!rashi) return null
          const isAL  = key === 'AL'
          return (
            <div
              key={key}
              style={{
                padding: '0.7rem 1rem',
                background: isAL ? 'rgba(201,168,76,0.08)' : 'var(--surface-2)',
                border: `1px solid ${isAL ? 'var(--border-bright)' : 'var(--border-soft)'}`,
                borderRadius: 'var(--r-md)',
                display: 'flex', gap: '0.65rem', alignItems: 'flex-start',
                transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s',
                cursor: 'default',
                animationDelay: `${i * 0.03}s`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-bright)'
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = 'var(--glow-gold)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = isAL ? 'var(--border-bright)' : 'var(--border-soft)'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                color: isAL ? 'var(--gold)' : 'var(--text-muted)',
                minWidth: 28,
                paddingTop: 3,
                fontWeight: 600,
              }}>
                {key}
              </span>
              <div>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.02rem',
                  color: 'var(--text-primary)',
                  fontWeight: isAL ? 500 : 400,
                }}>
                  {RASHI_NAMES[rashi]}
                  <span style={{ marginLeft: 6, fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    {RASHI_SHORT[rashi]}
                  </span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 1 }}>
                  {ARUDHA_TOPICS[key]}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{
        display: 'flex', gap: '1rem', flexWrap: 'wrap',
        paddingTop: '0.75rem',
        borderTop: '1px solid var(--border-soft)',
        fontSize: '0.82rem',
        color: 'var(--text-muted)',
      }}>
        <span>
          <span style={{ color: 'var(--gold)' }}>Upapada (A12): </span>
          {arudhas.A12 ? RASHI_NAMES[arudhas.A12] : '—'} · quality of marriage
        </span>
        <span>
          <span style={{ color: 'var(--gold)' }}>Darapada (A7): </span>
          {arudhas.A7 ? RASHI_NAMES[arudhas.A7] : '—'} · partner's image
        </span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  Chart Summary sidebar strip
// ─────────────────────────────────────────────────────────────

function ChartSummary({ chart }: { chart: ChartOutput }) {
  const rows = [
    { label: 'Ascendant', value: `${RASHI_NAMES[chart.lagnas.ascRashi as Rashi]} ${chart.lagnas.ascDegreeInRashi.toFixed(1)}°` },
    { label: 'Ayanamsha', value: `${chart.meta.settings.ayanamsha} ${chart.meta.ayanamshaValue.toFixed(3)}°` },
    { label: 'Julian Day', value: chart.meta.julianDay.toFixed(4), mono: true },
  ]
  return (
    <div style={{
      marginTop: '0.85rem',
      padding: '0.85rem 1rem',
      background: 'var(--gold-faint)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-md)',
    }}>
      <div className="label-caps" style={{ marginBottom: '0.5rem' }}>Chart Summary</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        {rows.map(({ label, value, mono }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>{label}</span>
            <span style={{
              color: 'var(--text-secondary)',
              fontFamily: mono ? 'var(--font-mono)' : 'inherit',
              fontSize: mono ? '0.72rem' : '0.8rem',
            }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  Main Page
// ─────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'chart',    label: 'Chart',     emoji: '🪐' },
  { id: 'planets',  label: 'Planets',   emoji: '✦' },
  { id: 'arudhas',  label: 'Āruḍhas',   emoji: '☯' },
  { id: 'dasha',    label: 'Daśā',      emoji: '⏳' },
  { id: 'panchang', label: 'Pañcāṅga',  emoji: '📅' },
]

export default function HomePage() {
  const [chart,      setChart]      = useState<ChartOutput | null>(null)
  const [loading,    setLoading]    = useState(false)
  const [activeTab,  setActiveTab]  = useState<Tab>('chart')
  const [tabKey,     setTabKey]     = useState(0)  // forces re-animation on tab switch

  function switchTab(id: Tab) {
    setActiveTab(id)
    setTabKey((k) => k + 1)
  }

  const moonNakIndex = chart?.grahas.find((g) => g.id === 'Mo')?.nakshatraIndex ?? 0
  const tithiNumber  = chart?.panchang.tithi.number ?? 1
  const varaNumber   = chart?.panchang.vara.number  ?? 0

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>

      {/* ── Ambient background orbs ─────────────────────────── */}
      <div aria-hidden style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', width: 600, height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,124,246,0.12) 0%, transparent 70%)',
          top: '-200px', left: '30%',
          animation: 'orb-drift 18s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', width: 400, height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(201,168,76,0.09) 0%, transparent 70%)',
          bottom: '-100px', right: '10%',
          animation: 'orb-drift 22s ease-in-out infinite reverse',
        }} />
        <div style={{
          position: 'absolute', width: 300, height: 300,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(78,205,196,0.06) 0%, transparent 70%)',
          top: '40%', left: '-80px',
          animation: 'orb-drift 26s ease-in-out infinite 4s',
        }} />
      </div>

      {/* ── Header ──────────────────────────────────────────── */}
      <header style={{
        padding: '0 2rem',
        height: 60,
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        position: 'sticky', top: 0, zIndex: 50,
        background: 'var(--header-bg)',
        gap: '1rem',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{
            fontSize: '1.5rem',
            display: 'inline-block',
            animation: 'float 4s ease-in-out infinite',
          }}>🪐</span>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.25rem', fontWeight: 400,
              letterSpacing: '0.07em',
              color: 'var(--text-gold)',
            }}>
              Jyotiṣa
            </span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.08em', fontStyle: 'italic' }}>
              The Eye of the Vedas
            </span>
          </div>
        </div>

        {/* Nav right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="badge badge-gold hide-mobile">Kāla · Free</span>
          <ThemeToggle />
        </div>
      </header>

      {/* ── Main ────────────────────────────────────────────── */}
      <main style={{
        flex: 1,
        position: 'relative', zIndex: 1,
        display: 'grid',
        gridTemplateColumns: '340px 1fr',
        maxWidth: 1440,
        width: '100%',
        margin: '0 auto',
        padding: '2rem',
        gap: '2rem',
        alignItems: 'start',
      }}>

        {/* ── Left: Form panel ────────────────────────────── */}
        <div style={{ position: 'sticky', top: '4.5rem' }} className="slide-left">
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', letterSpacing: '0.04em', margin: 0, fontFamily: 'var(--font-display)' }}>
                Birth Details
              </h2>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Janma Kāla</span>
            </div>
            <BirthForm
              onResult={(data) => { setChart(data); switchTab('chart') }}
              onLoading={setLoading}
              autoSubmit
            />
          </div>

          {chart && <ChartSummary chart={chart} />}
        </div>

        {/* ── Right: Chart result ──────────────────────────── */}
        {chart ? (
          <div className="fade-up" style={{ minWidth: 0 }}>

            {/* Person header */}
            <div style={{ marginBottom: '1.25rem' }}>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '2rem', fontWeight: 300,
                letterSpacing: '0.03em',
                margin: 0, marginBottom: '0.25rem',
              }}>
                {chart.meta.name}
              </h2>
              <div style={{
                display: 'flex', gap: '1rem', flexWrap: 'wrap',
                fontSize: '0.8rem', color: 'var(--text-muted)',
              }}>
                <span style={{ fontFamily: 'var(--font-mono)' }}>
                  {chart.meta.birthDate} · {chart.meta.birthTime}
                </span>
                <span>{chart.meta.birthPlace}</span>
                <span style={{ color: 'var(--text-gold)', fontStyle: 'italic' }}>{chart.meta.timezone}</span>
              </div>
            </div>

            {/* Tab bar */}
            <div className="tab-bar" style={{ marginBottom: '1.5rem' }}>
              {TABS.map(({ id, label, emoji }) => (
                <button
                  key={id}
                  id={`tab-${id}`}
                  className={`tab-btn${activeTab === id ? ' active' : ''}`}
                  onClick={() => switchTab(id)}
                >
                  <span style={{ marginRight: '0.35rem', opacity: 0.75 }}>{emoji}</span>
                  {label}
                </button>
              ))}
            </div>

            {/* Tab panels */}
            <div key={tabKey} className="fade-up">
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
                  <ArudhaPanel arudhas={chart.arudhas} />
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
                <div className="card">
                  <PanchangPanel p={chart.panchang} />
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Empty state */
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            minHeight: 400,
          }}>
            <div style={{ textAlign: 'center', opacity: 0.45 }} className="fade-in">
              <div style={{ fontSize: '4rem', marginBottom: '1rem', animation: 'float 5s ease-in-out infinite' }}>
                🌌
              </div>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>
                Enter birth details to cast the chart
              </p>
            </div>
          </div>
        )}
      </main>

      {/* ── Loading overlay ──────────────────────────────────── */}
      {loading && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(9,9,15,0.7)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 300,
          animation: 'fadeIn 0.2s ease',
        }}>
          <div style={{ textAlign: 'center' }}>
            {/* Dual-ring spinner */}
            <div style={{ position: 'relative', width: 64, height: 64, margin: '0 auto 1.25rem' }}>
              <div style={{
                position: 'absolute', inset: 0,
                border: '3px solid transparent',
                borderTopColor: 'var(--gold)',
                borderRadius: '50%',
                animation: 'spin-slow 0.85s linear infinite',
              }} />
              <div style={{
                position: 'absolute', inset: 8,
                border: '2px solid transparent',
                borderTopColor: 'var(--accent)',
                borderRadius: '50%',
                animation: 'spin-slow 0.6s linear infinite reverse',
              }} />
              <div style={{
                position: 'absolute',
                inset: '50%', transform: 'translate(-50%,-50%)',
                width: 8, height: 8,
                background: 'var(--gold)',
                borderRadius: '50%',
                animation: 'glow-pulse 1.2s ease-in-out infinite',
              }} />
            </div>
            <p style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--text-gold)',
              fontSize: '1.1rem',
              fontStyle: 'italic',
              margin: 0,
            }}>
              Consulting the chart
            </p>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              Jyotisha
            </p>
          </div>
        </div>
      )}

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer style={{
        position: 'relative', zIndex: 1,
        padding: '1rem 2rem',
        borderTop: '1px solid var(--border-soft)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '0.5rem',
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
      }}>
        <span>
          Powered by{' '}
          <span style={{ color: 'var(--text-gold)', fontStyle: 'italic' }}>Swiss Ephemeris</span>
          {' '}· Lahiri ayanamsha
        </span>
        <span>Kāla tier — free forever ✦</span>
      </footer>
    </div>
  )
}