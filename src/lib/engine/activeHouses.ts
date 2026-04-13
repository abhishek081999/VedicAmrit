import { ChartOutput, GrahaId, GrahaData, LagnaData } from '@/types/astrology'

// Simplified lordship mapping
const RASHI_LORD: Record<number, GrahaId> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
  7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju'
}

export function getActiveHouses(
  chart: ChartOutput, 
  transitMoonLon?: number, 
  customGrahas?: GrahaData[],
  customLagnas?: LagnaData
): number[] {
  const { lagnas: natalLagnas, grahas: natalGrahas, dashas } = chart
  const grahas = customGrahas || natalGrahas
  const lagnas = customLagnas || natalLagnas
  const ascRashi = lagnas.ascRashi
  const activeHousesSet = new Set<number>()

  const getHouseOfRashi = (r: number) => ((r - ascRashi + 12) % 12) + 1
  
  // 1. Dasha Logic
  const findCurrentLords = (nodes: any[]): string[] => {
    let lords: string[] = []
    const current = nodes.find(n => n.isCurrent)
    if (current) {
      lords.push(current.lord)
      if (current.children) {
        lords = [...lords, ...findCurrentLords(current.children)]
      }
    }
    return lords
  }

  const activeLords = findCurrentLords(dashas.vimshottari || [])
  
  // Check MD and AD
  activeLords.slice(0, 2).forEach(lord => {
    // Placement
    const g = grahas.find(p => p.id === lord)
    if (g) activeHousesSet.add(getHouseOfRashi(g.rashi))
    
    // Ownership
    for (let i = 1; i <= 12; i++) {
      const rashiOfHouse = ((ascRashi + i - 2) % 12) + 1
      if (RASHI_LORD[rashiOfHouse] === lord) {
        activeHousesSet.add(i)
      }
    }
  })

  // 2. Transit Logic
  if (transitMoonLon !== undefined) {
    const tMoonRashi = Math.floor(transitMoonLon / 30) + 1
    activeHousesSet.add(getHouseOfRashi(tMoonRashi))
  }

  // 3. Progression Logic (BCP - Bhrigu Chakra Paddhati)
  // House active = (Age at birthday % 12) + 1
  const birthDate = new Date(chart.meta.birthDate)
  const now = new Date()
  let age = now.getFullYear() - birthDate.getFullYear()
  const m = now.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < birthDate.getDate())) {
    age--
  }
  const progressionHouse = (age % 12) + 1
  activeHousesSet.add(progressionHouse)

  return Array.from(activeHousesSet).sort((a, b) => a - b)
}

export function getProgressionHouse(birthDateStr: string): number {
    const birthDate = new Date(birthDateStr)
    const now = new Date()
    let age = now.getFullYear() - birthDate.getFullYear()
    const m = now.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && now.getDate() < birthDate.getDate())) {
      age--
    }
    return (age % 12) + 1
}

export function getHouseTopics(): Record<number, string> {
  return {
    1:  'Self, vitality, beginning',
    2:  'Value, wealth, speech',
    3:  'Efforts, siblings, skills',
    4:  'Happiness, home, mother',
    5:  'Creativity, children, joy',
    6:  'Service, health, routine',
    7:  'Partnership, trade, others',
    8:  'Transformation, depth, longevity',
    9:  'Luck, dharma, wisdom',
    10: 'Action, career, status',
    11: 'Gains, community, dreams',
    12: 'Spirituality, release, loss',
  }
}
