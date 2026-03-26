'use client'

import React from 'react'
import type { ChartInterpretation, InterpretationInsight } from '@/types/astrology'

interface InterpretationPanelProps {
  interpretation: ChartInterpretation
}

function toneStyles(tone: InterpretationInsight['tone']) {
  if (tone === 'supportive') {
    return { bg: 'rgba(78,205,196,0.12)', border: 'rgba(78,205,196,0.35)', text: 'var(--teal)' }
  }
  if (tone === 'caution') {
    return { bg: 'rgba(224,123,142,0.14)', border: 'rgba(224,123,142,0.35)', text: 'var(--rose)' }
  }
  return { bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.35)', text: '#a78bfa' }
}

export function InterpretationPanel({ interpretation }: InterpretationPanelProps) {
  return (
    <div className="card" style={{ padding: '1rem', background: 'var(--surface-2)', border: '1px solid var(--border-soft)' }}>
      <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-gold)', marginBottom: '0.5rem' }}>
        Interpretation Layer
      </div>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.9rem' }}>
        {interpretation.headline}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
        {interpretation.topInsights.map((insight) => {
          const color = toneStyles(insight.tone)
          return (
            <div
              key={insight.id}
              style={{
                border: `1px solid ${color.border}`,
                background: color.bg,
                borderRadius: 'var(--r-sm)',
                padding: '0.7rem 0.75rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>{insight.title}</div>
                <div style={{ fontSize: '0.58rem', color: color.text, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {insight.category}
                </div>
              </div>
              <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                {insight.message}
              </div>
              {insight.actions?.length ? (
                <div style={{ marginTop: '0.45rem', fontSize: '0.66rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Practical Actions:</span> {insight.actions.join(' · ')}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
