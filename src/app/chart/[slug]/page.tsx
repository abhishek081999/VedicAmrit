'use client'
// ─────────────────────────────────────────────────────────────
//  src/app/chart/[slug]/page.tsx
//  Public chart share page — /chart/<slug>
//  • Loads chart metadata from DB via /api/chart/public
//  • Recalculates full chart via /api/chart/calculate
//  • Shows read-only chart with all tabs
//  • No auth required
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { VargaSwitcher } from '@/components/chakra/VargaSwitcher'
import { GrahaTable }    from '@/components/ui/GrahaTable'
import { DashaTree }     from '@/components/dasha/DashaTree'
import { ShadbalaTable }    from '@/components/ui/ShadbalaTable'
import { VimsopakaBalaPanel } from '@/components/ui/VimsopakaBalaPanel'
import { ThemeToggle }      from '@/components/ui/ThemeToggle'
import { InterpretationPanel } from '@/components/ui/InterpretationPanel'
import type { ChartOutput, Rashi } from '@/types/astrology'
import { RASHI_NAMES }      from '@/types/astrology'

// ── Types ─────────────────────────────────────────────────────

interface SavedChart {
  name:       string
  birthDate:  string
  birthTime:  string
  birthPlace: string
  latitude:   number
  longitude:  number
  timezone:   string
  settings:   Record<string, unknown>
  slug:       string
  createdAt:  string
}

interface Branding {
  brandName: string | null
  brandLogo: string | null
}

type Tab = 'chart' | 'planets' | 'interpretation' | 'arudhas' | 'dasha' | 'panchang' | 'shadbala' | 'vimsopaka'

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'chart',   label: 'Chart',    emoji: '◯' },
  { id: 'planets', label: 'Planets',  emoji: '✦' },
  { id: 'interpretation', label: 'Interpretation', emoji: '✧' },
  { id: 'dasha',   label: 'Daśā',     emoji: '⏳' },
  { id: 'shadbala',label: 'Ṣaḍbala',  emoji: '⚖' },
  { id: 'vimsopaka',label: 'Viṁśopaka',emoji: '⑳' },
  { id: 'panchang',label: 'Pañcāṅga', emoji: '📅' },
  { id: 'arudhas', label: 'Āruḍhas',  emoji: '☯' },
]

// ── Helpers ───────────────────────────────────────────────────

const WEEKDAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const MONTHS   = ['January','February','March','April','May','June','July','August','September','October','November','December']

function fmtDate(str: string): string {
  const d = new Date(str + 'T12:00:00Z')
  return `${WEEKDAYS[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

function fmtTime(str: string): string {
  const [h, m] = str.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${ampm}`
}

// ── Panchang Panel ────────────────────────────────────────────

function PanchangPanel({ p }: { p: ChartOutput['panchang'] }) {
  function ft(d: Date | string) {
    const dt  = new Date(d)
    const hrs = dt.getHours(); const min = String(dt.getMinutes()).padStart(2,'0')
    return `${hrs % 12 || 12}:${min} ${hrs >= 12 ? 'PM' : 'AM'}`
  }
  const items = [
    { label: 'Vara',      value: p.vara.name,       sub: `Lord: ${p.vara.lord}`,                        icon: '☀' },
    { label: 'Tithi',     value: p.tithi.name,      sub: p.tithi.paksha === 'shukla' ? 'Śukla Pakṣa' : 'Kṛṣṇa Pakṣa', icon: '🌙' },
    { label: 'Nakshatra', value: p.nakshatra.name,  sub: `Pada ${p.nakshatra.pada} · ${p.nakshatra.lord}`, icon: '⭐' },
    { label: 'Yoga',      value: p.yoga.name,       sub: `#${p.yoga.number}`,                            icon: '☯' },
    { label: 'Karana',    value: p.karana.name,     sub: `#${p.karana.number}`,                          icon: '✦' },
  ]
  const muhurtas = [
    { label: 'Rāhu Kālam',   times: p.rahuKalam,      bad: true },
    { label: 'Gulikā Kālam', times: p.gulikaKalam,    bad: true },
    ...(p.abhijitMuhurta ? [{ label: 'Abhijit Muhūrta', times: p.abhijitMuhurta, bad: false }] : []),
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))', gap: '0.75rem' }}>
        {items.map(({ label, value, sub, icon }) => (
          <div key={label} className="stat-chip">
            <div className="stat-label">{icon} {label}</div>
            <div className="stat-value">{value}</div>
            <div className="stat-sub">{sub}</div>
          </div>
        ))}
      </div>
      <div>
        <div className="label-caps" style={{ marginBottom: '0.6rem' }}>Muhūrta Windows</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.6rem' }}>
          {muhurtas.map(({ label, times, bad }) => (
            <div key={label} style={{
              padding: '0.85rem 1rem',
              background: bad ? 'rgba(224,123,142,0.06)' : 'rgba(78,205,196,0.06)',
              border: `1px solid ${bad ? 'rgba(224,123,142,0.2)' : 'rgba(78,205,196,0.2)'}`,
              borderRadius: 'var(--r-md)',
            }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: bad ? 'var(--rose)' : 'var(--teal)', marginBottom: '0.35rem', fontFamily: 'var(--font-display)' }}>{label}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                {ft(times.start)} – {ft(times.end)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Arudha Panel ──────────────────────────────────────────────

function ArudhaPanel({ arudhas }: { arudhas: ChartOutput['arudhas'] }) {
  const items = [
    { key: 'AL',  label: 'Āruḍha Lagna',   desc: 'Image of self' },
    { key: 'A2',  label: 'Dhana Pada',      desc: 'Wealth' },
    { key: 'A3',  label: 'Vikrama Pada',    desc: 'Courage' },
    { key: 'A4',  label: 'Matri Pada',      desc: 'Home & mother' },
    { key: 'A5',  label: 'Mantra Pada',     desc: 'Intellect' },
    { key: 'A6',  label: 'Roga Pada',       desc: 'Enemies & debts' },
    { key: 'A7',  label: 'Dara Pada',       desc: 'Spouse' },
    { key: 'A8',  label: 'Mrityu Pada',     desc: 'Longevity' },
    { key: 'A9',  label: 'Pitri Pada',      desc: 'Father & fortune' },
    { key: 'A10', label: 'Karma Pada',      desc: 'Career' },
    { key: 'A11', label: 'Labha Pada',      desc: 'Gains' },
    { key: 'UL',  label: 'Upapada Lagna',   desc: 'Marriage' },
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.55rem' }}>
      {items.map(({ key, label, desc }) => {
        const dataKey = key === 'UL' ? 'A12' : key
        const rashi = (arudhas as unknown as Record<string, number>)[dataKey]
        if (!rashi) return null
        return (
          <div key={key} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '0.6rem 0.9rem',
            background: key === 'AL' ? 'rgba(201,168,76,0.08)' : 'var(--surface-2)',
            border: `1px solid ${key === 'AL' ? 'var(--border-bright)' : 'var(--border)'}`,
            borderRadius: 'var(--r-md)',
          }}>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: key === 'AL' ? 'var(--text-gold)' : 'var(--text-muted)', letterSpacing: '0.06em', fontFamily: 'var(--font-display)' }}>{key}</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{label}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic', fontFamily: 'var(--font-display)' }}>{desc}</div>
            </div>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontWeight: 600,
              color: key === 'AL' ? 'var(--text-gold)' : 'var(--text-secondary)',
              textAlign: 'right', minWidth: 60,
            }}>
              {RASHI_NAMES[rashi as keyof typeof RASHI_NAMES] ?? rashi}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────

export default function PublicChartPage() {
  const params    = useParams()
  const slug      = params?.slug as string

  const [saved,   setSaved]   = useState<SavedChart | null>(null)
  const [branding, setBranding] = useState<Branding | null>(null)
  const [chart,   setChart]   = useState<ChartOutput | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)
  const [tab,     setTab]     = useState<Tab>('chart')
  const [tabKey,  setTabKey]  = useState(0)
  const [activeVarga, setActiveVarga] = useState<string>('D1')

  function switchTab(t: Tab) { setTab(t); setTabKey(k => k + 1) }

  useEffect(() => {
    if (!slug) return
    loadChart(slug)
  }, [slug])

  async function loadChart(s: string) {
    setLoading(true)
    setError(null)
    try {
      // 1. Fetch saved chart metadata
      const metaRes  = await fetch(`/api/chart/public?slug=${s}`)
      const metaJson = await metaRes.json()
      if (!metaJson.success) throw new Error(metaJson.error ?? 'Chart not found')
      const meta: SavedChart = metaJson.chart
      setSaved(meta)
      setBranding(metaJson.branding)

      // 2. Recalculate full chart
      const calcRes  = await fetch('/api/chart/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:       meta.name,
          birthDate:  meta.birthDate,
          birthTime:  meta.birthTime,
          birthPlace: meta.birthPlace,
          latitude:   meta.latitude,
          longitude:  meta.longitude,
          timezone:   meta.timezone,
          settings:   meta.settings,
        }),
      })
      const calcJson = await calcRes.json()
      if (!calcJson.success) throw new Error('Failed to calculate chart')
      setChart(calcJson.data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load chart')
    } finally {
      setLoading(false)
    }
  }

  const ascRashi: Rashi = chart?.lagnas.ascDegree
    ? ((Math.ceil(((chart.lagnas.ascDegree % 360) + 360) % 360 / 30) || 1) as Rashi)
    : 1

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-page)' }}>

      {/* ── Header ─────────────────────────────────────────── */}
      <header style={{
        padding: '0 2rem', height: '3.75rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        backdropFilter: 'blur(16px)', position: 'sticky', top: 0, zIndex: 50,
        background: 'var(--header-bg)', borderBottom: '1px solid var(--border-soft)',
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
          {branding?.brandLogo ? (
            <img src={branding.brandLogo} alt={branding.brandName || 'Brand'} style={{ height: '1.8rem', width: 'auto' }} />
          ) : (
            <>
              <span style={{ fontSize: '1.3rem' }}>🪐</span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-gold)' }}>
                Vedaansh
              </span>
            </>
          )}
          {branding?.brandName && !branding?.brandLogo && (
             <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-gold)' }}>
               {branding.brandName}
             </span>
          )}
        </Link>
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link href="/panchang" style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', color: 'var(--text-secondary)', textDecoration: 'none' }}>
            Pañcāṅga
          </Link>
          <Link href="/" className="btn btn-primary btn-sm" style={{ fontSize: '0.82rem' }}>
            + New Chart
          </Link>
          <ThemeToggle />
        </nav>
      </header>

      <main style={{ flex: 1, maxWidth: 1200, width: '100%', margin: '0 auto', padding: 'clamp(1rem, 3vw, 2rem)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* ── Loading ─────────────────────────────────────── */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem', gap: '1rem' }}>
            <div className="spin-loader" style={{ width: 44, height: 44, border: '3px solid var(--border)', borderTopColor: 'var(--gold)' }} />
            <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--text-muted)', fontSize: '1rem' }}>
              Consulting the ephemeris…
            </div>
          </div>
        )}

        {/* ── Error ───────────────────────────────────────── */}
        {error && !loading && (
          <div style={{ maxWidth: 480, margin: '5rem auto', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🪐</div>
            <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              Chart not found
            </h2>
            <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontStyle: 'italic', marginBottom: '1.5rem' }}>
              This chart is private or the link has expired.
            </p>
            <Link href="/" className="btn btn-primary">Calculate a Chart</Link>
          </div>
        )}

        {/* ── Chart ───────────────────────────────────────── */}
        {chart && saved && !loading && (
          <>
            {/* Person header */}
            <div className="fade-up" style={{
              display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
              gap: '1rem', flexWrap: 'wrap',
              padding: '1.25rem 1.5rem',
              background: 'var(--surface-1)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-lg)',
            }}>
              <div>
                <h1 style={{
                  fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 4vw, 2.2rem)',
                  fontWeight: 600, color: 'var(--text-primary)',
                  margin: 0, marginBottom: '0.4rem',
                }}>
                  {saved.name}
                </h1>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  <span suppressHydrationWarning style={{ fontFamily: 'var(--font-mono)' }}>
                    {fmtDate(saved.birthDate)} · {fmtTime(saved.birthTime.slice(0, 5))}
                  </span>
                  <span>📍 {saved.birthPlace}</span>
                  <span style={{ color: 'var(--text-gold)', fontStyle: 'italic' }}>{saved.timezone}</span>
                </div>
              </div>

              {/* Key chart facts */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {[
                  { label: 'Ascendant', value: RASHI_NAMES[ascRashi] },
                  { label: 'Ayanamsha', value: `${chart.meta.settings.ayanamsha} ${chart.meta.ayanamshaValue.toFixed(2)}°` },
                ].map(({ label, value }) => (
                  <div key={label} style={{
                    padding: '0.5rem 0.85rem',
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--r-md)',
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>{label}</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', marginTop: 2 }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Public badge */}
            {branding?.brandName ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{
                  padding: '0.2rem 0.65rem',
                  background: 'rgba(201,168,76,0.10)', border: '1px solid rgba(201,168,76,0.30)',
                  borderRadius: 99, fontSize: '0.72rem', fontWeight: 700,
                  letterSpacing: '0.07em', textTransform: 'uppercase',
                  color: 'var(--gold)', fontFamily: 'var(--font-display)',
                }}>
                  💎 Verified Consultant
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>
                  Prepared for you by <strong>{branding.brandName}</strong>
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{
                  padding: '0.2rem 0.65rem',
                  background: 'rgba(78,205,196,0.10)', border: '1px solid rgba(78,205,196,0.30)',
                  borderRadius: 99, fontSize: '0.72rem', fontWeight: 700,
                  letterSpacing: '0.07em', textTransform: 'uppercase',
                  color: 'var(--teal)', fontFamily: 'var(--font-display)',
                }}>
                  🔗 Public Chart
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>
                  Shared via Vedaansh · Calculate your own chart free
                </span>
              </div>
            )}

            {/* Tab bar */}
            <div className="tab-bar">
              {TABS.map(({ id, label, emoji }) => (
                <button
                  key={id}
                  className={`tab-btn${tab === id ? ' active' : ''}`}
                  onClick={() => switchTab(id)}
                >
                  <span style={{ marginRight: '0.35rem', opacity: 0.75 }}>{emoji}</span>
                  {label}
                </button>
              ))}
            </div>

            {/* Tab panels */}
            <div key={tabKey} className="fade-up">
              {tab === 'chart' && (
                <VargaSwitcher
                  vargas={chart.vargas}
                  vargaLagnas={chart.vargaLagnas}
                  ascRashi={ascRashi ?? 1}
                  lagnas={chart.lagnas}
                  arudhas={chart.arudhas}
                  userPlan="free"
                  onActiveVargaChange={setActiveVarga}
                  moonNakIndex={chart.grahas.find(g => g.id === 'Mo')?.nakshatraIndex ?? 0}
                />
              )}

              {tab === 'planets' && (
                <div className="card">
                  <GrahaTable 
                    grahas={chart.grahas} 
                    vargas={chart.vargas} 
                    vargaLagnas={chart.vargaLagnas}
                    lagnas={chart.lagnas}
                    activeVarga={activeVarga}
                  />
                </div>
              )}

              {tab === 'interpretation' && (
                <div className="card">
                  <div className="label-caps" style={{ marginBottom: '0.85rem' }}>
                    Interpretation Layer
                  </div>
                  {chart.interpretation ? (
                    <InterpretationPanel interpretation={chart.interpretation} />
                  ) : (
                    <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      Interpretation Layer is unavailable for this chart.
                    </div>
                  )}
                </div>
              )}

              {tab === 'arudhas' && (
                <div className="card">
                  <div className="label-caps" style={{ marginBottom: '0.75rem' }}>Bhāva Āruḍhas</div>
                  <ArudhaPanel arudhas={chart.arudhas} />
                </div>
              )}

              {tab === 'dasha' && (
                <div className="card">
                  <div className="label-caps" style={{ marginBottom: '0.75rem' }}>Viṁśottarī Daśā</div>
                  <DashaTree
                    nodes={chart.dashas.vimshottari ?? []}
                    birthDate={new Date(chart.meta.birthDate)}
                  />
                </div>
              )}

              {tab === 'panchang' && (
                <div className="card">
                  <div className="label-caps" style={{ marginBottom: '1rem' }}>Natal Pañcāṅga</div>
                  <PanchangPanel p={chart.panchang} />
                </div>
              )}

              {tab === 'shadbala' && (
                <div className="card">
                  <div className="label-caps" style={{ marginBottom: '1rem' }}>Ṣaḍbala — Six-fold Strength</div>
                  <ShadbalaTable shadbala={chart.shadbala} />
                </div>
              )}

              {tab === 'vimsopaka' && (
                <div className="card" style={{ padding: '0.1rem' }}>
                  {chart.vimsopaka
                    ? <VimsopakaBalaPanel vimsopaka={chart.vimsopaka} />
                    : <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '1.25rem' }}>Viṁśopaka data unavailable.</div>
                  }
                </div>
              )}
            </div>

            {/* Footer CTA */}
            <div style={{
              padding: '1.5rem', textAlign: 'center',
              background: 'linear-gradient(135deg, rgba(201,168,76,0.06), rgba(139,124,246,0.06))',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-lg)',
            }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                Explore your own chart
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontStyle: 'italic', marginBottom: '1rem' }}>
                Free forever — all varga charts, Dasha tree, Āruḍhas & Pañcāṅga
              </div>
              <Link href="/" className="btn btn-primary">
                Calculate My Chart →
              </Link>
            </div>
          </>
        )}
      </main>

      <footer style={{
        padding: '1rem 2rem', borderTop: '1px solid var(--border-soft)',
        textAlign: 'center', color: 'var(--text-muted)',
        fontFamily: 'var(--font-display)', fontSize: '0.8rem',
      }}>
        Powered by <span style={{ color: 'var(--text-gold)' }}>Swiss Ephemeris</span>
        {' '}· Free forever ·{' '}
        <Link href="/" style={{ color: 'var(--text-gold)', textDecoration: 'none' }}>Vedaansh</Link>
      </footer>
    </div>
  )
}