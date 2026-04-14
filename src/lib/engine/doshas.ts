/**
 * src/lib/engine/doshas.ts
 * Advanced Vedic Relationship Analysis: Manglik Dosha, Pape-Samya, Dasha-Sandhi
 */

import { GrahaData, Rashi } from '@/types/astrology'

export interface ManglikAnalysis {
  isManglik: boolean
  intensity: 'None' | 'Low' | 'High'
  house: number
  cancellations: string[]
  score: number // 0 to 100
}

export interface PapeSamyaAnalysis {
  totalWeight: number
  houseWeights: Record<number, number>
}

/**
 * Calculate Kuja Dosha (Manglik) status for a chart
 * Mars in 1, 4, 7, 8, 12 from Lagna, Moon, or Venus
 */
export function calculateManglik(
  grahas: GrahaData[],
  houses: number[], 
  ascRashi: Rashi
): ManglikAnalysis {
  const mars = grahas.find(g => g.id === 'Ma')
  if (!mars) return { isManglik: false, intensity: 'None', house: 0, cancellations: [], score: 0 }

  // House of Mars in D1 (Lagna Chart)
  const marsHouse = ((mars.rashi - ascRashi + 12) % 12) + 1
  const manglikHouses = [1, 4, 7, 8, 12]
  
  if (!manglikHouses.includes(marsHouse)) {
    return { isManglik: false, intensity: 'None', house: marsHouse, cancellations: [], score: 0 }
  }

  const cancellations: string[] = []
  
  if (mars.rashi === 1 || mars.rashi === 8) cancellations.push('Mars in Own Sign (Swakshetra)')
  if (mars.rashi === 10) cancellations.push('Mars Exalted (Ucha)')
  
  if (marsHouse === 4 && mars.rashi === 8) cancellations.push('Mars in 4th in Scorpio exception')
  if (marsHouse === 7 && mars.rashi === 10) cancellations.push('Mars in 7th in Capricorn exception')
  if (marsHouse === 8 && mars.rashi === 4) cancellations.push('Mars in 8th in Cancer exception')
  if (marsHouse === 12 && mars.rashi === 9) cancellations.push('Mars in 12th in Sagittarius exception')

  const jupiter = grahas.find(g => g.id === 'Ju')
  if (jupiter) {
    const juHouse = ((jupiter.rashi - ascRashi + 12) % 12) + 1
    const dist = ((juHouse - marsHouse + 12) % 12) + 1
    if (dist === 1 || dist === 5 || dist === 9 || dist === 7) {
      cancellations.push('Jupiter Aspect/Conjunction (Guru Drishti)')
    }
  }

  const isCancelled = cancellations.length > 0
  const baseScore = marsHouse === 8 ? 100 : marsHouse === 7 ? 90 : 70
  const finalScore = isCancelled ? baseScore * 0.3 : baseScore

  return {
    isManglik: !isCancelled,
    intensity: finalScore > 70 ? 'High' : (finalScore > 0 ? 'Low' : 'None'),
    house: marsHouse,
    cancellations,
    score: finalScore
  }
}

/**
 * Pape-Samya: Assign weights to malefic planets in specific houses
 */
export function calculatePapeSamya(grahas: GrahaData[], ascRashi: Rashi): PapeSamyaAnalysis {
  const malefics = ['Su', 'Ma', 'Sa', 'Ra', 'Ke']
  const focalHouses = [1, 2, 4, 7, 8, 12]
  const houseWeights: Record<number, number> = { 1: 0, 2: 0, 4: 0, 7: 0, 8: 0, 12: 0 }
  let total = 0

  grahas.forEach(g => {
    const h = ((g.rashi - ascRashi + 12) % 12) + 1
    if (malefics.includes(g.id) && focalHouses.includes(h)) {
      const weight = g.id === 'Su' ? 0.25 : 1.0
      houseWeights[h] += weight
      total += weight
    }
  })

  return { totalWeight: total, houseWeights }
}
