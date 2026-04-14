'use client'

import React, { useMemo } from 'react'
import { DashaNode, GrahaData } from '@/types/astrology'

interface Props {
  nodes: DashaNode[]
  grahas: GrahaData[]
}

const DASHA_KARAKAS: Record<string, { title: string; focus: string; description: string }> = {
  Su: { title: 'The Royal Sovereign', focus: 'Self, Authority, Power', description: 'Sun periods bring focus to ones soul purpose, leadership, and public reputation. It is a time for "shining" and stepping into authority.' },
  Mo: { title: 'The Emotional Ocean', focus: 'Mind, Comfort, Nurturing', description: 'Moon periods emphasize emotional growth, residential changes, and connection with family or public. Focus shifts to inner security.' },
  Ma: { title: 'The Dynamic Warrior', focus: 'Energy, Courage, Ambition', description: 'Mars periods are high-energy times for taking initiative, technical pursuits, or property matters. Avoid impulsive conflicts.' },
  Me: { title: 'The Intellectual Messenger', focus: 'Learning, Commerce, Intellect', description: 'Mercury periods foster communication, education, business growth, and analytical skills. A busy time for the mind.' },
  Ju: { title: 'The Great Benevolent', focus: 'Expansion, Wisdom, Wealth', description: 'Jupiter periods are typically the most expansive, bringing spiritual wisdom, children, wealth, and favorable opportunities.' },
  Ve: { title: 'The Artist of Life', focus: 'Luxury, Love, Creativity', description: 'Venus periods focus on relationships, artistic endeavors, comforts, and sensory pleasures. A time for building harmony.' },
  Sa: { title: 'The Lord of Karma', focus: 'Structure, Discipline, Endurance', description: 'Saturn periods demand hard work, patience, and structural reorganization. It is a maturing process of long-term stability.' },
  Ra: { title: 'The Ambitious Shadow', focus: 'Innovation, Obsession, Materialism', description: 'Rahu periods bring sudden changes, high material ambition, and non-traditional paths. Both intense gains and chaos are possible.' },
  Ke: { title: 'The Spiritual Liberator', focus: 'Detachment, Insight, Spirituality', description: 'Ketu periods focus on spiritual liberation, research, and detaching from worldly bonds. It is a "monk-like" phase of deep insight.' }
}

export function DashaInterpretationPanel({ nodes, grahas }: Props) {
  // Find current active path
  const activePath = useMemo(() => {
    const path: DashaNode[] = []
    let current = nodes.find(n => n.isCurrent)
    while (current) {
      path.push(current)
      current = current.children.find(c => c.isCurrent)
    }
    return path
  }, [nodes])

  if (activePath.length < 1) return null

  const mahadasha = activePath[0]
  const antardasha = activePath[1]
  
  const mData = DASHA_KARAKAS[mahadasha.lord]
  const aData = antardasha ? DASHA_KARAKAS[antardasha.lord] : null

  // Calculate relationship between lords (6/8, 2/12, etc.)
  const getRelation = (l1: string, l2: string) => {
    const g1 = grahas.find(g => g.id === l1)
    const g2 = grahas.find(g => g.id === l2)
    if (!g1 || !g2) return null
    
    const h1 = g1.rashi
    const h2 = g2.rashi
    const diff = ((h2 - h1 + 12) % 12) + 1
    
    if (diff === 1) return 'Conjoined (1/1)'
    if (diff === 7) return 'Opposing (1/7)'
    if (diff === 6 || diff === 8) return 'Challenging (6/8 Shadashtaka)'
    if (diff === 2 || diff === 12) return 'Adjustment (2/12 Dwir-dwadasa)'
    if (diff === 5 || diff === 9) return 'Supportive (5/9 Trikona)'
    if (diff === 4 || diff === 10) return 'Functional (4/10 Kendra)'
    if (diff === 3 || diff === 11) return 'Growth (3/11 Upachaya)'
    return null
  }

  const relation = antardasha ? getRelation(mahadasha.lord, antardasha.lord) : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
       <div className="card" style={{ padding: '1.5rem', background: `linear-gradient(135deg, var(--surface-1) 0%, rgba(201,168,76,0.05) 100%)`, border: '1px solid var(--gold-faint)' }}>
          <div className="label-caps" style={{ color: 'var(--text-gold)', marginBottom: '1rem' }}>Active Mahādashā Narrative</div>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
             <div style={{ width: 64, height: 64, borderRadius: '12px', background: 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', border: '1px solid var(--border-soft)', flexShrink: 0 }}>
               {mahadasha.lord === 'Su' ? '☀️' : mahadasha.lord === 'Mo' ? '🌙' : mahadasha.lord === 'Ma' ? '🔥' : mahadasha.lord === 'Ju' ? '💎' : '🪐'}
             </div>
             <div style={{ flex: 1, minWidth: 250 }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'var(--font-display)' }}>{mData?.title}</h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginTop: 4 }}>Focus: {mData?.focus}</div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: '0.75rem' }}>{mData?.description}</p>
             </div>
          </div>
       </div>
       {antardasha && (
         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            <div className="card" style={{ padding: '1.25rem' }}>
               <div className="label-caps" style={{ fontSize: '0.65rem', color: 'var(--teal)' }}>Antardashā Focus</div>
               <h4 style={{ margin: '0.5rem 0', fontSize: '1.05rem', color: 'var(--text-primary)' }}>{aData?.title}</h4>
               <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                 Under the broad umbrella of {mData?.title}, {antardasha.lord} brings a refined focus to <strong>{aData?.focus}</strong>.
                 {relation && <span style={{ display: 'block', marginTop: '0.5rem', fontWeight: 600, color: 'var(--text-gold)' }}>Relationship: {relation}</span>}
               </p>
            </div>
            <div className="card" style={{ padding: '1.25rem' }}>
               <div className="label-caps" style={{ fontSize: '0.65rem' }}>Strategic Advice</div>
               <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {relation?.includes('Challenging') ? (
                    <div style={{ fontSize: '0.85rem', color: 'var(--rose)', background: 'var(--rose-faint)', padding: '8px', borderRadius: '4px' }}>⚠ Lords are in a 6/8 stance. Expect some friction or hidden challenges. Exercise patience.</div>
                  ) : relation?.includes('Supportive') ? (
                    <div style={{ fontSize: '0.85rem', color: 'var(--teal)', background: 'var(--teal-faint)', padding: '8px', borderRadius: '4px' }}>✓ Lords are in harmony (Trine). Efforts will yield smoother results during this sub-period.</div>
                  ) : (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Focus on maintaining the momentum of the current Mahadasha while allowing the {antardasha.lord} energy to guide your micro-decisions.</div>
                  )}
               </div>
            </div>
         </div>
       )}
    </div>
  )
}
