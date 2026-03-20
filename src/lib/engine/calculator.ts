// ─────────────────────────────────────────────────────────────
//  src/lib/engine/calculator.ts
//  High-level chart orchestrator — Phase 1 complete
//  Wires: ephemeris → ayanamsha → houses → nakshatra
//         → vargas → arudhas → karakas → dignity → dasha → panchang
// ─────────────────────────────────────────────────────────────

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
import { calcHouses }                    from '@/lib/engine/houses'
import { calcAllBhavaArudhas, calcGrahaArudhas } from '@/lib/engine/arudhas'
import { calcCharaKarakas }              from '@/lib/engine/karakas'
import { getDignity }                    from '@/lib/engine/dignity'
import {
  VARGA_FUNCTIONS,
  KALA_VARGAS, VELA_VARGAS, ALL_VARGAS,
  type VargaName,
} from '@/lib/engine/vargas'
import { calcVimshottari }               from '@/lib/engine/dasha/vimshottari'
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
  name:       string
  birthDate:  string   // 'YYYY-MM-DD'
  birthTime:  string   // 'HH:MM:SS' (in UTC — convert before calling)
  birthPlace: string
  latitude:   number
  longitude:  number
  timezone:   string
  settings?:  ChartSettings
}

// ── Helpers ───────────────────────────────────────────────────

function parseBirthUtc(date: string, time: string): Date {
  const safeTime = /^\d{2}:\d{2}:\d{2}$/.test(time) ? time : `${time}:00`
  return new Date(`${date}T${safeTime}Z`)
}

function buildGrahas(
  jd:        number,
  ayanamsha: number,
  sunTropLon: number,
): GrahaData[] {
  const order: Array<Exclude<GrahaId, 'Ke'>> = [
    'Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra',
  ]

  const grahas: GrahaData[] = order.map((id): GrahaData => {
    const pos         = getPlanetPosition(jd, SWISSEPH_IDS[id])
    const lonSidereal = toSidereal(pos.longitude, ayanamsha)
    const nak         = getNakshatra(lonSidereal)
    const rashi       = signOf(lonSidereal) as Rashi
    const deg         = degreeInSign(lonSidereal)

    return {
      id,
      name:           GRAHA_NAMES[id],
      lonTropical:    pos.longitude,
      lonSidereal,
      latitude:       pos.latitude,
      speed:          pos.speed,
      isRetro:        pos.isRetro,
      isCombust:      id !== 'Su' ? isCombust(pos.longitude, sunTropLon, id) : false,
      rashi,
      rashiName:      RASHI_NAMES[rashi],
      degree:         deg,
      totalDegree:    lonSidereal,
      nakshatraIndex: nak.index,
      nakshatraName:  nak.name,
      pada:           nak.pada,
      dignity:        getDignity(id, rashi, deg),
      charaKaraka:    null,
    }
  })

  // Ketu
  const rahu       = grahas.find((g) => g.id === 'Ra')!
  const ketuLonSid = ketuLongitude(rahu.lonSidereal)
  const ketuNak    = getNakshatra(ketuLonSid)
  const ketuRashi  = signOf(ketuLonSid) as Rashi
  const ketuDeg    = degreeInSign(ketuLonSid)

  grahas.push({
    id: 'Ke', name: GRAHA_NAMES.Ke,
    lonTropical:    ketuLongitude(rahu.lonTropical),
    lonSidereal:    ketuLonSid,
    latitude:       -rahu.latitude,
    speed:          rahu.speed,
    isRetro:        rahu.isRetro,
    isCombust:      false,
    rashi:          ketuRashi,
    rashiName:      RASHI_NAMES[ketuRashi],
    degree:         ketuDeg,
    totalDegree:    ketuLonSid,
    nakshatraIndex: ketuNak.index,
    nakshatraName:  ketuNak.name,
    pada:           ketuNak.pada,
    dignity:        getDignity('Ke', ketuRashi, ketuDeg),
    charaKaraka:    null,
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
  plan:  UserPlan = 'kala',
): Promise<ChartOutput> {
  const settings     = input.settings ?? DEFAULT_SETTINGS
  const birthUtc     = parseBirthUtc(input.birthDate, input.birthTime)
  const jd           = dateToJD(birthUtc)
  const ayanamshaVal = getAyanamsha(jd, settings.ayanamsha)

  // Grahas
  const sunTropLon = getPlanetPosition(jd, SWISSEPH_IDS.Su).longitude
  const grahas     = buildGrahas(jd, ayanamshaVal, sunTropLon)
  const moon       = grahas.find((g) => g.id === 'Mo')!
  const sun        = grahas.find((g) => g.id === 'Su')!

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
  const ascRashi     = houses.ascRashi
  const grahaSlim    = grahas.map((g) => ({ id: g.id, rashi: g.rashi }))
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
  const dashaDepth  = plan === 'kala' ? 4 : 6
  const vimshottari = calcVimshottari(moon.lonSidereal, birthUtc, dashaDepth)

  // Panchang
  const tithi   = getTithi(moon.lonSidereal, sun.lonSidereal)
  const yoga    = getYoga(sun.lonSidereal, moon.lonSidereal)
  const karana  = getKarana(moon.lonSidereal, sun.lonSidereal)
  const vara    = getVara(jd)
  const moonNak = getNakshatra(moon.lonSidereal)

  // Real sunrise/sunset via swisseph rise_trans
  const birthDateStr = input.birthDate  // 'YYYY-MM-DD'
  const { sunrise, sunset } = getSunriseSunset(birthDateStr, input.latitude, input.longitude, input.timezone)
  const rahuKalam   = getRahuKalam(sunrise, sunset, vara.number)
  const gulikaKalam = getGulikaKalam(sunrise, sunset, vara.number)
  const yamaganda   = getYamaganda(sunrise, sunset, vara.number)
  const abhijit     = getAbhijitMuhurta(sunrise, sunset)

  return {
    meta: {
      name: input.name, birthDate: input.birthDate, birthTime: input.birthTime,
      birthPlace: input.birthPlace, latitude: input.latitude, longitude: input.longitude,
      timezone: input.timezone, settings, calculatedAt: new Date(),
      ayanamshaValue: ayanamshaVal, julianDay: jd,
    },
    grahas,
    lagnas: {
      ascDegree:        houses.ascendantSidereal,
      ascRashi:         houses.ascRashi,
      ascDegreeInRashi: houses.ascDegreeInRashi,
      horaLagna: 0, ghatiLagna: 0, bhavaLagna: 0,
      pranapada: 0, sriLagna: 0, varnadaLagna: 0,
      cusps:       houses.cuspsSidereal,
      bhavalCusps: houses.bhavasidereal,
    },
    arudhas: {
      AL: bhavaArudhas.AL,   A2: bhavaArudhas.A2,
      A3: bhavaArudhas.A3,   A4: bhavaArudhas.A4,
      A5: bhavaArudhas.A5,   A6: bhavaArudhas.A6,
      A7: bhavaArudhas.A7,   A8: bhavaArudhas.A8,
      A9: bhavaArudhas.A9,   A10: bhavaArudhas.A10,
      A11: bhavaArudhas.A11, A12: bhavaArudhas.A12,
      grahaArudhas, suryaArudhas: {}, chandraArudhas: {},
    },
    karakas: {
      scheme: karakas.scheme,
      AK: karakas.AK, AmK: karakas.AmK, BK: karakas.BK, MK: karakas.MK,
      PK: karakas.PK, GK: karakas.GK,   DK: karakas.DK, PiK: karakas.PiK,
    },
    vargas,
    vargaLagnas,
    dashas: {
      vimshottari, yogini: [], ashtottari: [],
      chara: [], narayana: [], tithi_ashtottari: [], naisargika: [],
    },
    panchang: {
      date: input.birthDate,
      location: { lat: input.latitude, lng: input.longitude, tz: input.timezone },
      vara: { number: vara.number, name: vara.name, lord: vara.lord },
      tithi: { number: tithi.number, name: tithi.name, paksha: tithi.paksha, lord: tithi.lord, endTime: new Date(birthUtc.getTime() + 3600000) },
      nakshatra: { index: moonNak.index, name: moonNak.name, pada: moonNak.pada, lord: moonNak.lord, degree: moonNak.degreeInNak, moonNakshatra: moonNak.name },
      yoga:   { number: yoga.number,   name: yoga.name,   endTime: new Date(birthUtc.getTime() + 3600000) },
      karana: { number: karana.number, name: karana.name, endTime: new Date(birthUtc.getTime() + 1800000) },
      sunrise, sunset, moonrise: null, moonset: null,
      rahuKalam, gulikaKalam, yamaganda, abhijitMuhurta: abhijit, horaTable: [],
    },
    upagrahas: {},
  }
}