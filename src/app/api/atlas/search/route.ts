// ─────────────────────────────────────────────────────────────
//  src/app/api/atlas/search/route.ts
//  Lightweight geocoding (Photon) + Reverse timezone lookup
//  Replaces 115MB SQLite with ultra-fast public APIs
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'

// ── Types ──────────────────────────────────────────────────────
interface LocationResult {
  name:      string
  country:   string
  admin1:    string    // State/Province
  latitude:  number
  longitude: number
  timezone:  string
  population:number
}

// ── Photon API Types ───────────────────────────────────────────
interface PhotonFeature {
  geometry: { coordinates: [number, number] }
  properties: {
    name?: string
    city?: string
    state?: string
    country?: string
    osm_value?: string
    extent?: [number, number, number, number]
  }
}

// ── Timezone Cache (Simple in-memory cache) ────────────────────
const tzCache = new Map<string, string>()

/**
 * Fetches timezone for coordinates using BigDataCloud free API
 */
async function fetchTimezone(lat: number, lng: number): Promise<string> {
  const cacheKey = `${lat.toFixed(2)},${lng.toFixed(2)}`
  if (tzCache.has(cacheKey)) return tzCache.get(cacheKey)!

  try {
    const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`)
    const data = await res.json()
    
    // Attempt to find timezone in the response
    // BigDataCloud provides a "localityInfo" which often contains the time zone name
    const info = data.localityInfo?.informative || []
    const tzEntry = info.find((i: any) => i.description === 'time zone' || i.order === 1)
    const tz = tzEntry?.name || 'UTC'
    
    tzCache.set(cacheKey, tz)
    return tz
  } catch {
    return 'UTC'
  }
}

// ── Route Handler ─────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim()
  const latParam = req.nextUrl.searchParams.get('lat')
  const lngParam = req.nextUrl.searchParams.get('lng')

  // 1. Handle Reverse Geocoding (by Lat/Lng)
  if (latParam && lngParam) {
    try {
      const lat = parseFloat(latParam)
      const lng = parseFloat(lngParam)
      const tz = await fetchTimezone(lat, lng)
      
      const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`)
      const data = await res.json()

      const result: LocationResult = {
        name:      data.city || data.locality || 'Current Location',
        country:   data.countryName || '',
        admin1:    data.principalSubdivision || '',
        latitude:  lat,
        longitude: lng,
        timezone:  tz,
        population: 0
      }

      return NextResponse.json({ results: [result] })
    } catch (err) {
      console.error('[atlas/reverse] Error:', err)
      return NextResponse.json({ results: [] })
    }
  }

  // 2. Handle Search (by Query)
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] })
  }

  try {
    // Fetch from Photon (OpenStreetMap based)
    // We limit to 10 results and prioritize cities/towns
    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=10`
    const photonRes = await fetch(photonUrl)
    const photonData = await photonRes.json()

    const features: PhotonFeature[] = photonData.features || []

    // Map features to our standard interface
    const results: LocationResult[] = await Promise.all(
      features.map(async (feat) => {
        const [lng, lat] = feat.geometry.coordinates
        
        // Use Photon data if available, or fallback
        const name    = feat.properties.name || feat.properties.city || 'Unknown'
        const country = feat.properties.country || ''
        const admin1  = feat.properties.state || ''

        // For Astrology, we NEED the timezone. 
        // We fetch it for each of the top results (async parallel)
        const timezone = await fetchTimezone(lat, lng)

        return {
          name,
          country,
          admin1,
          latitude:  lat,
          longitude: lng,
          timezone,
          population: 0
        }
      })
    )

    return NextResponse.json(
      { results },
      {
        headers: {
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
        },
      },
    )
  } catch (err) {
    console.error('[atlas/search] Error:', err)
    return NextResponse.json({ results: [] })
  }
}
