// ─────────────────────────────────────────────────────────────
//  src/app/api/panchang/route.ts
//  GET /api/panchang?date=YYYY-MM-DD&lat=xx&lng=xx&tz=Asia/Kolkata
//  Returns full Panchang for a given date and location
// ───
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { fromZonedTime } from 'date-fns-tz'
import { auth } from '@/auth'
import connectDB from '@/lib/db/mongodb'
import { calculateChart } from '@/lib/engine/calculator'
import { redis, chartCacheKey } from '@/lib/redis'
import type { ChartSettings, UserPlan } from '@/types/astrology'

// Force Node.js runtime — sweph is a native C addon, incompatible with Edge
export const runtime = 'nodejs'

// ── Input schema ──────────────────────────────────────────────

const SettingsSchema = z.object({
  ayanamsha:    z.enum(['lahiri','true_chitra','true_revati','true_pushya','raman','usha_shashi','yukteshwar']).default('lahiri'),
  houseSystem:  z.enum(['whole_sign','placidus','equal','bhava_chalita']).default('whole_sign'),
  nodeMode:     z.enum(['mean','true']).default('mean'),
  karakaScheme: z.union([z.literal(7), z.literal(8)]).default(8),
  gulikaMode:   z.enum(['begin','middle','end','phaladipika']).default('phaladipika'),
  chartStyle:   z.enum(['south','north','circle','bhava','bhava_chalita','sarvatobhadra']).default('south'),
  showDegrees:  z.boolean().default(true),
  showNakshatra:z.boolean().default(false),
  showKaraka:   z.boolean().default(false),
  showRetro:    z.boolean().default(true),
})

const ChartInputSchema = z.object({
  name:      z.string().min(1, 'Name is required').max(100),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format: YYYY-MM-DD'),
  birthTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Format: HH:MM or HH:MM:SS'),
  birthPlace:z.string().min(1, 'Birth place is required'),
  latitude:  z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  timezone:  z.string().min(1, 'Timezone is required'),  // IANA e.g. 'Asia/Kolkata'
  settings:  SettingsSchema.default({}),
})

type ChartInput = z.infer<typeof ChartInputSchema>

function parseCachedChart(cached: unknown): any | null {
  if (!cached) return null
  if (typeof cached === 'string') {
    try {
      return JSON.parse(cached)
    } catch {
      return null
    }
  }
  if (typeof cached === 'object') return cached
  return null
}

function hasVimsopakaData(chartData: any): boolean {
  if (!chartData || typeof chartData !== 'object') return false
  const planets = chartData?.vimsopaka?.planets
  return !!planets && typeof planets === 'object' && Object.keys(planets).length > 0
}

// ── Timezone conversion ───────────────────────────────────────

/**
 * Convert local birth datetime (YYYY-MM-DD + HH:MM:SS in given IANA timezone)
 * to UTC string for the calculator.
 *
 * Example: "1990-06-15" + "14:30:00" + "Asia/Kolkata" (IST = UTC+5:30)
 *          → "1990-06-15T09:00:00" (UTC)
 */
function localToUTC(date: string, time: string, tz: string): { utcDate: string; utcTime: string } {
  const safeTime = /^\d{2}:\d{2}:\d{2}$/.test(time) ? time : `${time}:00`
  const localDT  = `${date}T${safeTime}`

  try {
    // date-fns-tz converts local datetime in given zone → UTC
    const utcDate = fromZonedTime(localDT, tz)
    const utcDateStr = utcDate.toISOString().slice(0, 10)
    const utcTimeStr = utcDate.toISOString().slice(11, 19)
    return { utcDate: utcDateStr, utcTime: utcTimeStr }
  } catch {
    // Fallback: treat as UTC if timezone is invalid
    return { utcDate: date, utcTime: safeTime }
  }
}

// ── Route handler ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // Parse body
    const body = await req.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 })
    }

    // Validate
    const result = ChartInputSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: result.error.errors },
        { status: 400 },
      )
    }
    const input = result.data

    // Convert local birth time → UTC for sweph
    const { utcDate, utcTime } = localToUTC(input.birthDate, input.birthTime, input.timezone)

    // Cache key uses UTC values (timezone-independent)
    const cacheKey = chartCacheKey(
      utcDate, utcTime,
      input.latitude, input.longitude,
      input.settings.ayanamsha,
      input.settings.nodeMode,
      input.settings.houseSystem,
      input.settings.karakaScheme,
      input.settings.gulikaMode,
    )

    // Parallelize session check and cache lookup to reduce total latency
    const [session, cached] = await Promise.all([
      auth(),
      redis.get(cacheKey)
    ])

    const cachedChart = parseCachedChart(cached)

    if (cachedChart && hasVimsopakaData(cachedChart)) {
      // Overwrite name, place, etc. from input — these don't affect calculation
      // but are stored in meta. We want to return the name from input.
      const finalData = {
        ...cachedChart,
        meta: {
          ...cachedChart.meta,
          name:       input.name,
          birthDate:  input.birthDate,
          birthTime:  input.birthTime,
          birthPlace: input.birthPlace,
          timezone:   input.timezone,
          calculatedAt: new Date(),
        }
      }
      return NextResponse.json({ success: true, data: finalData, fromCache: true })
    }

    const plan: UserPlan = (session?.user as any)?.plan ?? 'kala'

    // Run calculation and connect DB (for warming) in parallel
    const [chartData] = await Promise.all([
      calculateChart(
        {
          name:       input.name,
          birthDate:  input.birthDate,
          birthTime:  input.birthTime,
          utcDate:    utcDate,
          utcTime:    utcTime,
          birthPlace: input.birthPlace,
          latitude:   input.latitude,
          longitude:  input.longitude,
          timezone:   input.timezone,
          settings:   input.settings as ChartSettings,
        },
        plan,
      ),
      connectDB() 
    ])

    // Cache result — don't await so the user gets the results immediately 🚀
    // (Upstash Redis over HTTP adds ~100-200ms which we can shave off here)
    redis.set(cacheKey, chartData, 86_400).catch(err => {
      console.error('[redis.set] cache write failed (background):', err)
    })

    return NextResponse.json({ success: true, data: chartData, fromCache: false })

  } catch (err) {
    console.error('[chart/calculate] Unhandled error:', err)
    return NextResponse.json(
      { success: false, error: 'Calculation failed. Please try again.' },
      { status: 500 },
    )
  }
}