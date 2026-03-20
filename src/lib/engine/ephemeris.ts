import sweph from 'sweph'
import path from 'path'
import type { GrahaId, AyanamshaMode, PlanetPosition } from '@/types/astrology'

const ephePath = process.env.EPHE_PATH
  ? path.resolve(process.env.EPHE_PATH)
  : path.join(process.cwd(), 'ephe')

sweph.set_ephe_path(ephePath)

const C = sweph.constants

export const PLANET_IDS: Record<Exclude<GrahaId, 'Ke'>, number> = {
  Su: C.SE_SUN,   Mo: C.SE_MOON,    Ma: C.SE_MARS,
  Me: C.SE_MERCURY, Ju: C.SE_JUPITER, Ve: C.SE_VENUS,
  Sa: C.SE_SATURN,  Ra: C.SE_MEAN_NODE,
  Ur: C.SE_URANUS,  Ne: C.SE_NEPTUNE,  Pl: C.SE_PLUTO,
}

export const SWISSEPH_IDS = PLANET_IDS  // backward compat

const AYANAMSHA_IDS: Record<AyanamshaMode, number> = {
  lahiri:      C.SE_SIDM_LAHIRI,
  true_chitra: C.SE_SIDM_TRUE_CITRA,
  true_revati: C.SE_SIDM_TRUE_REVATI,
  true_pushya: C.SE_SIDM_TRUE_PUSHYA,
  raman:       C.SE_SIDM_RAMAN,
  usha_shashi: C.SE_SIDM_USHASHASHI,
  yukteshwar:  C.SE_SIDM_YUKTESHWAR,
}

const FLAGS = C.SEFLG_SWIEPH | C.SEFLG_SPEED

export function toJulianDay(y: number, m: number, d: number, h: number): number {
  return sweph.julday(y, m, d, h, C.SE_GREG_CAL)
}

export function localToUT(hour: number, min: number, sec: number, utcOffset: number): number {
  return (hour + min / 60 + sec / 3600) - utcOffset
}

export function getPlanetPosition(jd: number, planetId: number): PlanetPosition {
  const r = sweph.calc_ut(jd, planetId, FLAGS) as any
  if (r.error) throw new Error(`sweph error planet ${planetId}: ${r.error}`)
  // sweph returns nested: r.data[0]=lon, r.data[1]=lat, r.data[2]=dist, r.data[3]=speed
  const lon   = r.data[0]
  const lat   = r.data[1]
  const dist  = r.data[2]
  const speed = r.data[3]
  return {
    longitude: lon,
    latitude:  lat,
    distance:  dist,
    speed:     speed,
    isRetro:   speed < 0,
  }
}

export function getAyanamsha(jd: number, mode: AyanamshaMode): number {
  sweph.set_sid_mode(AYANAMSHA_IDS[mode], 0, 0)
  const r = sweph.get_ayanamsa_ut(jd) as any
  return typeof r === 'number' ? r : r.data ?? r
}

export function toSidereal(tropical: number, ayanamsha: number): number {
  return ((tropical - ayanamsha) + 360) % 360
}

export function signOf(lon: number): number {
  return Math.floor(((lon % 360) + 360) % 360 / 30) + 1
}

export function degreeInSign(lon: number): number {
  return ((lon % 360) + 360) % 360 % 30
}

export function nakshatraOf(lon: number): number {
  return Math.floor(((lon % 360) + 360) % 360 / (360 / 27))
}

export function padaOf(lon: number): number {
  const nak = 360 / 27
  return Math.floor(((lon % 360) + 360) % 360 % nak / (nak / 4)) + 1
}

export function ketuLongitude(rahuLon: number): number {
  return (rahuLon + 180) % 360
}

export function getAscendant(jd: number, lat: number, lng: number, hsys = 'W') {
  const r = sweph.houses(jd, lat, lng, hsys) as any
  if (r.error) throw new Error(`houses error: ${r.error}`)
  return {
    ascendant: r.ascendant ?? r.data?.ascendant ?? 0,
    mc:        r.mc        ?? r.data?.mc        ?? 0,
    cusps:     r.cusps     ?? r.data?.cusps     ?? [],
  }
}

export function isCombust(id: GrahaId, planetLon: number, sunLon: number): boolean {
  const orbs: Partial<Record<GrahaId, number>> = {
    Mo:12, Ma:17, Me:14, Ju:11, Ve:10, Sa:15
  }
  const orb = orbs[id]
  if (!orb) return false
  let diff = Math.abs(planetLon - sunLon) % 360
  if (diff > 180) diff = 360 - diff
  return diff < orb
}

export function jdToDate(jd: number): Date {
  const r = sweph.revjul(jd, C.SE_GREG_CAL) as any
  const h = Math.floor(r.hour), mn = Math.floor((r.hour - h) * 60)
  const s = Math.round(((r.hour - h) * 60 - mn) * 60)
  return new Date(Date.UTC(r.year, r.month - 1, r.day, h, mn, s))
}

export function dateToJD(date: Date): number {
  return toJulianDay(
    date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate(),
    date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600,
  )
}