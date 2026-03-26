'use client'
import React from 'react'
import type { YogiPointResult, GrahaId } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES, RASHI_SHORT } from '@/types/astrology'

// ─────────────────────────────────────────────────────────────
//  YogiPointPanel.tsx
//  Displays Yogi Point, Sahayogi, Avayogi for prosperity analysis
// ─────────────────────────────────────────────────────────────

interface YogiPointPanelProps {
  yogiPoint: YogiPointResult
  grahas?: Array<{ id: string; lonSidereal: number; name: string }>
}

const COLORS = {
  yogi: { bg: 'rgba(78,205,196,0.12)', border: 'rgba(78,205,196,0.4)', text: 'var(--teal)', accent: '#34d399' },
  sahayogi: { bg: 'rgba(129,140,248,0.12)', border: 'rgba(129,140,248,0.4)', text: '#818cf8', accent: '#a5b4fc' },
  avayogi: { bg: 'rgba(224,123,142,0.12)', border: 'rgba(224,123,142,0.4)', text: 'var(--rose)', accent: '#fca5a5' },
}

// Format longitude to sign + degree
function formatLon(lon: number) {
  const normalized = ((lon % 360) + 360) % 360
  const sign = Math.floor(normalized / 30) + 1 as 1|2|3|4|5|6|7|8|9|10|11|12
  const deg = normalized % 30
  return {
    sign,
    signName: RASHI_NAMES[sign],
    signShort: RASHI_SHORT[sign],
    degree: deg,
    display: `${RASHI_SHORT[sign]} ${deg.toFixed(2)}°`,
  }
}

// Check if planet is conjunct a point
function isConjunct(planetLon: number, pointLon: number, orb: number = 5): boolean {
  let diff = Math.abs(planetLon - pointLon) % 360
  if (diff > 180) diff = 360 - diff
  return diff <= orb
}

export function YogiPointPanel({ yogiPoint, grahas = [] }: YogiPointPanelProps) {
  const yogi = formatLon(yogiPoint.yogiPoint)
  const sahayogi = formatLon(yogiPoint.sahayogiPoint)
  const avayogi = formatLon(yogiPoint.avayogiPoint)
  
  // Find planets conjunct each point
  const conjunctYogi = grahas.filter(g => isConjunct(g.lonSidereal, yogiPoint.yogiPoint))
  const conjunctSahayogi = grahas.filter(g => isConjunct(g.lonSidereal, yogiPoint.sahayogiPoint))
  const conjunctAvayogi = grahas.filter(g => isConjunct(g.lonSidereal, yogiPoint.avayogiPoint))
  
  return (
    <div className="card" style={{ 
      padding: '1rem', 
      background: 'var(--surface-2)', 
      border: '1px solid var(--border-soft)',
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: '1rem',
        paddingBottom: '0.75rem',
        borderBottom: '1px solid var(--border-soft)',
      }}>
        <div>
          <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-gold)' }}>
            Yogi Point System
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Wealth & Prosperity Analysis
          </div>
        </div>
        <div style={{ 
          fontSize: '1.5rem', 
          color: 'var(--gold)',
          opacity: 0.8,
        }}>
          ₹
        </div>
      </div>
      
      {/* Three Points Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
        {/* Yogi Point */}
        <div style={{
          padding: '0.75rem',
          background: COLORS.yogi.bg,
          border: `1px solid ${COLORS.yogi.border}`,
          borderRadius: 'var(--r-md)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '0.6rem', fontWeight: 700, color: COLORS.yogi.text, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Yogi Point
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.5rem' }}>
            {yogi.display}
          </div>
          <div style={{ fontSize: '0.7rem', color: COLORS.yogi.text, marginTop: '0.35rem' }}>
            Lord: <strong>{GRAHA_NAMES[yogiPoint.yogiGraha]}</strong>
          </div>
          {conjunctYogi.length > 0 && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
              Conjunct: {conjunctYogi.map(g => g.name).join(', ')}
            </div>
          )}
        </div>
        
        {/* Sahayogi Point */}
        <div style={{
          padding: '0.75rem',
          background: COLORS.sahayogi.bg,
          border: `1px solid ${COLORS.sahayogi.border}`,
          borderRadius: 'var(--r-md)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '0.6rem', fontWeight: 700, color: COLORS.sahayogi.text, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Sahayogi
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.5rem' }}>
            {sahayogi.display}
          </div>
          <div style={{ fontSize: '0.7rem', color: COLORS.sahayogi.text, marginTop: '0.35rem' }}>
            Lord: <strong>{GRAHA_NAMES[yogiPoint.sahayogiGraha]}</strong>
          </div>
          {conjunctSahayogi.length > 0 && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
              Conjunct: {conjunctSahayogi.map(g => g.name).join(', ')}
            </div>
          )}
        </div>
        
        {/* Avayogi Point */}
        <div style={{
          padding: '0.75rem',
          background: COLORS.avayogi.bg,
          border: `1px solid ${COLORS.avayogi.border}`,
          borderRadius: 'var(--r-md)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '0.6rem', fontWeight: 700, color: COLORS.avayogi.text, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Avayogi
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.5rem' }}>
            {avayogi.display}
          </div>
          <div style={{ fontSize: '0.7rem', color: COLORS.avayogi.text, marginTop: '0.35rem' }}>
            Lord: <strong>{GRAHA_NAMES[yogiPoint.avayogiGraha]}</strong>
          </div>
          {conjunctAvayogi.length > 0 && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
              Conjunct: {conjunctAvayogi.map(g => g.name).join(', ')}
            </div>
          )}
        </div>
      </div>
      
      {/* Interpretation */}
      <div style={{ 
        marginTop: '1rem', 
        padding: '0.75rem', 
        background: 'var(--surface-1)', 
        borderRadius: 'var(--r-sm)',
        border: '1px solid var(--border-soft)',
      }}>
        <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
          Interpretation
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
          <p style={{ margin: '0 0 0.5rem 0' }}>
            <strong style={{ color: COLORS.yogi.text }}>Yogi:</strong> {yogiPoint.interpretation.yogi}
          </p>
          <p style={{ margin: '0 0 0.5rem 0' }}>
            <strong style={{ color: COLORS.sahayogi.text }}>Sahayogi:</strong> {yogiPoint.interpretation.sahayogi}
          </p>
          <p style={{ margin: '0 0 0.5rem 0' }}>
            <strong style={{ color: COLORS.avayogi.text }}>Avayogi:</strong> {yogiPoint.interpretation.avayogi}
          </p>
        </div>
      </div>
      
      {/* Remedy */}
      <div style={{ 
        marginTop: '0.75rem', 
        padding: '0.5rem 0.75rem', 
        background: 'rgba(245,158,66,0.08)', 
        borderRadius: 'var(--r-sm)',
        borderLeft: '3px solid var(--amber)',
      }}>
        <div style={{ fontSize: '0.65rem', color: 'var(--amber)', fontWeight: 600 }}>
          💡 Remedy: {yogiPoint.remedy}
        </div>
      </div>
    </div>
  )
}

// Export a compact version for sidebars
export function YogiPointCompact({ yogiPoint }: { yogiPoint: YogiPointResult }) {
  const yogi = formatLon(yogiPoint.yogiPoint)
  
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '0.75rem',
      padding: '0.5rem 0.75rem',
      background: 'var(--surface-2)',
      borderRadius: 'var(--r-sm)',
      border: '1px solid var(--border-soft)',
    }}>
      <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Yogi</span>
      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: COLORS.yogi.text }}>
        {yogi.display}
      </span>
      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
        ({GRAHA_NAMES[yogiPoint.yogiGraha]})
      </span>
    </div>
  )
}
