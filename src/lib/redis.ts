// ─────────────────────────────────────────────────────────────
//  src/lib/redis.ts
//  Upstash Redis singleton with graceful no-op fallback
//  When UPSTASH_REDIS_REST_URL is not set, all operations
//  are no-ops — the app works without cache (Phase 2 dev mode)
// ─────────────────────────────────────────────────────────────

import { Redis } from '@upstash/redis'

// ── Client ────────────────────────────────────────────────────

let _redis: Redis | null = null

function getRedis(): Redis | null {
  if (_redis) return _redis

  const url   = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) return null

  _redis = new Redis({ url, token })
  return _redis
}

// ── Typed wrapper with fallback ───────────────────────────────

export const redis = {
  /**
   * Get a cached value. Returns null if key missing or Redis unavailable.
   */
  async get<T = unknown>(key: string): Promise<T | null> {
    try {
      const client = getRedis()
      if (!client) return null
      return await client.get<T>(key)
    } catch (err) {
      console.warn('[redis.get] error:', err)
      return null
    }
  },

  /**
   * Set a value with optional TTL (seconds). No-op if Redis unavailable.
   */
  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    try {
      const client = getRedis()
      if (!client) return
      if (ttlSeconds) {
        await client.setex(key, ttlSeconds, JSON.stringify(value))
      } else {
        await client.set(key, JSON.stringify(value))
      }
    } catch (err) {
      console.warn('[redis.set] error:', err)
    }
  },

  /**
   * Delete a key. No-op if Redis unavailable.
   */
  async del(key: string): Promise<void> {
    try {
      const client = getRedis()
      if (!client) return
      await client.del(key)
    } catch (err) {
      console.warn('[redis.del] error:', err)
    }
  },

  /**
   * Delete multiple keys by prefix pattern.
   * Scans up to 200 keys with the given prefix.
   */
  async delByPrefix(prefix: string): Promise<void> {
    try {
      const client = getRedis()
      if (!client) return
      const keys = await client.keys(`${prefix}*`)
      if (keys.length > 0) {
        await client.del(...keys)
      }
    } catch (err) {
      console.warn('[redis.delByPrefix] error:', err)
    }
  },

  /**
   * Check if Redis is available (for health checks)
   */
  async ping(): Promise<boolean> {
    try {
      const client = getRedis()
      if (!client) return false
      const res = await client.ping()
      return res === 'PONG'
    } catch {
      return false
    }
  },

  /** True if Redis is configured */
  get isConfigured(): boolean {
    return !!(
      process.env.UPSTASH_REDIS_REST_URL &&
      process.env.UPSTASH_REDIS_REST_TOKEN
    )
  },
}

// ── Cache key helpers ─────────────────────────────────────────

export function chartCacheKey(
  birthDate: string,
  birthTime: string,
  lat: number,
  lng: number,
  ayanamsha: string,
  nodeMode: string,
  houseSystem: string,
  karakaScheme: number,
  gulikaMode: string,
): string {
  // Added v8: prefix to force refresh after full Varga details implementation
  return `v8:chart:${birthDate}:${birthTime}:${lat.toFixed(4)}:${lng.toFixed(4)}:${ayanamsha}:${nodeMode}:${houseSystem}:${karakaScheme}:${gulikaMode}`
}

export function panchangCacheKey(
  date: string,
  lat: number,
  lng: number,
): string {
  return `panchang:${date}:${lat.toFixed(2)}:${lng.toFixed(2)}`
}

export function atlasCacheKey(query: string): string {
  return `atlas:${query.toLowerCase().trim()}`
}

export const CACHE_TTL = {
  CHART:    86_400,    // 24 hours — chart data never changes for given birth data
  PANCHANG: 86_400,    // 24 hours — daily panchang is fixed
  ATLAS:    604_800,   // 7 days — location data is stable
  SESSION:  3_600,     // 1 hour — user session data
} as const
