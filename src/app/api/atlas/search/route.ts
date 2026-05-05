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
 * Deduplicate concurrent API requests for the same coordinates
 */
const pendingTzLookups = new Map<string, Promise<string>>();

/**
 * Fetches timezone for coordinates using BigDataCloud free API
 * Rounds coordinates to 2 decimal places to increase cache hit rate.
 * Results cached in Redis for 7 days.
 */
async function fetchTimezone(lat: number, lng: number): Promise<string> {
  // Pre-emptive check for India/Nepal (95% of use cases)
  const isNepal = (lat > 26.0 && lat < 30.5 && lng > 80.0 && lng < 88.5)
  const isIndia = !isNepal && (lat > 6.7 && lat < 37.5 && lng > 68.1 && lng < 97.4)
  
  // If we are deep inside India or Nepal, we stop here.
  // Exception: Coastal or border areas might need the API, but for astrology, the regional default is safer than a failing API.
  if (isNepal) return 'Asia/Kathmandu'
  if (isIndia) return 'Asia/Kolkata'

  const roundedLat = lat.toFixed(2)
  const roundedLng = lng.toFixed(2)
  const cacheKey = `tz:${roundedLat},${roundedLng}`
  
  // 1. Try Redis cache
  try {
    const cached = await redis.get<string>(cacheKey)
    if (cached) {
      // Fix for previously mis-cached Nepal locations
      const isNepal = (lat > 26.3 && lat < 30.5 && lng > 80.0 && lng < 88.5)
      if (isNepal && (cached === 'Asia/Kolkata' || cached === 'UTC')) return 'Asia/Kathmandu'
      return cached
    }
  } catch (e) {
    console.error('[tz] Redis lookup failed:', e)
  }

  // 2. Check for concurrent pending requests to avoid "Cache Stampede"
  if (pendingTzLookups.has(cacheKey)) {
    return pendingTzLookups.get(cacheKey)!
  }

  const lookupPromise = (async () => {
    try {
      // 3. Query BigDataCloud reverse geocode API (free tier)
      // Use fixed precision to avoid malformed URL issues with very long floats
      const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat.toFixed(5)}&longitude=${lng.toFixed(5)}&localityLanguage=en`
      const res = await fetch(bdcUrl, {
        next: { revalidate: 604800 }
      })
      if (!res.ok) throw new Error(`API failed [${res.status}]`)
    
      const data = await res.json()
      
      // 4. Extract IANA timezone from informative info
      const info = data.localityInfo?.informative || []
      const tzEntry = info.find((i: any) => 
         i.description === 'time zone' || 
         (i.name && i.name.includes('/') && i.name.length > 5)
      )
      
      const countryCode = data.countryCode || ""
      const isNepal = countryCode === "NP" || (lat > 26.0 && lat < 30.5 && lng > 80.0 && lng < 88.5)
      const isIndia = !isNepal && (countryCode === "IN" || (lat > 6.7 && lat < 37.5 && lng > 68.1 && lng < 97.4))
      
      // Initial guess based on region
      let tz = isNepal ? 'Asia/Kathmandu' : (isIndia ? 'Asia/Kolkata' : 'UTC')
      
      if (tzEntry?.name && tzEntry.name.includes('/')) {
        tz = tzEntry.name
      } else {
        // Fallback: check if the API returned a direct timezone property
        if (data.timezone && typeof data.timezone === 'string' && data.timezone.includes('/')) {
          tz = data.timezone
        } else if (data.timezone?.ianaName && typeof data.timezone.ianaName === 'string') {
          tz = data.timezone.ianaName
        }
      }
      
      // 5. Cache in Redis
      await redis.set(cacheKey, tz, CACHE_TTL.ATLAS).catch(() => {})
      return tz
    } catch (err) {
      // 3.5 Fallback to secondary free API before giving up
      try {
        const timeApiRes = await fetch(`https://www.timeapi.io/api/TimeZone/coordinate?latitude=${lat.toFixed(5)}&longitude=${lng.toFixed(5)}`, {
          next: { revalidate: 604800 }
        })
        if (timeApiRes.ok) {
          const timeData = await timeApiRes.json()
          if (timeData.timeZone && typeof timeData.timeZone === 'string') {
            const tz = timeData.timeZone
            await redis.set(cacheKey, tz, CACHE_TTL.ATLAS).catch(() => {})
            return tz
          }
        }
      } catch (e2) {
        // ignore secondary failure
      }

      // Emergency fallback for Region context
      const isNepalFallback = (lat > 26.0 && lat < 30.5 && lng > 80.0 && lng < 88.5)
      const isIndiaFallback = !isNepalFallback && (lat > 6.7 && lat < 37.5 && lng > 68.1 && lng < 97.4)
      
      const flavor = isNepalFallback ? 'Asia/Kathmandu' : (isIndiaFallback ? 'Asia/Kolkata' : 'UTC')
      
      // Only log if it's not a common regional fallback
      if (flavor === 'UTC') {
        console.error('[tz] Fetch failed and no regional fallback found:', lat, lng, err)
      }
      
      return flavor
    }
  })()

  pendingTzLookups.set(cacheKey, lookupPromise)
  
  try {
    return await lookupPromise
  } finally {
    // Clean up after 1 second to allow near-simultaneous batch searches to hit it
    setTimeout(() => pendingTzLookups.delete(cacheKey), 1000)
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
      
      // Use fetchTimezone but it will likely hit our pre-emptive India/Nepal logic or Redis
      const tz = await fetchTimezone(lat, lng)
      
      const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`, {
        next: { revalidate: 604800 }
      })
      
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
  if (cachedResults && cachedResults.length > 0) {
    // Safety: If cached results have 'UTC', we re-verify them to clear the old bug
    const hasUTC = cachedResults.some(r => r.timezone === 'UTC' || !r.timezone)
    if (!hasUTC) {
      return NextResponse.json(
        { results: cachedResults, fromCache: true },
        { headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600' } }
      )
    }
    // If we have 'UTC' results, continue to fresh fetch to fix them
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

        // ── Optimization: Assign TZ directly for major regions ──
        let timezone = ''
        if (country === 'India') {
          timezone = 'Asia/Kolkata'
        } else if (country === 'Nepal') {
          timezone = 'Asia/Kathmandu'
        } else {
          // Only hit the API/Redis for other countries
          timezone = await fetchTimezone(lat, lng)
        }
        
        // Bounding box safety within search results mapping
        if (timezone === 'UTC') {
          const isNepal = country === 'Nepal' || (lat > 26.0 && lat < 30.5 && lng > 80.0 && lng < 88.5)
          const isIndia = !isNepal && (lat > 6.7 && lat < 37.5 && lng > 68.1 && lng < 97.4)
          if (isNepal) timezone = 'Asia/Kathmandu'
          else if (isIndia) timezone = 'Asia/Kolkata'
        }

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
