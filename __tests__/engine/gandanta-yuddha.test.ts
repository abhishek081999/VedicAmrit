// __tests__/engine/gandanta-yuddha.test.ts
// ─────────────────────────────────────────────────────────────
//  Gandanta and Yuddha detection tests
//  Validates against known reference values
//
//  RUN: npm run test:engine
// ─────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import { checkGandanta, getGandantaDescription, GANDANTA_JUNCTIONS } from '@/lib/engine/gandanta'
import { checkYuddha, getYuddhaForPlanet } from '@/lib/engine/dignity'
import type { GandantaResult, YuddhaResult } from '@/types/astrology'

// ── Gandanta Tests ────────────────────────────────────────────

describe('Gandanta Detection', () => {
  describe('Revatī-Aśvinī Gandanta (Pisces → Aries)', () => {
    it('Should detect exact gandanta at 0° Aries', () => {
      const result = checkGandanta(0) // 0° Aries
      expect(result.isGandanta).toBe(true)
      expect(result.type).toBe('revati-ashwini')
      expect(result.severity).toBe('exact')
      expect(result.position).toBe('beginning-of-fire')
      expect(result.distanceFromJunction).toBeCloseTo(0, 2)
    })

    it('Should detect gandanta at 0.5° Aries (exact, within 1°)', () => {
      const result = checkGandanta(0.5) // 0.5° Aries
      expect(result.isGandanta).toBe(true)
      expect(result.type).toBe('revati-ashwini')
      expect(result.severity).toBe('exact') // 0.5° is within 1° orb for exact
      expect(result.position).toBe('beginning-of-fire')
    })

    it('Should detect near gandanta at 2° Aries', () => {
      const result = checkGandanta(2) // 2° Aries
      expect(result.isGandanta).toBe(true)
      expect(result.type).toBe('revati-ashwini')
      expect(result.severity).toBe('near') // 2° is within 3° orb for near
      expect(result.position).toBe('beginning-of-fire')
    })

    it('Should detect gandanta at end of Pisces (359°)', () => {
      const result = checkGandanta(359) // Last degree of Pisces
      expect(result.isGandanta).toBe(true)
      expect(result.type).toBe('revati-ashwini')
      expect(result.severity).toBe('exact')
      expect(result.position).toBe('end-of-water')
      expect(result.distanceFromJunction).toBeCloseTo(1, 1)
    })

    it('Should NOT detect gandanta at 5° Aries', () => {
      const result = checkGandanta(5) // 5° Aries
      expect(result.isGandanta).toBe(false)
      expect(result.severity).toBe('none')
    })
  })

  describe('Āśleṣā-Maghā Gandanta (Cancer → Leo)', () => {
    it('Should detect exact gandanta at 0° Leo (120°)', () => {
      const result = checkGandanta(120) // 0° Leo
      expect(result.isGandanta).toBe(true)
      expect(result.type).toBe('ashlesha-magha')
      expect(result.severity).toBe('exact')
      expect(result.position).toBe('beginning-of-fire')
    })

    it('Should detect gandanta at end of Cancer (119°)', () => {
      const result = checkGandanta(119) // Last degree of Cancer
      expect(result.isGandanta).toBe(true)
      expect(result.type).toBe('ashlesha-magha')
      expect(result.severity).toBe('exact')
      expect(result.position).toBe('end-of-water')
    })

    it('Should NOT detect gandanta at 5° Leo (125°)', () => {
      const result = checkGandanta(125) // 5° Leo
      expect(result.isGandanta).toBe(false)
    })
  })

  describe('Jyeṣṭhā-Mūla Gandanta (Scorpio → Sagittarius)', () => {
    it('Should detect exact gandanta at 0° Sagittarius (240°)', () => {
      const result = checkGandanta(240) // 0° Sagittarius
      expect(result.isGandanta).toBe(true)
      expect(result.type).toBe('jyeshtha-mula')
      expect(result.severity).toBe('exact')
      expect(result.position).toBe('beginning-of-fire')
    })

    it('Should detect gandanta at end of Scorpio (239°)', () => {
      const result = checkGandanta(239) // Last degree of Scorpio
      expect(result.isGandanta).toBe(true)
      expect(result.type).toBe('jyeshtha-mula')
      expect(result.severity).toBe('exact')
      expect(result.position).toBe('end-of-water')
    })
  })

  describe('Non-Gandanta Positions', () => {
    it('Should NOT detect gandanta at 15° Taurus (45°)', () => {
      const result = checkGandanta(45)
      expect(result.isGandanta).toBe(false)
    })

    it('Should NOT detect gandanta at 15° Virgo (165°)', () => {
      const result = checkGandanta(165)
      expect(result.isGandanta).toBe(false)
    })

    it('Should NOT detect gandanta at 15° Capricorn (285°)', () => {
      const result = checkGandanta(285)
      expect(result.isGandanta).toBe(false)
    })
  })

  describe('Gandanta Descriptions', () => {
    it('Should return description for revati-ashwini', () => {
      const desc = getGandantaDescription('revati-ashwini')
      expect(desc.name).toContain('Revatī')
      expect(desc.sanskrit).toBeTruthy()
      expect(desc.remedy).toBeTruthy()
    })

    it('Should return description for ashlesha-magha', () => {
      const desc = getGandantaDescription('ashlesha-magha')
      expect(desc.name).toContain('Āśleṣā')
      expect(desc.significance).toBeTruthy()
    })

    it('Should return description for jyeshtha-mula', () => {
      const desc = getGandantaDescription('jyeshtha-mula')
      expect(desc.name).toContain('Jyeṣṭhā')
      expect(desc.meaning).toBeTruthy()
    })
  })
})

// ── Yuddha (Planetary War) Tests ──────────────────────────────

describe('Yuddha (Planetary War) Detection', () => {
  describe('War Detection', () => {
    it('Should detect war when Mercury and Venus are within 1°', () => {
      const mercuryLon = 100.5
      const venusLon = 100.0
      const result = checkYuddha(mercuryLon, venusLon)
      
      expect(result.isWarring).toBe(true)
      expect(result.planets).toEqual(['Me', 'Ve'])
      expect(result.degreeDifference).toBeCloseTo(0.5, 2)
    })

    it('Should detect war at exactly 1° apart', () => {
      const mercuryLon = 200
      const venusLon = 199
      const result = checkYuddha(mercuryLon, venusLon)
      
      expect(result.isWarring).toBe(true)
      expect(result.degreeDifference).toBeCloseTo(1, 2)
    })

    it('Should NOT detect war when > 1° apart', () => {
      const mercuryLon = 100
      const venusLon = 102
      const result = checkYuddha(mercuryLon, venusLon)
      
      expect(result.isWarring).toBe(false)
      expect(result.degreeDifference).toBeCloseTo(2, 2)
    })
  })

  describe('Winner Determination', () => {
    it('Mercury should win when it has higher longitude', () => {
      const mercuryLon = 150.5
      const venusLon = 150.0
      const result = checkYuddha(mercuryLon, venusLon)
      
      expect(result.isWarring).toBe(true)
      expect(result.winner).toBe('Me')
      expect(result.loser).toBe('Ve')
    })

    it('Venus should win when it has higher longitude', () => {
      const mercuryLon = 200.0
      const venusLon = 200.5
      const result = checkYuddha(mercuryLon, venusLon)
      
      expect(result.isWarring).toBe(true)
      expect(result.winner).toBe('Ve')
      expect(result.loser).toBe('Me')
    })

    it('Should handle wrap-around at 0°/360° boundary', () => {
      // Mercury at 359.5°, Venus at 0.5°
      const mercuryLon = 359.5
      const venusLon = 0.5
      const result = checkYuddha(mercuryLon, venusLon)
      
      // Distance is 1°, so should be in war
      expect(result.isWarring).toBe(true)
      // Mercury at 359.5° > Venus at 0.5°
      expect(result.winner).toBe('Me')
    })
  })

  describe('Per-Planet Yuddha Status', () => {
    it('Should return war status for Mercury', () => {
      const result = getYuddhaForPlanet('Me', 100.5, 100.0)
      expect(result.isWarring).toBe(true)
    })

    it('Should return war status for Venus', () => {
      const result = getYuddhaForPlanet('Ve', 100.5, 100.0)
      expect(result.isWarring).toBe(true)
    })

    it('Should return non-warring for other planets', () => {
      const result = getYuddhaForPlanet('Su', 100.5, 100.0)
      expect(result.isWarring).toBe(false)
      expect(result.planets).toEqual([])
    })
  })
})

// ── Edge Cases ────────────────────────────────────────────────

describe('Edge Cases', () => {
  describe('Gandanta Edge Cases', () => {
    it('Should handle negative longitudes', () => {
      const result = checkGandanta(-1)
      // -1° should normalize to 359°, which is gandanta
      expect(result.isGandanta).toBe(true)
    })

    it('Should handle longitudes > 360°', () => {
      const result = checkGandanta(360 + 0.5) // 360.5° = 0.5° Aries
      expect(result.isGandanta).toBe(true)
      expect(result.type).toBe('revati-ashwini')
    })
  })

  describe('Yuddha Edge Cases', () => {
    it('Should handle exact same longitude', () => {
      const result = checkYuddha(100, 100)
      expect(result.isWarring).toBe(true)
      expect(result.degreeDifference).toBeCloseTo(0, 2)
      // When equal, Venus wins (lower value in tie-breaker logic)
      expect(result.winner).toBe('Ve')
    })

    it('Should handle planets in different signs but close', () => {
      // Mercury at 29.5° Aries, Venus at 0.5° Taurus
      const mercuryLon = 29.5
      const venusLon = 30.5
      const result = checkYuddha(mercuryLon, venusLon)
      
      // Distance is 1°, so should be in war
      expect(result.isWarring).toBe(true)
      expect(result.winner).toBe('Ve') // Venus at higher longitude
    })
  })
})
