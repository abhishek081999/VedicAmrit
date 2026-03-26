// __tests__/engine/advanced-features.test.ts
// ─────────────────────────────────────────────────────────────
//  Tests for Puṣkara, Mṛtyu Bhāga, and Yogi Point
//  RUN: npm run test:engine
// ─────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import { checkPushkara, PUSHKARA_DEGREES, PUSHKARA_NAVAMSHA } from '@/lib/engine/pushkara'
import { checkMrityuBhaga, MRITYU_BHAGA_DEGREES, MRITYU_BHAGA_ALT, checkMrityuBhagaBoth } from '@/lib/engine/mrityuBhaga'
import { calculateYogiPoint, isConjunctYogiPoint, getPlanetsAtYogiPoints, calculateYogiWealthScore } from '@/lib/engine/yogiPoint'

// ── Puṣkara Aṃśa Tests ───────────────────────────────────────

describe('Puṣkara Aṃśa Detection', () => {
  describe('Pushkara Bhaga (Degree Zones)', () => {
    it('Should detect Pushkara in Aries zone 1 (11°20\'-13°20\')', () => {
      // 12° Aries = 12° total longitude
      const result = checkPushkara(12)
      expect(result.isPushkara).toBe(true)
      expect(result.type).toBe('pushkara_bhaga')
      expect(result.zone).toBe(1)
      expect(result.rashi).toBe(1)
    })

    it('Should detect Pushkara in Aries zone 2 (23°20\'-25°20\')', () => {
      // 24° Aries = 24° total longitude
      const result = checkPushkara(24)
      expect(result.isPushkara).toBe(true)
      expect(result.type).toBe('pushkara_bhaga')
      expect(result.zone).toBe(2)
      expect(result.rashi).toBe(1)
    })

    it('Should detect Pushkara in Taurus zone 1 (7°20\'-9°20\')', () => {
      // 37.5° = 7.5° Taurus (30 + 7.5)
      const result = checkPushkara(37.5)
      expect(result.isPushkara).toBe(true)
      expect(result.type).toBe('pushkara_bhaga')
      expect(result.rashi).toBe(2)
    })

    it('Should NOT detect Pushkara outside zones', () => {
      // 5° Aries = not in any Pushkara zone
      const result = checkPushkara(5)
      expect(result.isPushkara).toBe(false)
      expect(result.type).toBe(null)
    })

    it('Should NOT detect Pushkara at 15° Aries', () => {
      // 15° Aries = between the two zones
      const result = checkPushkara(15)
      expect(result.isPushkara).toBe(false)
    })
  })

  describe('Pushkara Navamsha', () => {
    it('Should detect Pushkara Navamsha for Aries (4th navamsha)', () => {
      // 4th navamsha = 10°-13°20' in Aries
      // 11° Aries is in 4th navamsha
      const result = checkPushkara(11)
      expect(result.navamsha).toBe(4)
      // Note: 11° is also in Pushkara Bhaga zone 1
      expect(result.isPushkaraNavamsha).toBe(true)
    })

    it('Should detect Pushkara Navamsha for Leo (1st navamsha)', () => {
      // Leo starts at 120°, 1st navamsha = 0°-3°20'
      // 121° = 1° Leo, which is in 1st navamsha
      const result = checkPushkara(121)
      expect(result.rashi).toBe(5)
      expect(result.navamsha).toBe(1)
      // 1st navamsha is Pushkara for Leo
      expect(result.isPushkaraNavamsha).toBe(true)
    })
  })

  describe('All Signs Have Pushkara Zones', () => {
    it('Should have Pushkara zones defined for all 12 signs', () => {
      for (let rashi = 1; rashi <= 12; rashi++) {
        expect(PUSHKARA_DEGREES[rashi as 1|2|3|4|5|6|7|8|9|10|11|12]).toBeDefined()
        expect(PUSHKARA_DEGREES[rashi as 1|2|3|4|5|6|7|8|9|10|11|12].zone1).toHaveLength(2)
        expect(PUSHKARA_DEGREES[rashi as 1|2|3|4|5|6|7|8|9|10|11|12].zone2).toHaveLength(2)
      }
    })

    it('Should have Pushkara navamshas defined for all 12 signs', () => {
      for (let rashi = 1; rashi <= 12; rashi++) {
        expect(PUSHKARA_NAVAMSHA[rashi as 1|2|3|4|5|6|7|8|9|10|11|12]).toBeDefined()
        expect(PUSHKARA_NAVAMSHA[rashi as 1|2|3|4|5|6|7|8|9|10|11|12].length).toBeGreaterThan(0)
      }
    })
  })
})

// ── Mṛtyu Bhāga Tests ─────────────────────────────────────────

describe('Mṛtyu Bhāga Detection', () => {
  describe('Primary Mṛtyu Bhāga', () => {
    it('Should detect exact Mrityu Bhaga at 19° Aries', () => {
      const result = checkMrityuBhaga(19) // 19° Aries
      expect(result.isMrityuBhaga).toBe(true)
      expect(result.severity).toBe('exact')
      expect(result.mrityuDegree).toBe(19)
      expect(result.distanceFromMrityu).toBeCloseTo(0, 2)
    })

    it('Should detect near Mrityu Bhaga at 19.7° Aries', () => {
      const result = checkMrityuBhaga(19.7)
      expect(result.isMrityuBhaga).toBe(true)
      expect(result.severity).toBe('near') // 0.7° away
    })

    it('Should detect wide Mrityu Bhaga at 17° Aries', () => {
      const result = checkMrityuBhaga(17) // 2° from 19°
      expect(result.isMrityuBhaga).toBe(true)
      expect(result.severity).toBe('wide')
    })

    it('Should NOT detect Mrityu Bhaga at 10° Aries', () => {
      const result = checkMrityuBhaga(10) // 9° from 19°
      expect(result.isMrityuBhaga).toBe(false)
      expect(result.severity).toBe('none')
    })

    it('Should detect Mrityu Bhaga for each sign', () => {
      // Test each sign's Mrityu Bhaga degree
      // Mrityu degrees: Ar=19, Ta=7, Ge=25, Cn=13, Le=1, Vi=19, Li=7, Sc=25, Sg=13, Cp=1, Aq=19, Pi=7
      const testCases: [number, number][] = [
        [19, 1],   // 19° Aries (0-30)
        [37, 2],   // 7° Taurus (30+7)
        [85, 3],   // 25° Gemini (60+25)
        [103, 4],  // 13° Cancer (90+13)
        [121, 5],  // 1° Leo (120+1)
        [169, 6],  // 19° Virgo (150+19)
        [187, 7],  // 7° Libra (180+7)
        [235, 8],  // 25° Scorpio (210+25)
        [253, 9],  // 13° Sagittarius (240+13)
        [271, 10], // 1° Capricorn (270+1)
        [319, 11], // 19° Aquarius (300+19)
        [337, 12], // 7° Pisces (330+7)
      ]

      for (const [lon, expectedRashi] of testCases) {
        const result = checkMrityuBhaga(lon)
        expect(result.isMrityuBhaga).toBe(true)
        expect(result.rashi).toBe(expectedRashi)
      }
    })
  })

  describe('Alternative Mṛtyu Bhāga', () => {
    it('Should use alternative degrees when specified', () => {
      // Primary: 19° Aries, Alt: 10° Aries
      const primary = checkMrityuBhaga(19, false)
      const alt = checkMrityuBhaga(19, true)

      expect(primary.isMrityuBhaga).toBe(true)
      // At 19°, alt system says 10° is Mrityu, so 9° away = not Mrityu
      expect(alt.isMrityuBhaga).toBe(false)
    })

    it('checkMrityuBhagaBoth should return both systems', () => {
      const both = checkMrityuBhagaBoth(19)
      expect(both.primary.isMrityuBhaga).toBe(true)
      expect(both.alternative.mrityuDegree).toBe(10) // Alt for Aries
    })
  })

  describe('All Signs Have Mrityu Bhāga', () => {
    it('Should have Mrityu Bhaga degrees defined for all 12 signs', () => {
      for (let rashi = 1; rashi <= 12; rashi++) {
        expect(MRITYU_BHAGA_DEGREES[rashi as 1|2|3|4|5|6|7|8|9|10|11|12]).toBeDefined()
        expect(MRITYU_BHAGA_DEGREES[rashi as 1|2|3|4|5|6|7|8|9|10|11|12]).toBeGreaterThanOrEqual(0)
        expect(MRITYU_BHAGA_DEGREES[rashi as 1|2|3|4|5|6|7|8|9|10|11|12]).toBeLessThan(30)
      }
    })
  })
})

// ── Yogi Point Tests ──────────────────────────────────────────

describe('Yogi Point System', () => {
  describe('Yogi Point Calculation', () => {
    it('Should calculate Yogi Point as Sun + Moon', () => {
      const sunLon = 100  // 10° Cancer
      const moonLon = 50  // 20° Taurus
      const result = calculateYogiPoint(sunLon, moonLon)

      expect(result.yogiPoint).toBeCloseTo(150, 1) // 100 + 50 = 150
    })

    it('Should wrap Yogi Point around 360°', () => {
      const sunLon = 200
      const moonLon = 200
      const result = calculateYogiPoint(sunLon, moonLon)

      expect(result.yogiPoint).toBeCloseTo(40, 1) // 400 - 360 = 40
    })

    it('Should calculate correct Yogi Rashi', () => {
      const sunLon = 100  // Cancer (sign 4)
      const moonLon = 50  // Taurus (sign 2)
      const result = calculateYogiPoint(sunLon, moonLon)

      // Yogi Point = 150° = 0° Virgo (sign 6)
      // 150 / 30 = 5, so sign 6 (0-indexed floor)
      expect(result.yogiRashi).toBe(6)
    })

    it('Should identify correct Yogi Graha (sign lord)', () => {
      const sunLon = 100  // 10° Cancer
      const moonLon = 50  // 20° Taurus
      const result = calculateYogiPoint(sunLon, moonLon)

      // Yogi Point = 150° = Virgo, lord = Mercury
      expect(result.yogiGraha).toBe('Me')
    })
  })

  describe('Sahayogi Point Calculation', () => {
    it('Should calculate Sahayogi as Yogi + 93°20\'', () => {
      const sunLon = 100
      const moonLon = 50
      const result = calculateYogiPoint(sunLon, moonLon)

      // Yogi = 150, Sahayogi = 150 + 93.33 = 243.33
      expect(result.sahayogiPoint).toBeCloseTo(243.33, 1)
    })
  })

  describe('Avayogi Point Calculation', () => {
    it('Should calculate Avayogi as Yogi + 186°40\'', () => {
      const sunLon = 100
      const moonLon = 50
      const result = calculateYogiPoint(sunLon, moonLon)

      // Yogi = 150, Avayogi = 150 + 186.67 = 336.67
      expect(result.avayogiPoint).toBeCloseTo(336.67, 1)
    })
  })

  describe('Conjunction Detection', () => {
    it('Should detect conjunction with Yogi Point', () => {
      const yogiPoint = 150
      expect(isConjunctYogiPoint(152, yogiPoint, 5)).toBe(true)
      expect(isConjunctYogiPoint(160, yogiPoint, 5)).toBe(false)
    })

    it('Should handle wrap-around conjunctions', () => {
      const yogiPoint = 359
      expect(isConjunctYogiPoint(1, yogiPoint, 5)).toBe(true) // 2° apart via wrap
    })
  })

  describe('Planets at Yogi Points', () => {
    it('Should identify planets conjunct Yogi points', () => {
      const grahas = [
        { id: 'Su', lonSidereal: 150 },
        { id: 'Mo', lonSidereal: 50 },
        { id: 'Ju', lonSidereal: 243 },
      ]

      const yogiResult = calculateYogiPoint(100, 50) // Yogi = 150
      const conjunct = getPlanetsAtYogiPoints(grahas, yogiResult, 5)

      expect(conjunct.conjunctYogi).toContain('Su')
      expect(conjunct.conjunctSahayogi).toContain('Ju')
    })
  })

  describe('Wealth Score Calculation', () => {
    it('Should calculate wealth score based on Yogi factors', () => {
      const grahas = [
        { id: 'Su', lonSidereal: 150, rashi: 6 as const, dignity: 'own' },
        { id: 'Mo', lonSidereal: 50, rashi: 2 as const, dignity: 'neutral' },
      ]

      const yogiResult = calculateYogiPoint(100, 50)
      const wealth = calculateYogiWealthScore(grahas, yogiResult)

      expect(wealth.score).toBeGreaterThanOrEqual(0)
      expect(wealth.factors.length).toBeGreaterThan(0)
    })
  })

  describe('Interpretation', () => {
    it('Should provide interpretation strings', () => {
      const result = calculateYogiPoint(100, 50)

      expect(result.interpretation.yogi).toBeTruthy()
      expect(result.interpretation.sahayogi).toBeTruthy()
      expect(result.interpretation.avayogi).toBeTruthy()
      expect(result.remedy).toBeTruthy()
    })
  })
})

// ── Edge Cases ────────────────────────────────────────────────

describe('Edge Cases', () => {
  describe('Pushkara Edge Cases', () => {
    it('Should handle longitudes > 360°', () => {
      const result = checkPushkara(372) // 12° Aries
      expect(result.rashi).toBe(1)
    })

    it('Should handle negative longitudes', () => {
      const result = checkPushkara(-348) // 12° Aries
      expect(result.rashi).toBe(1)
    })
  })

  describe('Mrityu Bhaga Edge Cases', () => {
    it('Should handle exact boundary degrees', () => {
      // 19.5° from Mrityu = at boundary of near/wide
      const result = checkMrityuBhaga(19.5)
      expect(result.isMrityuBhaga).toBe(true)
    })
  })

  describe('Yogi Point Edge Cases', () => {
    it('Should handle Sun and Moon at same longitude', () => {
      const result = calculateYogiPoint(180, 180)
      expect(result.yogiPoint).toBeCloseTo(0, 1)
      expect(result.yogiRashi).toBe(1) // Aries
    })

    it('Should handle very large longitudes', () => {
      const result = calculateYogiPoint(1000, 500)
      // 1000 % 360 = 280, 500 % 360 = 140
      // Yogi = 280 + 140 = 420 % 360 = 60
      expect(result.yogiPoint).toBeCloseTo(60, 1)
    })
  })
})
