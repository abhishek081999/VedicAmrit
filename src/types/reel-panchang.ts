/**
 * Client shape for GET /api/panchang success payload (`data`).
 * Used by the manual reel generator canvas templates.
 */

export interface PanchangApiData {
  date: string
  location: { lat: number; lng: number; tz: string }
  ayanamsha: string
  sunRashi: {
    rashi: number
    en: string
    sa: string
    degInSign: number
    longitude: number
    dms?: string
    dmsInSign?: string
  }
  moonRashi: {
    rashi: number
    en: string
    sa: string
    degInSign: number
    longitude: number
    dms?: string
    dmsInSign?: string
  }
  vara: { number: number; name: string; sanskrit?: string; lord: string }
  tithi: { number: number; name: string; paksha: string; lord: string; percent?: number }
  nakshatra: { index: number; name: string; pada: number; lord: string; degree?: number }
  sunNakshatra?: { index: number; name: string; pada: number; lord: string }
  yoga: { number: number; name: string; quality?: string; percent?: number }
  karana: { number: number; name: string; type?: string; isBhadra?: boolean }
  sunrise: string
  sunset: string
  moonrise: string | null
  moonset: string | null
  rahuKalam: { start: string; end: string }
  gulikaKalam: { start: string; end: string }
  yamaganda: { start: string; end: string }
  abhijitMuhurta: { start: string; end: string } | null
  horaTable: { lord: string; start: string; end: string; isDaytime: boolean }[]
  choghadiya: {
    day: { name: string; quality: string; start: string; end: string }[]
    night: { name: string; quality: string; start: string; end: string }[]
  }
  brahmaMuhurta: { start: string; end: string }
  godhuliMuhurat: { start: string; end: string }
  durMuhurat: { start: string; end: string }[]
  limbEnds: { tithi: string | null; nakshatra: string | null; yoga: string | null }
  riktaTithi: { active: boolean; detail: string }
  calendarContext: {
    sauraMasa: string
    rituSa: string
    rituEn: string
    ayanaSa: string
    ayanaEn: string
    samvatsara: string
    samvatsaraIndex: number
    shakaYear: number
    vikramSamvat: number
  }
  planets: {
    id: string
    sa: string
    longitude: number
    rashiEn: string
    rashiSa: string
    degInSign: number
    retro: boolean
    combust: boolean
  }[]
  timeline?: unknown
}
