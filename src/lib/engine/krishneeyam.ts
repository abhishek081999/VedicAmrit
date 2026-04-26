/**
 * src/lib/engine/krishneeyam.ts
 * Krishneeyam Horary Astrology Engine — FULL IMPLEMENTATION
 *
 * Source: "Krishneeyam" by Sri Krishna Acharya (~11th century AD)
 * English Translation by Prof. N.E. Muthuswami
 * A Kerala Prashna (Horary Astrology) treatise — 32 chapters, 524 verses.
 *
 * Implements ALL major chapters:
 *   Ch1  — Udaya Lagna (Ascendant), Seershodaya/Prishtodaya/Ubhayodaya, Sign lords, Planet features
 *   Ch2  — Paksha, Lunar phase
 *   Ch3  — Oordhwamukha/Adhomukha/Thiryangmukha, Directions, Tastes, Drekkanas
 *   Ch5  — Timing of fructification (Kala Prashna)
 *   Ch7  — Life span, Trimsamsha analysis
 *   Ch8  — Planet-in-quarter-of-house timing effects [NEW]
 *   Ch9  — Metals/Plants/Creatures (Dhathu/Moola/Jeeva) + 9-variety cross table + ornaments + flowers [NEW]
 *   Ch10 — Results of Amsak: thief-type drekkana, weapon/cloth drekkana
 *   Ch11 — Aroodha, Veedhi, Chathra, animal query from Chathra [NEW]
 *   Ch12 — Features of querist / Vishwasa Jananam — trust-building [NEW]
 *   Ch13 — Health & Disease + body systems + death Drekkanas + place/cause/rebirth [EXTENDED]
 *   Ch14 — Exile / Travel query
 *   Ch15 — House query (nature, treasure, friendship, marriage)
 *   Ch16 — Tastes & food query
 *   Ch17 — Extended food house analysis (houses 2-10 for food details)
 *   Ch18 — Intercourse query (Maithuna Prashna)
 *   Ch19 — Invisible spirits (Baadha Prashna)
 *   Ch20 — Navamsa significations
 *   Ch21 — Rahu & Ketu dynamic lordship, pregnancy
 *   Ch24 — Anabha Yoga, Mushti/body-touch Prashna
 *   Ch25-26 — Lost article detailed (Nashta Prashna)
 *   Ch27 — Position and features of thief/lost article
 *   Ch28-29 — Lost articles by sign (Aries through Pisces)
 *   Ch30 — Syllables of signs & planets → Name of thief
 *   Ch31 — Rashmi (ray strength) calculation
 *
 * Not covered (specialist topics):
 *   Ch6  — Lost horoscopy (reconstructing querist's natal chart from Prashna — highly specialized)
 *   Ch12 — Shadvargas 6-fold analysis (requires full D1 through D9 varga calculation)
 *   Ch22 — Rahu in ascendant detailed results (future enhancement)
 */

import type { GrahaData, GrahaId, Rashi } from '@/types/astrology'

// ─── Types ───────────────────────────────────────────────────────────────────

export type PrashnaCategory =
  | 'yes_no'       // Will the query be fulfilled? (Sidhi Prashna)
  | 'when'         // When will it happen? (Kala Prashna)
  | 'what'         // What is the nature of subject? (Vastu Prashna)
  | 'who'          // Who is involved? (Chora Prashna — thief)
  | 'lost_article' // Will lost property be recovered? (Nashta Prashna)
  | 'health'       // Disease & recovery (Roga Prashna)
  | 'travel'       // Return of traveller (Pravasa Prashna)
  | 'pregnancy'    // Child / pregnancy query (Santhana Prashna)
  | 'marriage'     // Marriage / relationship query
  | 'house_query'  // Query about a house / location
  | 'spirit'       // Baadha / invisible spirit affliction
  | 'intercourse'  // Maithuna Prashna
  | 'food'         // Bhojana Prashna
  | 'lawsuit'      // Court case / legal dispute (Vivada Prashna)
  | 'exam'         // Exam / election / competition (Pariksha Prashna)
  | 'general'      // General Prashna

export type Verdict = 'YES' | 'NO' | 'DELAYED' | 'MIXED' | 'UNCERTAIN'

export interface KrishneeyamInput {
  lagnaRashi: Rashi          // Udaya Lagna (Rising sign at time of query)
  lagnaDegreeFull: number    // Full degree in zodiac (0-360)
  lagnaSignDegree: number    // Degree within the sign (0-30)
  sunRashi: Rashi
  sunDegreeFull: number
  moonRashi: Rashi
  moonDegreeFull: number
  moonDignity: string
  moonIsRetro: boolean
  moonIsCombust: boolean
  grahas: GrahaData[]
  tithiNumber: number        // 1-30
  tithiPaksha: 'shukla' | 'krishna'
  varaDayNumber: number      // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  nakshatraIndex: number     // 0-26
  // Query-specific inputs
  aroodhaRashi: Rashi | null  // The sign querist physically touches (null = use Lagna)
  category: PrashnaCategory
  bodyTouchPart?: string      // Mushti/Body-touch indicator
}

export interface KrishneeyamResult {
  verdict: Verdict
  headline: string
  confidence: number           // 0-100
  // Rule breakdown
  ascendantType: string
  ascendantTypeResult: 'good' | 'bad' | 'mixed'
  signType: string
  signTypeResult: 'good' | 'bad' | 'neutral'
  aroodhaUdayaRelation: string
  aroodhaUdayaResult: 'good' | 'bad'
  chhatraRashi: Rashi
  chhatraIsObstacle: boolean
  planetInAscendantEffect: string
  bodyTouchResult?: string
  // Rashmi strength
  rashmiScore: number
  rashmiSummary: string
  // Timing
  timing: {
    description: string
    rangeMin: string
    rangeMax: string
    significatorPlanet: string
    unit: string
  }
  // What / Who
  subjectNature?: string
  subjectMaterial?: string
  subjectMaterialDetail?: string   // Ch9: 9-variety cross table, ornament, flower
  subjectDirection?: string
  thief?: {
    gender: string
    caste: string
    relation: string
    posture: string
    features: string
    color: string
    nameLetters: string
    nameLetterExplanation: string
    location: string
  }
  // Health [Ch13] — extended
  health?: {
    dosha: string
    disease: string
    curability: string
    dayOfStart: string
    bodySystem: string           // Ch13: body system/organ affected
    deathSymptoms: string        // Ch13: Sarpa/Kolamukha/Grudhramukha drekkana check
    placeOfDeath: string         // Ch13: sign-based place of death
    causeOfDeath: string         // Ch13: sign-based cause of death
    rebirthNature: string        // Ch13: rebirth by sign
  }
  // Ch12: Features of querist (Vishwasa Jananam — trust building)
  queristFeatures: string[]
  // House query
  houseQuery?: {
    houseType: string
    hasTreasure: string
    ownership: string
    direction: string
    shape: string
  }
  // Spirit / Baadha
  spirit?: {
    type: string
    deity: string
    remedy: string
  }
  // Marriage / Intercourse
  relationship?: {
    quality: string
    partner: string
    nature: string
  }
  // Food
  food?: {
    quality: string
    type: string
    taste: string
  }
  // Navamsa signification
  navamsaSignification?: string
  // Trimsamsha topic
  trimsamshaTopics: string[]
  // Ch11: Animal from Chathra sign
  animalQuery?: string
  // Ch1: Drekkana analysis (Krishneeyam system)
  drekkanaAnalysis: {
    lord: string          // Drekkana lord by Krishneeyam system
    bodyPart: string      // Body part from Drekkana
    rightSide: string
    leftSide: string
    seventhSign: string
  }
  // Ch3: Thief entry direction
  thiefEntry: string
  // Ch1: Physical features (for thief/missing person)
  planetPhysicalFeatures: string   // Features of dominant planet in ascendant
  queristGuna: string              // Sattvika/Rajasika/Tamasika
  // Ch4: Moon yogas
  moonYoga: { name: string; result: string }
  // Ch5: Past/Present/Future
  pastPresentFuture: { past: string[]; present: string[]; future: string[] }
  // Ch4: Dry/wet
  dryWetAnalysis: string
  // Ch2: Time strength notes
  timeStrengthNotes: string[]
  // Ch3: Five elements
  subjectElement: string
  // Ch1: Sign height and place
  signHeight: string
  signPlace: string
  // Scorecard — each individual check with result
  scorecard: Array<{ label: string; result: 'good' | 'bad' | 'neutral'; detail: string; weight: number }>
  // Lawsuit / legal dispute
  lawsuit?: {
    queristStrength: string
    opponentStrength: string
    outcome: string
    timing: string
    keyPlanet: string
  }
  // Exam / competition
  exam?: {
    success: string
    subject: string
    keyStrength: string
    weakness: string
    timing: string
  }
  // Ch22: Rahu in ascendant
  rahuInAscendant?: string
  // Rules cited
  rules: string[]
  details: string[]
  remedies: string[]
  direction: string
}

// ─── Constant Data Tables ─────────────────────────────────────────────────────

export const RASHI_NAMES: Record<number, string> = {
  1:'Aries', 2:'Taurus', 3:'Gemini', 4:'Cancer', 5:'Leo', 6:'Virgo',
  7:'Libra', 8:'Scorpio', 9:'Sagittarius', 10:'Capricorn', 11:'Aquarius', 12:'Pisces'
}

// Seershodaya (front-rising) → Good result [Ch1, St17]
const SEERSHODAYA_SIGNS = new Set([3, 5, 6, 7, 8, 11])

// Prishtodaya (back-rising) → Bad result [Ch1, St17]
const PRISHTODAYA_SIGNS = new Set([1, 2, 4, 9, 10])

// Ubhayodaya → Mixed/Normal [Ch1, St17] — Pisces (12)

// Movable signs (Chara)
const MOVABLE_SIGNS = new Set([1, 4, 7, 10])

// Fixed signs (Sthira)
const FIXED_SIGNS = new Set([2, 5, 8, 11])

// Male / Odd signs
const MALE_SIGNS = new Set([1, 3, 5, 7, 9, 11])

// Watery signs [Ch4, St2 — EXTENDED from the basic 4,8,12]
// Full watery: Scorpio, Taurus, Cancer, Libra, Capricorn, Pisces, Aquarius [Ch4:2]
const WATERY_SIGNS = new Set([4, 8, 12])  // Primary watery
const EXTENDED_WATERY_SIGNS = new Set([8, 2, 4, 7, 10, 12, 11])  // Ch4:2 extended list

// Dry/ground signs [Ch4, St2]: Aries, Gemini, Leo, Virgo, Sagittarius
const DRY_SIGNS = new Set([1, 3, 5, 6, 9])

// Dry planets [Ch4, St1]: Sun, Mars, Saturn
const DRY_PLANETS = new Set<GrahaId>(['Su', 'Ma', 'Sa'])
// Wet planets [Ch4, St1]: Venus, Moon
const WET_PLANETS = new Set<GrahaId>(['Ve', 'Mo'])
// Jupiter+Mercury = depend on sign they occupy

// Quadruped signs [Ch1, St39]
const QUADRUPED_SIGNS = new Set([1, 2, 5, 9])
// Biped signs (human signs) [Ch12, St32]
const BIPED_SIGNS = new Set([3, 6, 7, 11])
// Reptile/insect signs [Ch12]
const REPTILE_SIGNS = new Set([4, 8])

// ── Ch1: Sign height classification [Ch1, St19] ──────────────────────────────
const SIGN_HEIGHT: Record<number, string> = {
  1:'Dwarf', 2:'Dwarf', 3:'Medium', 4:'Medium',
  5:'Tall',  6:'Tall',  7:'Tall',  8:'Tall',
  9:'Medium',10:'Medium',11:'Dwarf',12:'Dwarf'
}

// ── Ch1: Planet height [Ch1, St20] ───────────────────────────────────────────
const PLANET_HEIGHT: Record<GrahaId, string> = {
  Mo:'Short', Sa:'Short', Ma:'Short', Ra:'Short',
  Su:'Medium', Ve:'Medium',
  Ju:'Tall', Me:'Tall',
  Ke:'Short', Ur:'Medium', Ne:'Medium', Pl:'Tall'
}

// ── Ch1: Planet physical shape [Ch1, St23] ───────────────────────────────────
const PLANET_SHAPE: Record<GrahaId, string> = {
  Su:'Square', Ma:'Square',
  Ju:'Spherical/Fat',
  Me:'Triangular',
  Ra:'Long and Square', Sa:'Long and Square',
  Mo:'Round',
  Ve:'Half-round/Stout',
  Ke:'Mixed/Undefined',
  Ur:'Variable', Ne:'Variable', Pl:'Dense/Compact'
}

// ── Ch1: Planet physical features [Ch1, St22-29] for thief identification ────
const PLANET_PHYSICAL_FEATURES: Record<GrahaId, string> = {
  Su: 'Short, thick, honey-colored eyes, reddish-black complexion, lean, sparse-haired, bilious (Pitta), strong bones, valorous, angry temperament',
  Mo: 'Tall, unsteady, sweet-worded, beautiful eyes, lovely, Vata-Kapha constitution, wheatish complexion, knowledgeable, rich-blooded',
  Ma: 'Unsteady, childlike appearance, bilious, rich bone-marrow, aggressive, triangular face, fish-bellied, red-and-white complexion',
  Me: 'Greenish like tender grass, middle-build, protruding veins all over body, happy disposition, mixed temperament, calm, healthy skin, speaks double-meaning words',
  Ju: 'Whitish complexion, rich in fats, big belly, tall, slightly yellow hair, honey-colored eyes, Kapha temperament, eloquent',
  Ve: 'Vata-Kapha constitution, beautiful eyes with Kajal (collyrium), beautiful finger joints, sweet words, rich semen',
  Sa: 'Vata temperament, yellowish eyes, big teeth, big nails and hair, dark-colored body, long/tall, miserly, lean, strong muscular tendons',
  Ra: 'Dark complexion, smoky/shadowy appearance, large build, fierce eyes',
  Ke: 'Smoky-colored, emaciated, spiritual appearance, spotted',
  Ur: 'Unusual/eccentric appearance', Ne: 'Soft, dreamy appearance', Pl: 'Deep, intense appearance'
}

// ── Ch1: Planet Guna (nature) [Ch1, St33] ────────────────────────────────────
const PLANET_GUNA: Record<GrahaId, string> = {
  Ju:'Sattvika (noble, equanimous)',
  Mo:'Sattvika (noble, equanimous)',
  Su:'Sattvika (noble, equanimous)',
  Ve:'Rajasika (worldly pleasures, ambitious)',
  Me:'Rajasika (worldly pleasures, ambitious)',
  Ma:'Tamasika (cruel, violent, evil deeds)',
  Sa:'Tamasika (cruel, violent, evil deeds)',
  Ra:'Tamasika (cruel, violent, evil deeds)',
  Ke:'Mixed (spiritual but also Tamasika)',
  Ur:'Rajasika', Ne:'Mixed', Pl:'Tamasika'
}

// ── Ch1: Planet kingdom portfolio [Ch4, St6] ─────────────────────────────────
const PLANET_KINGDOM_ROLE: Record<GrahaId, string> = {
  Su:'King', Mo:'King/Queen',
  Ma:'Army Commander',
  Sa:'Messenger',
  Ju:'Internal Affairs Minister',
  Ve:'External Affairs Minister',
  Me:'Prince Designate / Crown Prince',
  Ra:'Foreign Intelligence', Ke:'Religious Authority',
  Ur:'Technology Minister', Ne:'Maritime Minister', Pl:'Underworld'
}

// ── Ch1: Sign abode classification [Ch1, St39-42] ────────────────────────────
const SIGN_ABODE: Record<number, string> = {
  1:'Graamya (Rural/Village)', 2:'Graamya (Rural)',
  3:'Graamya (Rural) + Powra (Town)',
  4:'Jala (Watery) + Serpent',
  5:'Aranya (Jungle/Forest)',
  6:'Powra (Town/City)',
  7:'Powra (Town/City)',
  8:'Serpent + Watery',
  9:'Powra (Town) + Aranya',
  10:'Aranya (Jungle, first half)',
  11:'Graamya (Rural)',
  12:'Jala (Watery) + Serpent'
}

// ── Ch1: Planet abode [Ch1, St42] ────────────────────────────────────────────
const PLANET_ABODE: Record<GrahaId, string> = {
  Ju:'Gramachara (Village-roaming)', Me:'Gramachara (Village-roaming)',
  Su:'Vanachara (Forest-roaming)', Ma:'Vanachara (Forest-roaming)',
  Sa:'Vanachara (Forest-roaming)', Ra:'Vanachara (Forest-roaming)',
  Mo:'Jalanilaya (Water-dwelling)', Ve:'Jalanilaya (Water-dwelling)',
  Ke:'Vanachara (Forest)', Ur:'Unknown', Ne:'Jalanilaya', Pl:'Underground'
}

// ── Ch1: Planet animal nature [Ch1, St42] ────────────────────────────────────
const PLANET_ANIMAL_NATURE: Record<GrahaId, string> = {
  Sa:'Village Bird (Mercury=village bird, Saturn=jungle bird)',
  Me:'Village Bird',
  Mo:'Reptile (watery reptile if in watery sign, earthly if in earth sign)',
  Ve:'Two-legged (water-located)', Ju:'Two-legged (village-located)',
  Ma:'Quadruped/flesh-eating animal', Su:'Quadruped/vegetable-eating animal',
  Ra:'Venomous creature', Ke:'Mixed/serpent',
  Ur:'Unknown', Ne:'Aquatic', Pl:'Deep creature'
}

// ── Ch3: Five Elements (Pancha Bhuta) [Ch3, St17] ────────────────────────────
const PLANET_ELEMENT: Record<GrahaId, string> = {
  Me:'Earth (Prithvi)', Ve:'Water (Jala)',
  Sa:'Air (Vayu)', Ma:'Fire (Agni)',
  Ju:'Space (Akasha)', Mo:'Water (depends on sign)',
  Su:'Earth-like',
  Ra:'Air/mixed', Ke:'Fire/mixed',
  Ur:'Space/electric', Ne:'Water', Pl:'Earth/dense'
}

const SIGN_ELEMENT: Record<number, string> = {
  1:'Fire', 2:'Earth', 3:'Air', 4:'Water', 5:'Fire', 6:'Earth',
  7:'Air', 8:'Water', 9:'Fire', 10:'Earth', 11:'Air', 12:'Water'
}

// ── Ch3: Directional aspects — for thief entry [Ch3, St2] ────────────────────
// How thief entered based on planet aspecting the ascendant
const ASPECT_DIRECTION_ENTRY: Record<GrahaId, string> = {
  Su:'Entered from the ROOF/TOP (upward aspect)',
  Ma:'Entered from the ROOF/TOP (upward aspect)',
  Ve:'Entered through WALLS or SIDE DOORS (sideward aspect)',
  Me:'Entered through WALLS or SIDE DOORS (sideward aspect)',
  Mo:'Entered through the MAIN DOOR (forward aspect)',
  Ju:'Entered through the MAIN DOOR (forward aspect)',
  Ra:'Entered by digging UNDERGROUND or through floor (downward aspect)',
  Sa:'Entered by digging UNDERGROUND or through floor (downward aspect)',
  Ke:'Entered from unknown direction',
  Ur:'Entered through electrical/unconventional means',
  Ne:'Entered secretly through water/underground',
  Pl:'Entered through underground'
}

// ── Ch3: Aspect percentage strength [Ch3, St3] ───────────────────────────────
const ASPECT_STRENGTH_PERCENT: Record<number, number> = {
  1: 100,  // 1st house (ascendant itself)
  5: 50,   // trine
  9: 50,   // trine
  7: 100,  // 7th
  4: 75,   // 4th
  10: 25,  // 10th
  // Others: 3,4,5,7,8,9,10 are the valid aspect houses
  3: 25, 8: 25,
}

// ── Ch3: Rashmis (Basic, from Ch3, St4) — different from Ch31! ───────────────
// Saturn=4, Moon=21, Venus=16, Mercury=9, Sun=5, Mars=7, Jupiter=10
const PLANET_RASHMIS_BASIC: Record<GrahaId, number> = {
  Sa:4, Mo:21, Ve:16, Me:9, Su:5, Ma:7, Ju:10,
  Ra:4, Ke:3, Ur:6, Ne:8, Pl:5
}

// Ch3: Planet ages — see PLANET_AGES exported below [Ch3, St10-12]
// Ma=infant, Me=8yrs, Ve=16yrs, Ju=30yrs, Mo=70yrs, Su=50yrs, Sa=100-120yrs

// ── Ch4: Planet family relations [Ch4, St4] ───────────────────────────────────
const PLANET_FAMILY_RELATION: Record<GrahaId, string> = {
  Su:'Father', Mo:'Mother', Ma:'Son',
  Me:'Brother', Ju:'Friend', Ve:'Wife',
  Sa:'Enemy', Ra:'Paternal grandfather/outcaste', Ke:'Maternal uncle/spiritual',
  Ur:'Unexpected relation', Ne:'Secret admirer', Pl:'Unknown'
}

// ── Ch4: Senses by planet [Ch4, St10] ────────────────────────────────────────
// Cumulative: each planet covers the senses of previous planets too
const PLANET_SENSES: Record<GrahaId, string> = {
  Sa:'Touch/Skin (1st sense)',
  Me:'Touch + Taste (Skin + Tongue)',
  Ma:'Touch + Taste + Smell (+ Nose)',
  Ve:'Touch + Taste + Smell + Sight (+ Eye)',
  Ju:'All 5 senses: Touch + Taste + Smell + Sight + Hearing',
  Su:'Touch + Sight', Mo:'Taste + Touch + Smell',
  Ra:'Touch + Fear', Ke:'All senses but confused',
  Ur:'Electronic senses', Ne:'Psychic senses', Pl:'Deep instinct'
}

// ── Ch2: Moolatrikona sign degrees [Ch2, St8] ─────────────────────────────────
const MOOLATRIKONA_DEGREES: Record<GrahaId, { sign: number; from: number; to: number }> = {
  Su: { sign: 5,  from: 10, to: 20 },  // Leo 10°-20°
  Mo: { sign: 2,  from: 3,  to: 30 },  // Taurus 3°-30°
  Ma: { sign: 1,  from: 1,  to: 12 },  // Aries 1°-12°
  Me: { sign: 6,  from: 15, to: 20 },  // Virgo 15°-20°
  Ju: { sign: 9,  from: 1,  to: 10 },  // Sagittarius 1°-10°
  Ve: { sign: 7,  from: 1,  to: 5  },  // Libra 1°-5°
  Sa: { sign: 11, from: 1,  to: 20 },  // Aquarius 1°-20°
  Ra: { sign: 3,  from: 1,  to: 20 },  // (not in text, assigned)
  Ke: { sign: 9,  from: 1,  to: 10 },  // (follows Ju)
  Ur: { sign: 11, from: 1,  to: 30 }, Ne: { sign: 12, from: 1,  to: 30 }, Pl: { sign: 8,  from: 1,  to: 30 }
}

// ── Ch2: Extra house strength [Ch2, St12] ────────────────────────────────────
// Mercury, Jupiter, human signs are strong in ascendant (1st)
// Sun, Mars, quadruped signs are strong in 10th
// Moon, Venus, watery signs are strong in 4th
// Saturn, Scorpio are strong in 7th
const PLANET_STRONGEST_HOUSE: Record<GrahaId, number> = {
  Me: 1, Ju: 1,         // Mercury and Jupiter strong in 1st
  Su: 10, Ma: 10,       // Sun and Mars strong in 10th
  Mo: 4, Ve: 4,         // Moon and Venus strong in 4th
  Sa: 7, Ra: 7,         // Saturn and Rahu strong in 7th
  Ke: 12, Ur: 11, Ne: 12, Pl: 8
}

// ── Ch2: Natural strength order (Naisargika Bala) [Ch2, St18-19] ─────────────
// Sa < Ma < Me < Ju < Ve < Mo < Su (Sun strongest, Saturn weakest)
const NAISARGIKA_BALA: Record<GrahaId, number> = {
  Sa:1, Ma:2, Me:3, Ju:4, Ve:5, Mo:6, Su:7,
  Ra:1, Ke:2, Ur:3, Ne:4, Pl:5
}

// ── Ch1: Krishneeyam-specific Drekkana lord system [Ch1, St6-7] ──────────────
// 4 groups of signs, each group has 3 drekkana lords
// Aries/Leo/Sagittarius: D1=Mars, D2=Sun, D3=Jupiter
// Taurus/Virgo/Capricorn: D1=Venus, D2=Mercury, D3=Saturn
// Gemini/Libra/Aquarius: D1=Mercury, D2=Venus, D3=Saturn
// Cancer/Scorpio/Pisces: D1=Moon, D2=Mars, D3=Jupiter
const KRISHNEEYAM_DREKKANA_LORDS: Record<number, [GrahaId, GrahaId, GrahaId]> = {
  1: ['Ma','Su','Ju'],   // Aries
  5: ['Ma','Su','Ju'],   // Leo
  9: ['Ma','Su','Ju'],   // Sagittarius
  2: ['Ve','Me','Sa'],   // Taurus
  6: ['Ve','Me','Sa'],   // Virgo
  10:['Ve','Me','Sa'],   // Capricorn
  3: ['Me','Ve','Sa'],   // Gemini
  7: ['Me','Ve','Sa'],   // Libra
  11:['Me','Ve','Sa'],   // Aquarius
  4: ['Mo','Ma','Ju'],   // Cancer
  8: ['Mo','Ma','Ju'],   // Scorpio
  12:['Mo','Ma','Ju'],   // Pisces
}

// ── Ch1: Kaalapurusha Vibhaga — body parts by sign [Ch1, St10] ───────────────
const KAALAPURUSHA_LIMB: Record<number, string> = {
  1:'Head', 2:'Face', 3:'Neck & Hands', 4:'Chest',
  5:'Thorax/Heart', 6:'Hip/Abdomen', 7:'Bladder',
  8:'Private parts', 9:'Thighs', 10:'Knee', 11:'Leg', 12:'Feet'
}

// ── Ch1: Planet limbs [Ch1, St13] ─────────────────────────────────────────────
// "Head-Mars; Face-Venus; Neck-Mercury; Chest-Moon; Heart-Sun; Thigh-Jupiter; Knee-Saturn; Foot-Rahu"
const PLANET_LIMB: Record<GrahaId, string> = {
  Ma:'Head', Ve:'Face', Me:'Neck', Mo:'Chest',
  Su:'Heart', Ju:'Thigh', Sa:'Knee', Ra:'Foot',
  Ke:'Spine/back', Ur:'Nervous system', Ne:'Lymph', Pl:'Deep organs'
}

// ── Ch5: Sign place (location) [Ch5, St3] ─────────────────────────────────────
// (same as SIGN_PLACE_OF_DEATH but for general location queries)
const SIGN_PLACE: Record<number, string> = {
  1:'Forest/Jungle', 2:'Field/Farmland', 3:'Village', 4:'Water/River',
  5:'Mountain/Hill', 6:'Village', 7:'Market/Bazaar', 8:'Den/Cave/Underground',
  9:'Garden/Park', 10:'End of river/Riverside', 11:'Pool/Lake', 12:'Ocean/Sea'
}

// ── Ch5: Past/Present/Future house groupings [Ch5, St7] ──────────────────────
const PAST_HOUSES = new Set([9,10,11,12])
const FUTURE_HOUSES = new Set([5,6,7,8])
const PRESENT_HOUSES = new Set([1,2,3,4])

// Sign lords [Ch1, St5]
export const SIGN_LORDS: Record<number, GrahaId> = {
  1:'Ma', 2:'Ve', 3:'Me', 4:'Mo', 5:'Su', 6:'Me',
  7:'Ve', 8:'Ma', 9:'Ju', 10:'Sa', 11:'Sa', 12:'Ju'
}

// Benefic/malefic planets [Ch1, St32]
const BENEFICS = new Set<GrahaId>(['Ju', 'Ve', 'Me'])
const MALEFICS = new Set<GrahaId>(['Su', 'Ma', 'Sa', 'Ra'])

// Planet directions [Ch1, St36] (Ch3, St2)
export const PLANET_DIRECTIONS: Record<GrahaId, string> = {
  Su: 'East', Ve: 'South-East', Ma: 'South', Ra: 'South-West',
  Sa: 'West', Mo: 'North-West', Me: 'North', Ju: 'North-East',
  Ke: 'South-West', Ur: 'East', Ne: 'West', Pl: 'West'
}

// Sign directions [Ch15, St6]
const SIGN_DIRECTIONS: Record<number, string> = {
  1:'East', 2:'East', 3:'East-South', 4:'South', 5:'South', 6:'South-West',
  7:'West', 8:'West', 9:'North-West', 10:'North', 11:'North', 12:'North-East'
}

// ── Ch9: 9-variety Dhathu-Moola-Jeeva cross-combination table ──────────────
// [planet-type, sign-type] → result description [Ch9, St5]
const DHATHU_MOOLA_JEEVA_CROSS: Record<string, string> = {
  'dhathu-moola':  'Plants/flowers etc. made of METAL (ornaments of vegetable design)',
  'dhathu-jeeva':  'Creatures made of METAL (metal sculptures of animals)',
  'dhathu-dhathu': 'Article of pure plant origin (metal-related but plant type)',
  'moola-dhathu':  'Cooked or burnt camphor / aromatic resins',
  'moola-jeeva':   'Idols made of PLANTS (wooden sculptures, plant-based idols)',
  'moola-moola':   'Pure plant articles (wood, herbs, fruits, grains)',
  'jeeva-jeeva':   'Living creature',
  'jeeva-dhathu':  'Excreta of creatures (animal-derived products)',
  'jeeva-moola':   'Plant root articles like turmeric / rhizomes',
}

// ── Ch9: Planet sub-significations by degree (6 degrees each) ──────────────
// [Ch9, St8-11]
const PLANET_SUB_SIGNIFICATIONS: Record<GrahaId, string[]> = {
  Ma: ['Copper', 'Bricks', 'Skull', 'Coral', 'Mud', 'Dust'],
  Mo: ['Moonstone', 'Salt', 'Conch', 'Crystal glass', 'Bell metal', 'Brass'],
  Ju: ['Red gem', 'Gold', 'Manassila (Realgar)', 'Cat\'s eye', 'Thala (sand)'],
  Me: ['Vikrantha gem', 'Green emerald', 'Mud', 'Cat\'s eye'],
  Ve: ['Silver', 'Crystal glass', 'Pearl', 'Cat\'s eye'],
  Sa: ['Anjana (eye-black)', 'Iron', 'Blue sapphire', 'Lead'],
  Ra: ['Anjana', 'Iron', 'Blue sapphire', 'Lead'], // same as Saturn
  Su: ['Stone', 'Sunstone', 'Brass', 'Cat\'s eye', 'Lead'],
  Ke: ['Mixed gems', 'Smoky stone', 'Roots'],
  Ur: ['Mixed metals'], Ne: ['Aquatic substances'], Pl: ['Deep minerals']
}

// ── Ch9: Ornament significations by planet [Ch9, St38-41] ──────────────────
const PLANET_ORNAMENTS: Record<GrahaId, string> = {
  Su: 'Crown or ear ornament (strong Sun); black golden ornaments (weak)',
  Mo: 'Pearl, chain, arm ornament, leg ornament, silver ornament, forehead ornament (full Moon)',
  Ma: 'Golden chain, coral ornament',
  Me: 'Children\'s ornaments, gem-fitted ornaments',
  Ju: 'Chest/belly ornaments, diamond earring',
  Ve: 'Ring, necklace, waist chain, neck ornament',
  Sa: 'Blue sapphire, lost neck ornaments',
  Ra: 'Blue sapphire, neck ornaments (same as Saturn)',
  Ke: 'Spiritual ornaments, rudraksha',
  Ur: 'Modern ornaments', Ne: 'Pearl/coral (water-born)', Pl: 'Deep-mined gems'
}

// ── Ch9: Flower significations by planet [Ch9, St41 commentary] ─────────────
const PLANET_FLOWERS: Record<GrahaId, string> = {
  Su: 'Tulsi, Lotus',
  Mo: 'Water-born flowers (water lily, lotus)',
  Ma: 'Red and thorny flowers',
  Me: 'Neelothpala (blue lotus), Shankhpushpa',
  Ju: 'Jasmine',
  Ve: 'Pineapple flower, fragrant flowers',
  Sa: 'Jungle flowers, bad-odour flowers',
  Ra: 'Dark/purple flowers (same as Saturn)',
  Ke: 'Dried or unusual flowers',
  Ur: 'Exotic flowers', Ne: 'Aquatic blossoms', Pl: 'Rare deep-forest flowers'
}

// ── Ch13: Death-indicating Drekkanas [Ch13, St1] ────────────────────────────
// Sarpa (Serpent) Drekkanas: 2nd of Cancer(4), 1st of Scorpio(8), 3rd of Pisces(12)
const SARPA_DREKKANAS = [
  { rashi: 4,  drekkana: 2 },   // 2nd of Cancer
  { rashi: 8,  drekkana: 1 },   // 1st of Scorpio
  { rashi: 12, drekkana: 3 },   // 3rd of Pisces
]
// Kolamukha Drekkanas: 3rd of Scorpio(8), 1st of Cancer(4), 1st of Capricorn(10)
const KOLAMUKHA_DREKKANAS = [
  { rashi: 8,  drekkana: 3 },   // 3rd of Scorpio
  { rashi: 4,  drekkana: 1 },   // 1st of Cancer
  { rashi: 10, drekkana: 1 },   // 1st of Capricorn
]
// Grudhramukha (Vulture-face) Drekkanas: 3rd of Leo(5), 3rd of Aquarius(11), 2nd of Libra(7)
const GRUDHRAMUKHA_DREKKANAS = [
  { rashi: 5,  drekkana: 3 },   // 3rd of Leo
  { rashi: 11, drekkana: 3 },   // 3rd of Aquarius
  { rashi: 7,  drekkana: 2 },   // 2nd of Libra
]

// ── Ch13: Place of death by sign [Ch13, St7] ────────────────────────────────
const SIGN_PLACE_OF_DEATH: Record<number, string> = {
  1:'Jungle', 2:'Field', 3:'Village', 4:'Water', 5:'Mountain',
  6:'Village', 7:'Market', 8:'Den/Cave', 9:'Garden', 10:'River', 11:'Lake', 12:'Ocean'
}

// ── Ch13: Cause of death by sign [Ch13, St7] ────────────────────────────────
const SIGN_CAUSE_OF_DEATH: Record<number, string> = {
  1:'Goat or sheep', 2:'Ox or bull', 3:'Man or woman', 4:'Serpent or reptile',
  5:'Wild/fierce animals (lion)', 6:'Domestic animals or disease', 7:'Balance/dispute/legal',
  8:'Scorpion or venomous creature', 9:'Horse or four-footed animal',
  10:'Deer or aquatic animal', 11:'Large animal (elephant)', 12:'Fish or aquatic creature'
}

// ── Ch13: Body system by planet [Ch13, St6] ─────────────────────────────────
const PLANET_BODY_SYSTEM: Record<GrahaId, string> = {
  Su: 'Bones (Asthi) — Pitta dosha',
  Mo: 'Blood (Raktha) — Vata-Kapha dosha',
  Ma: 'Bone marrow (Majja) — Pitta dosha',
  Me: 'Skin (Twacha) — Vata dosha',
  Ju: 'Fat/adipose tissue (Meda) — Vata-Kapha dosha',
  Ve: 'Semen/reproductive system (Shukra) — Vata-Kapha dosha',
  Sa: 'Tendons/sinews (Snayu) — Vata dosha',
  Ra: 'Tendons/sinews — Vata dosha (same as Saturn)',
  Ke: 'Skin/nervous system — Vata-Pitta mixed',
  Ur: 'Nervous system', Ne: 'Lymph/fluid system', Pl: 'Deep cellular/DNA'
}

// ── Ch12: Planet pair combinations for querist features (Vishwasa Jananam) ──
// [Ch12, St1-4]
const QUERIST_PLANET_PAIRS: Array<{
  pair: GrahaId[]; fact: string; condition?: string
}> = [
  { pair: ['Ve', 'Ma'], fact: 'Querist loves the wife of another person [Ch12:1]' },
  { pair: ['Ve', 'Me'], fact: 'Querist has spoiled a virgin [Ch12:1]' },
  { pair: ['Ve', 'Su'], fact: 'Querist is the second husband of a lady; may have eye defects [Ch12:3]' },
  { pair: ['Sa', 'Mo'], fact: 'Querist or spouse is attached to another person [Ch12:2]' },
  { pair: ['Mo', 'Ju'], fact: 'Querist is a rich/wealthy person [Ch12:2]' },
  { pair: ['Me', 'Mo'], fact: 'Querist is fortunate and lucky [Ch12:2]' },
  { pair: ['Ma', 'Sa'], fact: 'Querist is wicked or cruel [Ch12:4]' },
  { pair: ['Ma', 'Me'], fact: 'Querist is a protector (guard/warrior type) [Ch12:4]' },
  { pair: ['Ma', 'Ju'], fact: 'Querist is a wrestler or physically strong person [Ch12:4]' },
  { pair: ['Sa', 'Me'], fact: 'Querist is a cheat or deceiver [Ch12:4]' },
  { pair: ['Su', 'Ma'], fact: 'Querist is fatherless [Ch12:4 commentary]' },
  { pair: ['Ju', 'Ve'], fact: 'Querist\'s wife is righteous and virtuous [Ch12:4 commentary]' },
  { pair: ['Sa', 'Ve'], fact: 'Querist\'s wife is of questionable character [Ch12:4 commentary]' },
  { pair: ['Su', 'Mo'], fact: 'Querist is respected by both mother and father [Ch12:4 commentary]' },
]

// ── Ch11/Chathra: Animal query from Chathra sign ─────────────────────────────
const CHATHRA_ANIMAL: Record<number, string> = {
  1: 'Lamb or small sheep',
  2: 'Cow',
  3: 'Human being (Gemini = human sign)',
  4: 'Mongoose or water creature',
  5: 'Flesh-eating wild animals (lion, tiger)',
  6: 'Human being (Virgo = human sign)',
  7: 'Human being (Libra = human sign)',
  8: 'Lamb or sheep (same as Aries)',
  9: 'Donkey, Camel, or Horse',
  10: 'Deer',
  11: 'Human being (Aquarius = human sign)',
  12: 'Horse or aquatic creature',
}

// ── Ch8: Planet-in-quarter timing [Ch8, St9-10] ──────────────────────────────
// Sun in 4th house quarters: 1st=chest pain, 2nd=burning, 3rd=hemorrhage, 4th=fear from king
const PLANET_HOUSE4_QUARTERS: Record<GrahaId, string[]> = {
  Su: ['Chest pain/heart trouble', 'Burning sensation through body', 'Hemorrhage/bleeding', 'Fear from king or authority'],
  Ve: ['Worry and anxiety about wife/partner', 'Worry about wife/partner', 'Worry about wife/partner', 'Worry about wife/partner'],
  Ju: ['Worry about finance', 'Worry about finance/wealth', 'Worry about wealth', 'Worry about wealth'],
  Ma: ['Enmity with relatives (1st Hora)', 'Mental agony and distress (2nd Hora)', 'Enmity with relatives', 'Mental agony'],
  Sa: ['Fear and danger', 'Death of someone close', 'Fear and danger', 'Death of someone close'],
  Mo: ['Wife is beautiful', 'Wife is beautiful', 'Wife is beautiful', 'Wife is beautiful'],
  Me: ['Arguments and disputes with others', 'Arguments with others', 'Arguments', 'Arguments'],
  Ra: ['Hidden fear', 'Poison or hidden danger', 'Fear from unseen', 'Chronic hidden disease'],
  Ke: ['Spiritual troubles', 'Obstacle in home', 'Spiritual troubles', 'Obstacle from unknown'],
  Ur: ['Sudden changes at home'], Ne: ['Hidden issues at home'], Pl: ['Deep transformation at home']
}

// ── Planet caste [Ch1, St31]
export const PLANET_CASTE: Record<GrahaId, string> = {
  Ju: 'Brahmin', Ve: 'Brahmin (Kshathriya)',
  Su: 'Kshathriya', Ma: 'Kshathriya',
  Me: 'Vaisya', Mo: 'Vaisya',
  Sa: 'Sudra', Ra: 'Chandala', Ke: 'Chandala',
  Ur: 'Mixed', Ne: 'Mixed', Pl: 'Mixed'
}

// Planet colors [Ch3, St20]
export const PLANET_COLORS: Record<GrahaId, string> = {
  Su: 'Crimson Red', Mo: 'Milk White', Ma: 'Blood Red',
  Me: 'Parrot Green', Ju: 'Yellow (Champaka)', Ve: 'Mixed / Variegated',
  Sa: 'Blue / Dark', Ra: 'Black', Ke: 'Smoky / Dark',
  Ur: 'Mixed', Ne: 'Sea Blue', Pl: 'Dark'
}

// Planet physical features [Ch1, St22-29]
export const PLANET_FEATURES: Record<GrahaId, string> = {
  Su: 'Short, thick, honey-colored eyes, reddish-black, lean, sparse-haired, bilious temperament',
  Mo: 'Tall, unsteady, sweet-worded, beautiful eyes, wheatish complexion, knowledgeable',
  Ma: 'Unsteady, childlike, bilious, triangular build, fish-bellied, red and white complexion',
  Me: 'Greenish tinge, medium build, protruding veins, calm, speaks double-meaning words',
  Ju: 'Whitish, rich in fats, big belly, tall, slightly yellow hair, honey-colored eyes, eloquent',
  Ve: 'Vatha-Kapha temperament, beautiful kajal-lined eyes, lovely finger joints, sweet-worded',
  Sa: 'Vatha temperament, yellowish eyes, big teeth & nails, dark skin, long body, miserly, lean',
  Ra: 'Dark complexion, large body, foreign appearance',
  Ke: 'Smoky complexion, intense eyes, spiritual appearance',
  Ur: 'Mixed appearance', Ne: 'Watery appearance', Pl: 'Dark, transformative appearance'
}

// Planet ages [Ch3, St10]
export const PLANET_AGES: Record<GrahaId, string> = {
  Ma: 'Infant (breast-feeding age)', Me: '8 years', Ve: '16 years',
  Mo: '70 years', Su: '50 years', Ju: '30 years', Sa: '100 years',
  Ra: '100 years', Ke: '100 years', Ur: '84 years', Ne: '165 years', Pl: '248 years'
}

// Timing multipliers [Ch5, St1-7]
export const PLANET_TIMING: Record<GrahaId, { value: number; unit: string; description: string }> = {
  Mo: { value: 1,   unit: 'hours',  description: 'Moon → immediate (same Ghati, ~48 min)' },
  Ma: { value: 1,   unit: 'days',   description: 'Mars → 1 day' },
  Ve: { value: 15,  unit: 'days',   description: 'Venus → 15 days' },
  Ju: { value: 1,   unit: 'months', description: 'Jupiter → 1 month' },
  Me: { value: 2,   unit: 'months', description: 'Mercury → 2 months (1 Ritu)' },
  Su: { value: 6,   unit: 'months', description: 'Sun → 6 months (1 Ayana)' },
  Sa: { value: 1,   unit: 'years',  description: 'Saturn → 1 year' },
  Ra: { value: 1,   unit: 'years',  description: 'Rahu → 1 year' },
  Ke: { value: 1,   unit: 'years',  description: 'Ketu → 1 year' },
  Ur: { value: 7,   unit: 'years',  description: 'Uranus → 7 years' },
  Ne: { value: 12,  unit: 'years',  description: 'Neptune → 12 years' },
  Pl: { value: 20,  unit: 'years',  description: 'Pluto → 20 years' },
}

// Planet metals/materials [Ch9, St8-12]
export const PLANET_MATERIAL: Record<GrahaId, string> = {
  Su: 'Brass / Lead / Sunstone',
  Mo: 'Silver / Bell-metal / Moonstone / Conch',
  Ma: 'Copper / Coral / Bricks / Mud / Dust',
  Me: 'Green Emerald / Vikrantha Gem / Mixed metals',
  Ju: 'Gold / Red Gem / Manassila (Realgar)',
  Ve: 'Silver / Pearl / Crystal Glass',
  Sa: 'Iron / Blue Sapphire / Anjana (eye-black)',
  Ra: 'Iron / Black metal',
  Ke: 'Mixed / Smoky stone',
  Ur: 'Mixed metals', Ne: 'Water-borne substances', Pl: 'Deep-earth minerals'
}

// Planet agricultural produce [Ch25, St14]
const PLANET_PRODUCE: Record<GrahaId, string> = {
  Su: 'Jatiphala (Mace)', Sa: 'Katurohini (Bitter products)', Ve: 'Chandan (Sandal)',
  Me: 'Tamala (Dark barked tree)', Ju: 'Takkola', Mo: 'Kushta (Creeper)',
  Ma: 'Dhaniya (Coriander)', Ra: 'Thorny plants', Ke: 'Roots / tubers',
  Ur: 'Mixed', Ne: 'Aquatic plants', Pl: 'Deep-root herbs'
}

// Planet tastes (view 1) [Ch16, St1]
const PLANET_TASTES_1: Record<GrahaId, string> = {
  Ve: 'Sweet and oily', Mo: 'Cold', Ju: 'Rough', Me: 'Rough',
  Su: 'Salty and astringent', Sa: 'Chilly', Ma: 'Bitter',
  Ra: 'Pungent', Ke: 'Mixed', Ur: 'Sour', Ne: 'Saline', Pl: 'Astringent'
}

// Planet tastes (view 2) [Ch16, St2]
const PLANET_TASTES_2: Record<GrahaId, string> = {
  Ju: 'Sweet', Su: 'Chilly mixed', Sa: 'Bitter', Me: 'Astringent',
  Ve: 'Sour', Ma: 'Chilly', Mo: 'Salt',
  Ra: 'Pungent', Ke: 'Mixed', Ur: 'Sour', Ne: 'Saline', Pl: 'Astringent'
}

// Planet containers (for hidden articles) [Ch25, St12]
const PLANET_CONTAINERS: Record<GrahaId, string> = {
  Su: 'Big and broad vessel', Ju: 'Pot', Ma: 'Mercury (glass/cup)',
  Me: 'Small pot', Ve: 'Broken vessel', Sa: 'Earthen vessel',
  Mo: 'Water pot', Ra: 'Dark metal vessel', Ke: 'Mixed/old vessel',
  Ur: 'Mixed', Ne: 'Water container', Pl: 'Underground container'
}

// Planet nature of house in 1st/7th [Ch15, St2-4]
const PLANET_HOUSE_NATURE: Record<GrahaId, string> = {
  Ma: 'Burnt house / fire-damaged building',
  Ve: 'New building with pictures on wall',
  Mo: 'Strong, old, and pretty house',
  Me: 'House with sculptured/carved work',
  Ju: 'Attractive and wonderful house',
  Su: 'Wooden and dilapidated house',
  Sa: 'Worn-out, dilapidated wooden house',
  Ra: 'Latrine / ruined structure',
  Ke: 'Abandoned / spiritual place',
  Ur: 'Modern unusual structure',
  Ne: 'Near water body',
  Pl: 'Underground or subterranean'
}

// Planet alternate house nature [Ch15, St5]
const PLANET_HOUSE_ALT: Record<GrahaId, string> = {
  Ma: 'Kitchen or fire room',
  Ju: 'Study centre or yoga centre',
  Me: 'Play house or picture house',
  Su: 'Kitchen or cooking place',
  Ve: 'Resting place / relaxation room',
  Mo: 'Temple or divine house',
  Sa: 'Dilapidated house',
  Ra: 'Stable or animal shelter',
  Ke: 'Latrine or waste place',
  Ur: 'Modern facility', Ne: 'Water house', Pl: 'Underground'
}

// Baadha spirit groups [Ch19, St1]
const BAADHA_GROUPS: Record<GrahaId, string> = {
  Su: 'Jyothishika (Luminaries — Devatha group)',
  Ma: 'Jyothishika (Luminaries — Devatha group)',
  Mo: 'Vanavasi (Dwelling in forests — Ghosts)',
  Ve: 'Vanavasi (Dwelling in forests — Ghosts)',
  Sa: 'Vyanthara (Invading human body — Pisacha)',
  Ra: 'Vyanthara (Invading human body — Pisacha)',
  Ju: 'Devagana (Dwelling in heavens)',
  Me: 'Devagana (Dwelling in heavens)',
  Ke: 'Vyanthara (Invading human body)',
  Ur: 'Devagana', Ne: 'Vanavasi', Pl: 'Vyanthara'
}

// Deity signified by planet [Ch19, St3]
const PLANET_DEITY: Record<GrahaId, string> = {
  Ve: 'Sri Lakshmi', Su: 'Rudra / Shiva', Me: 'Vishnu',
  Mo: 'Durga', Ju: 'Brahma', Ma: 'Subrahmanya (Karttikeya)',
  Sa: 'Lokapala (Guardian of directions)', Ra: 'Rahu deity / Sarpa',
  Ke: 'Ganesha / Naga', Ur: 'Mixed deity', Ne: 'Water deity', Pl: 'Ancestor deity'
}

// Specific significations by planet [Ch21, St1]
const PLANET_PRASHNA_SIGNIFICATION: Record<GrahaId, string> = {
  Ma: 'Thief', Sa: 'Robbed property', Ju: 'Wealth / money',
  Ve: 'Quarrel', Me: 'Disease', Mo: 'Fear / anxiety',
  Su: 'Quadruped animals / cattle', Ra: 'Hidden things / poison',
  Ke: 'Obstacles / spirits', Ur: 'Sudden changes', Ne: 'Hidden matters', Pl: 'Deep transformations'
}

// Navamsa ascendant significations [Ch20]
const NAVAMSA_SIGNIFICATIONS: Record<number, string[]> = {
  1:  ['King / Army Chief (1st div)', 'Commander (2nd div)', 'Hiding place of thief (3rd div)'],
  2:  ['Perfumes (1st)', 'Garments (2nd)', 'Garland (3rd)', 'Cattle (4th)', 'Peasant/farmer (5th)'],
  3:  ['Gandharvas/singers (1st)', 'Charlatans (2nd)', 'Dancers (3rd)', 'Copulation matters (4th)', 'Ladies affairs (5th)'],
  4:  ['Garden (1st)', 'Garden (2nd)', 'Medicine/herbs (3rd)', 'Bed/sleeping (4th)'],
  5:  ['Jungle (1st)', 'Quadruped animals (2nd)', 'Castle/fort (3rd)', 'Cave/hidden place (4th)'],
  6:  ['Writing/letters (1st)', 'Cloth/fabric (2nd)', 'Gandharvas/singers (3rd)'],
  7:  ['Measuring tools (1st)', 'Weighing balance (2nd)', 'Jars/vessels (3rd)', 'Intoxicants (4th)'],
  8:  ['Worms (1st)', 'Insects (2nd)', 'Leeches (3rd)', 'Serpents (4th)', 'Food (5th)', 'Poison-queller (6th)'],
  9:  ['Astrologer (1st)', 'Brahmin (2nd)', 'Teacher/Guru (3rd)', 'Garland (4th)', 'Perfume (5th)', 'Warrior on horse (6th)', 'Woman (7th)'],
  10: ['Copulation matters (1st)', 'Wicked people (2nd)', 'Aged people (3rd)', 'Eatables (4th)', 'Musical instrument (5th)'],
  11: ['Long-nailed person (1st)', 'Long-nailed person (2nd)', 'Man (3rd)', 'Woman (4th)', 'Couple (5th)'],
  12: ['Beautiful lady (1st)', 'Friend (2nd)', 'Blue lotus (3rd)', 'Fish/water creature (4th)', 'Lotus (5th)'],
}

// Rashmi (ray strength) for signs [Ch31, St1]
const SIGN_RASHMIS: Record<number, number> = {
  1:90, 2:90, 3:110, 4:110, 5:110, 6:110,
  7:117, 8:110, 9:90, 10:100, 11:100, 12:100
}

// Rashmi (ray strength) for planets [Ch31, St2]
const PLANET_RASHMIS: Record<GrahaId, number> = {
  Su: 25, Mo: 90, Ma: 25, Me: 74, Ju: 60, Ve: 76, Sa: 25,
  Ra: 25, Ke: 25, Ur: 50, Ne: 40, Pl: 30
}

// Planet syllables for thief's name [Ch30, St1]
const PLANET_SYLLABLES: Record<GrahaId, { group: string; letters: string }> = {
  Su: { group: 'Vowels', letters: 'a, aa, i, ii, u, uu, r, ru, ai, o, ou' },
  Mo: { group: 'Semi-vowels', letters: 'ya, ra, la, va' },
  Ma: { group: 'Kavarga', letters: 'ka, kha, ga, gha, nga' },
  Ve: { group: 'Chavarga', letters: 'cha, chha, ja, jha, gna' },
  Me: { group: 'Tavarga', letters: 'ta, tta, da, dha, na' },
  Ju: { group: 'Thavarga', letters: 'tha, ttha, da, ddha, na' },
  Sa: { group: 'Pavarga', letters: 'pa, pha, ba, bha, ma' },
  Ra: { group: 'Sibilants', letters: 'sa, sha, sa (visarga), la, ksha' },
  Ke: { group: 'Mixed', letters: 'ha, mixed consonants' },
  Ur: { group: 'Mixed', letters: 'mixed' }, Ne: { group: 'Mixed', letters: 'mixed' }, Pl: { group: 'Mixed', letters: 'mixed' }
}

// Trimsamsha lords for odd signs [Ch7, St2]
const TRIMSHAMSHA_ODD: Array<{ upto: number; lord: GrahaId }> = [
  { upto: 5,  lord: 'Ma' },
  { upto: 10, lord: 'Sa' },
  { upto: 18, lord: 'Ju' },
  { upto: 25, lord: 'Me' },
  { upto: 30, lord: 'Ve' },
]

// Trimsamsha lords for even signs [Ch7, St2]
const TRIMSHAMSHA_EVEN: Array<{ upto: number; lord: GrahaId }> = [
  { upto: 5,  lord: 'Ve' },
  { upto: 10, lord: 'Me' },
  { upto: 18, lord: 'Ju' },
  { upto: 25, lord: 'Sa' },
  { upto: 30, lord: 'Ma' },
]

// Trimsamsha lord signification [Ch7, St3-4]
const TRIMSHAMSHA_TOPIC: Record<GrahaId, string> = {
  Ju: 'Connected with wealth / money. If Ju/Ve aspects: Activity in a Brahmin\'s house',
  Ve: 'Connected with ladies / love. If Ju/Ve aspects: Activity in a Brahmin\'s house',
  Sa: 'Connected with departed soul (Pretha) / ancestor',
  Ma: 'Connected with thief / violence / fire',
  Me: 'Connected with arguments / debate / documents',
  Su: 'Connected with cattle / king / authority',
  Mo: 'Connected with daughter / mother / emotions',
  Ra: 'Connected with foreign matters / poison',
  Ke: 'Connected with spiritual obstacles / hidden enemies',
  Ur: 'Sudden change', Ne: 'Hidden matters', Pl: 'Deep transformation'
}

// Aroodha-Udaya relationship table [Ch11, St21]
const AROODHA_UDAYA_GOOD = new Set([1, 3, 4, 5, 7, 9, 10, 11])
const AROODHA_UDAYA_BAD  = new Set([2, 6, 8, 12])

// House significations [Ch1, St9 + Ch15, St12-13]
export const HOUSE_SIGNIFICATORS: Record<number, string[]> = {
  1:  ['Self', 'Body', 'Health', 'Personality', 'Success/Failure'],
  2:  ['Wealth', 'Money', 'Food', 'Family', 'Speech', 'Right Eye', 'Future experience'],
  3:  ['Siblings', 'Courage', 'Short journey', 'Communication', 'Neighbours', 'Retinue'],
  4:  ['Mother', 'Home', 'Property', 'Vehicle', 'Hidden things', 'Education', 'Heart', 'Friend', 'Water'],
  5:  ['Children', 'Speculation', 'Intelligence', 'Love affairs', 'Past deeds', 'Stomach diseases'],
  6:  ['Enemies', 'Disease', 'Debt', 'Injury', 'Theft', 'Competition', 'Wounds'],
  7:  ['Spouse', 'Partner', 'Business', 'Marriage', 'Lost property', 'Travel', 'Disease', 'Death hearsay'],
  8:  ['Death', 'Longevity', 'Accidents', 'Hidden matters', 'Legacy', 'Varieties of food'],
  9:  ['Father', 'Fortune', 'Religion', 'Long journeys', 'Higher learning', 'Good & bad of father'],
  10: ['Profession', 'Career', 'Fame', 'Government', 'Status', 'Place of residence', 'Savings', 'Prestige'],
  11: ['Gains', 'Elder siblings', 'Friends', 'Fulfillment of wishes', 'Income', 'Whatever is obtained'],
  12: ['Loss', 'Expenditure', 'Foreign', 'Imprisonment', 'Liberation', 'Expenses'],
}

// Category → Primary house mapping
const CATEGORY_HOUSE: Record<PrashnaCategory, number> = {
  yes_no: 1, when: 1, what: 1, who: 7,
  lost_article: 7, health: 6, travel: 9, pregnancy: 5,
  marriage: 7, house_query: 4, spirit: 1, intercourse: 7,
  food: 2, lawsuit: 6, exam: 5, general: 1
}

// Body touch results [Ch24, St15-18]
export const BODY_TOUCH_RESULTS: Record<string, { result: 'fulfilled' | 'delayed' | 'neutral' | 'never'; description: string }> = {
  chest:        { result: 'fulfilled', description: 'Chest touched → Desire WILL be fulfilled (Ch24:18)' },
  hair:         { result: 'fulfilled', description: 'Hair touched → Male-related; Desire fulfilled (Ch24:15)' },
  nail:         { result: 'fulfilled', description: 'Nails touched → Desire fulfilled (Ch24:15)' },
  teeth:        { result: 'fulfilled', description: 'Teeth touched → Desire fulfilled (Ch24:15)' },
  armpit:       { result: 'fulfilled', description: 'Armpit touched → Desire fulfilled (Ch24:15)' },
  breast:       { result: 'fulfilled', description: 'Breast touched → Desire fulfilled (Ch24:15)' },
  hand:         { result: 'fulfilled', description: 'Hand/palm touched → Desire fulfilled (Ch24:15)' },
  navel:        { result: 'fulfilled', description: 'Navel touched → Desire fulfilled (Ch24:15)' },
  thigh:        { result: 'fulfilled', description: 'Thigh touched → Desire fulfilled (Ch24:15)' },
  head:         { result: 'fulfilled', description: 'Head (top) touched → Desire fulfilled (Ch24:15)' },
  foot:         { result: 'fulfilled', description: 'Foot touched → Desire fulfilled (Ch24:15)' },
  back_neck:    { result: 'delayed',  description: 'Back of neck → Wealth/Daughter after long period (Ch24:16)' },
  eyebrow:      { result: 'delayed',  description: 'Eyebrow → Result after long period (Ch24:16)' },
  nose:         { result: 'delayed',  description: 'Nose → Result after long period (Ch24:16)' },
  finger:       { result: 'delayed',  description: 'Finger → Result after long period (Ch24:16)' },
  ankle:        { result: 'delayed',  description: 'Ankle → Result after long period (Ch24:16)' },
  chin_bone:    { result: 'delayed',  description: 'Chin bone → Result after long period (Ch24:16)' },
  pinnae_ear:   { result: 'delayed',  description: 'Pinnae of ear → Result after long period (Ch24:16)' },
  hip:          { result: 'delayed',  description: 'Hip → Result after long period (Ch24:16)' },
  face:         { result: 'neutral',  description: 'Face → Neutral; Desire may not fructify (Ch24:17)' },
  knee:         { result: 'neutral',  description: 'Knee → Neutral; Desire unlikely (Ch24:17)' },
  belly:        { result: 'neutral',  description: 'Belly → Neutral; Desire unlikely (Ch24:17)' },
  forehead:     { result: 'neutral',  description: 'Forehead → Neutral; Desire unlikely (Ch24:17)' },
  lower_body:   { result: 'never',    description: 'Lower body organ → Desire will NEVER be fulfilled (Ch24:18)' },
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

/** Returns sign type: movable | fixed | common */
export function getSignType(rashi: number): 'movable' | 'fixed' | 'common' {
  if (MOVABLE_SIGNS.has(rashi)) return 'movable'
  if (FIXED_SIGNS.has(rashi)) return 'fixed'
  return 'common'
}

/** Seershodaya / Prishtodaya / Ubhayodaya [Ch1, St17] */
export function getOdayaType(rashi: number): { type: 'seershodaya' | 'prishtodaya' | 'ubhayodaya'; label: string; verdict: 'good' | 'bad' | 'mixed' } {
  if (SEERSHODAYA_SIGNS.has(rashi)) return { type: 'seershodaya', label: 'Seershodaya (Front-rising)', verdict: 'good' }
  if (PRISHTODAYA_SIGNS.has(rashi)) return { type: 'prishtodaya', label: 'Prishtodaya (Back-rising)', verdict: 'bad' }
  return { type: 'ubhayodaya', label: 'Ubhayodaya (Both-rising — Pisces)', verdict: 'mixed' }
}

/**
 * Oordhwamukha / Adhomukha / Thiryangmukha [Ch3, St15-16]
 * Adhomukha = Sun's sign & quadrants from it → bad (facing down)
 * Oordhwamukha = Previous sign of Sun & quadrants → good (facing up)
 * Thiryangmukha = Next sign of Sun & quadrants → neutral/sideways
 */
export function getMukhaType(lagnaRashi: number, sunRashi: number): { type: 'oordhwamukha' | 'adhomukha' | 'thiryangmukha'; label: string; verdict: 'good' | 'bad' | 'neutral' } {
  function getQuadrantSet(base: number): Set<number> {
    const s = new Set<number>()
    for (let i = 0; i < 4; i++) s.add(((base - 1 + i * 3) % 12) + 1)
    return s
  }
  const prevSun = ((sunRashi - 2 + 12) % 12) + 1
  const nextSun = (sunRashi % 12) + 1

  if (getQuadrantSet(sunRashi).has(lagnaRashi))
    return { type: 'adhomukha', label: "Adhomukha (Sun's sign \u2014 facing down)", verdict: 'bad' }
  if (getQuadrantSet(prevSun).has(lagnaRashi))
    return { type: 'oordhwamukha', label: 'Oordhwamukha (Sign left by Sun \u2014 facing up)', verdict: 'good' }
  if (getQuadrantSet(nextSun).has(lagnaRashi))
    return { type: 'thiryangmukha', label: 'Thiryangmukha (Sign Sun will enter \u2014 sideways)', verdict: 'neutral' }
  return { type: 'thiryangmukha', label: 'Thiryangmukha', verdict: 'neutral' }
}

/** Aroodha-Udaya relationship [Ch11, St21] */
export function getAroodhaUdayaRelation(aroodha: number, udaya: number): { relationship: string; result: 'good' | 'bad'; description: string } {
  if (aroodha === udaya) return { relationship: '1-1 (Same sign)', result: 'good', description: 'Aroodha and Udaya are same sign → Very favorable' }
  const diff = ((udaya - aroodha + 12) % 12) + 1
  const pairs: Record<number, { rel: string; result: 'good' | 'bad'; desc: string }> = {
    1:  { rel: '1-1',   result: 'good', desc: 'Same sign → Excellent' },
    2:  { rel: '2-12',  result: 'bad',  desc: 'Udaya is 2nd from Aroodha → Not favorable (loss energy)' },
    3:  { rel: '3-11',  result: 'good', desc: 'Udaya is 3rd from Aroodha → Good (effort + gains)' },
    4:  { rel: '4-10',  result: 'good', desc: 'Udaya is 4th from Aroodha → Good (quadrant strength)' },
    5:  { rel: '5-9',   result: 'good', desc: 'Udaya is 5th from Aroodha → Good (trine — fortune)' },
    6:  { rel: '6-8',   result: 'bad',  desc: 'Udaya is 6th from Aroodha → Unfavorable (disease/obstacle)' },
    7:  { rel: '7-7',   result: 'good', desc: 'Samasaptama (7th-7th) → Favorable (fulfillment through effort)' },
    8:  { rel: '6-8',   result: 'bad',  desc: 'Udaya is 8th from Aroodha → Unfavorable (hidden obstacles)' },
    9:  { rel: '5-9',   result: 'good', desc: 'Udaya is 9th from Aroodha → Good (trine — fortune)' },
    10: { rel: '4-10',  result: 'good', desc: 'Udaya is 10th from Aroodha → Good (quadrant)' },
    11: { rel: '3-11',  result: 'good', desc: 'Udaya is 11th from Aroodha → Good (gains)' },
    12: { rel: '2-12',  result: 'bad',  desc: 'Udaya is 12th from Aroodha → Unfavorable (loss)' },
  }
  const p = pairs[diff]
  return { relationship: p.rel, result: p.result, description: p.desc }
}

/** Veedhi Rasi based on Sun's position [Ch11, St32] */
export function getVeedhiRasi(sunRashi: number): number {
  if ([2, 3, 4, 5].includes(sunRashi)) return 1   // Aries
  if ([8, 9, 10, 11].includes(sunRashi)) return 3  // Gemini
  return 2  // Taurus (for 6,7,12,1)
}

/** Chathra Rasi (Umbrella Sign) [Ch11, St21 + Ch18, St3] */
export function getChhatraRasi(aroodha: number, udaya: number, sunRashi: number): number {
  const veedhi = getVeedhiRasi(sunRashi)
  const n = ((udaya - aroodha + 12) % 12)
  return ((veedhi - 1 + n) % 12) + 1
}

/** Krishneeyam Drekkana Lord [Ch1, St6-7] */
export function getDrekkanaLord(rashi: number, degreeInSign: number): GrahaId {
  const drekkana = degreeInSign < 10 ? 1 : degreeInSign < 20 ? 2 : 3
  if ([1, 5, 9].includes(rashi))  return drekkana === 1 ? 'Ma' : drekkana === 2 ? 'Su' : 'Ju'
  if ([2, 6, 10].includes(rashi)) return drekkana === 1 ? 'Ve' : drekkana === 2 ? 'Me' : 'Sa'
  if ([3, 7, 11].includes(rashi)) return drekkana === 1 ? 'Me' : drekkana === 2 ? 'Ve' : 'Sa'
  return drekkana === 1 ? 'Mo' : drekkana === 2 ? 'Ma' : 'Ju'
}

/** Ketu sign lord: 4th sign forward from Sun [Ch21, St2] */
export function getKetuSignLord(sunRashi: number): number {
  return ((sunRashi - 1 + 3) % 12) + 1
}

/** Rahu sign lord: 4th sign backward from Sun [Ch21, St2] */
export function getRahuSignLord(sunRashi: number): number {
  return ((sunRashi - 1 - 3 + 12) % 12) + 1
}

/** Get Trimsamsha lord [Ch7, St2] */
export function getTrimsamshaLord(rashi: number, degreeInSign: number): GrahaId {
  const table = MALE_SIGNS.has(rashi) ? TRIMSHAMSHA_ODD : TRIMSHAMSHA_EVEN
  for (const entry of table) {
    if (degreeInSign <= entry.upto) return entry.lord
  }
  return 'Sa'
}

/** Calculate Rashmi score for a planet in a chart [Ch31] */
export function calculateRashmis(grahas: GrahaData[], lagnaRashi: number): { score: number; summary: string } {
  let totalRashmis = 0
  const parts: string[] = []

  for (const g of grahas) {
    if (['Ur', 'Ne', 'Pl'].includes(g.id)) continue
    let base = PLANET_RASHMIS[g.id] ?? 25
    const house = getPlanetHouse(g.rashi, lagnaRashi)

    // Dignity multipliers [Ch31, St3]
    if (['exalted', 'moolatrikona'].includes(g.dignity)) base *= 4
    else if (g.isRetro) base *= 4
    else if (g.dignity === 'own') base *= 2
    else if ([1, 5, 9].includes(house)) base *= 3  // Trines triple

    // House reduction for malefics [Ch31, St4]
    if (MALEFICS.has(g.id)) {
      if (house === 7) base *= (1 - 1/6)
      else if (house === 8) base *= (1 - 1/5)
      else if (house === 9) base *= (1 - 1/4)
      else if (house === 3) base *= (1 - 1/3)
      else if (house === 11) base *= (1 - 1/2)
      else if (house === 12) base = 0
    } else {
      // Benefics: half rate of reduction
      if (house === 7) base *= (1 - 1/12)
      else if (house === 8) base *= (1 - 1/10)
      else if (house === 9) base *= (1 - 1/9)
      else if (house === 11) base *= (1 - 1/4)
      else if (house === 12) base *= (1 - 1/2)
    }

    // Add sign rashmis
    base += SIGN_RASHMIS[g.rashi] ?? 100

    totalRashmis += Math.round(base)
    parts.push(`${g.name}: ${Math.round(base)} rays`)
  }

  return {
    score: totalRashmis,
    summary: parts.join(', ')
  }
}

/** House number of a planet from ascendant */
function getPlanetHouse(planetRashi: number, lagnaRashi: number): number {
  return ((planetRashi - lagnaRashi + 12) % 12) + 1
}

/** Check if a planet aspects a sign */
function hasAspect(planet: GrahaData, targetSign: number): boolean {
  const fromHouse = getPlanetHouse(planet.rashi, targetSign)
  const aspects7 = fromHouse === 7
  const marsFull = planet.id === 'Ma' && (fromHouse === 4 || fromHouse === 8)
  const jupFull  = planet.id === 'Ju' && (fromHouse === 5 || fromHouse === 9)
  const satFull  = planet.id === 'Sa' && (fromHouse === 3 || fromHouse === 10)
  return aspects7 || marsFull || jupFull || satFull
}

/** Get significator planet for a query category */
function getSignificatorForCategory(cat: PrashnaCategory, grahas: GrahaData[], lagnaRashi: number): GrahaId {
  const houseNum = CATEGORY_HOUSE[cat]
  const targetSign = ((lagnaRashi + houseNum - 2) % 12) + 1 as Rashi
  const houseLord = SIGN_LORDS[targetSign]
  const inHouse = grahas.find(g => g.rashi === targetSign && !['Ur','Ne','Pl'].includes(g.id))
  if (inHouse) return inHouse.id
  return houseLord
}

/** Is a planet benefic per Krishneeyam */
function isBenefic(id: GrahaId, isCombust = false, dignity = 'neutral'): boolean {
  if (id === 'Mo') return !isCombust && !['debilitated', 'enemy', 'great_enemy'].includes(dignity)
  if (id === 'Me') return !MALEFICS.has(id)
  return BENEFICS.has(id)
}

/** Returns planet strength description */
function getPlanetStrength(g: GrahaData): string {
  if (['exalted', 'moolatrikona', 'own'].includes(g.dignity)) return 'Strong'
  if (['great_friend', 'friend'].includes(g.dignity)) return 'Moderately Strong'
  if (['debilitated', 'great_enemy'].includes(g.dignity)) return 'Weak'
  if (g.isCombust) return 'Combust (Very Weak)'
  return 'Neutral'
}

/**
 * Ch12: Vishwasa Jananam — Analyse planet pair combinations in ascendant
 * to reveal facts about the querist (trust-building)
 */
export function analyzeQueristFeatures(grahas: GrahaData[], lagnaRashi: number, aroodha: number): string[] {
  const features: string[] = []
  const inAsc = grahas.filter(g => g.rashi === lagnaRashi && !['Ur','Ne','Pl'].includes(g.id)).map(g => g.id)
  const inAscOrDiv = inAsc // simplified: just ascendant occupants

  for (const entry of QUERIST_PLANET_PAIRS) {
    const [p1, p2] = entry.pair
    if (inAscOrDiv.includes(p1) && inAscOrDiv.includes(p2)) {
      features.push(entry.fact)
    }
  }

  // Weak Moon + Mars [Ch12:2]
  const moon = grahas.find(g => g.id === 'Mo')
  const mars = grahas.find(g => g.id === 'Ma')
  if (moon && mars && moon.rashi === lagnaRashi && mars.rashi === lagnaRashi) {
    if (['debilitated', 'enemy'].includes(moon.dignity)) {
      features.push("Querist's mother is deceased (weak Moon + Mars in ascendant) [Ch12:2]")
    }
  }

  // Exalted planet in Aroodha [Ch12:4]
  const exaltedInAroodha = grahas.find(g => g.rashi === aroodha && g.dignity === 'exalted')
  if (exaltedInAroodha) {
    features.push(`Exalted ${exaltedInAroodha.name} in Aroodha → Querist possesses all significations of ${exaltedInAroodha.name} [Ch12:4]`)
  }
  const debilitatedInAroodha = grahas.find(g => g.rashi === aroodha && g.dignity === 'debilitated')
  if (debilitatedInAroodha) {
    features.push(`Debilitated ${debilitatedInAroodha.name} in Aroodha → Querist has LOST all significations of ${debilitatedInAroodha.name} [Ch12:4]`)
  }

  // Benefic in quadrant from Aroodha — desire fulfilled [Ch12:4]
  const beneficInAroodhaKendra = grahas.find(g =>
    isBenefic(g.id, g.isCombust) && [1, 4, 7, 10].includes(getPlanetHouseFromRashi(g.rashi, aroodha))
  )
  if (beneficInAroodhaKendra) {
    features.push(`Benefic ${beneficInAroodhaKendra.name} in quadrant from Aroodha → Desire about its signification WILL be fulfilled [Ch12:4]`)
  }

  // Planet in 6/8/12 from Aroodha — item not achieved [Ch12:4]
  const badFromAroodha = grahas.find(g =>
    [6, 8, 12].includes(getPlanetHouseFromRashi(g.rashi, aroodha)) && !['Ur','Ne','Pl'].includes(g.id)
  )
  if (badFromAroodha) {
    features.push(`${badFromAroodha.name} in ${getPlanetHouseFromRashi(badFromAroodha.rashi, aroodha)}th from Aroodha → ${badFromAroodha.name}'s signification will NOT be obtained [Ch12:4]`)
  }

  return features
}

function getPlanetHouseFromRashi(planetRashi: number, fromRashi: number): number {
  return ((planetRashi - fromRashi + 12) % 12) + 1
}

/**
 * Ch13: Death symptoms — check for Sarpa/Kolamukha/Grudhramukha Drekkana
 */
export function analyzeDeathSymptoms(grahas: GrahaData[], lagnaRashi: number, lagnaSignDegree: number, moonRashi: number): string {
  const lagnaDrekkana = lagnaSignDegree < 10 ? 1 : lagnaSignDegree < 20 ? 2 : 3
  const maleficsInAsc = grahas.filter(g => MALEFICS.has(g.id) && g.rashi === lagnaRashi)
  const moonIn8th = ((moonRashi - lagnaRashi + 12) % 12) + 1 === 8

  // Check Sarpa Drekkana
  const isSarpa = SARPA_DREKKANAS.some(d => d.rashi === lagnaRashi && d.drekkana === lagnaDrekkana)
  const isKolamukha = KOLAMUKHA_DREKKANAS.some(d => d.rashi === lagnaRashi && d.drekkana === lagnaDrekkana)
  const isGrudhramukha = GRUDHRAMUKHA_DREKKANAS.some(d => d.rashi === lagnaRashi && d.drekkana === lagnaDrekkana)

  if ((isSarpa || isKolamukha || isGrudhramukha) && maleficsInAsc.length > 0 && moonIn8th) {
    const drekkanaType = isSarpa ? 'Sarpa (Serpent)' : isKolamukha ? 'Kolamukha' : 'Grudhramukha (Vulture-face)'
    return `⚠️ CRITICAL: ${drekkanaType} Drekkana + malefic in ascendant + Moon in 8th → Serious danger / death indicated [Ch13:1]`
  }
  if (isSarpa && moonIn8th) return `Sarpa Drekkana ascendant + Moon in 8th → Caution: illness may be severe [Ch13:1]`
  if (isKolamukha) return `Kolamukha Drekkana: Risk from beasts if Saturn+Gulika involved [Ch13:1]`
  if (isGrudhramukha) return `Grudhramukha Drekkana: Risk from birds/high places if Saturn+Gulika involved [Ch13:1]`

  // Prishtodaya + malefics in 1/7/4/10 + Moon in 8th [Ch13:2]
  const prishtodaya = PRISHTODAYA_SIGNS.has(lagnaRashi)
  const maleficsInKendra = grahas.filter(g => MALEFICS.has(g.id) && [1,4,7,10].includes(((g.rashi - lagnaRashi + 12) % 12) + 1))
  if (prishtodaya && maleficsInKendra.length >= 2 && moonIn8th) {
    return `Prishtodaya ascendant + malefics in Kendra + Moon in 8th → Sick native is in danger [Ch13:2]`
  }

  return 'No critical death-indicating Drekkana patterns found'
}

/**
 * Ch1: Get Krishneeyam Drekkana lord (unique system, differs from Parasara) [Ch1:6-7]
 * Drekkana is 10° division of a sign. Lord is based on the group of signs.
 */
export function getKrishneeyamDrekkanaLord(rashi: number, degreeInSign: number): GrahaId {
  const drekkana = degreeInSign < 10 ? 0 : degreeInSign < 20 ? 1 : 2
  const lords = KRISHNEEYAM_DREKKANA_LORDS[rashi]
  return lords ? lords[drekkana] : SIGN_LORDS[rashi]
}

/**
 * Ch1: Body part affected based on Kaalapurusha + malefic planet position [Ch1:10-14]
 */
export function analyzeBodyPartAffected(grahas: GrahaData[], lagnaRashi: number): string[] {
  const affected: string[] = []
  for (const g of grahas) {
    if (!MALEFICS.has(g.id) || ['Ur','Ne','Pl'].includes(g.id)) continue
    const house = getPlanetHouse(g.rashi, lagnaRashi)
    const limb = KAALAPURUSHA_LIMB[g.rashi] // by sign (absolute)
    const houseLimb = KAALAPURUSHA_LIMB[house] // by house
    const planetLimb = PLANET_LIMB[g.id]
    affected.push(`[Ch1:10] ${g.name} in house ${house} (${RASHI_NAMES[g.rashi]}): Kaalapurusha limb = ${limb}; House limb = ${houseLimb}; Planet limb = ${planetLimb}`)
  }
  return affected
}

/**
 * Ch1: Get Drekkana body part from ascendant degree [Ch1:11-12]
 * 1st drekkana → ascendant = Head; 2nd drekkana → ascendant = Neck; 3rd → ascendant = Genitals/Hip
 */
export function getDrekkanaBodyPart(lagnaSignDegree: number): { bodyPart: string; right: string; left: string; seventh: string } {
  if (lagnaSignDegree < 10) {
    return { bodyPart: 'Head', right: 'Right side of head (houses 2-6)', left: 'Left side of head (houses 12-8)', seventh: 'Neck' }
  } else if (lagnaSignDegree < 20) {
    return { bodyPart: 'Neck', right: 'Right trunk (houses 2-6)', left: 'Left trunk (houses 12-8)', seventh: 'Navel/Umbilicus' }
  } else {
    return { bodyPart: 'Genitals/Hip', right: 'Right lower limb (houses 2-6)', left: 'Left lower limb (houses 12-8)', seventh: 'Feet' }
  }
}

/**
 * Ch3: Directional aspect — how thief entered the premises [Ch3:2]
 */
export function analyzeThiefEntry(grahas: GrahaData[], lagnaRashi: number): string {
  const aspectingAsc = grahas.filter(g =>
    !['Ur','Ne','Pl'].includes(g.id) && hasAspect(g, lagnaRashi)
  )
  if (aspectingAsc.length === 0) return 'No planet aspecting ascendant — entry method unclear'
  const entries = aspectingAsc.map(g => `${g.name}: ${ASPECT_DIRECTION_ENTRY[g.id]}`)
  return entries.join(' | ')
}

/**
 * Ch4: Sunapha/Anapha/Dhurudhura Yoga analysis [Ch4:7-9]
 */
export function analyzeMoonYogas(grahas: GrahaData[], moonRashi: number, lagnaRashi: number): {
  yoga: string; name: string; result: string
} {
  const moonH2Sign = ((moonRashi) % 12) + 1  // 2nd from Moon
  const moonH12Sign = ((moonRashi - 2 + 12) % 12) + 1  // 12th from Moon
  const planetsIn2nd = grahas.filter(g => g.rashi === moonH2Sign && !['Mo','Ur','Ne','Pl'].includes(g.id))
  const planetsIn12th = grahas.filter(g => g.rashi === moonH12Sign && !['Mo','Ur','Ne','Pl'].includes(g.id))

  if (planetsIn2nd.length > 0 && planetsIn12th.length > 0) {
    // Dhurudhura Yoga
    const mal2nd = planetsIn2nd.filter(g => MALEFICS.has(g.id))
    const mal12th = planetsIn12th.filter(g => MALEFICS.has(g.id))
    const benAspect = grahas.some(g => isBenefic(g.id, g.isCombust) && hasAspect(g, moonRashi))

    // Check if malefics in 8th form the Dhurudhura [Ch4:8]
    const malIn8th = grahas.filter(g => MALEFICS.has(g.id) && getPlanetHouse(g.rashi, lagnaRashi) === 8)
    if ((mal2nd.length > 0 || mal12th.length > 0) && malIn8th.length > 0 && !benAspect) {
      return { yoga:'dhurudhura', name:'Dhurudhura Yoga (Malefic)', result:'⚠️ Death imminent — malefics cause Dhurudhura with malefic in 8th and no benefic aspect [Ch4:8]' }
    }
    const allBenefic = [...planetsIn2nd,...planetsIn12th].every(g => isBenefic(g.id, g.isCombust))
    return {
      yoga:'dhurudhura',
      name:'Dhurudhura Yoga',
      result: allBenefic ? 'Benefic Dhurudhura — No harm, comfortable existence [Ch4:8]' : 'Mixed Dhurudhura — moderate results'
    }
  }
  if (planetsIn2nd.length > 0) {
    return { yoga:'sunapha', name:'Sunapha Yoga', result:`Planet(s) in 2nd from Moon (${planetsIn2nd.map(g=>g.name).join(',')}) — Sunapha Yoga: wealth, self-earned prosperity [Ch4:7]` }
  }
  if (planetsIn12th.length > 0) {
    return { yoga:'anapha', name:'Anapha Yoga', result:`Planet(s) in 12th from Moon (${planetsIn12th.map(g=>g.name).join(',')}) — Anapha Yoga: comforts from pleasures [Ch4:7]` }
  }
  return { yoga:'kemadruma', name:'Kemadruma Yoga', result:'No planets adjacent to Moon — Kemadruma Yoga: hardship unless cancelled by other factors' }
}

/**
 * Ch5: Proximity to Sun — timing from solar proximity [Ch5:6]
 */
export function analyzeSunProximity(grahas: GrahaData[], sunRashi: number, lagnaRashi: number): { planet: string; proximity: string; timing: string } {
  const proximate = grahas.filter(g =>
    !['Su','Ur','Ne','Pl'].includes(g.id) && [2,3,4].includes(getPlanetHouse(g.rashi, sunRashi))
  )
  const distant = grahas.filter(g =>
    !['Su','Ur','Ne','Pl'].includes(g.id) && [2,3,4].includes(getPlanetHouseFromRashi(g.rashi, sunRashi))
  )
  if (proximate.length > 0) {
    const p = proximate[0]
    return { planet: p.name, proximity: 'Proximate (2nd-4th from Sun)', timing: `Early result — ${p.name} near Sun confers results soon` }
  }
  return { planet: 'General', proximity: 'Distant from Sun', timing: 'Results delayed — significator is distant from Sun' }
}

/**
 * Ch5: Past/Present/Future planet analysis [Ch5:7]
 */
export function analyzePastPresentFuture(grahas: GrahaData[], lagnaRashi: number): {
  past: string[]; present: string[]; future: string[]
} {
  const past: string[] = []
  const present: string[] = []
  const future: string[] = []
  for (const g of grahas) {
    if (['Ur','Ne','Pl'].includes(g.id)) continue
    const house = getPlanetHouse(g.rashi, lagnaRashi)
    const label = `${g.name} (H${house})`
    if (PAST_HOUSES.has(house)) past.push(label)
    else if (FUTURE_HOUSES.has(house)) future.push(label)
    else present.push(label)
  }
  return { past, present, future }
}

/**
 * Ch4: Dry/Wet analysis for water or well query [Ch4:1-3]
 */
export function analyzeDryWet(grahas: GrahaData[], lagnaRashi: number): string {
  const ascLord = grahas.find(g => g.id === SIGN_LORDS[lagnaRashi])
  if (!ascLord) return 'Ascendant lord not found'
  const isWetSign = EXTENDED_WATERY_SIGNS.has(lagnaRashi)
  const isWetPlanet = WET_PLANETS.has(ascLord.id)
  const isDryPlanet = DRY_PLANETS.has(ascLord.id)
  const isDrySign = DRY_SIGNS.has(lagnaRashi)

  if (isDryPlanet && isWetSign) return '[Ch4:3] Dry planet in watery sign → Water available only at DEPTH (dig deep)'
  if (isWetPlanet && isDrySign) return '[Ch4:3] Wet planet in dry sign → Water available NEAR THE SURFACE (shallow)'
  if (isWetPlanet && isWetSign) return '[Ch4:3] Both wet → Abundant water available'
  if (isDryPlanet && isDrySign) return '[Ch4:3] Both dry → Water is scarce or very deep'
  return '[Ch4:3] Mixed dry/wet — moderate water availability'
}

/**
 * Ch2: Time-based strength analysis [Ch2:13-17]
 */
export function analyzeTimeStrength(grahas: GrahaData[], tithiPaksha: string, varaDayNumber: number, lagnaRashi: number): string[] {
  const notes: string[] = []
  const isDaytime = true // simplified — would need actual query time

  // Paksha strength [Ch2:13]
  const benefics = grahas.filter(g => isBenefic(g.id, g.isCombust) && !['Ur','Ne','Pl'].includes(g.id))
  const malefics_list = grahas.filter(g => MALEFICS.has(g.id) && !['Ur','Ne','Pl'].includes(g.id))
  if (tithiPaksha === 'shukla') {
    notes.push(`[Ch2:13] Shukla Paksha → Benefics (${benefics.map(g=>g.name).join(',')}) are strengthened`)
  } else {
    notes.push(`[Ch2:13] Krishna Paksha → Malefics (${malefics_list.map(g=>g.name).join(',')}) are strengthened`)
  }

  // Special day-of-week strength [Ch2:13]
  const dayPlanet: GrahaId[] = ['Su','Mo','Ma','Me','Ju','Ve','Sa']
  const dayLordId = dayPlanet[varaDayNumber % 7]
  notes.push(`[Ch2:13] Day lord: ${dayLordId} — strong on its own day`)

  // Moon paksha strength [Ch2:14]
  const moon = grahas.find(g => g.id === 'Mo')
  if (moon && tithiPaksha === 'shukla') {
    notes.push('[Ch2:14] Full/Bright Moon in Shukla Paksha — Moon at maximum strength')
  }

  // Extra house strength [Ch2:12]
  for (const g of grahas) {
    if (['Ur','Ne','Pl'].includes(g.id)) continue
    const house = getPlanetHouse(g.rashi, lagnaRashi)
    const idealHouse = PLANET_STRONGEST_HOUSE[g.id]
    if (house === idealHouse) {
      notes.push(`[Ch2:12] ${g.name} is in its ideal house (${idealHouse}) → Extra strength`)
    }
  }

  return notes
}

/**
 * Ch1: Analyze querist's Guna from planets in ascendant [Ch1:33]
 */
export function analyzeQueristGuna(grahas: GrahaData[], lagnaRashi: number): string {
  const inAsc = grahas.filter(g => g.rashi === lagnaRashi && !['Ur','Ne','Pl'].includes(g.id))
  if (inAsc.length === 0) {
    const lord = SIGN_LORDS[lagnaRashi]
    return `Ascendant lord ${lord}: ${PLANET_GUNA[lord] ?? 'Mixed'}`
  }
  const gunas = inAsc.map(g => `${g.name}: ${PLANET_GUNA[g.id]}`)
  return gunas.join(' | ')
}

/**
 * Ch9: 9-variety Dhathu-Moola-Jeeva cross analysis
 * Returns detailed material/substance nature of the query subject
 */
export function analyzeDhathuMoolaJeeva(lagnaRashi: number, lagnaSignDegree: number, grahas: GrahaData[], moonRashi: number): { yoni: string; crossResult: string; ornament: string; flower: string } {
  // Determine planet type (Dhathu/Moola/Jeeva)
  const getPlanetType = (id: GrahaId): 'dhathu' | 'moola' | 'jeeva' => {
    if (['Mo', 'Ra', 'Ma'].includes(id)) return 'dhathu'
    if (['Su', 'Ve'].includes(id)) return 'moola'
    return 'jeeva' // Ju, Me
  }

  // Determine sign type
  const getSignYoni = (rashi: number): 'dhathu' | 'moola' | 'jeeva' => {
    if (MOVABLE_SIGNS.has(rashi)) return 'dhathu'
    if (FIXED_SIGNS.has(rashi)) return 'moola'
    return 'jeeva'
  }

  // From Moon's Navamsa [Ch9, St7]
  const moonInMaleSgn = MALE_SIGNS.has(moonRashi)
  const moonNavamsaType = getSignYoni(moonRashi)
  let moonYoni = ''
  if (moonInMaleSgn) {
    moonYoni = moonNavamsaType === 'dhathu' ? 'Dhathu (Metal)' : moonNavamsaType === 'moola' ? 'Moola (Plant)' : 'Jeeva (Creature)'
  } else {
    moonYoni = moonNavamsaType === 'dhathu' ? 'Jeeva (Creature)' : moonNavamsaType === 'moola' ? 'Moola (Plant)' : 'Dhathu (Metal)'
  }

  // Find strongest planet in kendra/trikona
  const strongPlanetInKT = grahas.filter(g =>
    !['Ur','Ne','Pl'].includes(g.id) && [1,4,5,7,9,10].includes(getPlanetHouse(g.rashi, lagnaRashi))
  ).sort((a, b) => {
    const scoreA = a.dignity === 'exalted' ? 4 : a.dignity === 'own' ? 3 : a.dignity === 'moolatrikona' ? 3 : 1
    const scoreB = b.dignity === 'exalted' ? 4 : b.dignity === 'own' ? 3 : b.dignity === 'moolatrikona' ? 3 : 1
    return scoreB - scoreA
  })[0]

  const planetType = strongPlanetInKT ? getPlanetType(strongPlanetInKT.id) : getPlanetType(SIGN_LORDS[lagnaRashi])
  const signType = getSignYoni(lagnaRashi)
  const crossKey = `${planetType}-${signType}`
  const crossResult = DHATHU_MOOLA_JEEVA_CROSS[crossKey] ?? 'Mixed nature — consult sign and planet together'

  // Yoni from strongest planet/sign
  const yoni = moonYoni || (planetType === 'dhathu' ? 'Dhathu (Metal)' : planetType === 'moola' ? 'Moola (Plant)' : 'Jeeva (Creature)')

  // Ornament from strongest planet
  const ornament = strongPlanetInKT ? PLANET_ORNAMENTS[strongPlanetInKT.id] : PLANET_ORNAMENTS[SIGN_LORDS[lagnaRashi]]

  // Flower from ascendant lord
  const flower = PLANET_FLOWERS[SIGN_LORDS[lagnaRashi]]

  return { yoni, crossResult, ornament: ornament ?? 'Mixed ornament', flower: flower ?? 'Mixed flowers' }
}

/**
 * Ch8: Planet-in-quarter-of-4th-house analysis
 */
export function analyzeHouseQuarterEffects(grahas: GrahaData[], lagnaRashi: number): string[] {
  const effects: string[] = []
  const h4Sign = ((lagnaRashi + 2) % 12) + 1
  const planetsIn4th = grahas.filter(g => g.rashi === h4Sign && !['Ur','Ne','Pl'].includes(g.id))

  for (const p of planetsIn4th) {
    const quarters = PLANET_HOUSE4_QUARTERS[p.id]
    if (quarters && quarters.length > 0) {
      // Use degree in sign to determine quarter (each quarter = 7.5 degrees)
      const quarterIdx = Math.min(Math.floor(p.degree / 7.5), quarters.length - 1)
      effects.push(`[Ch8:9-10] ${p.name} in 4th house (quarter ${quarterIdx+1}) → ${quarters[quarterIdx]}`)
    }
  }
  return effects
}


/** Get lost article nature from ascendant sign for Aries/Leo/Scorpio etc. [Ch28-29] */
function getLostArticleBySign(lagnaRashi: number, planetsInAsc: GrahaData[]): string {
  if (planetsInAsc.length === 0) {
    // Default by sign [Ch29]
    const defaults: Record<number, string> = {
      1: 'Gold or silver ornament (Aries default)',
      2: 'Gold jewellery or money (Taurus default)',
      3: 'Iron tool or mixed metals (Gemini default)',
      4: 'Gold (Cancer default)', // Ch29.16
      5: 'Gold (Leo — 1st/2nd Drekkana) or Blanket (3rd Drekkana)',
      6: 'Mixed gems or articles (Virgo)',
      7: 'Cloth or ornaments (Libra)',
      8: 'Mixed — same as Aries rules (Scorpio)',
      9: 'Gold sculpture, cattle, gems or pearls (Sagittarius)',
      10: 'Ornaments, beddings, brass/iron/bell-metal vessels (Capricorn)',
      11: 'Mixed — same as Capricorn (Aquarius)',
      12: 'Mixed — same as Sagittarius (Pisces)',
    }
    return defaults[lagnaRashi] ?? 'Article nature determined by sign'
  }
  // With planet in ascendant [Ch29]
  const p = planetsInAsc[0]
  const byPlanetAndSign: Partial<Record<GrahaId, Record<number, string>>> = {
    Su: { 4:'Gold', 5:'Gold', 9:'Golden weapon', 10:'Gold or cattle', 1:'Copper' },
    Mo: { 4:'Gold (if Moon/Me aspect: gems)', 5:'Gold', 9:'Gold/sculpture', 1:'Silver/crystal' },
    Ma: { 4:'Iron tools', 5:'Copper', 1:'Copper', 9:'Armour/ivory/leopard skin/gold' },
    Me: { 4:'Gems/pearls', 5:'Gems (pure)', 9:'Sculptures and pearls' },
    Ju: { 4:'Gold', 5:'Silver', 9:'Gold sculpture' },
    Ve: { 4:'Blankets/shawls', 5:'Lead vessels', 9:'Gold sculpture' },
    Sa: { 4:'Iron tools', 5:'Iron vessels', 10:'Ornaments, beddings, brass/iron' },
    Ra: { 9:'Elderly lady or maid servant' },
  }
  const signMap = byPlanetAndSign[p.id]
  if (signMap?.[lagnaRashi]) return signMap[lagnaRashi]
  return `${p.name} in ascendant: ${PLANET_MATERIAL[p.id]} (based on planet's natural materials)`
}

/** Analyze Anabha Yoga [Ch24, St1] */
function analyzeAnabhaYoga(grahas: GrahaData[], moonRashi: number, lagnaRashi: number): string | null {
  // Anabha yoga: planet in 12th from Moon
  const h12FromMoon = ((moonRashi - 2 + 12) % 12) + 1
  const planetIn12thMoon = grahas.find(g => g.rashi === h12FromMoon && !['Ur','Ne','Pl'].includes(g.id))
  if (!planetIn12thMoon) return null

  if (isBenefic(planetIn12thMoon.id)) {
    return `Anabha Yoga: ${planetIn12thMoon.name} in 12th from Moon → Moon confers flowers, ladies, perfumes, eatables, beautiful things [Ch24:1]`
  } else {
    return `Anabha Yoga: Malefic ${planetIn12thMoon.name} in 12th from Moon → Contrary results; obstacles from that direction [Ch24:1]`
  }
}

// ─── Main Engine ──────────────────────────────────────────────────────────────

export function runKrishneeyamPrashna(input: KrishneeyamInput): KrishneeyamResult {
  const {
    lagnaRashi, lagnaDegreeFull, lagnaSignDegree,
    sunRashi, sunDegreeFull, moonRashi, moonDegreeFull,
    moonDignity, moonIsRetro, moonIsCombust,
    grahas, tithiNumber, tithiPaksha, varaDayNumber, nakshatraIndex,
    aroodhaRashi: aroodhaInput, category, bodyTouchPart
  } = input

  const aroodha = aroodhaInput ?? lagnaRashi
  const rules: string[] = []
  const details: string[] = []
  const remedies: string[] = []
  const trimsamshaTopics: string[] = []
  let positive = 0, negative = 0, total = 0
  const scorecard: KrishneeyamResult['scorecard'] = []

  // ── 1. Ascendant Type Analysis [Ch1, St17-18] ─────────────────────────────
  const odayaInfo = getOdayaType(lagnaRashi)
  total++
  if (odayaInfo.verdict === 'good') positive++
  else if (odayaInfo.verdict === 'bad') negative++
  scorecard.push({ label: 'Ascendant Type', result: odayaInfo.verdict === 'good' ? 'good' : odayaInfo.verdict === 'bad' ? 'bad' : 'neutral', detail: `${odayaInfo.label} — ${RASHI_NAMES[lagnaRashi]}`, weight: 1 })

  const planetsInAsc = grahas.filter(g => g.rashi === lagnaRashi && !['Ur','Ne','Pl'].includes(g.id))
  let planetInAscendantEffect = ''
  if (planetsInAsc.length > 0) {
    const ascPlanet = planetsInAsc[0]
    const isBen = isBenefic(ascPlanet.id, ascPlanet.isCombust)
    planetInAscendantEffect = `${ascPlanet.name} in ascendant → ${isBen ? 'Beneficial (overrides sign-type result)' : 'Malefic in ascendant — creates obstacle'}`
    if (isBen) { positive++; total++ } else { negative++; total++ }
    scorecard.push({ label: 'Planet in Ascendant', result: isBen ? 'good' : 'bad', detail: `${ascPlanet.name} — ${isBen ? 'benefic, favorable override' : 'malefic, creates obstacle'}`, weight: 1 })
    rules.push(`[Ch1:18] ${ascPlanet.name} in ascendant (${isBen ? 'benefic' : 'malefic'}) overrides sign-type result`)
    // Special: Ketu in ascendant [Ch21, St3]
    if (ascPlanet.id === 'Ke') {
      const ketuSign = getKetuSignLord(sunRashi)
      details.push(`[Ch21:2] Ketu's dynamic sign lord: ${RASHI_NAMES[ketuSign]}. Ketu in ascendant — check associations for specific outcomes.`)
    }
    // Ch22: Rahu in ascendant — detailed results
    if (ascPlanet.id === 'Ra') {
      const rahuBenAspects = grahas.filter(g => isBenefic(g.id, g.isCombust) && hasAspect(g, lagnaRashi))
      const rahuMalAspects = grahas.filter(g => !isBenefic(g.id, g.isCombust) && hasAspect(g, lagnaRashi) && !['Ur','Ne','Pl'].includes(g.id))
      details.push(`[Ch22] Rahu in ascendant: causes hidden enemies, foreign matters, and complex situations. Results delayed by 6-18 months.`)
      if (rahuBenAspects.length > 0) details.push(`[Ch22] Benefics (${rahuBenAspects.map(g=>g.name).join(', ')}) aspect Rahu → hidden helpers; unexpected resolution possible.`)
      if (rahuMalAspects.length > 0) details.push(`[Ch22] Malefics (${rahuMalAspects.map(g=>g.name).join(', ')}) aspect Rahu in ascendant → betrayal or deception by close associate.`)
    }
  } else {
    planetInAscendantEffect = `No planet in ascendant — sign type determines result`
  }
  rules.push(`[Ch1:17-18] Ascendant ${RASHI_NAMES[lagnaRashi]} is ${odayaInfo.label} → ${odayaInfo.verdict.toUpperCase()}`)

  // ── 2. Mukha Type [Ch3, St15-16] ─────────────────────────────────────────
  const mukhaInfo = getMukhaType(lagnaRashi, sunRashi)
  total++
  if (mukhaInfo.verdict === 'good') positive++
  else if (mukhaInfo.verdict === 'bad') negative++
  scorecard.push({ label: 'Sign Mukha (Face)', result: mukhaInfo.verdict === 'good' ? 'good' : mukhaInfo.verdict === 'bad' ? 'bad' : 'neutral', detail: mukhaInfo.label, weight: 1 })
  rules.push(`[Ch3:15-16] ${mukhaInfo.label} → ${mukhaInfo.verdict.toUpperCase()}`)

  // ── 3. Aroodha-Udaya Relationship [Ch11, St21] ───────────────────────────
  const aroodhaRel = getAroodhaUdayaRelation(aroodha, lagnaRashi)
  total++
  if (aroodhaRel.result === 'good') positive++
  else negative++
  scorecard.push({ label: 'Aroodha–Udaya', result: aroodhaRel.result === 'good' ? 'good' : 'bad', detail: `${RASHI_NAMES[aroodha]} & ${RASHI_NAMES[lagnaRashi]} — ${aroodhaRel.relationship}`, weight: 1 })
  rules.push(`[Ch11:21] Aroodha(${RASHI_NAMES[aroodha]})-Udaya(${RASHI_NAMES[lagnaRashi]}) = ${aroodhaRel.relationship} → ${aroodhaRel.result.toUpperCase()}`)
  details.push(aroodhaRel.description)

  // ── 4. Chathra Rasi [Ch11, St21] ─────────────────────────────────────────
  const chhatraRashi = getChhatraRasi(aroodha, lagnaRashi, sunRashi) as Rashi
  const veedhiRasi = getVeedhiRasi(sunRashi)
  const chhatraHouseFromLagna = getPlanetHouse(chhatraRashi, lagnaRashi)
  const chhatraIsObstacle = [6, 8, 12].includes(chhatraHouseFromLagna)
  if (chhatraIsObstacle) {
    negative++; total++
    scorecard.push({ label: 'Chathra Rasi', result: 'bad', detail: `${RASHI_NAMES[chhatraRashi]} in H${chhatraHouseFromLagna} — obstacle (6/8/12)`, weight: 1 })
    rules.push(`[Ch11:21] Chathra Rasi (${RASHI_NAMES[chhatraRashi]}) in house ${chhatraHouseFromLagna} (6/8/12) → Obstacle`)
    details.push(`Veedhi Rasi: ${RASHI_NAMES[veedhiRasi]}. Chathra Rasi ${RASHI_NAMES[chhatraRashi]} (house ${chhatraHouseFromLagna}) creates an obstacle.`)
  } else {
    positive++; total++
    scorecard.push({ label: 'Chathra Rasi', result: 'good', detail: `${RASHI_NAMES[chhatraRashi]} in H${chhatraHouseFromLagna} — favorable`, weight: 1 })
    rules.push(`[Ch11:21] Chathra Rasi (${RASHI_NAMES[chhatraRashi]}) in house ${chhatraHouseFromLagna} → Favorable`)
    details.push(`Veedhi Rasi: ${RASHI_NAMES[veedhiRasi]}. Chathra Rasi ${RASHI_NAMES[chhatraRashi]} is favorable.`)
  }

  // ── 5. Trimsamsha Analysis [Ch7, St3-4] ──────────────────────────────────
  const trimsamshaLord = getTrimsamshaLord(lagnaRashi, lagnaSignDegree)
  const trimsamshaTheme = TRIMSHAMSHA_TOPIC[trimsamshaLord] ?? 'General matters'
  trimsamshaTopics.push(`Trimsamsha lord: ${trimsamshaLord} → ${trimsamshaTheme} [Ch7:3-4]`)

  // Check if benefics aspect ascendant from their Trimsamsha [Ch7, St3]
  const ascAspectors = grahas.filter(g => hasAspect(g, lagnaRashi) && !['Ur','Ne','Pl'].includes(g.id))
  for (const asp of ascAspectors) {
    const aspTrimsLord = getTrimsamshaLord(asp.rashi, lagnaSignDegree)
    if (aspTrimsLord === asp.id) {
      const topic = TRIMSHAMSHA_TOPIC[asp.id] ?? 'General'
      trimsamshaTopics.push(`[Ch7:4] ${asp.name} aspects from own Trimsamsha → Query is ${topic}`)
    }
  }
  rules.push(`[Ch7:3] Ascendant Trimsamsha lord: ${trimsamshaLord} → ${trimsamshaTheme}`)

  // ── 6. Moon Analysis ──────────────────────────────────────────────────────
  const moonGood = !moonIsCombust && !['debilitated', 'enemy', 'great_enemy'].includes(moonDignity)
  const moonHouse = getPlanetHouse(moonRashi, lagnaRashi)
  total++
  if (moonGood) {
    positive++
    scorecard.push({ label: 'Moon Strength', result: 'good', detail: `${RASHI_NAMES[moonRashi]} H${moonHouse}, ${moonDignity} — strong`, weight: 1 })
    rules.push(`[Ch2-General] Moon in ${RASHI_NAMES[moonRashi]} (house ${moonHouse}), dignity: ${moonDignity} → Strong Moon favors query`)
  } else {
    negative++
    scorecard.push({ label: 'Moon Strength', result: 'bad', detail: `${RASHI_NAMES[moonRashi]}, ${moonIsCombust ? 'combust' : moonDignity} — afflicted`, weight: 1 })
    rules.push(`[Ch2-General] Moon is ${moonIsCombust ? 'combust' : moonDignity} → Weak Moon reduces chances`)
    details.push(`Moon is afflicted. Mental clarity and query prospects are diminished.`)
    remedies.push('Worship Chandra (Moon) — offer milk and white flowers on Monday night')
  }

  // Moon in kendras [Ch7, St6]
  if ([1, 4, 7, 10].includes(moonHouse)) {
    const kendraMeanings: Record<number, string> = { 1: 'idiot (if weak)', 4: 'deaf (if weak)', 7: 'hump-backed (if weak)', 10: 'dwarf (if weak)' }
    if (!moonGood) {
      details.push(`[Ch7:6] Weak Moon in ${moonHouse}th house → ${kendraMeanings[moonHouse] ?? 'affliction'}`)
    }
  }

  if (moonIsRetro) {
    details.push('Retrograde Moon: Querent may change their mind, situation will recur or repeat.')
  }

  // ── 7. Anabha Yoga [Ch24, St1] ───────────────────────────────────────────
  const anabhaResult = analyzeAnabhaYoga(grahas, moonRashi, lagnaRashi)
  if (anabhaResult) {
    details.push(anabhaResult)
    const anabhaGood = anabhaResult.includes('confers')
    if (anabhaGood) { positive++; total++ } else { total++ }
  }

  // ── 8. Paksha (Lunar Phase) [Ch2, St13-14] ────────────────────────────────
  const isWaxing = tithiPaksha === 'shukla'
  if (isWaxing) {
    positive++
    rules.push(`[Ch2:13-14] Shukla Paksha (Waxing, Tithi ${tithiNumber}) → Benefic planets strengthened; favorable`)
  } else {
    negative++
    rules.push(`[Ch2:13-14] Krishna Paksha (Waning, Tithi ${tithiNumber}) → Malefic planets strengthened; energy receding`)
    details.push('Waning phase: Better to wait for Shukla Paksha for new ventures.')
  }
  total++

  // ── 9. Jupiter Analysis ───────────────────────────────────────────────────
  const jupiter = grahas.find(g => g.id === 'Ju')
  if (jupiter) {
    const jupHouse = getPlanetHouse(jupiter.rashi, lagnaRashi)
    const jupInKendra = [1, 4, 7, 10].includes(jupHouse)
    const jupInTrikona = [1, 5, 9].includes(jupHouse)
    if (jupInKendra || jupInTrikona) {
      positive++; total++
      rules.push(`[Ch7:15] Jupiter in ${jupInKendra ? 'Kendra' : 'Trikona'} (${RASHI_NAMES[jupiter.rashi]}) → Protects and promotes query`)
      details.push(`Jupiter in house ${jupHouse} bestows wisdom, grace, and fulfillment.`)
    }
    // Benefic in 9th [Ch7, St11]
    if (jupHouse === 9 && isBenefic('Ju', jupiter.isCombust)) {
      positive += 2; total += 2
      rules.push(`[Ch7:11] Strong benefic Jupiter in 9th house → Querist gets ALL desired objects`)
    }
  }

  // ── 10. Saturn Analysis ──────────────────────────────────────────────────
  const saturn = grahas.find(g => g.id === 'Sa')
  if (saturn) {
    const satHouse = getPlanetHouse(saturn.rashi, lagnaRashi)
    if (satHouse === 8) {
      negative++; total++
      rules.push(`[Ch4:9] Saturn in 8th house → Negative (Dhurudhura, obstacles to longevity)`)
      remedies.push('Propitiate Saturn: sesame oil lamps on Saturday; donate black items')
    }
    if ([6, 12].includes(satHouse)) {
      negative++; total++
      rules.push(`[Ch24:5] Saturn in ${satHouse}th house → Confinement, delays, obstacles`)
    }
    // Saturn longevity [Ch7, St15] — do NOT want Mars in 8th
    if (satHouse !== 8) {
      const sun = grahas.find(g => g.id === 'Su')
      if (sun && getPlanetHouse(sun.rashi, lagnaRashi) === 1 && jupInKendraCheck(jupiter, lagnaRashi)) {
        rules.push(`[Ch7:15] Sun in Lagna + strong Jupiter in Kendra + Saturn NOT in 8th → Querist is long-lived`)
      }
    }
  }

  // ── 11. Mars Analysis ────────────────────────────────────────────────────
  const mars = grahas.find(g => g.id === 'Ma')
  if (mars) {
    const marsHouse = getPlanetHouse(mars.rashi, lagnaRashi)
    if (marsHouse === 8) {
      negative++; total++
      rules.push(`[Ch7:15] Mars in 8th house → Fear of harm, obstacles`)
    }
    if (marsHouse === 6 || marsHouse === 12) {
      total++
      rules.push(`[Ch24:5] Mars in ${marsHouse}th house → Blood-related disease or quarrel risk`)
    }
  }

  // ── 12. Rashmi Score [Ch31] ───────────────────────────────────────────────
  const rashmiResult = calculateRashmis(grahas, lagnaRashi)
  const rashmiScore = rashmiResult.score
  // Strong rashmi (>1500) is favorable
  if (rashmiScore > 1500) { positive++; total++ }
  else if (rashmiScore < 800) { negative++; total++ }
  else { total++ }
  const rashmiSummary = `Total Rashmi: ${rashmiScore} (${rashmiScore > 1500 ? 'Strong' : rashmiScore > 1000 ? 'Moderate' : 'Weak'}). ${rashmiResult.summary}`
  rules.push(`[Ch31:3-4] Rashmi (ray) analysis: ${rashmiScore} total rays → ${rashmiScore > 1500 ? 'Strong chart' : 'Moderate/Weak chart'}`)

  // ── 13. Querist Features (Vishwasa Jananam) [Ch12] ───────────────────────
  const queristFeatures = analyzeQueristFeatures(grahas, lagnaRashi, aroodha)
  if (queristFeatures.length > 0) {
    details.push(`[Ch12] Features of Querist: ${queristFeatures.join(' | ')}`)
  }

  // ── 14. Ch8: Planet-in-quarter effects ────────────────────────────────────
  const quarterEffects = analyzeHouseQuarterEffects(grahas, lagnaRashi)
  for (const qe of quarterEffects) {
    details.push(qe)
    rules.push(qe)
  }

  // ── NEW: Ch1 — Drekkana Analysis (Krishneeyam system) ────────────────────
  const drekkanaLordId = getKrishneeyamDrekkanaLord(lagnaRashi, lagnaSignDegree)
  const drekkanaParts = getDrekkanaBodyPart(lagnaSignDegree)
  const drekkanaAnalysis = {
    lord: `${drekkanaLordId} [Krishneeyam Ch1:6-7] — Different from Parasara system`,
    bodyPart: drekkanaParts.bodyPart,
    rightSide: drekkanaParts.right,
    leftSide: drekkanaParts.left,
    seventhSign: drekkanaParts.seventh,
  }
  rules.push(`[Ch1:6-7] Krishneeyam Drekkana lord of ascendant: ${drekkanaLordId} (not Parasara system)`)
  rules.push(`[Ch1:11-12] Ascendant in ${lagnaSignDegree.toFixed(1)}° → Body part: ${drekkanaParts.bodyPart}`)

  // ── NEW: Ch3 — Thief entry direction ──────────────────────────────────────
  const thiefEntry = analyzeThiefEntry(grahas, lagnaRashi)
  details.push(`[Ch3:2] Thief entry direction: ${thiefEntry}`)

  // ── NEW: Ch1 — Planet physical features (dominant planet in ascendant) ─────
  const ascPlanetsForFeature = grahas.filter(g => g.rashi === lagnaRashi && !['Ur','Ne','Pl'].includes(g.id))
  const featurePlanet = ascPlanetsForFeature[0] ?? grahas.find(g => g.id === SIGN_LORDS[lagnaRashi])
  const planetPhysicalFeatures = featurePlanet ? PLANET_PHYSICAL_FEATURES[featurePlanet.id] ?? 'Mixed features' : 'Mixed features'
  details.push(`[Ch1:22-29] Physical features (from ${featurePlanet?.name ?? 'Asc Lord'}): ${planetPhysicalFeatures}`)

  // ── NEW: Ch1 — Querist's Guna ──────────────────────────────────────────────
  const queristGuna = analyzeQueristGuna(grahas, lagnaRashi)
  details.push(`[Ch1:33] Querist's Guna: ${queristGuna}`)

  // ── NEW: Ch4 — Moon Yoga (Sunapha/Anapha/Dhurudhura) ─────────────────────
  const moonYogaResult = analyzeMoonYogas(grahas, moonRashi, lagnaRashi)
  details.push(`[Ch4:7-9] Moon Yoga: ${moonYogaResult.name} — ${moonYogaResult.result}`)
  if (moonYogaResult.yoga === 'dhurudhura' && moonYogaResult.result.includes('⚠️')) {
    rules.push(moonYogaResult.result)
    negative++; total++
  }

  // ── NEW: Ch5 — Past/Present/Future ────────────────────────────────────────
  const pastPresentFuture = analyzePastPresentFuture(grahas, lagnaRashi)
  details.push(`[Ch5:7] Past planets (H9-12): ${pastPresentFuture.past.join(', ') || 'none'}`)
  details.push(`[Ch5:7] Present planets (H1-4): ${pastPresentFuture.present.join(', ') || 'none'}`)
  details.push(`[Ch5:7] Future planets (H5-8): ${pastPresentFuture.future.join(', ') || 'none'}`)

  // ── NEW: Ch4 — Dry/Wet for water query ────────────────────────────────────
  const dryWetAnalysis = analyzeDryWet(grahas, lagnaRashi)
  details.push(dryWetAnalysis)

  // ── NEW: Ch2 — Time-based strength ────────────────────────────────────────
  const timeStrengthNotes = analyzeTimeStrength(grahas, tithiPaksha, varaDayNumber, lagnaRashi)

  // ── NEW: Ch3 — Five elements of subject ───────────────────────────────────
  const dominantPlanet = featurePlanet
  const subjectElement = dominantPlanet
    ? `${PLANET_ELEMENT[dominantPlanet.id]} (from ${dominantPlanet.name}) | Sign element: ${SIGN_ELEMENT[lagnaRashi]}`
    : `Sign element: ${SIGN_ELEMENT[lagnaRashi]}`
  details.push(`[Ch3:17] Five element of subject: ${subjectElement}`)

  // ── NEW: Ch1 — Sign height and place ──────────────────────────────────────
  const signHeight = `${SIGN_HEIGHT[lagnaRashi]} sign (${RASHI_NAMES[lagnaRashi]}) [Ch1:19]`
  const signPlace = `${SIGN_PLACE[lagnaRashi]} [Ch5:3]`
  details.push(`[Ch1:19] Sign height: ${signHeight}`)
  details.push(`[Ch5:3] Location of matter: ${signPlace}`)

  // ── NEW: Ch1 — Body parts affected by malefics ────────────────────────────
  const bodyPartsAffected = analyzeBodyPartAffected(grahas, lagnaRashi)
  for (const bp of bodyPartsAffected) {
    details.push(bp)
  }

  // ── 15. Category-Specific Logic ──────────────────────────────────────────
  let subjectNature = ''
  let subjectMaterial = ''
  let subjectMaterialDetail = ''
  let thief: KrishneeyamResult['thief'] | undefined
  let health: KrishneeyamResult['health'] | undefined
  let houseQuery: KrishneeyamResult['houseQuery'] | undefined
  let spirit: KrishneeyamResult['spirit'] | undefined
  let relationship: KrishneeyamResult['relationship'] | undefined
  let food: KrishneeyamResult['food'] | undefined
  let animalQuery: string | undefined

  // ── Always run Ch9 detailed DMJ analysis ─────────────────────────────────
  const dmjAnalysis = analyzeDhathuMoolaJeeva(lagnaRashi, lagnaSignDegree, grahas, moonRashi)
  if (category === 'what' || category === 'lost_article' || category === 'who') {
    subjectMaterialDetail = `Yoni: ${dmjAnalysis.yoni}. Cross-combination: ${dmjAnalysis.crossResult}. Ornament: ${dmjAnalysis.ornament}. Flower: ${dmjAnalysis.flower}`
    details.push(`[Ch9:5-7] 9-variety analysis → ${dmjAnalysis.crossResult}`)
    details.push(`[Ch9:38-41] Ornament: ${dmjAnalysis.ornament}; Flower: ${dmjAnalysis.flower}`)
  }

  // ── Animal query from Chathra sign [Ch11] ────────────────────────────────
  if (category === 'what' || category === 'general') {
    animalQuery = CHATHRA_ANIMAL[chhatraRashi]
    if (animalQuery) {
      details.push(`[Ch11] Chathra sign ${RASHI_NAMES[chhatraRashi]} indicates animal query subject: ${animalQuery}`)
    }
  }

  if (category === 'lost_article') {
    // ── Lost Article Recovery [Ch26, St4 + Ch27, St33-34] ──────────────────
    const ascAspectedByBenefics = grahas.filter(g =>
      isBenefic(g.id, g.isCombust) && hasAspect(g, lagnaRashi)
    )
    const ascAspectedByMalefics = grahas.filter(g =>
      !isBenefic(g.id, g.isCombust) && hasAspect(g, lagnaRashi)
    )

    // [Ch26, St4] Detailed recovery rules
    const ascBeneficSign = !MALEFICS.has(SIGN_LORDS[lagnaRashi])
    if (ascBeneficSign && planetsInAsc.length > 0 && isBenefic(planetsInAsc[0].id, planetsInAsc[0].isCombust) && ascAspectedByBenefics.length > 0) {
      positive += 3; total += 3
      rules.push(`[Ch26:4] Benefic sign + benefic in ascendant + benefic aspect → IMMEDIATE FULL RECOVERY`)
      details.push('Most favorable: Lost property will be regained immediately.')
    } else if (ascAspectedByBenefics.length > 0) {
      positive += 2; total += 2
      rules.push(`[Ch26:4] Benefics (${ascAspectedByBenefics.map(g=>g.name).join(', ')}) aspect ascendant → Property WILL BE RECOVERED`)
    }
    if (ascAspectedByMalefics.length > ascAspectedByBenefics.length) {
      negative += 2; total += 2
      rules.push(`[Ch26:4] Malefics (${ascAspectedByMalefics.map(g=>g.name).join(', ')}) dominate → Property NOT easily recovered`)
    }
    // [Ch26, St4] Malefic sign + benefic occupant + malefic aspect → partly recovered after long time
    if (!ascBeneficSign && planetsInAsc.length > 0 && isBenefic(planetsInAsc[0].id) && ascAspectedByMalefics.length > 0) {
      details.push('[Ch26:4] Malefic sign + benefic occupant + malefic aspect → Property partly recovered after very long time')
    }

    // Location from sign type [Ch27, St1-2]
    const ascType = getSignType(lagnaRashi)
    if (ascType === 'fixed') {
      details.push('[Ch27:1] Fixed sign → Article is STILL IN THE HOUSE; owner or relative may have taken it')
      subjectNature = 'Article is within the premises. Owner or family member involved.'
    } else if (ascType === 'movable') {
      details.push('[Ch27:2] Movable sign → Thief has gone to a DISTANT PLACE')
      subjectNature = 'Article has been taken far away by an outsider.'
    } else {
      details.push('[Ch27:2] Common sign → Thief lives NEARBY or in same area')
      subjectNature = 'Article is nearby — in the neighbourhood or same village.'
    }

    // Thief relation from sign type [Ch29, St32]
    if (ascType === 'movable') details.push('[Ch29:32] Movable sign → Thief is an OUTSIDER')
    else if (ascType === 'fixed') details.push('[Ch29:32] Fixed sign → Thief BELONGS TO THE SAME HOUSE')
    else details.push('[Ch29:32] Common sign → Thief is from the NEIGHBOURHOOD')

    // Position of article from Drekkana [Ch26, St7]
    const drekkana = lagnaSignDegree < 10 ? 1 : lagnaSignDegree < 20 ? 2 : 3
    if (drekkana === 1) details.push('[Ch26:7] 1st Drekkana → Article has left owner\'s house and reached entrance of thief\'s house')
    else if (drekkana === 2) details.push('[Ch26:7] 2nd Drekkana → Article has reached MIDDLE of thief\'s house')
    else details.push('[Ch26:7] 3rd Drekkana → Article has reached BACK of thief\'s house (deeply hidden)')

    // Height from Mukha type [Ch3, St16]
    const mukha = getMukhaType(lagnaRashi, sunRashi)
    if (mukha.type === 'oordhwamukha') details.push('[Ch3:16] Oordhwamukha → Article is in a HIGHER PLACE (upper shelf, hanging)')
    else if (mukha.type === 'adhomukha') details.push('[Ch3:16] Adhomukha → Article is UNDERGROUND or in a pit/buried')
    else details.push('[Ch3:16] Thiryangmukha → Article is at GROUND LEVEL or on the side')

    // Nature of article by sign [Ch9, St1] + detailed by sign [Ch28-29]
    subjectMaterial = getLostArticleBySign(lagnaRashi, planetsInAsc)
    rules.push(`[Ch9:1 + Ch28-29] ${getSignType(lagnaRashi)} sign: ${subjectMaterial}`)

    // Container [Ch25, St12]
    const containerPlanet = ascAspectedByBenefics[0] ?? ascAspectedByMalefics[0]
    if (containerPlanet) {
      details.push(`[Ch25:12] ${containerPlanet.name} aspects ascendant → Article likely in: ${PLANET_CONTAINERS[containerPlanet.id]}`)
    }

    // Place where hidden [Ch15, St9-10 + Ch25]
    const aspPlanet7th = grahas.find(g => getPlanetHouse(g.rashi, lagnaRashi) === 7 && !['Ur','Ne','Pl'].includes(g.id))
    if (aspPlanet7th) {
      const hiddenPlaces: Partial<Record<GrahaId, string>> = {
        Ve: 'Bed or bedroom', Ju: 'Chest or suspended in air', Sa: 'Utensil store / worn-out vessel',
        Su: 'Temple or prayer room', Mo: 'Bathroom or water-storing place', Ma: 'Fireplace or kitchen'
      }
      const hp = hiddenPlaces[aspPlanet7th.id]
      if (hp) details.push(`[Ch15:9] ${aspPlanet7th.name} in 7th → Article hidden in: ${hp}`)
      details.push(`[Ch15:9] Planet in 7th house → Article is UNDERGROUND or at a lower place`)
    }
  }

  if (category === 'who') {
    // ── Thief Analysis [Ch10, 27, 28, 30] ───────────────────────────────────
    const lagnaIsMale = MALE_SIGNS.has(lagnaRashi)
    const dominantGender = lagnaIsMale ? 'Male' : 'Female'
    let thiefCaste = 'Unknown'
    let thiefRelation = 'Unknown'
    let thiefFeatures = ''
    let thiefColor = ''
    let thiefPosture = ''
    let nameLetters = ''
    let nameLetterExplanation = ''
    let thiefLocation = ''

    if (planetsInAsc.length > 0) {
      const thievePlanet = planetsInAsc[0]
      thiefCaste = PLANET_CASTE[thievePlanet.id]
      thiefColor = PLANET_COLORS[thievePlanet.id]
      thiefFeatures = PLANET_FEATURES[thievePlanet.id]
      const thiefHouseFromSignificator = getPlanetHouse(thievePlanet.rashi, lagnaRashi)
      const relationMap: Record<number, string> = {
        1: 'The querist themselves', 2: 'Family member',
        3: 'A brother/sibling', 4: 'Mother or maternal relative',
        5: 'Own children', 6: 'An enemy',
        7: 'Spouse or business partner', 8: 'Hidden / unknown person',
        9: 'Father or paternal relative', 10: 'A servant / employee',
        11: 'Custodian of money / treasurer', 12: 'Article lost forever'
      }
      thiefRelation = relationMap[thiefHouseFromSignificator] ?? 'A distant acquaintance'

      // Name syllables [Ch30, St1]
      const sylGroup = PLANET_SYLLABLES[thievePlanet.id]
      nameLetters = sylGroup.letters
      nameLetterExplanation = `${thievePlanet.name} in ascendant → Name starts with ${sylGroup.group} letters: ${sylGroup.letters} [Ch30:1]`
    } else {
      // Use sign lord of ascendant for syllables
      const ascLord = SIGN_LORDS[lagnaRashi]
      const sylGroup = PLANET_SYLLABLES[ascLord]
      nameLetters = sylGroup.letters
      nameLetterExplanation = `Ascendant lord ${ascLord} → Name letters: ${sylGroup.group}: ${sylGroup.letters} [Ch30:1]`
    }

    // Drekkana posture [Ch27, St3]
    const drekkana = lagnaSignDegree < 10 ? 1 : lagnaSignDegree < 20 ? 2 : 3
    thiefPosture = drekkana === 1 ? 'Standing upright' : drekkana === 2 ? 'Prostrating/Lying down' : 'Seated'

    // Thief location direction [Ch25, St13 — direction from aspecting planet]
    const aspectorForDirection = grahas.find(g => hasAspect(g, lagnaRashi) && MALEFICS.has(g.id) && !['Ur','Ne','Pl'].includes(g.id))
    if (aspectorForDirection) {
      thiefLocation = `Thief may be in the ${PLANET_DIRECTIONS[aspectorForDirection.id]} direction [Ch25:13]`
    }

    // Number of thieves [Ch25, St13]
    const maleficAspectors = grahas.filter(g => !isBenefic(g.id) && hasAspect(g, lagnaRashi) && !['Ur','Ne','Pl'].includes(g.id))
    if (maleficAspectors.length > 1) {
      thiefLocation += ` | ${maleficAspectors.length} malefics aspect → ${maleficAspectors.length} thieves involved`
    }

    thief = {
      gender: dominantGender, caste: thiefCaste, relation: thiefRelation,
      posture: thiefPosture, features: thiefFeatures, color: thiefColor,
      nameLetters, nameLetterExplanation, location: thiefLocation
    }
    rules.push(`[Ch27:3] Drekkana ${drekkana} → Thief is ${thiefPosture}`)
    rules.push(`[Ch10:1] Ascendant sign ${lagnaIsMale ? 'odd/male' : 'even/female'} → Thief is ${dominantGender}`)
    rules.push(`[Ch30:1] Planet syllables → Thief name letters: ${nameLetters}`)
  }

  if (category === 'health') {
    // ── Health Analysis [Ch13] ────────────────────────────────────────────
    const dayOfStart = `Disease likely started ${moonHouse} day(s) before query (Moon is in house ${moonHouse} from Lagna) [Ch13:4]`
    const ascType = getSignType(lagnaRashi)
    const curability = ascType === 'movable' ? 'Curable — Movable ascendant (recovery expected)'
      : ascType === 'fixed' ? 'Difficult to cure — Fixed ascendant (chronic/stubborn)'
      : 'Prolonged — Common ascendant (long-lasting illness)'

    const doshaMap: Partial<Record<GrahaId, string>> = {
      Ma: 'Pitta dosha (bile/heat — fever, inflammation)',
      Me: 'Vatha dosha (wind/nerve — anxiety, spasm)',
      Sa: 'Vatha dosha (chronic, cold, nerve — arthritis, paralysis)',
      Su: 'Pitta dosha (heat, fever, stomach, eye issues)',
      Mo: 'Kapha dosha (cold, phlegm, emotional, hormonal)',
      Ju: 'Kapha dosha (obesity, liver, fat-related)',
      Ve: 'Kapha-Vatha (urinary, reproductive, diabetes)',
      Ra: 'Mixed/Unknown dosha (mysterious disease)',
      Ke: 'Vatha/Pitta mixed (skin, nerve, spiritual causes)',
    }
    const ascPlanets = grahas.filter(g => g.rashi === lagnaRashi && !['Ur','Ne','Pl'].includes(g.id))
    const doshaLord = ascPlanets.length > 0 ? ascPlanets[0] : grahas.find(g => g.id === SIGN_LORDS[lagnaRashi])
    const diseaseDosha = doshaLord ? (doshaMap[doshaLord.id] ?? 'Mixed tridoshas') : 'Analysis by ascendant sign needed'

    // Disease (6th lord) [Ch13]
    const h6 = ((lagnaRashi + 4) % 12) + 1
    const disease6thLord = SIGN_LORDS[h6]
    const diseaseStr = `6th lord: ${disease6thLord} (house lord of disease/injury) → ${diseaseDosha}`

    // Curability from Sun in 12th [Ch7, St6]
    const sun = grahas.find(g => g.id === 'Su')
    if (sun && getPlanetHouse(sun.rashi, lagnaRashi) === 12) {
      details.push('[Ch7:6] Sun in 12th house → Risk of right eye blindness / vision issues')
    }

    // Ch13: Body system by planet in ascendant/aspecting it
    const bodyPlanet = doshaLord
    const bodySystem = bodyPlanet ? PLANET_BODY_SYSTEM[bodyPlanet.id] ?? 'Mixed body systems' : 'Mixed body systems'

    // Ch13: Place and cause of death (for severity)
    const placeOfDeath = SIGN_PLACE_OF_DEATH[lagnaRashi] ?? 'Unknown location'
    const causeOfDeath = SIGN_CAUSE_OF_DEATH[lagnaRashi] ?? 'Unknown cause'

    // Ch13: Rebirth by sign
    const rebirthMap: Record<string, string> = {
      biped: 'Biped being', quadruped: 'Quadruped animal', reptile: 'Reptile', water: 'Aquatic creature'
    }
    const signCat = BIPED_SIGNS.has(lagnaRashi) ? 'biped' : QUADRUPED_SIGNS.has(lagnaRashi) ? 'quadruped' : REPTILE_SIGNS.has(lagnaRashi) ? 'reptile' : 'aquatic'
    const rebirthNature = rebirthMap[signCat] ?? 'Dependent on navamsa'

    // Ch13: Death symptoms — Drekkana analysis
    const deathSymptoms = analyzeDeathSymptoms(grahas, lagnaRashi, lagnaSignDegree, moonRashi)

    health = { dosha: diseaseDosha, disease: diseaseStr, curability, dayOfStart, bodySystem, deathSymptoms, placeOfDeath, causeOfDeath, rebirthNature }
    rules.push(`[Ch13:4] Moon in house ${moonHouse} → Disease started ${moonHouse} day(s) before query`)
    rules.push(`[Ch13:5] ${ascType} sign ascendant → ${curability}`)
    rules.push(`[Ch13:6] Dosha: ${diseaseDosha}`)
    rules.push(`[Ch13:6] Body system: ${bodySystem}`)
    rules.push(`[Ch13:7] Rebirth nature by sign: ${rebirthNature}`)
    details.push(`[Ch13:1] Death symptoms check: ${deathSymptoms}`)
    details.push(`[Ch13:7] Place of death: ${placeOfDeath} | Cause: ${causeOfDeath}`)

    // Benefics in 6th/8th → recovery
    const benIn68 = grahas.filter(g => isBenefic(g.id, g.isCombust) && (getPlanetHouse(g.rashi, lagnaRashi) === 6 || getPlanetHouse(g.rashi, lagnaRashi) === 8))
    if (benIn68.length > 0) {
      positive++; total++
      rules.push(`[Ch13:5] Benefics (${benIn68.map(g=>g.name).join(', ')}) in 6th/8th → Disease will be cured`)
    }
    // Malefics in 6th can deform that limb [Ch7, St12]
    const malIn6 = grahas.find(g => !isBenefic(g.id) && getPlanetHouse(g.rashi, lagnaRashi) === 6)
    if (malIn6) {
      const benInKendraTrikona = grahas.some(g => isBenefic(g.id, g.isCombust) && [1,4,5,7,9,10].includes(getPlanetHouse(g.rashi, lagnaRashi)))
      if (!benInKendraTrikona) {
        details.push(`[Ch7:12] Malefic ${malIn6.name} in 6th + no benefic in Kendra/Trikona → Deformity or disease in that limb`)
      }
    }
  }

  if (category === 'pregnancy') {
    // ── Pregnancy / Santhana Prashna [Ch21, St7-13 + Ch24, St2] ─────────────
    const ketu = grahas.find(g => g.id === 'Ke')
    if (ketu) {
      const ketuInAsc = ketu.rashi === lagnaRashi
      if (ketuInAsc) {
        const ketuWithMoonOrVenus = grahas.some(g => (g.id === 'Mo' || g.id === 'Ve') && g.rashi === lagnaRashi)
        const ketuWithSaturnOrMars = grahas.some(g => (g.id === 'Sa' || g.id === 'Ma') && g.rashi === lagnaRashi)
        const ketuWithMercury = grahas.some(g => g.id === 'Me' && g.rashi === lagnaRashi)
        const ketuWithJupiter = grahas.some(g => g.id === 'Ju' && g.rashi === lagnaRashi)
        const ketuWithVenus = grahas.some(g => g.id === 'Ve' && g.rashi === lagnaRashi)

        if (ketuWithMoonOrVenus) { positive += 2; total += 2; rules.push('[Ch21:7] Ketu + Moon/Venus in ascendant → PREGNANCY CONFIRMED') }
        if (ketuWithJupiter) { positive += 2; total += 2; rules.push('[Ch21:8] Ketu + Jupiter in ascendant → Child will be healthy/prosperous') }
        if (ketuWithVenus) { positive += 2; total += 2; rules.push('[Ch21:10] Ketu + Venus in ascendant → Lady, food, and pregnancy all obtained') }
        if (ketuWithMercury) { details.push('[Ch21:9] Ketu + Mercury in ascendant → Child may have nervous disorders; lady will dominate household') }
        if (ketuWithSaturnOrMars) { negative += 2; total += 2; rules.push('[Ch21:7] Ketu + Saturn/Mars in ascendant → Pregnancy DENIED or DESTROYED (miscarriage risk)') }
        if (grahas.some(g => g.id === 'Sa' && g.rashi === lagnaRashi)) {
          details.push('[Ch21:11] Ketu + Saturn in ascendant → House may catch fire; money flow obstructed')
          remedies.push('Visit Naga temples; offer milk to serpent idols to propitiate Rahu-Ketu')
        }
      }
    }
    const venus = grahas.find(g => g.id === 'Ve')
    const moon2 = grahas.find(g => g.id === 'Mo')
    if (venus && moon2) {
      const venusFemSign = !MALE_SIGNS.has(venus.rashi)
      const moonFemSign = !MALE_SIGNS.has(moon2.rashi)
      if (venus.rashi === lagnaRashi && moon2.rashi === lagnaRashi && venusFemSign && moonFemSign) {
        positive++; total++
        rules.push('[Ch24:2] Venus + Moon in female sign ascendant → Pregnancy/marriage desire fulfilled')
      }
    }
    // Children: 5th house [Ch7, St8]
    const h5 = ((lagnaRashi + 3) % 12) + 1
    if ([5, 8, 6, 2].includes(h5)) {  // Leo, Scorpio, Virgo, Taurus = Alpapuhra
      details.push('[Ch7:8] 5th house is an Alpapuhra sign (Leo/Scorpio/Virgo/Taurus) → Querist may have fewer children')
    }
  }

  if (category === 'travel') {
    // ── Travel Return [Ch5, St1-7 + Ch14] ───────────────────────────────────
    const ascType = getSignType(lagnaRashi)
    const travelUnit = ascType === 'movable' ? 'days' : ascType === 'fixed' ? 'years' : 'months'
    details.push(`[Ch5:1] ${ascType.toUpperCase()} sign ascendant → Return expected in ${travelUnit}`)
    const h9 = ((lagnaRashi + 7) % 12) + 1
    const travelSig = SIGN_LORDS[h9]
    const timing9 = PLANET_TIMING[travelSig]
    details.push(`[Ch5:7] Travel significator ${travelSig} → expect return in ${timing9.value} ${timing9.unit}`)
    rules.push(`[Ch5:1] Travel return: ${travelUnit}-based timing (${ascType} sign)`)

    // Mode of return [Ch14, St11]
    const h9Planet = grahas.find(g => getPlanetHouse(g.rashi, lagnaRashi) === 9)
    if (h9Planet) {
      const returnModes: Record<string, string> = {
        movable: 'horse back or four-wheel vehicle', fixed: 'on foot (walking)',
        common: 'common transport'
      }
      const h9SignType = getSignType(h9Planet.rashi)
      if (WATERY_SIGNS.has(h9Planet.rashi)) {
        details.push(`[Ch14:11] Planet in 9th is in watery sign → Traveller returns crossing water (by ship, plane, or across river)`)
      } else {
        details.push(`[Ch14:11] Planet in 9th in ${h9SignType} sign → Traveller returns by ${returnModes[h9SignType] ?? 'land vehicle'}`)
      }
    }
    // Arrest risk in travel [Ch14]
    const satMarsAspectAsc = grahas.some(g => (g.id === 'Sa' || g.id === 'Ma') && hasAspect(g, lagnaRashi))
    if (satMarsAspectAsc) {
      details.push('[Ch14] Saturn/Mars aspecting ascendant in travel query → Risk of arrest or detention')
      negative++; total++
    }
  }

  if (category === 'house_query') {
    // ── House Query [Ch15] ────────────────────────────────────────────────
    const planetsIn7th = grahas.filter(g => getPlanetHouse(g.rashi, lagnaRashi) === 7 && !['Ur','Ne','Pl'].includes(g.id))
    const relevantPlanet = planetsInAsc[0] ?? planetsIn7th[0]
    const houseNature = relevantPlanet
      ? `${PLANET_HOUSE_NATURE[relevantPlanet.id]} (from ${relevantPlanet.name} in ${planetsIn7th.includes(relevantPlanet) ? '7th' : '1st'})`
      : `Nature from ascendant sign ${RASHI_NAMES[lagnaRashi]}`
    const altHouseNature = relevantPlanet ? PLANET_HOUSE_ALT[relevantPlanet.id] : ''

    // Treasure query [Ch15, St7]
    const hasTreasure = grahas.some(g => isBenefic(g.id, g.isCombust) && [1,4,7,10,11].includes(getPlanetHouse(g.rashi, lagnaRashi)))
      ? 'YES — Benefics in quadrant/11th → Treasure exists in the house'
      : 'NO — No benefics in quadrant → No hidden treasure indicated'

    // Ownership [Ch15, St9]
    const ownership = relevantPlanet
      ? (relevantPlanet.dignity === 'own' ? 'House belongs to the querist or the thief (planet in own house)' : 'House belongs to someone else')
      : 'Determined by sign lord'

    // Direction of house from sign [Ch15, St6]
    const houseDirection = SIGN_DIRECTIONS[lagnaRashi] ?? 'East'

    // Shape [Ch15, St6]
    const shapes: Record<number, string> = { 10: 'Round house', 11: 'Rahu\'s house (latrine/ruin)', 5: 'Covered house' }
    const houseShape = shapes[lagnaRashi] ?? 'Standard rectangular'

    houseQuery = { houseType: `${houseNature}. Alt: ${altHouseNature}`, hasTreasure, ownership, direction: houseDirection, shape: houseShape }
    rules.push(`[Ch15:2-4] ${relevantPlanet?.name ?? 'No planet'} in ascendant/7th → ${houseNature}`)
    rules.push(`[Ch15:7] Treasure: ${hasTreasure}`)
    details.push(`[Ch15:6] House direction: ${houseDirection}, shape: ${houseShape}`)
  }

  if (category === 'spirit') {
    // ── Baadha / Invisible Spirit [Ch19] ──────────────────────────────────
    const ascAspectorForSpirit = grahas.find(g => hasAspect(g, lagnaRashi) || g.rashi === lagnaRashi)
    const spiritPlanet = ascAspectorForSpirit ?? grahas.find(g => g.id === 'Sa' || g.id === 'Ra')
    const spiritType = spiritPlanet ? BAADHA_GROUPS[spiritPlanet.id] : 'Unknown spirit type'
    const spiritDeity = spiritPlanet ? PLANET_DEITY[spiritPlanet.id] : 'Consult a priest'

    // Remedy based on house [Ch19, St3]
    let spiritRemedy = 'General puja and propitiation recommended'
    if (spiritPlanet) {
      const spHouse = getPlanetHouse(spiritPlanet.rashi, lagnaRashi)
      if (spHouse === 1) spiritRemedy = `Make an idol of ${spiritDeity} in silver/gold and donate it as a gift`
      else if (spHouse === 7) spiritRemedy = `Please ${spiritDeity} with dance and music offerings`
      else if (spHouse === 8) spiritRemedy = `Perform sacrifice and worship (Homa) for ${spiritDeity}`
      else if (spHouse === 4) spiritRemedy = `Build a temple or garden to please ${spiritDeity}`
    }

    spirit = { type: spiritType, deity: spiritDeity, remedy: spiritRemedy }
    rules.push(`[Ch19:1-3] Spirit type: ${spiritType} | Deity: ${spiritDeity}`)
    remedies.push(spiritRemedy)
    negative++; total++
  }

  if (category === 'intercourse' || category === 'marriage') {
    // ── Intercourse / Marriage Query [Ch18 + Ch15, St11-12] ─────────────────
    const ascBeneficAsp = grahas.some(g => isBenefic(g.id) && (hasAspect(g, lagnaRashi) || g.rashi === lagnaRashi))
    const ascMaleficAsp = grahas.some(g => !isBenefic(g.id) && (hasAspect(g, lagnaRashi) || g.rashi === lagnaRashi))
    const h7Sign = ((lagnaRashi + 5) % 12) + 1
    const h7Planet = grahas.find(g => g.rashi === h7Sign && !['Ur','Ne','Pl'].includes(g.id))

    let relQuality = ascBeneficAsp ? 'Favorable — Benefic aspects ascendant; love and fulfillment expected' :
      ascMaleficAsp ? 'Unfavorable — Malefic aspects ascendant; wife/partner may reject or be hostile' :
      'Neutral — Mixed indications'

    // Partner nature [Ch18, St2]
    let partner = 'Unknown'
    if (h7Planet) {
      if (h7Planet.dignity === 'own' || h7Planet.dignity === 'moolatrikona') partner = 'Own wife/spouse (planet in own sign)'
      else if (h7Planet.dignity === 'exalted') partner = 'Lady of high caste or distinguished family'
      else if (['friend', 'great_friend'].includes(h7Planet.dignity)) partner = 'A friendly person'
      else if (['enemy', 'great_enemy'].includes(h7Planet.dignity)) partner = 'An enemy or unfriendly person'
      else if (h7Planet.dignity === 'debilitated') partner = 'Person of lower status'
      else {
        const partnerTypes: Partial<Record<GrahaId, string>> = {
          Ma: 'Prostitute or aggressive woman', Ve: 'Wife of a peasant/farmer',
          Ju: 'Wife of a minister or learned man', Mo: 'Brahmin lady',
          Su: 'Wife of a king or authority figure', Sa: 'Mean or low-status lady', Me: 'Mean person'
        }
        partner = partnerTypes[h7Planet.id] ?? 'Unknown partner type'
      }
    }

    // Nature of relation [Ch18, St1]
    let nature = 'Unknown'
    const moonWithMaleficAspSun = grahas.find(g => g.id === 'Mo' && g.rashi === lagnaRashi)
    if (moonWithMaleficAspSun) {
      const sunAspectsLagna = grahas.some(g => g.id === 'Su' && hasAspect(g, lagnaRashi))
      if (sunAspectsLagna) nature = 'Man engaged lady by force [Ch18:1]'
    }
    if (ascBeneficAsp) nature = 'Mutual love and attraction [Ch18:1]'
    else if (ascMaleficAsp) nature = 'Rejection or conflict in relationship [Ch18:1]'

    // Chathra for marriage [Ch18, St3]
    const chathraMarsOwn = [1, 8].includes(chhatraRashi) // Aries or Scorpio
    if (chathraMarsOwn) {
      nature += '; Chathra Rasi is Mars-owned (Aries/Scorpio) → Copulation with own spouse'
      details.push('[Ch18:3] Chathra Rasi in Aries/Scorpio (Mars\'s signs) → Relationship with own spouse/partner')
    }

    relationship = { quality: relQuality, partner, nature }
    rules.push(`[Ch18:1] Ascendant aspects: ${ascBeneficAsp ? 'Benefic' : 'Malefic'} → ${relQuality}`)
    if (h7Planet) rules.push(`[Ch18:2] 7th house planet ${h7Planet.name} in ${h7Planet.dignity} → Partner: ${partner}`)

    if (ascBeneficAsp) { positive++; total++ } else if (ascMaleficAsp) { negative++; total++ }
  }

  if (category === 'food') {
    // ── Food / Bhojana Prashna [Ch16] ────────────────────────────────────
    const ascLordId = SIGN_LORDS[lagnaRashi]
    const ascLordPlanet = grahas.find(g => g.id === ascLordId)
    const foodQuality = isBenefic(ascLordId) ? 'Good and clean food (benefic ascendant lord)' :
      'Harsh or impure food (malefic ascendant lord) [Ch16:3]'

    // Food type from sign
    let foodType = MALE_SIGNS.has(lagnaRashi) ? 'Harsh, dry food (male sign)' : 'Fluid/watery food (female/watery sign)'
    if (WATERY_SIGNS.has(lagnaRashi)) foodType = 'Fluid food with watery items'

    // Taste from planet
    const planetInAscForFood = planetsInAsc[0]
    const taste = planetInAscForFood ? PLANET_TASTES_1[planetInAscForFood.id] : PLANET_TASTES_2[ascLordId]

    food = { quality: foodQuality, type: foodType, taste: `${taste} (planet signification)` }
    rules.push(`[Ch16:3] ${isBenefic(ascLordId) ? 'Benefic' : 'Malefic'} ascendant lord → ${foodQuality}`)
    details.push(`[Ch16:1-2] Taste: ${taste}`)
    if (planetsInAsc.length > 0) {
      const produce = PLANET_PRODUCE[planetsInAsc[0].id]
      if (produce) details.push(`[Ch16:9] Food item: ${produce} (from ${planetsInAsc[0].name})`)
    }
  }

  // ── 14. Navamsa Ascendant Signification [Ch20] ────────────────────────────
  const navamsaIndex = Math.floor(lagnaSignDegree / (30 / 9)) + 1
  const navamsaRashi = ((lagnaRashi - 1) * 9 + navamsaIndex - 1) % 12 + 1
  const navamsaSigs = NAVAMSA_SIGNIFICATIONS[navamsaRashi]
  const navamsaSignification = navamsaSigs
    ? `Navamsa Lagna in ${RASHI_NAMES[navamsaRashi]}: ${navamsaSigs[0] ?? 'General auspicious matters'} [Ch20]`
    : `Navamsa Lagna in ${RASHI_NAMES[navamsaRashi]}: General matters [Ch20]`
  details.push(navamsaSignification)

  // ── 15. Timing Calculation [Ch5, Ch8] ────────────────────────────────────
  const sigId = getSignificatorForCategory(category, grahas, lagnaRashi)
  const sigPlanet = grahas.find(g => g.id === sigId)
  const timingBase = PLANET_TIMING[sigId]
  const ascType = getSignType(lagnaRashi)

  const sigHouseFromSun = ((sigPlanet?.rashi ?? lagnaRashi) - sunRashi + 12) % 12 + 1
  const isProximate = sigHouseFromSun <= 4

  const timingMultiplier = isProximate ? 0.5 : 1.5
  const timingMin = `${Math.ceil(timingBase.value * timingMultiplier * 0.5)} ${timingBase.unit}`
  const timingMax = `${Math.ceil(timingBase.value * timingMultiplier * 1.5)} ${timingBase.unit}`

  let timingDescription = `Significator: ${sigPlanet?.name ?? sigId}. ${timingBase.description}.`
  timingDescription += ` ${isProximate ? 'Planet proximate to Sun → Earlier manifestation.' : 'Planet distant from Sun → Later manifestation.'}`
  if (ascType === 'movable') timingDescription += ' Movable ascendant → days.'
  else if (ascType === 'fixed') timingDescription += ' Fixed ascendant → years.'
  else timingDescription += ' Common ascendant → months.'

  const timing = {
    description: timingDescription, rangeMin: timingMin, rangeMax: timingMax,
    significatorPlanet: sigPlanet?.name ?? sigId,
    unit: ascType === 'movable' ? 'days' : ascType === 'fixed' ? 'years' : 'months'
  }

  rules.push(`[Ch5:7] Timing significator: ${sigPlanet?.name ?? sigId} → ${timingBase.description}`)
  rules.push(`[Ch5:6] ${isProximate ? 'Proximate to Sun → earlier result' : 'Distant from Sun → later result'}`)

  // ── 16. Body Touch [Ch24, St15-18] ───────────────────────────────────────
  let bodyTouchResult: string | undefined
  if (bodyTouchPart && BODY_TOUCH_RESULTS[bodyTouchPart]) {
    const touch = BODY_TOUCH_RESULTS[bodyTouchPart]
    bodyTouchResult = touch.description
    total++
    if (touch.result === 'fulfilled') { positive += 2 }
    else if (touch.result === 'delayed') { positive++ }
    else if (touch.result === 'never') { negative += 3 }
    rules.push(touch.description)
  }

  // ── 17. Favorable Direction ───────────────────────────────────────────────
  const strongPlanetInKendra = grahas
    .filter(g => !['Ur','Ne','Pl'].includes(g.id) && [1,4,7,10].includes(getPlanetHouse(g.rashi, lagnaRashi)))
    .sort((a, b) => {
      const rankA = ['exalted','moolatrikona','own'].includes(a.dignity) ? 3 : ['friend','great_friend'].includes(a.dignity) ? 2 : 1
      const rankB = ['exalted','moolatrikona','own'].includes(b.dignity) ? 3 : ['friend','great_friend'].includes(b.dignity) ? 2 : 1
      return rankB - rankA
    })[0]
  const direction = strongPlanetInKendra ? (PLANET_DIRECTIONS[strongPlanetInKendra.id] ?? 'East') : SIGN_DIRECTIONS[lagnaRashi] ?? 'East'

  // ── 18a. Lawsuit / Legal Dispute Analysis (Vivada Prashna) ──────────────
  let lawsuit: KrishneeyamResult['lawsuit'] | undefined
  if (category === 'lawsuit') {
    const mars = grahas.find(g => g.id === 'Ma')
    const saturn = grahas.find(g => g.id === 'Sa')
    const jupiter = grahas.find(g => g.id === 'Ju')
    const mercury = grahas.find(g => g.id === 'Me')
    const sixthLord = SIGN_LORDS[((lagnaRashi + 4) % 12 + 1) as Rashi]
    const sixthLordGraha = grahas.find(g => g.id === sixthLord || g.name === sixthLord)
    const sixthHousePlanets = grahas.filter(g => getPlanetHouse(g.rashi, lagnaRashi) === 6 && !['Ur','Ne','Pl'].includes(g.id))
    const q6Lord = sixthLordGraha
    const queristStrong = (moonGood ? 1 : 0) + (q6Lord && isBenefic(q6Lord.id, q6Lord.isCombust) ? 1 : 0) + (jupiter && getPlanetHouse(jupiter.rashi, lagnaRashi) === 1 ? 1 : 0)
    const opponentStrong = sixthHousePlanets.filter(g => !isBenefic(g.id, g.isCombust)).length
    const jupGood = jupiter && ['exalted','moolatrikona','own','great_friend','friend'].includes(jupiter.dignity)
    const satDelay = saturn && [1,6,7].includes(getPlanetHouse(saturn.rashi, lagnaRashi))
    const outcome = queristStrong > opponentStrong
      ? (jupGood ? 'Querist wins decisively — Jupiter strong' : 'Querist likely wins')
      : opponentStrong > 1 ? 'Outcome unfavorable — opponents have strong 6th house'
      : 'Compromise / settlement likely'
    const legalTiming = satDelay ? 'Prolonged — Saturn delays; expect 1-3 years' : mars && getPlanetHouse(mars.rashi, lagnaRashi) === 6 ? 'Aggressive timeline — Mars in 6th, action within months' : 'Normal legal timeline'
    const keyPlanet = jupiter ? `Jupiter (${RASHI_NAMES[jupiter.rashi]}, ${jupiter.dignity})` : mercury ? `Mercury (${RASHI_NAMES[mercury.rashi]})` : 'Saturn'
    lawsuit = {
      queristStrength: queristStrong >= 2 ? 'Strong' : queristStrong === 1 ? 'Moderate' : 'Weak',
      opponentStrength: opponentStrong >= 2 ? 'Strong' : opponentStrong === 1 ? 'Moderate' : 'Weak',
      outcome, timing: legalTiming, keyPlanet,
    }
    scorecard.push({ label: 'Querist in Lawsuit', result: queristStrong > opponentStrong ? 'good' : 'bad', detail: outcome, weight: 2 })
    rules.push(`[Vivada Prashna] 6th house analysis: querist ${queristStrong > opponentStrong ? 'stronger' : 'weaker'} than opponent. ${outcome}`)
  }

  // ── 18b. Exam / Election / Competition Analysis (Pariksha Prashna) ───────
  let exam: KrishneeyamResult['exam'] | undefined
  if (category === 'exam') {
    const mercury = grahas.find(g => g.id === 'Me')
    const jupiter = grahas.find(g => g.id === 'Ju')
    const moon = grahas.find(g => g.id === 'Mo')
    const fifthHousePlanets = grahas.filter(g => getPlanetHouse(g.rashi, lagnaRashi) === 5 && !['Ur','Ne','Pl'].includes(g.id))
    const fifthLordSign = ((lagnaRashi + 3) % 12 + 1) as Rashi
    const fifthLordId = SIGN_LORDS[fifthLordSign]
    const fifthLordGraha = grahas.find(g => g.id === fifthLordId)
    const merGood = mercury && !mercury.isCombust && !['debilitated','enemy','great_enemy'].includes(mercury.dignity)
    const jupGood2 = jupiter && !jupiter.isCombust && ['exalted','moolatrikona','own','great_friend','friend'].includes(jupiter.dignity)
    const fifthLordGood = fifthLordGraha && !fifthLordGraha.isCombust && !['debilitated','enemy','great_enemy'].includes(fifthLordGraha.dignity)
    const successPoints = (merGood ? 1 : 0) + (jupGood2 ? 1 : 0) + (fifthLordGood ? 1 : 0) + (fifthHousePlanets.some(g => isBenefic(g.id, g.isCombust)) ? 1 : 0)
    const success = successPoints >= 3 ? 'Excellent chances — pass with distinction' : successPoints === 2 ? 'Good chances of success' : successPoints === 1 ? 'Marginal — needs extra effort' : 'Difficult — prepare intensively or postpone'
    const subjectStr = mercury ? `${RASHI_NAMES[mercury.rashi]} rules — ${mercury.rashi <= 6 ? 'languages, writing, commerce, mathematics' : 'technical, occult, research'}` : 'General studies'
    const keyStrength = merGood ? 'Mercury strong — sharp intellect' : jupGood2 ? 'Jupiter strong — good conceptual grasp' : 'Hard work compensates'
    const weakness = !merGood ? 'Mercury weak — writing/communication errors possible' : !moonGood ? 'Moon weak — memory may falter under pressure' : 'None significant'
    const examTiming = successPoints >= 2 ? 'Best result in current attempt' : 'Consider next opportunity for better outcome'
    exam = { success, subject: subjectStr, keyStrength, weakness, timing: examTiming }
    scorecard.push({ label: 'Exam Success', result: successPoints >= 2 ? 'good' : successPoints === 1 ? 'neutral' : 'bad', detail: success, weight: 2 })
    rules.push(`[Pariksha Prashna] 5th lord + Mercury + Jupiter analysis: ${success}`)
  }

  // ── 18c. Rahu in Ascendant (Ch22) — global result ─────────────────────
  const rahuInAscGraha = planetsInAsc.find(g => g.id === 'Ra')
  const rahuInAscendant = rahuInAscGraha
    ? (() => {
        const benAsp = grahas.filter(g => isBenefic(g.id, g.isCombust) && hasAspect(g, lagnaRashi) && g.id !== 'Ra')
        const malAsp = grahas.filter(g => !isBenefic(g.id, g.isCombust) && hasAspect(g, lagnaRashi) && !['Ur','Ne','Pl'].includes(g.id))
        const base = 'Rahu in ascendant: hidden forces, foreign influence, delays of 6–18 months. '
        const ben = benAsp.length > 0 ? `Benefic aspect of ${benAsp.map(g=>g.name).join('/')} — unexpected rescue. ` : ''
        const mal = malAsp.length > 0 ? `Malefic aspect of ${malAsp.map(g=>g.name).join('/')} — betrayal or deception. ` : ''
        return base + ben + mal
      })()
    : undefined

  // ── 18. Final Verdict ─────────────────────────────────────────────────────
  const score = total > 0 ? positive / total : 0.5
  let verdict: Verdict
  let headline: string
  let confidence: number

  if (score >= 0.72) { verdict = 'YES'; headline = 'Yes — Highly Favorable'; confidence = Math.min(95, Math.round(score * 100)) }
  else if (score >= 0.58) { verdict = 'YES'; headline = 'Likely Yes — Favorable'; confidence = Math.round(score * 100) }
  else if (score >= 0.45) { verdict = 'MIXED'; headline = 'Mixed — With Effort & Remedies'; confidence = Math.round(score * 100) }
  else if (score >= 0.32) { verdict = 'DELAYED'; headline = 'Delayed / Obstacles Present'; confidence = Math.round((1 - score) * 100) }
  else { verdict = 'NO'; headline = 'No — Unfavorable at This Time'; confidence = Math.round((1 - score) * 100) }

  // Body touch overrides
  if (bodyTouchPart === 'lower_body') { verdict = 'NO'; headline = 'No — Lower body touch: Desire unfulfillable'; confidence = 90 }
  else if (bodyTouchPart === 'chest') { verdict = 'YES'; headline = 'Yes — Chest touch confirms fulfillment'; confidence = 85 }

  scorecard.push({ label: 'Overall Score', result: score >= 0.58 ? 'good' : score >= 0.45 ? 'neutral' : 'bad', detail: `${positive}/${total} indicators favorable`, weight: 0 })
  details.push(`Score: ${positive}/${total} indicators favorable (${Math.round(score*100)}%)`)

  if (verdict === 'YES' || verdict === 'MIXED') {
    remedies.push(`Light a ghee lamp at sunrise, face ${direction}, and proceed with your query's objective`)
  }
  if (aroodhaRel.result === 'bad') {
    remedies.push('Aroodha-Udaya disharmony: Recite Ganesh Stotra before proceeding; obstacles can be overcome with patience')
  }
  if (negative > positive) {
    remedies.push('Perform Navagraha puja; propitiate the ascendant lord specifically')
  }

  return {
    verdict, headline, confidence,
    ascendantType: odayaInfo.label,
    ascendantTypeResult: odayaInfo.verdict,
    signType: mukhaInfo.label,
    signTypeResult: mukhaInfo.verdict,
    aroodhaUdayaRelation: `${aroodhaRel.relationship} (${aroodhaRel.result})`,
    aroodhaUdayaResult: aroodhaRel.result,
    chhatraRashi, chhatraIsObstacle,
    planetInAscendantEffect, bodyTouchResult,
    rashmiScore, rashmiSummary,
    timing,
    subjectNature: subjectNature || undefined,
    subjectMaterial: subjectMaterial || undefined,
    subjectMaterialDetail: subjectMaterialDetail || undefined,
    subjectDirection: direction,
    thief, health, houseQuery, spirit, relationship, food,
    queristFeatures,
    animalQuery,
    // Ch1-5 new additions
    drekkanaAnalysis,
    thiefEntry,
    planetPhysicalFeatures,
    queristGuna,
    moonYoga: { name: moonYogaResult.name, result: moonYogaResult.result },
    pastPresentFuture,
    dryWetAnalysis,
    timeStrengthNotes,
    subjectElement,
    signHeight,
    signPlace,
    navamsaSignification,
    trimsamshaTopics,
    scorecard,
    lawsuit,
    exam,
    rahuInAscendant,
    rules, details, remedies,
    direction,
  }
}

// Helper used in saturn analysis
function jupInKendraCheck(jupiter: GrahaData | undefined, lagnaRashi: number): boolean {
  if (!jupiter) return false
  return [1,4,7,10].includes(getPlanetHouse(jupiter.rashi, lagnaRashi))
}

// All constants are already exported inline above.
