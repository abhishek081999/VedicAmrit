// ─────────────────────────────────────────────────────────────
//  src/lib/engine/calculator.ts
//  High-level chart orchestrator — Phase 1 complete
//  Wires: ephemeris → ayanamsha → houses → nakshatra
//         → vargas → arudhas → karakas → dignity → dasha → panchang
// ─────────────────────────────────────────────────────────────

import { calculateShadbala } from './shadbala'
import type { ShadbalaResult } from '@/types/astrology'
import { getSunriseSunset } from './sunrise'
import {
  SWISSEPH_IDS,
  dateToJD,
  degreeInSign,
  getAyanamsha,
  getPlanetPosition,
  isCombust,
  ketuLongitude,
  signOf,
  toSidereal,
} from '@/lib/engine/ephemeris'
import { calcHouses } from '@/lib/engine/houses'
import { calcAllBhavaArudhas, calcGrahaArudhas } from '@/lib/engine/arudhas'
import { calcCharaKarakas } from '@/lib/engine/karakas'
import { getDignity } from '@/lib/engine/dignity'
import {
  VARGA_FUNCTIONS,
  KALA_VARGAS, VELA_VARGAS, ALL_VARGAS,
  type VargaName,
} from '@/lib/engine/vargas'
import { calculateAshtakavarga } from './ashtakavarga'
import { detectYogas }           from './yogas'
import { calcYoginiDasha }       from './dasha/yogini'
import { calcCharaDasha }        from './dasha/chara'
import { calcVimshottari } from '@/lib/engine/dasha/vimshottari'
import {
  getKarana, getNakshatra, getTithi,
  getVara, getYoga,
  getRahuKalam, getGulikaKalam, getYamaganda, getAbhijitMuhurta,
} from '@/lib/engine/nakshatra'
import {
  DEFAULT_SETTINGS,
  GRAHA_NAMES,
  RASHI_NAMES,
  type ChartOutput,
  type ChartSettings,
  type GrahaData,
  type GrahaId,
  type Rashi,
  type UserPlan,
} from '@/types/astrology'

// ── Input ─────────────────────────────────────────────────────

export interface CalculateChartInput {
  name: string
  birthDate: string   // 'YYYY-MM-DD'
  birthTime: string   // 'HH:MM:SS' (in UTC — convert before calling)
  birthPlace: string
  latitude: number
  longitude: number
  timezone: string
  settings?: ChartSettings
}

// ── Helpers ───────────────────────────────────────────────────

function parseBirthUtc(date: string, time: string): Date {
  const safeTime = /^\d{2}:\d{2}:\d{2}$/.test(time) ? time : `${time}:00`
  return new Date(`${date}T${safeTime}Z`)
}

function buildGrahas(
  jd: number,
  ayanamsha: number,
  sunTropLon: number,
): GrahaData[] {
  const order: Array<Exclude<GrahaId, 'Ke'>> = [
    'Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra'
  ]

  const grahas: GrahaData[] = order.map((id): GrahaData => {
    const pos = getPlanetPosition(jd, SWISSEPH_IDS[id])
    const lonSidereal = toSidereal(pos.longitude, ayanamsha)
    const nak = getNakshatra(lonSidereal)
    const rashi = signOf(lonSidereal) as Rashi
    const deg = degreeInSign(lonSidereal)
    const dignity = getDignity(id, rashi, deg)

    // Bālādi avastha (Odd/Even signs)
    let baladi = ''
    const isOdd = rashi % 2 !== 0
    if (isOdd) {
      if (deg < 6) baladi = 'Bāla'; else if (deg < 12) baladi = 'Kumāra'; else if (deg < 18) baladi = 'Yuva'; else if (deg < 24) baladi = 'Vṛddha'; else baladi = 'Mṛta'
    } else {
      if (deg < 6) baladi = 'Mṛta'; else if (deg < 12) baladi = 'Vṛddha'; else if (deg < 18) baladi = 'Yuva'; else if (deg < 24) baladi = 'Kumāra'; else baladi = 'Bāla'
    }

    // Jāgradadi avastha
    let jagradadi = (dignity === 'exalted' || dignity === 'own') ? 'Jāgrat'
      : (dignity === 'neutral' || dignity === 'friend') ? 'Swapna'
        : 'Suṣupti'

    return {
      id,
      name: GRAHA_NAMES[id],
      lonTropical: pos.longitude,
      lonSidereal,
      latitude: pos.latitude,
      speed: pos.speed,
      isRetro: pos.isRetro,
      isCombust: id !== 'Su' ? isCombust(id, pos.longitude, sunTropLon) : false,
      rashi,
      rashiName: RASHI_NAMES[rashi],
      degree: deg,
      totalDegree: lonSidereal,
      nakshatraIndex: nak.index,
      nakshatraName: nak.name,
      pada: nak.pada,
      dignity,
      avastha: { baladi, jagradadi },
      charaKaraka: null,
    }
  })

  // Ketu
  const rahu = grahas.find((g) => g.id === 'Ra')!
  const ketuLonSid = ketuLongitude(rahu.lonSidereal)
  const ketuNak = getNakshatra(ketuLonSid)
  const ketuRashi = signOf(ketuLonSid) as Rashi
  const ketuDeg = degreeInSign(ketuLonSid)
  const kDig = getDignity('Ke', ketuRashi, ketuDeg)

  let kBaladi = ''
  if (ketuRashi % 2 !== 0) {
    if (ketuDeg < 6) kBaladi = 'Bāla'; else if (ketuDeg < 12) kBaladi = 'Kumāra'; else if (ketuDeg < 18) kBaladi = 'Yuva'; else if (ketuDeg < 24) kBaladi = 'Vṛddha'; else kBaladi = 'Mṛta'
  } else {
    if (ketuDeg < 6) kBaladi = 'Mṛta'; else if (ketuDeg < 12) kBaladi = 'Vṛddha'; else if (ketuDeg < 18) kBaladi = 'Yuva'; else if (ketuDeg < 24) kBaladi = 'Kumāra'; else kBaladi = 'Bāla'
  }

  grahas.push({
    id: 'Ke', name: GRAHA_NAMES.Ke,
    lonTropical: ketuLongitude(rahu.lonTropical),
    lonSidereal: ketuLonSid,
    latitude: -rahu.latitude,
    speed: rahu.speed,
    isRetro: rahu.isRetro,
    isCombust: false,
    rashi: ketuRashi,
    rashiName: RASHI_NAMES[ketuRashi],
    degree: ketuDeg,
    totalDegree: ketuLonSid,
    nakshatraIndex: ketuNak.index,
    nakshatraName: ketuNak.name,
    pada: ketuNak.pada,
    dignity: kDig,
    avastha: { baladi: kBaladi, jagradadi: (kDig === 'exalted' || kDig === 'own') ? 'Jāgrat' : 'Swapna' },
    charaKaraka: null,
  })

  return grahas
}

function vargaNamesForPlan(plan: UserPlan): VargaName[] {
  if (plan === 'hora') return ALL_VARGAS
  return VELA_VARGAS  // all 16 standard vargas are free for everyone
}

// ── Main export ───────────────────────────────────────────────

export async function calculateChart(
  input: CalculateChartInput,
  plan: UserPlan = 'kala',
): Promise<ChartOutput> { // eslint-disable-line
  const settings = input.settings ?? DEFAULT_SETTINGS
  const birthUtc = parseBirthUtc(input.birthDate, input.birthTime)
  const jd = dateToJD(birthUtc)
  const ayanamshaVal = getAyanamsha(jd, settings.ayanamsha)

  // Grahas
  const sunTropLon = getPlanetPosition(jd, SWISSEPH_IDS.Su).longitude
  const grahas = buildGrahas(jd, ayanamshaVal, sunTropLon)
  const moon = grahas.find((g) => g.id === 'Mo')!
  const sun = grahas.find((g) => g.id === 'Su')!

  // Houses
  const houses = calcHouses(jd, input.latitude, input.longitude, settings.ayanamsha, settings.houseSystem)

  // Karakas — stamp roles onto grahas
  const karakas = calcCharaKarakas(
    grahas.map((g) => ({ id: g.id, lonSidereal: g.lonSidereal, degree: g.degree })),
    settings.karakaScheme,
  )
  for (const g of grahas) {
    g.charaKaraka = karakas.roleOf[g.id] ?? null
  }

  // Arudhas
  const ascRashi = houses.ascRashi
  const grahaSlim = grahas.map((g) => ({ id: g.id, rashi: g.rashi }))
  const bhavaArudhas = calcAllBhavaArudhas(ascRashi, grahaSlim)
  const grahaArudhas = calcGrahaArudhas(ascRashi, grahaSlim)

  // Vargas
  const vargaNames = vargaNamesForPlan(plan)
  const vargas: Record<string, GrahaData[]> = { D1: grahas }

  // vargaLagnas: ascendant sign in each varga chart
  // Apply the same divisional function to the ascendant's sidereal longitude
  const vargaLagnas: Record<string, Rashi> = { D1: houses.ascRashi }

  for (const vname of vargaNames) {
    if (vname === 'D1') continue
    const fn = VARGA_FUNCTIONS[vname]
    if (!fn) continue
    vargas[vname] = grahas.map((g) => {
      const vRashi = fn(g.lonSidereal) as Rashi
      return { ...g, rashi: vRashi, rashiName: RASHI_NAMES[vRashi] }
    })
    // Ascendant's varga lagna = apply same function to ascendant longitude
    vargaLagnas[vname] = fn(houses.ascendantSidereal) as Rashi
  }

  // Dashas
  const dashaDepth = plan === 'kala' ? 4 : 6
  const vimshottari = calcVimshottari(moon.lonSidereal, birthUtc, dashaDepth)

  // Panchang
  const tithi = getTithi(moon.lonSidereal, sun.lonSidereal)
  const yoga = getYoga(sun.lonSidereal, moon.lonSidereal)
  const karana = getKarana(moon.lonSidereal, sun.lonSidereal)
  const vara = getVara(jd)
  const moonNak = getNakshatra(moon.lonSidereal)

  // Real sunrise/sunset via swisseph rise_trans
  const birthDateStr = input.birthDate  // 'YYYY-MM-DD'
  const { sunrise, sunset } = getSunriseSunset(birthDateStr, input.latitude, input.longitude, input.timezone)
  const rahuKalam = getRahuKalam(sunrise, sunset, vara.number)
  const gulikaKalam = getGulikaKalam(sunrise, sunset, vara.number)
  const yamaganda = getYamaganda(sunrise, sunset, vara.number)
  const abhijit = getAbhijitMuhurta(sunrise, sunset)

  return {
    meta: {
      name: input.name, birthDate: input.birthDate, birthTime: input.birthTime,
      birthPlace: input.birthPlace, latitude: input.latitude, longitude: input.longitude,
      timezone: input.timezone, settings, calculatedAt: new Date(),
      ayanamshaValue: ayanamshaVal, julianDay: jd,
    },
    grahas,
    lagnas: {
      ascDegree: houses.ascendantSidereal,
      ascRashi: houses.ascRashi,
      ascDegreeInRashi: houses.ascDegreeInRashi,
      // HL: 2 components per hour = 60 degrees per hour from Sun
      // GL: 5 components per hour = 150 degrees per hour from Sun
      // BL: 1 component per hour = 30 degrees per hour from Sun
      horaLagna: (sun.totalDegree + (birthUtc.getTime() - sunrise.getTime()) / 3600000 * 60) % 360,
      ghatiLagna: (sun.totalDegree + (birthUtc.getTime() - sunrise.getTime()) / 3600000 * 150) % 360,
      bhavaLagna: (sun.totalDegree + (birthUtc.getTime() - sunrise.getTime()) / 3600000 * 30) % 360,
      pranapada: (sun.totalDegree + (birthUtc.getTime() - sunrise.getTime()) / 3600000 * 360 * 15) % 360, // approximate
      sriLagna: (moon.totalDegree + (moon.totalDegree % (360 / 9)) * 12) % 360, // placeholder Sri Lagna
      varnadaLagna: (houses.ascendantSidereal + sun.totalDegree) % 360, // placeholder
      cusps: houses.cuspsSidereal,
      bhavalCusps: houses.bhavasidereal,
    },
    arudhas: {
      AL: bhavaArudhas.AL, A2: bhavaArudhas.A2,
      A3: bhavaArudhas.A3, A4: bhavaArudhas.A4,
      A5: bhavaArudhas.A5, A6: bhavaArudhas.A6,
      A7: bhavaArudhas.A7, A8: bhavaArudhas.A8,
      A9: bhavaArudhas.A9, A10: bhavaArudhas.A10,
      A11: bhavaArudhas.A11, A12: bhavaArudhas.A12,
      grahaArudhas, suryaArudhas: {}, chandraArudhas: {},
    },
    karakas: {
      scheme: karakas.scheme,
      AK: karakas.AK, AmK: karakas.AmK, BK: karakas.BK, MK: karakas.MK,
      PK: karakas.PK, GK: karakas.GK, DK: karakas.DK, PiK: karakas.PiK,
    },
    vargas,
    vargaLagnas,
    dashas: {
      vimshottari,
      yogini: calcYoginiDasha(moonNak.index, moonNak.degreeInNak, birthUtc, 2),
      ashtottari: [],
      chara: calcCharaDasha(grahas, {
        ascDegree: houses.ascendantSidereal, ascRashi: houses.ascRashi,
        ascDegreeInRashi: houses.ascDegreeInRashi,
        horaLagna: 0, ghatiLagna: 0, bhavaLagna: 0,
        pranapada: 0, sriLagna: 0, varnadaLagna: 0,
        cusps: houses.cuspsSidereal, bhavalCusps: houses.bhavasidereal,
      }, birthUtc, 2),
      narayana: [], tithi_ashtottari: [], naisargika: [],
    },
    panchang: {
      date: input.birthDate,
      location: { lat: input.latitude, lng: input.longitude, tz: input.timezone },
      vara: { number: vara.number, name: vara.name, lord: vara.lord },
      tithi: { number: tithi.number, name: tithi.name, paksha: tithi.paksha, lord: tithi.lord, endTime: new Date(birthUtc.getTime() + 3600000) },
      nakshatra: { index: moonNak.index, name: moonNak.name, pada: moonNak.pada, lord: moonNak.lord, degree: moonNak.degreeInNak, moonNakshatra: moonNak.name },
      yoga: { number: yoga.number, name: yoga.name, endTime: new Date(birthUtc.getTime() + 3600000) },
      karana: { number: karana.number, name: karana.name, endTime: new Date(birthUtc.getTime() + 1800000) },
      sunrise, sunset, moonrise: null, moonset: null,
      rahuKalam, gulikaKalam, yamaganda, abhijitMuhurta: abhijit, horaTable: [],
    },
    upagrahas: {},
    shadbala: (calculateShadbala(
      grahas,
      {
        ascDegree: houses.ascendantSidereal,
        ascRashi: houses.ascRashi,
        ascDegreeInRashi: houses.ascDegreeInRashi,
        horaLagna: (sun.totalDegree + (birthUtc.getTime() - sunrise.getTime()) / 3600000 * 60) % 360,
        ghatiLagna: (sun.totalDegree + (birthUtc.getTime() - sunrise.getTime()) / 3600000 * 150) % 360,
        bhavaLagna: (sun.totalDegree + (birthUtc.getTime() - sunrise.getTime()) / 3600000 * 30) % 360,
        pranapada: (sun.totalDegree + (birthUtc.getTime() - sunrise.getTime()) / 3600000 * 360 * 15) % 360,
        sriLagna: (moon.totalDegree + (moon.totalDegree % (360 / 9)) * 12) % 360,
        varnadaLagna: (houses.ascendantSidereal + sun.totalDegree) % 360,
        cusps: houses.cuspsSidereal,
        bhavalCusps: houses.bhavasidereal,
      },
      birthUtc,
      sunrise,
      sunset,
      moon.totalDegree,
      sun.totalDegree,
    ) as ShadbalaResult),
    ashtakavarga: calculateAshtakavarga(grahas, {
      ascDegree: houses.ascendantSidereal, ascRashi: houses.ascRashi,
      ascDegreeInRashi: houses.ascDegreeInRashi,
      horaLagna: 0, ghatiLagna: 0, bhavaLagna: 0,
      pranapada: 0, sriLagna: 0, varnadaLagna: 0,
      cusps: houses.cuspsSidereal, bhavalCusps: houses.bhavasidereal,
    }),
    yogas: detectYogas(grahas, {
      ascDegree: houses.ascendantSidereal, ascRashi: houses.ascRashi,
      ascDegreeInRashi: houses.ascDegreeInRashi,
      horaLagna: 0, ghatiLagna: 0, bhavaLagna: 0,
      pranapada: 0, sriLagna: 0, varnadaLagna: 0,
      cusps: houses.cuspsSidereal, bhavalCusps: houses.bhavasidereal,
    }),
  }
}