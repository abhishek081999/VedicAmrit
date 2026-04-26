'use client'
/**
 * SBCAdvancedPanel.tsx
 * ─────────────────────────────────────────────────────────────
 * Advanced Sarvatobhadra Chakra Analysis Engine
 *
 * Tabs:
 *  1. 🔮 Prashna   — Horary question engine with directional verdict
 *  2. 🪔 5-Fold    — Pancha Shuddhi muhurta checker
 *  3. 🧭 Directions — 8-direction planetary analysis
 *  4. 🔍 Predict   — Lost objects / Disease / Travel / Court modes
 *  5. 📜 Vedha Map — Classical vedha pairs & current activations
 */

import { useState, useMemo } from 'react'
import type { SBCCell, SBCGrahaInput, SBCAnalysisExtended, VedhaResult, TithiInfo } from '@/lib/engine/sarvatobhadra'
import { SBC_NAK_POS, nakFromLon, PLANET_COLOR, PLANET_SYMBOL } from '@/lib/engine/sarvatobhadra'
import { NAKSHATRA_NAMES } from '@/types/astrology'
import type { GrahaId } from '@/types/astrology'
interface Props {
  grid:        SBCCell[][]
  transitRaw:  SBCGrahaInput[]
  natalGrahas: SBCGrahaInput[]
  analysis:    SBCAnalysisExtended | null
  tithi?:      TithiInfo | null
  transitDate: string
  isMobile:    boolean
}

type AdvTab = 'prashna' | 'fivefold' | 'directions' | 'predict' | 'vedhamap'
type PredictMode = 'lost' | 'disease' | 'travel' | 'court'

// ── Constants ─────────────────────────────────────────────────

const PLANET_NAME: Record<string, string> = {
  Su:'Sun', Mo:'Moon', Ma:'Mars', Me:'Mercury', Ju:'Jupiter',
  Ve:'Venus', Sa:'Saturn', Ra:'Rahu', Ke:'Ketu',
}

/** Nakshatra → direction in the SBC grid */
const NAK_DIRECTION: Record<number, string> = {
  0:'NW', 1:'NW', 2:'NW',
  3:'N',  4:'N',  5:'N',
  6:'NE', 7:'NE', 8:'NE',
  9:'E',  10:'E', 11:'E', 12:'E',
  13:'SE',14:'SE',15:'SE',16:'SE',
  17:'S', 18:'S', 19:'S', 20:'S',
  21:'SW',22:'SW',23:'SW',24:'SW',
  25:'W', 26:'W',
}

interface DirInfo {
  name:     string
  sanskrit: string
  deity:    string
  element:  string
  color:    string
  icon:     string
  general:  string[]
  benefic:  string[]
  malefic:  string[]
  bestFor:  string[]
  avoidFor: string[]
}

const DIRECTIONS: Record<string, DirInfo> = {
  N: {
    name:'North', sanskrit:'Uttara', deity:'Kubera', element:'Water',
    color:'#22c55e', icon:'⬆',
    general:['Wealth & prosperity zone',"Mercury's direction",'Liquid gains, business'],
    benefic:['Financial windfalls','Career growth','New opportunities'],
    malefic:['Loss of wealth','Business disputes','Missed chances'],
    bestFor:['Starting a business','Financial decisions','Career matters','Wealth accumulation'],
    avoidFor:['Spiritual matters','Rest/sleep'],
  },
  NE: {
    name:'NorthEast', sanskrit:'Ishanya', deity:'Ishana (Shiva)', element:'Water+Ether',
    color:'#DAA520', icon:'↗',
    general:['Most auspicious direction',"Jupiter's primary zone",'Divinity, grace, knowledge'],
    benefic:['Divine blessings','Wisdom and clarity','Quick recovery','Success in anything'],
    malefic:['Very rare — even malefics here lose power','Confusion only if center weak'],
    bestFor:['Spiritual practice','Education','Health matters','Any new beginning','Puja/meditation'],
    avoidFor:['Storing heavy items','Toilets/bathrooms (Vastu)'],
  },
  E: {
    name:'East', sanskrit:'Purva', deity:'Indra (Sun)', element:'Fire+Air',
    color:'#f59e0b', icon:'➡',
    general:['New beginnings & sunrise',"Sun's direction",'Health, vitality, fame'],
    benefic:['New start succeeds','Recovery from illness','Recognition & promotion'],
    malefic:['Blocked new beginnings','Health setbacks','Loss of reputation'],
    bestFor:['Starting ventures','Health queries','Career recognition','Birth/new projects'],
    avoidFor:['Endings/closures','Ancestral rites'],
  },
  SE: {
    name:'SouthEast', sanskrit:'Agneya', deity:'Agni (Fire God)', element:'Fire',
    color:'#ef4444', icon:'↘',
    general:['Fire element zone','Mars & Venus combination','Energy, passion, disputes'],
    benefic:['Controlled passion','Good digestion','Romantic success'],
    malefic:['Accidents & burns','Legal disputes','Inflammatory disease'],
    bestFor:['Passion projects','Kitchen/cooking','Athletic endeavors'],
    avoidFor:['Legal matters (if malefic)','Peace & harmony'],
  },
  S: {
    name:'South', sanskrit:'Dakshina', deity:'Yama', element:'Earth',
    color:'#94a3b8', icon:'⬇',
    general:['Saturn\'s natural direction','Death, endings, karma','Discipline & ancestral karma'],
    benefic:['Completion of long tasks','Ancestral blessings','Spiritual depth'],
    malefic:['Severe obstacles & delays','Chronic illness','Death of endeavors'],
    bestFor:['Spiritual practices','Renunciation','Ending bad habits','Ancestral rites'],
    avoidFor:['Starting new ventures','Health matters','Financial decisions'],
  },
  SW: {
    name:'SouthWest', sanskrit:'Nairutya', deity:'Niritti (Rahu)', element:'Earth',
    color:'#7c3aed', icon:'↙',
    general:['Rahu\'s influence zone','Stability, hidden matters','Underground/secret things'],
    benefic:['Grounding & stability','Occult knowledge','Revealed secrets'],
    malefic:['Hidden enemies emerge','Betrayal & deception','Depression & heaviness'],
    bestFor:['Occult research','Real estate queries','Uncovering secrets'],
    avoidFor:['Starting new ventures','Public matters','Transparent dealings'],
  },
  W: {
    name:'West', sanskrit:'Paschima', deity:'Varuna (Saturn)', element:'Water',
    color:'#3b82f6', icon:'⬅',
    general:['Setting sun — completion','Saturn\'s secondary zone','Results, harvest, fulfillment'],
    benefic:['Fruits of past effort','Children & creativity','Eventual success'],
    malefic:['Delays but not denial','Past karma demanding payment'],
    bestFor:['Completing projects','Receiving results','Children\'s matters','Investment returns'],
    avoidFor:['Quick results','Aggressive action'],
  },
  NW: {
    name:'NorthWest', sanskrit:'Vayavya', deity:'Vayu (Wind God)', element:'Air',
    color:'#a78bfa', icon:'↖',
    general:['Air element — movement','Moon & Mercury zone','Travel, change, instability'],
    benefic:['Successful travel','Good communication','Networking & trade'],
    malefic:['Restlessness & instability','Scattered energy','Frequent changes'],
    bestFor:['Travel questions','Job change queries','Communication/networking'],
    avoidFor:['Stability matters','Long-term commitments'],
  },
}

/** 27 nakshatra classical vedha pairs (each afflicts the listed nakshatras) */
const VEDHA_PAIRS: Record<number, number[]> = {
  0: [16,18],   // Ashwini ↔ Jyeshtha, Moola
  1: [15,17],   // Bharani ↔ Vishakha, Jyeshtha
  2: [14,19],   // Krittika ↔ Swati, Purva Ashadha
  3: [13,20],   // Rohini ↔ Chitra, Uttara Ashadha
  4: [12,21],   // Mrigashira ↔ Hasta, Shravana
  5: [11,22],   // Ardra ↔ Uttara Phalguni, Dhanishtha
  6: [10,23],   // Punarvasu ↔ Purva Phalguni, Shatabhisha
  7: [9,24],    // Pushya ↔ Magha, Purva Bhadrapada
  8: [8,25],    // Ashlesha ↔ Ashlesha (self), Uttara Bhadrapada (exception)
  9: [7,25],    // Magha ↔ Pushya, Uttara Bhadrapada
  10: [6,26],   // Purva Phalguni ↔ Punarvasu, Revati
  11: [5,0],    // Uttara Phalguni ↔ Ardra, Ashwini
  12: [4,1],    // Hasta ↔ Mrigashira, Bharani
  13: [3,2],    // Chitra ↔ Rohini, Krittika
  14: [2,26],   // Swati ↔ Krittika, Revati
  15: [1,25],   // Vishakha ↔ Bharani, Uttara Bhadrapada
  16: [0,24],   // Anuradha ↔ Ashwini, Purva Bhadrapada
  17: [0,23],   // Jyeshtha ↔ Ashwini, Shatabhisha
  18: [0,22],   // Moola ↔ Ashwini, Dhanishtha
  19: [2,21],   // Purva Ashadha ↔ Krittika, Shravana
  20: [3,20],   // Uttara Ashadha ↔ Rohini, (self-row)
  21: [4,19],   // Shravana ↔ Mrigashira, Purva Ashadha
  22: [5,18],   // Dhanishtha ↔ Ardra, Moola
  23: [6,17],   // Shatabhisha ↔ Punarvasu, Jyeshtha
  24: [7,16],   // Purva Bhadrapada ↔ Pushya, Anuradha
  25: [8,15],   // Uttara Bhadrapada ↔ Ashlesha, Vishakha
  26: [9,14],   // Revati ↔ Magha, Swati
}

/** Question category to ideal direction for positive answer */
const PRASHNA_CATEGORIES = [
  { id:'business',    label:'Business/Career',   icon:'💼', idealDir:['N','NE'],   sigPlanet:'Ju',  description:'Will this venture/job succeed?' },
  { id:'health',      label:'Health/Recovery',    icon:'❤️', idealDir:['E','NE'],   sigPlanet:'Su',  description:'Will the patient recover?' },
  { id:'marriage',    label:'Marriage/Relationship',icon:'💍',idealDir:['E','NE'],  sigPlanet:'Ve',  description:'Will this relationship succeed?' },
  { id:'finance',     label:'Wealth/Finance',     icon:'💰', idealDir:['N','NE'],   sigPlanet:'Ju',  description:'Will there be financial gain?' },
  { id:'travel',      label:'Journey/Travel',     icon:'✈️', idealDir:['NW','NE'],  sigPlanet:'Mo',  description:'Will the journey be safe/successful?' },
  { id:'property',    label:'Property/Real Estate',icon:'🏠',idealDir:['SW','N'],   sigPlanet:'Sa',  description:'Is this property deal favorable?' },
  { id:'court',       label:'Legal/Court Case',   icon:'⚖️', idealDir:['E','NE'],   sigPlanet:'Su',  description:'Will I win the case?' },
  { id:'education',   label:'Education/Exam',     icon:'📚', idealDir:['NE','N'],   sigPlanet:'Ju',  description:'Will I pass/succeed in studies?' },
  { id:'spiritual',   label:'Spiritual/Liberation',icon:'🙏',idealDir:['NE','N'],   sigPlanet:'Ju',  description:'Is this spiritual path right for me?' },
  { id:'lost',        label:'Lost Object/Person', icon:'🔍', idealDir:['all'],      sigPlanet:'Mo',  description:'Where is the lost item/person?' },
]

/** Prediction mode configs */
const PREDICT_MODES: Record<PredictMode, {
  label: string; icon: string; color: string
  sigPlanets: string[]
  positiveDir: string[]
  negativeDir: string[]
  method: string[]
}> = {
  lost: {
    label:'Lost Object/Person', icon:'🔍', color:'#f59e0b',
    sigPlanets:['Mo','Me'],
    positiveDir:['N','NE','E'],
    negativeDir:['S','SW'],
    method:[
      'Moon = direction to search (Moon\'s nakshatra direction from grid)',
      'Mercury = nature of object (communication=documents, mobile; business=files)',
      'Saturn in South = buried/hidden underground',
      'Mars = stolen by force, look East/SE',
      'Rahu = lost in foreign/unfamiliar place; check NW/SW',
      'Venus = jewelry/luxury item; check safe/bedroom area',
      'Jupiter = sacred/educational item; check NE corner',
    ],
  },
  disease: {
    label:'Disease Prognosis', icon:'🏥', color:'#ef4444',
    sigPlanets:['Su','Mo','Ju'],
    positiveDir:['E','NE'],
    negativeDir:['S','SW','SE'],
    method:[
      'Sun = vitality; Sun in E/NE = recovery assured',
      'Jupiter = healing; Jupiter in NE = divine cure',
      'Moon = mind/emotions; Moon in good position = patient cooperates',
      'Saturn in S/SW with vedha = chronic/long-term illness',
      'Mars in SE = fever, inflammation, surgery needed',
      'Rahu/Ketu vedha = mysterious diagnosis, misdiagnosis risk',
      'Multiple benefics positive = early recovery; malefics = prolonged',
    ],
  },
  travel: {
    label:'Journey Safety', icon:'✈️', color:'#22c55e',
    sigPlanets:['Mo','Me','Ju'],
    positiveDir:['NE','N','NW'],
    negativeDir:['S','SW','SE'],
    method:[
      'Moon in NW = safe comfortable journey',
      'Jupiter in NE = divine protection; journey auspicious',
      'Mercury in N = smooth journey, good connections',
      'Mars in SE or SW with vedha = accidents; postpone if possible',
      'Saturn in S = delays, cancellations, heavy journey',
      'Rahu in NW = journey happens but unexpected experiences',
      'No vedha + benefics positive = proceed with confidence',
    ],
  },
  court: {
    label:'Court Case Outcome', icon:'⚖️', color:'#a78bfa',
    sigPlanets:['Su','Ju','Ma'],
    positiveDir:['E','NE','N'],
    negativeDir:['S','SW'],
    method:[
      'Sun (querent) stronger than opponent = victory',
      'Jupiter in NE = justice prevails, court favorable',
      'Mars in querent\'s favor direction = aggressive victory',
      'Saturn in S/opponent\'s direction = opponent faces delays',
      'Mercury in N = settlement/negotiation more likely than verdict',
      'Rahu/Ketu vedha on opponent\'s nakshatra = opponent disadvantaged',
      'Moon positive = emotional/family court favorable',
    ],
  },
}

// ── Helper functions ──────────────────────────────────────────

function getPlanetDirections(transitRaw: SBCGrahaInput[]): Record<string, { planets: string[]; direction: string }> {
  const dirMap: Record<string, string[]> = {}
  transitRaw
    .filter(g => !['Ur','Ne','Pl'].includes(g.id))
    .forEach(g => {
      const nak = nakFromLon(g.lonSidereal)
      const dir = NAK_DIRECTION[nak] ?? 'C'
      if (!dirMap[dir]) dirMap[dir] = []
      dirMap[dir].push(g.id)
    })
  return Object.fromEntries(
    Object.entries(dirMap).map(([dir, planets]) => [dir, { planets, direction: dir }])
  )
}

function analyzeDirection(dir: string, planets: string[]): { score: number; verdict: string; color: string } {
  let score = 0
  planets.forEach(p => {
    if (['Ju','Ve'].includes(p)) score += 2
    else if (['Me','Mo'].includes(p)) score += 1
    else if (['Su'].includes(p)) score += 0
    else if (['Ma'].includes(p)) score -= 1
    else if (['Sa','Ra','Ke'].includes(p)) score -= 2
  })
  if (planets.length === 0) score = 0
  const verdict = score >= 3 ? 'Excellent' : score >= 1 ? 'Favorable' : score === 0 ? 'Neutral' : score >= -1 ? 'Cautious' : 'Unfavorable'
  const color   = score >= 3 ? '#4db66a' : score >= 1 ? '#a3c65a' : score === 0 ? '#c9a84c' : score >= -1 ? '#FF8C00' : '#e84040'
  return { score, verdict, color }
}

function analyzePrashna(
  catId: string,
  transitRaw: SBCGrahaInput[],
  natalGrahas: SBCGrahaInput[],
  tithi: TithiInfo | null | undefined,
  analysis: SBCAnalysisExtended | null,
): {
  verdict: string; confidence: number; color: string
  reasons: { text: string; positive: boolean }[]
  recommendation: string
} {
  const cat     = PRASHNA_CATEGORIES.find(c => c.id === catId)!
  const dirMap  = getPlanetDirections(transitRaw)
  const natalMap = getPlanetDirections(natalGrahas)
  const reasons: { text: string; positive: boolean }[] = []
  let score = 0

  // Check significator planet
  const sigNak = transitRaw.find(g => g.id === cat.sigPlanet)
  const natalSig = natalGrahas.find(g => g.id === cat.sigPlanet)
  if (sigNak) {
    const sigDir = NAK_DIRECTION[nakFromLon(sigNak.lonSidereal)] ?? ''
    if (cat.idealDir.includes(sigDir) || cat.idealDir.includes('all')) {
      score += 3
      reasons.push({ text: `${PLANET_NAME[cat.sigPlanet]} (significator) in ${sigDir} — favorable direction ✓`, positive: true })
    } else {
      score -= 1
      reasons.push({ text: `${PLANET_NAME[cat.sigPlanet]} (significator) in ${sigDir} — not in ideal direction`, positive: false })
    }
  }
  if (natalSig) {
    const natalSigDir = NAK_DIRECTION[nakFromLon(natalSig.lonSidereal)] ?? ''
    if (cat.idealDir.includes(natalSigDir) || cat.idealDir.includes('all')) {
      score += 1
      reasons.push({ text: `Natal ${PLANET_NAME[cat.sigPlanet]} in ${natalSigDir} supports this query`, positive: true })
    } else {
      score -= 1
      reasons.push({ text: `Natal ${PLANET_NAME[cat.sigPlanet]} in ${natalSigDir} gives mixed support`, positive: false })
    }
  }

  // Check ideal directions for benefics
  cat.idealDir.slice(0, 2).forEach(dir => {
    const dp = dirMap[dir]?.planets ?? []
    const natalDp = natalMap[dir]?.planets ?? []
    dp.forEach(p => {
      if (['Ju','Ve','Me','Mo'].includes(p)) {
        score += 2
        reasons.push({ text: `${PLANET_NAME[p]} in ${dir} (ideal direction) — divine support`, positive: true })
      } else if (['Sa','Ma','Ra','Ke'].includes(p)) {
        score -= 1
        reasons.push({ text: `${PLANET_NAME[p]} in ${dir} (ideal direction) — malefic present, caution`, positive: false })
      }
    })
    natalDp.forEach(p => {
      if (['Ju','Ve','Me','Mo'].includes(p)) {
        score += 1
        reasons.push({ text: `Natal ${PLANET_NAME[p]} in ${dir} adds foundational support`, positive: true })
      } else if (['Sa','Ma','Ra','Ke'].includes(p)) {
        score -= 1
        reasons.push({ text: `Natal ${PLANET_NAME[p]} in ${dir} adds karmic friction`, positive: false })
      }
    })
  })

  // Tithi check
  if (tithi?.paksha === 'shukla') {
    score += 1; reasons.push({ text: 'Shukla Paksha — waxing moon favors new endeavors', positive: true })
  } else if (tithi?.paksha === 'krishna') {
    score -= 1; reasons.push({ text: 'Krishna Paksha — waning moon suggests caution', positive: false })
  }

  // Financial pulse for business/finance
  if (['business','finance'].includes(catId) && analysis?.financialPulse) {
    const fp = analysis.financialPulse
    if (fp.score > 5) { score += 1; reasons.push({ text: `SBC financial pulse positive (+${fp.score})`, positive: true }) }
    if (fp.score < -5) { score -= 1; reasons.push({ text: `SBC financial pulse negative (${fp.score})`, positive: false }) }
  }

  // Birth nak afflicted?
  if (analysis?.birthNakAffected) {
    score -= 1; reasons.push({ text: 'Birth nakshatra afflicted — personal challenges present', positive: false })
  }

  const confidence  = Math.min(95, Math.max(10, 50 + score * 8))
  const verdict     = score >= 3 ? 'Yes — Strongly Favorable' : score >= 1 ? 'Yes — Favorable' : score === 0 ? 'Uncertain — Neutral' : score >= -2 ? 'Delay — Needs Timing' : 'No — Unfavorable'
  const color       = score >= 3 ? '#4db66a' : score >= 1 ? '#a3c65a' : score === 0 ? '#c9a84c' : score >= -2 ? '#FF8C00' : '#e84040'
  const recommendation = score >= 3
    ? 'Proceed with confidence. This is an auspicious time for this endeavor.'
    : score >= 1
    ? 'Proceed, but remain attentive. Some minor obstacles may arise but outcome is favorable.'
    : score === 0
    ? 'Neutral period. Seek more favorable timing if possible. Outcome uncertain.'
    : score >= -2
    ? 'Delay the action. Wait for better planetary positioning. Obstacles currently strong.'
    : 'Strongly advised to wait or reconsider. Current planetary configuration is unfavorable.'

  return { verdict, confidence, color, reasons, recommendation }
}

function analyzeFiveFold(
  transitRaw:  SBCGrahaInput[],
  tithi:       TithiInfo | null | undefined,
  transitDate: string,
  analysis:    SBCAnalysisExtended | null,
): {
  nakshatra: { ok: boolean; detail: string }
  tithi:     { ok: boolean; detail: string }
  vara:      { ok: boolean; detail: string }
  rashi:     { ok: boolean; detail: string }
  graha:     { ok: boolean; detail: string }
  score:     number
} {
  // 1. Nakshatra vedha check
  const nakOk = !analysis?.birthNakAffected
  const nakDetail = nakOk
    ? 'No malefic vedha on birth nakshatra — clear'
    : 'Malefic vedha on birth nakshatra — afflicted'

  // 2. Tithi check
  const tithiOk = tithi ? (tithi.quality === 'best' || tithi.quality === 'good') : true
  const tithiDetail = tithi
    ? `${tithi.name} — ${tithi.quality} quality (${tithi.paksha === 'shukla' ? '☽ Shukla — Benefic' : '🌑 Krishna — Cautious'})`
    : 'Tithi data unavailable'

  // 3. Vara (weekday) check
  const dow = new Date(transitDate + 'T12:00:00').getDay()
  const GOOD_DAYS = [4, 5, 3] // Thu, Fri, Wed — Jupiter, Venus, Mercury
  const BAD_DAYS  = [2, 6]    // Tue, Sat — Mars, Saturn
  const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const DAY_LORDS = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn']
  const varaOk  = GOOD_DAYS.includes(dow)
  const varaBad = BAD_DAYS.includes(dow)
  const varaDetail = `${DAY_NAMES[dow]} (${DAY_LORDS[dow]} vara) — ${varaOk ? 'Auspicious weekday' : varaBad ? 'Malefic weekday — caution' : 'Neutral weekday'}`

  // 4. Rashi vedha check — are any malefics casting vedha on natal rashi?
  const maleficVedhasOnRashi = (analysis?.vedhas ?? []).filter(v =>
    v.isMalefic && v.affectedRashis.length > 0
  )
  const rashiOk = maleficVedhasOnRashi.length === 0
  const rashiDetail = rashiOk
    ? 'No malefic vedha on natal rashi positions — clear'
    : `${maleficVedhasOnRashi.map(v => PLANET_NAME[v.planet]).join(', ')} casting vedha on natal rashi`

  // 5. Graha vedha — benefic vs malefic count
  const beneficVedha = (analysis?.vedhas ?? []).filter(v => !v.isMalefic).length
  const maleficVedha = (analysis?.vedhas ?? []).filter(v => v.isMalefic).length
  const grahaOk = beneficVedha >= maleficVedha
  const grahaDetail = `${beneficVedha} benefic vs ${maleficVedha} malefic planetary vedha — ${grahaOk ? 'Benefics dominant' : 'Malefics dominant — caution'}`

  const score = [nakOk, tithiOk, !varaBad, rashiOk, grahaOk].filter(Boolean).length

  return {
    nakshatra: { ok: nakOk, detail: nakDetail },
    tithi:     { ok: tithiOk, detail: tithiDetail },
    vara:      { ok: !varaBad, detail: varaDetail },
    rashi:     { ok: rashiOk, detail: rashiDetail },
    graha:     { ok: grahaOk, detail: grahaDetail },
    score,
  }
}

// ── Sub-components ─────────────────────────────────────────────

function SectionTitle({ icon, title, sub }: { icon:string; title:string; sub:string }) {
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'0.6rem' }}>
        <span style={{ fontSize:'1.25rem' }}>{icon}</span>
        <h3 style={{ margin:0, fontSize:'1rem', fontWeight:800, color:'var(--text-primary)' }}>{title}</h3>
      </div>
      <p style={{ margin:'2px 0 0 1.85rem', fontSize:'0.72rem', color:'var(--text-muted)' }}>{sub}</p>
    </div>
  )
}

function OkBadge({ ok }: { ok: boolean }) {
  return (
    <span style={{
      fontSize:'0.6rem', fontWeight:800, padding:'2px 8px', borderRadius:20,
      background: ok ? 'rgba(77,182,106,0.15)' : 'rgba(232,64,64,0.15)',
      color: ok ? '#4db66a' : '#e84040',
      border: `1px solid ${ok ? '#4db66a' : '#e84040'}40`,
      textTransform:'uppercase', letterSpacing:'0.06em',
    }}>{ok ? '✓ Clear' : '✗ Afflicted'}</span>
  )
}

// ── Compass SVG ───────────────────────────────────────────────

function DirectionCompass({
  dirMap,
  natalDirMap,
  isMobile,
}: {
  dirMap: Record<string, { planets: string[] }>
  natalDirMap: Record<string, { planets: string[] }>
  isMobile: boolean
}) {
  const size = isMobile ? 260 : 320
  const cx = size/2, cy = size/2, r = size*0.38

  const dirs: { key: string; angle: number; label: string }[] = [
    { key:'N',  angle:-90,  label:'N'  },
    { key:'NE', angle:-45,  label:'NE' },
    { key:'E',  angle:0,    label:'E'  },
    { key:'SE', angle:45,   label:'SE' },
    { key:'S',  angle:90,   label:'S'  },
    { key:'SW', angle:135,  label:'SW' },
    { key:'W',  angle:180,  label:'W'  },
    { key:'NW', angle:-135, label:'NW' },
  ]

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ maxWidth:'100%' }}>
      {/* Outer ring */}
      <circle cx={cx} cy={cy} r={r+8} fill="none" stroke="rgba(201,168,76,0.15)" strokeWidth={1} />
      <circle cx={cx} cy={cy} r={r*0.35} fill="rgba(201,168,76,0.08)" stroke="rgba(201,168,76,0.3)" strokeWidth={1} />

      {/* Direction segments */}
      {dirs.map(d => {
        const rad   = (d.angle * Math.PI) / 180
        const x     = cx + r * Math.cos(rad)
        const y     = cy + r * Math.sin(rad)
        const info  = DIRECTIONS[d.key]
        const dp    = dirMap[d.key]?.planets ?? []
        const natalDp = natalDirMap[d.key]?.planets ?? []
        const { score, verdict, color } = analyzeDirection(d.key, dp)

        const labelX = cx + (r+20) * Math.cos(rad)
        const labelY = cy + (r+20) * Math.sin(rad)

        return (
          <g key={d.key}>
            {/* Spoke line */}
            <line x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(201,168,76,0.1)" strokeWidth={1} />
            {/* Node circle */}
            <circle cx={x} cy={y} r={isMobile ? 18 : 22} fill={`${color}18`} stroke={color} strokeWidth={1.5} />
            {/* Direction label */}
            <text x={x} y={y-5} textAnchor="middle" dominantBaseline="middle" fontSize={isMobile?8:9} fontWeight="800" fill={color}>{d.label}</text>
            {/* Deity */}
            <text x={x} y={y+6} textAnchor="middle" dominantBaseline="middle" fontSize={isMobile?6:7} fill={color} opacity={0.8}>{info.deity.split(' ')[0]}</text>
            {/* Planet dots */}
            {dp.slice(0,3).map((p, i) => (
              <circle
                key={p}
                cx={x + (i - (dp.length-1)/2) * (isMobile?7:9)}
                cy={y + (isMobile?14:17)}
                r={isMobile?4:5}
                fill={PLANET_COLOR[p as GrahaId] ?? '#888'}
                stroke="rgba(0,0,0,0.3)"
                strokeWidth={0.8}
              >
                <title>{PLANET_NAME[p]}</title>
              </circle>
            ))}
            {natalDp.slice(0,2).map((p, i) => (
              <circle
                key={`${p}-natal`}
                cx={x + (i - (natalDp.length-1)/2) * (isMobile?8:10)}
                cy={y + (isMobile?24:28)}
                r={isMobile?3.5:4}
                fill="transparent"
                stroke={PLANET_COLOR[p as GrahaId] ?? '#888'}
                strokeWidth={1.3}
              >
                <title>{`Natal ${PLANET_NAME[p]}`}</title>
              </circle>
            ))}
            {/* Outer direction name */}
            <text x={labelX} y={labelY} textAnchor="middle" dominantBaseline="middle" fontSize={isMobile?6.5:7.5} fill="var(--text-muted)" opacity={0.7}>{info.name.split('')[0]}</text>
          </g>
        )
      })}

      {/* Center text */}
      <text x={cx} y={cy-8} textAnchor="middle" fontSize={isMobile?7.5:9} fontWeight="700" fill="var(--text-gold)">Brahma</text>
      <text x={cx} y={cy+4} textAnchor="middle" fontSize={isMobile?6:7} fill="var(--text-muted)">Sthana</text>
      <text x={cx} y={cy+15} textAnchor="middle" fontSize={isMobile?6:6.5} fill="var(--text-muted)">Center</text>

      {/* Cardinal markers */}
      {[{l:'N',x:cx,y:8},{l:'E',x:size-8,y:cy},{l:'S',x:cx,y:size-6},{l:'W',x:6,y:cy}].map(m=>(
        <text key={m.l} x={m.x} y={m.y} textAnchor="middle" dominantBaseline="middle" fontSize={9} fontWeight="800" fill="rgba(201,168,76,0.5)">{m.l}</text>
      ))}
    </svg>
  )
}

// ── Main Component ─────────────────────────────────────────────

export function SBCAdvancedPanel({ grid, transitRaw, natalGrahas, analysis, tithi, transitDate, isMobile }: Props) {
  const [activeTab,     setActiveTab]     = useState<AdvTab>('directions')
  const [prashnaQuery,  setPrashnaQuery]  = useState('business')
  const [predictMode,   setPredictMode]   = useState<PredictMode>('lost')
  const [expandedDir,   setExpandedDir]   = useState<string | null>(null)

  const dirMap  = useMemo(() => getPlanetDirections(transitRaw), [transitRaw])
  const natalDirMap = useMemo(() => getPlanetDirections(natalGrahas), [natalGrahas])
  const pResult = useMemo(
    () => analyzePrashna(prashnaQuery, transitRaw, natalGrahas, tithi, analysis),
    [prashnaQuery, transitRaw, natalGrahas, tithi, analysis]
  )
  const ff      = useMemo(() => analyzeFiveFold(transitRaw, tithi, transitDate, analysis), [transitRaw, tithi, transitDate, analysis])

  const currentMoonNak = useMemo(() => {
    const mo = transitRaw.find(g => g.id === 'Mo')
    return mo ? nakFromLon(mo.lonSidereal) : -1
  }, [transitRaw])

  const ADV_TABS: { id: AdvTab; icon: string; label: string }[] = [
    { id:'directions', icon:'🧭', label:'8 Directions' },
    { id:'prashna',    icon:'🔮', label:'Prashna'      },
    { id:'fivefold',   icon:'🪔', label:'5-Fold Check' },
    { id:'predict',    icon:'🔍', label:'Predict Mode' },
    { id:'vedhamap',   icon:'📜', label:'Vedha Pairs'  },
  ]

  return (
    <section style={{ marginTop:'1.5rem' }}>

      {/* Header */}
      <div style={{
        background:'linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(201,168,76,0.07) 100%)',
        border:'1px solid rgba(139,92,246,0.25)',
        borderRadius:'20px 20px 0 0',
        padding: isMobile ? '0.9rem' : '1.25rem 1.5rem',
        display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'space-between', gap:'0.75rem',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.875rem' }}>
          <div style={{ width:44, height:44, borderRadius:'50%', background:'rgba(139,92,246,0.15)', border:'2px solid rgba(139,92,246,0.4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.4rem' }}>🔭</div>
          <div>
            <h2 style={{ margin:0, fontFamily:'var(--font-display)', fontSize:'clamp(1rem,2.5vw,1.2rem)', fontWeight:800, color:'var(--text-primary)' }}>
              Advanced SBC Analysis Engine
            </h2>
            <p style={{ margin:'2px 0 0', fontSize:'0.72rem', color:'var(--text-muted)' }}>
              Prashna · 5-Fold Muhurta · 8 Directions · Prediction Modes · Vedha Pairs
            </p>
          </div>
        </div>
        <div style={{ padding:'0.35rem 0.75rem', borderRadius:20, background:'rgba(139,92,246,0.12)', border:'1px solid rgba(139,92,246,0.28)', fontSize:'0.68rem', color:'#a78bfa', fontWeight:700, width:isMobile ? '100%' : 'auto', textAlign:isMobile ? 'center' : 'left' }}>
          Natal planets: {natalGrahas.length || 0} · Transit planets: {transitRaw.length || 0}
        </div>
        {analysis?.birthNakAffected && (
          <div style={{ padding:'0.4rem 0.875rem', borderRadius:20, background:'rgba(232,64,64,0.12)', border:'1px solid rgba(232,64,64,0.3)', fontSize:'0.72rem', color:'#e84040', fontWeight:700 }}>
            ⚠ Birth Nakshatra Afflicted
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div style={{ display:'flex', overflowX:'auto', gap:2, background:'var(--surface-2)', padding:'4px 6px', borderLeft:'1px solid var(--border-soft)', borderRight:'1px solid var(--border-soft)', scrollbarWidth:'none' }}>
        {ADV_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flexShrink:0, padding:'0.45rem 0.9rem', borderRadius:10, border:'none', cursor:'pointer',
              background: activeTab === tab.id ? 'var(--surface-0)' : 'transparent',
              color: activeTab === tab.id ? '#a78bfa' : 'var(--text-muted)',
              fontWeight: activeTab === tab.id ? 700 : 500,
              fontSize:'0.72rem', whiteSpace:'nowrap',
              boxShadow: activeTab === tab.id ? '0 2px 10px rgba(0,0,0,0.2)' : 'none',
              transition:'all 0.2s',
              display:'flex', alignItems:'center', gap:'0.35rem',
            }}
          >
            <span>{tab.icon}</span><span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ background:'var(--surface-1)', border:'1px solid var(--border-soft)', borderTop:'none', borderRadius:'0 0 16px 16px', padding:isMobile ? '0.9rem' : '1.5rem' }}>

        {/* ════ 8-DIRECTIONS ════ */}
        {activeTab === 'directions' && (
          <div>
            <SectionTitle icon="🧭" title="8-Direction Planetary Analysis" sub="Each of the 8 Vastu directions — which planets are present and what they signify" />

            <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:'1.5rem', alignItems:'start' }}>

              {/* Compass SVG */}
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'0.75rem' }}>
                <DirectionCompass dirMap={dirMap} natalDirMap={natalDirMap} isMobile={isMobile} />
                <div style={{ width:'100%', padding:'0.65rem 0.875rem', background:'rgba(201,168,76,0.06)', borderRadius:10, fontSize:'0.68rem', color:'var(--text-muted)', lineHeight:1.5, textAlign:'center' }}>
                  <strong style={{ color:'var(--text-gold)' }}>Legend:</strong> Solid dots = transit planets · hollow dots = natal planets in same direction
                </div>
                {/* Planet legend */}
                <div style={{ display:'flex', flexWrap:'wrap', gap:'0.35rem', justifyContent:'center' }}>
                  {Object.entries(PLANET_NAME).slice(0,9).map(([id, name]) => (
                    <div key={id} style={{ display:'flex', alignItems:'center', gap:'0.25rem' }}>
                      <div style={{ width:10, height:10, borderRadius:'50%', background:PLANET_COLOR[id as GrahaId] ?? '#888' }} />
                      <span style={{ fontSize:'0.6rem', color:'var(--text-muted)' }}>{name}</span>
                    </div>
                  ))}
                </div>
                <div style={{ width:'100%', display:'grid', gridTemplateColumns:isMobile ? 'repeat(2, minmax(0, 1fr))' : 'repeat(4, minmax(0, 1fr))', gap:'0.35rem' }}>
                  {Object.keys(DIRECTIONS).map((d) => (
                    <div key={d} style={{ background:'var(--surface-2)', border:'1px solid var(--border-soft)', borderRadius:8, padding:'0.35rem', textAlign:'center' }}>
                      <div style={{ fontSize:'0.58rem', color:'var(--text-muted)' }}>{d}</div>
                      <div style={{ fontSize:'0.62rem', color:'var(--text-secondary)' }}>
                        T:{(dirMap[d]?.planets ?? []).length} · N:{(natalDirMap[d]?.planets ?? []).length}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Direction cards */}
              <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
                {Object.entries(DIRECTIONS).map(([key, info]) => {
                  const dp      = dirMap[key]?.planets ?? []
                  const { score, verdict, color } = analyzeDirection(key, dp)
                  const isExpanded = expandedDir === key

                  return (
                    <div key={key} style={{ background:'var(--surface-2)', borderRadius:12, border:`1.5px solid ${color}28`, overflow:'hidden' }}>
                      <button
                        onClick={() => setExpandedDir(isExpanded ? null : key)}
                        style={{ width:'100%', display:'flex', alignItems:'center', gap:'0.65rem', padding:'0.65rem 0.875rem', background:'none', border:'none', cursor:'pointer', textAlign:'left' }}
                      >
                        {/* Direction icon + score */}
                        <div style={{ width:32, height:32, borderRadius:'50%', background:`${color}18`, border:`2px solid ${color}50`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1rem', flexShrink:0 }}>{info.icon}</div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:700, fontSize:isMobile ? '0.74rem' : '0.8rem', color:'var(--text-primary)', display:'flex', alignItems:'center', gap:'0.4rem', flexWrap:'wrap' }}>
                            <span style={{ color }}>{key}</span>
                            <span>— {info.name}</span>
                            {!isMobile && <span style={{ fontSize:'0.62rem', color:'var(--text-muted)' }}>{info.deity}</span>}
                          </div>
                          <div style={{ fontSize:'0.62rem', color:'var(--text-muted)' }}>{info.element} · {info.sanskrit}</div>
                        </div>
                        {/* Planets present */}
                        <div style={{ display:'flex', gap:'0.2rem', flexShrink:0 }}>
                          {dp.map(p => (
                            <div key={p} style={{ width:20, height:20, borderRadius:'50%', background:PLANET_COLOR[p as GrahaId]??'#888', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.55rem', fontWeight:800, color:'#fff' }} title={PLANET_NAME[p]}>
                              {p}
                            </div>
                          ))}
                          {dp.length === 0 && <span style={{ fontSize:'0.6rem', color:'var(--text-muted)' }}>empty</span>}
                        </div>
                        {!isMobile && <span style={{ fontSize:'0.62rem', fontWeight:800, padding:'2px 7px', borderRadius:10, background:`${color}15`, color, border:`1px solid ${color}30`, flexShrink:0, marginLeft:'0.25rem' }}>{verdict}</span>}
                        <span style={{ color:'var(--text-muted)', fontSize:'0.7rem', transform: isExpanded ? 'rotate(180deg)' : 'none', transition:'transform 0.2s' }}>▾</span>
                      </button>

                      {isExpanded && (
                        <div style={{ padding:'0 0.875rem 0.875rem', borderTop:'1px solid var(--border-soft)' }}>
                          <div style={{ paddingTop:'0.65rem', display:'grid', gridTemplateColumns:isMobile ? '1fr' : '1fr 1fr', gap:'0.75rem', fontSize:'0.68rem' }}>
                            <div>
                              <div style={{ fontWeight:700, color:'var(--teal)', marginBottom:'0.3rem', fontSize:'0.62rem', textTransform:'uppercase' }}>If Benefic Here</div>
                              {info.benefic.map(b => <div key={b} style={{ color:'var(--text-secondary)', lineHeight:1.45, marginBottom:2 }}>↑ {b}</div>)}
                            </div>
                            <div>
                              <div style={{ fontWeight:700, color:'var(--rose)', marginBottom:'0.3rem', fontSize:'0.62rem', textTransform:'uppercase' }}>If Malefic Here</div>
                              {info.malefic.map(b => <div key={b} style={{ color:'var(--text-secondary)', lineHeight:1.45, marginBottom:2 }}>↓ {b}</div>)}
                            </div>
                          </div>
                          <div style={{ marginTop:'0.65rem', padding:'0.5rem 0.65rem', background:`${color}08`, borderRadius:8 }}>
                            <div style={{ fontSize:'0.62rem', fontWeight:700, color, marginBottom:'0.25rem' }}>Best For</div>
                            <div style={{ fontSize:'0.65rem', color:'var(--text-secondary)', lineHeight:1.4 }}>{info.bestFor.join(' · ')}</div>
                          </div>
                          {/* Currently placed planets */}
                          {dp.length > 0 && (
                            <div style={{ marginTop:'0.5rem', padding:'0.5rem 0.65rem', background:'var(--surface-3)', borderRadius:8 }}>
                              <div style={{ fontSize:'0.62rem', fontWeight:700, color:'var(--text-muted)', marginBottom:'0.25rem' }}>Currently Placed</div>
                              {dp.map(p => {
                                const isMal = ['Sa','Ma','Ra','Ke'].includes(p)
                                return (
                                  <div key={p} style={{ display:'flex', alignItems:'center', gap:'0.4rem', fontSize:'0.68rem', marginBottom:2 }}>
                                    <div style={{ width:8, height:8, borderRadius:'50%', background:PLANET_COLOR[p as GrahaId]??'#888' }} />
                                    <span style={{ fontWeight:700, color:PLANET_COLOR[p as GrahaId]??'var(--text-secondary)' }}>{PLANET_NAME[p]}</span>
                                    <span style={{ color: isMal ? 'var(--rose)' : 'var(--teal)', fontSize:'0.62rem' }}>
                                      {isMal ? info.malefic[0] : info.benefic[0]}
                                    </span>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ════ PRASHNA ════ */}
        {activeTab === 'prashna' && (
          <div>
            <SectionTitle icon="🔮" title="Prashna / Horary Analysis" sub="Answer specific questions based on current planetary positions in the SBC" />

            <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:'1.5rem' }}>

              {/* Question selector */}
              <div>
                <div style={{ fontWeight:700, fontSize:'0.78rem', color:'var(--text-primary)', marginBottom:'0.75rem' }}>Select Question Type</div>
                <div style={{ display:'flex', flexDirection:'column', gap:'0.4rem', marginBottom:'1rem' }}>
                  {PRASHNA_CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setPrashnaQuery(cat.id)}
                      style={{
                        display:'flex', alignItems:'center', gap:'0.6rem', padding:'0.65rem 0.875rem', borderRadius:10,
                        border:`1.5px solid ${prashnaQuery === cat.id ? '#a78bfa' : 'var(--border-soft)'}`,
                        background: prashnaQuery === cat.id ? 'rgba(139,92,246,0.1)' : 'var(--surface-2)',
                        cursor:'pointer', textAlign:'left',
                      }}
                    >
                      <span style={{ fontSize:'1rem', flexShrink:0 }}>{cat.icon}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:700, fontSize:'0.75rem', color: prashnaQuery === cat.id ? '#a78bfa' : 'var(--text-primary)' }}>{cat.label}</div>
                        <div style={{ fontSize:'0.6rem', color:'var(--text-muted)' }}>{cat.description}</div>
                      </div>
                      {prashnaQuery === cat.id && <span style={{ color:'#a78bfa', fontSize:'0.8rem' }}>✓</span>}
                    </button>
                  ))}
                </div>

                {/* Current moment info */}
                <div style={{ padding:'0.75rem', background:'rgba(201,168,76,0.06)', border:'1px solid rgba(201,168,76,0.2)', borderRadius:10, fontSize:'0.68rem', color:'var(--text-muted)', lineHeight:1.5 }}>
                  <strong style={{ color:'var(--text-gold)' }}>Prashna Moment:</strong> Analysis uses current planetary positions as the query chart. For best results, ask the question right now and read the result.
                </div>
              </div>

              {/* Verdict */}
              <div>
                <div style={{ background:`${pResult.color}0a`, border:`2px solid ${pResult.color}35`, borderRadius:14, padding:'1.25rem', marginBottom:'1rem' }}>
                  <div style={{ textAlign:'center', marginBottom:'1rem' }}>
                    <div style={{ fontSize:'2.5rem', marginBottom:'0.4rem' }}>
                      {pResult.color === '#4db66a' ? '✅' : pResult.color === '#a3c65a' ? '🟢' : pResult.color === '#c9a84c' ? '⚖️' : pResult.color === '#FF8C00' ? '⏳' : '❌'}
                    </div>
                    <div style={{ fontSize:'1.2rem', fontWeight:900, color:pResult.color, lineHeight:1.3 }}>{pResult.verdict}</div>
                    <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginTop:'0.3rem' }}>Confidence: <strong style={{ color:pResult.color }}>{pResult.confidence}%</strong></div>
                  </div>

                  {/* Confidence bar */}
                  <div style={{ height:8, background:'var(--surface-3)', borderRadius:8, overflow:'hidden', marginBottom:'0.875rem' }}>
                    <div style={{ height:'100%', width:`${pResult.confidence}%`, background:`linear-gradient(90deg, ${pResult.color}, ${pResult.color}88)`, borderRadius:8, transition:'width 0.6s ease' }} />
                  </div>

                  <div style={{ padding:'0.65rem 0.75rem', background:'var(--surface-2)', borderRadius:10, fontSize:'0.73rem', color:'var(--text-secondary)', lineHeight:1.55, fontStyle:'italic' }}>
                    {pResult.recommendation}
                  </div>
                </div>

                {/* Factor breakdown */}
                <div style={{ fontWeight:700, fontSize:'0.75rem', color:'var(--text-primary)', marginBottom:'0.5rem' }}>Planetary Factor Analysis</div>
                <div style={{ display:'flex', flexDirection:'column', gap:'0.4rem' }}>
                  {pResult.reasons.map((r, i) => (
                    <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:'0.5rem', padding:'0.5rem 0.65rem', borderRadius:8, background: r.positive ? 'rgba(77,182,106,0.07)' : 'rgba(232,64,64,0.07)', border:`1px solid ${r.positive ? 'rgba(77,182,106,0.2)' : 'rgba(232,64,64,0.2)'}` }}>
                      <span style={{ fontSize:'0.8rem', flexShrink:0 }}>{r.positive ? '↑' : '↓'}</span>
                      <span style={{ fontSize:'0.68rem', color: r.positive ? 'var(--teal)' : 'var(--rose)', lineHeight:1.4 }}>{r.text}</span>
                    </div>
                  ))}
                  {pResult.reasons.length === 0 && (
                    <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', fontStyle:'italic' }}>Load transit data to see analysis</div>
                  )}
                </div>

                {/* Ideal directions for this query */}
                <div style={{ marginTop:'0.875rem', padding:'0.65rem 0.875rem', background:'rgba(139,92,246,0.06)', border:'1px solid rgba(139,92,246,0.18)', borderRadius:10 }}>
                  <div style={{ fontWeight:700, fontSize:'0.68rem', color:'#a78bfa', marginBottom:'0.4rem' }}>Ideal Directions for this Query</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'0.35rem' }}>
                    {(PRASHNA_CATEGORIES.find(c=>c.id===prashnaQuery)?.idealDir ?? []).map(d => {
                      const info = DIRECTIONS[d]
                      const dp   = dirMap[d]?.planets ?? []
                      const { color } = analyzeDirection(d, dp)
                      return (
                        <div key={d} style={{ padding:'3px 10px', borderRadius:20, background:`${color}15`, border:`1px solid ${color}35`, fontSize:'0.68rem' }}>
                          <span style={{ fontWeight:800, color }}>{d}</span>
                          <span style={{ color:'var(--text-muted)', marginLeft:'0.3rem' }}>{info?.name}</span>
                          {dp.length > 0 && <span style={{ marginLeft:'0.3rem', color }}>{dp.map(p=>p).join(',')}</span>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════ 5-FOLD MUHURTA ════ */}
        {activeTab === 'fivefold' && (
          <div>
            <SectionTitle icon="🪔" title="Pancha Shuddhi — 5-Fold Muhurta Checker" sub="Classical 5-level auspiciousness assessment for electional astrology" />

            {/* Overall score */}
            <div style={{ padding:'1rem 1.25rem', background: ff.score >= 4 ? 'rgba(77,182,106,0.08)' : ff.score >= 3 ? 'rgba(201,168,76,0.08)' : 'rgba(232,64,64,0.07)', border:`2px solid ${ff.score >= 4 ? '#4db66a' : ff.score >= 3 ? '#c9a84c' : '#e84040'}35`, borderRadius:14, marginBottom:'1.25rem', display:'flex', alignItems:'center', gap:'1.25rem', flexWrap:'wrap' }}>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:'2.5rem', fontWeight:900, color: ff.score >= 4 ? '#4db66a' : ff.score >= 3 ? '#c9a84c' : '#e84040' }}>{ff.score}/5</div>
                <div style={{ fontSize:'0.6rem', color:'var(--text-muted)', textTransform:'uppercase' }}>Shuddhi Score</div>
              </div>
              <div>
                <div style={{ fontWeight:800, fontSize:'0.95rem', color: ff.score >= 4 ? '#4db66a' : ff.score >= 3 ? '#c9a84c' : '#e84040', marginBottom:'0.25rem' }}>
                  {ff.score >= 5 ? '⭐ Sarva Shuddhi — All 5 Clear' : ff.score >= 4 ? '✓ Highly Auspicious' : ff.score >= 3 ? '↔ Moderately Auspicious' : ff.score >= 2 ? '⚠ Mixed — Caution' : '✗ Inauspicious — Wait'}
                </div>
                <div style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>
                  {ff.score >= 4 ? 'Excellent time to begin important activities' : ff.score >= 3 ? 'Acceptable for most activities with awareness' : ff.score >= 2 ? 'Reduce scope of activity. Avoid major decisions' : 'Not recommended for new beginnings. Wait for better time'}
                </div>
              </div>
            </div>

            {/* 5 fold items */}
            <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(5, 1fr)', gap:'0.75rem', marginBottom:'1.5rem' }}>
              {[
                { key:'nakshatra', num:1, label:'Nakshatra Shuddhi', icon:'⭐', desc:'Birth star freedom from vedha', data:ff.nakshatra },
                { key:'tithi',     num:2, label:'Tithi Shuddhi',     icon:'🌙', desc:'Lunar day quality',           data:ff.tithi     },
                { key:'vara',      num:3, label:'Vara Shuddhi',      icon:'📅', desc:'Weekday auspiciousness',      data:ff.vara      },
                { key:'rashi',     num:4, label:'Rashi Shuddhi',     icon:'♈', desc:'Zodiac sign freedom',         data:ff.rashi     },
                { key:'graha',     num:5, label:'Graha Shuddhi',     icon:'🪐', desc:'Planetary balance',          data:ff.graha     },
              ].map(item => (
                <div key={item.key} style={{ background:`${item.data.ok ? '#4db66a' : '#e84040'}08`, border:`1.5px solid ${item.data.ok ? '#4db66a' : '#e84040'}30`, borderRadius:12, padding:'0.875rem', textAlign:'center' }}>
                  <div style={{ fontSize:'0.6rem', fontWeight:800, color: item.data.ok ? '#4db66a' : '#e84040', textTransform:'uppercase', marginBottom:'0.4rem', letterSpacing:'0.06em' }}>Fold {item.num}</div>
                  <div style={{ fontSize:'1.5rem', marginBottom:'0.4rem' }}>{item.icon}</div>
                  <div style={{ fontWeight:700, fontSize:'0.72rem', color:'var(--text-primary)', marginBottom:'0.35rem' }}>{item.label}</div>
                  <OkBadge ok={item.data.ok} />
                  <div style={{ fontSize:'0.62rem', color:'var(--text-muted)', marginTop:'0.5rem', lineHeight:1.4 }}>{item.data.detail}</div>
                </div>
              ))}
            </div>

            {/* Classical explanation */}
            <div style={{ padding:'1rem', background:'rgba(201,168,76,0.05)', border:'1px solid rgba(201,168,76,0.18)', borderRadius:12 }}>
              <div style={{ fontWeight:700, fontSize:'0.78rem', color:'var(--text-gold)', marginBottom:'0.75rem' }}>📖 Classical Pancha Shuddhi Rules</div>
              <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap:'0.75rem', fontSize:'0.68rem', color:'var(--text-secondary)', lineHeight:1.6 }}>
                <div>
                  <strong style={{ color:'var(--text-primary)' }}>1. Nakshatra Shuddhi</strong><br/>
                  The birth nakshatra must be free from malefic vedha. When transit malefics (Saturn, Mars, Rahu, Ketu) occupy nakshatras in the same row/column as the birth star, vedha is created — avoid major actions during this period.
                </div>
                <div>
                  <strong style={{ color:'var(--text-primary)' }}>2. Tithi Shuddhi</strong><br/>
                  Most auspicious tithis: 2, 3, 5, 7, 10, 11, 13 (Shukla). Avoid: 4, 8, 9, 14 (Rikta tithis). Amavasya (30) and Purnima (15) are special — powerful but not for all actions.
                </div>
                <div>
                  <strong style={{ color:'var(--text-primary)' }}>3. Vara Shuddhi</strong><br/>
                  Thursday (Jupiter) and Friday (Venus) are universally auspicious. Wednesday (Mercury) is good for business. Avoid Tuesday (Mars) and Saturday (Saturn) for new beginnings. Sunday is mixed.
                </div>
                <div>
                  <strong style={{ color:'var(--text-primary)' }}>4. Rashi Shuddhi</strong><br/>
                  The natal rashi and its trines (5th, 9th) should be free from malefic transit influence. Lagna rashi should not have malefic transits creating vedha in the SBC grid.
                </div>
                <div style={{ gridColumn: isMobile ? 'auto' : 'span 2' }}>
                  <strong style={{ color:'var(--text-primary)' }}>5. Graha Shuddhi</strong><br/>
                  Benefic planets (Jupiter, Venus, Mercury, Moon in Shukla Paksha) should outnumber malefics in their vedha influence. When 3 or more benefics create positive vedha without obstruction — excellent period.
                  Sarva Shuddhi (all 5 clear) is extremely rare and marks a supremely auspicious time.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════ PREDICTION MODE ════ */}
        {activeTab === 'predict' && (
          <div>
            <SectionTitle icon="🔍" title="Prediction Mode" sub="Specialized analytical methods for specific life questions" />

            {/* Mode selector */}
            <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap', marginBottom:'1.25rem' }}>
              {(Object.entries(PREDICT_MODES) as [PredictMode, typeof PREDICT_MODES[PredictMode]][]).map(([key, m]) => (
                <button
                  key={key}
                  onClick={() => setPredictMode(key)}
                  style={{
                    padding:'0.5rem 1rem', borderRadius:20, border:`1.5px solid ${predictMode===key ? m.color : 'var(--border-soft)'}`,
                    background: predictMode===key ? `${m.color}15` : 'var(--surface-2)',
                    color: predictMode===key ? m.color : 'var(--text-muted)',
                    fontWeight: predictMode===key ? 700 : 500,
                    fontSize:'0.75rem', cursor:'pointer', display:'flex', alignItems:'center', gap:'0.4rem',
                    transition:'all 0.2s',
                  }}
                >
                  <span>{m.icon}</span><span>{m.label}</span>
                </button>
              ))}
            </div>

            {(() => {
              const mode = PREDICT_MODES[predictMode]
              const dp   = getPlanetDirections(transitRaw)

              // Compute verdict
              let pScore = 0
              mode.positiveDir.forEach(d => {
                const planets = dp[d]?.planets ?? []
                planets.forEach(p => {
                  if (['Ju','Ve','Me','Mo'].includes(p)) pScore += 2
                  else if (['Sa','Ma','Ra','Ke'].includes(p)) pScore -= 1
                })
              })
              mode.negativeDir.forEach(d => {
                const planets = dp[d]?.planets ?? []
                planets.forEach(p => {
                  if (['Sa','Ma','Ra','Ke'].includes(p)) pScore -= 2
                })
              })

              // Sig planet positions
              const sigPlanetInfo = mode.sigPlanets.map(p => {
                const g = transitRaw.find(g => g.id === p)
                if (!g) return null
                const nak = nakFromLon(g.lonSidereal)
                const dir = NAK_DIRECTION[nak] ?? '?'
                const isPositive = mode.positiveDir.includes(dir)
                const isNegative = mode.negativeDir.includes(dir)
                return { id: p, nak, dir, isPositive, isNegative, nakName: NAKSHATRA_NAMES[nak] ?? '?' }
              }).filter(Boolean) as Array<{ id:string; nak:number; dir:string; isPositive:boolean; isNegative:boolean; nakName:string }>

              const verdict = pScore >= 4 ? { text:'Highly Favorable', color:'#4db66a' }
                : pScore >= 2 ? { text:'Favorable', color:'#a3c65a' }
                : pScore === 0 ? { text:'Uncertain', color:'#c9a84c' }
                : pScore >= -2 ? { text:'Challenging', color:'#FF8C00' }
                : { text:'Unfavorable', color:'#e84040' }

              return (
                <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:'1.5rem' }}>

                  {/* Verdict card */}
                  <div style={{ background:`${verdict.color}0a`, border:`2px solid ${verdict.color}35`, borderRadius:14, padding:'1.25rem' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'1rem' }}>
                      <span style={{ fontSize:'2rem' }}>{mode.icon}</span>
                      <div>
                        <div style={{ fontWeight:800, fontSize:'1rem', color:'var(--text-primary)' }}>{mode.label}</div>
                        <div style={{ fontSize:'0.68rem', color:'var(--text-muted)' }}>Mode Analysis</div>
                      </div>
                    </div>

                    <div style={{ textAlign:'center', marginBottom:'1rem' }}>
                      <div style={{ fontSize:'1.4rem', fontWeight:900, color:verdict.color }}>{verdict.text}</div>
                    </div>

                    {/* Sig planets */}
                    <div style={{ marginBottom:'0.875rem' }}>
                      <div style={{ fontSize:'0.62rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', marginBottom:'0.4rem' }}>Significator Planets</div>
                      {sigPlanetInfo.map(sp => (
                        <div key={sp.id} style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.4rem 0.6rem', borderRadius:8, background: sp.isPositive ? 'rgba(77,182,106,0.08)' : sp.isNegative ? 'rgba(232,64,64,0.08)' : 'var(--surface-2)', marginBottom:'0.3rem', border:`1px solid ${sp.isPositive ? 'rgba(77,182,106,0.25)' : sp.isNegative ? 'rgba(232,64,64,0.25)' : 'var(--border-soft)'}` }}>
                          <div style={{ width:20, height:20, borderRadius:'50%', background:PLANET_COLOR[sp.id as GrahaId]??'#888', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.55rem', color:'#fff', fontWeight:800 }}>{sp.id}</div>
                          <span style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--text-primary)' }}>{PLANET_NAME[sp.id]}</span>
                          <span style={{ fontSize:'0.62rem', color:'var(--text-muted)' }}>in {sp.nakName.split(' ')[0]} · {sp.dir}</span>
                          <span style={{ marginLeft:'auto', fontSize:'0.6rem', fontWeight:700, color: sp.isPositive ? '#4db66a' : sp.isNegative ? '#e84040' : '#c9a84c' }}>
                            {sp.isPositive ? '✓ Favorable dir' : sp.isNegative ? '✗ Unfavorable dir' : '~ Neutral dir'}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Directions summary */}
                    <div style={{ display:'flex', gap:'0.4rem', flexWrap:'wrap' }}>
                      <span style={{ fontSize:'0.6rem', color:'var(--text-muted)', alignSelf:'center' }}>Good dirs:</span>
                      {mode.positiveDir.map(d => {
                        const dp2 = dp[d]?.planets ?? []
                        const { color } = analyzeDirection(d, dp2)
                        return <span key={d} style={{ padding:'1px 8px', borderRadius:10, fontSize:'0.62rem', fontWeight:700, background:`${color}15`, color, border:`1px solid ${color}30` }}>{d}{dp2.length>0?` (${dp2.join(',')})`:''}</span>
                      })}
                    </div>
                  </div>

                  {/* Method guide */}
                  <div>
                    <div style={{ fontWeight:700, fontSize:'0.78rem', color:'var(--text-primary)', marginBottom:'0.75rem' }}>📖 Classical Method for {mode.label}</div>
                    <div style={{ display:'flex', flexDirection:'column', gap:'0.4rem' }}>
                      {mode.method.map((step, i) => (
                        <div key={i} style={{ display:'flex', gap:'0.6rem', padding:'0.55rem 0.7rem', borderRadius:10, background:'var(--surface-2)', borderLeft:`3px solid ${mode.color}60` }}>
                          <span style={{ color:mode.color, fontWeight:700, fontSize:'0.68rem', flexShrink:0, minWidth:'1.2rem' }}>{i+1}.</span>
                          <span style={{ fontSize:'0.68rem', color:'var(--text-secondary)', lineHeight:1.45 }}>{step}</span>
                        </div>
                      ))}
                    </div>

                    {/* Direction guide for this mode */}
                    <div style={{ marginTop:'0.875rem', padding:'0.75rem', background:`${mode.color}08`, border:`1px solid ${mode.color}25`, borderRadius:12 }}>
                      <div style={{ fontWeight:700, fontSize:'0.68rem', color:mode.color, marginBottom:'0.5rem' }}>Directional Reading</div>
                      <div style={{ display:'grid', gridTemplateColumns:isMobile ? '1fr' : '1fr 1fr', gap:'0.5rem', fontSize:'0.65rem' }}>
                        <div>
                          <div style={{ color:'#4db66a', fontWeight:700, marginBottom:'0.25rem' }}>✓ Positive Directions</div>
                          {mode.positiveDir.map(d => <div key={d} style={{ color:'var(--text-secondary)' }}>{d} — {DIRECTIONS[d]?.name}: {DIRECTIONS[d]?.general[0]}</div>)}
                        </div>
                        <div>
                          <div style={{ color:'#e84040', fontWeight:700, marginBottom:'0.25rem' }}>✗ Negative Directions</div>
                          {mode.negativeDir.map(d => <div key={d} style={{ color:'var(--text-secondary)' }}>{d} — {DIRECTIONS[d]?.name}: {DIRECTIONS[d]?.general[0]}</div>)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
        )}

        {/* ════ VEDHA PAIRS ════ */}
        {activeTab === 'vedhamap' && (
          <div>
            <SectionTitle icon="📜" title="Classical Vedha Pairs & Activations" sub="Traditional nakshatra obstruction pairs — shows which stars currently afflict each other" />

            {/* Moon's current vedha */}
            {currentMoonNak >= 0 && (
              <div style={{ padding:'0.875rem 1rem', background:'rgba(201,168,76,0.08)', border:'2px solid rgba(201,168,76,0.3)', borderRadius:12, marginBottom:'1.25rem', display:'flex', alignItems:'center', gap:'1rem', flexWrap:'wrap' }}>
                <span style={{ fontSize:'1.5rem' }}>🌙</span>
                <div>
                  <div style={{ fontWeight:700, fontSize:'0.88rem', color:'var(--text-gold)' }}>Moon in {NAKSHATRA_NAMES[currentMoonNak]} (Nakshatra {currentMoonNak+1})</div>
                  <div style={{ fontSize:'0.68rem', color:'var(--text-muted)' }}>
                    Creates vedha on: {(VEDHA_PAIRS[currentMoonNak] ?? []).map(n => NAKSHATRA_NAMES[n]).join(', ')}
                  </div>
                </div>
                <div style={{ marginLeft:'auto', display:'flex', gap:'0.35rem', flexWrap:'wrap' }}>
                  {(VEDHA_PAIRS[currentMoonNak] ?? []).map(n => (
                    <span key={n} style={{ padding:'2px 8px', borderRadius:10, background:'rgba(232,64,64,0.12)', color:'#e84040', fontSize:'0.62rem', fontWeight:700, border:'1px solid rgba(232,64,64,0.25)' }}>
                      {NAKSHATRA_NAMES[n]?.split(' ')[0]}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Active vedha from transits */}
            {(analysis?.vedhas ?? []).length > 0 && (
              <div style={{ marginBottom:'1.25rem' }}>
                <div style={{ fontWeight:700, fontSize:'0.8rem', color:'var(--text-primary)', marginBottom:'0.65rem' }}>🔴 Active Transit Vedhas Today</div>
                <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap:'0.5rem' }}>
                  {(analysis?.vedhas ?? []).slice(0, 10).map((v: VedhaResult, i: number) => (
                    <div key={i} style={{
                      display:'flex', alignItems:'center', gap:'0.6rem', padding:'0.5rem 0.7rem', borderRadius:10,
                      background: v.isMalefic ? 'rgba(232,64,64,0.06)' : 'rgba(77,182,106,0.06)',
                      border:`1px solid ${v.isMalefic ? 'rgba(232,64,64,0.2)' : 'rgba(77,182,106,0.2)'}`,
                    }}>
                      <div style={{ width:20, height:20, borderRadius:'50%', background:PLANET_COLOR[v.planet as GrahaId]??'#888', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.55rem', color:'#fff', fontWeight:800 }}>{PLANET_SYMBOL[v.planet as GrahaId]}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:'0.72rem', fontWeight:700, color: v.isMalefic ? 'var(--rose)' : 'var(--teal)' }}>
                          {PLANET_NAME[v.planet]} {v.isMalefic ? 'Malefic Vedha' : 'Benefic Vedha'}
                        </div>
                        <div style={{ fontSize:'0.6rem', color:'var(--text-muted)' }}>
                          In {NAKSHATRA_NAMES[v.sourceNak]?.split(' ')[0]} · affects {v.affectedNakshatras.length} nakshatras
                        </div>
                      </div>
                      <span style={{ fontSize:'0.58rem', fontWeight:700, color: v.isMalefic ? '#e84040' : '#4db66a' }}>
                        {v.isMalefic ? '⚠' : '✓'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All 27 vedha pairs table */}
            <div style={{ fontWeight:700, fontSize:'0.8rem', color:'var(--text-primary)', marginBottom:'0.65rem' }}>📋 All 27 Nakshatra Vedha Pairs (Classical)</div>
            <div style={{ overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
              <table style={{ width:'100%', minWidth:isMobile ? 700 : '100%', borderCollapse:'collapse', fontSize:isMobile ? '0.64rem' : '0.7rem' }}>
                <thead>
                  <tr style={{ background:'rgba(201,168,76,0.08)' }}>
                    {['#', 'Nakshatra', 'Direction', 'Classical Vedha Partners', 'Current Status'].map(h => (
                      <th key={h} style={{ padding:'0.45rem 0.6rem', textAlign:'left', color:'var(--text-muted)', fontWeight:700, fontSize:'0.58rem', textTransform:'uppercase', letterSpacing:'0.07em', whiteSpace:'nowrap', borderBottom:'1px solid var(--border)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length:27 }, (_, i) => {
                    const nakName   = NAKSHATRA_NAMES[i]
                    const vedhaIdxs = VEDHA_PAIRS[i] ?? []
                    const dir       = NAK_DIRECTION[i]
                    const dirInfo   = DIRECTIONS[dir]
                    const isMoonHere = currentMoonNak === i
                    // Is any transit planet in this nakshatra?
                    const planetHere = transitRaw.find(g => !['Ur','Ne','Pl'].includes(g.id) && nakFromLon(g.lonSidereal) === i)
                    const isActive   = !!planetHere

                    return (
                      <tr key={i} style={{ borderBottom:'1px solid var(--surface-3)', background: isMoonHere ? 'rgba(201,168,76,0.06)' : isActive ? 'rgba(139,92,246,0.04)' : i%2===0?'transparent':'rgba(255,255,255,0.01)' }}>
                        <td style={{ padding:'0.35rem 0.6rem' }}>
                          <div style={{ width:22, height:22, borderRadius:'50%', background:'var(--surface-3)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'0.6rem', color:'var(--text-muted)' }}>{i+1}</div>
                        </td>
                        <td style={{ padding:'0.35rem 0.6rem', whiteSpace:'nowrap' }}>
                          <div style={{ fontWeight:isMoonHere||isActive?700:500, color: isMoonHere ? 'var(--text-gold)' : isActive ? '#a78bfa' : 'var(--text-primary)', fontSize:'0.72rem' }}>
                            {nakName}
                            {isMoonHere && <span style={{ marginLeft:'0.35rem', fontSize:'0.52rem', background:'var(--gold)', color:'#000', borderRadius:3, padding:'0 4px', fontWeight:800 }}>MOON</span>}
                            {isActive && !isMoonHere && <span style={{ marginLeft:'0.35rem', fontSize:'0.52rem', background:'rgba(139,92,246,0.25)', color:'#a78bfa', borderRadius:3, padding:'0 4px', fontWeight:800 }}>{planetHere?.id}</span>}
                          </div>
                        </td>
                        <td style={{ padding:'0.35rem 0.6rem' }}>
                          <span style={{ fontSize:'0.62rem', fontWeight:700, padding:'1px 6px', borderRadius:8, background:`${dirInfo?.color ?? '#888'}15`, color:dirInfo?.color ?? '#888' }}>{dir}</span>
                        </td>
                        <td style={{ padding:'0.35rem 0.6rem' }}>
                          <div style={{ display:'flex', flexWrap:'wrap', gap:'0.25rem' }}>
                            {vedhaIdxs.map(vi => {
                              const vPlanetHere = transitRaw.find(g => !['Ur','Ne','Pl'].includes(g.id) && nakFromLon(g.lonSidereal) === vi)
                              return (
                                <span key={vi} style={{ fontSize:'0.6rem', padding:'1px 6px', borderRadius:8, background: vPlanetHere ? 'rgba(232,64,64,0.15)' : 'var(--surface-3)', color: vPlanetHere ? '#e84040' : 'var(--text-muted)', fontWeight: vPlanetHere ? 700 : 400, border: vPlanetHere ? '1px solid rgba(232,64,64,0.3)' : '1px solid transparent', whiteSpace:'nowrap' }}>
                                  {NAKSHATRA_NAMES[vi]?.split(' ')[0]}{vPlanetHere ? ` (${vPlanetHere.id})` : ''}
                                </span>
                              )
                            })}
                            {vedhaIdxs.length === 0 && <span style={{ fontSize:'0.6rem', color:'var(--text-muted)' }}>No classical pair</span>}
                          </div>
                        </td>
                        <td style={{ padding:'0.35rem 0.6rem' }}>
                          {isActive ? (
                            <span style={{ fontSize:'0.6rem', fontWeight:700, color:'#a78bfa', padding:'1px 6px', borderRadius:8, background:'rgba(139,92,246,0.12)', border:'1px solid rgba(139,92,246,0.25)' }}>Active — {planetHere?.id}</span>
                          ) : (
                            <span style={{ fontSize:'0.6rem', color:'var(--text-muted)' }}>Clear</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Classical explanation */}
            <div style={{ marginTop:'1.25rem', padding:'0.875rem 1rem', background:'rgba(139,92,246,0.05)', border:'1px solid rgba(139,92,246,0.18)', borderRadius:12, fontSize:'0.7rem', color:'var(--text-secondary)', lineHeight:1.65 }}>
              <strong style={{ color:'#a78bfa' }}>📖 About Vedha Pairs:</strong> In Sarvatobhadra, each nakshatra has traditional "enemy" nakshatras — placing a planet in one affects the other. The grid-based vedha (row + column crossing) is the primary mechanism used in this tool. Classical texts also list specific named vedha pairs based on phonetic harmony, deity relationships, and geometric grid positions.
              <br/><br/>
              <strong style={{ color:'#a78bfa' }}>How to Use:</strong> If your birth nakshatra appears in a vedha pair's "partner" column, and a transit malefic occupies that partner star — you are experiencing active vedha. Plan accordingly by avoiding major new actions.
            </div>
          </div>
        )}

      </div>
    </section>
  )
}
