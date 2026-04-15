// ─────────────────────────────────────────────────────────────
//  src/app/api/chart/astrocartography/route.ts
//  GET /api/chart/astrocartography?jd=...
//  Returns planetary power lines for world mapping.
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { calculateACG } from '@/lib/engine/astrocartography'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const jdStr = searchParams.get('jd')
    
    if (!jdStr) {
      return NextResponse.json({ error: 'Julian Day (jd) is required.' }, { status: 400 })
    }

    const jd = parseFloat(jdStr)
    const lat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : undefined
    const lng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : undefined

    console.log('[acg] Calculating for JD:', jd, 'Lat:', lat, 'Lng:', lng)

    if (isNaN(jd)) {
        return NextResponse.json({ error: 'Invalid Julian Day.' }, { status: 400 })
    }

    const result = calculateACG(jd, lat, lng)
    
    if (result.lines.length === 0) {
      return NextResponse.json({ success: false, error: 'Planet calculation returned 0 results. Verify ephemeris files and JD.' })
    }

    return NextResponse.json({ success: true, lines: result.lines, parans: result.parans })

  } catch (err) {
    console.error('[acg] Error:', err)
    return NextResponse.json({ error: 'Failed to calculate ACG lines.' }, { status: 500 })
  }
}
