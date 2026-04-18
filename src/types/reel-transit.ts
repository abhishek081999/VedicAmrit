import type { TransitEvent } from '@/lib/engine/transits'
import type { GrahaId } from '@/types/astrology'

export type { TransitEvent }

/** Row from GET /api/transits/planets */
export interface TransitPlanetRow {
  id: GrahaId
  name: string
  lonSidereal: number
  rashi: number
  rashiName: string
  rashiSanskrit: string
  nakshatraIndex: number
  nakshatraName: string
  pada: number
  degree: number
  isRetro: boolean
  speed: number
  dignity: string
}

export interface TransitPlanetsResponse {
  success: boolean
  date: string
  ayanamsha: string
  julianDay: number
  grahas: TransitPlanetRow[]
}
