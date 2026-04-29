'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/PlanetHoverTooltip.tsx
//  Premium hover tooltip with planetary interpretations
//  Uses a portal so it is never clipped by overflow:hidden parents
// ─────────────────────────────────────────────────────────────

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { GRAHA_NAMES, RASHI_NAMES, NAKSHATRA_NAMES, type GrahaId, type Rashi } from '@/types/astrology'
import { SIGN_INTERPRETATIONS, NAKSHATRA_INTERPRETATIONS, DIGNITY_INTERPRETATIONS } from '@/lib/engine/interpretations'
import { getAspectedHouses, getAspectDescription, GRAHA_ASPECTS } from '@/lib/engine/aspects'


// ── Planet colour palette ─────────────────────────────────────
const PLANET_COLORS: Record<string, { primary: string; bg: string; glow: string }> = {
  Su: { primary: '#f59e0b', bg: 'rgba(245,158,11,0.08)', glow: 'rgba(245,158,11,0.25)' },
  Mo: { primary: '#818cf8', bg: 'rgba(129,140,248,0.08)', glow: 'rgba(129,140,248,0.25)' },
  Ma: { primary: '#f87171', bg: 'rgba(248,113,113,0.08)', glow: 'rgba(248,113,113,0.25)' },
  Me: { primary: '#34d399', bg: 'rgba(52,211,153,0.08)', glow: 'rgba(52,211,153,0.25)' },
  Ju: { primary: '#fbbf24', bg: 'rgba(251,191,36,0.08)', glow: 'rgba(251,191,36,0.25)' },
  Ve: { primary: '#f472b6', bg: 'rgba(244,114,182,0.08)', glow: 'rgba(244,114,182,0.25)' },
  Sa: { primary: '#94a3b8', bg: 'rgba(148,163,184,0.08)', glow: 'rgba(148,163,184,0.25)' },
  Ra: { primary: '#c084fc', bg: 'rgba(192,132,252,0.08)', glow: 'rgba(192,132,252,0.25)' },
  Ke: { primary: '#fb923c', bg: 'rgba(251,146,60,0.08)', glow: 'rgba(251,146,60,0.25)' },
}

const PLANET_SYMBOLS: Record<string, string> = {
  Su: '☉', Mo: '☽', Ma: '♂', Me: '☿', Ju: '♃', Ve: '♀', Sa: '♄', Ra: '☊', Ke: '☋',
}

const PLANET_VEDIC: Record<string, string> = {
  Su: 'Sūrya', Mo: 'Chandra', Ma: 'Maṅgala', Me: 'Budha',
  Ju: 'Guru', Ve: 'Śukra', Sa: 'Śani', Ra: 'Rāhu', Ke: 'Ketu',
}

const DIGNITY_COLORS: Record<string, string> = {
  exalted:      '#4ade80',
  moolatrikona: '#c084fc',
  own:          '#fbbf24',
  great_friend: '#34d399',
  friend:       '#6ee7b7',
  neutral:      '#94a3b8',
  enemy:        '#f87171',
  great_enemy:  '#ef4444',
  debilitated:  '#f43f5e',
}

const KEYWORD_MAP: Record<string, string[]> = {
  Su: ['Ātmā · Soul', 'Father', 'Authority', 'Vitality', 'Government'],
  Mo: ['Mind · Manas', 'Mother', 'Emotions', 'Intuition', 'Public'],
  Ma: ['Energy · Tejas', 'Courage', 'Siblings', 'Land', 'Warrior'],
  Me: ['Intellect · Buddhi', 'Speech', 'Commerce', 'Mathematics', 'Youth'],
  Ju: ['Wisdom · Jñāna', 'Children', 'Dharma', 'Guru', 'Expansion'],
  Ve: ['Beauty · Śṛṅgāra', 'Spouse', 'Luxury', 'Art', 'Desires'],
  Sa: ['Karma · Kāla', 'Longevity', 'Service', 'Discipline', 'Masses'],
  Ra: ['Desire · Kāma', 'Foreign', 'Innovation', 'Obsession', 'Illusion'],
  Ke: ['Liberation · Mokṣa', 'Spirituality', 'Detachment', 'Past Lives', 'Research'],
}

// ── Tooltip content builder ───────────────────────────────────

export interface PlanetTooltipData {
  id: string
  name: string
  totalDeg: number
  isRetro?: boolean
  isCombust?: boolean
  dignity?: string
  nakshatraIndex?: number
  nakshatraName?: string
  pada?: number
  avastha?: { baladi?: string; jagradadi?: string }
  charaKaraka?: string
  shadbala?: { total: number; isStrong: boolean }
  house?: number
  gandanta?: any
  pushkara?: any
  mrityuBhaga?: any
  yuddha?: any
}



export function PlanetTooltipCard({ planet, x, y, onClose }: { planet: PlanetTooltipData; x: number; y: number; onClose?: () => void }) {
  const id = planet.id as string
  const col = PLANET_COLORS[id] || PLANET_COLORS.Su
  const totalDeg = planet.totalDeg || 0
  const rashiBase = Math.floor(totalDeg / 30)
  const rashiNum = (rashiBase % 12 + 1) as Rashi
  const degInSign = totalDeg % 30
  const nakIdx = planet.nakshatraIndex ?? Math.floor(totalDeg / (360 / 27)) % 27

  const signInterp = SIGN_INTERPRETATIONS[id]?.[rashiNum]
  const nakInterp = NAKSHATRA_INTERPRETATIONS[nakIdx]
  const dignityInterp = DIGNITY_INTERPRETATIONS[planet.dignity || 'neutral']
  const dignityColor = DIGNITY_COLORS[planet.dignity || 'neutral'] || '#94a3b8'
  const keywords = KEYWORD_MAP[id] || []

  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const TOOLTIP_W = isMobile ? Math.min(window.innerWidth - 32, 340) : 310
  
  // Positioning logic
  let left = x + 14
  let top = y - 20

  if (isMobile) {
    // On mobile, center at the bottom or top depending on tap Y
    left = (window.innerWidth - TOOLTIP_W) / 2
    top = y > window.innerHeight / 2 ? y - 420 : y + 40
    // Clamp
    top = Math.max(10, Math.min(top, window.innerHeight - 450))
  } else {
    if (left + TOOLTIP_W > window.innerWidth - 12) {
      left = x - TOOLTIP_W - 14
    }
    top = Math.max(10, Math.min(top, window.innerHeight - 480))
  }

  if (typeof document === 'undefined' || !document.body) {
    return null
  }

  return createPortal(
    <div 
      onClick={(e) => isMobile && e.stopPropagation()}
      style={{
        position: 'fixed', left, top, zIndex: 100000, 
        pointerEvents: isMobile ? 'auto' : 'none', 
        width: TOOLTIP_W,
        maxHeight: '85vh',
        overflowY: 'auto',
        background: 'linear-gradient(160deg, var(--surface-2, #1e1e35) 0%, var(--surface-1, #16162a) 100%)',
        border: `1px solid ${col.primary}44`, borderRadius: 14,
        boxShadow: `0 20px 60px rgba(0,0,0,0.6), 0 0 40px ${col.glow}`,
        fontFamily: 'var(--font-body, Inter, sans-serif)', fontSize: '0.78rem',
        animation: 'gtTip 0.2s cubic-bezier(0.16,1,0.3,1)',
        scrollbarWidth: 'none',
      }}>
      <style>{`
        @keyframes gtTip{from{opacity:0;transform:translateY(10px) scale(0.96)}to{opacity:1;transform:none}}
        div::-webkit-scrollbar { display: none; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ padding: '0.9rem 1rem 0.8rem', background: col.bg, borderBottom: `1px solid ${col.primary}22`, display: 'flex', alignItems: 'center', gap: '0.75rem', position: 'relative' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: `radial-gradient(circle at 30% 30%, ${col.primary}33, ${col.primary}11)`, border: `2px solid ${col.primary}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', color: col.primary, boxShadow: `0 0 14px ${col.glow}`, flexShrink: 0 }}>
          {PLANET_SYMBOLS[id] || '✦'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: col.primary }}>{GRAHA_NAMES[id as GrahaId] || planet.name}</span>
            <span style={{ fontSize: '0.6rem', color: col.primary, opacity: 0.65, fontStyle: 'italic' }}>{PLANET_VEDIC[id]}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.15rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #bbb5d8)' }}>{RASHI_NAMES[rashiNum]} · {Math.floor(degInSign)}°{Math.floor((degInSign % 1) * 60)}′</span>
            {planet.dignity && <span style={{ fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', color: dignityColor, background: `${dignityColor}18`, padding: '1px 5px', borderRadius: 3, border: `1px solid ${dignityColor}33` }}>{planet.dignity.replace('_', ' ')}</span>}
            {planet.isRetro && <span style={{ fontSize: '0.58rem', fontWeight: 700, color: '#f87171', background: 'rgba(248,113,113,0.12)', padding: '1px 5px', borderRadius: 3, border: '1px solid rgba(248,113,113,0.3)' }}>℞ Retro</span>}
            {planet.isCombust && <span style={{ fontSize: '0.58rem', fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.12)', padding: '1px 5px', borderRadius: 3, border: '1px solid rgba(245,158,11,0.3)' }}>☉ Combust</span>}
          </div>
        </div>
        {isMobile && (
          <button 
            onClick={(e) => { e.stopPropagation(); onClose?.(); }}
            style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}
          >
            ✕
          </button>
        )}
      </div>

      {/* ── Special Conditions ── */}
      {(planet.gandanta?.isGandanta || planet.pushkara?.isPushkara || planet.mrityuBhaga?.isMrityuBhaga || planet.yuddha?.isWarring) && (
        <div style={{ padding: '0.6rem 1rem 0.4rem', borderBottom: '1px solid var(--border-soft, rgba(201,168,76,0.07))', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {planet.gandanta?.isGandanta && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.6rem', background: 'rgba(244,63,94,0.1)', color: '#fb7185', padding: '1px 5px', borderRadius: 4, border: '1px solid rgba(244,63,94,0.3)', fontWeight: 700 }}>⚠ GANDANTA</span>
              <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>{planet.gandanta.type?.replace('-', ' ')}</span>
            </div>
          )}
          {planet.pushkara?.isPushkara && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.6rem', background: 'rgba(78,205,196,0.1)', color: 'var(--teal)', padding: '1px 5px', borderRadius: 4, border: '1px solid rgba(78,205,196,0.3)', fontWeight: 700 }}>✦ PUSHKARA</span>
              <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>{planet.pushkara.type?.replace('_', ' ')}</span>
            </div>
          )}
          {planet.mrityuBhaga?.isMrityuBhaga && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.6rem', background: 'rgba(251,146,60,0.1)', color: '#fb923c', padding: '1px 5px', borderRadius: 4, border: '1px solid rgba(251,146,60,0.3)', fontWeight: 700 }}>🔱 MRITYU BHAGA</span>
              <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>{planet.mrityuBhaga.severity} severity</span>
            </div>
          )}
          {planet.yuddha?.isWarring && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.6rem', background: 'rgba(129,140,248,0.12)', color: '#818cf8', padding: '1px 5px', borderRadius: 4, border: '1px solid rgba(129,140,248,0.35)', fontWeight: 700 }}>⚔ YUDDHA</span>
              <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>{planet.yuddha.degreeDifference.toFixed(2)}° orb check (≤ {planet.yuddha.orb}°)</span>
            </div>
          )}
        </div>
      )}

      {/* ── Nakshatra Band ── */}
      <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid var(--border-soft, rgba(201,168,76,0.07))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '0.55rem', textTransform: 'uppercase', color: 'var(--text-muted, #7a7498)', letterSpacing: '0.06em', marginBottom: '0.1rem' }}>Nakshatra</div>
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-gold, #e2c97e)' }}>{planet.nakshatraName || NAKSHATRA_NAMES[nakIdx]} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>P{planet.pada}</span></div>
        </div>
        {planet.charaKaraka && <div style={{ textAlign: 'right' }}><div style={{ fontSize: '0.55rem', textTransform: 'uppercase', color: 'var(--text-muted, #7a7498)' }}>Karaka</div><div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--gold, #c9a84c)' }}>{planet.charaKaraka}</div></div>}
      </div>

      {/* ── Significations ── */}
      {keywords.length > 0 && (
        <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid var(--border-soft, rgba(201,168,76,0.07))' }}>
          <div style={{ fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted, #7a7498)', marginBottom: '0.3rem' }}>Significations</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
            {keywords.map(k => <span key={k} style={{ fontSize: '0.62rem', padding: '1px 6px', borderRadius: 99, background: col.bg, color: col.primary, border: `1px solid ${col.primary}33` }}>{k}</span>)}
          </div>
        </div>
      )}

      {/* ── Interpretation ── */}
      {(signInterp || nakInterp) && (
        <div style={{ padding: '0.6rem 1rem', borderBottom: '1px solid var(--border-soft, rgba(201,168,76,0.07))' }}>
          <div style={{ fontSize: '0.55rem', textTransform: 'uppercase', color: 'var(--text-muted, #7a7498)', marginBottom: '0.3rem' }}>{id} in {RASHI_NAMES[rashiNum]}</div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary, #bbb5d8)', lineHeight: 1.55, margin: 0, fontStyle: 'italic' }}>{signInterp || nakInterp}</p>
        </div>
      )}

      {/* ── Aspects ── */}
      {planet.house && (
        <div style={{ padding: '0.6rem 1rem', borderBottom: '1px solid var(--border-soft, rgba(201,168,76,0.07))' }}>
          <div style={{ fontSize: '0.55rem', textTransform: 'uppercase', color: 'var(--text-muted, #7a7498)', marginBottom: '0.35rem', letterSpacing: '0.05em' }}>Planetary Aspects (Dṛṣṭi)</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {getAspectedHouses(id as GrahaId, planet.house).map((h, i) => {
              const rawAspect = GRAHA_ASPECTS[id as GrahaId]?.[i] || 7
              const desc = getAspectDescription(rawAspect)
              return (
                <div key={h} style={{ flex: '1 1 45%', minWidth: '100px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <div style={{ width: 18, height: 18, borderRadius: 4, background: `${col.primary}18`, color: col.primary, border: `1px solid ${col.primary}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800 }}>{h}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{desc}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Dignity Note ── */}
      {dignityInterp && planet.dignity && planet.dignity !== 'neutral' && (
        <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid var(--border-soft, rgba(201,168,76,0.07))' }}>
          <div style={{ fontSize: '0.55rem', textTransform: 'uppercase', color: dignityColor, marginBottom: '0.2rem' }}>Dignity: {planet.dignity?.replace('_', ' ')}</div>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary, #bbb5d8)', lineHeight: 1.5, margin: 0 }}>{dignityInterp}</p>
        </div>
      )}

      {/* ── Footer ── */}
      <div style={{ padding: '0.5rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {planet.avastha && (
          <div>
            <div style={{ fontSize: '0.52rem', textTransform: 'uppercase', color: 'var(--text-muted, #7a7498)' }}>Avastha</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-primary, #f0ecff)', fontWeight: 500 }}>{planet.avastha.baladi} · {planet.avastha.jagradadi}</div>
          </div>
        )}
        {planet.shadbala && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.52rem', textTransform: 'uppercase', color: 'var(--text-muted, #7a7498)' }}>Shadbala</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: planet.shadbala.isStrong ? '#4ade80' : '#f87171' }}>{planet.shadbala.total.toFixed(1)} <span style={{ fontSize: '0.55rem' }}>Rupas</span></div>
          </div>
        )}
      </div>

      <div style={{ padding: '0.3rem 1rem 0.5rem', textAlign: 'center' }}>
        <span style={{ fontSize: '0.58rem', color: 'var(--text-muted, #7a7498)' }}>
          {isMobile ? 'Tap close to dismiss' : 'Hover for analytical details'}
        </span>
      </div>
    </div>,
    document.body
  )
}

// ── Main exported wrapper ─────────────────────────────────────

interface PlanetHoverTooltipProps {
  planet: PlanetTooltipData
  children: React.ReactNode
  disabled?: boolean
}

export function PlanetHoverTooltip({ planet, children, disabled = false }: PlanetHoverTooltipProps) {
  const [visible, setVisible] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [mounted, setMounted] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const triggerRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setMounted(true) }, [])

  const show = useCallback((clientX: number, clientY: number) => {
    if (disabled) return
    if (timerRef.current) clearTimeout(timerRef.current)
    
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    const delay = isTouch ? 0 : 220

    timerRef.current = setTimeout(() => {
      setPos({ x: clientX, y: clientY })
      setVisible(true)
    }, delay)
  }, [disabled])

  const hide = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setVisible(false)
  }, [])

  const handleMouseEnter = (e: React.MouseEvent) => show(e.clientX, e.clientY)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (visible) {
      hide()
    } else {
      show(e.touches[0].clientX, e.touches[0].clientY)
    }
  }

  useEffect(() => {
    const handleClickOutside = (e: Event) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        hide()
      }
    }
    if (visible) {
      window.addEventListener('mousedown', handleClickOutside)
      window.addEventListener('touchstart', handleClickOutside)
    }
    return () => {
      window.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('touchstart', handleClickOutside)
    }
  }, [visible, hide])

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={hide}
        onTouchStart={handleTouchStart}
        style={{ display: 'inline-flex', flexDirection: 'column', width: 'fit-content', maxWidth: '100%' }}
      >
        {children}
      </div>

      {mounted && visible && (
        <PlanetTooltipCard 
          planet={planet as PlanetTooltipData} 
          x={pos.x} y={pos.y} 
          onClose={hide}
        />
      )}
    </>
  )
}

