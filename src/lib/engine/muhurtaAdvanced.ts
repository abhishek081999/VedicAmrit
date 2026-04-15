
import { GrahaId } from '@/types/astrology';

// ── Choghadiya ────────────────────────────────────────────────
// Seven types of Choghadiya based on planetary lords:
// Udveg (Sun), Chala (Mercury), Labh (Venus), Amrit (Moon), 
// Kaal (Saturn), Shubh (Jupiter), Rog (Mars)

export type ChoghadiyaType = 'Amrit' | 'Shubh' | 'Labh' | 'Chala' | 'Rog' | 'Kaal' | 'Udveg';

const CHOGHADIYA_SEQUENCE: ChoghadiyaType[] = ['Udveg', 'Chala', 'Labh', 'Amrit', 'Kaal', 'Shubh', 'Rog'];

// Starting indices in CHOGHADIYA_SEQUENCE for each weekday (Sun=0...Sat=6)
const DAY_CHOG_START_MAP: Record<number, number> = {
  0: 0, // Sun: Udveg
  1: 3, // Mon: Amrit
  2: 6, // Tue: Rog
  3: 2, // Wed: Labh
  4: 5, // Thu: Shubh
  5: 1, // Fri: Chala
  6: 4  // Sat: Kaal
};

const NIGHT_CHOG_START_MAP: Record<number, number> = {
  0: 5, // Sun: Shubh
  1: 2, // Mon: Labh (Correcting: standard sequence for night)
  2: 6, // Tue: Rog
  3: 3, // Wed: Amrit
  4: 0, // Thu: Udveg
  5: 4, // Fri: Kaal
  6: 1  // Sat: Chala
};

/**
 * Get the Choghadiya for a specific time.
 * A Choghadiya is 1/8th of the daytime or nighttime.
 */
export function getChoghadiya(
  time: Date,
  sunrise: Date,
  sunset: Date,
  nextSunrise: Date,
  vara: number
): { type: ChoghadiyaType; quality: 'Good' | 'Neutral' | 'Bad' } {
  const isDay = time >= sunrise && time < sunset;
  const startMap = isDay ? DAY_CHOG_START_MAP : NIGHT_CHOG_START_MAP;
  const startIdx = startMap[vara];
  
  let diffPercent: number;
  if (isDay) {
    diffPercent = (time.getTime() - sunrise.getTime()) / (sunset.getTime() - sunrise.getTime());
  } else {
    const duration = nextSunrise.getTime() - sunset.getTime();
    let diff = time.getTime() - sunset.getTime();
    if (diff < 0) diff += 24 * 3600000; // Handle pre-midnight cases
    diffPercent = diff / duration;
  }
  
  const slot = Math.floor(diffPercent * 8);
  const type = CHOGHADIYA_SEQUENCE[(startIdx + slot) % 7];
  
  const quality: Record<ChoghadiyaType, 'Good' | 'Neutral' | 'Bad'> = {
    Amrit: 'Good', 
    Shubh: 'Good', 
    Labh: 'Good',
    Chala: 'Neutral',
    Rog: 'Bad', 
    Kaal: 'Bad', 
    Udveg: 'Bad'
  };
  
  return { type, quality: quality[type] };
}

// ── Muhurta Panchaka ──────────────────────────────────────────
// Traditional formula: (Tithi + Vara + Nakshatra + Lagna) % 9

export function getMuhurtaPanchaka(
  tithi: number, 
  vara: number, // 0=Sun...6=Sat
  nakshatra: number, // 1=Ashwini...27=Revati
  lagna: number // 1=Aries...12=Pisces
): { remainder: number; label: string; isAuspicious: boolean } {
  // Traditional numbering starts at 1
  const sum = tithi + (vara + 1) + nakshatra + lagna;
  const remainder = sum % 9;
  
  const labels: Record<number, string> = {
    1: 'Mrityu Panchaka (Danger)',
    2: 'Agni Panchaka (Fire/Theft)',
    4: 'Raja Panchaka (Legal/State)',
    6: 'Chora Panchaka (Loss/Theft)',
    8: 'Roga Panchaka (Disease)'
  };
  
  const label = labels[remainder] || 'Shubh Panchaka (Auspicious)';
  const isAuspicious = ![1, 2, 4, 6, 8].includes(remainder);
  
  return { remainder, label, isAuspicious };
}
