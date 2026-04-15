
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
  | 'SPIRITUAL'
  | 'MARRIAGE'
  | 'EDUCATION'
  | 'GENERAL';

export type ChoghadiyaType = 'Amrit' | 'Shubh' | 'Labh' | 'Chala' | 'Rog' | 'Kaal' | 'Udveg';

export interface MuhurtaScore {
  score: number; // 0-100
  label: 'Excellent' | 'Good' | 'Neutral' | 'Challenging' | 'Avoid';
  factors: string[];
  diagnostics?: {
    choghadiya?: { type: string; quality: string };
    panchaka?: { label: string; isAuspicious: boolean; remainder: number };
    taraBala?: { name: string; score: number };
    chandraBala?: { house: number; isFavorable: boolean };
  }
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
    horaLord?: GrahaId;
    choghadiya?: { type: ChoghadiyaType; quality: 'Good' | 'Neutral' | 'Bad' };
    panchaka?: { isAuspicious: boolean; label: string; remainder: number };
  },
  natal: { moonNak: number; moonSign: number }
): MuhurtaScore {
  let score = 50; // Base score
  const factors: string[] = [];
  const diag: NonNullable<MuhurtaScore['diagnostics']> = {};

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
  const diff = ((panchang.nakshatra.index - natal.moonNak + 27) % 27) + 1;
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
  diag.taraBala = { name: taraScores[tara].name, score: taraScores[tara].score };

  // --- Chandra Bala (Moon Sign Alignment) ---
  const transitSign = Math.floor(panchang.nakshatra.exactDegree / 30) + 1;
  const dist = ((transitSign - natal.moonSign + 12) % 12) + 1;
  // Favorable: 1, 3, 6, 7, 10, 11 from natal moon
  const favorableDist = [1, 3, 6, 7, 10, 11];
  const isChandraFavorable = favorableDist.includes(dist);
  diag.chandraBala = { house: dist, isFavorable: isChandraFavorable };

  if (isChandraFavorable) {
    score += 15;
    factors.push(`Chandra Bala: ${dist}th House (Favorable)`);
  } else if ([4, 8, 12].includes(dist)) {
    score -= 20;
    factors.push(`Chandra Bala: ${dist}th House (Challenging)`);
  } else {
    factors.push(`Chandra Bala: ${dist}th House (Neutral)`);
  }

  // --- Choghadiya ---
  if (panchang.choghadiya) {
    if (panchang.choghadiya.quality === 'Good') {
      score += 15;
      factors.push(`Choghadiya: ${panchang.choghadiya.type} (Good)`);
    } else if (panchang.choghadiya.quality === 'Bad') {
      score -= 20;
      factors.push(`Choghadiya: ${panchang.choghadiya.type} (Bad)`);
    }
    diag.choghadiya = { type: panchang.choghadiya.type, quality: panchang.choghadiya.quality };
  }

  // --- Panchaka ---
  if (panchang.panchaka) {
    if (!panchang.panchaka.isAuspicious) {
      score -= 15;
      factors.push(`Panchaka: ${panchang.panchaka.label}`);
    } else {
      factors.push(`Panchaka: Shubh`);
    }
    diag.panchaka = { label: panchang.panchaka.label, isAuspicious: panchang.panchaka.isAuspicious, remainder: panchang.panchaka.remainder };
  }

  // --- Hora ---
  if (panchang.horaLord) {
    const horaTargets: Record<MuhurtaActivity, GrahaId[]> = {
      BUSINESS: ['Me', 'Ju'],
      TRAVEL: ['Ve', 'Me'],
      REAL_ESTATE: ['Ju', 'Ma'],
      RELATIONSHIP: ['Ve', 'Mo'],
      HEALTH: ['Su', 'Ma'],
      SPIRITUAL: ['Ju', 'Su'],
      MARRIAGE: ['Ve', 'Ju'],
      EDUCATION: ['Ju', 'Me'],
      GENERAL: ['Ju', 'Mo'],
    };
    if (horaTargets[activity].includes(panchang.horaLord)) {
      score += 10;
      factors.push(`Auspicious Hora: ${panchang.horaLord}`);
    }
  }

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
      if (['Rohini', 'Mrigashira', 'Anuradha', 'Revati'].includes(panchang.nakshatra.name)) {
        score += 20;
        factors.push('Connection Harmony Nakshatra');
      }
      if (panchang.vara.name === 'Friday' || panchang.vara.name === 'Monday') {
        score += 10;
        factors.push('Love/Emotion Day');
      }
      break;

    case 'MARRIAGE':
      if (['Rohini', 'Mrigashira', 'Magha', 'Uttara Phalguni', 'Hasta', 'Swati', 'Anuradha', 'Mula', 'Uttara Ashadha', 'Uttara Bhadrapada', 'Revati'].includes(panchang.nakshatra.name)) {
        score += 25;
        factors.push('Classical Vivāha Nakshatra');
      }
      if ([2, 3, 5, 7, 10, 11, 13].includes(panchang.tithi.number % 15 || 15)) {
        score += 15;
        factors.push('Strong Marriage Tithi');
      }
      if (panchang.vara.name === 'Friday' || panchang.vara.name === 'Thursday') {
        score += 10;
        factors.push('Auspicious Wedding Day');
      }
      break;

    case 'EDUCATION':
      if (['Rohini', 'Mrigashira', 'Punarvasu', 'Hasta', 'Chitra', 'Swati', 'Anuradha', 'Shravana'].includes(panchang.nakshatra.name)) {
        score += 20;
        factors.push('Knowledge Seeker Nakshatra');
      }
      if ([2, 5, 6, 7, 10, 11].includes(panchang.tithi.number % 15 || 15)) {
        score += 10;
        factors.push('Good Tithi for Learning');
      }
      break;

    case 'GENERAL':
      if (panchang.choghadiya?.quality === 'Good') score += 10;
      if (panchang.isAbhijit) score += 10;
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

  return {
    score: finalScore,
    label,
    factors,
    diagnostics: diag
  };
}
