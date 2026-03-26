import type {
  ChartInterpretation,
  GrahaData,
  InterpretationInsight,
  GrahaId,
  HouseSystem,
  ShadbalaResult,
  YogiPointResult,
} from '@/types/astrology'
import type { HouseData } from './houses'
import { planetHouse } from './houses'

function makeInsight(input: Omit<InterpretationInsight, 'id'> & { id?: string }): InterpretationInsight {
  return {
    id: input.id ?? `${input.category}-${input.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    ...input,
  }
}

function houseLabel(house: number): string {
  const labels: Record<number, string> = {
    1: 'Self / identity',
    2: 'Wealth / family speech',
    3: 'Courage / communication',
    4: 'Home / inner peace',
    5: 'Creativity / children',
    6: 'Health / service',
    7: 'Partnerships',
    8: 'Transformation',
    9: 'Wisdom / travel',
    10: 'Career / reputation',
    11: 'Gains / networks',
    12: 'Loss / spirituality',
  }
  return labels[house] ?? 'Life area'
}

function grahaDomain(g: { id: GrahaId }): string {
  const m: Partial<Record<GrahaId, string>> = {
    Su: 'leadership, direction, and clarity of purpose',
    Mo: 'mind, emotions, and mental security',
    Ma: 'courage, drive, and decisive action',
    Me: 'speech, learning, and precise thinking',
    Ju: 'wisdom, ethics, and mentorship',
    Ve: 'love, aesthetics, comfort, and relationships',
    Sa: 'discipline, responsibility, and endurance',
    Ra: 'ambition, innovation, and risk management',
    Ke: 'spiritual depth, detachment, and inner healing',
    Ur: 'breakthrough thinking and independence',
    Ne: 'inspiration, intuition, and ideals',
    Pl: 'transformation, depth work, and long-term vision',
  }
  return m[g.id] ?? 'life force in your chart'
}

function grahaGroundingPractice(g: { id: GrahaId }): string {
  const m: Partial<Record<GrahaId, string>> = {
    Su: 'daily planning with a clear priority and consistent follow-through',
    Mo: 'sleep routine + short mindfulness/breathwork',
    Ma: 'structured effort (workout or task list) without impulsive escalation',
    Me: 'focused learning + careful communication (write/verify)',
    Ju: 'study dharma/ethics + one act of service or teaching',
    Ve: 'healthy creativity/connection (art, sincere kindness, moderation)',
    Sa: 'slow-and-steady discipline (timelines, commitments, review)',
    Ra: 'goal strategy with boundaries (no obsession; measured risks)',
    Ke: 'quiet inner work (meditation, journaling, letting go)',
    Ur: 'experiments in small doses (try, measure, iterate)',
    Ne: 'ground your ideals with practical routines and clear limits',
    Pl: 'deep reflection + structured rebuilding plans',
  }
  return m[g.id] ?? 'consistent daily practice aligned to the domain'
}

function dignityLeanVsCompensate(dignity: string): { lead: string; compensate: string } {
  switch (dignity) {
    case 'exalted':
    case 'moolatrikona':
    case 'own':
      return {
        lead: 'Lean into this graha naturally: set clear priorities and execute consistently.',
        compensate: ' ',
      }
    case 'great_friend':
    case 'friend':
      return {
        lead: 'Use the supportive environment: progress comes from steady, practical effort.',
        compensate: ' ',
      }
    case 'neutral':
      return {
        lead: 'Treat results as variable: confirm plans with facts and keep options open.',
        compensate: ' ',
      }
    case 'enemy':
    case 'great_enemy':
      return {
        lead: 'Focus on disciplined expression: don’t fight the theme head-on—work with it.',
        compensate: 'Compensate with patience, boundaries, and careful timing.',
      }
    case 'debilitated':
      return {
        lead: 'Use gentle execution: avoid shortcuts; build foundations before pushing hard.',
        compensate: 'Compensate with consistent remedies/discipline and gradual rebuilding.',
      }
    default:
      return {
        lead: 'Lead with consistency: small daily effort usually outperforms bursts.',
        compensate: ' ',
      }
  }
}

function dignityAction(g: { dignity: string }): string {
  const { lead, compensate } = dignityLeanVsCompensate(g.dignity)
  if (lead.trim() && (!compensate || !compensate.trim())) return lead
  if (compensate && compensate.trim()) return `${lead}${lead.endsWith('.') ? ' ' : ' '}${compensate}`
  return lead
}

function actionsForGandanta(g: GrahaData, house?: number): string[] {
  if (!g.gandanta?.isGandanta) return []
  const sev = g.gandanta.severity
  const domain = grahaDomain(g)
  const practice = grahaGroundingPractice(g)
  const lifeArea = house ? `House ${house} (${houseLabel(house)})` : 'this life area'
  if (sev === 'exact') {
    return [
      `In ${g.name} (${g.rashiName}), transitions affect ${lifeArea}—keep decisions steady and avoid impulsive switches.`,
      `Ground ${domain} through ${practice}.`,
      dignityAction(g),
    ]
  }
  return [
    `When ${g.name} nears Gandanta, slow down choices affecting ${lifeArea}.`,
    `Maintain ${domain} with ${practice}.`,
    dignityAction(g),
  ]
}

function actionsForPushkara(g: GrahaData, house?: number): string[] {
  if (!g.pushkara?.isPushkara) return []
  if (g.pushkara.remedy) {
    return [
      g.pushkara.remedy,
      `While doing the remedy, actively express ${grahaDomain(g)} in ${house ? `House ${house} (${houseLabel(house)})` : 'the relevant life area'}.`,
      dignityAction(g),
    ]
  }
  return [
    `Create opportunities that match ${grahaDomain(g)} with consistent effort.`,
    `Reinforce progress through regular gratitude/charity tied to ${house ? `House ${house} (${houseLabel(house)})` : 'this domain'}.`,
    dignityAction(g),
  ]
}

function actionsForMrityuBhaga(g: GrahaData, house?: number): string[] {
  if (!g.mrityuBhaga?.isMrityuBhaga) return []
  if (g.mrityuBhaga.remedy) {
    return [
      g.mrityuBhaga.remedy,
      `Be careful with health/permissions/commitments in ${house ? `House ${house} (${houseLabel(house)})` : 'this life area'} while expressing ${grahaDomain(g)}.`,
      dignityAction(g),
    ]
  }
  return [
    `Be mindful with health and long-term planning for ${house ? `House ${house} (${houseLabel(house)})` : 'this life area'}.`,
    `Confirm facts before decisions to protect ${grahaDomain(g)}.`,
    dignityAction(g),
  ]
}

function actionsForYuddha(g: GrahaData, house?: number): string[] {
  if (!g.yuddha?.isWarring || (g.id !== 'Me' && g.id !== 'Ve')) return []
  const isWinner = g.yuddha.winner === g.id
  const lifeArea = house ? `House ${house} (${houseLabel(house)})` : 'this life area'
  const domain = grahaDomain(g)
  return [
    isWinner
      ? `Use your stronger ${domain} to lead with skill and diplomacy in ${lifeArea}.`
      : `Avoid ego escalation; confirm facts and negotiate calmly in ${lifeArea}.`,
    'When conflict appears, pause and choose the least reactive response.',
    dignityAction(g),
  ]
}

function strongestShadbalaInsight(input: {
  shadbala: ShadbalaResult
  grahas: GrahaData[]
  houseByGrahaId: Map<GrahaId, number>
}): InterpretationInsight | null {
  const strongest = input.shadbala.planets[input.shadbala.strongest]
  if (!strongest) return null
  const graha = input.grahas.find((g) => g.id === input.shadbala.strongest)
  if (!graha) return null
  const house = input.houseByGrahaId.get(graha.id)

  return makeInsight({
    title: `${graha.name} leads your chart`,
    message: `${graha.name} has the highest Shadbala (${strongest.totalShash.toFixed(2)} shastiamsa), showing reliable support in its significations. It amplifies ${house ? `your ${houseLabel(house)} (House ${house})` : 'its life area'}.`,
    tone: 'supportive',
    category: 'strength',
    priority: 95,
    relatedGrahas: [graha.id],
    house,
    actions: [
      'Channel this strength into consistent effort (small steps with monthly tracking)',
      'Use this graha’s domain as your “default focus” when planning important moves',
      dignityAction(graha),
    ],
  })
}

function weakShadbalaInsight(input: {
  shadbala: ShadbalaResult
  grahas: GrahaData[]
  houseByGrahaId: Map<GrahaId, number>
}): InterpretationInsight | null {
  const weakest = input.shadbala.planets[input.shadbala.weakest]
  if (!weakest) return null
  const graha = input.grahas.find((g) => g.id === input.shadbala.weakest)
  if (!graha) return null
  const house = input.houseByGrahaId.get(graha.id)

  return makeInsight({
    title: `${graha.name} needs support`,
    message: `${graha.name} is the lowest in Shadbala (${weakest.totalShash.toFixed(2)} shastiamsa). Support this graha’s themes carefully, especially in ${house ? `your ${houseLabel(house)} (House ${house})` : 'its life area'}.`,
    tone: 'caution',
    category: 'vulnerability',
    priority: 78,
    relatedGrahas: [graha.id],
    house,
    actions: [
      'Practice structure: schedules, commitments, and consistent skill-building in this life area',
      'When unsure, choose the simpler path and avoid rushing large decisions',
      dignityAction(graha),
    ],
  })
}

function specialConditionInsights(grahas: GrahaData[], houseByGrahaId: Map<GrahaId, number>): InterpretationInsight[] {
  const insights: InterpretationInsight[] = []
  for (const g of grahas) {
    const house = houseByGrahaId.get(g.id)
    if (g.gandanta?.isGandanta) {
      insights.push(makeInsight({
        title: `${g.name} in Gandanta`,
        message: `${g.name} sits near the ${g.gandanta.type ?? 'gandanta'} junction (${g.gandanta.distanceFromJunction?.toFixed(2)}°), indicating karmic intensity and transitional lessons. It highlights ${house ? `your ${houseLabel(house)} (House ${house})` : 'a transition zone'}.`,
        tone: g.gandanta.severity === 'exact' ? 'caution' : 'mixed',
        category: 'special',
        priority: g.gandanta.severity === 'exact' ? 92 : 72,
        relatedGrahas: [g.id],
        house,
        actions: actionsForGandanta(g, house),
      }))
    }
    if (g.mrityuBhaga?.isMrityuBhaga) {
      insights.push(makeInsight({
        title: `${g.name} near Mrityu Bhaga`,
        message: `${g.name} is ${g.mrityuBhaga.distanceFromMrityu.toFixed(2)}° from its sensitive degree. Exercise careful judgment in ${house ? `your ${houseLabel(house)} (House ${house})` : 'this life area'}.`,
        tone: 'caution',
        category: 'vulnerability',
        priority: g.mrityuBhaga.severity === 'exact' ? 90 : 74,
        relatedGrahas: [g.id],
        house,
        actions: actionsForMrityuBhaga(g, house),
      }))
    }
    if (g.pushkara?.isPushkara) {
      insights.push(makeInsight({
        title: `${g.name} in Pushkara zone`,
        message: `${g.name} falls in ${g.pushkara.type === 'pushkara_bhaga' ? 'Pushkara Bhaga' : 'Pushkara Navamsha'}, improving grace and recovery potential. It supports ${house ? `your ${houseLabel(house)} (House ${house})` : 'this life area'}.`,
        tone: 'supportive',
        category: 'strength',
        priority: 84,
        relatedGrahas: [g.id],
        house,
        actions: actionsForPushkara(g, house),
      }))
    }
    if (g.yuddha?.isWarring && (g.id === 'Me' || g.id === 'Ve')) {
      const isWinner = g.yuddha.winner === g.id
      insights.push(makeInsight({
        title: `${g.name} in planetary war`,
        message: isWinner
          ? `${g.name} wins yuddha with stronger expression under pressure. It tends to show strongly in ${house ? `House ${house} (${houseLabel(house)})` : 'its life area'}.`
          : `${g.name} loses yuddha, so results may feel delayed or compromised until supported by timing/transits. This pressure shows up in ${house ? `House ${house} (${houseLabel(house)})` : 'its life area'}.`,
        tone: isWinner ? 'mixed' : 'caution',
        category: 'special',
        priority: isWinner ? 70 : 86,
        relatedGrahas: [g.id],
        house,
        actions: actionsForYuddha(g, house),
      }))
    }
  }
  return insights
}

function yogiInsight(input: {
  yogi: YogiPointResult
  houses: HouseData
  houseSystem: HouseSystem
  grahas: GrahaData[]
}): InterpretationInsight {
  const yogiGraha = input.grahas.find((g) => g.id === input.yogi.yogiGraha)
  const useBhava = input.houseSystem === 'bhava_chalita'
  const yogiHouse = yogiGraha
    ? planetHouse(yogiGraha.lonSidereal, input.houses, useBhava)
    : undefined
  const yogiDomain = yogiGraha ? grahaDomain(yogiGraha) : 'the Yogi tendency'
  const yogiPractice = yogiGraha ? grahaGroundingPractice(yogiGraha) : 'consistent daily practice'

  return makeInsight({
    title: `Yogi graha: ${input.yogi.yogiGraha}`,
    message: `Prosperity opens through ${input.yogi.yogiGraha}; watch ${input.yogi.avayogiGraha} tendencies for leakage. This axis is most relevant in ${yogiHouse ? `your ${houseLabel(yogiHouse)} (House ${yogiHouse})` : 'the Yogi activation zone'}.`,
    tone: 'mixed',
    category: 'summary',
    priority: 76,
    relatedGrahas: [input.yogi.yogiGraha, input.yogi.avayogiGraha],
    house: yogiHouse,
    actions: [
      `Align daily decisions with ${yogiDomain} (choose what preserves clarity and consistency).`,
      `Reduce leakage by reviewing how “Avayogi” habits interrupt ${yogiDomain}; use ${yogiPractice} to recover balance.`,
    ],
  })
}

export function buildChartInterpretation(input: {
  grahas: GrahaData[]
  shadbala: ShadbalaResult
  yogiPoint: YogiPointResult
  houses: HouseData
  houseSystem: HouseSystem
}): ChartInterpretation {
  const strengths: InterpretationInsight[] = []
  const cautions: InterpretationInsight[] = []
  const houseByGrahaId = new Map<GrahaId, number>()
  const useBhava = input.houseSystem === 'bhava_chalita'
  for (const g of input.grahas) {
    houseByGrahaId.set(g.id, planetHouse(g.lonSidereal, input.houses, useBhava))
  }

  const special = specialConditionInsights(input.grahas, houseByGrahaId)

  const strongest = strongestShadbalaInsight({
    shadbala: input.shadbala,
    grahas: input.grahas,
    houseByGrahaId,
  })
  if (strongest) strengths.push(strongest)
  const weakest = weakShadbalaInsight({
    shadbala: input.shadbala,
    grahas: input.grahas,
    houseByGrahaId,
  })
  if (weakest) cautions.push(weakest)

  for (const s of special) {
    if (s.category === 'strength') strengths.push(s)
    else if (s.category === 'vulnerability') cautions.push(s)
  }

  const summary = yogiInsight({
    yogi: input.yogiPoint,
    houses: input.houses,
    houseSystem: input.houseSystem,
    grahas: input.grahas,
  })
  const all = [...strengths, ...cautions, ...special, summary]
    .sort((a, b) => b.priority - a.priority)

  return {
    headline: all[0]?.tone === 'caution'
      ? 'Chart shows high potential with specific karmic pressure points.'
      : 'Chart shows supportive foundations with actionable focus areas.',
    strengths: strengths.sort((a, b) => b.priority - a.priority),
    cautions: cautions.sort((a, b) => b.priority - a.priority),
    special: [...special, summary].sort((a, b) => b.priority - a.priority),
    topInsights: all.slice(0, 6),
  }
}
