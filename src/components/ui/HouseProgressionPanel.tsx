'use client'
import React, { useMemo, useState } from 'react'
import { format, addYears, differenceInYears, isWithinInterval } from 'date-fns'
import type { ChartOutput, Rashi } from '@/types/astrology'
import { RASHI_NAMES, GRAHA_NAMES } from '@/types/astrology'

interface HouseSignification {
  house: number
  sanskrit: string
  karakas: string
  themes: string
  detailedThemes: string[]
}

const HOUSE_INFO: HouseSignification[] = [
  {
    house: 1,
    sanskrit: 'Tanu Bhava',
    karakas: 'Self, body, head, brain, health',
    themes: 'Body, health, self, head/brain, vitality, appearance, temperament',
    detailedThemes: ['Body & structure', 'General health', 'Self-image', 'Initiative', 'Longevity']
  },
  {
    house: 2,
    sanskrit: 'Dhana Bhava',
    karakas: 'Wealth, family, speech, food',
    themes: 'Family, finances, food habits, speech, face, right eye, accumulated wealth',
    detailedThemes: ['Income & savings', 'Family lineage', 'Speech & voice', 'Fixed assets', 'Moral values']
  },
  {
    house: 3,
    sanskrit: 'Sahaja Bhava',
    karakas: 'Courage, siblings, communication, skills',
    themes: 'Siblings, efforts, communication, hobbies, travel, courage, skills',
    detailedThemes: ['Younger siblings', 'Mental stamina', 'Short travels', 'Writing & media', 'Willpower']
  },
  {
    house: 4,
    sanskrit: 'Sukha Bhava',
    karakas: 'Mother, home, comforts, vehicles',
    themes: 'Home, mother, property, vehicles, mental peace, emotional security',
    detailedThemes: ['Fixed property', 'Inner happiness', 'Ancestral roots', 'Domestic peace', 'Schooling']
  },
  {
    house: 5,
    sanskrit: 'Putra Bhava',
    karakas: 'Children, creativity, intellect, romance',
    themes: 'Creativity, children, romance, past life karma, intelligence, investments',
    detailedThemes: ['Progeny', 'Literary talent', 'Speculative gains', 'Mantra siddhi', 'Joy of life']
  },
  {
    house: 6,
    sanskrit: 'Shatru Bhava',
    karakas: 'Enemies, debts, diseases, service',
    themes: 'Service, routine, enemies, diseases, debts, competition, obstacles',
    detailedThemes: ['Daily work', 'Legal disputes', 'Maternal relatives', 'Healing', 'Litigation']
  },
  {
    house: 7,
    sanskrit: 'Yuvati Bhava',
    karakas: 'Spouse, marriage, partnerships, trade',
    themes: 'Marriage, spouse, business partners, public image, social status, travel',
    detailedThemes: ['Legal contracts', 'Open rivals', 'Foreign residence', 'Diplomacy', 'Attraction']
  },
  {
    house: 8,
    sanskrit: 'Ayu Bhava',
    karakas: 'Longevity, transformation, secrets, death',
    themes: 'Sudden changes, inheritance, occult, secrets, lifespan, chronic illness, surgery',
    detailedThemes: ['Insurance & taxes', 'Spouse’s wealth', 'Research & mysteries', 'Regeneration', 'Trauma']
  },
  {
    house: 9,
    sanskrit: 'Dharma Bhava',
    karakas: 'Father, guru, dharma, fortune',
    themes: 'Higher learning, religion, guru, teachers, long travel, father, grace',
    detailedThemes: ['Ethical values', 'Pilgrimages', 'Philosophy', 'Blessings', 'Future lineage']
  },
  {
    house: 10,
    sanskrit: 'Karma Bhava',
    karakas: 'Career, status, power, authority',
    themes: 'Profession, reputation, public life, authority, father, ambition, career position',
    detailedThemes: ['Professional status', 'Life mission', 'Official recognition', 'Government', 'Awards']
  },
  {
    house: 11,
    sanskrit: 'Labha Bhava',
    karakas: 'Gains, fulfillment, elder siblings, community',
    themes: 'Income, gains, friends, aspirations, fulfillment of desires, large networks',
    detailedThemes: ['Marketplace gains', 'Influential contacts', 'Club memberships', 'Dividends', 'Well-wishers']
  },
  {
    house: 12,
    sanskrit: 'Vyaya Bhava',
    karakas: 'Losses, expenditure, isolation, moksha',
    themes: 'Expenses, losses, foreign lands, spirituality, isolation, hospital/prison, dreams',
    detailedThemes: ['Subconscious mind', 'Subtle realms', 'Charitable acts', 'Detachment', 'Secret enemies']
  }
]

const SIGN_SYMBOLS: Record<number, string> = {
  1: '♈', 2: '♉', 3: '♊', 4: '♋', 5: '♌', 6: '♍',
  7: '♎', 8: '♏', 9: '♐', 10: '♑', 11: '♒', 12: '♓',
}

const GRAHA_SYMBOLS: Record<string, string> = {
  Su: '🌞', Mo: '🌙', Ma: '♂', Me: '☿', Ju: '♃', Ve: '♀', Sa: '♄', Ra: '☊', Ke: '☋',
}

export function HouseProgressionPanel({ chart }: { chart: ChartOutput }) {
  const [activeCycle, setActiveCycle] = useState(0) // 0 to 8 (9 cycles total)
  
  const birthDate = useMemo(() => {
    try {
      // chart.meta.birthDate is YYYY-MM-DD
      const [y, m, d] = chart.meta.birthDate.split('-').map(Number)
      const [hh, mm] = chart.meta.birthTime.split(':').map(Number)
      return new Date(y, m - 1, d, hh, mm)
    } catch (e) {
      return new Date()
    }
  }, [chart.meta.birthDate, chart.meta.birthTime])

  const now = new Date()
  
  const progressions = useMemo(() => {
    const list = []
    for (let ageAtStart = 0; ageAtStart < 108; ageAtStart++) {
      const startDate = addYears(birthDate, ageAtStart)
      const endDate = addYears(birthDate, ageAtStart + 1)
      const houseNum = (ageAtStart % 12) + 1
      const isCurrent = isWithinInterval(now, { start: startDate, end: endDate })
      
      list.push({
        age: ageAtStart + 1, // Traditional 1st year, 2nd year...
        ageRange: `${ageAtStart} – ${ageAtStart + 1}`,
        startDate,
        endDate,
        houseNum,
        isCurrent
      })
    }
    return list
  }, [birthDate])

  const currentProgression = progressions.find(p => p.isCurrent)
  
  const cycles = Array.from({ length: 9 }, (_, i) => progressions.slice(i * 12, (i + 1) * 12))
  
  // Get active house data from chart
  const getHouseData = (hNum: number) => {
    // We need to find the sign and lord for house hNum
    // In whole sign, House 1 is ascRashi, House 2 is ascRashi + 1...
    const houseSystem = chart.meta.settings.houseSystem
    const lagnas = chart.lagnas
    const ascRashi = lagnas.ascRashi
    
    // Simple calculation assuming standard bhava house number mapping
    // Usually BCP refers to houses from Lagna
    const signIndex = (ascRashi + hNum - 2) % 12 + 1 // 1-indexed
    const signName = RASHI_NAMES[signIndex as Rashi]
    
    // Find lord
    const SIGN_LORDS: Record<number, string> = {
      1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
      7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
    }
    const lordId = SIGN_LORDS[signIndex]
    
    // Find planets in this house (naive check based on rashi if whole sign, or cusps otherwise)
    // For simplicity in progression table, we'll use Rashi-based house if it's whole sign
    const planetsInHouse = chart.grahas.filter(g => {
      if (houseSystem === 'whole_sign') {
        return g.rashi === signIndex
      } else {
        // Find cusp range for house hNum
        const cusp = lagnas.cusps ? lagnas.cusps[hNum - 1] : (lagnas.ascDegree + (hNum - 1) * 30) % 360
        const nextCusp = lagnas.cusps ? lagnas.cusps[hNum % 12] : (lagnas.ascDegree + hNum * 30) % 360
        const lon = g.lonSidereal
        if (nextCusp > cusp) return lon >= cusp && lon < nextCusp
        return lon >= cusp || lon < nextCusp
      }
    })
    
    return { signName, signIndex, lordId, planetsInHouse }
  }

  const currentHouseInfo = currentProgression ? HOUSE_INFO[currentProgression.houseNum - 1] : null
  const currentHouseDetails = currentProgression ? getHouseData(currentProgression.houseNum) : null

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Current Activation Banner */}
      {currentProgression && (
        <div style={{
          background: 'linear-gradient(135deg, var(--surface-2) 0%, var(--surface-3) 100%)',
          border: '1px solid var(--border-bright)',
          borderRadius: 'var(--r-lg)',
          padding: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '2rem',
          boxShadow: 'var(--shadow-deep)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ 
            position: 'absolute', top: '-20px', right: '-20px', 
            fontSize: '12rem', fontWeight: 900, color: 'var(--gold)', 
            opacity: 0.03, pointerEvents: 'none', fontFamily: 'var(--font-display)' 
          }}>
            {currentProgression.houseNum}
          </div>
          
          <div style={{ flex: '1 1 400px' }}>
            <div className="label-caps" style={{ color: 'var(--gold)', marginBottom: '0.5rem' }}>Current Progression Activation</div>
            <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              House {currentProgression.houseNum} <span style={{ color: 'var(--text-muted)', fontSize: '1.2rem', fontWeight: 400 }}>Active</span>
            </h2>
            <div style={{ marginTop: '0.5rem', fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
              Age {currentProgression.ageRange} · {currentHouseInfo?.sanskrit}
            </div>
            <div style={{ marginTop: '1.25rem', padding: 0 }}>
              <p style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 500, lineHeight: 1.6 }}>
                {currentHouseInfo?.themes}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
                {currentHouseInfo?.detailedThemes.map(t => (
                  <span key={t} style={{ 
                    padding: '0.3rem 0.75rem', background: 'var(--gold-faint)', 
                    border: '1px solid var(--gold)', borderRadius: '20px', 
                    fontSize: '0.75rem', color: 'var(--text-gold)', fontWeight: 600 
                  }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div style={{ 
            background: 'var(--surface-1)', 
            padding: '1.5rem', 
            borderRadius: 'var(--r-md)', 
            border: '1px solid var(--border-soft)',
            minWidth: '240px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>Active Period</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>From:</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{format(currentProgression.startDate, 'dd MMM yyyy')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>To:</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{format(currentProgression.endDate, 'dd MMM yyyy')}</span>
              </div>
              <div style={{ height: 1, background: 'var(--border-soft)', margin: '0.25rem 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Rāśi:</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-gold)' }}>
                  {SIGN_SYMBOLS[currentHouseDetails?.signIndex || 1]} {currentHouseDetails?.signName}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Lord:</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                  {GRAHA_SYMBOLS[currentHouseDetails?.lordId || 'Su']} {GRAHA_NAMES[currentHouseDetails?.lordId as keyof typeof GRAHA_NAMES] || currentHouseDetails?.lordId}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cycle Selector & Table */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <h3 className="label-caps" style={{ color: 'var(--text-gold)', fontSize: '0.75rem', margin: 0 }}>Cyclical Progression Table</h3>
          <div style={{ 
            display: 'flex', 
            background: 'var(--surface-3)', 
            padding: '3px', 
            borderRadius: 'var(--r-md)', 
            border: '1px solid var(--border-soft)',
            overflowX: 'auto',
            maxWidth: '100%'
          }}>
            {Array.from({ length: 9 }).map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveCycle(i)}
                style={{
                  padding: '0.4rem 0.85rem',
                  background: activeCycle === i ? 'var(--surface-1)' : 'transparent',
                  border: 'none',
                  borderRadius: 'var(--r-sm)',
                  cursor: 'pointer',
                  color: activeCycle === i ? 'var(--text-gold)' : 'var(--text-muted)',
                  fontWeight: activeCycle === i ? 700 : 500,
                  fontSize: '0.75rem',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s'
                }}
              >
                Cycle {i + 1} ({i * 12 + 1}–{(i + 1) * 12})
              </button>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: 0, overflowX: 'auto', background: 'var(--surface-1)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border-soft)' }}>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.65rem', textTransform: 'uppercase' }}>Year</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.65rem', textTransform: 'uppercase' }}>From Date</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.65rem', textTransform: 'uppercase' }}>To Date</th>
                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.65rem', textTransform: 'uppercase' }}>House</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.65rem', textTransform: 'uppercase' }}>Themes & Significations</th>
                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.65rem', textTransform: 'uppercase' }}>Occupants</th>
              </tr>
            </thead>
            <tbody>
              {cycles[activeCycle].map((p, idx) => {
                const info = HOUSE_INFO[p.houseNum - 1]
                const houseData = getHouseData(p.houseNum)
                return (
                  <tr 
                    key={p.age} 
                    style={{ 
                      background: p.isCurrent ? 'var(--gold-faint)' : 'transparent',
                      borderBottom: idx === 11 ? 'none' : '1px solid var(--border-soft)',
                      transition: 'background 0.2s'
                    }}
                  >
                    <td style={{ padding: '1rem', fontWeight: 700, color: p.isCurrent ? 'var(--text-gold)' : 'var(--text-primary)' }}>
                      Year {p.age}
                      {p.isCurrent && <span style={{ marginLeft: '0.5rem', fontSize: '0.6rem', color: 'var(--text-gold)', background: 'var(--surface-1)', padding: '2px 6px', borderRadius: 10, border: '1px solid var(--gold)' }}>CURRENT</span>}
                    </td>
                    <td style={{ padding: '1rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{format(p.startDate, 'dd MMM yyyy')}</td>
                    <td style={{ padding: '1rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{format(p.endDate, 'dd MMM yyyy')}</td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <div style={{ 
                        width: 32, height: 32, borderRadius: '50%', 
                        background: 'var(--surface-2)', border: '1px solid var(--border-soft)',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, color: 'var(--text-gold)'
                      }}>
                        {p.houseNum}
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{info.sanskrit}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{info.themes.split(',').slice(0, 4).join(',')}...</div>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {houseData.planetsInHouse.map(pl => (
                          <span key={pl.id} style={{ fontSize: '1.1rem' }} title={pl.name}>{GRAHA_SYMBOLS[pl.id] || pl.id}</span>
                        ))}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* House Themes Grid (Reference) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <h3 className="label-caps" style={{ color: 'var(--text-gold)', fontSize: '0.75rem', margin: 0 }}>House Signification Reference</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
          gap: '1rem' 
        }}>
          {HOUSE_INFO.map(info => (
            <div key={info.house} className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 700, color: 'var(--text-gold)', fontSize: '1.1rem' }}>House {info.house}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>{info.sanskrit}</div>
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{info.themes}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {info.karakas}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
