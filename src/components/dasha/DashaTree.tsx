'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/dasha/DashaTree.tsx
//  Dasha Timeline — Redesigned for a High-End Jyotish Workstation
//  • High-density grid-based layout
//  • Tiered navigation (Hierarchical Breadcrumbs)
//  • Precision time-segments with progress indicators
// ─────────────────────────────────────────────────────────────

import React, { useState, useMemo, useEffect } from 'react'
import type { DashaNode } from '@/types/astrology'

const GRAHA_NAME: Record<string, string> = {
  Su: 'Sun',  Mo: 'Moon',  Ma: 'Mars', Me: 'Mercury',
  Ju: 'Jupiter', Ve: 'Venus', Sa: 'Saturn', Ra: 'Rahu', Ke: 'Ketu',
  // Chara Dasha names (Signs)
  Ar: 'Aries', Ta: 'Taurus', Ge: 'Gemini', Cn: 'Cancer',
  Le: 'Leo', Vi: 'Virgo', Li: 'Libra', Sc: 'Scorpio',
  Sg: 'Sagittarius', Cp: 'Capricorn', Aq: 'Aquarius', Pi: 'Pisces'
}

const GRAHA_COLOR: Record<string, string> = {
  Su: '#F59E0B', Mo: '#60A5FA', Ma: '#EF4444', 
  Me: '#10B981', Ju: '#FACC15', Ve: '#EC4899', 
  Sa: '#6366F1', Ra: '#8B5CF6', Ke: '#F97316',
  // Signs (Chara)
  Ar: '#EF4444', Ta: '#10B981', Ge: '#60A5FA', Cn: '#9CA3AF',
  Le: '#F59E0B', Vi: '#10B981', Li: '#EC4899', Sc: '#EF4444',
  Sg: '#FACC15', Cp: '#6366F1', Aq: '#6366F1', Pi: '#FACC15'
}

// ── Helpers ──────────────────────────────────────────────────

function toDate(d: Date | string): Date {
  return d instanceof Date ? d : new Date(d)
}

function fmtDate(d: Date | string, compact = false) {
  const date = toDate(d)
  return date.toLocaleDateString('en-IN', { 
    day: '2-digit', 
    month: compact ? 'short' : 'long', 
    year: 'numeric'
  })
}

function calculateProgress(start: Date | string, end: Date | string): number {
  const s = toDate(start).getTime()
  const e = toDate(end).getTime()
  const now = Date.now()
  if (now < s) return 0
  if (now > e) return 100
  return Math.max(0, Math.min(100, ((now - s) / (e - s)) * 100))
}

// ── Sub-components ───────────────────────────────────────────

function DashaLevelBadge({ depth }: { depth: number }) {
  const labels = ['MD', 'AD', 'PD', 'SD', 'PrA']
  const names = ['Mahā', 'Antar', 'Pratyantar', 'Sūkshma', 'Prāṇa']
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <span style={{ 
        fontSize: '0.6rem', 
        fontWeight: 700, 
        background: 'var(--surface-3)', 
        color: 'var(--text-muted)',
        padding: '1px 4px',
        borderRadius: '3px',
        border: '1px solid var(--border-soft)'
      }}>
        {labels[depth - 1]}
      </span>
      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {names[depth - 1]}
      </span>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────

export function DashaTree({ nodes, birthDate }: { nodes: DashaNode[]; birthDate: Date }) {
  // Navigation state
  const [activePath, setActivePath] = useState<DashaNode[]>([])
  
  // Find current active path on mount or if nodes change
  useEffect(() => {
    const path: DashaNode[] = []
    let current = nodes.find(n => n.isCurrent)
    while (current) {
      path.push(current)
      current = current.children.find(c => c.isCurrent)
    }
    setActivePath(path)
  }, [nodes])

  // Get current list based on path
  const currentList = useMemo(() => {
    if (activePath.length === 0) return nodes
    const last = activePath[activePath.length - 1]
    return last.children.length > 0 ? last.children : [last]
  }, [nodes, activePath])

  const currentLevel = activePath.length + 1
  const isViewingDeepest = currentList.length === 1 && currentList[0] === activePath[activePath.length - 1]

  const handleNavigate = (node: DashaNode, depth: number) => {
    // If we click on a breadcrumb
    if (depth < activePath.length) {
      setActivePath(activePath.slice(0, depth + 1))
      return
    }
    // If we click on a row to go deeper
    if (node.children && node.children.length > 0) {
      setActivePath([...activePath, node])
    }
  }

  const handleBack = () => {
    setActivePath(activePath.slice(0, -1))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* ── Header: Active Dasha Hero ────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, var(--surface-2) 0%, var(--surface-1) 100%)',
        borderRadius: 'var(--r-md)',
        border: '1px solid var(--border-soft)',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-soft)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <div className="label-caps" style={{ color: 'var(--gold)', fontSize: '0.65rem', marginBottom: '0.5rem' }}>Current Timeline Perspective</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {activePath.length === 0 ? (
                  <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 600 }}>Mahādashā Cycle</h2>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                    <button 
                      onClick={() => setActivePath([])}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem', padding: 0 }}
                    >All</button>
                    {activePath.map((node, i) => (
                      <React.Fragment key={i}>
                        <span style={{ color: 'var(--border-bright)', fontSize: '0.8rem' }}>/</span>
                        <button 
                          onClick={() => handleNavigate(node, i)}
                          style={{ 
                            background: 'transparent', border: 'none', 
                            color: i === activePath.length - 1 ? 'var(--text-primary)' : 'var(--text-muted)', 
                            fontWeight: i === activePath.length - 1 ? 600 : 400,
                            cursor: 'pointer', fontSize: '0.9rem', padding: 0,
                            fontFamily: 'var(--font-display)'
                          }}
                        >
                          {node.label || GRAHA_NAME[node.lord]}
                        </button>
                      </React.Fragment>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {activePath.length > 0 && (
              <button 
                onClick={handleBack}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}
              >
                ← Back
              </button>
            )}
          </div>

          {/* Progress Overview for the current focused node */}
          {activePath.length > 0 && (
            <div style={{ marginTop: '0.5rem' }}>
              {(() => {
                const node = activePath[activePath.length - 1]
                const progress = calculateProgress(node.start, node.end)
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{fmtDate(node.start, true)}</span>
                      <span style={{ color: 'var(--gold)', fontWeight: 600 }}>{progress.toFixed(1)}% Completed</span>
                      <span style={{ color: 'var(--text-muted)' }}>{fmtDate(node.end, true)}</span>
                    </div>
                    <div style={{ height: 4, background: 'var(--surface-3)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ 
                        height: '100%', 
                        width: `${progress}%`, 
                        background: `linear-gradient(90deg, ${GRAHA_COLOR[node.lord]} 0%, var(--gold) 100%)`,
                        transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1)',
                        boxShadow: `0 0 10px ${GRAHA_COLOR[node.lord]}66`
                      }} />
                    </div>
                  </div>
                )
              })()}
            </div>
          )}
        </div>
      </div>

      {/* ── Table: High-Density Dasha List ───────────────────── */}
      <div style={{ 
        background: 'var(--surface-1)', 
        borderRadius: '8px', 
        border: '1px solid var(--border-soft)',
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.5fr 1.2fr 1.2fr 0.8fr',
          padding: '0.75rem 1rem',
          background: 'var(--surface-2)',
          borderBottom: '1px solid var(--border-soft)',
          fontSize: '0.65rem',
          fontWeight: 700,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em'
        }}>
          <div>Lord & Period</div>
          <div>Start Date</div>
          <div>End Date</div>
          <div style={{ textAlign: 'right' }}>Status</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '500px', overflowY: 'auto' }}>
          {currentList.map((node, idx) => {
            const isActive = node.isCurrent
            const hasChildren = node.children && node.children.length > 0
            const progress = calculateProgress(node.start, node.end)
            const isCompleted = progress >= 100
            const isFuture = progress <= 0 && !isActive

            return (
              <div 
                key={`${node.lord}-${node.start}-${idx}`}
                onClick={() => hasChildren && handleNavigate(node, activePath.length)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.5fr 1.2fr 1.2fr 0.8fr',
                  padding: '0.85rem 1rem',
                  alignItems: 'center',
                  borderBottom: '1px solid var(--border-soft)',
                  background: isActive ? 'rgba(201,168,76,0.05)' : 'transparent',
                  cursor: hasChildren ? 'pointer' : 'default',
                  transition: 'background 0.2s',
                  position: 'relative'
                }}
                onMouseEnter={e => !isActive && (e.currentTarget.style.background = 'var(--surface-2)')}
                onMouseLeave={e => !isActive && (e.currentTarget.style.background = 'transparent')}
              >
                {/* Visual indicator for active row */}
                {isActive && (
                  <div style={{ 
                    position: 'absolute', left: 0, top: '20%', bottom: '20%', 
                    width: 3, background: 'var(--gold)', borderRadius: '0 2px 2px 0' 
                  }} />
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ 
                    width: 32, height: 32, borderRadius: '6px', 
                    background: `${GRAHA_COLOR[node.lord]}15`,
                    border: `1px solid ${GRAHA_COLOR[node.lord]}44`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 600,
                    color: GRAHA_COLOR[node.lord]
                  }}>
                    {node.lord}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ 
                      fontSize: '0.95rem', 
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontFamily: 'var(--font-display)'
                    }}>
                      {node.label || GRAHA_NAME[node.lord]}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <DashaLevelBadge depth={currentLevel} />
                      {hasChildren && <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>• {node.children.length} sub-periods</span>}
                    </div>
                  </div>
                </div>

                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {fmtDate(node.start, true)}
                </div>

                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {fmtDate(node.end, true)}
                </div>

                <div style={{ textAlign: 'right' }}>
                  {isActive ? (
                    <span style={{ 
                      fontSize: '0.65rem', fontWeight: 700, color: 'var(--gold)',
                      background: 'rgba(201,168,76,0.1)', padding: '2px 6px', borderRadius: '4px',
                      textTransform: 'uppercase', border: '1px solid rgba(201,168,76,0.2)'
                    }}>Active</span>
                  ) : isCompleted ? (
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', opacity: 0.6 }}>Elapsed</span>
                  ) : (
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Upcoming</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Footer: Cycle Info ──────────────────────────────── */}
      <div style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0.75rem 1rem', background: 'var(--surface-2)', borderRadius: '6px',
        fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic'
      }}>
        <span>Cycle start: {fmtDate(nodes[0].start)}</span>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gold)' }} />
              <span>Present Moment</span>
           </div>
        </div>
      </div>

    </div>
  )
}

