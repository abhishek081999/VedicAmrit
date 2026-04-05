// ─────────────────────────────────────────────────────────────
//  src/app/api/atlas/search/route.ts
//  Lightweight geocoding (Photon) + Reverse timezone lookup
//  Replaces 115MB SQLite with ultra-fast public APIs + Redis
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { redis, CACHE_TTL } from '@/lib/redis'

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

/**
 * Fetches timezone for coordinates using BigDataCloud free API
 * Rounds coordinates to 2 decimal places to increase cache hit rate.
 * Results cached in Redis for 7 days.
 */
async function fetchTimezone(lat: number, lng: number): Promise<string> {
  const roundedLat = lat.toFixed(2)
  const roundedLng = lng.toFixed(2)
  const cacheKey = `tz:${roundedLat},${roundedLng}`
  
  // Try Redis first
  const cached = await redis.get<string>(cacheKey)
  if (cached) return cached

  try {
    const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`, {
      next: { revalidate: 604800 } // 7 days (Next.js data cache fallback)
    })
    const data = await res.json()
    
    // Attempt to find timezone in the response
    const info = data.localityInfo?.informative || []
    const tzEntry = info.find((i: any) => i.description === 'time zone' || i.order === 1)
    const tz = tzEntry?.name || 'UTC'
    
    // Cache in Redis for persistent performance
    await redis.set(cacheKey, tz, CACHE_TTL.ATLAS)
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
      const roundedLat = lat.toFixed(2)
      const roundedLng = lng.toFixed(2)
      const reverseCacheKey = `atlas:reverse:${roundedLat},${roundedLng}`

      // Try Redis first
      const cached = await redis.get<LocationResult>(reverseCacheKey)
      if (cached) {
        return NextResponse.json({ results: [cached], fromCache: true })
      }
      
      const [tz, res] = await Promise.all([
        fetchTimezone(lat, lng),
        fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`, {
          next: { revalidate: 604800 }
        })
      ])
      
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

      // Cache in Redis (7 days)
      await redis.set(reverseCacheKey, result, CACHE_TTL.ATLAS)

      return NextResponse.json({ results: [result], fromCache: false })
    } catch (err) {
      console.error('[atlas/reverse] Error:', err)
      return NextResponse.json({ results: [] })
    }
  }

  // 2. Handle Search (by Query)
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] })
  }

  // Global search cache to prevent redundant external Photon calls
  const searchCacheKey = `atlas:search:${q.toLowerCase()}`
  const cachedResults = await redis.get<LocationResult[]>(searchCacheKey)
  if (cachedResults) {
    return NextResponse.json(
      { results: cachedResults, fromCache: true },
      { headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600' } }
    )
  }

  try {
    // Fetch from Photon (OpenStreetMap based)
    // We prioritize limiting search results to keep the TZ lookup overhead low
    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=10`
    const photonRes = await fetch(photonUrl)
    const photonData = await photonRes.json()

    const features: PhotonFeature[] = photonData.features || []

    // Map features to our standard interface + Parallel TZ Lookup
    const results: LocationResult[] = await Promise.all(
      features.map(async (feat) => {
        const [lng, lat] = feat.geometry.coordinates
        
        const name    = feat.properties.name || feat.properties.city || 'Unknown'
        const country = feat.properties.country || ''
        const admin1  = feat.properties.state || ''

        // TZ check (from Redis or BigDataCloud)
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

    // Only cache if we actually have results
    if (results.length > 0) {
      await redis.set(searchCacheKey, results, CACHE_TTL.ATLAS)
    }

    return NextResponse.json(
      { results, fromCache: false },
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
