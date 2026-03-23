// ─────────────────────────────────────────────────────────────
//  POST /api/chart/varshaphal
//  Given a natal chart, returns the Solar Return chart for a year
//  Body: { natalSunSidereal, returnYear, latitude, longitude, timezone, settings }
// ─────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { findSolarReturnJD, jdToDate } from '@/lib/engine/varshaphal'
import { calculateChart } from '@/lib/engine/calculator'
import type { ChartSettings } from '@/types/astrology'

export const runtime = 'nodejs'

const Schema = z.object({
  natalSunSidereal: z.number(),
  returnYear:       z.number().int().min(1900).max(2100),
  latitude:         z.number().min(-90).max(90),
  longitude:        z.number().min(-180).max(180),
  timezone:         z.string(),
  birthPlace:       z.string(),
  settings:         z.record(z.unknown()),
  natalName:        z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body   = await req.json()
    const parsed = Schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 })
    }

    const { natalSunSidereal, returnYear, latitude, longitude, timezone, birthPlace, settings, natalName } = parsed.data
    const ayanamsha = (settings as any).ayanamsha ?? 'lahiri'

    // 1. Find the exact JD of Solar Return
    const returnJD   = findSolarReturnJD(natalSunSidereal, returnYear, ayanamsha)
    const returnDate = jdToDate(returnJD)

    // 2. Format as birth chart input (Solar Return uses return moment at natal location)
    const year  = returnDate.getUTCFullYear()
    const month = String(returnDate.getUTCMonth() + 1).padStart(2, '0')
    const day   = String(returnDate.getUTCDate()).padStart(2, '0')
    const hour  = String(returnDate.getUTCHours()).padStart(2, '0')
    const min   = String(returnDate.getUTCMinutes()).padStart(2, '0')
    const sec   = String(returnDate.getUTCSeconds()).padStart(2, '0')

    const dateStr = `${year}-${month}-${day}`
    const timeStr = `${hour}:${min}:${sec}`

    // 3. Calculate full chart for the Solar Return moment
    const chart = await calculateChart(
      {
        name:       `${natalName ?? 'Chart'} — Varshaphal ${returnYear}`,
        birthDate:  dateStr,
        birthTime:  timeStr,
        utcDate:    dateStr,
        utcTime:    timeStr,
        birthPlace,
        latitude,
        longitude,
        timezone:   'UTC',
        settings:   settings as unknown as ChartSettings,
      },
      'hora',   // compute all features
    )

    return NextResponse.json({
      success: true,
      chart,
      meta: {
        returnYear,
        returnJD,
        returnDateUTC: returnDate.toISOString(),
        natalSunSidereal,
      },
    })
  } catch (err) {
    console.error('[varshaphal]', err)
    return NextResponse.json({ success: false, error: 'Varshaphal calculation failed' }, { status: 500 })
  }
}
