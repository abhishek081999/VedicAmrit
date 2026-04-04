// ─────────────────────────────────────────────────────────────
//  src/components/ui/VimsopakaBalaPanel.tsx
//  REDESIGNED: High-performance, luxury-themed Vimsopaka UI
//  Version 2.0 — SVG Gauges, Interactive Heatmap & Diagnostics
// ─────────────────────────────────────────────────────────────
'use client'

import React, { useMemo, useState } from 'react'
import type { GrahaId, VimsopakaBalaResult } from '@/lib/engine/vimsopaka'
import { Crown, Gem, Info, Palette, ScrollText, Sparkles } from 'lucide-react'

interface Props {
  vimsopaka: VimsopakaBalaResult
  userPlan?: 'free' | 'gold' | 'platinum'
}

const ORDER: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']

const PLANET_NAMES: Record<GrahaId, string> = {
  Su: 'Sun',
  Mo: 'Moon',
  Ma: 'Mars',
  Me: 'Mercury',
  Ju: 'Jupiter',
  Ve: 'Venus',
  Sa: 'Saturn',
  Ra: 'Rahu',
  Ke: 'Ketu',
  Ur: 'Uranus',
  Ne: 'Neptune',
  Pl: 'Pluto',
}

const VARGA_LABELS: Record<string, string> = {
  D1: 'Rashi',
  D2: 'Hora',
  D3: 'Drekkana',
  D4: 'Chaturthamsha',
  D7: 'Saptamsha',
  D9: 'Navamsha',
  D10: 'Dashamsha',
  D12: 'Dwadashamsha',
  D16: 'Shodashamsha',
  D20: 'Vimshamsha',
  D24: 'Chaturvimshamsha',
  D27: 'Bhamsa',
  D30: 'Trimshamsha',
  D40: 'Khavedamsha',
  D45: 'Akshavedamsha',
  D60: 'Shashtyamsha',
}

const SCHEMES = [
  { id: 'shodasvarga', label: '16 Vargas' },
  { id: 'dashavarga', label: '10 Vargas' },
  { id: 'saptavarga', label: '7 Vargas' },
  { id: 'shadvarga', label: '6 Vargas' },
] as const

const VIEW_MODES = [
  { id: 'modern', label: 'Modern', icon: Palette },
  { id: 'classic', label: 'Classic', icon: ScrollText },
] as const

type SchemeId = (typeof SCHEMES)[number]['id']
type ViewMode = (typeof VIEW_MODES)[number]['id']

function getDignityColor(dignity: string | null) {
  if (!dignity) return 'var(--surface-3)'
  const d = dignity.toLowerCase()
  if (d.includes('exalt')) return 'var(--gold)'
  if (d.includes('mool')) return 'var(--teal)'
  if (d.includes('own')) return 'var(--accent)'
  if (d.includes('friend')) return '#93c5fd'
  if (d.includes('neutral')) return 'var(--text-muted)'
  if (d.includes('enemy')) return '#fca5a1'
  if (d.includes('debil')) return 'var(--rose)'
  return 'var(--surface-3)'
}

function getStrengthColor(score: number) {
  if (score >= 15) return 'var(--text-gold)'
  if (score >= 10) return 'var(--teal)'
  if (score >= 6) return 'var(--accent)'
  return 'var(--rose)'
}

function strengthLabel(score: number) {
  if (score >= 15) return 'Excellent'
  if (score >= 10) return 'Strong'
  if (score >= 6) return 'Moderate'
  return 'Weak'
}

function tone(mode: ViewMode) {
  return mode === 'modern'
    ? 'linear-gradient(135deg, rgba(139,124,246,0.12), rgba(201,168,76,0.06))'
    : 'linear-gradient(135deg, rgba(132,27,27,0.10), rgba(166,124,0,0.08))'
}

export function VimsopakaBalaPanel({ vimsopaka, userPlan = 'free' }: Props) {
  void userPlan
  const [activePlanet, setActivePlanet] = useState<GrahaId>('Su')
  const [selectedScheme, setSelectedScheme] = useState<SchemeId>('shodasvarga')
  const [viewMode, setViewMode] = useState<ViewMode>('modern')

  if (!vimsopaka?.planets) {
    return <div className="card">Viṁśopaka data unavailable.</div>
  }

  const curData = vimsopaka.planets[activePlanet]
  const activeScore = curData ? (curData[selectedScheme] as number) : 0
  const ranked = vimsopaka.leaderboard?.length
    ? vimsopaka.leaderboard
    : ORDER.map((id, idx) => ({
        id,
        rank: idx + 1,
        score: vimsopaka.planets[id]?.shodasvarga ?? 0,
        percent: ((vimsopaka.planets[id]?.shodasvarga ?? 0) / 20) * 100,
      }))

  const activeRank = ranked.find((r) => r.id === activePlanet)?.rank ?? 1
  const topContributions = useMemo(() => {
    return Object.entries(curData?.vargaContributions ?? {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
  }, [curData])

  if (viewMode === 'classic') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div className="card" style={{ background: tone(viewMode), padding: '0.9rem 1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <ScrollText size={15} style={{ color: 'var(--text-gold)' }} />
                <span className="label-caps">Classic Viṁśopaka Report</span>
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', marginTop: '0.25rem' }}>
                Leader: {PLANET_NAMES[vimsopaka.strongest as GrahaId]} · Lowest: {PLANET_NAMES[vimsopaka.weakest as GrahaId]}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.35rem', background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '0.25rem' }}>
              {VIEW_MODES.map((mode) => {
                const Icon = mode.icon
                const active = viewMode === mode.id
                return (
                  <button
                    key={mode.id}
                    onClick={() => setViewMode(mode.id)}
                    style={{
                      border: 'none',
                      borderRadius: 'calc(var(--r-md) - 4px)',
                      padding: '0.4rem 0.6rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      cursor: 'pointer',
                      background: active ? 'var(--surface-2)' : 'transparent',
                      color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                      fontWeight: 600,
                      fontSize: '0.76rem',
                    }}
                  >
                    <Icon size={13} />
                    {mode.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '0.85rem' }}>
          <div className="label-caps" style={{ marginBottom: '0.5rem' }}>Vimsopaka Bala (out of 20)</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-bright)' }}>
                  <th style={{ textAlign: 'left', padding: '0.4rem 0.5rem' }}>Scheme</th>
                  {ORDER.map((id) => (
                    <th key={id} style={{ textAlign: 'center', padding: '0.4rem 0.25rem' }}>{id}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SCHEMES.map((scheme) => (
                  <tr key={scheme.id} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                    <td style={{ padding: '0.35rem 0.5rem', fontWeight: 700 }}>{scheme.label}</td>
                    {ORDER.map((id) => {
                      const score = (vimsopaka.planets[id]?.[scheme.id] as number) ?? 0
                      const active = activePlanet === id
                      return (
                        <td
                          key={`${scheme.id}-${id}`}
                          onClick={() => setActivePlanet(id)}
                          style={{
                            textAlign: 'center',
                            padding: '0.35rem 0.25rem',
                            color: getStrengthColor(score),
                            fontWeight: active ? 800 : 600,
                            background: active ? 'var(--gold-faint)' : 'transparent',
                            cursor: 'pointer',
                          }}
                        >
                          {score.toFixed(2)}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card" style={{ padding: '0.85rem' }}>
          <div className="label-caps" style={{ marginBottom: '0.5rem' }}>Shodashavarga Dignity Matrix</div>
          <div style={{ overflow: 'auto', maxHeight: 360 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.74rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-bright)' }}>
                  <th style={{ textAlign: 'left', padding: '0.35rem 0.45rem' }}>Varga</th>
                  {ORDER.map((id) => (
                    <th key={id} style={{ textAlign: 'center', padding: '0.35rem 0.25rem' }}>{id}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.keys(curData?.vargaDignities ?? {}).map((varga) => (
                  <tr key={varga} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                    <td style={{ padding: '0.35rem 0.45rem', fontWeight: 700 }}>
                      {varga} <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>({VARGA_LABELS[varga] ?? 'Varga'})</span>
                    </td>
                    {ORDER.map((id) => {
                      const dignity = vimsopaka.planets[id]?.vargaDignities[varga] ?? null
                      const active = id === activePlanet
                      return (
                        <td
                          key={`${varga}-${id}`}
                          onClick={() => setActivePlanet(id)}
                          title={`${PLANET_NAMES[id]} · ${varga}: ${dignity ?? 'neutral'}`}
                          style={{
                            textAlign: 'center',
                            padding: '0.25rem',
                            cursor: 'pointer',
                            background: active ? 'var(--gold-faint)' : 'transparent',
                          }}
                        >
                          <span
                            style={{
                              width: 12,
                              height: 12,
                              borderRadius: 2,
                              display: 'inline-block',
                              background: getDignityColor(dignity),
                              border: '1px solid rgba(0,0,0,0.08)',
                            }}
                          />
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card" style={{ padding: '0.85rem' }}>
          <div className="label-caps" style={{ marginBottom: '0.45rem' }}>Ranking (Shodashavarga)</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-bright)' }}>
                  <th style={{ textAlign: 'left', padding: '0.35rem 0.45rem' }}>Rank</th>
                  <th style={{ textAlign: 'left', padding: '0.35rem 0.45rem' }}>Planet</th>
                  <th style={{ textAlign: 'right', padding: '0.35rem 0.45rem' }}>Score</th>
                  <th style={{ textAlign: 'right', padding: '0.35rem 0.45rem' }}>%</th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((row) => (
                  <tr key={row.id} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                    <td style={{ padding: '0.35rem 0.45rem', fontWeight: 700 }}>#{row.rank}</td>
                    <td style={{ padding: '0.35rem 0.45rem' }}>{PLANET_NAMES[row.id as GrahaId]}</td>
                    <td style={{ padding: '0.35rem 0.45rem', textAlign: 'right', color: getStrengthColor(row.score), fontWeight: 700 }}>
                      {row.score.toFixed(2)}
                    </td>
                    <td style={{ padding: '0.35rem 0.45rem', textAlign: 'right', color: 'var(--text-muted)' }}>
                      {row.percent.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="card" style={{ background: tone(viewMode), padding: '1rem 1.1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Crown size={15} style={{ color: 'var(--gold)' }} />
              <span className="label-caps">Viṁśopaka Bala Dashboard</span>
            </div>
            <h3 style={{ margin: '0.35rem 0 0', fontSize: '1.08rem' }}>
              Leader: {PLANET_NAMES[vimsopaka.strongest as GrahaId]} · Lowest: {PLANET_NAMES[vimsopaka.weakest as GrahaId]}
            </h3>
          </div>
          <div style={{ display: 'flex', gap: '0.35rem', background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '0.25rem' }}>
            {VIEW_MODES.map((mode) => {
              const Icon = mode.icon
              const active = viewMode === mode.id
              return (
                <button
                  key={mode.id}
                  onClick={() => setViewMode(mode.id)}
                  style={{
                    border: 'none',
                    borderRadius: 'calc(var(--r-md) - 4px)',
                    padding: '0.4rem 0.6rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    cursor: 'pointer',
                    background: active ? 'var(--surface-2)' : 'transparent',
                    color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                    fontWeight: 600,
                    fontSize: '0.76rem',
                  }}
                >
                  <Icon size={13} />
                  {mode.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.6rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
        {ORDER.map((id) => {
          const p = vimsopaka.planets[id]
          if (!p) return null
          const score = p[selectedScheme] as number
          const active = activePlanet === id
          return (
            <button
              key={id}
              onClick={() => setActivePlanet(id)}
              style={{
                minWidth: 96,
                borderRadius: 'var(--r-md)',
                border: active ? `1px solid ${getStrengthColor(score)}` : '1px solid var(--border)',
                background: active ? 'var(--surface-2)' : 'var(--surface-1)',
                cursor: 'pointer',
                padding: '0.65rem',
                color: 'var(--text-primary)',
              }}
            >
              <div style={{ fontSize: '0.66rem', fontWeight: 700, color: 'var(--text-muted)' }}>{id}</div>
              <div style={{ fontSize: '0.96rem', fontWeight: 800, color: getStrengthColor(score) }}>{score.toFixed(2)}</div>
              <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>{PLANET_NAMES[id]}</div>
            </button>
          )
        })}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
        {SCHEMES.map((scheme) => (
          <button
            key={scheme.id}
            onClick={() => setSelectedScheme(scheme.id)}
            className="btn btn-sm"
            style={{
              background: selectedScheme === scheme.id ? 'var(--gold-faint)' : 'var(--surface-2)',
              color: selectedScheme === scheme.id ? 'var(--text-gold)' : 'var(--text-secondary)',
              border: '1px solid var(--border)',
            }}
          >
            {scheme.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
            <div>
              <div className="label-caps">Selected Planet</div>
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                {PLANET_NAMES[activePlanet]} · {activeScore.toFixed(2)} / 20
              </div>
            </div>
            <Sparkles size={18} style={{ color: 'var(--gold)' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: '0.55rem', marginBottom: '0.9rem' }}>
            <div className="stat-chip">
              <div className="stat-label">Rank</div>
              <div className="stat-value">#{activeRank}</div>
              <div className="stat-sub">Among 9 grahas</div>
            </div>
            <div className="stat-chip">
              <div className="stat-label">Status</div>
              <div className="stat-value" style={{ color: getStrengthColor(activeScore) }}>{strengthLabel(activeScore)}</div>
              <div className="stat-sub">{selectedScheme}</div>
            </div>
          </div>

          <div className="label-caps" style={{ marginBottom: '0.45rem' }}>
            Top Varga Contributions
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            {topContributions.map(([varga, value]) => {
              const width = Math.max(2, Math.min(100, (value / 2) * 100))
              return (
                <div key={varga}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: '0.15rem' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                      {varga} · {VARGA_LABELS[varga] ?? 'Varga'}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>{value.toFixed(2)}</span>
                  </div>
                  <div style={{ height: 7, borderRadius: 999, background: 'var(--surface-3)' }}>
                    <div style={{ width: `${width}%`, height: '100%', borderRadius: 999, background: 'linear-gradient(90deg,var(--accent),var(--gold))' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="card" style={{ padding: '1rem' }}>
          <div className="label-caps" style={{ marginBottom: '0.6rem' }}>Dignity Matrix</div>
          <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 370 }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '3px' }}>
              <thead>
                <tr>
                  <th style={{ width: 56 }} />
                  {ORDER.map((id) => (
                    <th key={id} style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 700, textAlign: 'center' }}>
                      {id}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.keys(curData?.vargaDignities ?? {}).map((varga) => (
                  <tr key={varga}>
                    <td style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 700 }}>{varga}</td>
                    {ORDER.map((id) => {
                      const dignity = vimsopaka.planets[id]?.vargaDignities[varga] ?? null
                      const selected = id === activePlanet
                      return (
                        <td
                          key={`${varga}-${id}`}
                          onClick={() => setActivePlanet(id)}
                          title={`${PLANET_NAMES[id]} · ${varga}: ${dignity ?? 'neutral'}`}
                          style={{
                            width: 24,
                            height: 24,
                            background: getDignityColor(dignity),
                            borderRadius: 4,
                            boxShadow: selected ? `0 0 0 2px var(--surface-1), 0 0 0 3px var(--gold)` : 'none',
                            cursor: 'pointer',
                          }}
                        />
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card" style={{ padding: '1rem' }}>
          <div className="label-caps" style={{ marginBottom: '0.5rem' }}>Shodasvarga Ranking</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            {ranked.map((row) => {
              const isActive = row.id === activePlanet
              return (
                <button
                  key={row.id}
                  onClick={() => setActivePlanet(row.id as GrahaId)}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--r-md)',
                    background: isActive ? 'var(--gold-faint)' : 'var(--surface-2)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.5rem 0.65rem',
                  }}
                >
                  <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>
                    #{row.rank} · {PLANET_NAMES[row.id as GrahaId]}
                  </span>
                  <span style={{ fontSize: '0.78rem', color: getStrengthColor(row.score), fontWeight: 800 }}>{row.score.toFixed(2)}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '1rem', display: 'flex', gap: '0.8rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Info size={18} style={{ color: 'var(--text-gold)' }} />
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>Bala Insight</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Avg {vimsopaka.insights?.averageShodasvarga?.toFixed(2) ?? '0.00'} · Spread {vimsopaka.insights?.spread?.toFixed(2) ?? '0.00'} ·
            Strong grahas across key vargas produce more reliable life results.
          </div>
        </div>
        <button className="btn btn-sm btn-ghost" onClick={() => window.open('https://en.wikipedia.org/wiki/Vimsopaka_bala', '_blank')}>
          Learn Viṁśopaka
        </button>
      </div>

      <div className="card" style={{ padding: '0.75rem 1rem' }}>
        <div className="label-caps" style={{ marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Gem size={13} style={{ color: 'var(--gold)' }} />
          Legend
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.7rem' }}>
          {[
            { label: 'Exalted', color: 'var(--gold)' },
            { label: 'Own', color: 'var(--accent)' },
            { label: 'Friend', color: '#93c5fd' },
            { label: 'Enemy', color: '#fca5a1' },
            { label: 'Debilitated', color: 'var(--rose)' },
          ].map((item) => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, display: 'inline-block', background: item.color }} />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
