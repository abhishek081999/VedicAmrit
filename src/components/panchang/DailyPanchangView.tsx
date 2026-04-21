'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { formatLongitudeDMS, rashiBlockFromLongitude } from '@/lib/panchang/sidereal'
import { PANCHAKA_GLOSSARY } from '@/lib/panchang/panchaka-glossary'
import { isRiktaTithi, riktaTithiDescription } from '@/lib/panchang/muhurta-extra'
import type { PanchangDayTimeline } from '@/lib/panchang/day-timeline'
import styles from './DailyPanchangView.module.css'
import { PanchangViz } from './PanchangViz'
import { PanchangTimelineStrip } from './PanchangTimelineStrip'

/** Response shape from GET /api/panchang */
export interface PanchangApiData {
  date: string
  location: { lat: number; lng: number; tz: string }
  ayanamsha?: string
  /** Present on fresh API responses; derived client-side from longitudes if missing (e.g. old cache). */
  sunRashi?: {
    rashi: number
    en: string
    sa: string
    dms: string
    dmsInSign: string
    degInSign: number
    longitude: number
  }
  moonRashi?: {
    rashi: number
    en: string
    sa: string
    dms: string
    dmsInSign: string
    degInSign: number
    longitude: number
  }
  vara: { number: number; name: string; sanskrit: string; lord: string }
  tithi: { number: number; name: string; paksha: string; lord: string; percent: number }
  nakshatra: { index: number; name: string; pada: number; lord: string; degree: number }
  sunNakshatra: { index: number; name: string; pada: number; lord: string }
  yoga: { number: number; name: string; quality: string; percent: number }
  karana: { number: number; name: string; type: string; isBhadra: boolean }
  sunrise: string
  sunset: string
  moonrise: string | null
  moonset: string | null
  rahuKalam: { start: string; end: string }
  gulikaKalam: { start: string; end: string }
  yamaganda: { start: string; end: string }
  abhijitMuhurta: { start: string; end: string } | null
  horaTable?: { lord: string; start: string; end: string; isDaytime: boolean }[]
  sunLongitudeSidereal?: number
  moonLongitudeSidereal?: number
  julianDay?: number
  lunarElongationDeg?: number
  calendarContext?: {
    sauraMasa: string
    rituSa: string
    rituEn: string
    ayanaSa: string
    ayanaEn: string
    samvatsara: string
    samvatsaraIndex: number
    shakaYear: number
    vikramSamvat: number
  }
  limbEnds?: {
    tithi: string | null
    nakshatra: string | null
    yoga: string | null
  }
  brahmaMuhurta?: { start: string; end: string }
  planets?: Array<{
    id: string
    sa: string
    longitude: number
    rashiEn: string
    rashiSa: string
    degInSign: number
    retro: boolean
    combust: boolean
  }>
  choghadiya?: {
    day: Array<{ name: string; quality: string; start: string; end: string }>
    night: Array<{ name: string; quality: string; start: string; end: string }>
  }
  riktaTithi?: { active: boolean; detail: string }
  durMuhurat?: Array<{ start: string; end: string }>
  godhuliMuhurat?: { start: string; end: string }
  /** Sunrise → next-sunrise limb segments (API v7+). */
  timeline?: PanchangDayTimeline
  /** Present when API called with birthNak=0–26 */
  personalBala?: {
    birthNak: number
    birthNakName: string
    transitNakIndex: number
    transitNakName: string
    tara: {
      distance: number
      taraIndex: number
      nameSa: string
      nameEn: string
      favorable: boolean
      hint: string
    }
    chandra: {
      birthMoonRashi: number
      transitMoonRashi: number
      houseFromNatalMoon: number
      favorable: boolean
      usedApproxRashi: boolean
      hint: string
      birthRashi: { sa: string; en: string }
      transitRashi: { sa: string; en: string }
    }
  }
}

const GRAHA_COLOR: Record<string, string> = {
  Su: '#e8a730', Mo: '#b0c8e0', Ma: '#e05050',
  Me: '#50c878', Ju: '#f5d06e', Ve: '#f0a0c0',
  Sa: '#9988cc', Ra: '#9b59b6', Ke: '#e67e22',
}

const GRAHA_SYMBOL: Record<string, string> = {
  Su: '☀', Mo: '☽', Ma: '♂', Me: '☿',
  Ju: '♃', Ve: '♀', Sa: '♄', Ra: '☊', Ke: '☋',
}

function fmtTime(iso: string, tz: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: tz,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(iso))
}

function durationMin(start: string, end: string): number {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60_000)
}

function isNow(start: string, end: string): boolean {
  const now = Date.now()
  return now >= new Date(start).getTime() && now <= new Date(end).getTime()
}

function LimbCard({
  titleSa,
  titleEn,
  value,
  detail,
  accent = 'gold',
}: {
  titleSa: string
  titleEn: string
  value: string
  detail: string
  accent?: 'gold' | 'teal' | 'rose' | 'slate'
}) {
  const accentVar =
    accent === 'gold' ? 'var(--text-gold)' :
    accent === 'teal' ? 'var(--teal)' :
    accent === 'rose' ? 'var(--rose)' :
    'var(--text-secondary)'

  return (
    <div className={styles.limbCard}>
      <div
        aria-hidden
        className={styles.limbAccentBar}
        style={{ background: `linear-gradient(90deg, transparent, ${accentVar}, transparent)` }}
      />
      <div className={styles.limbContent}>
        <div className={styles.limbLabel} style={{ color: accentVar }}>
          {titleSa}
        </div>
        <div className={styles.limbSub}>{titleEn}</div>
        <div className={styles.limbValue}>{value}</div>
        <div className={styles.limbDetail}>{detail}</div>
      </div>
    </div>
  )
}

function MuhurtaRow({
  label,
  start,
  end,
  tz,
  tone,
}: {
  label: string
  start: string
  end: string
  tz: string
  tone: 'warn' | 'caution' | 'good'
}) {
  const active = isNow(start, end)
  const bg =
    tone === 'good' ? 'rgba(78,205,196,0.07)' :
    tone === 'warn' ? 'rgba(224,123,142,0.07)' :
    'rgba(245,158,66,0.07)'
  const border =
    tone === 'good' ? 'rgba(78,205,196,0.22)' :
    tone === 'warn' ? 'rgba(224,123,142,0.22)' :
    'rgba(245,158,66,0.22)'
  const labelCol =
    tone === 'good' ? 'var(--teal)' :
    tone === 'warn' ? 'var(--rose)' :
    'var(--amber)'

  return (
    <tr style={{ background: active ? `${bg}cc` : bg, borderBottom: `1px solid var(--border-soft)` }}>
      <td style={{ padding: '0.65rem 0.85rem', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.82rem', color: labelCol }}>
        {label}{active && <span style={{ marginLeft: 8, fontSize: '0.7rem', fontStyle: 'italic', opacity: 0.85 }}>now</span>}
      </td>
      <td style={{ padding: '0.65rem 0.85rem', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
        {fmtTime(start, tz)} – {fmtTime(end, tz)}
      </td>
      <td style={{ padding: '0.65rem 0.85rem', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'right' }}>
        {durationMin(start, end)} min
      </td>
    </tr>
  )
}

type HoraEntry = NonNullable<PanchangApiData['horaTable']>[number]

function HoraRow({ hora, tz }: { hora: HoraEntry; tz: string }) {
  const active = isNow(hora.start, hora.end)
  const col = GRAHA_COLOR[hora.lord] ?? '#888'
  const name =
    hora.lord === 'Su' ? 'Sun' : hora.lord === 'Mo' ? 'Moon' :
    hora.lord === 'Ma' ? 'Mars' : hora.lord === 'Me' ? 'Mercury' :
    hora.lord === 'Ju' ? 'Jupiter' : hora.lord === 'Ve' ? 'Venus' :
    hora.lord === 'Sa' ? 'Saturn' : hora.lord

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.48rem 0.75rem',
      background: active ? `${col}14` : 'transparent',
      borderLeft: `3px solid ${active ? col : 'transparent'}`,
      borderRadius: '0 var(--r-sm) var(--r-sm) 0',
    }}>
      <span style={{ fontSize: '1.05rem', width: 22, textAlign: 'center' }}>{GRAHA_SYMBOL[hora.lord] ?? hora.lord}</span>
      <div style={{ flex: 1 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: active ? col : 'var(--text-primary)', fontSize: '0.88rem' }}>
          {name}
        </span>
        {active && <span style={{ marginLeft: 8, fontSize: '0.68rem', fontStyle: 'italic', color: col }}>current</span>}
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
        {fmtTime(hora.start, tz)} – {fmtTime(hora.end, tz)}
      </div>
      <div style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: hora.isDaytime ? 'var(--amber)' : 'var(--accent)', opacity: 0.75, minWidth: 36 }}>
        {hora.isDaytime ? 'Day' : 'Night'}
      </div>
    </div>
  )
}

function TithiProgress({ percent, paksha }: { percent: number; paksha: string }) {
  const isShukla = paksha === 'shukla'
  return (
    <div style={{ marginTop: '0.5rem' }}>
      <div style={{ height: 4, borderRadius: 99, background: 'var(--surface-3)', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${Math.min(100, percent)}%`,
          background: isShukla
            ? 'linear-gradient(90deg, var(--gold-dim), var(--gold-light))'
            : 'linear-gradient(90deg, var(--accent-dim, #4a4080), var(--accent))',
          borderRadius: 99,
          transition: 'width 0.6s ease',
        }} />
      </div>
      <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
        {percent.toFixed(1)}% of tithi elapsed
      </div>
    </div>
  )
}

function chogQualityClass(q: string): string {
  if (q === 'good') return styles.chogGood
  if (q === 'mixed') return styles.chogMixed
  return styles.chogAvoid
}

export function DailyPanchangView({ data }: { data: PanchangApiData }) {
  const tz = data.location.tz
  const [horaOpen, setHoraOpen] = useState(true)
  const [planetsOpen, setPlanetsOpen] = useState(true)
  const [chogOpen, setChogOpen] = useState(true)
  const [panchakaOpen, setPanchakaOpen] = useState(false)

  const sunRashi = data.sunRashi ?? rashiBlockFromLongitude(data.sunLongitudeSidereal ?? 0)
  const moonRashi = data.moonRashi ?? rashiBlockFromLongitude(data.moonLongitudeSidereal ?? 0)
  const horaRows = data.horaTable ?? []

  const dayLengthMin = useMemo(() => {
    return Math.round((new Date(data.sunset).getTime() - new Date(data.sunrise).getTime()) / 60_000)
  }, [data.sunrise, data.sunset])

  const yogaQ = data.yoga?.quality ?? 'neutral'

  const riktaInfo = data.riktaTithi ?? {
    active: isRiktaTithi(data.tithi.number),
    detail: riktaTithiDescription(),
  }

  const elongDisplay = useMemo(() => {
    if (data.lunarElongationDeg != null) return data.lunarElongationDeg
    const m = data.moonLongitudeSidereal ?? 0
    const s = data.sunLongitudeSidereal ?? 0
    return ((m - s) % 360 + 360) % 360
  }, [data.lunarElongationDeg, data.moonLongitudeSidereal, data.sunLongitudeSidereal])

  return (
    <div className={styles.root}>
      {/* Hero — fixed light-on-dark copy (never use --text-primary here) */}
      <header className={styles.hero}>
        <div className={styles.heroPattern} />
        <div className={styles.heroInner}>
          <div className={styles.heroKicker}>Hindu almanac</div>
          <h1 className={styles.heroTitle}>
            Pañcāṅga <span className={styles.heroTitleMuted}>— five limbs of time</span>
          </h1>
          <p className={styles.heroBody}>
            Sidereal longitudes, lunar day, yoga, karaṇa, and muhūrta windows for your chosen place — computed with Swiss Ephemeris, in the spirit of detailed printed and online pañcāṅgas.
          </p>
        </div>
      </header>

      <PanchangViz
        sunLon={data.sunLongitudeSidereal ?? 0}
        moonLon={data.moonLongitudeSidereal ?? 0}
        elongDeg={elongDisplay}
        nakIndex={data.nakshatra.index}
        tithiPercent={data.tithi.percent}
        paksha={data.tithi.paksha}
        yogaPercent={data.yoga.percent}
        yogaNumber={data.yoga.number}
        sunrise={data.sunrise}
        sunset={data.sunset}
        tz={tz}
        dateStr={data.date}
      />

      {data.timeline && <PanchangTimelineStrip timeline={data.timeline} tz={tz} />}

      {/* Ephemeris strip */}
      <section className={styles.ephemeris}>
        <div>
          <div className={styles.ephemerisLabel}>Julian day (UT)</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>{(data.julianDay ?? 0).toFixed(5)}</div>
        </div>
        <div>
          <div className={styles.ephemerisLabel}>Ayanāṃśa</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.92rem', color: 'var(--text-secondary)' }}>{(data.ayanamsha ?? 'lahiri').replace(/_/g, ' ')}</div>
        </div>
        <div>
          <div className={styles.ephemerisLabel}>Sūrya — Rāśi</div>
          <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>
            <span style={{ color: '#e8a730' }}>☀</span>{' '}
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>{sunRashi.sa}</span>
            <span style={{ color: 'var(--text-muted)', marginLeft: 6, fontSize: '0.8rem' }}>({sunRashi.en})</span>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
            {sunRashi.dmsInSign} in sign
            {formatLongitudeDMS(data.sunLongitudeSidereal ?? 0) !== sunRashi.dmsInSign && (
              <> · λ {formatLongitudeDMS(data.sunLongitudeSidereal ?? 0)}</>
            )}
          </div>
        </div>
        <div>
          <div className={styles.ephemerisLabel}>Chandra — Rāśi</div>
          <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>
            <span style={{ color: '#b0c8e0' }}>☽</span>{' '}
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>{moonRashi.sa}</span>
            <span style={{ color: 'var(--text-muted)', marginLeft: 6, fontSize: '0.8rem' }}>({moonRashi.en})</span>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
            {moonRashi.dmsInSign} in sign
            {formatLongitudeDMS(data.moonLongitudeSidereal ?? 0) !== moonRashi.dmsInSign && (
              <> · λ {formatLongitudeDMS(data.moonLongitudeSidereal ?? 0)}</>
            )}
          </div>
        </div>
        {data.lunarElongationDeg != null && (
          <div>
            <div className={styles.ephemerisLabel}>Moon–Sun elongation</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
              {data.lunarElongationDeg.toFixed(2)}°
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.35 }}>
              Sidereal separation (lunar phase geometry). 0° ≈ new moon; 180° ≈ full moon.
            </div>
          </div>
        )}
      </section>

      {data.personalBala && (
        <section className={styles.personalBalaWrap}>
          <div className={styles.sectionHeading}>Tārā & Chandra bala (your Moon)</div>
          <p className={styles.advNote} style={{ marginTop: 0 }}>
            Compared to your <strong>birth nakṣatra</strong> (and natal Moon sign — exact or estimated from the star). Transit uses today’s Moon from this pañcāṅga.
          </p>
          <div className={styles.personalBalaGrid}>
            <div className={styles.personalBalaCard}>
              <div style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>Tārā bala</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1.05rem', color: data.personalBala.tara.favorable ? 'var(--teal)' : 'var(--rose)' }}>
                {data.personalBala.tara.nameSa} <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.85rem' }}>({data.personalBala.tara.nameEn})</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.45 }}>
                Distance {data.personalBala.tara.distance}/27 from birth star → tāra {data.personalBala.tara.taraIndex}/9. {data.personalBala.tara.hint}
              </div>
            </div>
            <div className={styles.personalBalaCard}>
              <div style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>Chandra bala</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1.05rem', color: data.personalBala.chandra.favorable ? 'var(--teal)' : 'var(--rose)' }}>
                House {data.personalBala.chandra.houseFromNatalMoon} from natal Moon
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.45 }}>
                Natal Moon: {data.personalBala.chandra.birthRashi.sa} ({data.personalBala.chandra.birthRashi.en})
                {data.personalBala.chandra.usedApproxRashi && ' · rāśi estimated from nakṣatra'}
                <br />
                Transit Moon: {data.personalBala.chandra.transitRashi.sa} ({data.personalBala.chandra.transitRashi.en})
                <br />
                {data.personalBala.chandra.hint}
              </div>
            </div>
          </div>
        </section>
      )}

      {data.calendarContext && (
        <section className={styles.calendarStrip}>
          <div className={styles.calendarCell}>
            <div className={styles.calendarLabel}>Saura māsa</div>
            <div className={styles.calendarValue}>{data.calendarContext.sauraMasa}</div>
          </div>
          <div className={styles.calendarCell}>
            <div className={styles.calendarLabel}>Ṛtu (season)</div>
            <div className={styles.calendarValue}>
              {data.calendarContext.rituSa} <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.82rem' }}>({data.calendarContext.rituEn})</span>
            </div>
          </div>
          <div className={styles.calendarCell}>
            <div className={styles.calendarLabel}>Ayana</div>
            <div className={styles.calendarValue}>
              {data.calendarContext.ayanaSa}
            </div>
          </div>
          <div className={styles.calendarCell}>
            <div className={styles.calendarLabel}>Saṃvatsara (approx.)</div>
            <div className={styles.calendarValue}>{data.calendarContext.samvatsara}</div>
          </div>
          <div className={styles.calendarCell}>
            <div className={styles.calendarLabel}>Śaka · Vikrama (approx.)</div>
            <div className={styles.calendarValue} style={{ fontSize: '0.85rem' }}>
              {data.calendarContext.shakaYear} · {data.calendarContext.vikramSamvat}
            </div>
          </div>
          <p className={styles.calendarHint}>
            Saura month and seasons follow the Sun’s sidereal rāśi. Śaka / Vikrama years are rough civil mappings; traditional reckoning varies by region and school.
          </p>
        </section>
      )}

      {/* Sun / moon / day length */}
      <section className={styles.timingGrid}>
        {[
          { icon: '🌅', label: 'Sunrise', time: data.sunrise, color: '#d97706' },
          { icon: '🌇', label: 'Sunset', time: data.sunset, color: '#c2416c' },
          { icon: '🌙', label: 'Moonrise', time: data.moonrise, color: '#7c9cbf', emptyTitle: 'No moonrise during this calendar day at this location (polar days or ephemeris edge case).' },
          { icon: '🌑', label: 'Moonset', time: data.moonset, color: '#94a3b8', emptyTitle: 'No moonset during this calendar day at this location.' },
        ].map(({ icon, label, time, color, emptyTitle }) => (
          <div key={label} className={styles.timingCell}>
            <div style={{ fontSize: '1.35rem', marginBottom: 4 }}>{icon}</div>
            <div style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>{label}</div>
            <div
              title={!time && emptyTitle ? emptyTitle : undefined}
              className={styles.timingValue}
              style={{ color: time ? color : 'var(--text-muted)' }}
            >
              {time ? fmtTime(time, tz) : '—'}
            </div>
          </div>
        ))}
        <div
          className={styles.timingCell}
          style={{
            border: '1px solid rgba(180, 134, 0, 0.28)',
            background: 'linear-gradient(180deg, rgba(180, 134, 0, 0.09), var(--surface-2))',
          }}
        >
          <div style={{ fontSize: '1.35rem', marginBottom: 4 }}>⏱</div>
          <div style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>Day length</div>
          <div className={styles.timingValue} style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
            {Math.floor(dayLengthMin / 60)}h {dayLengthMin % 60}m
          </div>
        </div>
      </section>

      {/* Pañca aṅga */}
      <section>
        <div className={styles.sectionHeading}>Pañca aṅga — the five limbs</div>
        <div className={styles.fiveGrid}>
          <LimbCard
            titleSa="Vāra"
            titleEn="Weekday & its lord"
            value={data.vara?.name ?? '—'}
            detail={[data.vara?.sanskrit, `planetary lord ${data.vara?.lord ?? '—'}`].filter(Boolean).join(' · ')}
            accent="gold"
          />
          <div className={styles.limbCard}>
            <div className={styles.limbAccentBar} style={{ background: 'linear-gradient(90deg, transparent, var(--text-gold), transparent)' }} />
            <div className={styles.limbContent}>
              <div className={styles.limbLabel} style={{ color: 'var(--text-gold)' }}>Tithi</div>
              <div className={styles.limbSub}>Lunar day · {data.tithi.number}/30</div>
              <div className={styles.limbValue}>{data.tithi?.name ?? '—'}</div>
              <div className={styles.limbDetail}>
                {data.tithi.paksha === 'shukla' ? 'Śukla pakṣa (waxing)' : 'Kṛṣṇa pakṣa (waning)'} · lord {data.tithi.lord}
              </div>
              <TithiProgress percent={data.tithi.percent} paksha={data.tithi.paksha} />
              {riktaInfo.active && (
                <div
                  style={{
                    marginTop: '0.65rem',
                    padding: '0.5rem 0.6rem',
                    borderRadius: 'var(--r-sm)',
                    border: '1px solid rgba(225, 29, 72, 0.28)',
                    background: 'rgba(225, 29, 72, 0.06)',
                    fontSize: '0.72rem',
                    lineHeight: 1.45,
                    color: 'var(--text-secondary)',
                  }}
                >
                  <strong style={{ color: 'var(--rose)' }}>Ṛkta tithi</strong> — {riktaInfo.detail}
                </div>
              )}
            </div>
          </div>
          <LimbCard
            titleSa="Nakṣatra"
            titleEn="Moon’s lunar mansion"
            value={data.nakshatra?.name ?? '—'}
            detail={`Pada ${data.nakshatra?.pada ?? '—'} · ${data.nakshatra?.lord ?? '—'} · ${(data.nakshatra?.degree ?? 0).toFixed(2)}° within nakṣatra`}
            accent="gold"
          />
          <div
            className={styles.limbCard}
            style={{
              borderColor: yogaQ === 'auspicious' ? 'rgba(13, 148, 136, 0.35)' : yogaQ === 'inauspicious' ? 'rgba(225, 29, 72, 0.35)' : undefined,
            }}
          >
            <div
              className={styles.limbAccentBar}
              style={{
                background: `linear-gradient(90deg, transparent, ${yogaQ === 'auspicious' ? 'var(--teal)' : yogaQ === 'inauspicious' ? 'var(--rose)' : 'var(--text-muted)'}, transparent)`,
              }}
            />
            <div className={styles.limbContent}>
              <div
                className={styles.limbLabel}
                style={{ color: yogaQ === 'auspicious' ? 'var(--teal)' : yogaQ === 'inauspicious' ? 'var(--rose)' : 'var(--text-muted)' }}
              >
                Yoga
              </div>
              <div className={styles.limbSub}>Luni-solar combination · {data.yoga.number}/27</div>
              <div
                className={styles.limbValue}
                style={
                  yogaQ === 'auspicious'
                    ? { color: 'var(--teal)' }
                    : yogaQ === 'inauspicious'
                      ? { color: 'var(--rose)' }
                      : undefined
                }
              >
                {data.yoga?.name ?? '—'}
              </div>
              <div className={styles.limbDetail}>
                {yogaQ} · {(data.yoga.percent ?? 0).toFixed(1)}% elapsed
              </div>
            </div>
          </div>
          <LimbCard
            titleSa="Karaṇa"
            titleEn="Half of a tithi"
            value={data.karana?.name ?? '—'}
            detail={data.karana?.isBhadra ? 'Bhadra — traditionally avoid auspicious beginnings' : `${data.karana?.type ?? ''}`}
            accent={data.karana?.isBhadra ? 'rose' : 'slate'}
          />
        </div>
      </section>

      {/* Nakṣatra of luminaries */}
      <section className={styles.nakshatraGrid}>
        <div className={styles.nakshatraCardSun}>
          <div style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#b8860b', fontFamily: 'var(--font-display)', marginBottom: 6 }}>Sūrya nakṣatra</div>
          <div className={styles.limbValue} style={{ fontSize: '1.12rem' }}>{data.sunNakshatra.name}</div>
          <div className={styles.limbDetail} style={{ marginTop: 6 }}>Pada {data.sunNakshatra.pada} · lord {data.sunNakshatra.lord}</div>
        </div>
        <div className={styles.nakshatraCardMoon}>
          <div style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#64748b', fontFamily: 'var(--font-display)', marginBottom: 6 }}>Chandra nakṣatra</div>
          <div className={styles.limbValue} style={{ fontSize: '1.12rem' }}>{data.nakshatra.name}</div>
          <div className={styles.limbDetail} style={{ marginTop: 6 }}>Pada {data.nakshatra.pada} · lord {data.nakshatra.lord}</div>
        </div>
      </section>

      {(data.brahmaMuhurta || data.limbEnds) && (
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem' }}>
          {data.brahmaMuhurta && (
            <div style={{ padding: '1rem 1.15rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: 'var(--surface-1)' }}>
              <div className={styles.sectionHeading} style={{ marginBottom: '0.5rem' }}>Brahmā muhūrta</div>
              <p className={styles.advNote} style={{ marginBottom: '0.5rem' }}>
                Early-morning sāttvic window (common rule: ~96–48 minutes before local sunrise; traditions vary).
              </p>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                {fmtTime(data.brahmaMuhurta.start, tz)} — {fmtTime(data.brahmaMuhurta.end, tz)}
              </div>
            </div>
          )}
          {data.limbEnds && (
            <div style={{ padding: '1rem 1.15rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: 'var(--surface-1)' }}>
              <div className={styles.sectionHeading} style={{ marginBottom: '0.5rem' }}>Next limb changes (approx.)</div>
              <p className={styles.advNote} style={{ marginBottom: '0.5rem' }}>
                Times when the current tithi, Moon’s nakṣatra, or yoga yields to the next, from ephemeris search at your ayanāṃśa.
              </p>
              <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                <li><strong>Tithi:</strong>{' '}{data.limbEnds.tithi ? fmtTime(data.limbEnds.tithi, tz) : '—'}</li>
                <li><strong>Nakṣatra:</strong>{' '}{data.limbEnds.nakshatra ? fmtTime(data.limbEnds.nakshatra, tz) : '—'}</li>
                <li><strong>Yoga:</strong>{' '}{data.limbEnds.yoga ? fmtTime(data.limbEnds.yoga, tz) : '—'}</li>
              </ul>
            </div>
          )}
        </section>
      )}

      {/* Muhūrta table */}
      <section>
        <div className={styles.sectionHeading}>Inauspicious & special muhūrta</div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 0.75rem', maxWidth: 720, lineHeight: 1.5 }}>
          Rāhu / Gulikā / Yamagaṇḍa are avoided for new undertakings; Abhijit is a brief favourable window around local solar noon. Dur muhūrta uses the 6th and 10th of fifteen equal daytime divisions (common North Indian convention). Gōdhūli is taken here as ~24 minutes before sunset.
        </p>
        <div className={styles.muhurtaTableWrap}>
          <table className={styles.muhurtaTable}>
            <thead>
              <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ textAlign: 'left', padding: '0.55rem 0.85rem', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>Muhūrta</th>
                <th style={{ textAlign: 'left', padding: '0.55rem 0.85rem', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>Local time ({tz})</th>
                <th style={{ textAlign: 'right', padding: '0.55rem 0.85rem', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>Length</th>
              </tr>
            </thead>
            <tbody>
              <MuhurtaRow label="Rāhu kālam" start={data.rahuKalam.start} end={data.rahuKalam.end} tz={tz} tone="warn" />
              <MuhurtaRow label="Gulikā kālam" start={data.gulikaKalam.start} end={data.gulikaKalam.end} tz={tz} tone="warn" />
              <MuhurtaRow label="Yamagaṇḍa" start={data.yamaganda.start} end={data.yamaganda.end} tz={tz} tone="caution" />
              {data.abhijitMuhurta && (
                <MuhurtaRow label="Abhijit (auspicious)" start={data.abhijitMuhurta.start} end={data.abhijitMuhurta.end} tz={tz} tone="good" />
              )}
              {data.durMuhurat?.[0] && (
                <MuhurtaRow label="Dur muhūrta (1st)" start={data.durMuhurat[0].start} end={data.durMuhurat[0].end} tz={tz} tone="warn" />
              )}
              {data.durMuhurat?.[1] && (
                <MuhurtaRow label="Dur muhūrta (2nd)" start={data.durMuhurat[1].start} end={data.durMuhurat[1].end} tz={tz} tone="warn" />
              )}
              {data.godhuliMuhurat && (
                <MuhurtaRow label="Gōdhūli (twilight)" start={data.godhuliMuhurat.start} end={data.godhuliMuhurat.end} tz={tz} tone="good" />
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <button type="button" className={styles.disclosureBtn} onClick={() => setPanchakaOpen(o => !o)}>
          <span className={styles.chev} style={{ transform: panchakaOpen ? 'rotate(90deg)' : 'none' }}>▶</span>
          Pañcaka — fivefold cautions (reference)
        </button>
        <p className={styles.advNote}>
          Full Pañcaka timing uses lineage-specific nakṣatra–tithi–vāra tables (often in printed almanacs). We do not auto-flag Pañcaka “risk” here; use the glossary below and your teacher’s rules.
        </p>
        {panchakaOpen && (
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {PANCHAKA_GLOSSARY.map((row) => (
              <div
                key={row.sa}
                style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--r-md)',
                  border: '1px solid var(--border)',
                  background: 'var(--surface-1)',
                }}
              >
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.88rem' }}>
                  {row.sa} <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.8rem' }}>({row.en})</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.45 }}>{row.hint}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {data.planets && data.planets.length > 0 && (
        <section>
          <button type="button" className={styles.disclosureBtn} onClick={() => setPlanetsOpen(o => !o)}>
            <span className={styles.chev} style={{ transform: planetsOpen ? 'rotate(90deg)' : 'none' }}>▶</span>
            Sidereal grahas — rāśi & motion
          </button>
          {planetsOpen && (
            <div className={styles.dataTableWrap}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Graha</th>
                    <th>Rāśi</th>
                    <th>° in sign</th>
                    <th>λ (sid.)</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {data.planets.map((p) => (
                    <tr key={p.id}>
                      <td style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>{p.sa}</td>
                      <td>{p.rashiSa} <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>({p.rashiEn})</span></td>
                      <td className={styles.mono}>{p.degInSign.toFixed(2)}°</td>
                      <td className={styles.mono}>{p.longitude.toFixed(4)}°</td>
                      <td style={{ fontSize: '0.75rem' }}>
                        {p.retro && <span style={{ color: 'var(--rose)' }}>Retro </span>}
                        {p.combust && <span style={{ color: 'var(--amber)' }}>Combust</span>}
                        {!p.retro && !p.combust && '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {data.choghadiya && data.choghadiya.day.length > 0 && (
        <section>
          <button type="button" className={styles.disclosureBtn} onClick={() => setChogOpen(o => !o)}>
            <span className={styles.chev} style={{ transform: chogOpen ? 'rotate(90deg)' : 'none' }}>▶</span>
            Choghadiya — day & night
          </button>
          <p className={styles.advNote}>
            Eight divisions from sunrise→sunset and sunset→next sunrise. Labh, Amrit, and Shubh are commonly chosen for beginnings; Rog, Kaal, and Udveg are often avoided (North Indian convention).
          </p>
          {chogOpen && (
            <div className={styles.chogGrid}>
              {(['day', 'night'] as const).map((part) => (
                <div key={part} className={styles.chogBlock}>
                  <div className={styles.chogBlockTitle}>{part === 'day' ? 'Day (sunrise–sunset)' : 'Night (sunset–next sunrise)'}</div>
                  {data.choghadiya![part].map((slot, i) => {
                    const active = isNow(slot.start, slot.end)
                    return (
                      <div key={i} className={`${styles.chogRow} ${active ? styles.chogRowActive : ''}`}>
                        <span>
                          <span className={chogQualityClass(slot.quality)}>{slot.name}</span>
                          {active && <span style={{ marginLeft: 8, fontSize: '0.65rem', fontStyle: 'italic', color: 'var(--text-gold)' }}>now</span>}
                        </span>
                        <span className={styles.mono} style={{ color: 'var(--text-muted)' }}>
                          {fmtTime(slot.start, tz)} – {fmtTime(slot.end, tz)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Horā */}
      <section>
        <button
          type="button"
          onClick={() => setHoraOpen(o => !o)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'var(--font-display)',
            fontSize: '0.72rem',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            marginBottom: horaOpen ? '0.75rem' : 0,
            padding: 0,
          }}
        >
          <span style={{ display: 'inline-block', transform: horaOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s', fontSize: '0.65rem' }}>▶</span>
          Horā table — {horaRows.length} horās ({tz})
        </button>
        {horaOpen && (
          <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
            <div className={styles.horaHeadRow}>
              {['Day horās', 'Night horās'].map(label => (
                <div key={label} style={{ padding: '0.5rem 0.85rem', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', borderRight: label === 'Day horās' ? '1px solid var(--border-soft)' : 'none' }}>
                  {label}
                </div>
              ))}
            </div>
            <div className={styles.horaColumns}>
              <div style={{ borderRight: '1px solid var(--border-soft)' }}>{horaRows.filter(h => h.isDaytime).map((h, i) => <HoraRow key={`d-${i}`} hora={h} tz={tz} />)}</div>
              <div>{horaRows.filter(h => !h.isDaytime).map((h, i) => <HoraRow key={`n-${i}`} hora={h} tz={tz} />)}</div>
            </div>
          </div>
        )}
      </section>

      <footer style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.25rem', borderTop: '1px solid var(--border-soft)', marginTop: 4 }}>
        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: 520, lineHeight: 1.5 }}>
          Times follow the selected timezone. Almanac quality matches classical five-limb structure; exact edge times may differ slightly from other software due to ayanāṃśa and rise/set models.
        </p>
        <Link
          href="/panchang/calendar"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '0.85rem',
            fontWeight: 600,
            color: 'var(--text-gold)',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          Monthly calendar →
        </Link>
      </footer>
    </div>
  )
}
