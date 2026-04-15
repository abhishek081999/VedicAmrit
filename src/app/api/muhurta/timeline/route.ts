
import { NextRequest, NextResponse } from 'next/server';
import { getSunriseSunset } from '@/lib/engine/sunrise';
import { 
  getVara, 
  getTithi, 
  getNakshatra, 
  getYoga, 
  getKarana, 
  getRahuKalam, 
  getGulikaKalam, 
  getYamaganda, 
  getAbhijitMuhurta 
} from '@/lib/engine/nakshatra';
import { dateToJD, getPlanetPosition, SWISSEPH_IDS } from '@/lib/engine/ephemeris';
import { analyzeMuhurta, MuhurtaActivity } from '@/lib/engine/muhurtaAnalysis';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get('lat') || '28.6139');
    const lng = parseFloat(searchParams.get('lng') || '77.2090');
    const tz = searchParams.get('tz') || 'Asia/Kolkata';
    const natalNakIndex = parseInt(searchParams.get('natalNak') || '0');
    const ayanMode = (searchParams.get('ayan') || 'lahiri') as any;

    let lastStage = 'init';
    const startDate = new Date();
    
    try {
      lastStage = 'ayanamsha';
      const jdStart = dateToJD(startDate);
      getAyanamsha(jdStart, ayanMode); 
    } catch (e) {
      console.error('Ayanamsha initialization failed:', e);
    }

    const intervals = 48; 
    const timelineData = [];

    const dateToday = startDate.toISOString().split('T')[0];
    const nextDate = new Date(startDate.getTime() + 86400000).toISOString().split('T')[0];
    
    lastStage = 'sunInfoToday';
    const sunInfoToday = getSunriseSunset(dateToday, lat, lng, tz);
    lastStage = 'sunInfoNext';
    const sunInfoNext = getSunriseSunset(nextDate, lat, lng, tz);

    for (let i = 0; i < intervals; i++) {
      const currentTime = new Date(startDate.getTime() + i * 30 * 60 * 1000);
      const jd = dateToJD(currentTime);
      
      lastStage = `interval-${i}-positions`;
      let sunPos, moonPos;
      try {
        sunPos = getPlanetPosition(jd, SWISSEPH_IDS.Su, true);
        moonPos = getPlanetPosition(jd, SWISSEPH_IDS.Mo, true);
      } catch (epheError) {
        console.error(`Ephemeris error at interval ${i}:`, epheError);
        continue;
      }

      lastStage = `interval-${i}-panchang`;
      const tithi = getTithi(moonPos.longitude, sunPos.longitude);
      const nakshatra = getNakshatra(moonPos.longitude);
      const yoga = getYoga(sunPos.longitude, moonPos.longitude);
      const karana = getKarana(moonPos.longitude, sunPos.longitude);
      const vara = getVara(jd);

      lastStage = `interval-${i}-kalam`;
      let sunInfo;
      try {
        sunInfo = currentTime < sunInfoNext.sunrise ? sunInfoToday : sunInfoNext;
      } catch (e) {
        sunInfo = sunInfoToday;
      }

      const rahu = getRahuKalam(sunInfo.sunrise, sunInfo.sunset, vara.number);
      const gulika = getGulikaKalam(sunInfo.sunrise, sunInfo.sunset, vara.number);
      const yamaganda = getYamaganda(sunInfo.sunrise, sunInfo.sunset, vara.number);
      const abhijit = getAbhijitMuhurta(sunInfo.sunrise, sunInfo.sunset);

      const isRahuKalam = currentTime >= rahu.start && currentTime <= rahu.end;
      const isGulikaKalam = currentTime >= gulika.start && currentTime <= gulika.end;
      const isYamaganda = currentTime >= yamaganda.start && currentTime <= yamaganda.end;
      const isAbhijit = abhijit ? (currentTime >= abhijit.start && currentTime <= abhijit.end) : false;

      lastStage = `interval-${i}-scoring`;
      const activities: MuhurtaActivity[] = ['BUSINESS', 'TRAVEL', 'REAL_ESTATE', 'RELATIONSHIP', 'HEALTH', 'SPIRITUAL'];
      const scores: any = {};

      activities.forEach(act => {
        try {
          scores[act] = analyzeMuhurta(act, {
            tithi, nakshatra, yoga, karana, vara,
            isRahuKalam, isGulikaKalam, isYamaganda, isAbhijit
          }, natalNakIndex);
        } catch (scoringError) {
          scores[act] = { score: 0, label: 'Neutral', factors: ['Error in calculation'] };
        }
      });

      timelineData.push({
        time: currentTime.toISOString(),
        scores
      });
    }

    return NextResponse.json(timelineData);
  } catch (error: any) {
    console.error('CRITICAL Muhurta Timeline API Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Unknown error',
      stage: lastStage,
      stack: error.stack 
    }, { status: 500 });
  }
}
