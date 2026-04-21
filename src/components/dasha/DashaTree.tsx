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

function fmtTime(d: Date | string) {
  const date = toDate(d)
  return date.toLocaleTimeString('en-IN', { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit'
  })
}

function fmtDateTimeCompact(d: Date | string) {
  const date = toDate(d)
  const dt = date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  const tm = date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
  return `${dt} • ${tm}`
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
  const labels = ['MD', 'AD', 'PD', 'SD', 'PrD', 'DD']
  const names = ['Mahā', 'Antar', 'Pratyantar', 'Sūkshma', 'Prāṇa', 'Deha']
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
  const [currentPath, setCurrentPath] = useState<DashaNode[]>([])
  
  // Find current active path on mount or if nodes change
  useEffect(() => {
    const path: DashaNode[] = []
    let current = nodes.find(n => n.isCurrent)
    while (current) {
      path.push(current)
      current = current.children.find(c => c.isCurrent)
    }
    setActivePath(path)
    setCurrentPath(path)
  }, [nodes])

  // Get current list based on path
  const currentList = useMemo(() => {
    if (activePath.length === 0) return nodes
    const last = activePath[activePath.length - 1]
    return last.children.length > 0 ? last.children : [last]
  }, [nodes, activePath])

  const currentLevel = activePath.length + 1

  const levelTitle = useMemo(() => {
    if (currentLevel <= 1) return 'Major Vimshottari Dasha'
    if (currentLevel === 2) return 'Antardasha'
    if (currentLevel === 3) return 'Pratyantardasha'
    if (currentLevel === 4) return 'Sookshmadasha'
    if (currentLevel === 5) return 'Pranadasha'
    return 'Dasha Sequence'
  }, [currentLevel])

  const currentMahaNode = activePath[0] ?? nodes.find((n) => n.isCurrent) ?? nodes[0]
  const birthMahaNode = nodes[0]
  const navtaraForCurrentMaha = useMemo(() => {
    const startIdx = VIMSHOTTARI_SEQUENCE.indexOf((birthMahaNode?.lord ?? '') as (typeof VIMSHOTTARI_SEQUENCE)[number])
    const currentIdx = VIMSHOTTARI_SEQUENCE.indexOf((currentMahaNode?.lord ?? '') as (typeof VIMSHOTTARI_SEQUENCE)[number])
    if (startIdx < 0 || currentIdx < 0) return null
    const taraNumber = ((currentIdx - startIdx + 9) % 9) + 1
    const meta = NAVTARA_META[taraNumber - 1]
    return { taraNumber, taraName: meta.name, quality: meta.quality }
  }, [birthMahaNode, currentMahaNode])

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

  const codePathForNode = (node: DashaNode): string => {
    const chain = [...activePath.map((n) => n.lord), node.lord]
    return chain.join('/')
  }
  const fullCurrentCode = currentPath.map((n) => n.lord).join('/')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.9rem 1rem',
          borderRadius: '10px',
          border: '1px solid var(--border-soft)',
          background: 'var(--surface-2)',
        }}
      >
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          {levelTitle}
        </div>
        {activePath.length > 0 && (
          <button
            type="button"
            onClick={handleBack}
            style={{
              border: 'none',
              background: 'transparent',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontFamily: 'var(--font-display)',
              fontSize: '1rem',
              fontWeight: 600,
            }}
          >
            ← Back
          </button>
        )}
      </div>
      {currentMahaNode && (
        <div
          style={{
            borderRadius: '10px',
            border: '1px solid var(--border-soft)',
            background: 'var(--surface-2)',
            padding: '0.55rem 0.8rem',
            fontSize: '0.78rem',
            color: 'var(--text-secondary)',
          }}
        >
          <strong style={{ color: 'var(--text-primary)' }}>
            Running Mahadasha: {currentMahaNode.label || GRAHA_NAME[currentMahaNode.lord] || currentMahaNode.lord}
          </strong>
          {navtaraForCurrentMaha && (
            <span
              style={{
                marginLeft: 8,
                color:
                  navtaraForCurrentMaha.quality === 'auspicious'
                    ? 'var(--teal)'
                    : navtaraForCurrentMaha.quality === 'inauspicious'
                      ? 'var(--rose)'
                      : 'var(--amber)',
                fontWeight: 700,
              }}
            >
              · Navtara #{navtaraForCurrentMaha.taraNumber}: {navtaraForCurrentMaha.taraName}
            </span>
          )}
        </div>
      )}
      {currentPath.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '0.5rem',
            borderRadius: '10px',
            border: '1px solid var(--border-soft)',
            background: 'var(--surface-1)',
            padding: '0.55rem 0.8rem',
          }}
        >
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Full current dasha:</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--teal)', fontWeight: 700 }}>
            {fullCurrentCode}
          </span>
          <button
            type="button"
            onClick={() => setActivePath(currentPath)}
            style={{
              border: '1px solid rgba(78,205,196,0.35)',
              background: 'rgba(78,205,196,0.08)',
              color: 'var(--teal)',
              borderRadius: 999,
              padding: '0.22rem 0.7rem',
              fontSize: '0.74rem',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Show current
          </button>
          <button
            type="button"
            onClick={() => setActivePath([])}
            style={{
              border: '1px solid var(--border-soft)',
              background: 'var(--surface-2)',
              color: 'var(--text-primary)',
              borderRadius: 999,
              padding: '0.22rem 0.7rem',
              fontSize: '0.74rem',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Show Mahadasha
          </button>
        </div>
      )}

      {activePath.length > 0 && (
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setActivePath([])}
            style={{
              border: '1px solid var(--border-soft)',
              background: 'var(--surface-2)',
              color: 'var(--text-muted)',
              borderRadius: 999,
              padding: '0.22rem 0.58rem',
              fontSize: '0.72rem',
              cursor: 'pointer',
            }}
          >
            Root
          </button>
          {activePath.map((node, i) => (
            <button
              key={`${node.lord}-${i}`}
              type="button"
              onClick={() => handleNavigate(node, i)}
              style={{
                border: '1px solid var(--border-soft)',
                background: i === activePath.length - 1 ? 'rgba(78,205,196,0.12)' : 'var(--surface-2)',
                color: i === activePath.length - 1 ? 'var(--teal)' : 'var(--text-muted)',
                borderRadius: 999,
                padding: '0.22rem 0.58rem',
                fontSize: '0.72rem',
                cursor: 'pointer',
              }}
            >
              {node.label || GRAHA_NAME[node.lord]}
            </button>
          ))}
        </div>
      )}

      <div style={{ borderRadius: '10px', border: '1px solid var(--border-soft)', overflow: 'hidden', background: 'var(--surface-1)' }}>
        {currentList.map((node, idx) => {
          const hasChildren = node.children && node.children.length > 0
          const rowLabel = codePathForNode(node)
          const rowSubLabel = node.label || GRAHA_NAME[node.lord]
          return (
            <button
              key={`${node.lord}-${node.start}-${idx}`}
              type="button"
              onClick={() => hasChildren && handleNavigate(node, activePath.length)}
              style={{
                width: '100%',
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) auto',
                alignItems: 'center',
                gap: '0.75rem',
                textAlign: 'left',
                border: 'none',
                borderBottom: idx === currentList.length - 1 ? 'none' : '1px solid var(--border-soft)',
                padding: '0.78rem 0.95rem',
                background: node.isCurrent ? 'rgba(78,205,196,0.14)' : 'transparent',
                cursor: hasChildren ? 'pointer' : 'default',
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600, color: node.isCurrent ? 'var(--teal)' : 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {rowLabel}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 1 }}>
                  {rowSubLabel}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  {fmtDateTimeCompact(node.start)}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                {node.isCurrent && (
                  <span style={{ color: 'var(--teal)', fontSize: '0.82rem', fontWeight: 700 }}>Current</span>
                )}
                {hasChildren && (
                  <span style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>›</span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
        Born: {fmtDate(birthDate)} · Cycle starts {fmtDate(nodes[0].start)}
      </div>
    </div>
  )
}

