'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/dasha/DashaTree.tsx  — Compact flat layout
// ─────────────────────────────────────────────────────────────

import React, { useState, useMemo, useEffect } from 'react'
import type { DashaNode } from '@/types/astrology'

const GRAHA_NAME: Record<string, string> = {
  Su: 'Sun',  Mo: 'Moon',  Ma: 'Mars', Me: 'Mercury',
  Ju: 'Jupiter', Ve: 'Venus', Sa: 'Saturn', Ra: 'Rahu', Ke: 'Ketu',
  Ar: 'Aries', Ta: 'Taurus', Ge: 'Gemini', Cn: 'Cancer',
  Le: 'Leo', Vi: 'Virgo', Li: 'Libra', Sc: 'Scorpio',
  Sg: 'Sagittarius', Cp: 'Capricorn', Aq: 'Aquarius', Pi: 'Pisces'
}

const GRAHA_COLOR: Record<string, string> = {
  Su: '#F59E0B', Mo: '#60A5FA', Ma: '#EF4444',
  Me: '#10B981', Ju: '#FACC15', Ve: '#EC4899',
  Sa: '#6366F1', Ra: '#8B5CF6', Ke: '#F97316',
  Ar: '#EF4444', Ta: '#10B981', Ge: '#60A5FA', Cn: '#9CA3AF',
  Le: '#F59E0B', Vi: '#10B981', Li: '#EC4899', Sc: '#EF4444',
  Sg: '#FACC15', Cp: '#6366F1', Aq: '#6366F1', Pi: '#FACC15'
}

const VIMSHOTTARI_SEQUENCE = ['Ke', 'Ve', 'Su', 'Mo', 'Ma', 'Ra', 'Ju', 'Sa', 'Me'] as const
const NAVTARA_META = [
  { name: 'Janma', quality: 'neutral' },
  { name: 'Sampat', quality: 'auspicious' },
  { name: 'Vipat', quality: 'inauspicious' },
  { name: 'Kshema', quality: 'auspicious' },
  { name: 'Pratyari', quality: 'inauspicious' },
  { name: 'Sadhaka', quality: 'auspicious' },
  { name: 'Vadha', quality: 'inauspicious' },
  { name: 'Mitra', quality: 'auspicious' },
  { name: 'Ati-Mitra', quality: 'auspicious' },
] as const

function toDate(d: Date | string): Date {
  return d instanceof Date ? d : new Date(d)
}

function fmtDateCompact(d: Date | string) {
  const date = toDate(d)
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })
    + ' ' + date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function fmtDate(d: Date | string) {
  const date = toDate(d)
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
}

export function DashaTree({ nodes, birthDate }: { nodes: DashaNode[]; birthDate: Date }) {
  const [activePath, setActivePath] = useState<DashaNode[]>([])
  const [currentPath, setCurrentPath] = useState<DashaNode[]>([])

  useEffect(() => {
    const path: DashaNode[] = []
    let current = nodes.find(n => n.isCurrent)
    while (current) {
      path.push(current)
      current = current.children.find(c => c.isCurrent)
    }
    setActivePath([])   // default: show root MD list; use "Current" button to drill down
    setCurrentPath(path)
  }, [nodes])

  const currentList = useMemo(() => {
    if (activePath.length === 0) return nodes
    const last = activePath[activePath.length - 1]
    return last.children.length > 0 ? last.children : [last]
  }, [nodes, activePath])

  const currentMahaNode = activePath[0] ?? nodes.find(n => n.isCurrent) ?? nodes[0]
  const birthMahaNode = nodes[0]

  const navtara = useMemo(() => {
    const startIdx = VIMSHOTTARI_SEQUENCE.indexOf((birthMahaNode?.lord ?? '') as any)
    const curIdx = VIMSHOTTARI_SEQUENCE.indexOf((currentMahaNode?.lord ?? '') as any)
    if (startIdx < 0 || curIdx < 0) return null
    const num = ((curIdx - startIdx + 9) % 9) + 1
    return { num, ...NAVTARA_META[num - 1] }
  }, [birthMahaNode, currentMahaNode])

  const fullCurrentCode = currentPath.map(n => n.lord).join('/')

  function handleNavigate(node: DashaNode, depth: number) {
    if (depth < activePath.length) { setActivePath(activePath.slice(0, depth + 1)); return }
    if (node.children?.length) setActivePath([...activePath, node])
  }

  const codePathForNode = (node: DashaNode) =>
    [...activePath.map(n => n.lord), node.lord].join('/')

  const navtaraColor = navtara?.quality === 'auspicious'
    ? 'var(--teal)' : navtara?.quality === 'inauspicious' ? 'var(--rose)' : 'var(--amber)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.78rem' }}>

      {/* ── Compact header bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', paddingBottom: '0.3rem', borderBottom: '1px solid var(--border-soft)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0, flexWrap: 'wrap' }}>
          {/* Mahadasha label */}
          {currentMahaNode && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', whiteSpace: 'nowrap' }}>
              <span style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>MD</span>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-gold)' }}>
                {GRAHA_NAME[currentMahaNode.lord] ?? currentMahaNode.lord}
              </span>
            </span>
          )}
          {/* Separator */}
          {currentMahaNode && fullCurrentCode && (
            <span style={{ color: 'var(--border-soft)', fontSize: '0.6rem' }}>·</span>
          )}
          {/* Full current dasha code */}
          {fullCurrentCode && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', fontWeight: 700, color: 'var(--teal)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {fullCurrentCode}
            </span>
          )}
          {/* Tara badge */}
          {navtara && (
            <span style={{ fontSize: '0.58rem', fontWeight: 700, padding: '1px 5px', borderRadius: 3, border: `1px solid ${navtaraColor}`, color: navtaraColor, whiteSpace: 'nowrap' }}>
              Tara·{navtara.num} {navtara.name}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.3rem', flexShrink: 0 }}>
          {activePath.length > 0 && (
            <button type="button" onClick={() => setActivePath(activePath.slice(0, -1))}
              style={{ border: '1px solid var(--border-soft)', background: 'transparent', color: 'var(--text-muted)', borderRadius: 4, padding: '0.1rem 0.4rem', fontSize: '0.62rem', cursor: 'pointer' }}>
              ← Back
            </button>
          )}
          {currentPath.length > 0 && (
            <button type="button" onClick={() => setActivePath(currentPath)}
              style={{ border: '1px solid rgba(78,205,196,0.35)', background: 'rgba(78,205,196,0.08)', color: 'var(--teal)', borderRadius: 4, padding: '0.1rem 0.4rem', fontSize: '0.62rem', cursor: 'pointer' }}>
              Current
            </button>
          )}
          {activePath.length > 0 && (
            <button type="button" onClick={() => setActivePath([])}
              style={{ border: '1px solid var(--border-soft)', background: 'transparent', color: 'var(--text-muted)', borderRadius: 4, padding: '0.1rem 0.4rem', fontSize: '0.62rem', cursor: 'pointer' }}>
              MD
            </button>
          )}
        </div>
      </div>

      {/* ── Breadcrumb path ── */}
      {activePath.length > 0 && (
        <div style={{ display: 'flex', gap: '0.2rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button type="button" onClick={() => setActivePath([])}
            style={{ border: 'none', background: 'none', color: 'var(--text-muted)', fontSize: '0.62rem', cursor: 'pointer', padding: '0 0.15rem' }}>
            Root
          </button>
          {activePath.map((node, i) => (
            <React.Fragment key={`bc-${node.lord}-${i}`}>
              <span style={{ color: 'var(--border)', fontSize: '0.6rem' }}>›</span>
              <button type="button" onClick={() => handleNavigate(node, i)}
                style={{ border: 'none', background: 'none', color: i === activePath.length - 1 ? 'var(--teal)' : 'var(--text-muted)', fontSize: '0.62rem', cursor: 'pointer', padding: '0 0.15rem', fontWeight: i === activePath.length - 1 ? 700 : 400 }}>
                {GRAHA_NAME[node.lord] ?? node.lord}
              </button>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* ── Dasha rows ── */}
      <div style={{ borderRadius: 6, border: '1px solid var(--border-soft)', overflow: 'hidden', background: 'var(--surface-1)' }}>
        {currentList.map((node, idx) => {
          const hasChildren = node.children?.length > 0
          const color = GRAHA_COLOR[node.lord] ?? 'var(--text-muted)'
          return (
            <button
              key={`${node.lord}-${node.start}-${idx}`}
              type="button"
              onClick={() => hasChildren && handleNavigate(node, activePath.length)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem',
                textAlign: 'left', border: 'none',
                borderBottom: idx === currentList.length - 1 ? 'none' : '1px solid var(--border-soft)',
                padding: '0.3rem 0.55rem',
                background: node.isCurrent ? 'rgba(78,205,196,0.09)' : 'transparent',
                cursor: hasChildren ? 'pointer' : 'default',
                borderLeft: node.isCurrent ? `2px solid var(--teal)` : `2px solid transparent`,
              }}
            >
              {/* Planet color dot */}
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
              {/* Code */}
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 700, color: node.isCurrent ? 'var(--teal)' : 'var(--text-primary)', whiteSpace: 'nowrap', minWidth: '2.2rem' }}>
                {codePathForNode(node)}
              </span>
              {/* Name */}
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', flex: 1 }}>
                {node.label || GRAHA_NAME[node.lord] || node.lord}
              </span>
              {/* Date */}
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                {fmtDateCompact(node.start)}
              </span>
              {node.isCurrent && (
                <span style={{ fontSize: '0.58rem', fontWeight: 700, color: 'var(--teal)', whiteSpace: 'nowrap' }}>●</span>
              )}
              {hasChildren && (
                <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>›</span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Birth note ── */}
      <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', opacity: 0.7 }}>
        Born: {fmtDate(birthDate)} · Cycle: {fmtDate(nodes[0]?.start)}
      </div>
    </div>
  )
}
