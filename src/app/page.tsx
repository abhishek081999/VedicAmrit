'use client'
// ─────────────────────────────────────────────────────────────
//  src/app/page.tsx
//  Home — birth form + full chart result
//  Redesigned: themed, animated, cleaner visual hierarchy
// ─────────────────────────────────────────────────────────────

import dynamic from 'next/dynamic'
import React, { useState, useEffect, useMemo } from 'react'
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
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <p style={{ fontSize: '0.82rem', fontStyle: 'italic', color: 'var(--text-muted)', margin: 0 }}>
        Bhāva Āruḍhas — mirror of worldly reality, calculated by the BPHS algorithm.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '0.55rem' }}>
        {keys.map((key, i) => {
          const rashi = arudhas[key] as Rashi | undefined
          if (!rashi) return null
          const isAL  = key === 'AL'
          return (
            <div
              key={key}
              style={{
                padding: '0.7rem 1rem',
                background: isAL ? 'rgba(201,168,76,0.08)' : 'var(--surface-2)',
                border: `1px solid ${isAL ? 'var(--border-bright)' : 'var(--border-soft)'}`,
                borderRadius: 'var(--r-md)',
                display: 'flex', gap: '0.65rem', alignItems: 'flex-start',
                transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s',
                cursor: 'default',
                animationDelay: `${i * 0.03}s`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-bright)'
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = 'var(--glow-gold)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = isAL ? 'var(--border-bright)' : 'var(--border-soft)'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                color: isAL ? 'var(--gold)' : 'var(--text-muted)',
                minWidth: 28,
                paddingTop: 3,
                fontWeight: 600,
              }}>
                {key}
              </span>
              <div>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.02rem',
                  color: 'var(--text-primary)',
                  fontWeight: isAL ? 500 : 400,
                }}>
                  {RASHI_NAMES[rashi]}
                  <span style={{ marginLeft: 6, fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    {RASHI_SHORT[rashi]}
                  </span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 1 }}>
                  {ARUDHA_TOPICS[key]}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{
        display: 'flex', gap: '1rem', flexWrap: 'wrap',
        paddingTop: '0.75rem',
        borderTop: '1px solid var(--border-soft)',
        fontSize: '0.82rem',
        color: 'var(--text-muted)',
      }}>
        <span>
          <span style={{ color: 'var(--gold)' }}>Upapada (A12): </span>
          {arudhas.A12 ? RASHI_NAMES[arudhas.A12] : '—'} · quality of marriage
        </span>
        <span>
          <span style={{ color: 'var(--gold)' }}>Darapada (A7): </span>
          {arudhas.A7 ? RASHI_NAMES[arudhas.A7] : '—'} · partner&apos;s image
        </span>
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
    <div
      className="card"
      style={{
        padding: '0.65rem 0.85rem',
        background: 'var(--surface-2)',
        border: '1px solid var(--border-bright)',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>{label}</div>
      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: valueColor }}>{value}</div>
      {sub ? <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{sub}</div> : null}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  Main Page
// ─────────────────────────────────────────────────────────────

import { Suspense } from 'react'

function HomeContent() {
  const { data: session, status } = useSession()
  const { chart, setChart, isFormOpen, setIsFormOpen } = useChart()
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
            
            {/* Headings Row & Birth Summary Strip */}
            <div className="chart-header-row" style={isMobile ? { position: 'relative' } : undefined}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                 <div>
                    <span className="label-caps" style={{ color: 'var(--text-gold)', marginBottom: '0.25rem', display: 'block', fontSize: '0.65rem' }}>Astrological Portrait</span>
                    <h1 className="chart-name" style={{ fontFamily: 'var(--font-display)', fontWeight: 400, margin: '0', color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                      {chart.meta.name}
                    </h1>
                 </div>

                 {/* Compact Birth Summary Strip */}
                 <div className="birth-summary-strip">
                    <div className="birth-summary-item">
                       <span className="birth-summary-label">Born</span>
                       <span className="birth-summary-value">{chart.meta.birthDate}</span>
                       <span className="summary-sep" style={{ color: 'var(--border-bright)' }}>•</span>
                       <span className="birth-summary-value">{chart.meta.birthTime}</span>
                    </div>
                    <div className="summary-sep" style={{ width: 1, height: 16, background: 'var(--border-soft)' }} />
                    <div className="birth-summary-item">
                       <span className="birth-summary-label">In</span>
                       <span className="birth-summary-value" style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{chart.meta.birthPlace}</span>
                       <span className="birth-summary-value hide-mobile" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>({chart.meta.latitude.toFixed(2)}N, {chart.meta.longitude.toFixed(2)}E)</span>
                    </div>
                    <div className="summary-sep" style={{ width: 1, height: 16, background: 'var(--border-soft)' }} />
                    <div className="birth-summary-item">
                       <span className="birth-summary-label">Ascendant</span>
                       <span className="birth-summary-value" style={{ fontWeight: 600, color: 'var(--text-gold)', fontFamily: 'var(--font-display)' }}>
                          {RASHI_NAMES[chart.lagnas.ascRashi as Rashi]} {chart.lagnas.ascDegreeInRashi.toFixed(1)}°
                       </span>
                    </div>
                 </div>
              </div>

              {isMobile && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    zIndex: 5,
                  }}
                >
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

              <div className="chart-action-wrap" style={{ display: isMobile ? 'none' : 'flex' }}>
                  {status === 'authenticated' && (
                    <div className="chart-action-row">
                      <button onClick={() => handleSave('regular')} disabled={saving || saveDone} className={`btn ${saveDone ? 'btn-ghost' : 'btn-primary'} btn-sm`}>
                        {saving ? 'Saving…' : saveDone ? '✓ Saved' : '+ Save Chart'}
                      </button>
                      
                      {userPlan === 'platinum' && (
                        <button 
                          onClick={handleSaveToCRM} 
                          disabled={crmSaving || crmDone} 
                          className={`btn ${crmDone ? 'btn-ghost' : 'btn-secondary'} btn-sm`}
                          style={{ borderColor: 'var(--gold)', color: crmDone ? 'var(--text-muted)' : 'var(--gold)' }}
                        >
                          {crmSaving ? 'Adding…' : crmDone ? '✓ In CRM' : '👥 Add to CRM'}
                        </button>
                      )}
                    </div>
                  )}
                  {false && status === 'authenticated' && (
                   <button onClick={() => handleSave('regular')} disabled={saving || saveDone} className={`btn ${saveDone ? 'btn-ghost' : 'btn-primary'} btn-sm`}>
                     {saving ? 'Saving…' : saveDone ? '✓ Saved' : '+ Save Chart'}
                   </button>
                 )}
                 <div className="chart-action-row">
                   <ExportPdfButton chart={chart} compact />
                   <EmailChartButton chart={chart} compact />
                 </div>
                 <button onClick={() => setIsFormOpen(true)} className="btn btn-secondary btn-sm" style={{ background: 'var(--surface-3)', color: 'var(--text-primary)', border: '1px solid var(--border-bright)' }}>
                   ✎ Edit Details
                 </button>
                 <button onClick={() => { setChart(null); setIsFormOpen(true) }} className="btn btn-primary btn-sm" style={{ background: 'var(--gold-faint)', color: 'var(--text-gold)', border: '1px solid var(--gold)' }}>
                   + New Chart
                 </button>
              </div>
            </div>
           
            {/* ── Full-width workspaces (replaces two-column layout) ── */}
            {(activeTab === 'varshaphal' || activeTab === 'planets' || activeTab === 'house' || activeTab === 'interpretation' || activeTab === 'kp-stellar') && (
              <div className={`${(activeTab === 'planets' || activeTab === 'house' || activeTab === 'kp-stellar') ? '' : 'card'} fade-up`} style={{ padding: (activeTab === 'planets' || activeTab === 'house' || activeTab === 'kp-stellar') ? '0' : '1.25rem', width: '100%' }}>
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
                 flex: '1 1 600px', 
                 minWidth: 'min(100%, 600px)', 
                 display: 'flex', 
                 flexDirection: 'column', 
                 gap: '1.5rem',
                 order: 1 // Chart stays 1st
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

                  {activeTab === 'dashboard' && isMobile && (
                    <div
                      className="card fade-up"
                      style={{
                        padding: '0.75rem',
                        borderRadius: 14,
                        border: '1px solid var(--border-soft)',
                        background: 'linear-gradient(180deg, var(--surface-1), var(--surface-2))',
                      }}
                    >
                      <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0.2rem 0.35rem 0.55rem' }}>
                        Sections
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          gap: '0.45rem',
                          overflowX: 'auto',
                          paddingBottom: '0.35rem',
                          marginBottom: '0.55rem',
                          WebkitOverflowScrolling: 'touch',
                        }}
                      >
                        {mobileDashboardCategories.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setMobileDashCategory(t.id)}
                            style={{
                              whiteSpace: 'nowrap',
                              borderRadius: 999,
                              border: mobileDashCategory === t.id ? '1.5px solid var(--gold)' : '1px solid var(--border-soft)',
                              background: mobileDashCategory === t.id ? 'linear-gradient(180deg, var(--gold-faint), rgba(201,168,76,0.08))' : 'var(--surface-2)',
                              color: mobileDashCategory === t.id ? 'var(--text-gold)' : 'var(--text-muted)',
                              padding: '0.42rem 0.76rem',
                              fontSize: '0.71rem',
                              fontWeight: 700,
                              letterSpacing: '0.02em',
                              cursor: 'pointer',
                              boxShadow: mobileDashCategory === t.id ? '0 2px 8px rgba(201,168,76,0.18)' : 'none',
                            }}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>

                      <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0.15rem 0.35rem 0.5rem' }}>
                        Options
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          gap: '0.45rem',
                          overflowX: 'auto',
                          paddingBottom: '0.35rem',
                          marginBottom: '0.9rem',
                          WebkitOverflowScrolling: 'touch',
                        }}
                      >
                        {mobileDashboardOptions[mobileDashCategory].map((t) => {
                          if ('path' in t) {
                            return (
                              <Link
                                key={t.id}
                                href={t.path}
                                style={{
                                  whiteSpace: 'nowrap',
                                  borderRadius: 999,
                                  border: '1px solid var(--border-soft)',
                                  background: 'var(--surface-2)',
                                  color: 'var(--text-muted)',
                                  padding: '0.4rem 0.7rem',
                                  fontSize: '0.71rem',
                                  fontWeight: 700,
                                  letterSpacing: '0.02em',
                                  textDecoration: 'none',
                                }}
                              >
                                {t.label}
                              </Link>
                            )
                          }
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => setMobileDashTab(t.id)}
                              style={{
                                whiteSpace: 'nowrap',
                                borderRadius: 999,
                                border: mobileDashTab === t.id ? '1.5px solid var(--gold)' : '1px solid var(--border-soft)',
                                background: mobileDashTab === t.id ? 'linear-gradient(180deg, var(--gold-faint), rgba(201,168,76,0.08))' : 'var(--surface-2)',
                                color: mobileDashTab === t.id ? 'var(--text-gold)' : 'var(--text-muted)',
                                padding: '0.4rem 0.7rem',
                                fontSize: '0.71rem',
                                fontWeight: 700,
                                letterSpacing: '0.02em',
                                cursor: 'pointer',
                                boxShadow: mobileDashTab === t.id ? '0 2px 8px rgba(201,168,76,0.18)' : 'none',
                              }}
                            >
                              {t.label}
                            </button>
                          )
                        })}
                      </div>

                      {mobileDashCategory === 'astrology' && mobileDashTab === 'astro' && <AstroDetailsPanel chart={chart} />}

                      {mobileDashCategory === 'astrology' && mobileDashTab === 'planetary' && (
                        <GrahaTable
                          grahas={chart.grahas}
                          vargas={chart.vargas}
                          vargaLagnas={chart.vargaLagnas}
                          lagnas={chart.lagnas}
                          upagrahas={chart.upagrahas}
                          activeVarga={activeVarga}
                          onVargaChange={setActiveVarga}
                          limited={!expandGraha}
                        />
                      )}

                      {mobileDashCategory === 'astrology' && mobileDashTab === 'dashas' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 className="label-caps" style={{ margin: 0, color: 'var(--text-gold)', fontSize: '0.68rem' }}>Dashas</h3>
                            <select
                              value={dashaSystem}
                              onChange={(e) => setDashaSystem(e.target.value as any)}
                              style={{
                                padding: '0.2rem 0.5rem',
                                fontSize: '0.72rem',
                                background: 'var(--surface-3)',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--border-soft)',
                                borderRadius: '4px',
                                fontFamily: 'inherit',
                              }}
                            >
                              <option value="vimshottari">Viṁśottarī (120y)</option>
                              <option value="ashtottari">Aṣṭottarī (108y)</option>
                              <option value="yogini">Yoginī (36y)</option>
                              <option value="chara">Chara (12s)</option>
                            </select>
                          </div>
                          {(() => {
                            const nodes = dashaSystem === 'vimshottari'
                              ? (vimshottariTara === 'Mo' ? chart.dashas.vimshottari : (altVimshottari ?? chart.dashas.vimshottari))
                              : (chart.dashas[dashaSystem] ?? [])
                            if (!nodes || nodes.length === 0) {
                              return <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>{dashaSystem.toUpperCase()} data unavailable.</div>
                            }
                            return <DashaTree nodes={nodes} birthDate={new Date(chart.meta.birthDate)} />
                          })()}
                        </div>
                      )}

                      {mobileDashCategory === 'astrology' && mobileDashTab === 'today' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                          <PersonalDayCard
                            birthMoonNakIdx={chart.panchang.nakshatra.index}
                            birthMoonName={chart.panchang.nakshatra.name}
                            latitude={chart.meta.latitude}
                            longitude={chart.meta.longitude}
                            timezone={chart.meta.timezone}
                            todayPanchang={todayPanchang}
                          />
                          <div className="card" style={{ padding: '0.85rem' }}>
                            <h3 className="label-caps" style={{ marginBottom: '0.65rem', fontSize: '0.62rem', color: 'var(--text-muted)' }}>Daily Suitability</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: '1rem', rowGap: '0.55rem' }}>
                              {[
                                { label: 'Spiritual', icon: '🧘', rating: 95, color: 'var(--teal)' },
                                { label: 'Wellness', icon: '🌿', rating: 82, color: 'var(--teal)' },
                                { label: 'Learning', icon: '📚', rating: 78, color: 'var(--gold)' },
                                { label: 'Business', icon: '💼', rating: 45, color: 'var(--rose)' },
                                { label: 'Travel', icon: '✈️', rating: 30, color: 'var(--rose)' },
                                { label: 'Property', icon: '🏠', rating: 15, color: 'var(--rose)' },
                              ].map((act, i) => (
                                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                      <span style={{ fontSize: '0.74rem' }}>{act.icon}</span>
                                      <span style={{ fontSize: '0.68rem', fontWeight: 600 }}>{act.label}</span>
                                    </div>
                                    <span style={{ fontSize: '0.6rem', fontWeight: 700, color: act.color }}>{act.rating}%</span>
                                  </div>
                                  <div style={{ height: 4, background: 'var(--surface-3)', borderRadius: 2, overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${act.rating}%`, background: act.color }} />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          <ActiveHousesCard chart={chart} transitMoonLon={todayPanchang?.moonLongitudeSidereal} />
                        </div>
                      )}

                      {mobileDashCategory === 'astrology' && mobileDashTab === 'panchang' && <NatalPanchangPanel p={chart.panchang} />}

                      {mobileDashCategory === 'astrology' && mobileDashTab === 'strengths' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                          <select
                            value={mobileStrengthTab}
                            onChange={(e) => setMobileStrengthTab(e.target.value as typeof mobileStrengthTab)}
                            style={{
                              width: '100%',
                              padding: '0.5rem 0.6rem',
                              borderRadius: 8,
                              border: '1px solid var(--border-soft)',
                              background: 'var(--surface-2)',
                              color: 'var(--text-primary)',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                            }}
                          >
                            <option value="shadbala">Strengths: Ṣaḍbala</option>
                            <option value="bhava">Strengths: Bhāva Bala</option>
                            <option value="vimsopaka">Strengths: Viṁśopaka</option>
                            <option value="ashtakavarga">Strengths: Aṣṭakavarga</option>
                          </select>
                          {mobileStrengthTab === 'shadbala' ? (
                            chart.shadbala ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                                  <div style={{ border: '1px solid var(--border-soft)', borderRadius: 10, padding: '0.7rem', background: 'var(--surface-2)' }}>
                                    <div className="label-caps" style={{ fontSize: '0.56rem', marginBottom: '0.28rem' }}>Strongest</div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--teal)' }}>
                                      {GRAHA_NAMES[chart.shadbala.strongest as GrahaId] ?? chart.shadbala.strongest}
                                    </div>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                                      {(chart.shadbala.planets[chart.shadbala.strongest as GrahaId]?.total ?? 0).toFixed(2)} R
                                    </div>
                                  </div>
                                  <div style={{ border: '1px solid var(--border-soft)', borderRadius: 10, padding: '0.7rem', background: 'var(--surface-2)' }}>
                                    <div className="label-caps" style={{ fontSize: '0.56rem', marginBottom: '0.28rem' }}>Weakest</div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--rose)' }}>
                                      {GRAHA_NAMES[chart.shadbala.weakest as GrahaId] ?? chart.shadbala.weakest}
                                    </div>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                                      {(chart.shadbala.planets[chart.shadbala.weakest as GrahaId]?.total ?? 0).toFixed(2)} R
                                    </div>
                                  </div>
                                </div>
                                <div style={{ border: '1px solid var(--border-soft)', borderRadius: 10, padding: '0.7rem', background: 'var(--surface-2)' }}>
                                  <div className="label-caps" style={{ fontSize: '0.56rem', marginBottom: '0.45rem' }}>7-graha strength bars</div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                                    {(['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa'] as GrahaId[])
                                      .map((id) => ({
                                        id,
                                        name: GRAHA_NAMES[id] ?? id,
                                        total: chart.shadbala.planets[id]?.total ?? 0,
                                        ratio: chart.shadbala.planets[id]?.ratio ?? 0,
                                      }))
                                      .sort((a, b) => b.total - a.total)
                                      .map((row) => (
                                        <div key={row.id}>
                                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                                            <span style={{ fontSize: '0.73rem', color: 'var(--text-primary)', fontWeight: 600 }}>{row.name}</span>
                                            <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                                              {row.total.toFixed(2)} R
                                            </span>
                                          </div>
                                          <div style={{ height: 5, borderRadius: 999, background: 'var(--surface-3)', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${Math.max(10, Math.min(100, row.ratio * 100))}%`, borderRadius: 999, background: 'var(--teal)' }} />
                                          </div>
                                        </div>
                                      ))}
                                  </div>
                                </div>
                                <div style={{ border: '1px solid var(--border-soft)', borderRadius: 10, padding: '0.55rem', background: 'var(--surface-1)' }}>
                                  <div className="label-caps" style={{ fontSize: '0.56rem', margin: '0.1rem 0 0.55rem' }}>
                                    Component-wise bala charts
                                  </div>
                                  <ShadbalaTable shadbala={chart.shadbala} classicMultiChartOnly />
                                </div>
                              </div>
                            ) : (
                              <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>Shadbala data unavailable.</p>
                            )
                          ) : mobileStrengthTab === 'bhava' ? (
                            chart.bhavaBala ? (
                              <BhavaBalaTable bhavaBala={chart.bhavaBala} chart={chart} />
                            ) : (
                              <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>Bhāva Bala data unavailable.</p>
                            )
                          ) : mobileStrengthTab === 'vimsopaka' ? (
                            chart.vimsopaka ? (
                              <VimsopakaBalaPanel vimsopaka={chart.vimsopaka} userPlan={userPlan} />
                            ) : (
                              <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>Viṁśopaka data unavailable.</p>
                            )
                          ) : chart.ashtakavarga ? (
                            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                              <div style={{ minWidth: 320 }}>
                                <AshtakavargaGrid ashtakavarga={chart.ashtakavarga} ascRashi={chart.lagnas.ascRashi ?? 1} />
                              </div>
                            </div>
                          ) : (
                            <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>Aṣṭakavarga data unavailable.</p>
                          )}
                        </div>
                      )}

                      {mobileDashCategory === 'astrology' && mobileDashTab === 'yogas' && (
                        chart.yogas ? (
                          <YogaList yogas={chart.yogas} />
                        ) : (
                          <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>Yoga data unavailable.</p>
                        )
                      )}
                      {mobileDashCategory !== 'astrology' && (
                        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.78rem' }}>
                          Select an option above to open that section.
                        </p>
                      )}
                    </div>
                  )}

                  {activeTab === 'dashboard' && !isMobile && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      {/* Planetary Details */}
                      <div className="card fade-up" style={{ padding: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                          <h3 className="label-caps" style={{ margin: 0, fontSize: '0.65rem', color: 'var(--text-gold)' }}>Planetary Micro-Details</h3>
                          <button 
                            className="btn btn-ghost btn-sm" 
                            style={{ fontSize: '0.7rem' }}
                            onClick={() => setExpandGraha(!expandGraha)}
                          >
                            {expandGraha ? 'Show less' : 'Show more'}
                          </button>
                        </div>
                        <GrahaTable 
                          grahas={chart.grahas} 
                          vargas={chart.vargas} 
                          vargaLagnas={chart.vargaLagnas} 
                          lagnas={chart.lagnas} 
                          upagrahas={chart.upagrahas} 
                          activeVarga={activeVarga} 
                          onVargaChange={setActiveVarga}
                          limited={!expandGraha} 
                        />
                      </div>

                      {/* Astro Details */}
                      <div className="card fade-up" style={{ padding: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                          <h3 className="label-caps" style={{ margin: 0, fontSize: '0.65rem', color: 'var(--text-gold)' }}>Astronomical Depth</h3>
                          <button 
                            className="btn btn-ghost btn-sm" 
                            style={{ fontSize: '0.7rem' }}
                            onClick={() => setExpandAstro(!expandAstro)}
                          >
                            {expandAstro ? 'Show less' : 'Show more'}
                          </button>
                        </div>
                        <div style={{ maxHeight: expandAstro ? 'none' : '260px', overflow: 'hidden', position: 'relative' }}>
                          <AstroDetailsPanel chart={chart} />
                          {!expandAstro && (
                            <div style={{ 
                              position: 'absolute', bottom: 0, left: 0, right: 0, height: '60px', 
                              background: 'linear-gradient(transparent, var(--surface-1))',
                              pointerEvents: 'none'
                            }} />
                          )}
                        </div>
                      </div>
                    </div>
                  )}
               </div>

               {/* RIGHT: Active Tab Content (Sidebar Analysis) — hidden on mobile dashboard */}
               {!(isMobile && activeTab === 'dashboard') && (
               <div className="sticky-desktop" style={{ 
                 flex: `1 1 650px`, 
                 maxWidth: '1400px',
                 minWidth: `min(100%, 650px)`,
                 display: 'flex', flexDirection: 'column', 
                 gap: '1.5rem', 
                 paddingRight: '4px',
                 order: 2 
               }}>
                  {activeTab === 'dashboard' && !isMobile && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      
                      {/* 1. TOP SUMMARY: Active Timeline + Active Houses */}
                      <div className="card" style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--border-bright)' }}>
                        <div style={{ 
                          padding: isMobile ? '1rem' : '1.25rem 1.5rem', 
                          background: 'linear-gradient(to bottom, var(--surface-2), var(--surface-1))',
                          borderBottom: '1px solid var(--border-soft)',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem'
                        }}>
                          <div>
                            <div className="label-caps" style={{ marginBottom: '0.4rem', fontSize: '0.65rem' }}>Summary Card</div>
                            <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: isMobile ? '1.5rem' : '1.75rem' }}>Today at a glance</h2>
                          </div>
                          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                            <ProgressionWidget birthDate={chart.meta.birthDate} />
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)', padding: '0.4rem 0.8rem', background: 'var(--surface-3)', borderRadius: 'var(--r-md)', border: '1px solid var(--border-soft)' }}>
                              Moon: {chart.panchang.nakshatra.name}
                            </div>
                          </div>
                        </div>

                        <div style={{ padding: isMobile ? '1rem' : '1.25rem', background: 'var(--surface-1)' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1.25rem', alignItems: 'start' }}>
                            <div className="card" style={{ padding: '1.1rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 className="label-caps" style={{ margin: 0, color: 'var(--text-gold)', fontSize: '0.7rem' }}>Active Timeline</h3>
                                <select 
                                  value={dashaSystem}
                                  onChange={(e) => setDashaSystem(e.target.value as any)}
                                  style={{ 
                                    padding: '0.2rem 0.5rem', fontSize: '0.72rem', 
                                    background: 'var(--surface-3)', color: 'var(--text-primary)',
                                    border: '1px solid var(--border-soft)', borderRadius: '4px',
                                    fontFamily: 'inherit', cursor: 'pointer'
                                  }}
                                >
                                  <option value="vimshottari">Viṁśottarī (120y)</option>
                                  <option value="ashtottari">Aṣṭottarī (108y)</option>
                                  <option value="yogini">Yoginī (36y)</option>
                                  <option value="chara">Chara (12s)</option>
                                </select>
                              </div>
                              <div style={{ flex: 1 }}>
                                {(() => {
                                  const nodes = dashaSystem === 'vimshottari' 
                                    ? (vimshottariTara === 'Mo' ? chart.dashas.vimshottari : (altVimshottari ?? chart.dashas.vimshottari))
                                    : (chart.dashas[dashaSystem] ?? [])
                                  if (!nodes || nodes.length === 0) {
                                    return <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>{dashaSystem.toUpperCase()} data unavailable.</div>
                                  }
                                  return <DashaTree nodes={nodes} birthDate={new Date(chart.meta.birthDate)} />
                                })()}
                              </div>
                            </div>
                            <div style={{ height: '100%' }}>
                              <ActiveHousesCard 
                                chart={chart} 
                                transitMoonLon={todayPanchang?.moonLongitudeSidereal}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 2. SECOND ROW: Cosmic Weather + Daily Suitability */}
                      <div className="card" style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--border-soft)' }}>
                        <div style={{ 
                          padding: isMobile ? '0.9rem 1rem' : '1rem 1.25rem', 
                          background: 'var(--surface-2)',
                          borderBottom: '1px solid var(--border-soft)'
                        }}>
                          <h3 className="label-caps" style={{ margin: 0, color: 'var(--text-gold)', fontSize: '0.7rem' }}>Cosmic Weather & Daily Suitability</h3>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(300px, 1.2fr) 1fr', gap: '1px', background: 'var(--border-soft)' }}>
                           <div style={{ background: 'var(--surface-1)' }}>
                            <PersonalDayCard
                               birthMoonNakIdx={chart.panchang.nakshatra.index} 
                               birthMoonName={chart.panchang.nakshatra.name} 
                               latitude={chart.meta.latitude}
                               longitude={chart.meta.longitude}
                               timezone={chart.meta.timezone}
                               todayPanchang={todayPanchang}
                             />
                           </div>
                           <div style={{ background: 'var(--surface-1)', padding: '1rem 1.25rem' }}>
                             <h3 className="label-caps" style={{ marginBottom: '0.75rem', fontSize: '0.62rem', color: 'var(--text-muted)' }}>Daily Suitability</h3>
                             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: '1.25rem', rowGap: '0.6rem' }}>
                               {[
                                 { label: 'Spiritual',  icon: '🧘', rating: 95, color: 'var(--teal)' },
                                 { label: 'Wellness',   icon: '🌿', rating: 82, color: 'var(--teal)' },
                                 { label: 'Learning',   icon: '📚', rating: 78, color: 'var(--gold)' },
                                 { label: 'Business',   icon: '💼', rating: 45, color: 'var(--rose)' },
                                 { label: 'Travel',     icon: '✈️', rating: 30, color: 'var(--rose)' },
                                 { label: 'Property',   icon: '🏠', rating: 15, color: 'var(--rose)' },
                               ].map((act, i) => (
                                 <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                        <span style={{ fontSize: '0.75rem' }}>{act.icon}</span>
                                        <span style={{ fontSize: '0.68rem', fontWeight: 600 }}>{act.label}</span>
                                      </div>
                                      <span style={{ fontSize: '0.6rem', fontWeight: 700, color: act.color }}>{act.rating}%</span>
                                   </div>
                                   <div style={{ height: 4, background: 'var(--surface-3)', borderRadius: 2, overflow: 'hidden' }}>
                                     <div style={{ height: '100%', width: `${act.rating}%`, background: act.color }} />
                                   </div>
                                 </div>
                               ))}
                             </div>
                           </div>
                        </div>
                      </div>
                    </div>
                  )}


                  {activeTab === 'dasha' && (
                     <div className="card fade-up" style={{ padding: '1.5rem', minHeight: '600px', display: 'flex', flexDirection: 'column' }}>
                       <div style={{ 
                         display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                         marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem',
                         paddingBottom: '1rem', borderBottom: '1px solid var(--border-soft)'
                       }}>
                         <div>
                           <h3 className="label-caps" style={{ margin: 0, color: 'var(--text-gold)', letterSpacing: '0.12em', fontSize: '0.7rem' }}>Time Sequence Analysis</h3>
                           <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>Dynamic planetary cycles</div>
                         </div>

                         <div style={{ 
                           display: 'flex', background: 'var(--surface-3)', 
                           padding: '3px', borderRadius: '8px',
                           border: '1px solid var(--border-soft)'
                         }}>
                           {([
                             { id: 'vimshottari' as const, label: 'Viṁśottarī', desc: '120y' },
                             { id: 'ashtottari'  as const, label: 'Aṣṭottarī',  desc: '108y' },
                             { id: 'yogini'      as const, label: 'Yoginī',     desc: '36y' },
                             { id: 'chara'       as const, label: 'Chara',      desc: '12s' },
                           ]).map(({ id, label, desc }) => (
                             <button 
                               key={id} 
                               onClick={() => setDashaSystem(id)} 
                               style={{
                                 padding: '0.35rem 0.6rem',
                                 background: dashaSystem === id ? 'var(--surface-1)' : 'transparent',
                                 border: 'none',
                                 borderRadius: '6px',
                                 cursor: 'pointer',
                                 transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                                 display: 'flex', flexDirection: 'column', alignItems: 'center',
                                 minWidth: '75px',
                                 boxShadow: dashaSystem === id ? '0 2px 8px rgba(0,0,0,0.2), 0 0 0 1px var(--border-bright)' : 'none',
                               }}
                             >
                               <span style={{ 
                                 fontSize: '0.75rem', 
                                 fontWeight: dashaSystem === id ? 700 : 500,
                                 color: dashaSystem === id ? 'var(--text-gold)' : 'var(--text-muted)',
                                 fontFamily: 'var(--font-display)'
                               }}>{label}</span>
                               <span style={{ fontSize: '0.55rem', opacity: 0.5 }}>{desc}</span>
                             </button>
                           ))}
                         </div>
                       </div>

                       <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                         {dashaSystem === 'vimshottari' && (
                           <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
                             <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', flexWrap:'wrap' }}>
                               <span style={{ fontSize:'0.65rem', color:'var(--text-muted)', fontWeight:600,
                                 letterSpacing:'0.08em', textTransform:'uppercase' }}>
                                 Starting Tara
                               </span>
                               {(['Mo','As','Su','Ma','Me','Ju','Ve','Sa','Ra','Ke'] as const).map(id => {
                                 const locked = userPlan === 'free' && id !== 'Mo'
                                 const labels: Record<string,string> = {
                                   Mo:'Moon', As:'Lagna', Su:'Sun', Ma:'Mars', Me:'Mercury',
                                   Ju:'Jupiter', Ve:'Venus', Sa:'Saturn', Ra:'Rahu', Ke:'Ketu',
                                 }
                                 return (
                                   <button key={id}
                                     onClick={() => locked ? (window.location.href='/pricing') : setVimshottariTara(id)}
                                     title={locked ? 'Requires Gold plan' : `Start from ${labels[id]} nakshatra`}
                                     style={{
                                       padding:'0.2rem 0.55rem', fontSize:'0.7rem', fontFamily:'inherit',
                                       background: vimshottariTara===id ? 'var(--gold-faint)' : 'var(--surface-3)',
                                       border: `1px solid ${vimshottariTara===id ? 'var(--gold)' : 'var(--border-soft)'}`,
                                       borderRadius:'var(--r-sm)', cursor:'pointer', transition:'all 0.12s',
                                       color: locked ? 'var(--text-muted)' : (vimshottariTara===id ? 'var(--text-gold)' : 'var(--text-secondary)'),
                                       opacity: locked ? 0.5 : 1,
                                       display:'inline-flex', alignItems:'center', gap:'0.2rem',
                                     }}>
                                     {locked && <span style={{fontSize:'0.6rem'}}>&#x1F512;</span>}
                                     {labels[id]}
                                   </button>
                                 )
                               })}
                             </div>
                             <DashaTree
                               nodes={vimshottariTara==='Mo' ? chart.dashas.vimshottari : (altVimshottari ?? chart.dashas.vimshottari)}
                               birthDate={new Date(chart.meta.birthDate)}
                             />
                           </div>
                         )}
                         {dashaSystem === 'ashtottari' && (
                           chart.dashas.ashtottari?.length 
                             ? <DashaTree nodes={chart.dashas.ashtottari} birthDate={new Date(chart.meta.birthDate)} /> 
                             : <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Aṣṭottarī computation required.</div>
                         )}
                         {dashaSystem === 'yogini' && (
                           chart.dashas.yogini?.length 
                             ? <DashaTree nodes={chart.dashas.yogini} birthDate={new Date(chart.meta.birthDate)} /> 
                             : <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Yoginī computation required.</div>
                         )}
                         {dashaSystem === 'chara' && (
                           chart.dashas.chara?.length 
                             ? <DashaTree nodes={chart.dashas.chara} birthDate={new Date(chart.meta.birthDate)} /> 
                             : <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Chara computation required.</div>
                         )}
                       </div>
                     </div>
                  )}

                  {activeTab === 'panchang' && (
                     <div className="card fade-up" style={{ padding: '1.25rem' }}>
                        <h3 className="label-caps" style={{ marginBottom: '1rem', fontSize: '0.65rem' }}>Daily Pañcāṅga Analysis</h3>
                        <NatalPanchangPanel p={chart.panchang} />
                     </div>
                  )}

                  {activeTab === 'astro-details' && (
                    <div className="card fade-up" style={{ padding: '1.25rem' }}>
                      <AstroDetailsPanel chart={chart} />
                    </div>
                  )}

                  {activeTab === 'yogas' && (
                     <div className="card fade-up" style={{ padding: '1.25rem' }}>
                        <h3 className="label-caps" style={{ marginBottom: '1rem', fontSize: '0.65rem' }}>Graha Yogas</h3>
                        {chart.yogas
                          ? <YogaList yogas={chart.yogas} />
                          : <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.8rem' }}>Recalculate chart to see Yogas.</p>
                        }
                     </div>
                  )}

                  {activeTab === 'arudhas' && (
                     <div className="card fade-up" style={{ padding: '1.25rem' }}>
                        <h3 className="label-caps" style={{ marginBottom: '1rem', fontSize: '0.65rem' }}>Bhāva Āruḍhas</h3>
                        <ArudhaPanel arudhas={chart.arudhas} />
                     </div>
                  )}

                  {activeTab === 'shadbala' && (
                    <div className="card fade-up" style={{ padding: '1rem' }}>
                      <div className="label-caps" style={{ marginBottom: '0.75rem', fontSize: '0.65rem' }}>
                        Ṣaḍbala Quick Widget
                      </div>
                      {chart.shadbala ? (
                        <ShadbalaTable
                          shadbala={chart.shadbala}
                          hideDetails={true}
                          preferClassicCharts={true}
                          variant="widget"
                        />
                      ) : (
                        <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
                          Shadbala data unavailable.
                        </p>
                      )}
                    </div>
                  )}

                   {activeTab === 'bhava-bala' && (
                    <div className="card fade-up" style={{ padding: '1rem' }}>
                      <div className="label-caps" style={{ marginBottom: '0.75rem', fontSize: '0.65rem' }}>
                        Bhāva Bala Quick Widget
                      </div>
                      {chart.bhavaBala ? (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--teal)' }}>
                              {chart.bhavaBala.houses[chart.bhavaBala.strongestHouse].totalRupa.toFixed(1)} R
                            </div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Strongest: H{chart.bhavaBala.strongestHouse}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--rose)' }}>
                              {chart.bhavaBala.houses[chart.bhavaBala.weakestHouse].totalRupa.toFixed(1)} R
                            </div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Weakest: H{chart.bhavaBala.weakestHouse}</div>
                          </div>
                        </div>
                      ) : (
                        <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
                          Bhava Bala data unavailable.
                        </p>
                      )}
                    </div>
                  )}

                  {activeTab === 'vimsopaka' && (
                    <div className="card fade-up" style={{ padding: '1rem' }}>
                      <div className="label-caps" style={{ marginBottom: '0.75rem', fontSize: '0.65rem' }}>
                        Viṁśopaka Quick View
                      </div>
                      {chart.vimsopaka ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-gold)' }}>
                              {chart.vimsopaka.planets[chart.vimsopaka.strongest]?.shodasvarga.toFixed(1)}
                            </div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Strongest: {chart.vimsopaka.strongest}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--rose)' }}>
                              {chart.vimsopaka.planets[chart.vimsopaka.weakest]?.shodasvarga.toFixed(1)}
                            </div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Weakest: {chart.vimsopaka.weakest}</div>
                          </div>
                        </div>
                      ) : (
                        <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
                          Vimsopaka data unavailable.
                        </p>
                      )}
                    </div>
                  )}
                </div>
               )}
             </div>}  {/* end chart-layout-grid conditional */}

               {/* BOTTOM: Full-width Shadbala below charts */}
               {activeTab === 'shadbala' && (
                 <div className="card fade-up" style={{ padding: '1.25rem', marginTop: '1.5rem' }}>
                   <div className="label-caps" style={{ marginBottom: '1rem', fontSize: '0.65rem' }}>Ṣaḍbala Strength</div>
                   {chart.shadbala
                     ? <ShadbalaTable shadbala={chart.shadbala} />
                     : <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Recalculate chart to see Shadbala.</div>
                   }
                 </div>
               )}

               {/* BOTTOM: Full-width Bhava Bala below charts */}
               {activeTab === 'bhava-bala' && (
                 <div className="card fade-up" style={{ padding: '1.25rem', marginTop: '1.5rem' }}>
                   <div className="label-caps" style={{ marginBottom: '1rem', fontSize: '0.65rem' }}>Bhāva Bala — House Strength</div>
                   {chart.bhavaBala
                     ? <BhavaBalaTable bhavaBala={chart.bhavaBala} chart={chart} />
                     : <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Recalculate chart to see Bhava Bala.</div>
                   }
                 </div>
               )}

               {/* BOTTOM: Full-width Ashtakavarga below charts */}
               {activeTab === 'ashtakavarga' && (
                 <div className="card fade-up" style={{ padding: '1.25rem', marginTop: '1.5rem' }}>
                   <div className="label-caps" style={{ marginBottom: '1rem', fontSize: '0.65rem' }}>Aṣṭakavarga Intelligence</div>
                   {chart.ashtakavarga
                     ? <AshtakavargaGrid ashtakavarga={chart.ashtakavarga} ascRashi={chart.lagnas.ascRashi ?? 1} />
                     : <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Recalculate chart to see Aṣṭakavarga.</div>
                   }
                 </div>
               )}

                {/* BOTTOM: Full-width Vimsopaka below charts */}
                {activeTab === 'vimsopaka' && (
                  <div className="card fade-up" style={{ padding: '0.1rem', marginTop: '1.5rem' }}>
                    {chart.vimsopaka
                      ? <VimsopakaBalaPanel vimsopaka={chart.vimsopaka} userPlan={userPlan} />
                      : <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '1.25rem' }}>Viṁśopaka data unavailable — recalculate chart.</div>
                    }
                  </div>
                )}

               {/* BOTTOM: Dashboard Extended Details (Full width Diagnostics) */}
               {activeTab === 'dashboard' && (
                  <div style={{ 
                    flex: '1 1 100%', 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', 
                    gap: '1.5rem', 
                    marginTop: '1.5rem',
                    order: 3 // Extended details always last
                  }}>
                    <div className="card fade-up" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                          <h3 className="label-caps" style={{ margin: 0, color: 'var(--text-gold)', fontSize: '0.7rem' }}>Ashtakavarga Grid</h3>
                          {chart.ashtakavarga ? (
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => setDashExpandAv((e) => !e)}
                              style={{ fontSize: '0.72rem' }}
                            >
                              {dashExpandAv ? 'Show less' : 'Show more'}
                            </button>
                          ) : null}
                        </div>
                        {!chart.ashtakavarga ? (
                          <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Aṣṭakavarga data unavailable.</p>
                        ) : dashExpandAv ? (
                          <AshtakavargaGrid ashtakavarga={chart.ashtakavarga} ascRashi={chart.lagnas.ascRashi ?? 1} />
                        ) : dashboardAshtakSummary ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.65rem' }}>
                              <DashboardMetricChip label="SAV total" value={dashboardAshtakSummary.savTotal} sub="Typical ~337" />
                              <DashboardMetricChip label="Avg / sign" value={dashboardAshtakSummary.avg} sub="Bindus per house" valueColor="var(--text-gold)" />
                            </div>
                            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                              <span style={{ color: 'var(--teal)', fontWeight: 700 }}>Peak:</span>{' '}
                              H{dashboardAshtakSummary.highest.house} ({RASHI_SHORT[dashboardAshtakSummary.highest.rashi]}) —{' '}
                              {dashboardAshtakSummary.highest.val} bindus ·{' '}
                              <span style={{ color: 'var(--rose)', fontWeight: 700 }}>Low:</span> H{dashboardAshtakSummary.lowest.house} (
                              {RASHI_SHORT[dashboardAshtakSummary.lowest.rashi]}) — {dashboardAshtakSummary.lowest.val}
                            </p>
                            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                              Samudaya (SAV) combines all graha contributions. Open full view for BAV, chart styles, and tables.
                            </p>
                          </div>
                        ) : null}
                    </div>

                    <div className="card fade-up" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                          <h3 className="label-caps" style={{ margin: 0, color: 'var(--text-gold)', fontSize: '0.7rem' }}>Ṣaḍbala Strength Overview</h3>
                          {chart.shadbala ? (
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => setDashExpandShad((e) => !e)}
                              style={{ fontSize: '0.72rem' }}
                            >
                              {dashExpandShad ? 'Show less' : 'Show more'}
                            </button>
                          ) : null}
                        </div>
                        {!chart.shadbala ? (
                          <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Shadbala data unavailable.</p>
                        ) : dashExpandShad ? (
                          <ShadbalaTable shadbala={chart.shadbala} classicMultiChartOnly />
                        ) : dashboardShadbalaSummary ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.65rem' }}>
                              <DashboardMetricChip
                                label="Strongest"
                                value={`${dashboardShadbalaSummary.strongestLabel} · ${dashboardShadbalaSummary.strongTotal} R`}
                                sub="Ṣaḍbala total (rupas)"
                              />
                              <DashboardMetricChip
                                label="Weakest"
                                value={`${dashboardShadbalaSummary.weakestLabel} · ${dashboardShadbalaSummary.weakTotal} R`}
                                sub="Ṣaḍbala total (rupas)"
                                valueColor="var(--rose)"
                              />
                            </div>
                            <div style={{ padding: '0.75rem 0.85rem', borderRadius: 'var(--r-md)', background: 'var(--surface-2)', border: '1px solid var(--border-soft)' }}>
                              <div className="label-caps" style={{ fontSize: '0.58rem', marginBottom: '0.45rem' }}>Top 3 by total rupas</div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                                {dashboardShadbalaSummary.top3.map((row, idx) => {
                                  const width = Math.max(10, Math.min(100, row.ratio * 100))
                                  return (
                                    <div key={row.id}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                                        <span style={{ fontSize: '0.77rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                                          #{idx + 1} {row.name}
                                        </span>
                                        <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                                          {row.total.toFixed(2)} R
                                        </span>
                                      </div>
                                      <div style={{ height: 5, borderRadius: 999, background: 'var(--surface-3)', overflow: 'hidden' }}>
                                        <div
                                          style={{
                                            height: '100%',
                                            width: `${width}%`,
                                            borderRadius: 999,
                                            background: idx === 0 ? 'var(--teal)' : idx === 1 ? 'var(--text-gold)' : 'var(--accent)',
                                          }}
                                        />
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                              Mean strength ratio (7 grahas):{' '}
                              <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-gold)' }}>{dashboardShadbalaSummary.meanRatio}×</strong>{' '}
                              vs required minimum.
                            </p>
                            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                              Expand for per-metric mini charts (Sthāna, Kāla, Dig, Cheshta, Drik, totals).
                            </p>
                          </div>
                        ) : null}
                    </div>

                    <div className="card fade-up" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                          <h3 className="label-caps" style={{ margin: 0, color: 'var(--text-gold)', fontSize: '0.7rem' }}>Viṁśopaka Bala (16 Vargas)</h3>
                          {chart.vimsopaka ? (
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => setDashExpandVim((e) => !e)}
                              style={{ fontSize: '0.72rem' }}
                            >
                              {dashExpandVim ? 'Show less' : 'Show more'}
                            </button>
                          ) : null}
                        </div>
                        {!chart.vimsopaka ? (
                          <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Viṁśopaka data unavailable.</p>
                        ) : dashExpandVim ? (
                          <VimsopakaBalaPanel vimsopaka={chart.vimsopaka} userPlan={userPlan} />
                        ) : dashboardVimsopakaSummary ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.65rem' }}>
                              <DashboardMetricChip
                                label="Leader (16 vargas)"
                                value={`${dashboardVimsopakaSummary.strongest}`}
                                sub={`${dashboardVimsopakaSummary.strongScore} / 20`}
                              />
                              <DashboardMetricChip
                                label="Lowest"
                                value={`${dashboardVimsopakaSummary.weakest}`}
                                sub={`${dashboardVimsopakaSummary.weakScore} / 20`}
                                valueColor="var(--rose)"
                              />
                              {dashboardVimsopakaSummary.avg ? (
                                <DashboardMetricChip label="Chart average" value={dashboardVimsopakaSummary.avg} sub="Mean · 16-varga" valueColor="var(--text-gold)" />
                              ) : null}
                            </div>
                            {dashboardVimsopakaSummary.top3.length > 0 ? (
                              <div>
                                <div className="label-caps" style={{ marginBottom: '0.35rem', fontSize: '0.6rem' }}>Top 3</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                  {dashboardVimsopakaSummary.top3.map((row) => (
                                    <span
                                      key={row.id}
                                      style={{
                                        fontSize: '0.78rem',
                                        padding: '0.35rem 0.55rem',
                                        borderRadius: 'var(--r-sm)',
                                        border: '1px solid var(--border)',
                                        background: 'var(--surface-2)',
                                        fontFamily: 'var(--font-mono)',
                                      }}
                                    >
                                      #{row.rank} {GRAHA_NAMES[row.id as GrahaId] ?? row.id}{' '}
                                      <span style={{ color: 'var(--teal)' }}>{row.score.toFixed(2)}</span>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ) : null}
                            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                              Full panel includes heatmaps, dignity matrix, schemes (ṣaḍ/sapta/daśa/ṣoḍaśa), and remedies.
                            </p>
                          </div>
                        ) : null}
                    </div>

                    <div className="card fade-up" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                          <h3 className="label-caps" style={{ margin: 0, color: 'var(--text-gold)', fontSize: '0.7rem' }}>Bhāva Bala (House Strength)</h3>
                          {chart.bhavaBala ? (
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => setDashExpandBhava((e) => !e)}
                              style={{ fontSize: '0.72rem' }}
                            >
                              {dashExpandBhava ? 'Show less' : 'Show more'}
                            </button>
                          ) : null}
                        </div>
                        {!chart.bhavaBala ? (
                          <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Bhāva Bala data unavailable.</p>
                        ) : dashExpandBhava ? (
                          <BhavaBalaTable bhavaBala={chart.bhavaBala} chart={chart} />
                        ) : dashboardBhavaBalaSummary ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.65rem' }}>
                              <DashboardMetricChip
                                label="Strongest house"
                                value={`H${dashboardBhavaBalaSummary.strongestHouse} · ${dashboardBhavaBalaSummary.strongTotal} R`}
                                sub="Total rupas"
                              />
                              <DashboardMetricChip
                                label="Weakest house"
                                value={`H${dashboardBhavaBalaSummary.weakestHouse} · ${dashboardBhavaBalaSummary.weakTotal} R`}
                                sub="Total rupas"
                                valueColor="var(--rose)"
                              />
                              <DashboardMetricChip
                                label="Average"
                                value={`${dashboardBhavaBalaSummary.avgRupa} R`}
                                sub="12-house mean"
                                valueColor="var(--text-gold)"
                              />
                            </div>
                            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                              House spread: <strong style={{ fontFamily: 'var(--font-mono)' }}>{dashboardBhavaBalaSummary.spreadRupa} R</strong>{' '}
                              between strongest and weakest houses.
                            </p>
                            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                              Expand for full Dig Bala, Bhava Adhipati Bala, and supportive factor breakdown.
                            </p>
                          </div>
                        ) : null}
                    </div>

                    <div className="card fade-up" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                          <h3 className="label-caps" style={{ margin: 0, color: 'var(--text-gold)', fontSize: '0.7rem' }}>Natal Panchang</h3>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => setDashExpandPanchang((e) => !e)}
                            style={{ fontSize: '0.72rem' }}
                          >
                            {dashExpandPanchang ? 'Show less' : 'Show more'}
                          </button>
                        </div>
                        <div style={{ maxHeight: dashExpandPanchang ? 'none' : '300px', overflow: 'hidden', position: 'relative' }}>
                          <NatalPanchangPanel p={chart.panchang} />
                          {!dashExpandPanchang && (
                            <div
                              style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                height: '64px',
                                background: 'linear-gradient(transparent, var(--surface-1))',
                                pointerEvents: 'none',
                              }}
                            />
                          )}
                        </div>
                    </div>

                    <div className="card fade-up" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                          <h3 className="label-caps" style={{ margin: 0, color: 'var(--text-gold)', fontSize: '0.7rem' }}>Graha Yogas</h3>
                          {chart.yogas ? (
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => setDashExpandYogas((e) => !e)}
                              style={{ fontSize: '0.72rem' }}
                            >
                              {dashExpandYogas ? 'Show less' : 'Show more'}
                            </button>
                          ) : null}
                        </div>
                        {!chart.yogas ? (
                          <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Yoga data unavailable.</p>
                        ) : (
                          <div style={{ maxHeight: dashExpandYogas ? 'none' : '320px', overflow: 'hidden', position: 'relative' }}>
                            <YogaList yogas={chart.yogas} />
                            {!dashExpandYogas && (
                              <div
                                style={{
                                  position: 'absolute',
                                  bottom: 0,
                                  left: 0,
                                  right: 0,
                                  height: '64px',
                                  background: 'linear-gradient(transparent, var(--surface-1))',
                                  pointerEvents: 'none',
                                }}
                              />
                            )}
                          </div>
                        )}
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
        onClick={() => setIsFormOpen(false)}
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
            onClick={() => setIsFormOpen(false)}
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
                  setTimeout(() => setIsFormOpen(false), 300);
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
