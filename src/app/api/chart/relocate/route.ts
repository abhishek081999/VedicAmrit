// ─────────────────────────────────────────────────────────────
//  src/app/api/chart/relocate/route.ts
//  POST /api/chart/relocate
//  Recalculates house cusps and Ascendant for a new location
//  without changing the birth time/jd.
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { getAscendant } from '@/lib/engine/ephemeris'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { jd, lat, lng } = await req.json()

    if (jd === undefined || lat === undefined || lng === undefined) {
      return NextResponse.json({ error: 'jd, lat, and lng are required.' }, { status: 400 })
    }

    // Recalculate houses using Whole Sign (W) for the new location
    const houseData = getAscendant(jd, lat, lng, 'W')

    return NextResponse.json({ 
      success: true, 
      relocatedAsc: houseData.ascendant,
      relocatedCusps: houseData.cusps
    })

  } catch (err) {
    console.error('[relocate] Error:', err)
    return NextResponse.json({ error: 'Relocation failed.' }, { status: 500 })
  }
}
