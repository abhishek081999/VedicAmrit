// ─────────────────────────────────────────────────────────────
//  src/app/api/panchang/route.ts
//  GET /api/panchang?date=YYYY-MM-DD&lat=xx&lng=xx&tz=Asia/Kolkata
//  Returns full Panchang for a given date and location
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { fromZonedTime } from 'date-fns-tz'
import { redis, panchangCacheKey, CACHE_TTL } from '@/lib/redis'
import { getSunriseSunset } from '@/lib/engine/sunrise'
import {
  toJulianDay,
  getPlanetPosition,
  getAyanamsha,
  toSidereal,
  SWISSEPH_IDS,
} from '@/lib/engine/ephemeris'
import {
  getNakshatra, getTithi, getYoga, getKarana, getVara,
  getRahuKalam, getGulikaKalam, getYamaganda, getAbhijitMuhurta,
  getHoraTable,
} from '@/lib/engine/nakshatra'

export const runtime = 'nodejs'

// ── Input validation ──────────────────────────────────────────

const QuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format: YYYY-MM-DD'),
  lat:  z.coerce.number().min(-90).max(90),
  lng:  z.coerce.number().min(-180).max(180),
  tz:   z.string().default('Asia/Kolkata'),
  ayanamsha: z.enum([
    'lahiri','true_chitra','true_revati','true_pushya',
    'raman','usha_shashi','yukteshwar'
  ]).default('lahiri'),
})

// Sunrise/sunset now calculated via swisseph rise_trans (see sunrise.ts)

// ── Route handler ─────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const params = Object.fromEntries(req.nextUrl.searchParams)
    const query  = QuerySchema.safeParse(params)

    if (!query.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid parameters', details: query.error.errors },
        { status: 400 },
      )
    }

    const { date, lat, lng, tz, ayanamsha } = query.data

    // Check cache
    const cacheKey = panchangCacheKey(date, lat, lng)
    const cached   = await redis.get(cacheKey)
    if (cached) {
      return NextResponse.json({ success: true, data: cached, fromCache: true })
    }

    // Compute noon JD for the date (in UTC)
    const noonLocal = fromZonedTime(`${date}T12:00:00`, tz)
    const y = noonLocal.getUTCFullYear()
    const m = noonLocal.getUTCMonth() + 1
    const d = noonLocal.getUTCDate()
    const h = noonLocal.getUTCHours() + noonLocal.getUTCMinutes() / 60 + noonLocal.getUTCSeconds() / 3600

    const jd   = toJulianDay(y, m, d, h)
    const ayan = getAyanamsha(jd, ayanamsha)

    const sunPos  = getPlanetPosition(jd, SWISSEPH_IDS.Su)
    const moonPos = getPlanetPosition(jd, SWISSEPH_IDS.Mo)

    const sunSid  = toSidereal(sunPos.longitude,  ayan)
    const moonSid = toSidereal(moonPos.longitude, ayan)

    const vara    = getVara(jd)
    const tithi   = getTithi(moonSid, sunSid)
    const yoga    = getYoga(sunSid, moonSid)
    const karana  = getKarana(moonSid, sunSid)
    const moonNak = getNakshatra(moonSid)
    const sunNak  = getNakshatra(sunSid)

    // Real sunrise/sunset via swisseph rise_trans
    const { sunrise, sunset } = getSunriseSunset(date, lat, lng, tz)

    const rahuKalam   = getRahuKalam(sunrise, sunset, vara.number)
    const gulikaKalam = getGulikaKalam(sunrise, sunset, vara.number)
    const yamaganda   = getYamaganda(sunrise, sunset, vara.number)
    const abhijit     = getAbhijitMuhurta(sunrise, sunset)
    const horaTable   = getHoraTable(sunrise, sunset, vara.lord)

    const panchang = {
      date,
      location: { lat, lng, tz },
      ayanamsha,
      vara: {
        number:   vara.number,
        name:     vara.name,
        sanskrit: vara.sanskrit,
        lord:     vara.lord,
      },
      tithi: {
        number:  tithi.number,
        name:    tithi.name,
        paksha:  tithi.paksha,
        lord:    tithi.lord,
        percent: tithi.percent,
      },
      nakshatra: {
        index:   moonNak.index,
        name:    moonNak.name,
        pada:    moonNak.pada,
        lord:    moonNak.lord,
        degree:  moonNak.degreeInNak,
      },
      sunNakshatra: {
        index: sunNak.index,
        name:  sunNak.name,
        pada:  sunNak.pada,
        lord:  sunNak.lord,
      },
      yoga: {
        number:  yoga.number,
        name:    yoga.name,
        quality: yoga.quality,
        percent: yoga.percent,
      },
      karana: {
        number:  karana.number,
        name:    karana.name,
        type:    karana.type,
        isBhadra:karana.isBhadra,
      },
      sunrise: sunrise.toISOString(),
      sunset:  sunset.toISOString(),
      rahuKalam:   { start: rahuKalam.start.toISOString(),   end: rahuKalam.end.toISOString() },
      gulikaKalam: { start: gulikaKalam.start.toISOString(), end: gulikaKalam.end.toISOString() },
      yamaganda:   { start: yamaganda.start.toISOString(),   end: yamaganda.end.toISOString() },
      abhijitMuhurta: abhijit
        ? { start: abhijit.start.toISOString(), end: abhijit.end.toISOString() }
        : null,
      horaTable: horaTable.map((h) => ({
        lord:      h.lord,
        start:     h.start.toISOString(),
        end:       h.end.toISOString(),
        isDaytime: h.isDaytime,
      })),
      sunLongitudeSidereal:  sunSid,
      moonLongitudeSidereal: moonSid,
      julianDay: jd,
    }

    // Cache for 24 hours
    await redis.set(cacheKey, panchang, CACHE_TTL.PANCHANG)

    return NextResponse.json(
      { success: true, data: panchang, fromCache: false },
      { headers: { 'Cache-Control': 'public, s-maxage=3600' } },
    )

  } catch (err) {
    console.error('[panchang] Error:', err)
    return NextResponse.json(
      { success: false, error: 'Panchang calculation failed' },
      { status: 500 },
    )
  }
}