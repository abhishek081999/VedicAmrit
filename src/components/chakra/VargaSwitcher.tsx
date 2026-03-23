// VargaSwitcher.tsx — plan gated
'use client'
import { useState } from 'react'
import { ChakraSelector } from './ChakraSelector'
import type { GrahaData, Rashi, UserPlan, ArudhaData } from '@/types/astrology'

interface VargaMeta { name: string; full: string; topic: string; tier: 'kala'|'vela'|'hora' }

const VARGA_META: VargaMeta[] = [
  { name:'D1',  full:'Rashi',           topic:'Lagna chart — personality, body, overall life',        tier:'kala' },
  { name:'D9',  full:'Navamsha',        topic:'Spouse & marriage — inner self, manifests after 35',   tier:'kala' },
  { name:'D60', full:'Shastyamsha',     topic:'Past-life karma — karmic influences, soul evolution',  tier:'vela' },
  { name:'D2',  full:'Hora',            topic:'Wealth & assets — income, Sun Hora and Moon Hora',     tier:'vela' },
  { name:'D3',  full:'Drekkana',        topic:'Siblings — relationships, talents, abilities',         tier:'vela' },
  { name:'D4',  full:'Chaturthamsha',   topic:'Home & property — dwelling, ancestral property',       tier:'vela' },
  { name:'D7',  full:'Saptamsha',       topic:'Children — progeny, offspring, influence',             tier:'vela' },
  { name:'D10', full:'Dasamsha',        topic:'Career — profession, achievements, reputation',        tier:'kala' },
  { name:'D12', full:'Dwadasamsha',     topic:'Parents — relationship with parents, their influence', tier:'vela' },
  { name:'D16', full:'Shodasamsha',     topic:'Vehicles & comforts — transport, luxuries',            tier:'vela' },
  { name:'D20', full:'Vimsamsha',       topic:'Spirituality — religious actions, devotion',           tier:'vela' },
  { name:'D24', full:'Chaturvimsamsha', topic:'Education — learning, academic achievements',          tier:'vela' },
  { name:'D27', full:'Saptavimsamsha',  topic:'Innate strength — inherent qualities, talents',        tier:'vela' },
  { name:'D30', full:'Trimsamsha',      topic:'Obstacles — negative influences, karmic challenges',   tier:'vela' },
  { name:'D40', full:'Khavedamsha',     topic:'Life events and mother — auspicious or inauspicious',  tier:'vela' },
  { name:'D45', full:'Akshavedamsha',   topic:'All life matters and father — comprehensive',          tier:'vela' },
  { name:'D81', full:'Navamsha D81',    topic:'Detailed karmic analysis — sub-divisions of D9',      tier:'hora' },
]

function planLevel(plan: UserPlan) { return plan==='hora'?2:plan==='vela'?1:0 }
function tierLevel(tier: VargaMeta['tier']) { return tier==='hora'?2:tier==='vela'?1:0 }
function isUnlocked(meta: VargaMeta, plan: UserPlan) { return planLevel(plan)>=tierLevel(meta.tier) }

interface Props {
  vargas: Record<string,GrahaData[]>; vargaLagnas: Record<string,Rashi>
  lagnas?: import('@/types/astrology').LagnaData
  ascRashi: Rashi; arudhas?: ArudhaData; userPlan?: UserPlan
  size?: number; moonNakIndex?: number; tithiNumber?: number; varaNumber?: number
  transitGrahas?: GrahaData[]; direction?: 'grid'|'column'
}

function Pill({ meta, plan, state, onClick }: {
  meta:VargaMeta; plan:UserPlan; state:'primary'|'secondary'|'none'; onClick:()=>void
}) {
  const unlocked = isUnlocked(meta, plan)
  const tierLabel = meta.tier === 'hora' ? 'Hora' : 'Vela'
  return (
    <button
      onClick={onClick}
      title={unlocked ? `${meta.full} — ${meta.topic}` : `Requires ${tierLabel} plan`}
      style={{
        padding:'0.22rem 0.6rem', fontSize:'0.78rem',
        fontFamily:'JetBrains Mono,monospace', cursor:'pointer',
        border:'1px solid', borderRadius:'4px', transition:'all 0.12s',
        background: !unlocked?'transparent':state==='primary'?'var(--gold-faint)':state==='secondary'?'var(--accent-glow)':'transparent',
        borderColor: !unlocked?'var(--border-soft)':state==='primary'?'var(--gold)':state==='secondary'?'var(--accent)':'var(--border)',
        color: !unlocked?'var(--text-muted)':state==='primary'?'var(--gold)':state==='secondary'?'var(--accent)':'var(--text-muted)',
        opacity: unlocked?1:0.5, display:'inline-flex', alignItems:'center', gap:'0.2rem',
      }}>
      {!unlocked && <span style={{fontSize:'0.6rem'}}>&#x1F512;</span>}
      {meta.name}
    </button>
  )
}

function UpgradeNudge({ plan }: { plan: UserPlan }) {
  if (plan !== 'kala') return null
  return (
    <div style={{ display:'flex',alignItems:'center',gap:'0.6rem',padding:'0.4rem 0.75rem',
      background:'rgba(184,134,11,0.05)',border:'1px solid rgba(184,134,11,0.18)',
      borderRadius:'var(--r-md)',fontSize:'0.72rem',color:'var(--text-muted)' }}>
      <span>&#x1F512;</span>
      <span>D2&ndash;D45 require <strong style={{color:'var(--text-gold)'}}>Vela</strong> plan</span>
      <a href="/pricing" style={{ marginLeft:'auto',padding:'0.18rem 0.6rem',
        background:'var(--gold-faint)',border:'1px solid var(--gold)',
        borderRadius:'var(--r-sm)',color:'var(--text-gold)',
        fontSize:'0.68rem',fontWeight:600,textDecoration:'none',whiteSpace:'nowrap' }}>
        Upgrade
      </a>
    </div>
  )
}

function ChartLabel({ meta, accent }: { meta: VargaMeta; accent: 'gold'|'blue' }) {
  const isGold = accent === 'gold'
  return (
    <div style={{ display:'flex',alignItems:'baseline',gap:'0.5rem',
      marginBottom:'0.5rem',paddingBottom:'0.4rem',
      borderBottom:`1px solid ${isGold?'var(--border)':'var(--border-accent)'}` }}>
      <span style={{ fontFamily:'JetBrains Mono,monospace',fontSize:'0.85rem',
        fontWeight:'var(--fw-bold)',color:isGold?'var(--gold)':'var(--accent)' }}>
        {meta.name}
      </span>
      <span style={{ fontFamily:'Cormorant Garamond,serif',fontSize:'1rem',color:'var(--text-primary)' }}>
        {meta.full}
      </span>
      <span style={{ fontFamily:'Cormorant Garamond,serif',fontSize:'0.78rem',
        fontStyle:'italic',color:'var(--text-muted)',marginLeft:4 }}>
        &mdash; {meta.topic.split(' — ')[1]??meta.topic}
      </span>
    </div>
  )
}

export function VargaSwitcher({
  vargas, vargaLagnas, ascRashi, arudhas, userPlan='kala', lagnas,
  size=500, moonNakIndex=0, tithiNumber=1, varaNumber=0,
  transitGrahas=[], direction='grid',
}: Props) {
  const [selected, setSelected] = useState<string[]>(['D1', 'D9', 'D10'])
  const available = VARGA_META.filter(v => v.name in vargas || v.tier==='kala')

  function handleClick(meta: VargaMeta) {
    if (!isUnlocked(meta, userPlan)) { window.location.href='/pricing'; return }
    const name = meta.name
    if (selected.includes(name)) {
      if (selected.length > 1) setSelected(p => p.filter(n => n !== name))
    } else {
      setSelected(p => [...p, name])
    }
  }

  function pillState(name: string): 'primary'|'secondary'|'none' {
    return selected[0]===name ? 'primary' : selected.includes(name) ? 'secondary' : 'none'
  }

  function chartProps(name: string) {
    return {
      grahas: vargas[name] ?? vargas['D1'] ?? [],
      varAscRashi: (vargaLagnas[name] ?? ascRashi) as Rashi,
    }
  }

  const kalaV = available.filter(v => v.tier === 'kala')
  const velaV = available.filter(v => v.tier === 'vela')
  const horaV = available.filter(v => v.tier === 'hora')
  const visible = selected.filter(name => {
    const meta = VARGA_META.find(v => v.name === name)
    return meta ? isUnlocked(meta, userPlan) : true
  })

  const TierRow = ({ label, items, labelColor }: { label:string; items:VargaMeta[]; labelColor:string }) => (
    <div style={{ display:'flex',alignItems:'center',gap:'0.5rem',flexWrap:'wrap' }}>
      <span className="label-caps" style={{ fontSize:'0.6rem',color:labelColor,minWidth:34,flexShrink:0 }}>
        {label}
      </span>
      <div style={{ display:'flex',gap:'0.3rem',flexWrap:'wrap' }}>
        {items.map(v => (
          <Pill key={v.name} meta={v} plan={userPlan} state={pillState(v.name)} onClick={() => handleClick(v)} />
        ))}
      </div>
    </div>
  )

  return (
    <div style={{ display:'flex',flexDirection:'column',gap:'1.25rem' }}>
      <div style={{ display:'flex',flexDirection:'column',gap:'0.55rem' }}>
        <TierRow label="Free" items={kalaV} labelColor="var(--text-muted)" />
        {velaV.length > 0 && (
          <TierRow label="Vela" items={velaV}
            labelColor={userPlan !== 'kala' ? 'var(--text-gold)' : 'var(--text-muted)'} />
        )}
        {horaV.length > 0 && (
          <TierRow label="Hora" items={horaV}
            labelColor={userPlan === 'hora' ? 'var(--teal)' : 'var(--text-muted)'} />
        )}
        <UpgradeNudge plan={userPlan} />
      </div>

      <div className={direction==='grid' ? 'varga-grid' : ''} style={{
        display: direction==='grid' ? 'grid' : 'flex',
        flexDirection: direction==='grid' ? undefined : 'column',
        gap: '1.5rem', marginTop: '0.5rem',
      }}>
        {visible.map((name, idx) => {
          const meta = VARGA_META.find(v => v.name === name) ?? { name, full:name, topic:'', tier:'kala' as const }
          const { grahas, varAscRashi } = chartProps(name)
          return (
            <div key={name} className="fade-up" style={{
              padding:'1.25rem', background:'var(--surface-1)',
              border:`1px solid ${idx===0 ? 'var(--gold)' : 'var(--border)'}`,
              borderRadius:'var(--r-lg)', boxShadow:'var(--shadow-card)',
            }}>
              <ChartLabel meta={meta} accent={idx===0 ? 'gold' : 'blue'} />
              <div style={{ display:'flex',justifyContent:'center',marginTop:'1rem' }}>
                <ChakraSelector
                  ascRashi={varAscRashi} grahas={grahas} size={360}
                  userPlan={userPlan} lagnas={lagnas} defaultStyle="north" arudhas={arudhas}
                  transitGrahas={name === 'D1' ? transitGrahas : []} moonNakIndex={moonNakIndex}
                  tithiNumber={tithiNumber} varaNumber={varaNumber}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
