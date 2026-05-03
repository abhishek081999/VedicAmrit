// ─────────────────────────────────────────────────────────────
//  src/types/astrology.ts
//  Core domain types — used across the entire platform
// ─────────────────────────────────────────────────────────────

// ── Grahas (Planets) ─────────────────────────────────────────

export type GrahaId = 'Su' | 'Mo' | 'Ma' | 'Me' | 'Ju' | 'Ve' | 'Sa' | 'Ra' | 'Ke' | 'Ur' | 'Ne' | 'Pl'

export const GRAHA_NAMES: Record<GrahaId, string> = {
  Su: 'Sun',  Mo: 'Moon',    Ma: 'Mars',    Me: 'Mercury',
  Ju: 'Jupiter', Ve: 'Venus', Sa: 'Saturn', Ra: 'Rahu', Ke: 'Ketu',
  Ur: 'Uranus', Ne: 'Neptune', Pl: 'Pluto',
}

export const GRAHA_SANSKRIT: Record<GrahaId, string> = {
  Su: 'Sūrya', Mo: 'Chandra', Ma: 'Maṅgala', Me: 'Budha',
  Ju: 'Guru',  Ve: 'Śukra',   Sa: 'Śani',    Ra: 'Rāhu', Ke: 'Ketu',
  Ur: 'Aruṇa', Ne: 'Varuṇa', Pl: 'Yama',
}

// ── Rashi (Signs) ────────────────────────────────────────────

export type Rashi = 1|2|3|4|5|6|7|8|9|10|11|12

export const RASHI_NAMES: Record<Rashi, string> = {
  1:'Aries', 2:'Taurus', 3:'Gemini', 4:'Cancer',
  5:'Leo', 6:'Virgo', 7:'Libra', 8:'Scorpio',
  9:'Sagittarius', 10:'Capricorn', 11:'Aquarius', 12:'Pisces',
}

export const RASHI_SANSKRIT: Record<Rashi, string> = {
  1:'Meṣa', 2:'Vṛṣabha', 3:'Mithuna', 4:'Karka',
  5:'Siṃha', 6:'Kanyā', 7:'Tulā', 8:'Vṛścika',
  9:'Dhanu', 10:'Makara', 11:'Kumbha', 12:'Mīna',
}

export const RASHI_SHORT: Record<Rashi, string> = {
  1:'Ar', 2:'Ta', 3:'Ge', 4:'Cn',
  5:'Le', 6:'Vi', 7:'Li', 8:'Sc',
  9:'Sg', 10:'Cp', 11:'Aq', 12:'Pi',
}

// ── Nakshatra ────────────────────────────────────────────────

export type NakshatraIndex = 0|1|2|3|4|5|6|7|8|9|10|11|12|13|14|15|16|17|18|19|20|21|22|23|24|25|26

export const NAKSHATRA_NAMES: string[] = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira',
  'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha', 'Magha',
  'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati',
  'Vishakha', 'Anuradha', 'Jyeshtha', 'Mula', 'Purva Ashadha',
  'Uttara Ashadha', 'Shravana', 'Dhanishtha', 'Shatabhisha',
  'Purva Bhadra', 'Uttara Bhadra', 'Revati',
]

export const NAKSHATRA_SHORT: string[] = [
  'Aśw', 'Bha', 'Kṛt', 'Roh', 'Mṛg',
  'Ārd', 'Pun', 'Puṣ', 'Āśl', 'Mag',
  'PPh', 'UPh', 'Has', 'Cit', 'Swā',
  'Viś', 'Anu', 'Jye', 'Mūl', 'PAṣ',
  'UAṣ', 'Śra', 'Dha', 'Śat', 'PBh',
  'UBh', 'Rev',
]

// Nakshatra lord sequence (Vimshottari)
export const NAKSHATRA_LORDS: GrahaId[] = [
  'Ke','Ve','Su','Mo','Ma','Ra','Ju','Sa','Me', // 0-8
  'Ke','Ve','Su','Mo','Ma','Ra','Ju','Sa','Me', // 9-17
  'Ke','Ve','Su','Mo','Ma','Ra','Ju','Sa','Me', // 18-26
]

// ── Ayanamsha ─────────────────────────────────────────────────

export type AyanamshaMode =
  | 'lahiri'
  | 'true_chitra'
  | 'true_revati'
  | 'true_pushya'
  | 'raman'
  | 'usha_shashi'
  | 'yukteshwar'

export const AYANAMSHA_NAMES: Record<AyanamshaMode, string> = {
  lahiri:       'Lahiri (Chitrapaksha)',
  true_chitra:  'True Chitra',
  true_revati:  'True Revati',
  true_pushya:  'True Pushya',
  raman:        'Raman',
  usha_shashi:  'Usha-Shashi',
  yukteshwar:   'Yukteshwar',
}

// ── House Systems ────────────────────────────────────────────

export type HouseSystem = 'whole_sign' | 'placidus' | 'equal' | 'bhava_chalita'

export const HOUSE_SYSTEM_NAMES: Record<HouseSystem, string> = {
  whole_sign:    'Whole Sign',
  placidus:      'Placidus',
  equal:         'Equal House',
  bhava_chalita: 'Bhava Chalita',
}

// ── Node Mode ─────────────────────────────────────────────────

export type NodeMode = 'mean' | 'true'

// ── Karaka Scheme ────────────────────────────────────────────

export type KarakaScheme = 7 | 8

// ── Gulika Mode ──────────────────────────────────────────────

export type GulikaMode = 'begin' | 'middle' | 'end' | 'phaladipika'

// ── Dignity ──────────────────────────────────────────────────

export type Dignity =
  | 'exalted'
  | 'moolatrikona'
  | 'own'
  | 'great_friend'
  | 'friend'
  | 'neutral'
  | 'enemy'
  | 'great_enemy'
  | 'debilitated'

// ── Gandanta (Karmic Knots) ───────────────────────────────────

export type GandantaType = 'revati-ashwini' | 'ashlesha-magha' | 'jyeshtha-mula'

export type GandantaSeverity = 'exact' | 'near' | 'none'

export type GandantaPosition = 'end-of-water' | 'beginning-of-fire' | null

export interface GandantaResult {
  isGandanta: boolean
  type: GandantaType | null
  severity: GandantaSeverity
  position: GandantaPosition
  distanceFromJunction: number | null  // Degrees from exact gandanta point
  rashi: Rashi
  nakshatraIndex: number
  degreeInNakshatra: number
}

// ── Yuddha (Planetary War) ────────────────────────────────────

export interface YuddhaResult {
  isWarring: boolean
  planets: ['Me', 'Ve'] | []
  winner: 'Me' | 'Ve' | null
  loser: 'Me' | 'Ve' | null
  degreeDifference: number  // Distance between the two planets
  orb: number  // Max orb for war (1°)
}

// ── Puṣkara Aṃśa (Auspicious Degrees) ──────────────────────────

export type PushkaraType = 'pushkara_bhaga' | 'pushkara_navamsha'

export interface PushkaraResult {
  isPushkara: boolean
  type: PushkaraType | null
  zone: 1 | 2 | null
  rashi: Rashi
  degreeInSign: number
  navamsha: number
  isPushkaraNavamsha: boolean
  distanceFromCenter: number | null
  remedy: string | null
}

// ── Mṛtyu Bhāga (Death Degrees) ────────────────────────────────

export type MrityuSeverity = 'exact' | 'near' | 'wide' | 'none'

export interface MrityuBhagaResult {
  isMrityuBhaga: boolean
  severity: MrityuSeverity
  rashi: Rashi
  degreeInSign: number
  mrityuDegree: number
  distanceFromMrityu: number
  interpretation: string | null
  remedy: string | null
}

// ── Yogi Point System ──────────────────────────────────────────

export interface YogiPointResult {
  yogiPoint: number
  yogiRashi: Rashi
  yogiDegreeInSign: number
  yogiGraha: GrahaId
  
  sahayogiPoint: number
  sahayogiRashi: Rashi
  sahayogiDegreeInSign: number
  sahayogiGraha: GrahaId
  
  avayogiPoint: number
  avayogiRashi: Rashi
  avayogiDegreeInSign: number
  avayogiGraha: GrahaId
  
  interpretation: {
    yogi: string
    sahayogi: string
    avayogi: string
  }
  
  remedy: string
}

// ── Chart Settings ───────────────────────────────────────────

export type ChartStyle = 'south' | 'north' | 'circle' | 'sarvatobhadra'

export interface ChartSettings {
  ayanamsha:    AyanamshaMode
  houseSystem:  HouseSystem
  nodeMode:     NodeMode
  karakaScheme: KarakaScheme
  gulikaMode:   GulikaMode
  chartStyle:   ChartStyle
  showDegrees:  boolean
  showNakshatra:boolean
  showKaraka:   boolean
  showRetro:    boolean
}

export const DEFAULT_SETTINGS: ChartSettings = {
  ayanamsha:    'lahiri',
  houseSystem:  'whole_sign',
  nodeMode:     'true',
  karakaScheme: 8,
  gulikaMode:   'phaladipika',
  chartStyle:   'north',
  showDegrees:  false,
  showNakshatra:false,
  showKaraka:   false,
  showRetro:    true,
}

// ── Planet Position ──────────────────────────────────────────

export interface PlanetPosition {
  longitude:  number   // Tropical degrees 0–360
  latitude:   number
  distance:   number
  speed:      number   // degrees/day — negative = retrograde
  isRetro:    boolean
}

// ── Graha Data (full calculated) ─────────────────────────────

export interface GrahaData {
  id:           GrahaId
  name:         string
  lonTropical:  number
  lonSidereal:  number
  latitude:     number
  speed:        number
  isRetro:      boolean
  isCombust:    boolean
  rashi:        Rashi
  rashiName:    string
  degree:       number
  totalDegree:  number
  nakshatraIndex: number
  nakshatraName:  string
  pada:         number
  dignity:      Dignity
  avastha: {
    baladi:     string   // Bala, Kumara, Yuva, Vriddha, Mrita
    jagradadi:  string   // Jagrat, Swapna, Sushupti
  }
  charaKaraka:  string | null
  gandanta:     GandantaResult    // Karmic knot detection
  yuddha:       YuddhaResult      // Planetary war status
  pushkara:     PushkaraResult    // Auspicious degrees
  declination?: number
  mrityuBhaga:  MrityuBhagaResult // Death-inflicting degrees
  kp?: {
    signLord: GrahaId
    starLord: GrahaId
    subLord:  GrahaId
    subSubLord: GrahaId
  }
}

// ── Upagraha Data ────────────────────────────────────────────

export interface UpagrahaData {
  id:           string
  name:         string
  lonSidereal:  number
  rashi:        Rashi
  rashiName:    string
  degree:       number
  nakshatraName: string
  pada:         number
}

// ── Lagna Data ───────────────────────────────────────────────

export interface LagnaData {
  // Ascendant
  ascDegree:    number   // Sidereal degree 0–360
  ascRashi:     Rashi
  ascDegreeInRashi: number  // 0–30
  mcDegree?:     number   // Sidereal degree 0–360

  // Special Lagnas
  horaLagna:    number
  ghatiLagna:   number
  bhavaLagna:   number
  pranapada:    number
  sriLagna:     number
  varnadaLagna: number

  cusps:        number[]
}

// ── Nakshatra Info ───────────────────────────────────────────

export interface NakshatraInfo {
  index:   number   // 0–26
  name:    string
  pada:    number   // 1–4
  lord:    GrahaId
  degree:  number   // exact degree in nakshatra
}

// ── Panchang ─────────────────────────────────────────────────

export interface TithiInfo {
  number:   number   // 1–30
  name:     string
  paksha:   'shukla' | 'krishna'
  lord:     string
  endTime:  Date
}

export interface PanchangData {
  date:      string   // YYYY-MM-DD
  location:  { lat: number; lng: number; tz: string }
  vara:      { number: number; name: string; lord: GrahaId }
  tithi:     TithiInfo
  nakshatra: NakshatraInfo & { moonNakshatra: string }
  yoga:      { number: number; name: string; endTime: Date }
  karana:    { number: number; name: string; endTime: Date }
  sunrise:   Date
  sunset:    Date
  moonrise:  Date | null
  moonset:   Date | null
  rahuKalam:    { start: Date; end: Date }
  gulikaKalam:  { start: Date; end: Date }
  yamaganda:    { start: Date; end: Date }
  abhijitMuhurta: { start: Date; end: Date } | null
  horaTable: Array<{ lord: GrahaId; start: Date; end: Date }>
  sunLongitudeSidereal?: number
  moonLongitudeSidereal?: number
}

// ── Dasha ────────────────────────────────────────────────────

export type DashaSystem =
  | 'vimshottari'
  | 'yogini'
  | 'ashtottari'
  | 'chara'
  | 'narayana'
  | 'tithi_ashtottari'
  | 'naisargika'

export interface DashaNode {
  lord:       string
  label?:     string
  start:      Date
  end:        Date
  durationMs: number
  level:      number   // 1=Maha, 2=Antar, 3=Pratyantar, 4=Sukshma, 5=Prana, 6=Deha
  isCurrent:  boolean
  children:   DashaNode[]
}

// ── Arudha ───────────────────────────────────────────────────

export interface ArudhaData {
  // Bhava Arudhas
  AL:  Rashi; A2: Rashi; A3: Rashi; A4: Rashi;
  A5:  Rashi; A6: Rashi; A7: Rashi; A8: Rashi;
  A9:  Rashi; A10:Rashi; A11:Rashi; A12:Rashi;
  // Graha Arudhas
  grahaArudhas:  Record<GrahaId, Rashi>
  suryaArudhas:  Record<string, Rashi>
  chandraArudhas:Record<string, Rashi>
}

// ── Karaka ───────────────────────────────────────────────────

export interface KarakaData {
  scheme: KarakaScheme
  AK:  GrahaId   // Atmakaraka
  AmK: GrahaId   // Amatyakaraka
  BK:  GrahaId   // Bhratrukaraka
  MK:  GrahaId   // Matrukaraka
  PK:  GrahaId   // Pitrukaraka
  GK:  GrahaId   // Gnatikaraka
  DK:  GrahaId   // Darakaraka
  PiK: GrahaId | null  // Putrikaraka (8-scheme only)
}

// ── Full Chart Output ────────────────────────────────────────

export interface ChartOutput {
  meta: {
    name:      string
    birthDate: string
    birthTime: string
    birthPlace:string
    latitude:  number
    longitude: number
    timezone:  string
    settings:  ChartSettings
    calculatedAt: Date
    ayanamshaValue: number
    julianDay:    number
  }
  grahas:    GrahaData[]
  lagnas:    LagnaData
  arudhas:   ArudhaData
  karakas:   KarakaData
  vargas:      Record<string, GrahaData[]>  // D1, D9, D60, etc. — planet rashis per varga
  vargaLagnas: Record<string, Rashi>          // ascendant sign in each varga chart
  dashas:    Record<DashaSystem, DashaNode[]>
  panchang:  PanchangData
  upagrahas: Record<string, UpagrahaData>
  shadbala:  ShadbalaResult
  vimsopaka: import('@/lib/engine/vimsopaka').VimsopakaBalaResult
  bhavaBala?: BhavaBalaResult
  ashtakavarga?: AshtakavargaResult
  yogas?:        YogaResult[]
  interpretation: ChartInterpretation
  kp?: {
    significators: KPSignificatorResult
    cusps:         KPCuspalInterlink[]
    rulingPlanets: KPRulingPlanets
  }
  yogiPoint:    YogiPointResult  // Yogi/Sahayogi/Avayogi points for prosperity analysis
  varshaphal?: {
    returnYear: number
    munthaRashi: number
    completedAge: number
    tajikaYogas: any[]
  }
}

// ── Chart Interpretation ───────────────────────────────────────

export type InterpretationTone = 'supportive' | 'caution' | 'mixed'
export type InterpretationCategory = 'strength' | 'vulnerability' | 'special' | 'summary'

export interface InterpretationInsight {
  id: string
  title: string
  message: string
  tone: InterpretationTone
  category: InterpretationCategory
  priority: number // Higher means shown earlier
  relatedGrahas: GrahaId[]
  house?: number
  actions?: string[]
}

export interface ChartInterpretation {
  headline: string
  strengths: InterpretationInsight[]
  cautions: InterpretationInsight[]
  special: InterpretationInsight[]
  topInsights: InterpretationInsight[]
}

// ── Vimsopaka Bala ──────────────────────────────────────────

export interface VimsopakaSchemeResult {
  scores: Record<GrahaId, number>
  total: number
}

export interface VimsopakaResult {
  shadvarga:      Record<GrahaId, number>
  saptavarga:     Record<GrahaId, number>
  dashavarga:     Record<GrahaId, number>
  shodashavarga:  Record<GrahaId, number>
}


// ── Ashtakavarga ─────────────────────────────────────────────

export interface PlanetBAV {
  planet:   string
  bindus:   number[]
  total:    number
}

export interface AshtakavargaResult {
  bav:      Record<string, PlanetBAV>
  sav:      number[]
  savTotal: number
}

// ── Shadbala ─────────────────────────────────────────────────

export interface ShadbalaPlanet {
  id:             string
  sthanaBala:     number
  digBala:        number
  kalaBala:       number
  chestaBala:     number
  naisargikaBala: number
  drikBala:       number
  total:          number
  totalShash:     number
  required:       number
  ratio:          number
  isStrong:       boolean
  details?: {
    sthana?: {
      uccha: number
      saptavargaja: number
      ojhayugma: number
      kendradi: number
      drekkana: number
    }
    dig?: {
      targetDegree: number
      angularDistance: number
    }
    kala?: {
      natha: number
      paksha: number
      tribhaga: number
      vaara: number
      ayana: number
      isDayBirth: boolean
    }
    chesta?: {
      method: 'retrograde' | 'luminary_constant' | 'speed_ratio' | 'sun_ayana' | 'moon_paksha'
      speedAbs: number
      meanSpeed: number
    }
    drik?: {
      benefic: number
      malefic: number
      net: number
    }
  }
}

export interface ShadbalaResult {
  planets:   Record<string, ShadbalaPlanet>
  strongest: string
  weakest:   string
}

// ── Bhava Bala (House Strength) ────────────────────────────────

export interface BhavaBalaHouse {
  house:            number  // 1-12
  rashi:            Rashi
  adhipatiBala:     number  // Shadbala total of the house lord
  digBala:          number  // Directional strength of the house (0-60)
  drishtiBala:      number  // Aspectual strength on the house center
  totalShash:       number  // Total in Shashtiamsas
  totalRupa:        number  // Total in Rupas (Shash / 60)
  isStrong:         boolean
}

export interface BhavaBalaResult {
  houses:           Record<number, BhavaBalaHouse>
  strongestHouse:   number
  weakestHouse:     number
}

// ── Graha Yogas ───────────────────────────────────────────────

export type YogaCategory = 'raja' | 'dhana' | 'mahapurusha' | 'viparita' | 'special' | 'lunar'

export interface YogaResult {
  name:        string
  sanskrit:    string
  category:    YogaCategory
  strength:    'strong' | 'moderate' | 'weak'
  planets:     string[]
  houses:      number[]
  description: string
  effect:      string
}

// ── User Plan ────────────────────────────────────────────────

export type UserPlan = 'free' | 'gold' | 'platinum'

export const PLAN_LIMITS: Record<UserPlan, { charts: number; vargas: string[]; dashas: string[] }> = {
  free: {
    charts: 20,  // save up to 20 (see CHART_SAVE_LIMITS)
    vargas: ['all'],
    dashas: ['vimshottari'],
  },
  gold: {
    charts: 200,
    vargas: ['all'],
    dashas: ['vimshottari','ashtottari'],
  },
  platinum: {
    charts: Infinity,
    vargas: ['all'],  // all 41 schemes
    dashas: ['all'],  // all 30+ systems
  },
}
// -- KP System ------------------------------------------------

export interface KPSignificatorLevels {
  A: GrahaId[]
  B: GrahaId[]
  C: GrahaId[]
  D: GrahaId[]
}

export interface KPSignificatorResult {
  houseSignificators: Record<number, KPSignificatorLevels>
  planetSignificators: Record<string, number[]>
}

export interface KPCuspalInterlink {
  house:     number
  signLord:  GrahaId
  starLord:  GrahaId
  subLord:   GrahaId
  subSubLord:GrahaId
  degree:    number
  rashi:     Rashi
}

export interface KPRulingPlanets {
  dayLord:   GrahaId
  moonStarLord: GrahaId
  moonSignLord: GrahaId
  lagnaStarLord: GrahaId
  lagnaSignLord: GrahaId
}
