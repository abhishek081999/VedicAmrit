// ─────────────────────────────────────────────────────────────
//  src/lib/engine/calculator.ts
//  High-level chart orchestrator — Phase 1 complete
//  Wires: ephemeris → ayanamsha → houses → nakshatra
//         → vargas → arudhas → karakas → dignity → dasha → panchang
// ─────────────────────────────────────────────────────────────

import { calculateVimsopaka } from './vimsopaka'
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
  NODE_IDS,
} from '@/lib/engine/ephemeris'
import { calcHouses } from '@/lib/engine/houses'
import { calcAllBhavaArudhas, calcGrahaArudhas } from '@/lib/engine/arudhas'
import { calcCharaKarakas } from '@/lib/engine/karakas'
import { getDignity, checkYuddha, getYuddhaForPlanet } from '@/lib/engine/dignity'
import {
  VARGA_FUNCTIONS,
  KALA_VARGAS, VELA_VARGAS, ALL_VARGAS,
  type VargaName,
} from '@/lib/engine/vargas'
import { calculateAshtakavarga } from './ashtakavarga'
import { detectYogas }           from './yogas'
import { calcYoginiDasha }       from './dasha/yogini'
import { calcCharaDasha }        from './dasha/chara'
import { calcAshtottari }        from './dasha/ashtottari'
import { calcVimshottari } from '@/lib/engine/dasha/vimshottari'
import {
  getKarana, getNakshatra, getTithi,
  getVara, getYoga,
  getRahuKalam, getGulikaKalam, getYamaganda, getAbhijitMuhurta,
  type GulikaMode,
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
  type YuddhaResult,
} from '@/types/astrology'
import { checkGandanta } from './gandanta'
import { checkPushkara } from './pushkara'
import { checkMrityuBhaga } from './mrityuBhaga'
import { calculateYogiPoint } from './yogiPoint'
import { buildChartInterpretation } from './advancedInterpretation'

// ── Input ─────────────────────────────────────────────────────

export interface CalculateChartInput {
  name: string
  birthDate: string   // local date
  birthTime: string   // local time
  utcDate: string     // UTC date for calculation
  utcTime: string     // UTC time for calculation
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
  nodeMode: 'mean' | 'true' = 'mean',
): GrahaData[] {
  const order: Array<Exclude<GrahaId, 'Ke'>> = [
    'Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra'
  ]

  // First pass: calculate all positions without gandanta/yuddha
  const tempGrahas = order.map((id) => {
    const swId = id === 'Ra' ? NODE_IDS[nodeMode] : SWISSEPH_IDS[id]
    const pos = getPlanetPosition(jd, swId)
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

  // Get Mercury and Venus for Yuddha calculation
  const mercury = tempGrahas.find((g) => g.id === 'Me')!
  const venus = tempGrahas.find((g) => g.id === 'Ve')!
  const yuddhaResult = checkYuddha(mercury.lonSidereal, venus.lonSidereal)

  // Second pass: add gandanta, yuddha, pushkara, mrityuBhaga to all planets
  const grahas: GrahaData[] = tempGrahas.map((g): GrahaData => ({
    ...g,
    gandanta: checkGandanta(g.lonSidereal),
    yuddha: getYuddhaForPlanet(g.id, mercury.lonSidereal, venus.lonSidereal),
    pushkara: checkPushkara(g.lonSidereal),
    mrityuBhaga: checkMrityuBhaga(g.lonSidereal),
  }))

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
    gandanta: checkGandanta(ketuLonSid),
    yuddha: { isWarring: false, planets: [], winner: null, loser: null, degreeDifference: yuddhaResult.degreeDifference, orb: yuddhaResult.orb },
    pushkara: checkPushkara(ketuLonSid),
    mrityuBhaga: checkMrityuBhaga(ketuLonSid),
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
  const birthUtc = parseBirthUtc(input.utcDate, input.utcTime)
  const jd = dateToJD(birthUtc)
  const ayanamshaVal = getAyanamsha(jd, settings.ayanamsha)

  // Grahas
  const sunTropLon = getPlanetPosition(jd, SWISSEPH_IDS.Su).longitude
  const grahas = buildGrahas(jd, ayanamshaVal, sunTropLon, settings.nodeMode)
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

  // Real sunrise/sunset via swisseph rise_trans
  const birthDateStr = input.birthDate  // 'YYYY-MM-DD'
  const { sunrise, sunset } = getSunriseSunset(birthDateStr, input.latitude, input.longitude, input.timezone)
  const vara = getVara(jd)
  const rahuKalam = getRahuKalam(sunrise, sunset, vara.number)
  const gulikaKalam = getGulikaKalam(sunrise, sunset, vara.number, (settings.gulikaMode ?? 'phaladipika') as GulikaMode)
  const yamaganda = getYamaganda(sunrise, sunset, vara.number)
  const abhijit = getAbhijitMuhurta(sunrise, sunset)

  // ── Special Lagnas (computed once, reused in lagnas + shadbala) ──────────
  const hoursFromSunrise = (birthUtc.getTime() - sunrise.getTime()) / 3600000
  const horaLagnaVal  = ((sun.totalDegree + hoursFromSunrise * 60)  % 360 + 360) % 360
  const ghatiLagnaVal = ((sun.totalDegree + hoursFromSunrise * 150) % 360 + 360) % 360
  const bhavaLagnaVal = ((sun.totalDegree + hoursFromSunrise * 30)  % 360 + 360) % 360

  // Pranapada (BPHS): Sun + (ghatis from sunrise × 30°/ghati)
  const ghatiFromSunrise = hoursFromSunrise * 2.5  // 1 hr = 2.5 ghatis
  const pranapadaVal = ((sun.totalDegree + ghatiFromSunrise * 30) % 360 + 360) % 360

  // Sri Lagna (BPHS): Asc + (Moon's navamsha index within sign × 30°)
  const moonNavamshaIdx = Math.floor((moon.totalDegree % 30) / (30 / 9)) // 0-8
  const sriLagnaVal = ((houses.ascendantSidereal + moonNavamshaIdx * 30) % 360 + 360) % 360

  // Varnada Lagna (BPHS): based on Asc sign parity + Hora Lagna sign
  const hlSign = Math.floor(horaLagnaVal / 30) + 1 // 1-12
  const varnadaVal = houses.ascRashi % 2 === 1
    ? ((((houses.ascRashi - 1 + hlSign - 1) % 12) * 30 + 15) % 360 + 360) % 360
    : (((((houses.ascRashi - 1 - (hlSign - 1)) % 12 + 12) % 12) * 30 + 15) % 360 + 360) % 360

  const lagnaData = {
    ascDegree:        houses.ascendantSidereal,
    ascRashi:         houses.ascRashi,
    ascDegreeInRashi: houses.ascDegreeInRashi,
    horaLagna:        horaLagnaVal,
    ghatiLagna:       ghatiLagnaVal,
    bhavaLagna:       bhavaLagnaVal,
    pranapada:        pranapadaVal,
    sriLagna:         sriLagnaVal,
    varnadaLagna:     varnadaVal,
    cusps:            houses.cuspsSidereal,
  }

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

  // Vimsopaka Bala
  const vimsopaka = calculateVimsopaka(grahas, vargas)

  // Yogi Point (prosperity analysis)
  const yogiPoint = calculateYogiPoint(sun.lonSidereal, moon.lonSidereal)
  const shadbala = (calculateShadbala(
    grahas,
    lagnaData,
    birthUtc,
    sunrise,
    sunset,
    moon.totalDegree,
    sun.totalDegree,
  ) as ShadbalaResult)
  const interpretation = buildChartInterpretation({
    grahas,
    shadbala,
    yogiPoint,
    houses,
    houseSystem: settings.houseSystem,
  })

  // Dashas
  const dashaDepth = plan === 'kala' ? 4 : 6
  const vimshottari = calcVimshottari(moon.lonSidereal, birthUtc, dashaDepth)

  // Panchang
  const tithi = getTithi(moon.lonSidereal, sun.lonSidereal)
  const yoga = getYoga(sun.lonSidereal, moon.lonSidereal)
  const karana = getKarana(moon.lonSidereal, sun.lonSidereal)
  const moonNak = getNakshatra(moon.lonSidereal)

  return {
    meta: {
      name: input.name, birthDate: input.birthDate, birthTime: input.birthTime,
      birthPlace: input.birthPlace, latitude: input.latitude, longitude: input.longitude,
      timezone: input.timezone, settings, calculatedAt: new Date(),
      ayanamshaValue: ayanamshaVal, julianDay: jd,
    },
    grahas,
    lagnas: {
      ascDegree:        lagnaData.ascDegree,
      ascRashi:         lagnaData.ascRashi,
      ascDegreeInRashi: lagnaData.ascDegreeInRashi,
      horaLagna:        lagnaData.horaLagna,
      ghatiLagna:       lagnaData.ghatiLagna,
      bhavaLagna:       lagnaData.bhavaLagna,
      pranapada:        lagnaData.pranapada,
      sriLagna:         lagnaData.sriLagna,
      varnadaLagna:     lagnaData.varnadaLagna,
      cusps:            lagnaData.cusps,
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
      ashtottari: calcAshtottari(moon.lonSidereal, birthUtc, 3),
      chara: calcCharaDasha(grahas, lagnaData, birthUtc, 2),
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
    shadbala,
    vimsopaka,
    ashtakavarga: calculateAshtakavarga(grahas, lagnaData),
    yogas: detectYogas(grahas, lagnaData),
    yogiPoint,
    interpretation,
  }
}