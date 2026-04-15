/**
 * src/app/api/transits/planets/route.ts
 * GET /api/transits/planets?date=YYYY-MM-DD&tz=Asia/Kolkata&ayanamsha=lahiri
 *
 * Returns geocentric sidereal positions of all 9 navagrahas for a given date.
 * Used by the Sarvatobhadra Chakra (SBC) page to load transit overlays.
 * Node.js runtime required — uses sweph native addon.
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  dateToJD,
  getPlanetPosition,
  SWISSEPH_IDS,
  NODE_IDS,
  getAyanamsha,
  ketuLongitude,
  signOf,
  degreeInSign,
} from '@/lib/engine/ephemeris'
import { getNakshatra } from '@/lib/engine/nakshatra'
import { getDignity }   from '@/lib/engine/dignity'
import { GRAHA_NAMES, RASHI_NAMES, RASHI_SANSKRIT } from '@/types/astrology'
import type { GrahaId, AyanamshaMode } from '@/types/astrology'

export const runtime = 'nodejs'

const GRAHAS_TO_CALC: Array<Exclude<GrahaId, 'Ke' | 'Ur' | 'Ne' | 'Pl'>> = [
  'Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra',
]

// Widen so we can push Ketu into the same array
type TransitGraha = { id: GrahaId; name: string; lonSidereal: number; rashi: number; rashiName: string; rashiSanskrit: string; nakshatraIndex: number; nakshatraName: string; pada: number; degree: number; isRetro: boolean; speed: number; dignity: string }

export async function GET(req: NextRequest) {
  try {
    const sp = new URL(req.url).searchParams
    const dateStr  = sp.get('date') ?? new Date().toISOString().split('T')[0]
    const ayanMode = (sp.get('ayanamsha') ?? 'lahiri') as AyanamshaMode

    // Use noon UTC on the requested date — geocentric longitudes are
    // essentially location-independent (error < 0.01° for Moon).
    const noonUTC = new Date(`${dateStr}T06:00:00Z`) // 06:00 UTC ≈ 11:30 AM IST
    const jd      = dateToJD(noonUTC)
    const ayan    = getAyanamsha(jd, ayanMode)

    const grahas: TransitGraha[] = GRAHAS_TO_CALC.map(id => {
      const swId  = id === 'Ra' ? NODE_IDS['mean'] : SWISSEPH_IDS[id]
      const pos   = getPlanetPosition(jd, swId, true)   // sidereal=true
      const lonSid = ((pos.longitude % 360) + 360) % 360
      const nak    = getNakshatra(lonSid)
      const rashi  = signOf(lonSid)
      const deg    = degreeInSign(lonSid)

      return {
        id:               id as GrahaId,
        name:             GRAHA_NAMES[id],
        lonSidereal:      lonSid,
        rashi,
        rashiName:        RASHI_NAMES[rashi as keyof typeof RASHI_NAMES],
        rashiSanskrit:    RASHI_SANSKRIT[rashi as keyof typeof RASHI_SANSKRIT],
        nakshatraIndex:   nak.index,
        nakshatraName:    nak.name,
        pada:             nak.pada,
        degree:           deg,
        isRetro:          pos.isRetro,
        speed:            +pos.speed.toFixed(5),
        dignity:          getDignity(id, rashi as import('@/types/astrology').Rashi, deg),
      }
    })

    // Ketu — exact opposition to Rahu
    const rahu       = grahas.find(g => g.id === 'Ra')!
    const ketuLonSid = ketuLongitude(rahu.lonSidereal)
    const ketuNak    = getNakshatra(ketuLonSid)
    const ketuRashi  = signOf(ketuLonSid)
    const ketuDeg    = degreeInSign(ketuLonSid)

    grahas.push({
      id:               'Ke' as GrahaId,
      name:             'Ketu',
      lonSidereal:      ketuLonSid,
      rashi:            ketuRashi,
      rashiName:        RASHI_NAMES[ketuRashi as keyof typeof RASHI_NAMES],
      rashiSanskrit:    RASHI_SANSKRIT[ketuRashi as keyof typeof RASHI_SANSKRIT],
      nakshatraIndex:   ketuNak.index,
      nakshatraName:    ketuNak.name,
      pada:             ketuNak.pada,
      degree:           ketuDeg,
      isRetro:          true,
      speed:            -rahu.speed,
      dignity:          getDignity('Ke', ketuRashi as import('@/types/astrology').Rashi, ketuDeg),
    })

    return NextResponse.json({ success: true, date: dateStr, ayanamsha: ayanMode, julianDay: jd, grahas })
  } catch (err: any) {
    console.error('[transits/planets]', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
