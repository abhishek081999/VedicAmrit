// ─────────────────────────────────────────────────────────────
//  src/app/api/transit/route.ts
//  API Endpoint for personal transit timeline
// ─────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'
import { calculatePersonalTransits, getCurrentTransitPositions } from '@/lib/engine/transits'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const ascRashi = parseInt(searchParams.get('ascRashi') || '1')
  const months   = parseInt(searchParams.get('months') || '12')
  const startRaw = searchParams.get('startDate')
  const startDate =
    startRaw && /^\d{4}-\d{2}-\d{2}$/.test(startRaw)
      ? new Date(`${startRaw}T12:00:00Z`)
      : new Date()

  try {
    const transits = calculatePersonalTransits(ascRashi, startDate, months)
    const currentPositions = getCurrentTransitPositions(ascRashi, startDate)
    
    return NextResponse.json({
      success: true,
      data: transits,
      currentPositions,
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
