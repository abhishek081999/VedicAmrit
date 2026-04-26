/**
 * src/lib/engine/sbcUseCases.ts
 * ─────────────────────────────────────────────────────────────
 * Sarvatobhadra Chakra — Life Advisor Use-Case Engine
 *
 * Covers 14 life-area categories with 200+ specific use cases.
 * Each use case maps to:
 *   positive  — transit planets that must NOT be under malefic vedha
 *   critical  — at least one must be under benefic vedha or unafflicted
 *   avoidIf   — these planets' STRONG malefic vedha triggers an Avoid verdict
 *
 * Assessment uses the VedhaResult[] from analyzeSBC() to score
 * each use case against the day's transit positions.
 */

import type { GrahaId } from '@/types/astrology'
import type { VedhaResult, SBCGrahaInput } from './sarvatobhadra'
import { nakFromLon } from './sarvatobhadra'

// ─────────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────────

export type UseCaseVerdict = 'excellent' | 'good' | 'neutral' | 'caution' | 'avoid'

export interface SBCUseCase {
  id:       string
  cat:      string         // category id
  label:    string         // display label
  /** Planets that must be free of malefic vedha for a positive verdict */
  positive: GrahaId[]
  /** Planets whose malefic affliction directly triggers a warning */
  avoid:    GrahaId[]
  note?:    string         // Classical rule hint
}

export interface UseCaseCategory {
  id:     string
  icon:   string
  label:  string
  color:  string
}

export interface UseCaseResult extends SBCUseCase {
  verdict:       UseCaseVerdict
  score:         number          // 0–100
  positiveCount: number
  afflictedCount:number
  reasons:       string[]
}

// ─────────────────────────────────────────────────────────────
//  Categories (14)
// ─────────────────────────────────────────────────────────────

export const USE_CASE_CATEGORIES: UseCaseCategory[] = [
  { id: 'health',    icon: '🏥', label: 'Health',          color: '#e84040' },
  { id: 'marriage',  icon: '💍', label: 'Marriage',         color: '#FF69B4' },
  { id: 'children',  icon: '👶', label: 'Children',         color: '#48C774' },
  { id: 'education', icon: '📚', label: 'Education',        color: '#3B82F6' },
  { id: 'career',    icon: '💼', label: 'Career',           color: '#FF8C00' },
  { id: 'business',  icon: '🏢', label: 'Business',         color: '#FFD700' },
  { id: 'finance',   icon: '💰', label: 'Finance',          color: '#4db66a' },
  { id: 'property',  icon: '🏠', label: 'Property',         color: '#8B9DC3' },
  { id: 'travel',    icon: '✈️', label: 'Travel',           color: '#00CED1' },
  { id: 'legal',     icon: '⚖️', label: 'Legal',            color: '#9B59B6' },
  { id: 'spiritual', icon: '🙏', label: 'Spiritual',        color: '#A3C65A' },
  { id: 'modern',    icon: '📱', label: 'Modern / Tech',    color: '#48C774' },
  { id: 'arts',      icon: '🎭', label: 'Arts & Sports',    color: '#FF69B4' },
  { id: 'prashna',   icon: '🔮', label: 'Prashna Q&A',      color: '#c9a84c' },
]

// ─────────────────────────────────────────────────────────────
//  Complete Use Case Database (200+ entries)
// ─────────────────────────────────────────────────────────────

export const USE_CASES: SBCUseCase[] = [
  // ── HEALTH (15) ────────────────────────────────────────────
  { id:'h1',  cat:'health', label:'Surgery Success',           positive:['Ma','Mo'], avoid:['Ra','Sa'],     note:'Mars favorable, Moon not afflicted' },
  { id:'h2',  cat:'health', label:'Disease Recovery Timing',   positive:['Mo','Su'], avoid:['Ra','Ke'],     note:'Moon nakshatra clear of malefics' },
  { id:'h3',  cat:'health', label:'Medicine / Treatment Right',positive:['Me','Mo'], avoid:['Ra','Sa'],     note:'Mercury positive for proper diagnosis' },
  { id:'h4',  cat:'health', label:'Patient Recovery Outlook',  positive:['Su','Mo'], avoid:['Sa','Ra'],     note:'Sun & Moon both must be positive' },
  { id:'h5',  cat:'health', label:'Best Time for Operation',   positive:['Ma'],      avoid:['Sa','Ra'],     note:'Mars favorable, Moon unafflicted' },
  { id:'h6',  cat:'health', label:'Mental Health Recovery',    positive:['Mo'],      avoid:['Ra','Ke'],     note:'Moon free from Rahu/Ketu vedha' },
  { id:'h7',  cat:'health', label:'Chronic Disease Duration',  positive:['Su','Mo'], avoid:['Sa'],          note:'Saturn vedha prolongs illness' },
  { id:'h8',  cat:'health', label:'Eye Treatment Timing',      positive:['Su'],      avoid:['Ra','Sa'],     note:'Sun nakshatra must be clear' },
  { id:'h9',  cat:'health', label:'Pregnancy & Safe Delivery', positive:['Mo','Ve'], avoid:['Ma','Ra'],     note:'Moon and Venus must be unafflicted' },
  { id:'h10', cat:'health', label:'Start Medicine Timing',     positive:['Me','Mo'], avoid:['Ra','Ke'],     note:'Mercury and Moon favorable' },
  { id:'h11', cat:'health', label:'Hospital Admission',        positive:['Mo'],      avoid:['Ra','Ma','Sa'],note:'Moon must be positive' },
  { id:'h12', cat:'health', label:'Bone & Joint Treatment',    positive:['Sa','Me'], avoid:['Ra','Ma'],     note:'Saturn check for bones' },
  { id:'h13', cat:'health', label:'Heart Treatment Timing',    positive:['Su'],      avoid:['Ra','Sa'],     note:'Sun governs heart vitality' },
  { id:'h14', cat:'health', label:'Dental Treatment',          positive:['Sa','Ma'], avoid:['Ra'],          note:'Saturn rules teeth and bones' },
  { id:'h15', cat:'health', label:'Skin Disease Treatment',    positive:['Me','Ve'], avoid:['Sa','Ra'],     note:'Mercury and Venus for skin' },

  // ── MARRIAGE (15) ──────────────────────────────────────────
  { id:'m1',  cat:'marriage', label:'Best Marriage Date',         positive:['Ve','Mo','Ju'], avoid:['Sa','Ma','Ra'], note:'Venus, Moon, Jupiter all positive' },
  { id:'m2',  cat:'marriage', label:'Marriage Happiness Outlook', positive:['Ve'],           avoid:['Sa','Ra'],      note:'Venus must be strong and unafflicted' },
  { id:'m3',  cat:'marriage', label:'Marriage Delay Reason',      positive:['Ve','Mo'],      avoid:['Sa','Ra'],      note:'Saturn/Rahu vedha on Venus causes delay' },
  { id:'m4',  cat:'marriage', label:'Compatibility Assessment',   positive:['Mo'],           avoid:['Sa','Ra'],      note:'Moon (emotions) must be harmonious' },
  { id:'m5',  cat:'marriage', label:'Engagement Ceremony',        positive:['Ve','Ju'],      avoid:['Sa','Ma'],      note:'Venus and Jupiter favorable' },
  { id:'m6',  cat:'marriage', label:'Second Marriage Timing',     positive:['Ve','Mo'],      avoid:['Sa','Ra','Ke'], note:'Venus and Moon must be clear' },
  { id:'m7',  cat:'marriage', label:'Marital Problem Period',     positive:['Ve'],           avoid:['Ma','Sa'],      note:'Venus afflicted signals problems' },
  { id:'m8',  cat:'marriage', label:'Divorce Possibility',        positive:['Ve','Ju'],      avoid:['Ma','Sa'],      note:'Mars/Saturn on 7th nakshatra' },
  { id:'m9',  cat:'marriage', label:'Honeymoon Travel Timing',    positive:['Mo','Ve'],      avoid:['Ra','Sa'],      note:'Moon and Venus positive' },
  { id:'m10', cat:'marriage', label:'Wedding Function Timing',    positive:['Ju','Ve'],      avoid:['Sa','Ra','Ma'], note:'Jupiter and Venus favorable' },
  { id:'m11', cat:'marriage', label:'Marital Harmony Period',     positive:['Ve'],           avoid:['Ma','Sa','Ra'], note:'Venus free from malefics' },
  { id:'m12', cat:'marriage', label:'Reconciliation After Separation',positive:['Ve','Mo'],  avoid:['Sa','Ma'],      note:'Venus and Moon positive' },
  { id:'m13', cat:'marriage', label:'Love Marriage Success',      positive:['Ve','Ma'],      avoid:['Sa','Ra'],      note:'Venus and Mars both positive' },
  { id:'m14', cat:'marriage', label:'Arranged Marriage Success',  positive:['Ju','Ve'],      avoid:['Sa','Ra','Ma'], note:'Jupiter and Venus positive' },
  { id:'m15', cat:'marriage', label:'Spouse Health Prediction',   positive:['Ve','Mo'],      avoid:['Ra','Sa'],      note:'Venus and Moon check' },

  // ── CHILDREN (10) ──────────────────────────────────────────
  { id:'c1',  cat:'children', label:'Best Time to Conceive',      positive:['Ju','Mo'],      avoid:['Sa','Ra','Ma'], note:'Jupiter and Moon must be favorable' },
  { id:'c2',  cat:'children', label:'Child Birth Timing',         positive:['Mo','Ju'],      avoid:['Sa','Ma','Ra'], note:'Moon and Jupiter favorable' },
  { id:'c3',  cat:'children', label:'Child Health Prediction',    positive:['Mo','Ju'],      avoid:['Sa','Ra'],      note:'Moon and Jupiter check' },
  { id:'c4',  cat:'children', label:'Naming Ceremony Timing',     positive:['Mo','Me'],      avoid:['Ra','Sa'],      note:'Moon and Mercury positive' },
  { id:'c5',  cat:'children', label:'Child Education Success',    positive:['Me','Ju'],      avoid:['Sa','Ra'],      note:'Mercury and Jupiter positive' },
  { id:'c6',  cat:'children', label:'First School Day',           positive:['Me'],           avoid:['Ra','Sa'],      note:'Mercury must be favorable' },
  { id:'c7',  cat:'children', label:'Child Surgery Timing',       positive:['Ma','Mo'],      avoid:['Sa','Ra'],      note:'Mars not afflicting child nakshatra' },
  { id:'c8',  cat:'children', label:'Child Travel Safety',        positive:['Mo'],           avoid:['Ra','Ma','Sa'], note:'Moon positive for safe journey' },
  { id:'c9',  cat:'children', label:'Adoption Timing',            positive:['Ju','Mo'],      avoid:['Sa','Ra'],      note:'Jupiter and Moon positive' },
  { id:'c10', cat:'children', label:'Children Problem Period',     positive:['Ju'],           avoid:['Sa','Ra','Ma'], note:'Jupiter afflicted signals problems' },

  // ── EDUCATION (10) ─────────────────────────────────────────
  { id:'e1',  cat:'education', label:'Exam Success Prediction',   positive:['Me','Ju'],      avoid:['Sa','Ra'],      note:'Mercury and Jupiter must be clear' },
  { id:'e2',  cat:'education', label:'Start Studies / Enrollment',positive:['Me'],           avoid:['Ra','Ke'],      note:'Mercury favorable' },
  { id:'e3',  cat:'education', label:'Competitive Exam Timing',   positive:['Me','Ma'],      avoid:['Sa','Ra'],      note:'Mercury and Mars for competition' },
  { id:'e4',  cat:'education', label:'Study Abroad Timing',       positive:['Ju','Ra'],      avoid:['Sa','Ke'],      note:'Jupiter and Rahu for foreign education' },
  { id:'e5',  cat:'education', label:'Course / Subject Selection', positive:['Me','Ju'],     avoid:['Sa'],           note:'Mercury and Jupiter check' },
  { id:'e6',  cat:'education', label:'Scholarship Success',       positive:['Ju'],           avoid:['Sa','Ra'],      note:'Jupiter must be strong' },
  { id:'e7',  cat:'education', label:'Interview / Viva Success',  positive:['Me','Su'],      avoid:['Sa','Ra'],      note:'Mercury and Sun positive' },
  { id:'e8',  cat:'education', label:'Result / Grade Prediction', positive:['Me'],           avoid:['Sa','Ra'],      note:'Mercury nakshatra check' },
  { id:'e9',  cat:'education', label:'Research Project Success',  positive:['Ke','Me'],      avoid:['Ra','Sa'],      note:'Ketu and Mercury for deep research' },
  { id:'e10', cat:'education', label:'Graduation Ceremony',       positive:['Ju','Me'],      avoid:['Sa','Ra'],      note:'Jupiter and Mercury positive' },

  // ── CAREER (15) ────────────────────────────────────────────
  { id:'j1',  cat:'career', label:'Job Interview Timing',         positive:['Me','Su'],      avoid:['Sa','Ra'],      note:'Mercury and Sun must be favorable' },
  { id:'j2',  cat:'career', label:'Job Offer Acceptance',         positive:['Me','Ju'],      avoid:['Sa','Ra'],      note:'Mercury and Jupiter favorable' },
  { id:'j3',  cat:'career', label:'Career Change Timing',         positive:['Su','Me'],      avoid:['Sa','Ra'],      note:'Sun and Mercury positive' },
  { id:'j4',  cat:'career', label:'Promotion Prediction',         positive:['Su','Ju'],      avoid:['Sa','Ra'],      note:'Sun nakshatra must be positive' },
  { id:'j5',  cat:'career', label:'Government Job Success',       positive:['Su','Ju'],      avoid:['Sa','Ra'],      note:'Sun and Jupiter positive' },
  { id:'j6',  cat:'career', label:'Job Loss Risk',                positive:['Su'],           avoid:['Sa','Ra'],      note:'Saturn/Rahu on Sun nakshatra signals risk' },
  { id:'j7',  cat:'career', label:'New Job Start Date',           positive:['Me','Ju'],      avoid:['Sa','Ra'],      note:'Mercury and Jupiter favorable' },
  { id:'j8',  cat:'career', label:'Authority / Boss Relations',   positive:['Su'],           avoid:['Sa','Ra'],      note:'Sun positive for hierarchy harmony' },
  { id:'j9',  cat:'career', label:'Salary Increment Timing',      positive:['Ju','Su'],      avoid:['Sa','Ra'],      note:'Jupiter and Sun positive' },
  { id:'j10', cat:'career', label:'Work Abroad Timing',           positive:['Ra','Ju'],      avoid:['Sa','Ke'],      note:'Rahu and Jupiter check for foreign work' },
  { id:'j11', cat:'career', label:'Retirement Timing',            positive:['Su','Sa'],      avoid:['Ra'],           note:'Saturn and Sun check' },
  { id:'j12', cat:'career', label:'Political Career Success',     positive:['Su','Ju'],      avoid:['Sa','Ra'],      note:'Sun and Jupiter positive' },
  { id:'j13', cat:'career', label:'Military / Police Career',     positive:['Ma','Su'],      avoid:['Ra','Ke'],      note:'Mars and Sun positive' },
  { id:'j14', cat:'career', label:'Teaching Career Timing',       positive:['Ju','Me'],      avoid:['Sa','Ra'],      note:'Jupiter and Mercury positive' },
  { id:'j15', cat:'career', label:'Transfer Prediction',          positive:['Sa','Mo'],      avoid:['Ra'],           note:'Saturn and Moon for relocation' },

  // ── BUSINESS (15) ──────────────────────────────────────────
  { id:'b1',  cat:'business', label:'Business Start Timing',      positive:['Me','Ju'],      avoid:['Sa','Ra'],      note:'Mercury and Jupiter both positive' },
  { id:'b2',  cat:'business', label:'Business Partnership',       positive:['Me','Ve'],      avoid:['Sa','Ra','Ma'], note:'Mercury and Venus check' },
  { id:'b3',  cat:'business', label:'Shop / Office Opening',      positive:['Me','Ju'],      avoid:['Sa','Ra'],      note:'Mercury and Jupiter favorable' },
  { id:'b4',  cat:'business', label:'Product / Brand Launch',     positive:['Me','Ve'],      avoid:['Sa','Ra'],      note:'Mercury and Venus positive' },
  { id:'b5',  cat:'business', label:'Business Expansion',         positive:['Ju','Me'],      avoid:['Sa','Ra'],      note:'Jupiter and Mercury positive' },
  { id:'b6',  cat:'business', label:'Company Registration',       positive:['Me','Ju'],      avoid:['Sa','Ra'],      note:'Mercury and Jupiter positive' },
  { id:'b7',  cat:'business', label:'Deal / Contract Signing',    positive:['Me'],           avoid:['Sa','Ra'],      note:'Mercury must be favorable' },
  { id:'b8',  cat:'business', label:'Business Merger Timing',     positive:['Ju','Me'],      avoid:['Sa','Ra'],      note:'Jupiter and Mercury positive' },
  { id:'b9',  cat:'business', label:'Export Business Timing',     positive:['Me','Ra'],      avoid:['Sa','Ke'],      note:'Mercury and Rahu for international' },
  { id:'b10', cat:'business', label:'Online Business Start',      positive:['Me','Ra'],      avoid:['Sa','Ke'],      note:'Mercury and Rahu positive' },
  { id:'b11', cat:'business', label:'Franchise Business',         positive:['Ju','Me'],      avoid:['Sa','Ra'],      note:'Jupiter and Mercury positive' },
  { id:'b12', cat:'business', label:'Business Travel Timing',     positive:['Me','Mo'],      avoid:['Ra','Sa'],      note:'Mercury and Moon positive' },
  { id:'b13', cat:'business', label:'Business Closure / Pivot',   positive:['Sa','Me'],      avoid:['Ra','Ke'],      note:'Saturn and Mercury check' },
  { id:'b14', cat:'business', label:'Import Business Timing',     positive:['Me','Ju'],      avoid:['Sa','Ke'],      note:'Mercury and Jupiter positive' },
  { id:'b15', cat:'business', label:'Advertising / Marketing',    positive:['Ve','Me'],      avoid:['Sa','Ra'],      note:'Venus and Mercury for outreach' },

  // ── FINANCE (15) ───────────────────────────────────────────
  { id:'f1',  cat:'finance', label:'Investment Timing',           positive:['Ju','Ve'],      avoid:['Sa','Ra','Ke'], note:'Jupiter and Venus must be positive' },
  { id:'f2',  cat:'finance', label:'Stock Market Entry',          positive:['Me','Ju'],      avoid:['Sa','Ra'],      note:'Mercury and Jupiter favorable' },
  { id:'f3',  cat:'finance', label:'Property Purchase',           positive:['Ma','Ju'],      avoid:['Sa','Ra'],      note:'Mars and Jupiter positive' },
  { id:'f4',  cat:'finance', label:'Gold / Silver Purchase',      positive:['Ve','Ju'],      avoid:['Sa','Ra'],      note:'Venus and Jupiter positive' },
  { id:'f5',  cat:'finance', label:'Loan Taking Timing',          positive:['Ju'],           avoid:['Sa','Ra'],      note:'Jupiter positive, Saturn weak' },
  { id:'f6',  cat:'finance', label:'Loan Repayment Timing',       positive:['Ju','Sa'],      avoid:['Ra'],           note:'Jupiter and Saturn check' },
  { id:'f7',  cat:'finance', label:'Bank Deposit / FD Timing',    positive:['Ju','Sa'],      avoid:['Ra','Ke'],      note:'Jupiter and Saturn positive' },
  { id:'f8',  cat:'finance', label:'Mutual Fund Investment',      positive:['Ju','Me'],      avoid:['Sa','Ra'],      note:'Jupiter and Mercury positive' },
  { id:'f9',  cat:'finance', label:'Insurance Purchase',          positive:['Sa','Ju'],      avoid:['Ra','Ke'],      note:'Saturn and Jupiter positive' },
  { id:'f10', cat:'finance', label:'Jewellery Purchase',          positive:['Ve','Ju'],      avoid:['Sa','Ra'],      note:'Venus and Jupiter positive' },
  { id:'f11', cat:'finance', label:'Financial Loss Risk',         positive:['Ju'],           avoid:['Sa','Ra','Ke'], note:'Jupiter afflicted signals losses' },
  { id:'f12', cat:'finance', label:'Debt Clearance Timing',       positive:['Ju','Sa'],      avoid:['Ra','Ke'],      note:'Jupiter and Saturn positive' },
  { id:'f13', cat:'finance', label:'Sudden Wealth / Windfall',    positive:['Ra','Ju'],      avoid:['Sa','Ke'],      note:'Rahu and Jupiter positive' },
  { id:'f14', cat:'finance', label:'Crypto / Speculation',        positive:['Ra','Ju'],      avoid:['Sa','Ke'],      note:'Rahu and Jupiter check carefully' },
  { id:'f15', cat:'finance', label:'Financial Recovery Period',   positive:['Ju'],           avoid:['Sa','Ra'],      note:'Jupiter nakshatra must be clear' },

  // ── PROPERTY (15) ──────────────────────────────────────────
  { id:'p1',  cat:'property', label:'House Construction Start',   positive:['Ma','Sa'],      avoid:['Ra','Ke'],      note:'Mars and Saturn positive' },
  { id:'p2',  cat:'property', label:'Foundation / Bhoomi Puja',   positive:['Ma','Sa'],      avoid:['Ra','Ke'],      note:'Mars and Saturn favorable' },
  { id:'p3',  cat:'property', label:'House Purchase Timing',      positive:['Ma','Ju'],      avoid:['Sa','Ra'],      note:'Mars and Jupiter positive' },
  { id:'p4',  cat:'property', label:'Griha Pravesh / House Entry',positive:['Mo','Ju'],      avoid:['Sa','Ma','Ra'], note:'Moon and Jupiter positive' },
  { id:'p5',  cat:'property', label:'House Sale Timing',          positive:['Ma','Me'],      avoid:['Sa','Ra'],      note:'Mars and Mercury positive' },
  { id:'p6',  cat:'property', label:'Property Dispute Result',    positive:['Ma','Ju'],      avoid:['Sa','Ra'],      note:'Mars and Jupiter check' },
  { id:'p7',  cat:'property', label:'Rent Agreement Signing',     positive:['Me','Sa'],      avoid:['Ra','Ma'],      note:'Mercury and Saturn positive' },
  { id:'p8',  cat:'property', label:'Land Purchase Timing',       positive:['Ma','Sa'],      avoid:['Ra','Ke'],      note:'Mars and Saturn positive' },
  { id:'p9',  cat:'property', label:'Building Renovation',        positive:['Ma','Sa'],      avoid:['Ra','Ke'],      note:'Mars and Saturn positive' },
  { id:'p10', cat:'property', label:'Office Relocation',          positive:['Me','Ju'],      avoid:['Sa','Ra'],      note:'Mercury and Jupiter positive' },
  { id:'p11', cat:'property', label:'Warehouse / Factory Setup',  positive:['Ma','Sa'],      avoid:['Ra','Ke'],      note:'Mars and Saturn positive' },
  { id:'p12', cat:'property', label:'Shop Purchase Timing',       positive:['Me','Ma'],      avoid:['Sa','Ra'],      note:'Mercury and Mars positive' },
  { id:'p13', cat:'property', label:'Vehicle Purchase',           positive:['Ve','Me'],      avoid:['Sa','Ra'],      note:'Venus and Mercury positive' },
  { id:'p14', cat:'property', label:'Agriculture Land Start',     positive:['Mo','Ma'],      avoid:['Sa','Ra'],      note:'Moon and Mars positive' },
  { id:'p15', cat:'property', label:'Interior / Vastu Work',      positive:['Ma','Me'],      avoid:['Sa','Ra'],      note:'Mars and Mercury positive' },

  // ── TRAVEL (15) ────────────────────────────────────────────
  { id:'t1',  cat:'travel', label:'Safe Travel Timing',           positive:['Mo'],           avoid:['Ra','Ke','Ma'], note:'Moon must not be afflicted' },
  { id:'t2',  cat:'travel', label:'Air Travel Safety',            positive:['Mo','Me'],      avoid:['Ra','Ke'],      note:'Moon and Rahu check' },
  { id:'t3',  cat:'travel', label:'Sea Voyage Timing',            positive:['Mo','Ve'],      avoid:['Ra','Ma'],      note:'Moon and Venus positive' },
  { id:'t4',  cat:'travel', label:'Foreign Trip Timing',          positive:['Ra','Ju'],      avoid:['Sa','Ke'],      note:'Rahu and Jupiter positive' },
  { id:'t5',  cat:'travel', label:'Business Travel Timing',       positive:['Me','Mo'],      avoid:['Sa','Ra'],      note:'Mercury positive' },
  { id:'t6',  cat:'travel', label:'Religious Pilgrimage',         positive:['Ju','Su'],      avoid:['Sa','Ra'],      note:'Jupiter and Sun positive' },
  { id:'t7',  cat:'travel', label:'Adventure / Trekking',         positive:['Ma','Mo'],      avoid:['Ra','Sa'],      note:'Mars and Moon positive' },
  { id:'t8',  cat:'travel', label:'Return Journey Safety',        positive:['Mo'],           avoid:['Ra','Ma'],      note:'Moon positive for safe return' },
  { id:'t9',  cat:'travel', label:'Relocation to New City',       positive:['Sa','Mo'],      avoid:['Ra','Ke'],      note:'Saturn and Moon positive' },
  { id:'t10', cat:'travel', label:'Immigration / Visa Approval',  positive:['Ju','Ra'],      avoid:['Sa','Ke'],      note:'Jupiter and Rahu positive' },
  { id:'t11', cat:'travel', label:'Travel Accident Risk',         positive:['Mo','Ma'],      avoid:['Ra','Ke'],      note:'Mars and Rahu on Moon nakshatra = risk' },
  { id:'t12', cat:'travel', label:'Hotel / Accommodation',        positive:['Mo','Ve'],      avoid:['Ra','Sa'],      note:'Moon and Venus positive' },
  { id:'t13', cat:'travel', label:'Road Trip Safety',             positive:['Mo','Ma'],      avoid:['Ra','Sa'],      note:'Mars and Moon check' },
  { id:'t14', cat:'travel', label:'Study Abroad Journey',         positive:['Ju','Mo'],      avoid:['Sa','Ra'],      note:'Jupiter and Moon positive' },
  { id:'t15', cat:'travel', label:'Medical Travel Abroad',        positive:['Mo','Ju'],      avoid:['Ra','Sa'],      note:'Moon and Jupiter positive' },

  // ── LEGAL (15) ─────────────────────────────────────────────
  { id:'l1',  cat:'legal', label:'Court Case Verdict',            positive:['Ju','Su'],      avoid:['Sa','Ra'],      note:'Jupiter and Sun positive' },
  { id:'l2',  cat:'legal', label:'Legal Document Signing',        positive:['Me','Ju'],      avoid:['Sa','Ra'],      note:'Mercury and Jupiter positive' },
  { id:'l3',  cat:'legal', label:'Police Complaint Timing',       positive:['Ma','Su'],      avoid:['Ra','Ke'],      note:'Mars and Sun positive' },
  { id:'l4',  cat:'legal', label:'Bail Application',              positive:['Ju','Sa'],      avoid:['Ra','Ke'],      note:'Jupiter and Saturn check' },
  { id:'l5',  cat:'legal', label:'Lawyer Appointment',            positive:['Ju','Me'],      avoid:['Sa','Ra'],      note:'Jupiter and Mercury positive' },
  { id:'l6',  cat:'legal', label:'Settlement Negotiation',        positive:['Me','Ju'],      avoid:['Sa','Ra'],      note:'Mercury and Jupiter positive' },
  { id:'l7',  cat:'legal', label:'Enemy Defeat Prediction',       positive:['Ma','Ju'],      avoid:['Sa','Ra'],      note:'Mars positive for victory' },
  { id:'l8',  cat:'legal', label:'Property Dispute Result',       positive:['Ma','Ju'],      avoid:['Sa','Ra'],      note:'Mars and Jupiter check' },
  { id:'l9',  cat:'legal', label:'Business Dispute Result',       positive:['Me','Ju'],      avoid:['Sa','Ra'],      note:'Mercury and Jupiter check' },
  { id:'l10', cat:'legal', label:'Arbitration Timing',            positive:['Ju','Me'],      avoid:['Sa','Ra'],      note:'Jupiter and Mercury positive' },
  { id:'l11', cat:'legal', label:'Divorce Case Result',           positive:['Ma','Sa'],      avoid:['Ra','Ke'],      note:'Mars and Saturn check' },
  { id:'l12', cat:'legal', label:'Will / Inheritance Claim',      positive:['Ju','Sa'],      avoid:['Ra','Ke'],      note:'Jupiter and Saturn check' },
  { id:'l13', cat:'legal', label:'Tax / Government Dispute',      positive:['Me','Sa'],      avoid:['Ra','Ke'],      note:'Mercury and Saturn check' },
  { id:'l14', cat:'legal', label:'Competition Result',            positive:['Ma','Ju'],      avoid:['Sa','Ra'],      note:'Mars and Jupiter positive' },
  { id:'l15', cat:'legal', label:'Debt Recovery',                 positive:['Ju','Ma'],      avoid:['Sa','Ra'],      note:'Jupiter and Mars positive' },

  // ── SPIRITUAL (15) ─────────────────────────────────────────
  { id:'s1',  cat:'spiritual', label:'Temple Construction / Pratishttha', positive:['Ju','Su'], avoid:['Sa','Ra'],  note:'Jupiter and Sun positive' },
  { id:'s2',  cat:'spiritual', label:'Idol Installation (Pratishttha)',   positive:['Ju','Su'], avoid:['Sa','Ra'],  note:'Jupiter and Sun positive' },
  { id:'s3',  cat:'spiritual', label:'Religious Ceremony Timing',         positive:['Ju','Su'], avoid:['Ra','Ke'],  note:'Jupiter and Sun positive' },
  { id:'s4',  cat:'spiritual', label:'Yagna / Havan Timing',              positive:['Ju','Su'], avoid:['Sa','Ra'],  note:'Jupiter and Sun positive' },
  { id:'s5',  cat:'spiritual', label:'Spiritual Initiation (Diksha)',     positive:['Ju','Ke'], avoid:['Sa','Ra'],  note:'Jupiter and Ketu positive' },
  { id:'s6',  cat:'spiritual', label:'Guru / Teacher Seeking',            positive:['Ju'],      avoid:['Sa','Ra'],  note:'Jupiter must be strong' },
  { id:'s7',  cat:'spiritual', label:'Pilgrimage Start Timing',           positive:['Ju','Mo'], avoid:['Sa','Ra'],  note:'Jupiter and Moon positive' },
  { id:'s8',  cat:'spiritual', label:'Meditation / Retreat Timing',       positive:['Ke','Mo'], avoid:['Ra','Ma'],  note:'Ketu and Moon positive' },
  { id:'s9',  cat:'spiritual', label:'Fasting Start Timing',              positive:['Mo','Ju'], avoid:['Ra','Ma'],  note:'Moon and Jupiter positive' },
  { id:'s10', cat:'spiritual', label:'Charity / Donation Timing',         positive:['Ju','Su'], avoid:['Sa','Ra'],  note:'Jupiter and Sun positive' },
  { id:'s11', cat:'spiritual', label:'Mantra Initiation',                 positive:['Ju','Me'], avoid:['Sa','Ra'],  note:'Jupiter and Mercury positive' },
  { id:'s12', cat:'spiritual', label:'Vastu Correction / Puja',           positive:['Ju','Sa'], avoid:['Ra','Ke'],  note:'Jupiter and Saturn positive' },
  { id:'s13', cat:'spiritual', label:'Graha Shanti Puja',                 positive:['Ju'],      avoid:['Ra','Ke'],  note:'Check specific planet condition' },
  { id:'s14', cat:'spiritual', label:'Ancestral Rites (Shraadh)',         positive:['Ke','Sa'], avoid:['Ra'],       note:'Ketu and Saturn for ancestors' },
  { id:'s15', cat:'spiritual', label:'Spiritual Book / Content Release',  positive:['Ju','Me'], avoid:['Sa','Ra'],  note:'Jupiter and Mercury positive' },

  // ── MODERN / TECH (15) ─────────────────────────────────────
  { id:'mo1', cat:'modern', label:'Website / App Launch',         positive:['Me','Ju'],      avoid:['Sa','Ra'],      note:'Mercury and Jupiter positive' },
  { id:'mo2', cat:'modern', label:'Social Media Account Start',   positive:['Me','Ve'],      avoid:['Sa','Ra'],      note:'Mercury and Venus positive' },
  { id:'mo3', cat:'modern', label:'YouTube Channel Launch',       positive:['Ve','Me'],      avoid:['Sa','Ra'],      note:'Venus and Mercury positive' },
  { id:'mo4', cat:'modern', label:'Podcast / Blog Start',         positive:['Me','Ju'],      avoid:['Sa','Ra'],      note:'Mercury and Jupiter positive' },
  { id:'mo5', cat:'modern', label:'Digital Business Start',       positive:['Me','Ju'],      avoid:['Sa','Ra'],      note:'Mercury and Jupiter positive' },
  { id:'mo6', cat:'modern', label:'Crypto / NFT Investment',      positive:['Ra','Ju'],      avoid:['Sa','Ke'],      note:'Rahu and Jupiter check — high risk' },
  { id:'mo7', cat:'modern', label:'Online Course Launch',         positive:['Me','Ju'],      avoid:['Sa','Ra'],      note:'Jupiter and Mercury positive' },
  { id:'mo8', cat:'modern', label:'Software / App Release',       positive:['Me'],           avoid:['Sa','Ra'],      note:'Mercury must be favorable' },
  { id:'mo9', cat:'modern', label:'E-Commerce Start',             positive:['Me','Ve'],      avoid:['Sa','Ra'],      note:'Mercury and Venus positive' },
  { id:'mo10',cat:'modern', label:'Tech Startup Launch',          positive:['Me','Ju'],      avoid:['Sa','Ra'],      note:'Mercury and Jupiter positive' },
  { id:'mo11',cat:'modern', label:'Gaming / Esports Venture',     positive:['Me','Ra'],      avoid:['Sa','Ke'],      note:'Mercury and Rahu positive' },
  { id:'mo12',cat:'modern', label:'AI / ML Project Launch',       positive:['Me','Ra'],      avoid:['Sa','Ke'],      note:'Mercury and Rahu positive' },
  { id:'mo13',cat:'modern', label:'Digital Content / Reels',      positive:['Ve','Me'],      avoid:['Sa','Ra'],      note:'Venus and Mercury positive' },
  { id:'mo14',cat:'modern', label:'Cybersecurity / Data Work',    positive:['Me','Sa'],      avoid:['Ra','Ke'],      note:'Mercury and Saturn positive' },
  { id:'mo15',cat:'modern', label:'Tech Investment / Funding',    positive:['Ju','Me'],      avoid:['Sa','Ra'],      note:'Jupiter and Mercury positive' },

  // ── ARTS & SPORTS (15) ─────────────────────────────────────
  { id:'a1',  cat:'arts', label:'Movie / Film Release',           positive:['Ve','Me'],      avoid:['Sa','Ra'],      note:'Venus and Mercury positive' },
  { id:'a2',  cat:'arts', label:'Music Album Launch',             positive:['Ve','Me'],      avoid:['Sa','Ra'],      note:'Venus and Mercury positive' },
  { id:'a3',  cat:'arts', label:'Book Publication',               positive:['Me','Ju'],      avoid:['Sa','Ra'],      note:'Mercury and Jupiter positive' },
  { id:'a4',  cat:'arts', label:'Art Exhibition / Gallery',       positive:['Ve','Me'],      avoid:['Sa','Ra'],      note:'Venus and Mercury positive' },
  { id:'a5',  cat:'arts', label:'Theater / Drama Show',           positive:['Ve','Mo'],      avoid:['Sa','Ra'],      note:'Venus and Moon positive' },
  { id:'a6',  cat:'arts', label:'Dance Performance / Show',       positive:['Ve','Mo'],      avoid:['Sa','Ra'],      note:'Venus and Moon positive' },
  { id:'a7',  cat:'arts', label:'Sports Competition',             positive:['Ma','Su'],      avoid:['Sa','Ra'],      note:'Mars and Sun positive' },
  { id:'a8',  cat:'arts', label:'Sports Team Formation',          positive:['Ma','Ju'],      avoid:['Sa','Ra'],      note:'Mars and Jupiter positive' },
  { id:'a9',  cat:'arts', label:'Acting / Film Career Start',     positive:['Ve','Me'],      avoid:['Sa','Ra'],      note:'Venus and Mercury positive' },
  { id:'a10', cat:'arts', label:'Singing Career Start',           positive:['Ve','Me'],      avoid:['Sa','Ra'],      note:'Venus and Mercury positive' },
  { id:'a11', cat:'arts', label:'Writing Career Start',           positive:['Me','Ju'],      avoid:['Sa','Ra'],      note:'Mercury and Jupiter positive' },
  { id:'a12', cat:'arts', label:'Fashion Show / Brand Launch',    positive:['Ve','Me'],      avoid:['Sa','Ra'],      note:'Venus and Mercury positive' },
  { id:'a13', cat:'arts', label:'Photography Business',           positive:['Ve','Me'],      avoid:['Sa','Ra'],      note:'Venus and Mercury positive' },
  { id:'a14', cat:'arts', label:'Dance / Music School Opening',   positive:['Ve','Me','Ju'], avoid:['Sa','Ra'],      note:'Venus, Mercury, Jupiter positive' },
  { id:'a15', cat:'arts', label:'Sports Prediction / Bet',        positive:['Ma'],           avoid:['Sa','Ra','Ke'], note:'Mars check for competition outcome' },

  // ── PRASHNA — YES / NO (15) ────────────────────────────────
  { id:'q1',  cat:'prashna', label:'Will I get the job?',             positive:['Me','Su'],   avoid:['Sa','Ra'],     note:'Mercury and Sun must be positive' },
  { id:'q2',  cat:'prashna', label:'Will my marriage happen soon?',   positive:['Ve','Mo'],   avoid:['Sa','Ra'],     note:'Venus and Moon check' },
  { id:'q3',  cat:'prashna', label:'Will the disease be cured?',      positive:['Mo','Su'],   avoid:['Ra','Ke'],     note:'Moon and Sun must be clear' },
  { id:'q4',  cat:'prashna', label:'Will the loan be approved?',      positive:['Ju'],        avoid:['Sa','Ra'],     note:'Jupiter must be positive' },
  { id:'q5',  cat:'prashna', label:'Will I win the court case?',      positive:['Ju','Su'],   avoid:['Sa','Ra'],     note:'Jupiter and Sun positive' },
  { id:'q6',  cat:'prashna', label:'Will the journey be safe?',       positive:['Mo'],        avoid:['Ra','Ma','Sa'],note:'Moon must not be afflicted' },
  { id:'q7',  cat:'prashna', label:'Will my business succeed?',       positive:['Me','Ju'],   avoid:['Sa','Ra'],     note:'Mercury and Jupiter check' },
  { id:'q8',  cat:'prashna', label:'Will the enemy be defeated?',     positive:['Ma','Ju'],   avoid:['Sa','Ra'],     note:'Mars and Jupiter positive' },
  { id:'q9',  cat:'prashna', label:'Will the lost item be found?',    positive:['Mo','Me'],   avoid:['Ra','Ke'],     note:'Moon and Mercury check' },
  { id:'q10', cat:'prashna', label:'Will the pregnancy be safe?',     positive:['Mo','Ju'],   avoid:['Ma','Ra'],     note:'Moon and Jupiter positive' },
  { id:'q11', cat:'prashna', label:'Will the property dispute resolve?',positive:['Ma','Ju'], avoid:['Sa','Ra'],     note:'Mars and Jupiter check' },
  { id:'q12', cat:'prashna', label:'Will the investment give profit?', positive:['Ju','Ve'],  avoid:['Sa','Ra'],     note:'Jupiter and Venus positive' },
  { id:'q13', cat:'prashna', label:'Will the missing person return?',  positive:['Mo','Me'],  avoid:['Ra','Ke'],     note:'Moon and Mercury check' },
  { id:'q14', cat:'prashna', label:'Will the operation succeed?',      positive:['Ma','Mo'],  avoid:['Sa','Ra'],     note:'Mars and Moon check' },
  { id:'q15', cat:'prashna', label:'Will the visa be approved?',       positive:['Ju','Ra'],  avoid:['Sa','Ke'],     note:'Jupiter and Rahu positive' },
]

// ─────────────────────────────────────────────────────────────
//  Planet status helper
//  Determines if a transit planet's nakshatra is afflicted
//  (under malefic vedha) or blessed (under benefic vedha).
// ─────────────────────────────────────────────────────────────

const PLANET_NAMES: Record<string, string> = {
  Su:'Sun', Mo:'Moon', Ma:'Mars', Me:'Mercury', Ju:'Jupiter',
  Ve:'Venus', Sa:'Saturn', Ra:'Rahu', Ke:'Ketu',
}

export interface PlanetStatus {
  planet:    GrahaId
  nakIdx:    number
  afflicted: boolean   // malefic vedha falls on this planet's nakshatra
  blessed:   boolean   // benefic vedha falls on this planet's nakshatra
  free:      boolean   // no vedha at all (neutral)
}

/**
 * For each transit planet, determine if it is afflicted or blessed
 * based on other transit planets' vedha.
 */
export function computePlanetStatuses(
  transitGrahas:  SBCGrahaInput[],
  vedhas:         VedhaResult[],
): Map<GrahaId, PlanetStatus> {
  const statusMap = new Map<GrahaId, PlanetStatus>()

  transitGrahas
    .filter(g => !['Ur', 'Ne', 'Pl'].includes(g.id))
    .forEach(g => {
      const nakIdx    = nakFromLon(g.lonSidereal)
      const afflicted = vedhas.some(v => v.isMalefic  && v.planet !== g.id && v.affectedNakshatras.includes(nakIdx))
      const blessed   = vedhas.some(v => !v.isMalefic && v.planet !== g.id && v.affectedNakshatras.includes(nakIdx))

      statusMap.set(g.id, {
        planet: g.id,
        nakIdx,
        afflicted,
        blessed,
        free: !afflicted && !blessed,
      })
    })

  return statusMap
}

// ─────────────────────────────────────────────────────────────
//  Use Case Assessment
// ─────────────────────────────────────────────────────────────

/**
 * Assess a single use case against the current planetary statuses.
 *
 * Scoring logic:
 *   +30 for each "positive" planet that is blessed or free (not afflicted)
 *   −30 for each "positive" planet that is afflicted
 *   −20 for each "avoid" planet that is itself free/blessed (strong malefic active)
 *
 * Verdict thresholds:
 *   ≥ 80  → excellent
 *   ≥ 55  → good
 *   ≥ 35  → neutral
 *   ≥ 15  → caution
 *   <  15 → avoid
 */
export function assessSingleUseCase(
  uc:       SBCUseCase,
  statuses: Map<GrahaId, PlanetStatus>,
): UseCaseResult {
  let score           = 50   // baseline
  const reasons:      string[] = []
  let positiveCount   = 0
  let afflictedCount  = 0

  // Check positive planets
  uc.positive.forEach(pid => {
    const st = statuses.get(pid)
    if (!st) return

    if (st.blessed) {
      score += 30
      positiveCount++
      reasons.push(`✓ ${PLANET_NAMES[pid]} is blessed by benefic vedha`)
    } else if (st.free) {
      score += 15
      positiveCount++
      reasons.push(`✓ ${PLANET_NAMES[pid]} is free from malefic vedha`)
    } else {
      score -= 30
      afflictedCount++
      reasons.push(`✗ ${PLANET_NAMES[pid]} is afflicted by malefic vedha`)
    }
  })

  // Check avoid planets — if these are strong (not themselves afflicted), penalise
  uc.avoid.forEach(pid => {
    const st = statuses.get(pid)
    if (!st) return
    if (!st.afflicted) {
      // Malefic planet is active and strong
      score -= 20
      reasons.push(`⚠ ${PLANET_NAMES[pid]} is active and casting malefic vedha`)
    }
  })

  const clamped = Math.max(0, Math.min(100, score))

  const verdict: UseCaseVerdict =
    clamped >= 80 ? 'excellent' :
    clamped >= 58 ? 'good' :
    clamped >= 38 ? 'neutral' :
    clamped >= 20 ? 'caution' : 'avoid'

  return { ...uc, verdict, score: clamped, positiveCount, afflictedCount, reasons }
}

/**
 * Assess all use cases in a specific category.
 * Returns them sorted by score descending.
 */
export function assessCategory(
  catId:    string,
  statuses: Map<GrahaId, PlanetStatus>,
): UseCaseResult[] {
  return USE_CASES
    .filter(uc => uc.cat === catId)
    .map(uc => assessSingleUseCase(uc, statuses))
    .sort((a, b) => b.score - a.score)
}

/**
 * Get a high-level dashboard: for each category, how many use cases
 * are favorable vs avoid today.
 */
export interface CategorySummary {
  cat:      UseCaseCategory
  total:    number
  excellent:number
  good:     number
  avoid:    number
  topScore: number
  score:    number   // average score
}

export function getCategorySummaries(
  statuses: Map<GrahaId, PlanetStatus>,
): CategorySummary[] {
  return USE_CASE_CATEGORIES.map(cat => {
    const results = assessCategory(cat.id, statuses)
    if (!results.length) return { cat, total: 0, excellent: 0, good: 0, avoid: 0, topScore: 0, score: 0 }

    const excellent  = results.filter(r => r.verdict === 'excellent').length
    const good       = results.filter(r => r.verdict === 'good').length
    const avoid      = results.filter(r => r.verdict === 'avoid' || r.verdict === 'caution').length
    const topScore   = results[0]?.score ?? 0
    const score      = Math.round(results.reduce((s, r) => s + r.score, 0) / results.length)

    return { cat, total: results.length, excellent, good, avoid, topScore, score }
  })
}
