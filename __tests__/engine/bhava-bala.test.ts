
import { describe, it, expect } from 'vitest'
import { calculateBhavaBala } from '@/lib/engine/bhavaBala'
import { calculateShadbala } from '@/lib/engine/shadbala'
import { toJulianDay, getPlanetPosition, getAyanamsha, toSidereal, SWISSEPH_IDS, ketuLongitude } from '@/lib/engine/ephemeris'
import { calcHouses } from '@/lib/engine/houses'
import { getDignity } from '@/lib/engine/dignity'
import type { GrahaId, Rashi, LagnaData } from '@/types/astrology'

describe('Bhava Bala Engine', () => {
  // Setup J2000 Chart for Delhi
const jd = 2451545.0 // 2000-01-01 12:00 UTC
const J2000_DATE = '2000-01-01T12:00:00Z'
  const lat = 28.6139
  const lon = 77.209
  const ayanMode = 'lahiri'
  const ayan = getAyanamsha(jd, ayanMode)

  const sun = getPlanetPosition(jd, SWISSEPH_IDS.Su)
  const moon = getPlanetPosition(jd, SWISSEPH_IDS.Mo)
  const mars = getPlanetPosition(jd, SWISSEPH_IDS.Ma)
  const mercury = getPlanetPosition(jd, SWISSEPH_IDS.Me)
  const jupiter = getPlanetPosition(jd, SWISSEPH_IDS.Ju)
  const venus = getPlanetPosition(jd, SWISSEPH_IDS.Ve)
  const saturn = getPlanetPosition(jd, SWISSEPH_IDS.Sa)
  const rahu = getPlanetPosition(jd, SWISSEPH_IDS.Ra)
  const ketuLon = ketuLongitude(rahu.longitude)

  const grahas: any[] = [
    { id: 'Su', lon: sun.longitude, lat: sun.latitude, speed: sun.speed, isRetro: sun.isRetro },
    { id: 'Mo', lon: moon.longitude, lat: moon.latitude, speed: moon.speed, isRetro: moon.isRetro },
    { id: 'Ma', lon: mars.longitude, lat: mars.latitude, speed: mars.speed, isRetro: mars.isRetro },
    { id: 'Me', lon: mercury.longitude, lat: mercury.latitude, speed: mercury.speed, isRetro: mercury.isRetro },
    { id: 'Ju', lon: jupiter.longitude, lat: jupiter.latitude, speed: jupiter.speed, isRetro: jupiter.isRetro },
    { id: 'Ve', lon: venus.longitude, lat: venus.latitude, speed: venus.speed, isRetro: venus.isRetro },
    { id: 'Sa', lon: saturn.longitude, lat: saturn.latitude, speed: saturn.speed, isRetro: saturn.isRetro },
    { id: 'Ra', lon: rahu.longitude, lat: rahu.latitude, speed: rahu.speed, isRetro: rahu.isRetro },
    { id: 'Ke', lon: ketuLon, lat: -rahu.latitude, speed: rahu.speed, isRetro: rahu.isRetro },
  ].map(g => {
    const lonSidereal = toSidereal(g.lon, ayan)
    const rashi = Math.floor(lonSidereal / 30) + 1 as Rashi
    const degree = lonSidereal % 30
    return {
      ...g,
      lonSidereal,
      totalDegree: lonSidereal,
      rashi,
      degree,
      dignity: getDignity(g.id as GrahaId, rashi, degree)
    }
  })

  const houses = calcHouses(jd, lat, lon, ayanMode, 'whole_sign')
  const lagnaData: LagnaData = {
    ascDegree: houses.ascendantSidereal,
    ascRashi: houses.ascRashi,
    ascDegreeInRashi: houses.ascDegreeInRashi,
    mcDegree: houses.mcSidereal,
    horaLagna: 0, ghatiLagna: 0, bhavaLagna: 0, pranapada: 0, sriLagna: 0, varnadaLagna: 0,
    cusps: houses.cuspsSidereal
  }
  const birthUtc = new Date(J2000_DATE)
  const sunrise = new Date(J2000_DATE)
  sunrise.setUTCHours(1, 4, 0) // Dummy sunrise
  const sunset = new Date(J2000_DATE)
  sunset.setUTCHours(12, 12, 0) // Dummy sunset
  
  const shadbala = calculateShadbala(
    grahas, 
    lagnaData, 
    birthUtc, 
    sunrise, 
    sunset, 
    grahas[1].lonSidereal, 
    grahas[0].lonSidereal
  )

  it('calculates 12 houses correctly', () => {
    const result = calculateBhavaBala(shadbala, grahas, lagnaData)
    expect(Object.keys(result.houses)).toHaveLength(12)
  })

  it('total strength is sum of adhipati, dig, and drishti', () => {
    const result = calculateBhavaBala(shadbala, grahas, lagnaData)
    const h1 = result.houses[1]
    const sum = h1.adhipatiBala + h1.digBala + h1.drishtiBala
    expect(h1.totalShash).toBeCloseTo(sum, 2)
  })

  it('identifies strongest and weakest house', () => {
    const result = calculateBhavaBala(shadbala, grahas, lagnaData)
    expect(result.strongestHouse).toBeGreaterThanOrEqual(1)
    expect(result.strongestHouse).toBeLessThanOrEqual(12)
    expect(result.weakestHouse).toBeGreaterThanOrEqual(1)
    expect(result.weakestHouse).toBeLessThanOrEqual(12)
  })

  it('Rupa value is Shash divided by 60', () => {
    const result = calculateBhavaBala(shadbala, grahas, lagnaData)
    const h5 = result.houses[5]
    expect(h5.totalRupa).toBeCloseTo(h5.totalShash / 60, 2)
  })
})
