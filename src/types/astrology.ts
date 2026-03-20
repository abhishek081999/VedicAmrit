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
  Ur: 'Aruṇa', Ne: 'Varuṇa', Pl: 'Yama'
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
  bhava_chalita: 'Bhava Chalita (Sripati)',
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

// ── Chart Settings ───────────────────────────────────────────

export type ChartStyle = 'south' | 'north' | 'east' | 'circle' | 'bhava' | 'bhava_chalita' | 'sarvatobhadra'

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
  nodeMode:     'mean',
  karakaScheme: 8,
  gulikaMode:   'phaladipika',
  chartStyle:   'south',
  showDegrees:  true,
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
}

// ── Lagna Data ───────────────────────────────────────────────

export interface LagnaData {
  // Ascendant
  ascDegree:    number   // Sidereal degree 0–360
  ascRashi:     Rashi
  ascDegreeInRashi: number  // 0–30

  // Special Lagnas
  horaLagna:    number
  ghatiLagna:   number
  bhavaLagna:   number
  pranapada:    number
  sriLagna:     number
  varnadaLagna: number

  // House cusps (12 values, sidereal degrees)
  cusps:        number[]

  // Bhava Chalita cusps (if applicable)
  bhavalCusps:  number[]
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
  | 'yogini'

export interface DashaNode {
  lord:       string
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
  upagrahas: Record<string, GrahaData>
}

// ── User Plan ────────────────────────────────────────────────

export type UserPlan = 'kala' | 'vela' | 'hora'

export const PLAN_LIMITS: Record<UserPlan, { charts: number; vargas: string[]; dashas: string[] }> = {
  kala: {
    charts: 0,  // no save
    vargas: ['D1','D9','D60'],
    dashas: ['vimshottari'],
  },
  vela: {
    charts: 1008,
    vargas: ['D1','D2','D3','D4','D7','D9','D10','D12','D16','D20','D24','D27','D30','D40','D45','D60'],
    dashas: ['vimshottari','ashtottari'],
  },
  hora: {
    charts: 10008,
    vargas: ['all'],  // all 41 schemes
    dashas: ['all'],  // all 30+ systems
  },
}