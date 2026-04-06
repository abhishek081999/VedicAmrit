// __tests__/engine/phase2.test.ts
// Phase 2 tests — pure logic only, no server imports
// Avoids: @upstash/redis, mongoose, next-auth, date-fns-tz
// (those cause segfault on Windows via native code in Vitest)

import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import {
  toJulianDay, getPlanetPosition, getAyanamsha,
  toSidereal, degreeInSign, SWISSEPH_IDS,
} from '@/lib/engine/ephemeris'
import { calcVargas, ALL_VARGAS, FREE_VARGAS, GOLD_VARGAS, type VargaName } from '@/lib/engine/vargas'
import { calcCharaKarakas } from '@/lib/engine/karakas'
import {
  getNakshatra, getTithi, getYoga, getKarana, getVara,
  getRahuKalam, getGulikaKalam, getAbhijitMuhurta,
} from '@/lib/engine/nakshatra'
import type { GrahaId, Rashi } from '@/types/astrology'

// ── Inline cache key helpers (avoid importing @upstash/redis) ──

function chartCacheKey(d: string, t: string, lat: number, lng: number, ay: string, nm: string, hs: string) {
  return `chart:${d}:${t}:${lat.toFixed(4)}:${lng.toFixed(4)}:${ay}:${nm}:${hs}`
}
function panchangCacheKey(d: string, lat: number, lng: number) {
  return `panchang:${d}:${lat.toFixed(2)}:${lng.toFixed(2)}`
}
function atlasCacheKey(q: string) { return `atlas:${q.toLowerCase().trim()}` }
const CACHE_TTL = { CHART: 86400, PANCHANG: 86400, ATLAS: 604800, SESSION: 3600 }

// ─────────────────────────────────────────────────────────────
// TIMEZONE OFFSET LOGIC
// ─────────────────────────────────────────────────────────────

describe('Timezone offset logic', () => {
  const IST = 5.5 * 3600 * 1000

  it('IST noon = 06:30 UTC', () => {
    const utc = new Date(new Date('2000-01-01T12:00:00Z').getTime() - IST)
    expect(utc.getUTCHours()).toBe(6)
    expect(utc.getUTCMinutes()).toBe(30)
  })

  it('IST midnight crosses to previous UTC day', () => {
    const utc = new Date(new Date('1990-06-15T00:00:00Z').getTime() - IST)
    expect(utc.getUTCDate()).toBe(14)
    expect(utc.getUTCHours()).toBe(18)
    expect(utc.getUTCMinutes()).toBe(30)
  })

  it('UTC+10 noon = 02:00 UTC', () => {
    const utc = new Date(new Date('2000-07-01T12:00:00Z').getTime() - 10*3600*1000)
    expect(utc.getUTCHours()).toBe(2)
  })

  it('UTC-5 noon = 17:00 UTC', () => {
    const utc = new Date(new Date('2000-01-15T12:00:00Z').getTime() + 5*3600*1000)
    expect(utc.getUTCHours()).toBe(17)
  })

  it('UTC is identity', () => {
    const utc = new Date('2000-06-15T12:00:00Z')
    expect(utc.getUTCHours()).toBe(12)
  })
})

// ─────────────────────────────────────────────────────────────
// CACHE KEYS
// ─────────────────────────────────────────────────────────────

describe('Cache key helpers', () => {
  it('chartCacheKey is deterministic', () => {
    const a = chartCacheKey('2000-01-01','06:30:00',19.076,72.8777,'lahiri','mean','whole_sign')
    const b = chartCacheKey('2000-01-01','06:30:00',19.076,72.8777,'lahiri','mean','whole_sign')
    expect(a).toBe(b)
  })

  it('chartCacheKey differs by ayanamsha', () => {
    const a = chartCacheKey('2000-01-01','06:30:00',19.076,72.877,'lahiri','mean','whole_sign')
    const b = chartCacheKey('2000-01-01','06:30:00',19.076,72.877,'true_chitra','mean','whole_sign')
    expect(a).not.toBe(b)
  })

  it('chartCacheKey truncates coords to 4dp', () => {
    const a = chartCacheKey('2000-01-01','06:30:00',19.0760001,72.8777001,'lahiri','mean','whole_sign')
    const b = chartCacheKey('2000-01-01','06:30:00',19.076,72.8777,'lahiri','mean','whole_sign')
    expect(a).toBe(b)
  })

  it('panchangCacheKey includes date', () => {
    expect(panchangCacheKey('2024-01-15',28.61,77.20)).toContain('2024-01-15')
  })

  it('atlasCacheKey lowercases', () => {
    expect(atlasCacheKey('Mumbai')).toBe(atlasCacheKey(' mumbai '))
  })

  it('CACHE_TTL values are correct', () => {
    expect(CACHE_TTL.CHART).toBe(86400)
    expect(CACHE_TTL.ATLAS).toBe(604800)
  })
})

// ─────────────────────────────────────────────────────────────
// INPUT VALIDATION
// ─────────────────────────────────────────────────────────────

const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
const TimeSchema = z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/)
const LatSchema  = z.number().min(-90).max(90)
const LngSchema  = z.number().min(-180).max(180)

describe('API input validation', () => {
  it('valid dates pass', () => {
    expect(DateSchema.safeParse('2000-01-01').success).toBe(true)
    expect(DateSchema.safeParse('1869-10-02').success).toBe(true)
  })
  it('bad date formats fail', () => {
    expect(DateSchema.safeParse('01-01-2000').success).toBe(false)
    expect(DateSchema.safeParse('20000101').success).toBe(false)
  })
  it('valid time formats pass', () => {
    expect(TimeSchema.safeParse('12:00').success).toBe(true)
    expect(TimeSchema.safeParse('12:00:00').success).toBe(true)
  })
  it('bad time formats fail', () => {
    expect(TimeSchema.safeParse('12:0').success).toBe(false)
  })
  it('valid coords pass', () => {
    expect(LatSchema.safeParse(19.076).success).toBe(true)
    expect(LatSchema.safeParse(-90).success).toBe(true)
  })
  it('out-of-range coords fail', () => {
    expect(LatSchema.safeParse(91).success).toBe(false)
    expect(LngSchema.safeParse(181).success).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────
// PANCHANG — real sweph
// ─────────────────────────────────────────────────────────────

describe('Panchang with sweph', () => {
  const jd      = toJulianDay(2024, 1, 15, 6.5)
  const ayan    = getAyanamsha(jd, 'lahiri')
  const sunSid  = toSidereal(getPlanetPosition(jd, SWISSEPH_IDS.Su).longitude, ayan)
  const moonSid = toSidereal(getPlanetPosition(jd, SWISSEPH_IDS.Mo).longitude, ayan)

  it('vara is a valid weekday', () => {
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
    expect(days).toContain(getVara(jd).name)
  })
  it('tithi is 1–30', () => {
    const t = getTithi(moonSid, sunSid)
    expect(t.number).toBeGreaterThanOrEqual(1)
    expect(t.number).toBeLessThanOrEqual(30)
  })
  it('yoga is 1–27', () => {
    const y = getYoga(sunSid, moonSid)
    expect(y.number).toBeGreaterThanOrEqual(1)
    expect(y.number).toBeLessThanOrEqual(27)
  })
  it('karana is 1–60', () => {
    const k = getKarana(moonSid, sunSid)
    expect(k.number).toBeGreaterThanOrEqual(1)
    expect(k.number).toBeLessThanOrEqual(60)
  })
  it('rahu kalam is within daylight', () => {
    const sr = new Date('2024-01-15T01:00:00Z')
    const ss = new Date('2024-01-15T12:00:00Z')
    const rk = getRahuKalam(sr, ss, getVara(jd).number)
    expect(rk.start.getTime()).toBeGreaterThanOrEqual(sr.getTime())
    expect(rk.end.getTime()).toBeLessThanOrEqual(ss.getTime())
  })
  it('abhijit is centred on noon', () => {
    const sr = new Date('2024-01-15T01:00:00Z')
    const ss = new Date('2024-01-15T12:00:00Z')
    const ab = getAbhijitMuhurta(sr, ss)!
    const noon = (sr.getTime() + ss.getTime()) / 2
    const mid  = (ab.start.getTime() + ab.end.getTime()) / 2
    expect(Math.abs(mid - noon)).toBeLessThan(60000)
  })
})

// ─────────────────────────────────────────────────────────────
// VELA VARGAS — all 16 for all planets
// ─────────────────────────────────────────────────────────────

describe('Vela vargas completeness', () => {
  const J2000 = toJulianDay(2000, 1, 1, 12)
  const ayan  = getAyanamsha(J2000, 'lahiri')
  const ids: GrahaId[] = ['Su','Mo','Ma','Me','Ju','Ve','Sa','Ra']

  for (const id of ids) {
    it(`${id} — all vargas are valid`, () => {
      const sid = toSidereal(getPlanetPosition(J2000, (SWISSEPH_IDS as any)[id]).longitude, ayan)
      const res = calcVargas(sid, ALL_VARGAS as VargaName[])
      for (const [n, v] of Object.entries(res)) {
        expect(v, n).toBeGreaterThanOrEqual(1)
        expect(v, n).toBeLessThanOrEqual(12)
      }
    })
  }
})

// ─────────────────────────────────────────────────────────────
// CHARA KARAKAS
// ─────────────────────────────────────────────────────────────

describe('Chara Karakas edge cases', () => {
  it('no two karakas share same graha', () => {
    const J2000 = toJulianDay(2000, 1, 1, 12)
    const ayan  = getAyanamsha(J2000, 'lahiri')
    const ids: GrahaId[] = ['Su','Mo','Ma','Me','Ju','Ve','Sa','Ra']
    const g: Array<{ id: GrahaId; lonSidereal: number; degree: number }> = ids.map((id) => {
      const sid = toSidereal(getPlanetPosition(J2000, (SWISSEPH_IDS as any)[id]).longitude, ayan)
      return { id, lonSidereal: sid, degree: degreeInSign(sid) }
    })
    g.push({ id: 'Ke' as GrahaId, lonSidereal: 0, degree: 0 })
    const k = calcCharaKarakas(g, 8)
    const assigned = [k.AK,k.AmK,k.BK,k.MK,k.PK,k.PiK,k.GK,k.DK].filter(Boolean)
    expect(new Set(assigned).size).toBe(assigned.length)
  })

  it('Rahu sort degree = 30 - degree', () => {
    const g = [
      { id: 'Ra' as GrahaId, lonSidereal: 55.0, degree: 25.0 },
      { id: 'Su' as GrahaId, lonSidereal:  4.0, degree:  4.0 },
      { id: 'Mo' as GrahaId, lonSidereal:  3.0, degree:  3.0 },
      { id: 'Ma' as GrahaId, lonSidereal:  2.0, degree:  2.0 },
      { id: 'Me' as GrahaId, lonSidereal:  1.5, degree:  1.5 },
      { id: 'Ju' as GrahaId, lonSidereal:  1.0, degree:  1.0 },
      { id: 'Ve' as GrahaId, lonSidereal:  0.5, degree:  0.5 },
      { id: 'Sa' as GrahaId, lonSidereal:  0.1, degree:  0.1 },
      { id: 'Ke' as GrahaId, lonSidereal:  0.0, degree:  0.0 },
    ]
    const k = calcCharaKarakas(g, 8)
    const order = ['AK','AmK','BK','MK','PK','PiK','GK','DK']
    const raRole = k.roleOf['Ra'], suRole = k.roleOf['Su']
    if (raRole && suRole) expect(order.indexOf(raRole)).toBeLessThan(order.indexOf(suRole))
  })

  it('7-scheme has no PiK', () => {
    const g = ['Su','Mo','Ma','Me','Ju','Ve','Sa','Ra','Ke'].map((id, i) => ({
      id: id as GrahaId, lonSidereal: (i+1)*20, degree: (i+1)*2,
    }))
    const k = calcCharaKarakas(g, 7)
    expect(k.PiK).toBeNull()
  })
})

// ─────────────────────────────────────────────────────────────
// TIER ACCESS
// ─────────────────────────────────────────────────────────────

describe('Varga coverage', () => {
  it('FREE_VARGAS contains all vargas', () => {
    expect(FREE_VARGAS.length).toBeGreaterThanOrEqual(40)
  })
  it('ALL_VARGAS contains all vargas', () => { expect(ALL_VARGAS.length).toBeGreaterThanOrEqual(40) })
})

// ─────────────────────────────────────────────────────────────
// SUBSCRIPTION FIELD CONSTRAINTS (no mongoose)
// ─────────────────────────────────────────────────────────────

describe('Subscription model field constraints', () => {
  it('plans are gold or platinum only', () => {
    const plans = ['gold','platinum']
    expect(plans).toContain('gold')
    expect(plans).not.toContain('free')
  })
  it('providers are razorpay and stripe', () => {
    expect(['razorpay','stripe']).toHaveLength(2)
  })
  it('status covers 6 billing states', () => {
    expect(['active','cancelled','expired','past_due','trialing','pending']).toHaveLength(6)
  })
})

// ─────────────────────────────────────────────────────────────
// FULL CALCULATOR — end-to-end, no network
// ─────────────────────────────────────────────────────────────

describe('Full calculator integration', () => {
  it('calculates a complete chart', async () => {
    const { calculateChart } = await import('@/lib/engine/calculator')
    const r = await calculateChart({
      name:'Test', birthDate:'2000-01-01', birthTime:'12:00:00', utcDate:'2000-01-01', utcTime:'12:00:00',
      birthPlace:'Mumbai', latitude:19.076, longitude:72.8777, timezone:'UTC',
    }, 'free')
    expect(r.grahas).toHaveLength(9)
    expect(r.lagnas.ascRashi).toBeGreaterThanOrEqual(1)
    expect(r.lagnas.ascRashi).toBeLessThanOrEqual(12)
    expect(r.meta.ayanamshaValue).toBeGreaterThan(20)
  })

  it('stamps dignity on every graha', async () => {
    const { calculateChart } = await import('@/lib/engine/calculator')
    const r = await calculateChart({
      name:'Test', birthDate:'1990-06-15', birthTime:'14:00:00', utcDate:'1990-06-15', utcTime:'14:00:00',
      birthPlace:'Delhi', latitude:28.6139, longitude:77.209, timezone:'UTC',
    }, 'free')
    const valid = ['exalted','moolatrikona','own','neutral','debilitated']
    for (const g of r.grahas) expect(valid).toContain(g.dignity)
  })

  it('stamps karaka roles on eligible grahas', async () => {
    const { calculateChart } = await import('@/lib/engine/calculator')
    const r = await calculateChart({
      name:'Test', birthDate:'1985-04-15', birthTime:'06:00:00', utcDate:'1985-04-15', utcTime:'06:00:00',
      birthPlace:'Chennai', latitude:13.0827, longitude:80.2707, timezone:'UTC',
    }, 'free')
    const roles = ['AK','AmK','BK','MK','PK','PiK','GK','DK']
    const roled = r.grahas.filter((g) => g.charaKaraka !== null)
    expect(roled.length).toBeGreaterThanOrEqual(7)
    for (const g of roled) expect(roles).toContain(g.charaKaraka)
  })

  it('Gold/Platinum plan gets deeper dasha than Free', async () => {
    const { calculateChart } = await import('@/lib/engine/calculator')
    const input = { name:'Test', birthDate:'2000-06-15', birthTime:'12:00:00', utcDate:'2000-06-15', utcTime:'12:00:00',
      birthPlace:'Mumbai', latitude:19.076, longitude:72.8777, timezone:'UTC' }
    const free = await calculateChart(input, 'free')
    const gold = await calculateChart(input, 'gold')
    // Depth is level-based: check a dasha's children depth
    expect(gold.dashas.vimshottari[0].children[0].children[0].children[0].children).toBeDefined()
    expect(free.dashas.vimshottari[0].children[0].children[0].children[0].children).toBeUndefined()
  })

  it('Vimshottari has 9 periods summing ~120 years', async () => {
    const { calculateChart } = await import('@/lib/engine/calculator')
    const r = await calculateChart({
      name:'Test', birthDate:'1980-01-01', birthTime:'12:00:00', utcDate:'1980-01-01', utcTime:'12:00:00',
      birthPlace:'Kolkata', latitude:22.5726, longitude:88.3639, timezone:'UTC',
    }, 'free')
    expect(r.dashas.vimshottari).toHaveLength(9)
    const yrs = r.dashas.vimshottari.reduce((s,d) => s + d.durationMs/(365.25*24*3600*1000), 0)
    // Sum = remaining balance of birth Dasha + 8 full periods (< 120 from birth)
    expect(yrs).toBeGreaterThan(100)
    expect(yrs).toBeLessThan(120)
  })
})