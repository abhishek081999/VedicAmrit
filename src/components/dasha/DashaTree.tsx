'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/dasha/DashaTree.tsx
//  Vimshottari Dasha tree — Optimized for readability and professional aesthetics
//  • High-contrast active dasha highlighting
//  • Compact nested levels to prevent vertical bloat
//  • Timeline-style visual cues
// ─────────────────────────────────────────────────────────────

import React, { useState, useMemo } from 'react'
import type { DashaNode } from '@/types/astrology'

const GRAHA_NAME: Record<string, string> = {
  Su: 'Sun',  Mo: 'Moon',  Ma: 'Mars', Me: 'Mercury',
  Ju: 'Jupiter', Ve: 'Venus', Sa: 'Saturn', Ra: 'Rahu', Ke: 'Ketu',
}

const GRAHA_COLOR: Record<string, string> = {
  Su: '#F59E0B', Mo: '#60A5FA', Ma: '#EF4444', 
  Me: '#10B981', Ju: '#FACC15', Ve: '#EC4899', 
  Sa: '#6366F1', Ra: '#8B5CF6', Ke: '#F97316',
}

// ── Helpers ──────────────────────────────────────────────────

function toDate(d: Date | string): Date {
  return d instanceof Date ? d : new Date(d)
}

function fmt(d: Date | string) {
  const date = toDate(d)
  return date.toLocaleDateString('en-GB', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric'
  })
}

function fmtTime(d: Date | string) {
  return toDate(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

// ── Dasha row (Collapsible Tree Node) ────────────────────────

function DashaRow({
  node,
  depth,
  isLast,
  maxVisibleDepth,
  path = []
}: {
  key?: string
  node: DashaNode
  depth: number
  isLast: boolean
  maxVisibleDepth: number
  path?: string[]
}) {
  const [open, setOpen] = useState(node.isCurrent)
  const hasChildren = node.children.length > 0 && depth < maxVisibleDepth
  const isCur = node.isCurrent
  
  const currentPath = [...path, node.lord]

  // Visual variants based on depth
  const isMD = depth === 1
  const isAD = depth === 2

  return (
    <div style={{ position: 'relative', marginLeft: depth === 1 ? 0 : '1.25rem' }}>
      
      {/* Connector lines for nested items */}
      {!isMD && (
        <div style={{
          position: 'absolute', left: '-0.75rem', top: 0, bottom: isLast ? '50%' : '100%',
          width: '1px', background: 'var(--border-soft)'
        }} />
      )}
      {!isMD && (
        <div style={{
          position: 'absolute', left: '-0.75rem', top: '50%', width: '0.5rem',
          height: '1px', background: 'var(--border-soft)'
        }} />
      )}

      {/* Row Body */}
      <div 
        onClick={() => hasChildren && setOpen(!open)}
        style={{
          display: 'flex', flexDirection: 'column',
          padding: isMD ? '0.75rem 1rem' : '0.4rem 0.75rem',
          marginBottom: isMD ? '0.75rem' : '0.25rem',
          background: isCur ? (isMD ? 'var(--gold-faint)' : 'rgba(201,168,76,0.06)') : 'transparent',
          border: `1px solid ${isCur ? 'var(--gold)' : (isMD ? 'var(--border-soft)' : 'transparent')}`,
          borderRadius: 'var(--r-md)',
          cursor: hasChildren ? 'pointer' : 'default',
          transition: 'all 0.15s ease',
          boxShadow: isCur && isMD ? '0 4px 12px rgba(201,168,76,0.1)' : 'none',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {hasChildren && (
              <span style={{ fontSize: '0.65rem', opacity: 0.5, transition: 'transform 0.2s', transform: open ? 'rotate(90deg)' : 'rotate(0)' }}>
                ▶
              </span>
            )}
            <span style={{ 
              fontFamily: 'var(--font-display)', 
              fontSize: isMD ? '1.15rem' : '0.92rem',
              fontWeight: isCur ? 600 : 400,
              color: isCur ? 'var(--text-primary)' : 'var(--text-secondary)'
            }}>
              <span style={{ color: GRAHA_COLOR[node.lord] || 'inherit', marginRight: 4 }}>●</span>
              {GRAHA_NAME[node.lord]} 
              <span style={{ fontSize: '0.74em', color: 'var(--text-muted)', marginLeft: 8, fontFamily: 'var(--font-mono)', opacity: 0.8 }}>
                ({currentPath.join(' ')})
              </span>
              <span style={{ fontSize: '0.7em', color: 'var(--text-muted)', marginLeft: 6, fontWeight: 400, opacity: 0.7 }}>
                {isMD ? 'Mahā' : isAD ? 'Antar' : depth === 3 ? 'Praty' : depth === 4 ? 'Sūkshma' : 'Prāṇa'}
              </span>
            </span>
            {isCur && (
              <span style={{ 
                fontSize: '0.62rem', 
                background: GRAHA_COLOR[node.lord] || 'var(--gold)', 
                color: '#fff', 
                padding: '1px 5px', borderRadius: 4, letterSpacing: '0.05em', fontWeight: 700 
              }}>
                NOW
              </span>
            )}
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ 
              fontFamily: 'var(--font-mono)', fontSize: isMD ? '0.82rem' : '0.75rem', 
              color: isCur ? 'var(--text-primary)' : 'var(--text-muted)' 
            }}>
              {fmt(node.start)}
            </div>
            {isMD && (
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 1 }}>
                Starts at {fmtTime(node.start)}
              </div>
            )}
          </div>
        </div>

        {/* Progress bar for MD only */}
        {isCur && isMD && (
          <div style={{ marginTop: '0.75rem' }}>
            <div style={{ height: 3, background: 'var(--border-soft)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ 
                height: '100%', width: '45%', background: 'var(--gold)', 
                borderRadius: 2, boxShadow: '0 0 8px rgba(201,168,76,0.4)' 
              }} />
            </div>
          </div>
        )}
      </div>

      {/* Children rendering */}
      {hasChildren && open && (
        <div style={{ 
          marginTop: '0.25rem', marginBottom: isMD ? '1.5rem' : '0.5rem',
          paddingLeft: '0.5rem'
        }}>
          {node.children.map((child, idx) => (
            <DashaRow 
              key={`${child.lord}-${child.start}`}
              node={child} 
              depth={depth + 1} 
              isLast={idx === node.children.length - 1}
              maxVisibleDepth={maxVisibleDepth}
              path={currentPath}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────

export function DashaTree({ nodes }: { nodes: DashaNode[]; birthDate: Date }) {
  const [level, setLevel] = useState(2) // 1: MD, 2: AD, 3: PD
  
  const { currentActive, currentPath } = useMemo(() => {
    let focus: DashaNode | undefined = nodes.find(n => n.isCurrent)
    const path: string[] = []
    
    let depth = 1
    while(focus && depth < level) {
      path.push(focus.lord)
      const next = focus.children.find(c => c.isCurrent)
      if (!next) break
      focus = next
      depth++
    }
    return { currentActive: focus, currentPath: [...path, focus?.lord || ''] }
  }, [nodes, level])

  const levelName = level === 1 ? 'Mahādashā' : level === 2 ? 'Antardashā' : level === 3 ? 'Pratyantar' : level === 4 ? 'Sūkshma' : 'Prāṇa'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* ── Active Summary Card ────────────────────────────── */}
      {currentActive && (
        <div style={{
          padding: '1.25rem',
          background: 'var(--surface-2)',
          border: `1px solid ${GRAHA_COLOR[currentActive.lord] || 'var(--gold)'}`,
          borderRadius: 'var(--r-lg)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          boxShadow: `0 8px 24px ${GRAHA_COLOR[currentActive.lord]}22`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="label-caps" style={{ color: GRAHA_COLOR[currentActive.lord] || 'var(--gold)', marginBottom: '0.25rem' }}>Active {levelName}</div>
              <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 500 }}>
                {GRAHA_NAME[currentActive.lord]} 
                <span style={{ color: 'var(--text-muted)', fontSize: '0.7em', fontFamily: 'var(--font-mono)', marginLeft: 10, opacity: 0.8 }}>
                  ({currentPath.join(' ')})
                </span>
              </h2>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Ends On</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {fmt(currentActive.end)}
              </div>
            </div>
          </div>
          <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)', fontStyle: 'italic', fontFamily: 'Cormorant Garamond, serif' }}>
            Currently transiting the {levelName.toLowerCase()} of {GRAHA_NAME[currentActive.lord]}. 
            This layer provides the focus for {level < 3 ? 'major lifecycle events' : 'immediate daily/weekly trends'}.
          </p>
        </div>
      )}

      {/* ── List Controls ──────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-soft)', paddingBottom: '0.75rem' }}>
        <div className="label-caps" style={{ fontSize: '0.7rem' }}>Timeline Sequence</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Depth</span>
          <div style={{ display: 'flex', background: 'var(--surface-3)', borderRadius: 6, padding: 3, border: '1px solid var(--border-soft)' }}>
            {[1, 2, 3, 4, 5].map(l => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                style={{
                  padding: '0.2rem 0.6rem', background: level === l ? 'var(--gold)' : 'transparent',
                  color: level === l ? '#fff' : 'var(--text-muted)', border: 'none', borderRadius: 4,
                  fontSize: '0.68rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.1s'
                }}
              >
                {l === 1 ? 'MD' : l === 2 ? 'AD' : l === 3 ? 'PD' : l === 4 ? 'SD' : 'PrD'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── The Tree ───────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {nodes.map((n, idx) => (
          <DashaRow 
            key={`${n.lord}-${n.start}`} 
            node={n} 
            depth={1} 
            isLast={idx === nodes.length - 1} 
            maxVisibleDepth={level}
          />
        ))}
      </div>

      <div style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic', borderTop: '1px solid var(--border-soft)', paddingTop: '1rem' }}>
        Full Vimshottari cycle of 120 years beginning from {fmt(nodes[0].start)}
      </div>
    </div>
  )
}
