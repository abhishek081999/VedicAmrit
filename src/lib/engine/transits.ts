// ─────────────────────────────────────────────────────────────
//  src/lib/engine/transits.ts
//  Calculates personal transits for a date range with detailed interpretations
// ─────────────────────────────────────────────────────────────

import { 
  SWISSEPH_IDS, 
  dateToJD, 
  jdToDate,
  getPlanetPosition, 
  signOf,
  ketuLongitude,
} from './ephemeris'
import { GRAHA_NAMES, RASHI_NAMES, type GrahaId, type Rashi } from '@/types/astrology'
import { getNakshatra } from './nakshatra'

export interface TransitEvent {
  planetId:  GrahaId
  date:      string
  type:      'sign_change' | 'house_change' | 'nakshatra_change' | 'pada_change' | 'retrograde_start' | 'retrograde_end'
  from:      number | string
  to:        number | string
  sign:      Rashi
  house:     number
  nakshatra: string
  pada:      number
  description: string
  isMajor: boolean
}

type PlanetTransitState = {
  rashi: Rashi
  house: number
  nakshatra: string
  pada: number
  isRetro: boolean
}

export interface TransitPosition {
  planetId: GrahaId
  sign: Rashi
  house: number
  nakshatra: string
  pada: number
  isRetro: boolean
}

const TRANSIT_INTERPRETATIONS: Record<string, Record<number, string>> = {
  Ju: {
    1: "A cycle of personal growth and new beginnings. Confidence and vitality increase.",
    2: "Financial growth and expansion of family resources. Values become more philosophical.",
    3: "Enhanced communication, learning new skills, and supportive short journeys.",
    4: "Expansion of domestic happiness, property gains, and deepened inner peace.",
    5: "Peak creativity, joy through children, and success in education or romance.",
    6: "Success over obstacles, improved health routines, and meaningful service.",
    7: "Expansion in partnerships and public relations. Growth through collaboration.",
    8: "Psychological transformation and gains through legacy or shared resources.",
    9: "Broadening horizons through travel, wisdom, and higher philosophical study.",
    10: "Significant career advancement, social recognition, and professional peak.",
    11: "Fulfillment of long-held desires and great social networking success.",
    12: "Introspective healing, spiritual expansion, and growth in solitude."
  },
  Sa: {
    1: "Discipline of self-identity. A time for building a serious foundation for the future.",
    2: "Focus on financial discipline and long-term security. Restructuring family duties.",
    3: "Mental discipline and hard work in acquiring precise skills or communication.",
    4: "Taking responsibility for domestic life and home-related foundations.",
    5: "Structure in creative pursuits and a serious approach to children's education.",
    6: "Hard work in health management and daily service. Clearing debts/obstacles.",
    7: "Testing and strengthening of commitments. Realism in partnerships.",
    8: "Facing transformations with endurance. Prudence in shared financial matters.",
    9: "Structured approach to higher ethics and long-term vision. Testing beliefs.",
    10: "Heavy professional duties. Integrity leads to solid corporate or social status.",
    11: "Refining social circles. Connecting with serious, goal-oriented groups.",
    12: "Closure of old cycles. Introspection and clearing of subconscious burdens."
  },
  Ra: {
    1: "Ambition for self-projection. A drive to innovate one's public identity.",
    2: "Focus on unconventional wealth creation or change in family values.",
    3: "Courageous communication and curiosity for cutting-edge technology/travel.",
    4: "Restlessness in the domestic sphere. Seeking unconventional roots.",
    5: "Intense focus on creative speculation or unique educational paths.",
    6: "Innovative approaches to health and routine. Winning over subtle enemies.",
    7: "Unconventional attractions in partnerships. Intense focus on the 'Other'.",
    8: "Fascination with hidden secrets or rapid transformational shifts.",
    9: "Quest for foreign wisdom or unconventional spiritual paths.",
    10: "Ambitious drive for fame and status. Unusual paths to career success.",
    11: "Engagement with diverse social networks. Sudden gains through technology.",
    12: "Intense dreams and exploration of foreign lands or subconscious depth."
  },
  Ke: {
    1: "Detachment from self-ego. A cycle of internal focus and spiritual identity.",
    2: "Detachment from material possessions. Focus on inner values and spiritual family.",
    3: "Introspection in communication. Letting go of superficial interests.",
    4: "Letgo of domestic attachments. Focus on inner emotional security.",
    5: "Spiritual approach to creativity and education. Detachment in romance.",
    6: "Transcending daily conflicts. Service without attachment to results.",
    7: "Detachment from public projection. Focus on spiritual/karmic relations.",
    8: "Deep spiritual transformation and letting go of shared attachments.",
    9: "Transcending formal religion. Seeking the essence of wisdom.",
    10: "Detachment from fame and status. Working with a sense of higher purpose.",
    11: "Pruning of social desires. Focus on spiritual communities.",
    12: "Ultimate release and spiritual liberation. High introspective growth."
  }
}

function getDetailedInterpretation(pid: GrahaId, house: number, type: string): string {
  const base = TRANSIT_INTERPRETATIONS[pid]?.[house]
  if (!base) return `${GRAHA_NAMES[pid]} transits your ${house}${getOrdinal(house)} house.`

  switch (type) {
    case 'house_change':
      return `Activation: ${base}`
    case 'retrograde_start':
      return `Reflection: Pause and review themes of ${base.split('.')[0].toLowerCase()}.`
    case 'retrograde_end':
      return `Progress: Direct movement resumes for ${base.split('.')[0].toLowerCase()}.`
    default:
      return base
  }
}

const PLANETS_FOR_ROADMAP: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']
const MAJOR_PLANETS = new Set<GrahaId>(['Ju', 'Sa', 'Ra', 'Ke'])

function isMajorTransit(pid: GrahaId, type: TransitEvent['type']) {
  return MAJOR_PLANETS.has(pid) || type === 'house_change'
}

export function calculatePersonalTransits(
  birthAscRashi: number,
  startDate: Date,
  months: number = 12
): TransitEvent[] {
  const events: TransitEvent[] = []
  const planets: GrahaId[] = PLANETS_FOR_ROADMAP
  const totalDays = Math.max(1, Math.round(months * 30))

  const startUtcNoon = new Date(Date.UTC(
    startDate.getUTCFullYear(),
    startDate.getUTCMonth(),
    startDate.getUTCDate(),
    12, 0, 0,
  ))
  const startJd = dateToJD(startUtcNoon)

  function stateAtJd(pid: GrahaId, jd: number): PlanetTransitState {
    const pos = pid === 'Ke'
      ? (() => {
          const rahuPos = getPlanetPosition(jd, SWISSEPH_IDS.Ra, true)
          return {
            ...rahuPos,
            longitude: ketuLongitude(rahuPos.longitude),
          }
        })()
      : getPlanetPosition(jd, SWISSEPH_IDS[pid as keyof typeof SWISSEPH_IDS], true)
    const rashi = signOf(pos.longitude) as Rashi
    const nakshatra = getNakshatra(pos.longitude)
    const house = ((rashi - birthAscRashi + 12) % 12) + 1
    return {
      rashi,
      house,
      nakshatra: nakshatra.name,
      pada: nakshatra.pada,
      isRetro: pos.isRetro,
    }
  }

  function findTransitionJd<T>(pid: GrahaId, leftJd: number, rightJd: number, previousValue: T, pick: (s: PlanetTransitState) => T): number {
    let lo = leftJd
    let hi = rightJd
    for (let i = 0; i < 20; i += 1) {
      const mid = (lo + hi) / 2
      const midVal = pick(stateAtJd(pid, mid))
      if (midVal === previousValue) lo = mid
      else hi = mid
    }
    return hi
  }

  for (const pid of planets) {
    let prevBoundaryJd = startJd
    let prev = stateAtJd(pid, prevBoundaryJd)

    for (let day = 1; day <= totalDays; day += 1) {
      const currentBoundaryJd = startJd + day
      const curr = stateAtJd(pid, currentBoundaryJd)

      if (prev.rashi !== curr.rashi) {
        const jdEvent = findTransitionJd(pid, prevBoundaryJd, currentBoundaryJd, prev.rashi, (s) => s.rashi)
        const eventState = stateAtJd(pid, jdEvent)
        const dateStr = jdToDate(jdEvent).toISOString().split('T')[0]
        events.push({
          planetId: pid,
          date: dateStr,
          type: 'sign_change',
          from: prev.rashi,
          to: eventState.rashi,
          sign: eventState.rashi,
          house: eventState.house,
          nakshatra: eventState.nakshatra,
          pada: eventState.pada,
          description: `${GRAHA_NAMES[pid]} enters ${RASHI_NAMES[eventState.rashi]}. ${getDetailedInterpretation(pid, eventState.house, 'sign_change')}`,
          isMajor: isMajorTransit(pid, 'sign_change'),
        })
      }

      if (prev.house !== curr.house) {
        const jdEvent = findTransitionJd(pid, prevBoundaryJd, currentBoundaryJd, prev.house, (s) => s.house)
        const eventState = stateAtJd(pid, jdEvent)
        const dateStr = jdToDate(jdEvent).toISOString().split('T')[0]
        events.push({
          planetId: pid,
          date: dateStr,
          type: 'house_change',
          from: prev.house,
          to: eventState.house,
          sign: eventState.rashi,
          house: eventState.house,
          nakshatra: eventState.nakshatra,
          pada: eventState.pada,
          description: getDetailedInterpretation(pid, eventState.house, 'house_change'),
          isMajor: isMajorTransit(pid, 'house_change'),
        })
      }

      if (prev.nakshatra !== curr.nakshatra) {
        const jdEvent = findTransitionJd(pid, prevBoundaryJd, currentBoundaryJd, prev.nakshatra, (s) => s.nakshatra)
        const eventState = stateAtJd(pid, jdEvent)
        const dateStr = jdToDate(jdEvent).toISOString().split('T')[0]
        events.push({
          planetId: pid,
          date: dateStr,
          type: 'nakshatra_change',
          from: prev.nakshatra,
          to: eventState.nakshatra,
          sign: eventState.rashi,
          house: eventState.house,
          nakshatra: eventState.nakshatra,
          pada: eventState.pada,
          description: `${GRAHA_NAMES[pid]} moves from ${prev.nakshatra} to ${eventState.nakshatra}, Pada ${eventState.pada}.`,
          isMajor: isMajorTransit(pid, 'nakshatra_change'),
        })
      }

      if (prev.pada !== curr.pada) {
        const jdEvent = findTransitionJd(pid, prevBoundaryJd, currentBoundaryJd, prev.pada, (s) => s.pada)
        const eventState = stateAtJd(pid, jdEvent)
        const dateStr = jdToDate(jdEvent).toISOString().split('T')[0]
        events.push({
          planetId: pid,
          date: dateStr,
          type: 'pada_change',
          from: prev.pada,
          to: eventState.pada,
          sign: eventState.rashi,
          house: eventState.house,
          nakshatra: eventState.nakshatra,
          pada: eventState.pada,
          description: `${GRAHA_NAMES[pid]} shifts to Pada ${eventState.pada} of ${eventState.nakshatra}.`,
          isMajor: isMajorTransit(pid, 'pada_change'),
        })
      }

      if (prev.isRetro !== curr.isRetro) {
        const jdEvent = findTransitionJd(pid, prevBoundaryJd, currentBoundaryJd, prev.isRetro, (s) => s.isRetro)
        const eventState = stateAtJd(pid, jdEvent)
        const dateStr = jdToDate(jdEvent).toISOString().split('T')[0]
        events.push({
          planetId: pid,
          date: dateStr,
          type: prev.isRetro ? 'retrograde_end' : 'retrograde_start',
          from: prev.isRetro ? 'Retrograde' : 'Direct',
          to: prev.isRetro ? 'Direct' : 'Retrograde',
          sign: eventState.rashi,
          house: eventState.house,
          nakshatra: eventState.nakshatra,
          pada: eventState.pada,
          description: prev.isRetro
            ? `${GRAHA_NAMES[pid]} turns Direct. ${getDetailedInterpretation(pid, eventState.house, 'retrograde_end')}`
            : `${GRAHA_NAMES[pid]} turns Retrograde. ${getDetailedInterpretation(pid, eventState.house, 'retrograde_start')}`,
          isMajor: isMajorTransit(pid, prev.isRetro ? 'retrograde_end' : 'retrograde_start'),
        })
      }

      prevBoundaryJd = currentBoundaryJd
      prev = curr
    }
  }

  const unique = events.filter((ev, idx, self) => {
    return self.findIndex((t) =>
      t.date === ev.date &&
      t.planetId === ev.planetId &&
      t.type === ev.type &&
      t.from === ev.from &&
      t.to === ev.to &&
      t.nakshatra === ev.nakshatra &&
      t.pada === ev.pada
    ) === idx
  })

  const filtered = unique.filter((ev, _, self) => {
    if (ev.type !== 'sign_change') return true
    return !self.some((x) =>
      x.planetId === ev.planetId &&
      x.date === ev.date &&
      x.type === 'house_change' &&
      x.house === ev.house
    )
  })

  return filtered.sort((a, b) => {
    const dateCmp = a.date.localeCompare(b.date)
    if (dateCmp !== 0) return dateCmp
    return a.planetId.localeCompare(b.planetId)
  })
}

export function getCurrentTransitPositions(
  birthAscRashi: number,
  date: Date = new Date()
): TransitPosition[] {
  const jd = dateToJD(date)
  return PLANETS_FOR_ROADMAP.map((pid) => {
    const pos = pid === 'Ke'
      ? (() => {
          const rahuPos = getPlanetPosition(jd, SWISSEPH_IDS.Ra, true)
          return {
            ...rahuPos,
            longitude: ketuLongitude(rahuPos.longitude),
          }
        })()
      : getPlanetPosition(jd, SWISSEPH_IDS[pid as keyof typeof SWISSEPH_IDS], true)
    const sign = signOf(pos.longitude) as Rashi
    const nakshatra = getNakshatra(pos.longitude)
    const house = ((sign - birthAscRashi + 12) % 12) + 1
    return {
      planetId: pid,
      sign,
      house,
      nakshatra: nakshatra.name,
      pada: nakshatra.pada,
      isRetro: pos.isRetro,
    }
  })
}

function getOrdinal(n: number) {
  const s = ["th", "st", "nd", "rd"]
  const v = n % 100
  return s[(v - 20) % 10] || s[v] || s[0]
}
