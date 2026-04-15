
/**
 * src/lib/engine/muhurtaAnalysis.ts
 * Logic for scoring specific activities based on Panchanga and planetary transits.
 */

import { NakshatraResult, TithiResult, YogaResult, KaranaResult, VaraResult } from './nakshatra';
import { GrahaId } from '@/types/astrology';

export type MuhurtaActivity = 
  | 'BUSINESS' 
  | 'TRAVEL' 
  | 'REAL_ESTATE' 
  | 'RELATIONSHIP' 
  | 'HEALTH' 
  | 'SPIRITUAL';

export interface MuhurtaScore {
  score: number; // 0-100
  label: 'Excellent' | 'Good' | 'Neutral' | 'Challenging' | 'Avoid';
  factors: string[];
}

export function analyzeMuhurta(
  activity: MuhurtaActivity,
  panchang: {
    tithi: TithiResult;
    nakshatra: NakshatraResult;
    yoga: YogaResult;
    karana: KaranaResult;
    vara: VaraResult;
    isRahuKalam: boolean;
    isGulikaKalam: boolean;
    isYamaganda: boolean;
    isAbhijit: boolean;
  },
  natalMoonNakIndex: number
): MuhurtaScore {
  let score = 50; // Base score
  const factors: string[] = [];

  // --- Common Factors (Universal) ---
  if (panchang.isRahuKalam) {
    score -= 30;
    factors.push('Rahu Kalam (Negative)');
  }
  if (panchang.isGulikaKalam) {
    score -= 15;
    factors.push('Gulika Kalam (Negative)');
  }
  if (panchang.isAbhijit && activity !== 'TRAVEL') {
    score += 20;
    factors.push('Abhijit Muhurta (Highly Auspicious)');
  }

  // --- Tara Bala (Natal Alignment) ---
  const diff = ((panchang.nakshatra.index - natalMoonNakIndex + 27) % 27) + 1;
  const tara = diff % 9 || 9;
  const taraScores: Record<number, { score: number; name: string }> = {
    1: { score: 0,   name: 'Janma' },
    2: { score: 20,  name: 'Sampat (Wealth)' },
    3: { score: -20, name: 'Vipat (Danger)' },
    4: { score: 15,  name: 'Kshem (Safety)' },
    5: { score: -15, name: 'Pratyari (Obstacles)' },
    6: { score: 20,  name: 'Sadhaka (Success)' },
    7: { score: -25, name: 'Vadha (Destruction)' },
    8: { score: 10,  name: 'Mitra (Friend)' },
    9: { score: 15,  name: 'Ati-Mitra (Best Friend)' },
  };
  score += taraScores[tara].score;
  factors.push(`Tara Bala: ${taraScores[tara].name}`);

  // --- Activity Specific Logic ---
  switch (activity) {
    case 'BUSINESS':
      if ([2, 3, 5, 7, 10, 11, 13].includes(panchang.tithi.number % 15 || 15)) {
        score += 15;
        factors.push('Favorable Tithi for Commerce');
      }
      if (['Ashwini', 'Pushya', 'Hasta', 'Chitra', 'Revati'].includes(panchang.nakshatra.name)) {
        score += 15;
        factors.push('Prosperity Nakshatra');
      }
      if (panchang.vara.name === 'Wednesday' || panchang.vara.name === 'Thursday') {
        score += 10;
        factors.push(`${panchang.vara.name} (Mercury/Jupiter Day)`);
      }
      break;

    case 'TRAVEL':
      if (['Ashwini', 'Mrigashira', 'Punarvasu', 'Pushya', 'Hasta', 'Anuradha', 'Shravana', 'Dhanishta', 'Shatabhisha'].includes(panchang.nakshatra.name)) {
        score += 20;
        factors.push('Excellent Nakshatra for Journey');
      }
      if (panchang.tithi.number === 4 || panchang.tithi.number === 9 || panchang.tithi.number === 14) {
        score -= 20;
        factors.push('Rikta Tithi (Avoid Travel)');
      }
      break;

    case 'REAL_ESTATE':
      if (['Rohini', 'Mrigashira', 'Chitra', 'Anuradha', 'Revati'].includes(panchang.nakshatra.name)) {
        score += 20;
        factors.push('Stability Nakshatra');
      }
      if (panchang.vara.name === 'Thursday' || panchang.vara.name === 'Friday') {
        score += 10;
        factors.push('Auspicious Weekday');
      }
      break;

    case 'SPIRITUAL':
      if (panchang.nakshatra.name === 'Pushya' || panchang.nakshatra.name === 'Shravana') {
        score += 25;
        factors.push('Divine Nakshatra');
      }
      if (panchang.tithi.name === 'Purnima' || panchang.tithi.number === 11) {
        score += 20;
        factors.push('Soul-Cleaning Tithi');
      }
      break;

    case 'HEALTH':
      if (['Ashwini', 'Pushya', 'Hasta'].includes(panchang.nakshatra.name)) {
        score += 20;
        factors.push('Vibrant Health Nakshatra');
      }
      if (panchang.vara.name === 'Sunday') {
        score += 10;
        factors.push('Sun (Vitality) Day');
      }
      break;

    case 'RELATIONSHIP':
      if (['Rohini', 'Uttara Phalguni', 'Uttara Ashadha', 'Uttara Bhadrapada'].includes(panchang.nakshatra.name)) {
        score += 20;
        factors.push('Long-term Union Nakshatra');
      }
      if (panchang.vara.name === 'Friday' || panchang.vara.name === 'Monday') {
        score += 10;
        factors.push('Love/Emotion Day');
      }
      break;
  }

  // Final normalization
  const finalScore = Math.max(0, Math.min(100, score));
  let label: MuhurtaScore['label'] = 'Neutral';
  if (finalScore >= 80) label = 'Excellent';
  else if (finalScore >= 65) label = 'Good';
  else if (finalScore >= 45) label = 'Neutral';
  else if (finalScore >= 30) label = 'Challenging';
  else label = 'Avoid';

  return { score: finalScore, label, factors };
}
