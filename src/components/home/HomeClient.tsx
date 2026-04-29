'use client'
// ─────────────────────────────────────────────────────────────
//  src/app/page.tsx
//  Home — birth form + full chart result
//  Redesigned: themed, animated, cleaner visual hierarchy
// ─────────────────────────────────────────────────────────────

import dynamic from 'next/dynamic'
import React, { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { BirthForm }     from '@/components/ui/BirthForm'

// Dynamic imports for heavy tab-specific components
const VarshaphalPanel = dynamic(() => import('@/components/ui/VarshaphalPanel').then(m => m.VarshaphalPanel), { ssr: false })
const VargaSwitcher = dynamic(() => import('@/components/chakra/VargaSwitcher').then(m => m.VargaSwitcher), { ssr: false })
const DashaTree = dynamic(() => import('@/components/dasha/DashaTree').then(m => m.DashaTree), { ssr: false })
const DashaInterpretationPanel = dynamic(() => import('@/components/dasha/DashaInterpretationPanel').then(m => m.DashaInterpretationPanel), { ssr: false })
const PersonalDayCard = dynamic(() => import('@/components/dashboard/PersonalDayCard').then(m => m.PersonalDayCard), { ssr: false })
const GrahaTable = dynamic(() => import('@/components/ui/GrahaTable').then(m => m.GrahaTable), { ssr: false })
const AshtakavargaGrid = dynamic(() => import('@/components/ui/AshtakavargaGrid').then(m => m.AshtakavargaGrid), { ssr: false })
const YogaList = dynamic(() => import('@/components/ui/YogaList').then(m => m.YogaList), { ssr: false })
const TransitOverlay = dynamic(() => import('@/components/ui/TransitOverlay').then(m => m.TransitOverlay), { ssr: false })
const ShadbalaTable = dynamic(() => import('@/components/ui/ShadbalaTable').then(m => m.ShadbalaTable), { ssr: false })
const BhavaBalaTable = dynamic(() => import('@/components/ui/BhavaBalaTable').then(m => m.BhavaBalaTable), { ssr: false })
const VimsopakaBalaPanel = dynamic(() => import('@/components/ui/VimsopakaBalaPanel').then(m => m.VimsopakaBalaPanel), { ssr: false })
const PlanetsWorkspace = dynamic(() => import('@/components/ui/PlanetsWorkspace').then(m => m.PlanetsWorkspace), { ssr: false })
const InterpretationPanel = dynamic(() => import('@/components/ui/InterpretationPanel').then(m => m.InterpretationPanel), { ssr: false })
const NakshatraPanel = dynamic(() => import('@/components/ui/NakshatraPanel').then(m => m.NakshatraPanel), { ssr: false })
const HousePanel = dynamic(() => import('@/components/ui/HousePanel').then(m => m.HousePanel), { ssr: false })
const ActiveHousesCard = dynamic(() => import('@/components/dashboard/ActiveHousesCard').then(m => m.ActiveHousesCard), { ssr: false })
const ProgressionWidget = dynamic(() => import('@/components/dashboard/ProgressionWidget').then(m => m.ProgressionWidget), { ssr: false })
const ExportPdfButton = dynamic(() => import('@/components/ui/ExportPdfButton').then(m => m.ExportPdfButton), { ssr: false })
const EmailChartButton = dynamic(() => import('@/components/ui/EmailChartButton').then(m => m.EmailChartButton), { ssr: false })
const KPStellarPanel = dynamic(() => import('@/components/ui/KPStellarPanel').then(m => m.KPStellarPanel), { ssr: false })
const AstroDetailsPanel = dynamic(() => import('@/components/ui/AstroDetailsPanel').then(m => m.AstroDetailsPanel), { ssr: false })

import { useAppLayout } from '@/components/providers/LayoutProvider'
import { useChart } from '@/components/providers/ChartProvider'
import type { ChartOutput, GrahaId, Rashi, ChartSettings } from '@/types/astrology'
import { DEFAULT_SETTINGS, GRAHA_NAMES, NAKSHATRA_NAMES as NAK_NAMES } from '@/types/astrology'
import { RASHI_NAMES, RASHI_SHORT } from '@/types/astrology'
import { PlanetDetailCard } from '@/components/ui/PlanetDetailCard'
import { getGraNakPositions, getNakshatraCharacteristics } from '@/lib/engine/nakshatraAdvanced'
import { NatalPanchangPanel } from '@/components/panchang/NatalPanchangPanel'

// ─────────────────────────────────────────────────────────────
//  Arudha Panel
// ─────────────────────────────────────────────────────────────

const ARUDHA_TOPICS: Record<string, string> = {
  AL:  'Public image · worldly self',
  A2:  'Wealth · speech · sustenance',
  A3:  'Courage · siblings · skills',
  A4:  'Home · mother · property',
  A5:  'Intellect · children · karma',
  A6:  'Debts · enemies · service',
  A7:  'Spouse · partnerships',
  A8:  'Longevity · hidden matters',
  A9:  'Dharma · father · fortune',
  A10: 'Career · status · action',
  A11: 'Gains · elder siblings · wishes',
  A12: 'Loss · liberation',
}

function ArudhaPanel({ arudhas }: { arudhas: ChartOutput['arudhas'] }) {
  const keys = ['AL','A2','A3','A4','A5','A6','A7','A8','A9','A10','A11','A12'] as const

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.35rem' }}>
        {keys.map((key) => {
          const rashi = arudhas[key] as Rashi | undefined
          if (!rashi) return null
          const isAL = key === 'AL'
          return (
            <div key={key} style={{
              padding: '0.35rem 0.55rem',
              background: isAL ? 'rgba(201,168,76,0.08)' : 'var(--surface-2)',
              border: `1px solid ${isAL ? 'var(--border-bright)' : 'var(--border-soft)'}`,
              borderRadius: 'var(--r-sm)',
              display: 'flex', gap: '0.5rem', alignItems: 'center',
            }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: isAL ? 'var(--gold)' : 'var(--text-muted)', minWidth: 24, fontWeight: 700 }}>
                {key}
              </span>
              <div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: isAL ? 600 : 400 }}>
                  {RASHI_NAMES[rashi]}
                  <span style={{ marginLeft: 4, fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{RASHI_SHORT[rashi]}</span>
                </div>
                <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>{ARUDHA_TOPICS[key]}</div>
              </div>
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', paddingTop: '0.4rem', borderTop: '1px solid var(--border-soft)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        <span><span style={{ color: 'var(--gold)' }}>A12:</span> {arudhas.A12 ? RASHI_NAMES[arudhas.A12] : '—'} · Upapada</span>
        <span><span style={{ color: 'var(--gold)' }}>A7:</span> {arudhas.A7 ? RASHI_NAMES[arudhas.A7] : '—'} · Darapada</span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  Chart Summary sidebar strip
// ─────────────────────────────────────────────────────────────

function ChartSummary({ chart }: { chart: ChartOutput }) {
  const rows = [
    { label: 'Ascendant', value: `${RASHI_NAMES[chart.lagnas.ascRashi as Rashi]} ${chart.lagnas.ascDegreeInRashi.toFixed(1)}°` },
    { label: 'Ayanamsha', value: `${chart.meta.settings.ayanamsha} ${chart.meta.ayanamshaValue.toFixed(3)}°` },
    { label: 'Julian Day', value: chart.meta.julianDay.toFixed(4), mono: true },
  ]
  return (
    <div style={{
      marginTop: '0.85rem',
      padding: '0.85rem 1rem',
      background: 'var(--gold-faint)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-md)',
    }}>
      <div className="label-caps" style={{ marginBottom: '0.5rem' }}>Chart Summary</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        {rows.map(({ label, value, mono }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>{label}</span>
            <span style={{
              color: 'var(--text-secondary)',
              fontFamily: mono ? 'var(--font-mono)' : 'inherit',
              fontSize: mono ? '0.72rem' : '0.8rem',
            }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function DashboardMetricChip({
  label,
  value,
  sub,
  valueColor = 'var(--teal)',
}: {
  label: string
  value: string | number
  sub?: string
  valueColor?: string
}) {
  return (
    <div style={{
      padding: '0.3rem 0.5rem',
      background: 'var(--surface-2)',
      border: '1px solid var(--border-soft)',
      borderRadius: 'var(--r-sm)',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '0.57rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em' }}>{label}</div>
      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: valueColor, lineHeight: 1.3 }}>{value}</div>
      {sub ? <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', marginTop: 1 }}>{sub}</div> : null}
    </div>
  )
}

function getCurrentMahaDasha(chart: ChartOutput): string {
  const now = Date.now()
  const mahaNodes = (chart.dashas.vimshottari ?? []).filter((n) => n.level === 1)
  const current =
    mahaNodes.find((n) => n.isCurrent) ??
    mahaNodes.find((n) => {
      const start = new Date(n.start).getTime()
      const end = new Date(n.end).getTime()
      return now >= start && now <= end
    }) ??
    mahaNodes[0]

  if (!current) return '—'
  return `${GRAHA_NAMES[current.lord as GrahaId] ?? current.lord} Mahadasha`
}

function isNowSlot(start?: Date | string, end?: Date | string): boolean {
  if (!start || !end) return false
  const now = Date.now()
  const s = new Date(start).getTime()
  const e = new Date(end).getTime()
  return Number.isFinite(s) && Number.isFinite(e) && now >= s && now <= e
}

function fmtClock(value: Date | string | number, tz: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(value))
}

function MajorKundaliStrip({
  chart,
  todayPanchang,
}: {
  chart: ChartOutput
  todayPanchang: import('@/types/astrology').PanchangData | null
}) {
  const moon = chart.grahas.find((g) => g.id === 'Mo')
  const sun = chart.grahas.find((g) => g.id === 'Su')
  const ak = chart.karakas?.AK ? (GRAHA_NAMES[chart.karakas.AK] ?? chart.karakas.AK) : '—'
  const liveHora = todayPanchang?.horaTable?.find((h) => isNowSlot(h.start, h.end))
  const runningRahu = todayPanchang && isNowSlot(todayPanchang.rahuKalam.start, todayPanchang.rahuKalam.end)
  const runningGulika = todayPanchang && isNowSlot(todayPanchang.gulikaKalam.start, todayPanchang.gulikaKalam.end)
  const runningYamaganda = todayPanchang && isNowSlot(todayPanchang.yamaganda.start, todayPanchang.yamaganda.end)
  const runningTag = runningRahu ? 'Rahu Kalam' : runningGulika ? 'Gulika Kalam' : runningYamaganda ? 'Yamaganda' : 'Auspicious'

  const nextChangeCandidates = [
    liveHora?.end,
    runningRahu ? todayPanchang?.rahuKalam.end : undefined,
    runningGulika ? todayPanchang?.gulikaKalam.end : undefined,
    runningYamaganda ? todayPanchang?.yamaganda.end : undefined,
  ].filter((v): v is Date => Boolean(v))
  const nextChangeMs = nextChangeCandidates.length
    ? Math.min(...nextChangeCandidates.map((v) => new Date(v).getTime()))
    : null
  const leftMs = nextChangeMs ? Math.max(0, nextChangeMs - Date.now()) : null
  const countdown = leftMs != null
    ? `${Math.floor(leftMs / 60_000)}m ${Math.floor((leftMs % 60_000) / 1000)}s`
    : null

  const natalPanchang = [
    `Vara ${chart.panchang.vara.name}`,
    `Tithi ${chart.panchang.tithi.name} (${chart.panchang.tithi.paksha === 'shukla' ? 'Shukla' : 'Krishna'})`,
    `Nak ${chart.panchang.nakshatra.name}`,
    `Yoga ${chart.panchang.yoga.name}`,
    `Karana ${chart.panchang.karana.name}`,
  ].join(' · ')
  const livePanchang = todayPanchang
    ? [
      `Vara ${todayPanchang.vara.name}`,
      `Tithi ${todayPanchang.tithi.name} (${todayPanchang.tithi.paksha === 'shukla' ? 'Shukla' : 'Krishna'})`,
      `Nak ${todayPanchang.nakshatra.name}`,
      `Yoga ${todayPanchang.yoga.name}`,
      `Karana ${todayPanchang.karana.name}`,
    ].join(' · ')
    : 'Loading live panchang...'
  const items = [
    { label: 'Lagna', value: `${RASHI_NAMES[chart.lagnas.ascRashi as Rashi]} ${chart.lagnas.ascDegreeInRashi.toFixed(1)}°` },
    { label: 'Moon', value: moon ? `${RASHI_NAMES[moon.rashi]} · ${moon.nakshatraName}` : '—' },
    { label: 'Sun', value: sun ? `${RASHI_NAMES[sun.rashi]} ${sun.degree.toFixed(1)}°` : '—' },
    { label: 'AK', value: ak },
    { label: 'Maha', value: getCurrentMahaDasha(chart) },
    { label: 'Natal Panchang', value: natalPanchang },
    { label: 'Live Panchang', value: livePanchang },
  ]

  return (
    <div
      className="fade-up"
      style={{
        marginTop: '0.45rem',
        marginBottom: '0.65rem',
        padding: '0.42rem 0.55rem',
        borderRadius: 'var(--r-sm)',
        border: '1px solid var(--border-soft)',
        background: 'color-mix(in oklab, var(--surface-2) 82%, var(--surface-1) 18%)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        overflowX: 'auto',
      }}
    >
      <span style={{ fontSize: '0.58rem', fontWeight: 800, letterSpacing: '0.09em', color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
        Kundali Snapshot
      </span>
      {items.map((item, idx) => (
        <React.Fragment key={item.label}>
          <span style={{ whiteSpace: 'nowrap', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '0.56rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
              {item.label === 'Live Panchang' ? (
                <>
                  <span style={{ color: 'var(--rose)' }}>Live</span>
                  <span style={{ marginLeft: 3 }}>Panchang</span>
                </>
              ) : item.label}
            </span>
            <span style={{ marginLeft: 4, fontWeight: 600, color: 'var(--text-primary)' }}>{item.value}</span>
          </span>
          {idx < items.length - 1 && <span style={{ color: 'var(--border-bright)' }}>|</span>}
        </React.Fragment>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  Main Page
// ─────────────────────────────────────────────────────────────

import { Suspense } from 'react'

function HomeContent() {
  const { data: session, status } = useSession()
  const { chart, setChart, isFormOpen, setIsFormOpen, pendingDestination, setPendingDestination } = useChart()
  const { activeTab } = useAppLayout()
  
  const userPlan = ((session?.user as any)?.plan ?? 'free') as 'free' | 'gold' | 'platinum'
  const [userPrefs, setUserPrefs] = useState<ChartSettings>(DEFAULT_SETTINGS)
  const [transitGrahas, setTransitGrahas] = useState<import('@/types/astrology').GrahaData[] | null>(null)
  const [dashaSystem, setDashaSystem] = useState<'vimshottari' | 'ashtottari' | 'yogini' | 'chara'>( 'vimshottari')
  const [vimshottariTara, setVimshottariTara] = useState<string>('Mo')
  const [activeVarga, setActiveVarga] = useState<string>('D1')
  const [altVimshottari, setAltVimshottari] = useState<import('@/types/astrology').DashaNode[] | null>(null)
  const [selectedAcgPlanets, setSelectedAcgPlanets] = useState<Set<any>>(new Set(['Su', 'Mo', 'Ju', 'Ve']))
  const [activeAcgParans, setActiveAcgParans] = useState<any[]>([])
  const [acgNatalData, setAcgNatalData] = useState<any[]>([])
  const searchParams = useSearchParams()
  const router = useRouter()

  const [loading,    setLoading]    = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [saveDone,   setSaveDone]   = useState(false)
  const [crmSaving,  setCrmSaving]  = useState(false)
  const [crmDone,    setCrmDone]    = useState(false)
  const [defaultChart, setDefaultChart] = useState<any>(null)
  const [fetchingDefault, setFetchingDefault] = useState(false)
  const [todayPanchang,   setTodayPanchang]   = useState<import('@/types/astrology').PanchangData | null>(null)
  const [dashExpandAv, setDashExpandAv] = useState(false)
  const [dashExpandShad, setDashExpandShad] = useState(false)
  const [dashExpandBhava, setDashExpandBhava] = useState(false)
  const [dashExpandVim, setDashExpandVim] = useState(false)
  const [dashExpandPanchang, setDashExpandPanchang] = useState(false)
  const [dashExpandYogas, setDashExpandYogas] = useState(false)
  const [expandGraha, setExpandGraha] = useState(false)
  const [expandAstro, setExpandAstro] = useState(false)
  const [desktopDashboardCardOrder, setDesktopDashboardCardOrder] = useState<Array<'summary' | 'cosmic' | 'planetary' | 'astronomical'>>([
    'summary',
    'astronomical',
    'planetary',
    'cosmic',
  ])
  const [draggingDashboardCard, setDraggingDashboardCard] = useState<'summary' | 'cosmic' | 'planetary' | 'astronomical' | null>(null)

  const [isMobile, setIsMobile] = useState(false)
  const [mobileHeaderMenuOpen, setMobileHeaderMenuOpen] = useState(false)
  const [mobileDashCategory, setMobileDashCategory] = useState<'astrology' | 'panchang' | 'nakshatra' | 'advanced'>('astrology')
  const [mobileDashTab, setMobileDashTab] = useState<'astro' | 'planetary' | 'dashas' | 'today' | 'panchang' | 'strengths' | 'yogas'>('astro')
  const [mobileStrengthTab, setMobileStrengthTab] = useState<'shadbala' | 'bhava' | 'vimsopaka' | 'ashtakavarga'>('shadbala')
  const mobileDashboardCategories = [
    { id: 'astrology', label: 'Astrology' },
    { id: 'panchang', label: 'Panchang' },
    { id: 'nakshatra', label: 'Nakshatra' },
    { id: 'advanced', label: 'Advanced Astrology' },
  ] as const
  const mobileDashboardOptions = {
    astrology: [
      { id: 'astro', label: 'Astro Details' },
      { id: 'planetary', label: 'Planetary Details' },
      { id: 'dashas', label: 'Dashas' },
      { id: 'today', label: 'Today Glance' },
      { id: 'panchang', label: 'Natal Panchang' },
      { id: 'strengths', label: 'Strengths' },
      { id: 'yogas', label: 'Graha Yogas' },
    ],
    panchang: [
      { id: 'daily-panchang', label: 'Daily Panchang', path: '/panchang' },
      { id: 'monthly-panchang', label: 'Monthly Calendar', path: '/panchang/calendar' },
    ],
    nakshatra: [
      { id: 'nakshatra-overview', label: 'Overview', path: '/nakshatra/overview' },
      { id: 'nakshatra-navtara', label: 'Navtara', path: '/nakshatra/navtara' },
      { id: 'nakshatra-bestdays', label: 'Best Days', path: '/nakshatra/bestdays' },
      { id: 'nakshatra-muhurta', label: 'Muhurta', path: '/nakshatra/muhurta' },
      { id: 'nakshatra-panchaka', label: 'Panchaka', path: '/nakshatra/panchaka' },
      { id: 'nakshatra-planet', label: 'Planet', path: '/nakshatra/planet' },
      { id: 'nakshatra-compat', label: 'Compat', path: '/nakshatra/compat' },
      { id: 'nakshatra-remedies', label: 'Remedies', path: '/nakshatra/remedies' },
    ],
    advanced: [
      { id: 'jaimini', label: 'Jaimini Astrology', path: '/jaimini' },
      { id: 'astro-vastu', label: 'Astro Vastu', path: '/vastu' },
      { id: 'astro-carto', label: 'AstroCartography', path: '/acg' },
      { id: 'sbc', label: 'Sarvatobhadra Chakra', path: '/sbc' },
      { id: 'muhurta', label: 'Muhurta Finder', path: '/muhurta' },
      { id: 'prashna', label: 'Prashna', path: '/prashna' },
      { id: 'compare', label: 'Synastry Overlay', path: '/compare' },
      { id: 'roadmap', label: 'Cosmic Roadmap', path: '/roadmap' },
      { id: 'transit-scrubber', label: 'Time Scrubber', path: '/scrubber' },
    ],
  } as const
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    if (!isMobile && mobileHeaderMenuOpen) setMobileHeaderMenuOpen(false)
  }, [isMobile, mobileHeaderMenuOpen])

  useEffect(() => {
    if (!isMobile) return
    const main = document.querySelector('.main-content')
    if (main) main.scrollTo({ top: 0, behavior: 'smooth' })
  }, [mobileDashTab, isMobile])


  const dashboardAshtakSummary = useMemo(() => {
    if (!chart?.ashtakavarga) return null
    const ascRashi = chart.lagnas.ascRashi ?? 1
    const sav = chart.ashtakavarga.sav
    const houses = sav.map((val, i) => {
      const rashi = ((ascRashi - 1 + i) % 12) + 1
      return { house: i + 1, val, rashi: rashi as Rashi }
    })
    const sorted = [...houses].sort((a, b) => b.val - a.val)
    return {
      savTotal: chart.ashtakavarga.savTotal,
      avg: (chart.ashtakavarga.savTotal / 12).toFixed(1),
      highest: sorted[0],
      lowest: sorted[sorted.length - 1],
    }
  }, [chart])

  const dashboardShadbalaSummary = useMemo(() => {
    if (!chart?.shadbala) return null
    const { strongest, weakest, planets } = chart.shadbala
    const core: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa']
    const sn = GRAHA_NAMES[strongest as GrahaId] ?? strongest
    const wn = GRAHA_NAMES[weakest as GrahaId] ?? weakest
    const ratios = core.map((id) => planets[id]?.ratio).filter((r): r is number => typeof r === 'number')
    const meanRatio = ratios.length ? (ratios.reduce((a, b) => a + b, 0) / ratios.length).toFixed(2) : '—'
    const ranked = core
      .map((id) => ({
        id,
        name: GRAHA_NAMES[id] ?? id,
        total: planets[id]?.total ?? 0,
        ratio: planets[id]?.ratio ?? 0,
      }))
      .sort((a, b) => b.total - a.total)
    const top3 = ranked.slice(0, 3)
    return {
      strongestLabel: sn,
      weakestLabel: wn,
      strongTotal: planets[strongest]?.total.toFixed(2) ?? '—',
      weakTotal: planets[weakest]?.total.toFixed(2) ?? '—',
      meanRatio,
      top3,
    }
  }, [chart])

  const dashboardBhavaBalaSummary = useMemo(() => {
    if (!chart?.bhavaBala?.houses) return null
    const strongestHouse = chart.bhavaBala.strongestHouse
    const weakestHouse = chart.bhavaBala.weakestHouse
    const strong = chart.bhavaBala.houses[strongestHouse]
    const weak = chart.bhavaBala.houses[weakestHouse]
    if (!strong || !weak) return null
    const totals = Object.values(chart.bhavaBala.houses).map((h) => h.totalRupa)
    const avgRupa = totals.length ? totals.reduce((a, b) => a + b, 0) / totals.length : null
    return {
      strongestHouse,
      weakestHouse,
      strongTotal: strong.totalRupa.toFixed(2),
      weakTotal: weak.totalRupa.toFixed(2),
      avgRupa: avgRupa != null ? avgRupa.toFixed(2) : '—',
      spreadRupa: (strong.totalRupa - weak.totalRupa).toFixed(2),
    }
  }, [chart])

  const dashboardVimsopakaSummary = useMemo(() => {
    if (!chart?.vimsopaka?.planets) return null
    const v = chart.vimsopaka
    const board = v.leaderboard?.length ? v.leaderboard : []
    const top3 = board.slice(0, 3)
    const strongScore = v.planets[v.strongest]?.shodasvarga
    const weakScore = v.planets[v.weakest]?.shodasvarga
    return {
      strongest: GRAHA_NAMES[v.strongest as GrahaId] ?? v.strongest,
      weakest: GRAHA_NAMES[v.weakest as GrahaId] ?? v.weakest,
      strongScore: strongScore != null ? strongScore.toFixed(2) : '—',
      weakScore: weakScore != null ? weakScore.toFixed(2) : '—',
      avg: v.insights?.averageShodasvarga != null ? v.insights.averageShodasvarga.toFixed(2) : null,
      top3,
    }
  }, [chart])

  const handleAcgPlanetsChange = React.useCallback((planets: Set<any>, parans: any[], rawNatal?: any[]) => {
    setSelectedAcgPlanets(prev => {
        if (prev.size === planets.size && Array.from(planets).every(p => prev.has(p))) return prev
        return planets
    })
    setActiveAcgParans(parans)
    if (rawNatal) setAcgNatalData(rawNatal)
  }, [])

  // 1. Fetch default chart if logged in (with client-side caching)
  useEffect(() => {
    if (status === 'authenticated') {
      // Check local cache first for instant load
      const cached = sessionStorage.getItem('jyotish_user_me')
      if (cached) {
        try {
          const data = JSON.parse(cached)
          if (data.success) {
            if (data.personalChart) setDefaultChart(data.personalChart)
            if (data.user?.preferences) {
              const prefs = data.user.preferences
              setUserPrefs(prev => ({
                ...prev,
                ...(prefs.defaultAyanamsha    ? { ayanamsha:    prefs.defaultAyanamsha    } : {}),
                ...(prefs.defaultHouseSystem  ? { houseSystem:  prefs.defaultHouseSystem  } : {}),
                ...(prefs.defaultNodeMode     ? { nodeMode:     prefs.defaultNodeMode     } : {}),
                ...(prefs.karakaScheme        ? { karakaScheme: prefs.karakaScheme        } : {}),
                ...(prefs.showDegrees   != null ? { showDegrees:  prefs.showDegrees   } : {}),
                ...(prefs.showNakshatra != null ? { showNakshatra:prefs.showNakshatra } : {}),
                ...(prefs.showKaraka    != null ? { showKaraka:   prefs.showKaraka    } : {}),
              }))
            }
          }
        } catch (e) {
          sessionStorage.removeItem('jyotish_user_me')
        }
      }

      setFetchingDefault(true)
      fetch('/api/user/me')
        .then(r => r.json())
        .then(data => {
          if (data.success) {
            // Update cache
            sessionStorage.setItem('jyotish_user_me', JSON.stringify(data))
            
            if (data.personalChart) {
               setDefaultChart(data.personalChart)
            }
            // Apply user preferences
            if (data.user?.preferences) {
              const prefs = data.user.preferences
              setUserPrefs(prev => ({
                ...prev,
                ...(prefs.defaultAyanamsha    ? { ayanamsha:    prefs.defaultAyanamsha    } : {}),
                ...(prefs.defaultChartStyle   ? { chartStyle:   prefs.defaultChartStyle   } : {}),
                ...(prefs.defaultHouseSystem  ? { houseSystem:  prefs.defaultHouseSystem  } : {}),
                ...(prefs.defaultNodeMode     ? { nodeMode:     prefs.defaultNodeMode     } : {}),
                ...(prefs.karakaScheme        ? { karakaScheme: prefs.karakaScheme        } : {}),
                ...(prefs.showDegrees   != null ? { showDegrees:  prefs.showDegrees   } : {}),
                ...(prefs.showNakshatra != null ? { showNakshatra:prefs.showNakshatra } : {}),
                ...(prefs.showKaraka    != null ? { showKaraka:   prefs.showKaraka    } : {}),
              }))
            }
          }
        })
        .finally(() => setFetchingDefault(false))
    }
  }, [status])

  // 1b. Fetch today's panchang for dashboard insights
  useEffect(() => {
    if (chart && activeTab === 'dashboard' && !todayPanchang) {
      const todayString = new Date().toISOString().split('T')[0]
      fetch(`/api/panchang?date=${todayString}&lat=${chart.meta.latitude}&lng=${chart.meta.longitude}&tz=${encodeURIComponent(chart.meta.timezone)}`)
        .then(r => r.json())
        .then(json => {
            if (json.success) setTodayPanchang(json.data)
        })
    }
  }, [chart, activeTab, todayPanchang])

  // 2. Open form if 'new=true' is in URL
  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setIsFormOpen(true)
      setChart(null)
    }
  }, [searchParams, setChart, setIsFormOpen])

  async function handleSave(type: 'regular' | 'personal' = 'regular') {
    if (!chart || saving) return
    setSaving(true)
    try {
      const res = await fetch('/api/chart/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:       chart.meta.name,
          birthDate:  chart.meta.birthDate,
          birthTime:  chart.meta.birthTime,
          birthPlace: chart.meta.birthPlace,
          latitude:   chart.meta.latitude,
          longitude:  chart.meta.longitude,
          timezone:   chart.meta.timezone,
          settings:   chart.meta.settings,
          isPersonal: type === 'personal',
        })
      })
      if (res.ok) {
        setSaveDone(true)
        setTimeout(() => setSaveDone(false), 4000)
      }
    } catch (e) {
      console.error('Save failed', e)
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveToCRM() {
    if (!chart || crmSaving) return
    setCrmSaving(true)
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:       chart.meta.name,
          birthDate:  chart.meta.birthDate,
          birthTime:  chart.meta.birthTime,
          birthPlace: chart.meta.birthPlace,
          latitude:   chart.meta.latitude,
          longitude:  chart.meta.longitude,
          timezone:   chart.meta.timezone,
          status:     'active',
        })
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setCrmDone(true)
        setTimeout(() => setCrmDone(false), 4000)
      } else {
        alert(json.error || 'Failed to add client to CRM')
      }
    } catch (e) {
      console.error('CRM Save failed', e)
    } finally {
      setCrmSaving(false)
    }
  }

  useEffect(() => {
    if (!chart || vimshottariTara === 'Mo') { setAltVimshottari(null); return }
    let refLon: number | null = null
    if (vimshottariTara === 'As') {
      refLon = chart.lagnas.ascDegree
    } else {
      const g = chart.grahas.find(g => g.id === vimshottariTara)
      if (g) refLon = g.lonSidereal
    }
    if (refLon === null) { setAltVimshottari(null); return }
    import('@/lib/engine/dasha/vimshottari').then(({ calcVimshottari }) => {
      const nodes = calcVimshottari(refLon!, new Date(chart.meta.birthDate), 6)
      setAltVimshottari(nodes)
    })
  }, [chart, vimshottariTara])

    const moonNakIndex = chart?.grahas.find((g) => g.id === 'Mo')?.nakshatraIndex ?? 0
  const tithiNumber  = chart?.panchang.tithi.number ?? 1
  const varaNumber   = chart?.panchang.vara.number  ?? 0

  const openAstrologyApp = React.useCallback(() => {
    router.push('/astrology?new=true')
  }, [router])

  const openSectionWithChartGate = React.useCallback((href: string, e?: React.MouseEvent<HTMLAnchorElement>) => {
    const isAstrologyTarget = href.startsWith('/astrology')
    if (!chart && !isAstrologyTarget) {
      e?.preventDefault()
      setPendingDestination(href)
      setIsFormOpen(true)
      router.push('/astrology?new=true')
      return
    }
    if (!chart && isAstrologyTarget) {
      e?.preventDefault()
      setIsFormOpen(true)
      router.push('/astrology?new=true')
    }
  }, [chart, router, setIsFormOpen, setPendingDestination])

  const openMyDefaultChart = React.useCallback(async () => {
    if (!defaultChart) {
      router.push('/astrology?new=true')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/chart/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...defaultChart,
          settings: { ...userPrefs, ...defaultChart.settings },
        }),
      })
      const json = await res.json()
      if (json.success) {
        setChart(json.data)
        router.push('/astrology')
      }
    } catch (error) {
      console.error('Default chart load failed', error)
    } finally {
      setLoading(false)
    }
  }, [defaultChart, router, setChart, userPrefs])

  const landingFeaturePillars = [
    { title: 'Kundli Intelligence', detail: 'Accurate birth-chart with varga depth and applied interpretation.' },
    { title: 'Panchang Precision', detail: 'Daily tithi, nakshatra, yoga, karana, and actionable muhurta timing.' },
    { title: 'Consultation Ready', detail: 'Chart workflows built for personal, family, and client-level use.' },
    { title: 'Remedy Direction', detail: 'Practical next steps rooted in classical Jyotish principles.' },
  ]

  const landingTrustStats = [
    { label: 'Core engines', value: '20+' },
    { label: 'Analysis layers', value: '50+' },
    { label: 'Primary modules', value: '8' },
    { label: 'Precision base', value: 'Swiss Ephemeris' },
  ]

  const landingJourney = [
    { step: '01', title: 'Enter Birth Details', text: 'Open Astrology app and submit date, time, and place.' },
    { step: '02', title: 'Generate Deep Chart', text: 'Instantly compute grahas, houses, dasha, and divisional charts.' },
    { step: '03', title: 'Read & Act', text: 'Move from insights to timing windows, remedies, and consultation.' },
  ]

  const landingMajorSections = [
    {
      title: 'Your Chart',
      subtitle: 'Dashboard',
      text: 'Open your chart dashboard for complete graha, house, and interpretation overview.',
      href: '/astrology',
      ctaName: 'major_sections_your_chart',
      icon: '🧿',
    },
    {
      title: 'Panchang',
      subtitle: 'Daily',
      text: 'Check tithi, nakshatra, yoga, karana and day guidance from one clean section.',
      href: '/panchang',
      ctaName: 'major_sections_panchang',
      icon: '📆',
    },
    {
      title: 'Nakshatra',
      subtitle: 'Lunar',
      text: 'Explore nakshatra-focused insights and details for deeper day-by-day understanding.',
      href: '/nakshatra',
      ctaName: 'major_sections_nakshatra',
      icon: '✨',
    },
    {
      title: 'Jaimini Astrology',
      subtitle: 'Advanced',
      text: 'Apply Jaimini principles with focused tools for deeper karmic and life-direction reading.',
      href: '/astrology?new=true',
      ctaName: 'major_sections_jaimini',
      icon: '💠',
    },
    {
      title: 'Astro Vastu',
      subtitle: 'Space',
      text: 'Blend Vastu guidance with astrology signals for home and workplace harmony.',
      href: '/vastu',
      ctaName: 'major_sections_astro_vastu',
      icon: '🏠',
    },
    {
      title: 'AstroCartography',
      subtitle: 'Location',
      text: 'Discover geography-based planetary influence for relocation, travel, and opportunities.',
      href: '/acg',
      ctaName: 'major_sections_astrocartography',
      icon: '🌍',
    },
    {
      title: 'Sarvatobhadra Chakra',
      subtitle: 'Classical',
      text: 'Access traditional S.B. Chakra style timing and influence mapping for advanced study.',
      href: '/roadmap',
      ctaName: 'major_sections_sarvatobhadra',
      icon: '◼',
    },
    {
      title: 'Muhurta Finder',
      subtitle: 'Timing',
      text: 'Find auspicious windows for important actions with practical muhurta support.',
      href: '/muhurta',
      ctaName: 'major_sections_muhurta_finder',
      icon: '🕒',
    },
    {
      title: 'Prashna',
      subtitle: 'Query',
      text: 'Get focused question-based guidance through Prashna-oriented interpretation flow.',
      href: '/roadmap',
      ctaName: 'major_sections_prashna',
      icon: '🎯',
    },
    {
      title: 'Synastry Overlay',
      subtitle: 'Compatibility',
      text: 'Overlay two charts and inspect relational patterns for compatibility and dynamics.',
      href: '/roadmap',
      ctaName: 'major_sections_synastry',
      icon: '∞',
    },
    {
      title: 'Cosmic Roadmap',
      subtitle: 'Guidance',
      text: 'Turn chart insights into a structured personal roadmap for long-term growth.',
      href: '/roadmap',
      ctaName: 'major_sections_cosmic_roadmap',
      icon: '🛣',
    },
    {
      title: 'Time Scrubber',
      subtitle: 'Transit',
      text: 'Scrub through time and inspect planetary movement windows before making decisions.',
      href: '/scrubber',
      ctaName: 'major_sections_time_scrubber',
      icon: '⏳',
    },
  ]

  const trustedBy = ['Jyotish Practitioners', 'Consultants', 'Learners', 'Seekers', 'Vedic Families', 'Wellness Guides']

  const landingVariant = searchParams.get('lpv') === 'b' ? 'b' : 'a'
  const heroCopy = landingVariant === 'b'
    ? {
        headline: 'From Kundli to clear life decisions, all in one Vedic platform.',
        subline:
          'Stop jumping across tools. Vedaansh combines deep chart analysis, panchang timing, and action-ready interpretation in one premium workflow.',
        cta: 'Start Free Chart',
      }
    : {
        headline: 'Build your complete Vedic journey on one premium platform.',
        subline:
          'Inspired by the depth users love in products like VedicRishi and AstroBharati, Vedaansh unifies serious Jyotish analysis, daily guidance, consultation workflows, and conscious life planning.',
        cta: '✦ Open Astrology App',
      }

  const trackLandingCta = React.useCallback((ctaName: string) => {
    const payload = {
      event: 'landing_cta_click',
      ctaName,
      variant: landingVariant,
      ts: Date.now(),
    }

    if (typeof window === 'undefined') return
    ;(window as any).__vedaanshLandingEvents = (window as any).__vedaanshLandingEvents ?? []
    ;(window as any).__vedaanshLandingEvents.push(payload)

    // Future-proof bridge for common analytics providers when connected.
    if (typeof (window as any).plausible === 'function') {
      ;(window as any).plausible('landing_cta_click', { props: { ctaName, variant: landingVariant } })
    }
    if (typeof (window as any).umami?.track === 'function') {
      ;(window as any).umami.track('landing_cta_click', { ctaName, variant: landingVariant })
    }
    if (typeof (window as any).posthog?.capture === 'function') {
      ;(window as any).posthog.capture('landing_cta_click', { ctaName, variant: landingVariant })
    }
  }, [landingVariant])

  const landingTestimonials = [
    {
      quote: 'This feels like a serious Jyotish workstation, not just a horoscope page. The depth and structure are excellent.',
      name: 'Early Practitioner User',
      role: 'Advanced Learner',
    },
    {
      quote: 'The Panchang + chart + interpretation flow saves time in daily guidance and consultation preparation.',
      name: 'Consultation-Focused User',
      role: 'Practicing Astrologer',
    },
    {
      quote: 'Clean UI, deep analysis, and clear next actions. This is exactly where modern Vedic platforms should go.',
      name: 'Vedic Community Member',
      role: 'Power User',
    },
  ]

  const landingFaqs = [
    {
      q: 'Is Vedaansh only for experts?',
      a: 'No. Beginners can start with guided chart interpretation, while advanced users can dive into varga, dasha, and deeper analysis.',
    },
    {
      q: 'What makes this different from typical astrology apps?',
      a: 'Vedaansh is built as a platform with analytics depth, timing tools, consultation readiness, and long-term Vedic life direction.',
    },
    {
      q: 'Can I use this for client consultations?',
      a: 'Yes. The workflow supports both personal use and practitioner-style consultation flow, including saved charts and CRM pathways.',
    },
    {
      q: 'What should I start with first?',
      a: 'Open Astrology App, cast your chart, then use Panchang and interpretation tabs to move into immediate practical actions.',
    },
  ]

  const [landingFaqOpen, setLandingFaqOpen] = useState(0)

  const moveDashboardCard = (
    sourceCard: 'summary' | 'cosmic' | 'planetary' | 'astronomical',
    targetCard: 'summary' | 'cosmic' | 'planetary' | 'astronomical',
  ) => {
    if (sourceCard === targetCard) return
    setDesktopDashboardCardOrder((current) => {
      const sourceIndex = current.indexOf(sourceCard)
      const targetIndex = current.indexOf(targetCard)
      if (sourceIndex < 0 || targetIndex < 0) return current
      const updated = [...current]
      updated.splice(sourceIndex, 1)
      updated.splice(targetIndex, 0, sourceCard)
      return updated
    })
  }

  const makeDesktopCardContainerProps = (
    cardId: 'summary' | 'cosmic' | 'planetary' | 'astronomical',
  ) => ({
    draggable: true,
    onDragStart: () => setDraggingDashboardCard(cardId),
    onDragEnd: () => setDraggingDashboardCard(null),
    onDragOver: (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault() },
    onDrop: (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      if (!draggingDashboardCard) return
      moveDashboardCard(draggingDashboardCard, cardId)
      setDraggingDashboardCard(null)
    },
    style: {
      opacity: draggingDashboardCard === cardId ? 0.55 : 1,
      cursor: 'grab',
    },
  })

  const renderDesktopDashboardCard = (
    cardId: 'summary' | 'cosmic' | 'planetary' | 'astronomical',
    dashboardChart: ChartOutput,
  ) => {
    if (cardId === 'planetary') {
      return (
        <div className="panel fade-up">
          <div className="panel-header">
            <span>Planetary Details</span>
            <button className="btn btn-ghost btn-sm" style={{ fontSize: '0.72rem', padding: '0.2rem 0.45rem', fontFamily: 'var(--font-body)' }} onClick={() => setExpandGraha(!expandGraha)}>
              {expandGraha ? '▴ Less' : '▾ More'}
            </button>
          </div>
          <div style={{ padding: '0.4rem 0' }}>
            <GrahaTable
              grahas={dashboardChart.grahas}
              vargas={dashboardChart.vargas}
              vargaLagnas={dashboardChart.vargaLagnas}
              lagnas={dashboardChart.lagnas}
              upagrahas={dashboardChart.upagrahas}
              activeVarga={activeVarga}
              onVargaChange={setActiveVarga}
              limited={!expandGraha}
            />
          </div>
        </div>
      )
    }

    if (cardId === 'astronomical') {
      return (
        <div className="panel fade-up">
          <div className="panel-header">
            <span>Astronomical Details</span>
            <button className="btn btn-ghost btn-sm" style={{ fontSize: '0.72rem', padding: '0.2rem 0.45rem', fontFamily: 'var(--font-body)' }} onClick={() => setExpandAstro(!expandAstro)}>
              {expandAstro ? '▴ Less' : '▾ More'}
            </button>
          </div>
          <div style={{ maxHeight: expandAstro ? 'none' : '220px', overflow: 'hidden', position: 'relative', padding: '0.4rem 0.5rem' }}>
            <AstroDetailsPanel chart={dashboardChart} />
            {!expandAstro && (
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '48px', background: 'linear-gradient(transparent, var(--surface-1))', pointerEvents: 'none' }} />
            )}
          </div>
        </div>
      )
    }

    if (cardId === 'summary') {
      return (
        <div className="panel fade-up">
          <div className="panel-header">
            <span>Today&apos;s Timeline</span>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)' }}>☽ {dashboardChart.panchang.nakshatra.name}</span>
              <select
                value={dashaSystem}
                onChange={(e) => setDashaSystem(e.target.value as any)}
                style={{ padding: '0.16rem 0.36rem', fontSize: '0.7rem', background: 'var(--surface-3)', color: 'var(--text-primary)', border: '1px solid var(--border-soft)', borderRadius: '3px', fontFamily: 'var(--font-body)', cursor: 'pointer' }}
              >
                <option value="vimshottari">Viṁśottarī</option>
                <option value="ashtottari">Aṣṭottarī</option>
                <option value="yogini">Yoginī</option>
                <option value="chara">Chara</option>
              </select>
            </div>
          </div>
          <div style={{ padding: '0.5rem', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0.5rem' }}>
            <div>
              {(() => {
                const nodes = dashaSystem === 'vimshottari'
                  ? (vimshottariTara === 'Mo' ? dashboardChart.dashas.vimshottari : (altVimshottari ?? dashboardChart.dashas.vimshottari))
                  : (dashboardChart.dashas[dashaSystem] ?? [])
                if (!nodes || nodes.length === 0) return <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', padding: '0.5rem', fontFamily: 'var(--font-body)' }}>No data.</div>
                return <DashaTree nodes={nodes} birthDate={new Date(dashboardChart.meta.birthDate)} />
              })()}
            </div>
            <div>
              <ActiveHousesCard chart={dashboardChart} transitMoonLon={todayPanchang?.moonLongitudeSidereal} />
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="panel fade-up">
        <div className="panel-header">
          <span>Cosmic Weather</span>
          <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            ☽ {dashboardChart.panchang.nakshatra.name}
          </span>
        </div>
        <div style={{ padding: '0.45rem 0.55rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>

          {/* Cosmic weather compact block */}
          <PersonalDayCard
            birthMoonNakIdx={dashboardChart.panchang.nakshatra.index}
            birthMoonName={dashboardChart.panchang.nakshatra.name}
            latitude={dashboardChart.meta.latitude}
            longitude={dashboardChart.meta.longitude}
            timezone={dashboardChart.meta.timezone}
            todayPanchang={todayPanchang}
          />

          {/* Divider */}
          <div style={{ borderTop: '1px solid var(--border-soft)' }} />

          {/* Daily Suitability */}
          <div>
            <div style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Daily Suitability</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: '0.65rem', rowGap: '0.28rem' }}>
              {[
                { label: 'Spiritual', icon: '✦', rating: 95, color: 'var(--teal)' },
                { label: 'Wellness',  icon: '✦', rating: 82, color: 'var(--teal)' },
                { label: 'Learning',  icon: '✦', rating: 78, color: 'var(--gold)' },
                { label: 'Business',  icon: '✦', rating: 45, color: 'var(--rose)' },
                { label: 'Travel',    icon: '✦', rating: 30, color: 'var(--rose)' },
                { label: 'Property',  icon: '✦', rating: 15, color: 'var(--rose)' },
              ].map((act, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.12rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>{act.label}</span>
                    <span style={{ fontSize: '0.6rem', fontWeight: 700, color: act.color, fontFamily: 'var(--font-mono)' }}>{act.rating}%</span>
                  </div>
                  <div style={{ height: 2, background: 'var(--surface-3)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${act.rating}%`, background: act.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    )
  }

  const leftDashboardCards = desktopDashboardCardOrder.slice(0, 2)
  const rightDashboardCards = desktopDashboardCardOrder.slice(2)

  return (
    <div className="main-responsive-padding" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      {loading ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', padding: '6rem 2rem', minHeight: '60vh' }}>
          <div className="spin-loader" style={{ width: 56, height: 56, border: '4px solid var(--border-soft)', borderTopColor: 'var(--gold)', borderRadius: '50%', borderLeftColor: 'transparent' }} />
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--text-gold)', margin: '0 0 0.5rem 0', fontWeight: 500 }}>Recalculating Karma…</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Aligning with stellar coordinates with Swiss Ephemeris precision.</p>
          </div>
        </div>
      ) : chart ? (
         <div className="fade-up" style={{ minWidth: 0 }}>
            
            {/* Compact Header Strip */}
            <div className="chart-header-row" style={isMobile ? { position: 'relative' } : undefined}>
              <div className="chart-name-strip">
                <span className="name-primary">{chart.meta.name}</span>
                <span className="name-sep hide-mobile">·</span>
                <span className="name-detail hide-mobile">{chart.meta.birthDate} {chart.meta.birthTime}</span>
                <span className="name-sep hide-mobile">·</span>
                <span className="name-detail hide-mobile" style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{chart.meta.birthPlace}</span>
                <span className="name-sep hide-mobile">·</span>
                <span className="name-asc hide-mobile">
                  {RASHI_NAMES[chart.lagnas.ascRashi as Rashi]} {chart.lagnas.ascDegreeInRashi.toFixed(1)}°
                </span>
              </div>

              {isMobile && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    zIndex: 5,
                    display: 'flex',
                    gap: '0.4rem',
                    alignItems: 'center',
                  }}
                >
                  {status === 'authenticated' && (
                    <button
                      type="button"
                      onClick={() => handleSave('regular')}
                      disabled={saving || saveDone}
                      aria-label="Save chart"
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 8,
                        border: `1px solid ${saveDone ? 'var(--accent)' : 'var(--border-soft)'}`,
                        background: saveDone ? 'rgba(34,197,94,0.1)' : 'var(--surface-2)',
                        color: saveDone ? 'var(--accent)' : 'var(--text-primary)',
                        fontSize: '1rem',
                        lineHeight: 1,
                        cursor: saving || saveDone ? 'default' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                      }}
                    >
                      {saving ? (
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, opacity: 0.7 }}>…</span>
                      ) : saveDone ? (
                        <span style={{ fontSize: '0.85rem' }}>✓</span>
                      ) : (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                          <polyline points="17 21 17 13 7 13 7 21"/>
                          <polyline points="7 3 7 8 15 8"/>
                        </svg>
                      )}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setMobileHeaderMenuOpen((s) => !s)}
                    aria-label="Open chart actions"
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 8,
                      border: '1px solid var(--border-soft)',
                      background: 'var(--surface-2)',
                      color: 'var(--text-primary)',
                      fontSize: '1.15rem',
                      lineHeight: 1,
                      cursor: 'pointer',
                    }}
                  >
                    ⋮
                  </button>
                </div>
              )}
              {isMobile && mobileHeaderMenuOpen && (
                <>
                  <button
                    type="button"
                    aria-label="Close actions menu"
                    onClick={() => setMobileHeaderMenuOpen(false)}
                    style={{
                      position: 'fixed',
                      inset: 0,
                      zIndex: 40,
                      border: 'none',
                      background: 'rgba(0,0,0,0.22)',
                      padding: 0,
                      cursor: 'pointer',
                    }}
                  />
                  <div
                    style={{
                      position: 'fixed',
                      top: 76,
                      right: 16,
                      zIndex: 41,
                      width: 220,
                      background: 'var(--surface-1)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--r-md)',
                      boxShadow: 'var(--shadow-card)',
                      padding: '0.55rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.45rem',
                    }}
                  >
                    {status === 'authenticated' && (
                      <button
                        onClick={() => {
                          setMobileHeaderMenuOpen(false)
                          handleSave('regular')
                        }}
                        disabled={saving || saveDone}
                        className={`btn ${saveDone ? 'btn-ghost' : 'btn-primary'} btn-sm`}
                        style={{ width: '100%', justifyContent: 'center' }}
                      >
                        {saving ? 'Saving…' : saveDone ? '✓ Saved' : '+ Save Chart'}
                      </button>
                    )}
                    <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                      <ExportPdfButton chart={chart} compact />
                      <EmailChartButton chart={chart} compact />
                    </div>
                    <button
                      onClick={() => {
                        setMobileHeaderMenuOpen(false)
                        setIsFormOpen(true)
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{
                        width: '100%',
                        justifyContent: 'center',
                        background: 'var(--surface-3)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-bright)',
                      }}
                    >
                      ✎ Edit Details
                    </button>
                    <button
                      onClick={() => {
                        setMobileHeaderMenuOpen(false)
                        setChart(null)
                        setIsFormOpen(true)
                      }}
                      className="btn btn-primary btn-sm"
                      style={{
                        width: '100%',
                        justifyContent: 'center',
                        background: 'var(--gold-faint)',
                        color: 'var(--text-gold)',
                        border: '1px solid var(--gold)',
                      }}
                    >
                      + New Chart
                    </button>
                  </div>
                </>
              )}

              <div className="chart-actions-compact" style={{ display: isMobile ? 'none' : 'flex' }}>
                  {status === 'authenticated' && (
                    <button onClick={() => handleSave('regular')} disabled={saving || saveDone} className={`btn ${saveDone ? 'btn-ghost' : 'btn-primary'} btn-sm`}>
                      {saving ? '…' : saveDone ? '✓ Saved' : '+ Save'}
                    </button>
                  )}
                  {status === 'authenticated' && userPlan === 'platinum' && (
                    <button onClick={handleSaveToCRM} disabled={crmSaving || crmDone} className={`btn ${crmDone ? 'btn-ghost' : 'btn-secondary'} btn-sm`}
                      style={{ borderColor: 'var(--gold)', color: crmDone ? 'var(--text-muted)' : 'var(--gold)' }}>
                      {crmSaving ? '…' : crmDone ? '✓ CRM' : 'CRM'}
                    </button>
                  )}
                  <ExportPdfButton chart={chart} compact />
                  <EmailChartButton chart={chart} compact />
                  <button onClick={() => setIsFormOpen(true)} className="btn btn-secondary btn-sm">✎</button>
                  <button onClick={() => { setChart(null); setIsFormOpen(true) }} className="btn btn-primary btn-sm">+ New</button>
              </div>
            </div>

            {activeTab === 'dashboard' && (
              <MajorKundaliStrip chart={chart} todayPanchang={todayPanchang} />
            )}
           
            {/* ── Full-width workspaces (replaces two-column layout) ── */}
            {(activeTab === 'varshaphal' || activeTab === 'planets' || activeTab === 'house' || activeTab === 'interpretation' || activeTab === 'kp-stellar') && (
              <div className={`${(activeTab === 'planets' || activeTab === 'house' || activeTab === 'kp-stellar') ? '' : 'panel'} fade-up`} style={{ padding: (activeTab === 'planets' || activeTab === 'house' || activeTab === 'kp-stellar') ? '0' : '0.65rem', width: '100%' }}>
                {activeTab === 'planets' ? (
                    <PlanetsWorkspace chart={chart} />
                  ) : activeTab === 'house' ? (
                    <HousePanel chart={chart} />
                ) : activeTab === 'interpretation' ? (
                  <InterpretationPanel interpretation={chart.interpretation} />
                ) : activeTab === 'kp-stellar' ? (
                  <KPStellarPanel chart={chart} />
                ) : (
                  <VarshaphalPanel natalChart={chart} />
                )}
              </div>
            )}

             {/* Responsive: Dominant CHART | Tab Analysis — hidden when full-width workspace active */}
             {activeTab !== 'varshaphal' && activeTab !== 'planets' && activeTab !== 'house' && activeTab !== 'kp-stellar' && <div className="chart-layout-grid">
               {/* LEFT: Dominant chart area (Primary Focus) */}
               <div style={{ 
                 flex: '1 1 460px', 
                 minWidth: 'min(100%, 380px)', 
                 display: 'flex', 
                 flexDirection: 'column', 
                 gap: '0.75rem',
                 order: 1
               }}>
                  <TransitOverlay natalChart={chart} onTransitLoad={setTransitGrahas} />
                  <VargaSwitcher
                     vargas={chart.vargas}
                     vargaLagnas={chart.vargaLagnas ?? {}}
                     ascRashi={chart.lagnas.ascRashi}
                     lagnas={chart.lagnas}
                     arudhas={chart.arudhas}
                     userPlan={userPlan}
                     moonNakIndex={moonNakIndex}
                     tithiNumber={tithiNumber}
                     varaNumber={varaNumber}
                     onActiveVargaChange={setActiveVarga}
                     mobileSelectedVarga={activeVarga}
                     onMobileSelectedVargaChange={setActiveVarga}
                     hideMobileSelector={isMobile}
                     transitGrahas={transitGrahas ?? undefined}
                     chart={chart}
                     transitMoonLon={todayPanchang?.moonLongitudeSidereal}
                  />

                  {/* ── MOBILE DASHBOARD CONTENT ─────────────────────── */}
                  {activeTab === 'dashboard' && isMobile && (
                    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingBottom: '4.5rem' }}>

                      {/* ── Tab content ── */}
                      {mobileDashTab === 'astro' && (
                        <div className="panel">
                          <div className="panel-header"><span>Astro Details</span></div>
                          <div style={{ padding: '0.4rem 0.55rem' }}><AstroDetailsPanel chart={chart} /></div>
                        </div>
                      )}

                      {mobileDashTab === 'planetary' && (
                        <GrahaTable
                          grahas={chart.grahas} vargas={chart.vargas} vargaLagnas={chart.vargaLagnas}
                          lagnas={chart.lagnas} upagrahas={chart.upagrahas}
                          activeVarga={activeVarga} onVargaChange={setActiveVarga} limited={!expandGraha}
                        />
                      )}

                      {mobileDashTab === 'dashas' && (
                        <div className="panel">
                          <div className="panel-header">
                            <span>Dasha Timeline</span>
                            <select value={dashaSystem} onChange={(e) => setDashaSystem(e.target.value as any)}
                              style={{ padding: '0.15rem 0.35rem', fontSize: '0.62rem', background: 'var(--surface-3)', color: 'var(--text-primary)', border: '1px solid var(--border-soft)', borderRadius: '3px', fontFamily: 'inherit' }}>
                              <option value="vimshottari">Viṁśottarī</option>
                              <option value="ashtottari">Aṣṭottarī</option>
                              <option value="yogini">Yoginī</option>
                              <option value="chara">Chara</option>
                            </select>
                          </div>
                          <div style={{ padding: '0.4rem 0.55rem' }}>
                            {(() => {
                              const nodes = dashaSystem === 'vimshottari'
                                ? (vimshottariTara === 'Mo' ? chart.dashas.vimshottari : (altVimshottari ?? chart.dashas.vimshottari))
                                : (chart.dashas[dashaSystem] ?? [])
                              if (!nodes?.length) return <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', margin: 0 }}>Data unavailable.</p>
                              return <DashaTree nodes={nodes} birthDate={new Date(chart.meta.birthDate)} />
                            })()}
                          </div>
                        </div>
                      )}

                      {mobileDashTab === 'today' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <div className="panel">
                            <div className="panel-header"><span>Cosmic Weather</span></div>
                            <div style={{ padding: '0.4rem 0.55rem' }}>
                              <PersonalDayCard
                                birthMoonNakIdx={chart.panchang.nakshatra.index}
                                birthMoonName={chart.panchang.nakshatra.name}
                                latitude={chart.meta.latitude} longitude={chart.meta.longitude}
                                timezone={chart.meta.timezone} todayPanchang={todayPanchang}
                              />
                            </div>
                          </div>
                          <div className="panel">
                            <div className="panel-header"><span>Active Houses</span></div>
                            <div style={{ padding: '0.4rem 0.55rem' }}>
                              <ActiveHousesCard chart={chart} transitMoonLon={todayPanchang?.moonLongitudeSidereal} />
                            </div>
                          </div>
                          <div className="panel">
                            <div className="panel-header"><span>Daily Suitability</span></div>
                            <div style={{ padding: '0.4rem 0.55rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem' }}>
                              {[
                                { label: 'Spiritual', rating: 95, color: 'var(--teal)' },
                                { label: 'Wellness',  rating: 82, color: 'var(--teal)' },
                                { label: 'Learning',  rating: 78, color: 'var(--gold)' },
                                { label: 'Business',  rating: 45, color: 'var(--rose)' },
                                { label: 'Travel',    rating: 30, color: 'var(--rose)' },
                                { label: 'Property',  rating: 15, color: 'var(--rose)' },
                              ].map((act) => (
                                <div key={act.label} style={{ display: 'flex', flexDirection: 'column', gap: '0.12rem' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{act.label}</span>
                                    <span style={{ fontSize: '0.62rem', fontWeight: 700, color: act.color, fontFamily: 'var(--font-mono)' }}>{act.rating}%</span>
                                  </div>
                                  <div style={{ height: 3, background: 'var(--surface-3)', borderRadius: 2, overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${act.rating}%`, background: act.color }} />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {mobileDashTab === 'panchang' && (
                        <div className="panel">
                          <div className="panel-header"><span>Natal Panchang</span></div>
                          <div style={{ padding: '0.4rem 0.55rem' }}><NatalPanchangPanel p={chart.panchang} /></div>
                        </div>
                      )}

                      {mobileDashTab === 'strengths' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {/* Sub-tabs */}
                          <div style={{ display: 'flex', gap: '0.3rem', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                            {([
                              { id: 'shadbala', label: 'Ṣaḍbala' },
                              { id: 'bhava', label: 'Bhāva' },
                              { id: 'vimsopaka', label: 'Viṁśopaka' },
                              { id: 'ashtakavarga', label: 'Aṣṭaka' },
                            ] as const).map(({ id, label }) => (
                              <button key={id} type="button" onClick={() => setMobileStrengthTab(id)}
                                style={{ whiteSpace: 'nowrap', padding: '0.3rem 0.7rem', fontSize: '0.65rem', fontWeight: 700, borderRadius: 999, cursor: 'pointer', border: mobileStrengthTab === id ? '1.5px solid var(--gold)' : '1px solid var(--border-soft)', background: mobileStrengthTab === id ? 'var(--gold-faint)' : 'var(--surface-2)', color: mobileStrengthTab === id ? 'var(--text-gold)' : 'var(--text-muted)' }}>
                                {label}
                              </button>
                            ))}
                          </div>
                          <div className="panel">
                            <div style={{ padding: '0.4rem 0.55rem' }}>
                              {mobileStrengthTab === 'shadbala' && (
                                chart.shadbala ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                    <div style={{ display: 'flex', gap: '0.6rem', fontSize: '0.68rem' }}>
                                      <span>⬆ <b style={{ color: 'var(--teal)' }}>{GRAHA_NAMES[chart.shadbala.strongest as GrahaId] ?? chart.shadbala.strongest}</b> {(chart.shadbala.planets[chart.shadbala.strongest as GrahaId]?.total ?? 0).toFixed(1)}R</span>
                                      <span>⬇ <b style={{ color: 'var(--rose)' }}>{GRAHA_NAMES[chart.shadbala.weakest as GrahaId] ?? chart.shadbala.weakest}</b> {(chart.shadbala.planets[chart.shadbala.weakest as GrahaId]?.total ?? 0).toFixed(1)}R</span>
                                    </div>
                                    {(['Su','Mo','Ma','Me','Ju','Ve','Sa'] as GrahaId[])
                                      .map(id => ({ id, name: GRAHA_NAMES[id], total: chart.shadbala.planets[id]?.total ?? 0, ratio: chart.shadbala.planets[id]?.ratio ?? 0 }))
                                      .sort((a,b) => b.total - a.total)
                                      .map(row => (
                                        <div key={row.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                          <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', width: '3.5rem', flexShrink: 0 }}>{row.name}</span>
                                          <div style={{ flex: 1, height: 5, borderRadius: 2, background: 'var(--surface-3)', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${Math.max(8, Math.min(100, row.ratio * 100))}%`, background: 'var(--teal)', borderRadius: 2 }} />
                                          </div>
                                          <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', width: '2.8rem', textAlign: 'right', flexShrink: 0 }}>{row.total.toFixed(1)}R</span>
                                        </div>
                                      ))}
                                    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', marginTop: '0.3rem' }}>
                                      <ShadbalaTable shadbala={chart.shadbala} classicMultiChartOnly />
                                    </div>
                                  </div>
                                ) : <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', margin: 0 }}>Unavailable.</p>
                              )}
                              {mobileStrengthTab === 'bhava' && (
                                chart.bhavaBala ? <BhavaBalaTable bhavaBala={chart.bhavaBala} chart={chart} />
                                  : <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', margin: 0 }}>Unavailable.</p>
                              )}
                              {mobileStrengthTab === 'vimsopaka' && (
                                chart.vimsopaka ? <VimsopakaBalaPanel vimsopaka={chart.vimsopaka} userPlan={userPlan} />
                                  : <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', margin: 0 }}>Unavailable.</p>
                              )}
                              {mobileStrengthTab === 'ashtakavarga' && (
                                chart.ashtakavarga
                                  ? <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}><AshtakavargaGrid ashtakavarga={chart.ashtakavarga} ascRashi={chart.lagnas.ascRashi ?? 1} /></div>
                                  : <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', margin: 0 }}>Unavailable.</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {mobileDashTab === 'yogas' && (
                        <div className="panel">
                          <div className="panel-header"><span>Graha Yogas</span></div>
                          <div style={{ padding: '0.4rem 0.55rem' }}>
                            {chart.yogas ? <YogaList yogas={chart.yogas} /> : <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', margin: 0 }}>Unavailable.</p>}
                          </div>
                        </div>
                      )}

                    </div>
                  )}

                  {/* Bottom tab bar rendered via portal — see below */}

                  {activeTab === 'dashboard' && !isMobile && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {leftDashboardCards.map((cardId) => (
                        <div key={cardId} {...makeDesktopCardContainerProps(cardId)}>
                          {renderDesktopDashboardCard(cardId, chart)}
                        </div>
                      ))}
                    </div>
                  )}
               </div>

               {/* RIGHT: Active Tab Content (Sidebar Analysis) — hidden on mobile dashboard */}
               {!(isMobile && activeTab === 'dashboard') && (
               <div className="sticky-desktop" style={{ 
                 flex: `1 1 420px`, 
                 minWidth: `min(100%, 360px)`,
                 display: 'flex', flexDirection: 'column', 
                 gap: '0.75rem', 
                 order: 2 
               }}>
                  {activeTab === 'dashboard' && !isMobile && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {rightDashboardCards.map((cardId) => (
                        <div key={cardId} {...makeDesktopCardContainerProps(cardId)}>
                          {renderDesktopDashboardCard(cardId, chart)}
                        </div>
                      ))}
                    </div>
                  )}


                  {activeTab === 'dasha' && (
                     <div className="panel fade-up">
                       <div className="panel-header">
                         <span>Daśā Timeline</span>
                         <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                           {(['vimshottari','ashtottari','yogini','chara'] as const).map((id) => {
                             const shortLabel: Record<string,string> = { vimshottari:'Viṁ', ashtottari:'Aṣṭ', yogini:'Yog', chara:'Cha' }
                             return (
                               <button key={id} onClick={() => setDashaSystem(id)} style={{
                                 padding: '0.15rem 0.4rem', fontSize: '0.62rem', fontFamily: 'inherit',
                                 background: dashaSystem === id ? 'var(--gold-faint)' : 'transparent',
                                 border: `1px solid ${dashaSystem === id ? 'var(--gold)' : 'var(--border-soft)'}`,
                                 borderRadius: 3, cursor: 'pointer',
                                 color: dashaSystem === id ? 'var(--text-gold)' : 'var(--text-muted)',
                               }}>{shortLabel[id]}</button>
                             )
                           })}
                         </div>
                       </div>
                       <div style={{ padding: '0.5rem 0.65rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                         {dashaSystem === 'vimshottari' && (
                           <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
                             <div style={{ display:'flex', alignItems:'center', gap:'0.35rem', flexWrap:'wrap' }}>
                               <span style={{ fontSize:'0.6rem', color:'var(--text-muted)', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase' }}>Tara:</span>
                               {(['Mo','As','Su','Ma','Me','Ju','Ve','Sa','Ra','Ke'] as const).map(id => {
                                 const locked = userPlan === 'free' && id !== 'Mo'
                                 const labels: Record<string,string> = { Mo:'Mo', As:'As', Su:'Su', Ma:'Ma', Me:'Me', Ju:'Ju', Ve:'Ve', Sa:'Sa', Ra:'Ra', Ke:'Ke' }
                                 return (
                                   <button key={id} onClick={() => locked ? (window.location.href='/pricing') : setVimshottariTara(id)}
                                     title={locked ? 'Requires Gold plan' : undefined}
                                     style={{ padding:'0.1rem 0.3rem', fontSize:'0.65rem', fontFamily:'inherit',
                                       background: vimshottariTara===id ? 'var(--gold-faint)' : 'var(--surface-3)',
                                       border: `1px solid ${vimshottariTara===id ? 'var(--gold)' : 'var(--border-soft)'}`,
                                       borderRadius:3, cursor:'pointer', color: locked ? 'var(--text-muted)' : (vimshottariTara===id ? 'var(--text-gold)' : 'var(--text-secondary)'),
                                       opacity: locked ? 0.5 : 1,
                                     }}>
                                     {locked ? '🔒' : ''}{labels[id]}
                                   </button>
                                 )
                               })}
                             </div>
                             <DashaTree nodes={vimshottariTara==='Mo' ? chart.dashas.vimshottari : (altVimshottari ?? chart.dashas.vimshottari)} birthDate={new Date(chart.meta.birthDate)} />
                           </div>
                         )}
                         {dashaSystem === 'ashtottari' && (chart.dashas.ashtottari?.length ? <DashaTree nodes={chart.dashas.ashtottari} birthDate={new Date(chart.meta.birthDate)} /> : <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', padding:'0.75rem', textAlign:'center' }}>Aṣṭottarī computation required.</div>)}
                         {dashaSystem === 'yogini' && (chart.dashas.yogini?.length ? <DashaTree nodes={chart.dashas.yogini} birthDate={new Date(chart.meta.birthDate)} /> : <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', padding:'0.75rem', textAlign:'center' }}>Yoginī computation required.</div>)}
                         {dashaSystem === 'chara' && (chart.dashas.chara?.length ? <DashaTree nodes={chart.dashas.chara} birthDate={new Date(chart.meta.birthDate)} /> : <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', padding:'0.75rem', textAlign:'center' }}>Chara computation required.</div>)}
                       </div>
                     </div>
                  )}

                  {activeTab === 'panchang' && (
                     <div className="panel fade-up">
                        <div className="panel-header"><span>Natal Pañcāṅga</span></div>
                        <div style={{ padding: '0.5rem 0.65rem' }}><NatalPanchangPanel p={chart.panchang} /></div>
                     </div>
                  )}

                  {activeTab === 'astro-details' && (
                    <div className="panel fade-up" style={{ flexShrink: 0 }}>
                      <div className="panel-header"><span>Astro Details</span></div>
                      <div style={{ padding: '0.5rem 0.65rem' }}><AstroDetailsPanel chart={chart} /></div>
                    </div>
                  )}

                  {activeTab === 'yogas' && (
                     <div className="panel fade-up">
                        <div className="panel-header"><span>Graha Yogas</span></div>
                        <div style={{ padding: '0.5rem 0.65rem' }}>
                          {chart.yogas ? <YogaList yogas={chart.yogas} /> : <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.78rem', margin: 0 }}>Recalculate chart to see Yogas.</p>}
                        </div>
                     </div>
                  )}

                  {activeTab === 'arudhas' && (
                     <div className="panel fade-up">
                        <div className="panel-header"><span>Bhāva Āruḍhas</span></div>
                        <div style={{ padding: '0.5rem 0.65rem' }}><ArudhaPanel arudhas={chart.arudhas} /></div>
                     </div>
                  )}

                  {activeTab === 'shadbala' && (
                    <div className="panel fade-up">
                      <div className="panel-header"><span>Ṣaḍbala</span></div>
                      <div style={{ padding: '0.5rem 0.65rem' }}>
                        {chart.shadbala
                          ? <ShadbalaTable shadbala={chart.shadbala} hideDetails={true} preferClassicCharts={true} variant="widget" />
                          : <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', margin: 0, fontSize: '0.78rem' }}>Shadbala data unavailable.</p>}
                      </div>
                    </div>
                  )}

                   {activeTab === 'bhava-bala' && (
                    <div className="panel fade-up">
                      <div className="panel-header"><span>Bhāva Bala</span></div>
                      <div style={{ padding: '0.5rem 0.65rem' }}>
                        {chart.bhavaBala ? (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--teal)' }}>{chart.bhavaBala.houses[chart.bhavaBala.strongestHouse].totalRupa.toFixed(1)} R</div>
                              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Strongest H{chart.bhavaBala.strongestHouse}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--rose)' }}>{chart.bhavaBala.houses[chart.bhavaBala.weakestHouse].totalRupa.toFixed(1)} R</div>
                              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Weakest H{chart.bhavaBala.weakestHouse}</div>
                            </div>
                          </div>
                        ) : <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', margin: 0, fontSize: '0.78rem' }}>Bhava Bala data unavailable.</p>}
                      </div>
                    </div>
                  )}

                  {activeTab === 'vimsopaka' && (
                    <div className="panel fade-up">
                      <div className="panel-header"><span>Viṁśopaka</span></div>
                      <div style={{ padding: '0.5rem 0.65rem' }}>
                        {chart.vimsopaka ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-gold)' }}>{chart.vimsopaka.planets[chart.vimsopaka.strongest]?.shodasvarga.toFixed(1)}</div>
                              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Strongest: {chart.vimsopaka.strongest}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--rose)' }}>{chart.vimsopaka.planets[chart.vimsopaka.weakest]?.shodasvarga.toFixed(1)}</div>
                              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Weakest: {chart.vimsopaka.weakest}</div>
                            </div>
                          </div>
                        ) : <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', margin: 0, fontSize: '0.78rem' }}>Vimsopaka data unavailable.</p>}
                      </div>
                    </div>
                  )}
                </div>
               )}
             </div>}  {/* end chart-layout-grid conditional */}

               {/* BOTTOM: Full-width Shadbala below charts */}
               {activeTab === 'shadbala' && (
                 <div className="panel fade-up" style={{ marginTop: '0.75rem' }}>
                   <div className="panel-header"><span>Ṣaḍbala Strength</span></div>
                   <div style={{ padding: '0.5rem 0.65rem' }}>
                     {chart.shadbala ? <ShadbalaTable shadbala={chart.shadbala} /> : <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.78rem' }}>Recalculate chart to see Shadbala.</div>}
                   </div>
                 </div>
               )}

               {/* BOTTOM: Full-width Bhava Bala below charts */}
               {activeTab === 'bhava-bala' && (
                 <div className="panel fade-up" style={{ marginTop: '0.75rem' }}>
                   <div className="panel-header"><span>Bhāva Bala — House Strength</span></div>
                   <div style={{ padding: '0.5rem 0.65rem' }}>
                     {chart.bhavaBala ? <BhavaBalaTable bhavaBala={chart.bhavaBala} chart={chart} /> : <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.78rem' }}>Recalculate chart to see Bhava Bala.</div>}
                   </div>
                 </div>
               )}

               {/* BOTTOM: Full-width Ashtakavarga below charts */}
               {activeTab === 'ashtakavarga' && (
                 <div className="panel fade-up" style={{ marginTop: '0.75rem' }}>
                   <div className="panel-header"><span>Aṣṭakavarga Intelligence</span></div>
                   <div style={{ padding: '0.5rem 0.65rem' }}>
                     {chart.ashtakavarga ? <AshtakavargaGrid ashtakavarga={chart.ashtakavarga} ascRashi={chart.lagnas.ascRashi ?? 1} /> : <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.78rem' }}>Recalculate chart to see Aṣṭakavarga.</div>}
                   </div>
                 </div>
               )}

                {/* BOTTOM: Full-width Vimsopaka below charts */}
                {activeTab === 'vimsopaka' && (
                  <div className="panel fade-up" style={{ marginTop: '0.75rem' }}>
                    <div className="panel-header"><span>Viṁśopaka Bala</span></div>
                    {chart.vimsopaka ? <VimsopakaBalaPanel vimsopaka={chart.vimsopaka} userPlan={userPlan} /> : <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.75rem', fontSize: '0.78rem' }}>Viṁśopaka data unavailable — recalculate chart.</div>}
                  </div>
                )}

               {/* BOTTOM: Dashboard Extended Details */}
               {activeTab === 'dashboard' && (
                  <div style={{
                    flex: '1 1 100%',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
                    gap: '0.6rem',
                    marginTop: '0.6rem',
                    order: 3
                  }}>

                    {/* ── Ashtakavarga ── */}
                    <div className="panel fade-up" style={{ gridColumn: dashExpandAv ? '1 / -1' : undefined }}>
                      <div className="panel-header">
                        <span>Ashtakavarga</span>
                        {chart.ashtakavarga && <button type="button" onClick={() => setDashExpandAv(e => !e)} style={{ fontSize: '0.6rem', border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>{dashExpandAv ? '▴' : '▾ Full'}</button>}
                      </div>
                      <div style={{ padding: '0.35rem 0.55rem' }}>
                        {!chart.ashtakavarga ? <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', margin: 0 }}>Unavailable.</p>
                        : dashExpandAv ? <AshtakavargaGrid ashtakavarga={chart.ashtakavarga} ascRashi={chart.lagnas.ascRashi ?? 1} />
                        : dashboardAshtakSummary ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                            {/* Key metrics row */}
                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'baseline' }}>
                              <div>
                                <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-gold)', fontFamily: 'var(--font-mono)' }}>{dashboardAshtakSummary.savTotal}</span>
                                <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)', marginLeft: 3 }}>SAV · avg {dashboardAshtakSummary.avg}/sign</span>
                              </div>
                            </div>
                            {/* Mini house bar chart */}
                            <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-end', height: 28 }}>
                              {chart.ashtakavarga.sav.map((val, i) => {
                                const maxVal = Math.max(...chart.ashtakavarga!.sav)
                                const pct = (val / maxVal) * 100
                                const isHigh = val === dashboardAshtakSummary!.highest.val
                                const isLow = val === dashboardAshtakSummary!.lowest.val
                                return (
                                  <div key={i} title={`H${i+1}: ${val}b`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                    <div style={{ width: '100%', height: `${pct}%`, minHeight: 2, background: isHigh ? 'var(--teal)' : isLow ? 'var(--rose)' : 'var(--border)', borderRadius: '1px 1px 0 0' }} />
                                  </div>
                                )
                              })}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.58rem', color: 'var(--text-muted)' }}>
                              <span style={{ color: 'var(--teal)' }}>▲ H{dashboardAshtakSummary.highest.house} ({RASHI_SHORT[dashboardAshtakSummary.highest.rashi]}) {dashboardAshtakSummary.highest.val}b</span>
                              <span style={{ color: 'var(--rose)' }}>▼ H{dashboardAshtakSummary.lowest.house} ({RASHI_SHORT[dashboardAshtakSummary.lowest.rashi]}) {dashboardAshtakSummary.lowest.val}b</span>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {/* ── Shadbala ── */}
                    <div className="panel fade-up" style={{ gridColumn: dashExpandShad ? '1 / -1' : undefined }}>
                      <div className="panel-header">
                        <span>Ṣaḍbala</span>
                        {chart.shadbala && <button type="button" onClick={() => setDashExpandShad(e => !e)} style={{ fontSize: '0.6rem', border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>{dashExpandShad ? '▴' : '▾ Full'}</button>}
                      </div>
                      <div style={{ padding: '0.35rem 0.55rem' }}>
                        {!chart.shadbala ? <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', margin: 0 }}>Unavailable.</p>
                        : dashExpandShad ? <ShadbalaTable shadbala={chart.shadbala} classicMultiChartOnly />
                        : dashboardShadbalaSummary ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            <div style={{ display: 'flex', gap: '0.6rem', fontSize: '0.65rem' }}>
                              <span>⬆ <b style={{ color: 'var(--teal)' }}>{dashboardShadbalaSummary.strongestLabel}</b> {dashboardShadbalaSummary.strongTotal}R</span>
                              <span>⬇ <b style={{ color: 'var(--rose)' }}>{dashboardShadbalaSummary.weakestLabel}</b> {dashboardShadbalaSummary.weakTotal}R</span>
                            </div>
                            {dashboardShadbalaSummary.top3.map((row, idx) => {
                              const width = Math.max(8, Math.min(100, row.ratio * 100))
                              const barColor = idx === 0 ? 'var(--teal)' : idx === 1 ? 'var(--text-gold)' : 'var(--accent)'
                              return (
                                <div key={row.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                  <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', width: '3.5rem', flexShrink: 0 }}>#{idx+1} {row.name}</span>
                                  <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'var(--surface-3)', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${width}%`, background: barColor, borderRadius: 2 }} />
                                  </div>
                                  <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', width: '2.5rem', textAlign: 'right', flexShrink: 0 }}>{row.total.toFixed(1)}R</span>
                                </div>
                              )
                            })}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {/* ── Vimsopaka ── */}
                    <div className="panel fade-up" style={{ gridColumn: dashExpandVim ? '1 / -1' : undefined }}>
                      <div className="panel-header">
                        <span>Viṁśopaka (16 Vargas)</span>
                        {chart.vimsopaka && <button type="button" onClick={() => setDashExpandVim(e => !e)} style={{ fontSize: '0.6rem', border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>{dashExpandVim ? '▴' : '▾ Full'}</button>}
                      </div>
                      <div style={{ padding: '0.35rem 0.55rem' }}>
                        {!chart.vimsopaka ? <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', margin: 0 }}>Unavailable.</p>
                        : dashExpandVim ? <VimsopakaBalaPanel vimsopaka={chart.vimsopaka} userPlan={userPlan} />
                        : dashboardVimsopakaSummary ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            <div style={{ display: 'flex', gap: '0.6rem', fontSize: '0.65rem', alignItems: 'baseline' }}>
                              <span>⬆ <b style={{ color: 'var(--teal)' }}>{dashboardVimsopakaSummary.strongest}</b> {dashboardVimsopakaSummary.strongScore}/20</span>
                              <span>⬇ <b style={{ color: 'var(--rose)' }}>{dashboardVimsopakaSummary.weakest}</b> {dashboardVimsopakaSummary.weakScore}/20</span>
                              {dashboardVimsopakaSummary.avg && <span style={{ color: 'var(--text-muted)' }}>avg {dashboardVimsopakaSummary.avg}</span>}
                            </div>
                            {dashboardVimsopakaSummary.top3.length > 0 && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                {dashboardVimsopakaSummary.top3.map((row, idx) => {
                                  const score = typeof row.score === 'number' ? row.score : 0
                                  const pct = Math.max(8, Math.min(100, (score / 20) * 100))
                                  return (
                                    <div key={row.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                      <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', width: '3.5rem', flexShrink: 0 }}>#{idx+1} {GRAHA_NAMES[row.id as GrahaId] ?? row.id}</span>
                                      <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'var(--surface-3)', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${pct}%`, background: idx === 0 ? 'var(--teal)' : 'var(--text-gold)', borderRadius: 2 }} />
                                      </div>
                                      <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', width: '2rem', textAlign: 'right', flexShrink: 0 }}>{score.toFixed(1)}</span>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {/* ── Bhava Bala ── */}
                    <div className="panel fade-up" style={{ gridColumn: dashExpandBhava ? '1 / -1' : undefined }}>
                      <div className="panel-header">
                        <span>Bhāva Bala</span>
                        {chart.bhavaBala && <button type="button" onClick={() => setDashExpandBhava(e => !e)} style={{ fontSize: '0.6rem', border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>{dashExpandBhava ? '▴' : '▾ Full'}</button>}
                      </div>
                      <div style={{ padding: '0.35rem 0.55rem' }}>
                        {!chart.bhavaBala ? <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', margin: 0 }}>Unavailable.</p>
                        : dashExpandBhava ? <BhavaBalaTable bhavaBala={chart.bhavaBala} chart={chart} />
                        : dashboardBhavaBalaSummary ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            <div style={{ display: 'flex', gap: '0.6rem', fontSize: '0.65rem' }}>
                              <span>⬆ <b style={{ color: 'var(--teal)' }}>H{dashboardBhavaBalaSummary.strongestHouse}</b> {dashboardBhavaBalaSummary.strongTotal}R</span>
                              <span>⬇ <b style={{ color: 'var(--rose)' }}>H{dashboardBhavaBalaSummary.weakestHouse}</b> {dashboardBhavaBalaSummary.weakTotal}R</span>
                              <span style={{ color: 'var(--text-muted)' }}>avg {dashboardBhavaBalaSummary.avgRupa}R</span>
                            </div>
                            {/* House strength mini-bars for all 12 */}
                            {chart.bhavaBala.houses && (
                              <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-end', height: 24 }}>
                                {Array.from({ length: 12 }, (_, i) => {
                                  const h = chart.bhavaBala!.houses[i + 1]
                                  const val = h?.totalRupa ?? 0
                                  const allVals = Object.values(chart.bhavaBala!.houses).map(x => x.totalRupa)
                                  const maxVal = Math.max(...allVals)
                                  const pct = maxVal > 0 ? (val / maxVal) * 100 : 0
                                  const isS = i + 1 === dashboardBhavaBalaSummary!.strongestHouse
                                  const isW = i + 1 === dashboardBhavaBalaSummary!.weakestHouse
                                  return (
                                    <div key={i} title={`H${i+1}: ${val.toFixed(1)}R`} style={{ flex: 1, height: `${Math.max(6, pct)}%`, background: isS ? 'var(--teal)' : isW ? 'var(--rose)' : 'var(--border)', borderRadius: '1px 1px 0 0', alignSelf: 'flex-end' }} />
                                  )
                                })}
                              </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.55rem', color: 'var(--text-muted)' }}>
                              <span>H1</span><span>H6</span><span>H12</span>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {/* ── Natal Panchang ── */}
                    <div className="panel fade-up" style={{ gridColumn: dashExpandPanchang ? '1 / -1' : undefined }}>
                      <div className="panel-header">
                        <span>Natal Panchang</span>
                        <button type="button" onClick={() => setDashExpandPanchang(e => !e)} style={{ fontSize: '0.6rem', border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>{dashExpandPanchang ? '▴' : '▾ Full'}</button>
                      </div>
                      <div style={{ padding: '0.35rem 0.55rem' }}>
                        {dashExpandPanchang ? (
                          <NatalPanchangPanel p={chart.panchang} />
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                            {[
                              { label: 'Vāra',     value: `${chart.panchang.vara.name} · lord ${GRAHA_NAMES[chart.panchang.vara.lord as GrahaId] ?? chart.panchang.vara.lord}` },
                              { label: 'Tithi',    value: `${chart.panchang.tithi.name} (${chart.panchang.tithi.number}/30) · ${chart.panchang.tithi.paksha === 'shukla' ? 'Śukla' : 'Kṛṣṇa'}` },
                              { label: 'Nakṣatra', value: `${chart.panchang.nakshatra.name} · Pada ${chart.panchang.nakshatra.pada}` },
                              { label: 'Yoga',     value: chart.panchang.yoga.name },
                              { label: 'Karaṇa',  value: chart.panchang.karana.name },
                              { label: 'Sunrise',  value: new Date(chart.panchang.sunrise).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) },
                            ].map(({ label, value }) => (
                              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '0.18rem 0', borderBottom: '1px solid var(--border-soft)', gap: '0.5rem' }}>
                                <span style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', flexShrink: 0 }}>{label}</span>
                                <span style={{ fontSize: '0.68rem', color: 'var(--text-primary)', textAlign: 'right' }}>{value}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ── Graha Yogas ── */}
                    <div className="panel fade-up" style={{ gridColumn: dashExpandYogas ? '1 / -1' : undefined }}>
                      <div className="panel-header">
                        <span>Graha Yogas</span>
                        {chart.yogas && <button type="button" onClick={() => setDashExpandYogas(e => !e)} style={{ fontSize: '0.6rem', border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>{dashExpandYogas ? '▴' : '▾ Full'}</button>}
                      </div>
                      <div style={{ padding: '0.35rem 0.55rem' }}>
                        {!chart.yogas ? <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', margin: 0 }}>Unavailable.</p>
                        : dashExpandYogas ? <YogaList yogas={chart.yogas} />
                        : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            {/* Summary line */}
                            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginBottom: '0.15rem' }}>
                              {chart.yogas.length} yoga{chart.yogas.length !== 1 ? 's' : ''} · {chart.yogas.filter((y: any) => y.strength === 'strong' || y.strength === 'Strong').length} strong
                            </div>
                            {/* Compact yoga list */}
                            {chart.yogas.slice(0, 6).map((yoga: any, idx: number) => {
                              const isStrong = yoga.strength === 'strong' || yoga.strength === 'Strong'
                              return (
                                <div key={idx} style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', padding: '0.15rem 0', borderBottom: '1px solid var(--border-soft)' }}>
                                  <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-primary)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {yoga.name}
                                  </span>
                                  {isStrong && <span style={{ fontSize: '0.55rem', fontWeight: 700, padding: '0 4px', borderRadius: 2, background: 'rgba(78,205,196,0.1)', color: 'var(--teal)', border: '1px solid rgba(78,205,196,0.3)', flexShrink: 0 }}>Strong</span>}
                                  {yoga.category && <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', flexShrink: 0 }}>{yoga.category}</span>}
                                </div>
                              )
                            })}
                            {chart.yogas.length > 6 && (
                              <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>+{chart.yogas.length - 6} more — click ▾ Full</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                 </div>
               )}
             </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, padding: 'clamp(1rem, 2.5vw, 2rem)' }}>
          {!isFormOpen && (
            <div className="fade-in landing-shell" style={{ width: '100%', maxWidth: 1240 }}>
              <section
                className="card-gold fade-up landing-hero"
                style={{
                  padding: 'clamp(1.5rem, 3vw, 3rem)',
                  borderRadius: 'var(--r-xl)',
                  marginBottom: '1.25rem',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  aria-hidden
                  style={{
                    position: 'absolute',
                    width: 220,
                    height: 220,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(201,168,76,0.22), transparent 70%)',
                    top: -80,
                    right: -70,
                    pointerEvents: 'none',
                  }}
                />
                <div className="landing-hero-mark" aria-hidden>
                  <Image
                    src="/veda-icon.png"
                    alt=""
                    width={420}
                    height={420}
                    className="landing-hero-mark-img"
                    priority
                  />
                </div>
                <div className="landing-hero-content">
                  <div className="label-caps" style={{ marginBottom: '0.75rem', color: 'var(--text-gold)' }}>
                    Vedaansh spiritual intelligence platform
                  </div>
                  <h1 className="landing-hero-title" style={{ margin: 0, maxWidth: 820 }}>{heroCopy.headline}</h1>
                  <p className="landing-hero-subline" style={{ marginTop: '0.9rem', maxWidth: 820, fontSize: '1.02rem' }}>
                    {heroCopy.subline}
                  </p>
                  <div className="landing-trust-grid">
                    {landingTrustStats.map((item) => (
                      <div key={item.label} className="stat-chip landing-trust-chip">
                        <span className="stat-value">{item.value}</span>
                        <span className="stat-sub">{item.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="landing-hero-cta-row">
                    <div className="landing-hero-main-ctas">
                      <button onClick={() => { trackLandingCta('hero_primary'); openAstrologyApp() }} className="btn btn-primary landing-hero-primary-btn">
                        {heroCopy.cta}
                      </button>
                      <Link href="/panchang" onClick={() => trackLandingCta('hero_panchang')} className="btn btn-secondary landing-hero-secondary-btn" style={{ textDecoration: 'none' }}>
                        Open Panchang App
                      </Link>
                    </div>
                    <div className="landing-hero-sub-ctas">
                      <Link href="/panchang/calendar" onClick={() => trackLandingCta('hero_calendar')} className="btn btn-ghost landing-hero-sub-btn" style={{ textDecoration: 'none' }}>
                        Panchang Calendar
                      </Link>
                      {status === 'authenticated' && defaultChart && (
                        <button onClick={() => { trackLandingCta('hero_my_chart'); openMyDefaultChart() }} className="btn btn-ghost landing-hero-sub-btn">
                          My Chart
                        </button>
                      )}
                      <Link href="/pricing" onClick={() => trackLandingCta('hero_pricing')} className="btn btn-ghost landing-hero-sub-btn" style={{ textDecoration: 'none' }}>
                        View Plans
                      </Link>
                      <Link href="/my/charts" onClick={() => trackLandingCta('hero_my_charts')} className="btn btn-ghost landing-hero-sub-btn" style={{ textDecoration: 'none' }}>
                        Explore My Charts
                      </Link>
                    </div>
                  </div>
                </div>
              </section>

              <section className="card fade-up-1" style={{ marginBottom: '1.25rem', padding: '1.2rem' }}>
                <div className="label-caps" style={{ marginBottom: '0.55rem' }}>Major sections</div>
                <h3 style={{ margin: '0 0 0.45rem 0' }}>Explore all major Vedaansh features from one place</h3>
                <p style={{ margin: '0 0 0.9rem 0', color: 'var(--text-secondary)', maxWidth: 900 }}>
                  Pick your next step instantly - Panchang, advanced astrology engine, transits, consultation workspace,
                  and premium learning modules.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.8rem' }}>
                  {landingMajorSections.map((section) => (
                    <Link
                      key={section.title}
                      href={section.href}
                      onClick={(e) => {
                        trackLandingCta(section.ctaName)
                        openSectionWithChartGate(section.href, e)
                      }}
                      className="landing-portal-card"
                      style={{ textDecoration: 'none', border: '1px solid var(--border-soft)', borderRadius: 'var(--r-lg)', padding: '0.95rem' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                        <span style={{ fontSize: '1.1rem' }}>{section.icon}</span>
                        <span className="badge badge-gold">{section.subtitle}</span>
                      </div>
                      <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '1.02rem' }}>{section.title}</h4>
                      <p style={{ margin: 0, fontSize: '0.86rem', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                        {section.text}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>

              <section className="card fade-up-1 landing-compare-card" style={{ marginBottom: '1.25rem' }}>
                <div className="label-caps" style={{ marginBottom: '0.55rem' }}>Why Vedaansh</div>
                <h3 style={{ margin: '0 0 0.7rem 0' }}>Designed for depth + clarity, not just daily horoscope content</h3>
                <div className="landing-compare-grid">
                  <div className="landing-compare-col">
                    <h4 style={{ margin: '0 0 0.6rem 0' }}>Vedaansh</h4>
                    <ul className="landing-compare-list">
                      <li>Integrated chart, panchang, dasha, varga, and interpretation flow</li>
                      <li>Built for both personal seekers and practitioner consultations</li>
                      <li>Action-oriented guidance from analysis to next step</li>
                      <li>Platform vision: astrology + lifestyle + learning + community</li>
                    </ul>
                  </div>
                  <div className="landing-compare-col">
                    <h4 style={{ margin: '0 0 0.6rem 0' }}>Typical astrology apps</h4>
                    <ul className="landing-compare-list is-muted">
                      <li>Often fragmented between reports, chat, and tools</li>
                      <li>Limited depth in advanced varga and workflow continuity</li>
                      <li>Heavy focus on one-off predictions over guided execution</li>
                      <li>Less structured path from insight to practical action</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section className="card fade-up-1 landing-trusted-strip" style={{ marginBottom: '1.25rem' }}>
                <div className="label-caps" style={{ marginBottom: '0.55rem' }}>Trusted by communities</div>
                <div className="landing-marquee">
                  <div className="landing-marquee-track">
                    {[...trustedBy, ...trustedBy].map((item, idx) => (
                      <span key={`${item}-${idx}`} className="landing-trusted-pill">{item}</span>
                    ))}
                  </div>
                </div>
              </section>

              <section
                className="card fade-up-1"
                style={{
                  padding: 'clamp(1.25rem, 3vw, 2rem)',
                  marginBottom: '1.25rem',
                  border: '1px solid var(--border-bright)',
                }}
              >
                <div className="label-caps" style={{ marginBottom: '0.7rem' }}>
                  Live now
                </div>
                <h2 style={{ margin: '0 0 0.7rem 0' }}>A modern Jyotish command center is ready</h2>
                <p style={{ margin: 0, maxWidth: 920 }}>
                  Start with your birth chart, panchang, dasha, varga analysis, and nakshatra intelligence. Then move
                  into consultation, remedy planning, and long-term Vedic life guidance.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem', marginTop: '1rem' }}>
                  {landingFeaturePillars.map((item) => (
                    <div key={item.title} className="stat-chip">
                      <span className="stat-value" style={{ fontSize: '0.95rem' }}>{item.title}</span>
                      <span className="stat-sub">{item.detail}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1rem' }}>
                  <button onClick={() => { trackLandingCta('live_now_launch'); openAstrologyApp() }} className="btn btn-primary">
                    Launch Astrology App
                  </button>
                  <Link href="/astrology?new=true" onClick={() => trackLandingCta('live_now_new_consultation')} className="btn btn-secondary" style={{ textDecoration: 'none' }}>
                    New Consultation
                  </Link>
                </div>
              </section>

              <section className="card fade-up-4 landing-cta-band" style={{ marginBottom: '1.25rem' }}>
                <div>
                  <div className="label-caps" style={{ marginBottom: '0.4rem', color: 'var(--text-gold)' }}>Ready now</div>
                  <h3 style={{ margin: 0 }}>Open your Vedic command center in one tap</h3>
                  <p style={{ margin: '0.45rem 0 0 0', maxWidth: 760 }}>
                    Cast your chart, review today&apos;s panchang, and move to clear action guidance in a single focused flow.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.7rem', flexWrap: 'wrap' }}>
                  <button onClick={() => { trackLandingCta('cta_band_start_now'); openAstrologyApp() }} className="btn btn-primary">
                    Start Now
                  </button>
                  <Link href="/pricing" onClick={() => trackLandingCta('cta_band_view_plans')} className="btn btn-secondary" style={{ textDecoration: 'none' }}>
                    View Plans
                  </Link>
                </div>
              </section>

              <section className="card fade-up-2 landing-flow-card" style={{ marginBottom: '1.25rem' }}>
                <div className="label-caps" style={{ marginBottom: '0.6rem' }}>How it flows</div>
                <h3 style={{ margin: '0 0 0.65rem 0' }}>From birth data to life direction in minutes</h3>
                <div className="landing-flow-grid">
                  {landingJourney.map((item) => (
                    <article key={item.step} className="landing-flow-item">
                      <span className="badge badge-gold">{item.step}</span>
                      <h4 style={{ margin: '0.65rem 0 0.35rem 0', fontSize: '1rem' }}>{item.title}</h4>
                      <p style={{ margin: 0, fontSize: '0.88rem' }}>{item.text}</p>
                    </article>
                  ))}
                </div>
              </section>

              <section className="fade-up-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.9rem', marginBottom: '1.25rem' }}>
                {[
                  { icon: '🔭', title: 'Astrology Workspace', text: 'Chart + varga + dasha + interpretation in one workspace.', href: '/astrology?new=true', comingSoon: false },
                  { icon: '📆', title: 'Panchang & Calendar', text: 'Daily and monthly timing windows for practical planning.', href: '/panchang', comingSoon: false },
                  { icon: '👥', title: 'Consultation CRM', text: 'Manage clients, sessions, and chart records with structure.', href: '/clients', comingSoon: false },
                  { icon: '🧭', title: 'Muhurta Planner', text: 'Find suitable windows for action, events, and decisions.', href: '/muhurta', comingSoon: false },
                  { icon: '📚', title: 'Learning Hub', text: 'Structured Jyotish and Vedic learning tracks.', href: '/roadmap', comingSoon: true },
                  { icon: '🛍', title: 'Vedic Commerce', text: 'Future-ready layer for products, remedies, and rituals.', href: '/pricing', comingSoon: true },
                  { icon: '🌿', title: 'Lifestyle Guidance', text: 'Daily dharmic routines with spiritual wellness alignment.', href: '/roadmap', comingSoon: true },
                  { icon: '🤝', title: 'Community Layer', text: 'A seeker-first social and devotional ecosystem.', href: '/roadmap', comingSoon: true },
                ].map((item) => (
                  <Link
                    key={item.title}
                    href={item.href}
                    className="card landing-portal-card"
                    style={{ textDecoration: 'none', padding: '1rem', display: 'block' }}
                  >
                    <div style={{ fontSize: '1.1rem', marginBottom: '0.35rem' }}>{item.icon}</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.45rem' }}>
                      <div className="label-caps">Portal</div>
                      {item.comingSoon && <span className="badge badge-gold">Coming Soon</span>}
                    </div>
                    <h3 style={{ margin: '0 0 0.4rem 0', fontSize: '1.15rem' }}>{item.title}</h3>
                    <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.5 }}>{item.text}</p>
                  </Link>
                ))}
              </section>

              <section className="card fade-up-3 landing-testimonials" style={{ marginBottom: '1.25rem' }}>
                <div className="label-caps" style={{ marginBottom: '0.6rem' }}>What users want</div>
                <h3 style={{ margin: '0 0 0.7rem 0' }}>Built for trust, depth, and practical action</h3>
                <div className="landing-testimonial-grid">
                  {landingTestimonials.map((item) => (
                    <article key={item.name} className="landing-testimonial-item">
                      <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.6 }}>&quot;{item.quote}&quot;</p>
                      <div style={{ marginTop: '0.7rem' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.86rem' }}>{item.name}</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{item.role}</div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <section className="card fade-up-4 landing-faq" style={{ marginBottom: '1.25rem' }}>
                <div className="label-caps" style={{ marginBottom: '0.55rem' }}>FAQ</div>
                <h3 style={{ margin: '0 0 0.75rem 0' }}>Everything you need to start with confidence</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                  {landingFaqs.map((item, idx) => {
                    const isOpen = landingFaqOpen === idx
                    return (
                      <div key={item.q} className="landing-faq-item">
                        <button
                          type="button"
                          className="landing-faq-btn"
                          onClick={() => setLandingFaqOpen(isOpen ? -1 : idx)}
                        >
                          <span>{item.q}</span>
                          <span style={{ color: 'var(--text-gold)', fontWeight: 700 }}>{isOpen ? '−' : '+'}</span>
                        </button>
                        {isOpen ? (
                          <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                            {item.a}
                          </p>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              </section>

              <section className="card fade-up-3" style={{ textAlign: 'center', padding: '1.4rem' }}>
                <div className="label-caps" style={{ marginBottom: '0.5rem' }}>Vedic Vision</div>
                <h3 style={{ margin: '0 0 0.45rem 0' }}>Astrology + Ayurveda + Scriptures + Conscious Living</h3>
                <p style={{ margin: '0 auto', maxWidth: 780 }}>
                  Vedaansh is designed as one spiritual-operating platform where guidance, practice, learning, and daily life
                  come together.
                </p>
                <div style={{ marginTop: '0.95rem', display: 'flex', justifyContent: 'center', gap: '0.7rem', flexWrap: 'wrap' }}>
                  <button onClick={() => { trackLandingCta('vision_start'); openAstrologyApp() }} className="btn btn-primary">
                    Start with Astrology App
                  </button>
                  <Link href="/roadmap" onClick={() => trackLandingCta('vision_roadmap')} className="btn btn-ghost" style={{ textDecoration: 'none' }}>
                    See Expansion Journey
                  </Link>
                </div>
              </section>

              <section className="card fade-up-4" style={{ padding: '1.3rem', marginTop: '1rem' }}>
                <div className="label-caps" style={{ marginBottom: '0.5rem' }}>Start journey</div>
                <h3 style={{ margin: '0 0 0.55rem 0' }}>One click to enter your astrology workspace</h3>
                <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                  Tap below and your birth details drawer opens instantly. From there, cast chart and continue into consultations,
                  guidance, and your complete Vedaansh ecosystem.
                </p>
                <div style={{ marginTop: '0.9rem', display: 'flex', flexWrap: 'wrap', gap: '0.7rem' }}>
                  <button onClick={() => { trackLandingCta('start_journey_open_app'); openAstrologyApp() }} className="btn btn-primary">
                    Open Astrology App Now
                  </button>
                  <Link href="/pricing" onClick={() => trackLandingCta('start_journey_pricing')} className="btn btn-secondary" style={{ textDecoration: 'none' }}>
                    Compare Memberships
                  </Link>
                </div>
              </section>

              <div className="landing-sticky-mobile-cta">
                <button onClick={() => { trackLandingCta('sticky_mobile_start'); openAstrologyApp() }} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  ✦ Start Astrology App
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer inside main area */}
      <footer style={{
        marginTop: 'auto', paddingTop: '2rem', paddingBottom: '1rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)'
      }}>
        <span>
          Powered by{' '}
          <span style={{ color: 'var(--text-gold)', fontStyle: 'italic' }}>Swiss Ephemeris</span>
          {' '}· Lahiri ayanamsha
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <a
            href="https://www.instagram.com/vedaanshlife"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--text-muted)', textDecoration: 'none' }}
          >
            Instagram
          </a>
          <span style={{ color: 'var(--border-bright)' }}>•</span>
          <a
            href="https://www.linkedin.com/in/abhishek-kumar-96a8381a0/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--text-muted)', textDecoration: 'none' }}
          >
            LinkedIn
          </a>
          <span style={{ color: 'var(--border-bright)' }}>•</span>
          <a
            href="mailto:vedaanshlife@gmail.com"
            style={{ color: 'var(--text-muted)', textDecoration: 'none' }}
          >
            Gmail
          </a>
        </div>
      </footer>

      {/* ── Fixed Drawer for Birth Details Form ──────────────── */}
      <div 
        style={{
          position: 'fixed', inset: 0, zIndex: 1100,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          opacity: isFormOpen ? 1 : 0, pointerEvents: isFormOpen ? 'auto' : 'none',
          transition: 'opacity 0.3s ease'
        }}
        onClick={() => {
          setIsFormOpen(false)
          setPendingDestination(null)
        }}
      />
      <div className="form-drawer" style={{ 
        position: 'fixed', right: 0, top: 0, bottom: 0, zIndex: 1101, 
        boxShadow: '-8px 0 32px rgba(0,0,0,0.4)',
        background: 'var(--surface-1)',
        display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--border-bright)',
        transform: isFormOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        width: 450, // Default width for desktop (overridden by class on mobile)
      }}>
        <div className="form-drawer-header" style={{
          padding: '1.5rem', borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'var(--surface-2)'
        }}>
          <div>
             <h2 style={{ fontSize: '1.4rem', margin: '0 0 0.2rem 0', fontFamily: 'var(--font-display)', color: 'var(--text-gold)', fontWeight: 600 }}>Birth Details</h2>
             <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', letterSpacing: '0.05em' }}>Janma Kāla Entry</span>
          </div>
          <button 
            onClick={() => {
              setIsFormOpen(false)
              setPendingDestination(null)
            }}
            style={{ 
              background: 'var(--surface-3)', 
              border: '1px solid var(--border-soft)', 
              width: 32, height: 32, borderRadius: '50%', 
              fontSize: '1rem', cursor: 'pointer', color: 'var(--text-primary)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              transition: 'all 0.2s',
              zIndex: 10
            }}
          >
            ✕
          </button>
        </div>
        
        <div className="form-drawer-body" style={{ padding: '1.5rem', flex: 1, overflowY: 'auto' }}>
            {/* 
                Optimization: Render BirthForm immediately if query params are present (from "My Charts" or deep links).
                Don't wait for the background user/me fetch to finish.
            */}
            {(status === 'unauthenticated' || !fetchingDefault || !!searchParams.get('name')) && (
              <BirthForm
                onResult={(data) => { 
                  setChart(data);
                  setTimeout(() => {
                    setIsFormOpen(false)
                    if (pendingDestination) {
                      const destination = pendingDestination
                      setPendingDestination(null)
                      router.push(destination)
                    }
                  }, 300);
                }}
                onLoading={setLoading}
                autoSubmit={!!searchParams.get('name')}
                initialName="Natal Chart"
                initialData={chart ? {
                  name: chart.meta.name,
                  birthDate: chart.meta.birthDate,
                  birthTime: chart.meta.birthTime,
                  birthPlace: chart.meta.birthPlace,
                  latitude: chart.meta.latitude,
                  longitude: chart.meta.longitude,
                  timezone: chart.meta.timezone,
                  settings: { ...userPrefs, ...chart.meta.settings },
                } : (defaultChart || undefined)}
              />
            )}
           {chart && <ChartSummary chart={chart} />}
        </div>
      </div>

      {/* ── Mobile bottom tab bar — rendered via portal to escape transform contexts ── */}
      {chart && isMobile && activeTab === 'dashboard' && typeof document !== 'undefined' && createPortal(
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
          background: 'var(--surface-1)',
          borderTop: '1px solid var(--border-soft)',
          display: 'flex', alignItems: 'stretch',
          boxShadow: '0 -3px 16px rgba(0,0,0,0.14)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}>
          {([
            { id: 'planetary', icon: '✦', label: 'Planets'  },
            { id: 'astro',     icon: '◎', label: 'Details'  },
            { id: 'dashas',    icon: '⏱', label: 'Dasha'    },
            { id: 'today',     icon: '☽', label: 'Today'    },
            { id: 'strengths', icon: '⚡', label: 'Strength' },
            { id: 'yogas',     icon: '❋', label: 'Yogas'    },
          ] as const).map(({ id, icon, label }) => {
            const active = mobileDashTab === id
            return (
              <button key={id} type="button"
                onClick={() => setMobileDashTab(id as typeof mobileDashTab)}
                style={{
                  flex: 1, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  gap: '0.12rem', padding: '0.5rem 0.15rem 0.6rem',
                  border: 'none', background: 'none', cursor: 'pointer',
                  borderTop: active ? '2px solid var(--accent)' : '2px solid transparent',
                  color: active ? 'var(--accent)' : 'var(--text-muted)',
                  transition: 'color 0.15s',
                }}>
                <span style={{ fontSize: '1.05rem', lineHeight: 1 }}>{icon}</span>
                <span style={{ fontSize: '0.5rem', fontWeight: active ? 700 : 500, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{label}</span>
              </button>
            )
          })}
        </div>,
        document.body
      )}

    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={
       <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div className="spin-loader" style={{ width: 40, height: 40, border: '3px solid var(--border-soft)', borderTopColor: 'var(--gold)', borderRadius: '50%' }} />
       </div>
    }>
      <HomeContent />
    </Suspense>
  )
}
