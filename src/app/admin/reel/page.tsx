'use client'

import type { CSSProperties } from 'react'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { getSavedLocation, type LocationValue } from '@/components/ui/LocationPicker'
import type { PanchangApiData } from '@/types/reel-panchang'
import type { TransitEvent } from '@/lib/engine/transits'
import type { TransitPlanetRow } from '@/types/reel-transit'
import type { Rashi } from '@/types/astrology'
import { RASHI_NAMES } from '@/types/astrology'
import {
  type ReelSettings,
  type ExportFormat,
  type ExportAspectPreset,
  type HashtagPreset,
  EXPORT_ASPECT_META,
  getExportCropRect,
  HASHTAG_PRESETS,
} from '@/lib/reel/reel-settings'
import { mondayOfWeekUtc, weekRangeLabel, addDaysUtc } from '@/lib/reel/week-utils'
import {
  formatDateDisplay,
  drawSafeGuides,
  type ReelStyle,
} from '@/lib/reel/canvas-utils'
import { drawPanchangFullCard } from '@/lib/reel/cards/panchang-full'
import { drawChoghadiyaCard } from '@/lib/reel/cards/choghadiya'
import { drawNakshatraCard } from '@/lib/reel/cards/nakshatra'
import { drawMuhurtaCard } from '@/lib/reel/cards/muhurta'
import { drawTransitWeeklyCard } from '@/lib/reel/cards/transit-weekly'
import { drawTransitSkyCard } from '@/lib/reel/cards/transit-sky'
import { drawRashiForecastCard } from '@/lib/reel/cards/rashi-forecast'
import { drawFestivalManualCard, type FestivalCardFields } from '@/lib/reel/cards/festival-manual'
import { suggestFestivalFromTithi } from '@/lib/reel/festival-tithi-suggest'
import styles from './reel-admin.module.css'

export type ReelType =
  | 'panchang_full'
  | 'choghadiya'
  | 'nakshatra'
  | 'muhurta'
  | 'transit_weekly'
  | 'transit_sky'
  | 'rashi_forecast'
  | 'festival'

const REEL_GROUPS: { label: string; items: { id: ReelType; label: string; icon: string }[] }[] = [
  {
    label: 'Daily',
    items: [
      { id: 'panchang_full', label: 'Panchang (full)', icon: '🕉' },
      { id: 'muhurta', label: 'Muhurta today', icon: '⏱' },
      { id: 'nakshatra', label: 'Nakshatra spotlight', icon: '🌙' },
      { id: 'choghadiya', label: 'Choghadiya', icon: '🪔' },
    ],
  },
  { label: 'Sky', items: [{ id: 'transit_sky', label: 'Sky today (grahas)', icon: '🪐' }] },
  {
    label: 'Weekly',
    items: [
      { id: 'transit_weekly', label: 'Weekly transits', icon: '📈' },
      { id: 'rashi_forecast', label: 'Rashi outlook', icon: '♈' },
    ],
  },
  { label: 'Events', items: [{ id: 'festival', label: 'Festival / eclipse', icon: '🎉' }] },
]

const TEMPLATE_PREVIEW_STYLE: Record<
  ReelType,
  { bg: string; accent: string; lines: number; tag: string }
> = {
  panchang_full: { bg: 'linear-gradient(180deg,#1a1032 0%,#25124b 100%)', accent: '#c084fc', lines: 4, tag: 'Daily' },
  muhurta: { bg: 'linear-gradient(180deg,#1f0b0b 0%,#3a1212 100%)', accent: '#f59e0b', lines: 5, tag: 'Daily' },
  nakshatra: { bg: 'linear-gradient(180deg,#101b3b 0%,#1d2f63 100%)', accent: '#60a5fa', lines: 3, tag: 'Daily' },
  choghadiya: { bg: 'linear-gradient(180deg,#1a1a2d 0%,#2f2f52 100%)', accent: '#22c55e', lines: 6, tag: 'Daily' },
  transit_sky: { bg: 'linear-gradient(180deg,#0a2031 0%,#133f60 100%)', accent: '#38bdf8', lines: 4, tag: 'Sky' },
  transit_weekly: { bg: 'linear-gradient(180deg,#0f1f15 0%,#1e3a27 100%)', accent: '#34d399', lines: 5, tag: 'Weekly' },
  rashi_forecast: { bg: 'linear-gradient(180deg,#291a2a 0%,#4d2b4e 100%)', accent: '#f472b6', lines: 4, tag: 'Weekly' },
  festival: { bg: 'linear-gradient(180deg,#2f1805 0%,#5a2d07 100%)', accent: '#fb923c', lines: 3, tag: 'Event' },
}

const TEMPLATE_ONBOARD: Record<ReelType, { blurb: string }> = {
  panchang_full: {
    blurb: 'Full-day snapshot: pañcāṅga limbs, sunrise/moon, inauspicious bands, graha strip, and a Choghadiya teaser — best for daily “what is today” reels.',
  },
  muhurta: {
    blurb: 'Timing-first reel: Brahma, Abhijit, Godhuli, Dur, Horā table, and auspicious Choghadiya — ideal for “best windows today” posts.',
  },
  nakshatra: {
    blurb: 'Moon nakṣatra deep-dive with symbol, devatā, nature, limb end, and cautions — strong for educational + devotional shorts.',
  },
  choghadiya: {
    blurb: 'Full day + night Choghadiya grid with quality cues — perfect for planners and local-audience timing content.',
  },
  transit_sky: {
    blurb: 'Nine-graha sidereal snapshot (sign, nakṣatra, dignity, retro) — great for “sky today” explainers without a birth chart.',
  },
  transit_weekly: {
    blurb: 'Slow-mover highlights for a chosen week vs your Lagna — use when you want transit drama without a full chart read.',
  },
  rashi_forecast: {
    blurb: 'Hybrid weekly outlook: a one-line rāśi hook plus filtered transit blurbs for that ascendant — shareable horoscope-style.',
  },
  festival: {
    blurb: 'Fully manual festival or eclipse card: you control copy and timings. Optional tithi assist from loaded Panchang.',
  },
}

const DENSE_TWO_SLIDE_TYPES: ReelType[] = ['panchang_full', 'muhurta', 'choghadiya', 'nakshatra']

function getExportSlices(
  reelType: ReelType,
  aspect: ExportAspectPreset,
): { sx: number; sy: number; sw: number; sh: number; outW: number; outH: number; suffix: string }[] {
  const base = getExportCropRect(aspect)
  if (!DENSE_TWO_SLIDE_TYPES.includes(reelType)) {
    return [{ ...base, suffix: '' }]
  }

  const segmentH = 1080
  const top = { sx: 0, sy: 0, sw: 1080, sh: segmentH, outW: base.outW, outH: base.outH, suffix: '-1' }
  const bottom = { sx: 0, sy: 1920 - segmentH, sw: 1080, sh: segmentH, outW: base.outW, outH: base.outH, suffix: '-2' }
  return [top, bottom]
}

function renderSliceIntoCanvas(
  source: HTMLCanvasElement,
  target: HTMLCanvasElement,
  part: { sx: number; sy: number; sw: number; sh: number; outW: number; outH: number },
) {
  target.width = part.outW
  target.height = part.outH
  const tctx = target.getContext('2d')
  if (!tctx) return
  tctx.clearRect(0, 0, part.outW, part.outH)
  tctx.fillStyle = '#0b1022'
  tctx.fillRect(0, 0, part.outW, part.outH)

  // Keep aspect ratio exact; no stretching for split exports.
  const scale = Math.min(part.outW / part.sw, part.outH / part.sh)
  const dw = part.sw * scale
  const dh = part.sh * scale
  const dx = (part.outW - dw) / 2
  const dy = (part.outH - dh) / 2
  tctx.drawImage(source, part.sx, part.sy, part.sw, part.sh, dx, dy, dw, dh)
}

function findTemplateItem(id: ReelType): { group: string; label: string; icon: string } {
  for (const g of REEL_GROUPS) {
    const item = g.items.find((t) => t.id === id)
    if (item) return { group: g.label, label: item.label, icon: item.icon }
  }
  return { group: '', label: id, icon: '✦' }
}

type SelectedTemplateSnapshot = {
  meta: { group: string; label: string; icon: string }
  spec: (typeof TEMPLATE_PREVIEW_STYLE)[ReelType]
  blurb: string
  needs: { label: string; ok: boolean }[]
  readyCount: number
  total: number
}

function TemplateHeroCard({ st, mode }: { st: SelectedTemplateSnapshot; mode: 'sidebar' | 'studio' }) {
  const thumbW = mode === 'studio' ? 128 : 112
  const maxH = mode === 'studio' ? 220 : 200
  const titleSize = mode === 'studio' ? 18 : 17
  const blurbSize = mode === 'studio' ? 13 : 12
  const listSize = mode === 'studio' ? 13 : 12
  const eyebrow =
    mode === 'studio'
      ? `Studio · ${st.meta.group}`
      : `Selected template · ${st.meta.group}`

  return (
    <div
      style={{
        borderRadius: 16,
        padding: 1,
        background: 'linear-gradient(135deg, rgba(108,92,231,0.55), rgba(0,184,148,0.35))',
      }}
    >
      <div
        style={{
          borderRadius: 15,
          background: 'var(--color-background-primary)',
          border: '0.5px solid var(--color-border-tertiary)',
          padding: mode === 'studio' ? '16px 16px 14px' : '14px 14px 12px',
        }}
      >
        <div className={styles.heroRow} style={{ gap: mode === 'studio' ? 16 : 14 }}>
          <div
            className={styles.heroRowThumb}
            style={{
              width: thumbW,
              flexShrink: 0,
              borderRadius: 12,
              overflow: 'hidden',
              border: '0.5px solid var(--color-border-secondary)',
              aspectRatio: '9 / 16',
              maxHeight: maxH,
              background: st.spec.bg,
              display: 'flex',
              flexDirection: 'column',
              padding: 8,
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <img src="/veda-icon.png" alt="" width={18} height={18} style={{ borderRadius: 4 }} />
              <span style={{ fontSize: 10, color: '#fff', opacity: 0.92, fontWeight: 600 }}>
                {st.meta.icon} Preview
              </span>
            </div>
            <div
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                fontSize: 9,
                background: 'rgba(255,255,255,0.18)',
                color: '#fff',
                padding: '2px 6px',
                borderRadius: 999,
              }}
            >
              {st.spec.tag}
            </div>
            <div style={{ marginTop: 12, display: 'grid', gap: 5, flex: 1 }}>
              {Array.from({ length: st.spec.lines }).map((_, idx) => (
                <div
                  key={idx}
                  style={{
                    height: 5,
                    width: `${88 - idx * 12}%`,
                    borderRadius: 99,
                    background: idx === 0 ? st.spec.accent : 'rgba(255,255,255,0.38)',
                  }}
                />
              ))}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--color-text-tertiary)',
                marginBottom: 4,
              }}
            >
              {eyebrow}
            </div>
            <div style={{ fontSize: titleSize, fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1.25 }}>
              <span style={{ marginRight: 8 }}>{st.meta.icon}</span>
              {st.meta.label}
            </div>
            <p style={{ margin: '8px 0 10px', fontSize: blurbSize, color: 'var(--color-text-secondary)', lineHeight: 1.55 }}>
              {st.blurb}
            </p>
            <div
              style={{
                height: 4,
                borderRadius: 99,
                background: 'var(--color-background-secondary)',
                overflow: 'hidden',
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${st.total ? Math.round((100 * st.readyCount) / st.total) : 100}%`,
                  borderRadius: 99,
                  background: 'linear-gradient(90deg,#6C5CE7,#00B894)',
                }}
              />
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-tertiary)', marginBottom: 6 }}>
              Checklist
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--color-text-secondary)', fontSize: listSize, lineHeight: 1.55 }}>
              {st.needs.map((n, i) => (
                <li key={i} style={{ marginBottom: 2 }}>
                  <span style={{ color: n.ok ? '#10B981' : '#F59E0B', marginRight: 6 }}>{n.ok ? '✓' : '○'}</span>
                  {n.label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function filterEventsInWeek(events: TransitEvent[], mon: string): TransitEvent[] {
  const end = addDaysUtc(mon, 6)
  return [...events]
    .filter((e) => e.date >= mon && e.date <= end)
    .sort((a, b) => {
      const c = a.date.localeCompare(b.date)
      if (c !== 0) return c
      return a.planetId.localeCompare(b.planetId)
    })
}

function todayIST(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date())
}

export default function ReelPage() {
  const [reelType, setReelType] = useState<ReelType>('panchang_full')
  const [reelStyle, setReelStyle] = useState<ReelStyle>('cosmic')
  const [date, setDate] = useState(todayIST)
  const [data, setData] = useState<PanchangApiData | null>(null)
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [location] = useState<LocationValue>(getSavedLocation)

  const [weekAnchorDate, setWeekAnchorDate] = useState(todayIST)
  const weekMonday = useMemo(() => mondayOfWeekUtc(weekAnchorDate), [weekAnchorDate])
  const weekLabel = useMemo(() => weekRangeLabel(weekMonday), [weekMonday])

  const [lagnaRashi, setLagnaRashi] = useState<Rashi>(1)
  const [forecastRashi, setForecastRashi] = useState<Rashi>(1)

  const [transitEvents, setTransitEvents] = useState<TransitEvent[] | null>(null)
  const [transitLoading, setTransitLoading] = useState(false)
  const [skyGrahas, setSkyGrahas] = useState<TransitPlanetRow[] | null>(null)
  const [skyLoading, setSkyLoading] = useState(false)
  const [skyAyanamshaMode, setSkyAyanamshaMode] = useState<string | null>(null)

  const [festivalFields, setFestivalFields] = useState<FestivalCardFields>({
    title: '',
    subtitle: '',
    countdownLabel: '',
    line1: '',
    line2: '',
  })

  const [settings, setSettings] = useState<ReelSettings>({
    brandTitle: 'vedaansh.com',
    instagramHandle: '@vedaanshlife',
    ctaLine: 'Follow for Daily Panchang Updates',
    hashtagPreset: 'balanced',
    showSafeGuides: false,
    exportFormat: 'png',
    exportAspect: 'reel_9_16',
    jpegQuality: 0.92,
  })

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)
  const [vedaIcon, setVedaIcon] = useState<HTMLImageElement | null>(null)
  const [previewPart, setPreviewPart] = useState<1 | 2>(1)

  useEffect(() => {
    const img = new Image()
    img.onload = () => setVedaIcon(img)
    img.src = '/veda-icon.png'
  }, [])

  const needsPanchang =
    reelType === 'panchang_full' ||
    reelType === 'choghadiya' ||
    reelType === 'nakshatra' ||
    reelType === 'muhurta'

  const fetchPanchang = useCallback(async () => {
    setLoading(true)
    try {
      const qs = new URLSearchParams({
        date,
        lat: String(location.lat),
        lng: String(location.lng),
        tz: location.tz,
      })
      const res = await fetch(`/api/panchang?${qs}`)
      const json = await res.json()
      if (json.success) setData(json.data as PanchangApiData)
      else setData(null)
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [date, location])

  useEffect(() => {
    void fetchPanchang()
  }, [fetchPanchang])

  const fetchTransit = useCallback(async () => {
    if (reelType !== 'transit_weekly' && reelType !== 'rashi_forecast') {
      setTransitEvents(null)
      return
    }
    setTransitLoading(true)
    try {
      const asc = reelType === 'rashi_forecast' ? forecastRashi : lagnaRashi
      const qs = new URLSearchParams({
        ascRashi: String(asc),
        months: '4',
        startDate: weekMonday,
      })
      const res = await fetch(`/api/transit?${qs}`)
      const json = await res.json()
      if (json.success && Array.isArray(json.data)) setTransitEvents(json.data as TransitEvent[])
      else setTransitEvents([])
    } catch {
      setTransitEvents([])
    } finally {
      setTransitLoading(false)
    }
  }, [reelType, lagnaRashi, forecastRashi, weekMonday])

  useEffect(() => {
    void fetchTransit()
  }, [fetchTransit])

  const fetchSky = useCallback(async () => {
    if (reelType !== 'transit_sky') {
      setSkyGrahas(null)
      setSkyAyanamshaMode(null)
      return
    }
    setSkyLoading(true)
    try {
      const qs = new URLSearchParams({ date, ayanamsha: 'lahiri' })
      const res = await fetch(`/api/transits/planets?${qs}`)
      const json = await res.json()
      if (json.success && Array.isArray(json.grahas)) {
        setSkyGrahas(json.grahas as TransitPlanetRow[])
        setSkyAyanamshaMode(typeof json.ayanamsha === 'string' ? json.ayanamsha : null)
      } else {
        setSkyGrahas([])
        setSkyAyanamshaMode(null)
      }
    } catch {
      setSkyGrahas([])
      setSkyAyanamshaMode(null)
    } finally {
      setSkyLoading(false)
    }
  }, [reelType, date])

  useEffect(() => {
    void fetchSky()
  }, [fetchSky])

  const dateInfo = formatDateDisplay(date)
  const seedKey = `${date}-${reelType}-${reelStyle}`

  const filteredWeekEvents = useMemo(() => {
    if (!transitEvents) return []
    return filterEventsInWeek(transitEvents, weekMonday)
  }, [transitEvents, weekMonday])

  const drawReel = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = 1080
    canvas.height = 1920

    const drawPlaceholder = (msg: string) => {
      ctx.fillStyle = '#0f0f12'
      ctx.fillRect(0, 0, 1080, 1920)
      ctx.font = '28px sans-serif'
      ctx.fillStyle = '#9ca3af'
      ctx.textAlign = 'center'
      ctx.fillText(msg, 540, 960)
    }

    if (reelType === 'festival') {
      drawFestivalManualCard(ctx, festivalFields, dateInfo, reelStyle, settings, seedKey, vedaIcon)
      if (settings.showSafeGuides) drawSafeGuides(ctx, reelStyle)
      return
    }

    if (reelType === 'transit_sky') {
      if (skyLoading || !skyGrahas) {
        drawPlaceholder(skyLoading ? 'Loading grahas…' : 'No sky data')
        return
      }
      drawTransitSkyCard(
        ctx,
        skyGrahas,
        date,
        dateInfo,
        reelStyle,
        settings,
        seedKey,
        vedaIcon,
        skyAyanamshaMode ? { ayanamshaMode: skyAyanamshaMode } : null,
      )
      if (settings.showSafeGuides) drawSafeGuides(ctx, reelStyle)
      return
    }

    if (reelType === 'transit_weekly') {
      if (transitLoading || transitEvents === null) {
        drawPlaceholder(transitLoading ? 'Loading transits…' : 'No transit data')
        return
      }
      drawTransitWeeklyCard(
        ctx,
        filteredWeekEvents,
        weekLabel,
        RASHI_NAMES[lagnaRashi],
        reelStyle,
        settings,
        seedKey,
        vedaIcon,
      )
      if (settings.showSafeGuides) drawSafeGuides(ctx, reelStyle)
      return
    }

    if (reelType === 'rashi_forecast') {
      if (transitLoading || transitEvents === null) {
        drawPlaceholder(transitLoading ? 'Loading outlook…' : 'No transit data')
        return
      }
      drawRashiForecastCard(
        ctx,
        forecastRashi,
        RASHI_NAMES[forecastRashi],
        filteredWeekEvents,
        weekLabel,
        reelStyle,
        settings,
        seedKey,
        vedaIcon,
      )
      if (settings.showSafeGuides) drawSafeGuides(ctx, reelStyle)
      return
    }

    if (!data) {
      drawPlaceholder(loading ? 'Loading Panchang…' : 'Panchang unavailable')
      return
    }

    if (reelType === 'panchang_full') drawPanchangFullCard(ctx, data, dateInfo, reelStyle, settings, seedKey, vedaIcon)
    else if (reelType === 'choghadiya') drawChoghadiyaCard(ctx, data, dateInfo, reelStyle, settings, seedKey, vedaIcon)
    else if (reelType === 'nakshatra') drawNakshatraCard(ctx, data, dateInfo, reelStyle, settings, seedKey, vedaIcon)
    else if (reelType === 'muhurta') drawMuhurtaCard(ctx, data, dateInfo, reelStyle, settings, seedKey, vedaIcon)

    if (settings.showSafeGuides) drawSafeGuides(ctx, reelStyle)
  }, [
    data,
    loading,
    reelType,
    reelStyle,
    dateInfo,
    settings,
    seedKey,
    date,
    festivalFields,
    skyGrahas,
    skyLoading,
    skyAyanamshaMode,
    transitLoading,
    transitEvents,
    filteredWeekEvents,
    weekLabel,
    lagnaRashi,
    forecastRashi,
    vedaIcon,
  ])

  const drawPreview = useCallback(() => {
    const master = canvasRef.current
    const preview = previewCanvasRef.current
    if (!master || !preview) return

    const slices = getExportSlices(reelType, settings.exportAspect)
    const idx = Math.min(previewPart - 1, slices.length - 1)
    const part = slices[Math.max(0, idx)]
    renderSliceIntoCanvas(master, preview, part)
  }, [reelType, settings.exportAspect, previewPart])

  useEffect(() => {
    drawReel()
  }, [drawReel])

  useEffect(() => {
    drawPreview()
  }, [drawPreview, drawReel, loading, skyLoading, transitLoading, data, skyGrahas, transitEvents])

  useEffect(() => {
    if (!DENSE_TWO_SLIDE_TYPES.includes(reelType) && previewPart !== 1) {
      setPreviewPart(1)
    }
  }, [reelType, previewPart])

  const canDownload =
    reelType === 'festival' ||
    (reelType === 'transit_sky' && skyGrahas && !skyLoading) ||
    ((reelType === 'transit_weekly' || reelType === 'rashi_forecast') &&
      transitEvents !== null &&
      !transitLoading) ||
    (needsPanchang && !!data)

  const downloadImage = async (which: 'all' | 1 | 2 = 'all') => {
    const canvas = canvasRef.current
    if (!canvas || !canDownload) return
    setDownloading(true)
    try {
      const mimeType = settings.exportFormat === 'jpeg' ? 'image/jpeg' : 'image/png'
      const ext = settings.exportFormat === 'jpeg' ? 'jpg' : 'png'
      const slices = getExportSlices(reelType, settings.exportAspect)
      const tag = EXPORT_ASPECT_META[settings.exportAspect].short
      const selected =
        which === 'all' ? slices : slices.filter((_, i) => i === which - 1)
      for (const slice of selected) {
        const out = document.createElement('canvas')
        renderSliceIntoCanvas(canvas, out, slice)
        await new Promise<void>((resolve) => {
          out.toBlob(
            (blob) => {
              if (!blob) {
                resolve()
                return
              }
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `vedaansh-${reelType}-${date}-${tag}${slice.suffix}.${ext}`
              a.click()
              URL.revokeObjectURL(url)
              setTimeout(resolve, 120)
            },
            mimeType,
            settings.exportFormat === 'jpeg' ? settings.jpegQuality : undefined,
          )
        })
      }
    } finally {
      setDownloading(false)
    }
  }

  const captionText = useMemo(() => {
    const tags = HASHTAG_PRESETS[settings.hashtagPreset].join(' ')
    const head =
      reelType === 'panchang_full'
        ? `Panchang — ${dateInfo.day} ${dateInfo.month}`
        : reelType === 'muhurta'
          ? `Muhurta — ${dateInfo.day} ${dateInfo.month}`
          : reelType === 'nakshatra'
            ? `${data?.nakshatra?.name ?? 'Nakshatra'} spotlight`
            : reelType === 'choghadiya'
              ? `Choghadiya — ${dateInfo.day} ${dateInfo.month}`
              : reelType === 'transit_sky'
                ? `Sky today — ${date}`
                : reelType === 'transit_weekly'
                  ? `Weekly transits — ${weekLabel} · Lagna ${RASHI_NAMES[lagnaRashi]}`
                  : reelType === 'rashi_forecast'
                    ? `${RASHI_NAMES[forecastRashi]} outlook — ${weekLabel}`
                    : `${festivalFields.title || 'Festival'} — ${dateInfo.day} ${dateInfo.month}`
    return [head, settings.ctaLine, tags].join('\n\n')
  }, [
    reelType,
    dateInfo,
    date,
    weekLabel,
    lagnaRashi,
    forecastRashi,
    festivalFields.title,
    data?.nakshatra?.name,
    settings.ctaLine,
    settings.hashtagPreset,
  ])

  const copyCaption = async () => {
    try {
      await navigator.clipboard.writeText(captionText)
    } catch {
      /* ignore */
    }
  }

  const applyTithiSuggest = () => {
    const name = data?.tithi?.name
    if (!name) return
    const s = suggestFestivalFromTithi(name)
    setFestivalFields((prev) => ({
      ...prev,
      title: s.title,
      subtitle: s.subtitle,
    }))
  }

  const selectedTemplate = useMemo(() => {
    const meta = findTemplateItem(reelType)
    const spec = TEMPLATE_PREVIEW_STYLE[reelType]
    const blurb = TEMPLATE_ONBOARD[reelType].blurb
    const needs: { label: string; ok: boolean }[] = []

    if (reelType === 'festival') {
      needs.push({ label: 'Add a title (recommended before export)', ok: festivalFields.title.trim().length > 0 })
      needs.push({ label: 'Optional: Panchang loaded for tithi suggest', ok: !!data })
    } else if (reelType === 'transit_sky') {
      needs.push({ label: 'Date chosen for sky snapshot', ok: Boolean(date) })
      needs.push({ label: 'Graha positions loaded', ok: Boolean(skyGrahas && skyGrahas.length > 0 && !skyLoading) })
    } else if (reelType === 'transit_weekly') {
      needs.push({ label: `Week locked (${weekLabel})`, ok: Boolean(weekMonday) })
      needs.push({ label: `Lagna rāśi set (${lagnaRashi} · ${RASHI_NAMES[lagnaRashi]})`, ok: true })
      needs.push({ label: 'Transit timeline loaded', ok: transitEvents !== null && !transitLoading })
    } else if (reelType === 'rashi_forecast') {
      needs.push({ label: `Week locked (${weekLabel})`, ok: Boolean(weekMonday) })
      needs.push({ label: `Forecast rāśi (${forecastRashi} · ${RASHI_NAMES[forecastRashi]})`, ok: true })
      needs.push({ label: 'Transit timeline loaded', ok: transitEvents !== null && !transitLoading })
    } else {
      needs.push({ label: 'Date + saved location feed Panchang API', ok: Boolean(date) })
      needs.push({ label: 'Panchang payload ready', ok: Boolean(data) && !loading })
    }

    const readyCount = needs.filter((n) => n.ok).length
    return { meta, spec, blurb, needs, readyCount, total: needs.length }
  }, [
    reelType,
    festivalFields.title,
    data,
    date,
    weekLabel,
    weekMonday,
    lagnaRashi,
    forecastRashi,
    transitEvents,
    transitLoading,
    skyGrahas,
    skyLoading,
    loading,
  ])

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader} style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontWeight: 700, margin: '0 0 4px', color: 'var(--color-text-primary)' }}>
          Reel Generator
        </h1>
        <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', margin: 0 }}>
          Manual 1080×1920 cards — no scheduling or auto-post
        </p>
        <div
          className={styles.badgeRow}
          style={{
            marginTop: 10,
            padding: '6px 10px',
            borderRadius: 999,
            background: 'var(--color-background-secondary)',
            border: '0.5px solid var(--color-border-secondary)',
            color: 'var(--color-text-secondary)',
            fontSize: 12,
          }}
        >
          <span>Branding: veda-icon in every reel</span>
        </div>
      </div>

      <div className={styles.layout}>
        <div className={styles.sidebar}>
          <TemplateHeroCard st={selectedTemplate} mode="sidebar" />

          <div
            style={{
              background: 'var(--color-background-primary)',
              border: '0.5px solid var(--color-border-tertiary)',
              borderRadius: 12,
              padding: '1rem',
            }}
          >
            <label
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--color-text-tertiary)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: 8,
              }}
            >
              Date (Panchang / sky)
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 8,
                border: '0.5px solid var(--color-border-secondary)',
                background: 'var(--color-background-secondary)',
                color: 'var(--color-text-primary)',
                fontSize: 14,
              }}
            />
          </div>

          <div
            style={{
              background: 'var(--color-background-primary)',
              border: '0.5px solid var(--color-border-tertiary)',
              borderRadius: 12,
              padding: '1rem',
            }}
          >
            <label
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--color-text-tertiary)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: 10,
              }}
            >
              Template
            </label>
            {REEL_GROUPS.map((g) => (
              <div key={g.label} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{g.label}</div>
                <div className={styles.templateGrid}>
                  {g.items.map((t) => {
                    const active = reelType === t.id
                    const spec = TEMPLATE_PREVIEW_STYLE[t.id]
                    return (
              <button
                        key={t.id}
                        type="button"
                        onClick={() => setReelType(t.id)}
                style={{
                          textAlign: 'left',
                          padding: 0,
                          borderRadius: 10,
                          border: active ? '1.5px solid #6C5CE7' : '0.5px solid var(--color-border-secondary)',
                          background: active ? '#f5f2ff' : 'var(--color-background-secondary)',
                          color: active ? '#3C3489' : 'var(--color-text-primary)',
                          cursor: 'pointer',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: 96,
                            background: spec.bg,
                            padding: 8,
                            position: 'relative',
                            borderBottom: '0.5px solid rgba(255,255,255,0.08)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <img src="/veda-icon.png" alt="Veda icon" style={{ width: 16, height: 16, borderRadius: 4 }} />
                            <span style={{ fontSize: 10, color: '#fff', opacity: 0.9 }}>{t.icon} {t.label.split(' ')[0]}</span>
                          </div>
                          <div
                            style={{
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              fontSize: 9,
                              background: 'rgba(255,255,255,0.16)',
                              color: '#fff',
                              padding: '2px 6px',
                              borderRadius: 999,
                            }}
                          >
                            {spec.tag}
                          </div>
                          <div style={{ marginTop: 10, display: 'grid', gap: 5 }}>
                            {Array.from({ length: spec.lines }).map((_, idx) => (
                              <div
                                key={idx}
                                style={{
                                  height: 5,
                                  width: `${82 - idx * 10}%`,
                                  borderRadius: 99,
                                  background: idx === 0 ? spec.accent : 'rgba(255,255,255,0.35)',
                                }}
                              />
                            ))}
                          </div>
                        </div>
                        <div style={{ padding: '8px 9px' }}>
                          <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.3 }}>{t.label}</div>
                        </div>
              </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {(reelType === 'transit_weekly' || reelType === 'rashi_forecast') && (
            <div
              style={{
                background: 'var(--color-background-primary)',
                border: '0.5px solid var(--color-border-tertiary)',
                borderRadius: 12,
                padding: '1rem',
              }}
            >
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--color-text-tertiary)',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  display: 'block',
                  marginBottom: 8,
                }}
              >
                Week (pick any day)
              </label>
              <input
                type="date"
                value={weekAnchorDate}
                onChange={(e) => setWeekAnchorDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: '0.5px solid var(--color-border-secondary)',
                  background: 'var(--color-background-secondary)',
                  color: 'var(--color-text-primary)',
                  fontSize: 13,
                  marginBottom: 8,
                }}
              />
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{weekLabel}</div>
              {reelType === 'transit_weekly' && (
                <label style={{ display: 'block', marginTop: 10, fontSize: 12, color: 'var(--color-text-secondary)' }}>
                  Lagna rāśi (1–12)
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={lagnaRashi}
                    onChange={(e) => setLagnaRashi(Math.min(12, Math.max(1, Number(e.target.value) || 1)) as Rashi)}
                    style={{
                      width: '100%',
                      marginTop: 4,
                      padding: 6,
                      borderRadius: 8,
                      border: '0.5px solid var(--color-border-secondary)',
                      background: 'var(--color-background-secondary)',
                      color: 'var(--color-text-primary)',
                    }}
                  />
                </label>
              )}
              {reelType === 'rashi_forecast' && (
                <label style={{ display: 'block', marginTop: 10, fontSize: 12, color: 'var(--color-text-secondary)' }}>
                  Forecast rāśi (1–12)
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={forecastRashi}
                    onChange={(e) =>
                      setForecastRashi(Math.min(12, Math.max(1, Number(e.target.value) || 1)) as Rashi)
                    }
                    style={{
                      width: '100%',
                      marginTop: 4,
                      padding: 6,
                      borderRadius: 8,
                      border: '0.5px solid var(--color-border-secondary)',
                      background: 'var(--color-background-secondary)',
                      color: 'var(--color-text-primary)',
                    }}
                  />
                </label>
              )}
            </div>
          )}

          {reelType === 'festival' && (
            <div
              style={{
                background: 'var(--color-background-primary)',
                border: '0.5px solid var(--color-border-tertiary)',
                borderRadius: 12,
                padding: '1rem',
              }}
            >
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--color-text-tertiary)',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  display: 'block',
                  marginBottom: 8,
                }}
              >
                Festival card text
              </label>
              <div style={{ display: 'grid', gap: 8 }}>
                <input
                  placeholder="Title"
                  value={festivalFields.title}
                  onChange={(e) => setFestivalFields((p) => ({ ...p, title: e.target.value }))}
                  style={inputStyle}
                />
                <input
                  placeholder="Subtitle"
                  value={festivalFields.subtitle}
                  onChange={(e) => setFestivalFields((p) => ({ ...p, subtitle: e.target.value }))}
                  style={inputStyle}
                />
                <input
                  placeholder="Countdown / badge (optional)"
                  value={festivalFields.countdownLabel}
                  onChange={(e) => setFestivalFields((p) => ({ ...p, countdownLabel: e.target.value }))}
                  style={inputStyle}
                />
                <textarea
                  placeholder="Main lines (timings, venue, notes)"
                  value={festivalFields.line1}
                  onChange={(e) => setFestivalFields((p) => ({ ...p, line1: e.target.value }))}
                  rows={3}
                  style={{ ...inputStyle, minHeight: 72, resize: 'vertical' as const }}
                />
                <textarea
                  placeholder="More detail (optional)"
                  value={festivalFields.line2}
                  onChange={(e) => setFestivalFields((p) => ({ ...p, line2: e.target.value }))}
                  rows={2}
                  style={{ ...inputStyle, minHeight: 52, resize: 'vertical' as const }}
                />
                <button
                  type="button"
                  onClick={applyTithiSuggest}
                  disabled={!data?.tithi?.name}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: '0.5px solid var(--color-border-secondary)',
                    background: data?.tithi?.name ? 'var(--color-background-secondary)' : 'transparent',
                    cursor: data?.tithi?.name ? 'pointer' : 'not-allowed',
                    fontSize: 12,
                    color: 'var(--color-text-primary)',
                  }}
                >
                  Suggest from today’s tithi (Panchang)
                </button>
              </div>
            </div>
          )}

          <div
            style={{
              background: 'var(--color-background-primary)',
              border: '0.5px solid var(--color-border-tertiary)',
              borderRadius: 12,
              padding: '1rem',
            }}
          >
            <label
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--color-text-tertiary)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: 10,
              }}
            >
              Visual style
            </label>
            <div className={styles.styleChips}>
              {(['cosmic', 'traditional', 'modern'] as ReelStyle[]).map((s) => (
              <button
                key={s}
                  type="button"
                onClick={() => setReelStyle(s)}
                style={{
                    display: 'inline-block',
                    padding: '6px 14px',
                    borderRadius: 20,
                    border: reelStyle === s ? '1.5px solid #00B894' : '0.5px solid var(--color-border-secondary)',
                  background: reelStyle === s ? '#E1F5EE' : 'transparent',
                  color: reelStyle === s ? '#085041' : 'var(--color-text-secondary)',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: reelStyle === s ? 600 : 400,
                }}
              >
                  {s}
              </button>
            ))}
            </div>
          </div>

          <div
            style={{
              background: 'var(--color-background-primary)',
              border: '0.5px solid var(--color-border-tertiary)',
              borderRadius: 12,
              padding: '1rem',
            }}
          >
            <label
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--color-text-tertiary)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: 10,
              }}
            >
              Branding
            </label>
            <div style={{ display: 'grid', gap: 10 }}>
              <input
                value={settings.brandTitle}
                onChange={(e) => setSettings((prev) => ({ ...prev, brandTitle: e.target.value }))}
                placeholder="Brand title"
                style={inputStyle}
              />
              <input
                value={settings.instagramHandle}
                onChange={(e) => setSettings((prev) => ({ ...prev, instagramHandle: e.target.value }))}
                placeholder="@handle"
                style={inputStyle}
              />
              <input
                value={settings.ctaLine}
                onChange={(e) => setSettings((prev) => ({ ...prev, ctaLine: e.target.value }))}
                placeholder="CTA"
                style={inputStyle}
              />
              <select
                value={settings.hashtagPreset}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, hashtagPreset: e.target.value as HashtagPreset }))
                }
                style={inputStyle}
              >
                <option value="balanced">Hashtags: balanced</option>
                <option value="growth">Hashtags: growth</option>
                <option value="devotional">Hashtags: devotional</option>
              </select>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--color-text-tertiary)',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  display: 'block',
                  marginTop: 4,
                  marginBottom: 6,
                }}
              >
                Export frame (preview matches)
              </label>
              <select
                value={settings.exportAspect}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, exportAspect: e.target.value as ExportAspectPreset }))
                }
                style={inputStyle}
              >
                {(Object.keys(EXPORT_ASPECT_META) as ExportAspectPreset[]).map((key) => (
                  <option key={key} value={key}>
                    {EXPORT_ASPECT_META[key].label}
                  </option>
                ))}
              </select>
              <div className={styles.exportRow}>
                <select
                  value={settings.exportFormat}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, exportFormat: e.target.value as ExportFormat }))
                  }
                  style={{ ...inputStyle }}
                >
                  <option value="png">PNG</option>
                  <option value="jpeg">JPEG</option>
                </select>
          <button
                  type="button"
                  onClick={() => setSettings((prev) => ({ ...prev, showSafeGuides: !prev.showSafeGuides }))}
            style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: '0.5px solid var(--color-border-secondary)',
                    background: settings.showSafeGuides ? '#EEEDFE' : 'var(--color-background-secondary)',
                    fontSize: 13,
                    cursor: 'pointer',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  {settings.showSafeGuides ? 'Guides on' : 'Guides off'}
          </button>
              </div>
              {settings.exportFormat === 'jpeg' && (
                <div>
                  <label style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
                    JPEG quality: {Math.round(settings.jpegQuality * 100)}%
                  </label>
                  <input
                    type="range"
                    min={0.6}
                    max={1}
                    step={0.02}
                    value={settings.jpegQuality}
                    onChange={(e) => setSettings((prev) => ({ ...prev, jpegQuality: Number(e.target.value) }))}
                    style={{ width: '100%' }}
                  />
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => void downloadImage('all')}
            disabled={!canDownload || downloading}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 10,
              background: canDownload ? '#6C5CE7' : 'var(--color-background-secondary)',
              color: canDownload ? '#fff' : 'var(--color-text-tertiary)',
              border: 'none',
              cursor: canDownload ? 'pointer' : 'not-allowed',
              fontSize: 15,
              fontWeight: 600,
            }}
          >
            {downloading
              ? 'Generating…'
              : (() => {
                  const d = getExportCropRect(settings.exportAspect)
                  const parts = DENSE_TWO_SLIDE_TYPES.includes(reelType) ? '2 images' : '1 image'
                  return `Download ${parts} · ${d.outW}×${d.outH} (${EXPORT_ASPECT_META[settings.exportAspect].short})`
                })()}
          </button>

          {DENSE_TWO_SLIDE_TYPES.includes(reelType) && (
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button
                type="button"
                onClick={() => void downloadImage(1)}
                disabled={!canDownload || downloading}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '0.5px solid var(--color-border-secondary)',
                  background: canDownload ? 'var(--color-background-primary)' : 'var(--color-background-secondary)',
                  color: canDownload ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
                  cursor: canDownload ? 'pointer' : 'not-allowed',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Download part 1 only
              </button>
              <button
                type="button"
                onClick={() => void downloadImage(2)}
                disabled={!canDownload || downloading}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '0.5px solid var(--color-border-secondary)',
                  background: canDownload ? 'var(--color-background-primary)' : 'var(--color-background-secondary)',
                  color: canDownload ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
                  cursor: canDownload ? 'pointer' : 'not-allowed',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Download part 2 only
              </button>
            </div>
          )}

          <div
            style={{
              background: 'var(--color-background-secondary)',
              borderRadius: 10,
              padding: '12px 14px',
              fontSize: 12,
              color: 'var(--color-text-secondary)',
              lineHeight: 1.6,
            }}
          >
            <strong style={{ display: 'block', marginBottom: 4, color: 'var(--color-text-primary)' }}>Manual only</strong>
            Nothing is scheduled or posted automatically. Export and upload yourself.
          </div>

          <div style={{ background: 'var(--color-background-secondary)', borderRadius: 10, padding: '12px 14px' }}>
            <strong style={{ display: 'block', marginBottom: 6, color: 'var(--color-text-primary)', fontSize: 12 }}>
              Caption
            </strong>
            <textarea readOnly value={captionText} style={{ ...inputStyle, minHeight: 100, fontSize: 12 }} />
            <button
              type="button"
              onClick={() => void copyCaption()}
              style={{ marginTop: 8, width: '100%', padding: '9px 12px', borderRadius: 8, ...inputStyle, cursor: 'pointer' }}
            >
              Copy caption + hashtags
            </button>
          </div>
        </div>

        <div className={styles.studio}>
          <div className={styles.studioHero}>
            <TemplateHeroCard st={selectedTemplate} mode="studio" />
            </div>
          {DENSE_TWO_SLIDE_TYPES.includes(reelType) && (
            <div
              style={{
                display: 'inline-flex',
                gap: 8,
                padding: 6,
                borderRadius: 999,
              border: '0.5px solid var(--color-border-secondary)',
                background: 'var(--color-background-secondary)',
              }}
            >
              <button
                type="button"
                onClick={() => setPreviewPart(1)}
                style={{
                  borderRadius: 999,
                  border: previewPart === 1 ? '1.5px solid #6C5CE7' : '0.5px solid var(--color-border-secondary)',
                  padding: '5px 10px',
                  background: previewPart === 1 ? '#f5f2ff' : 'var(--color-background-primary)',
                  color: previewPart === 1 ? '#3C3489' : 'var(--color-text-secondary)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Preview part 1
              </button>
              <button
                type="button"
                onClick={() => setPreviewPart(2)}
                style={{
                  borderRadius: 999,
                  border: previewPart === 2 ? '1.5px solid #6C5CE7' : '0.5px solid var(--color-border-secondary)',
                  padding: '5px 10px',
                  background: previewPart === 2 ? '#f5f2ff' : 'var(--color-background-primary)',
                  color: previewPart === 2 ? '#3C3489' : 'var(--color-text-secondary)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Preview part 2
              </button>
            </div>
          )}
          <div
            className={styles.previewShell}
            style={{ aspectRatio: EXPORT_ASPECT_META[settings.exportAspect].aspectCss }}
          >
            {DENSE_TWO_SLIDE_TYPES.includes(reelType) && (
              <div
                style={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  zIndex: 2,
                  borderRadius: 999,
                  padding: '4px 10px',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  background: 'rgba(10, 12, 24, 0.72)',
                  color: '#F8FAFC',
                  border: '0.5px solid rgba(148, 163, 184, 0.6)',
                  backdropFilter: 'blur(4px)',
                }}
              >
                Part {previewPart} of 2
              </div>
            )}
            {(needsPanchang && loading) ||
            (reelType === 'transit_sky' && skyLoading) ||
            ((reelType === 'transit_weekly' || reelType === 'rashi_forecast') && transitLoading) ? (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(0,0,0,0.35)',
                  color: '#fff',
                  fontSize: 14,
                  zIndex: 1,
                }}
              >
                Loading…
              </div>
            ) : null}
            <canvas ref={previewCanvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
          </div>
          <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', margin: 0, textAlign: 'center', maxWidth: 420 }}>
            {(() => {
              const d = getExportCropRect(settings.exportAspect)
              const a = EXPORT_ASPECT_META[settings.exportAspect]
              if (DENSE_TWO_SLIDE_TYPES.includes(reelType)) {
                return `This template exports in 2 images (${a.short}) so Panchang details are split and easier to read. Toggle part 1/2 above.`
              }
              return d.outW === 1080 && d.outH === 1920
                ? `Preview and file are full reel ${d.outW}×${d.outH}px (${a.short}).`
                : `Preview shows the ${d.outW}×${d.outH}px export (${a.short}) — center crop from the 1080×1920 reel.`
            })()}
          </p>
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
      </div>
    </div>
  )
}

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: 8,
  border: '0.5px solid var(--color-border-secondary)',
  background: 'var(--color-background-secondary)',
  color: 'var(--color-text-primary)',
  fontSize: 13,
}
