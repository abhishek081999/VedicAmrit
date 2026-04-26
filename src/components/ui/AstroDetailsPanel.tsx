'use client'

import React, { useMemo } from 'react'
import type { ChartOutput, GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES, RASHI_SANSKRIT } from '@/types/astrology'
import { getNakshatraCharacteristics } from '@/lib/engine/nakshatraAdvanced'
import { getVarnaName, getVashyaName, getGanaName, getNadiName } from '@/lib/engine/ashtakoot'
import {
  approxIndianEras,
  formatSiderealLongitude,
  getBhriguBinduLon,
  getInduLagnaRashi,
  getNakshatraPaya,
  getPadaNamingSyllable,
  getRashiTatva,
} from '@/lib/engine/astroDetailsDerived'

/* ── Compact key-value row ─────────────────────────────────── */
function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      gap: '0.5rem', padding: '0.18rem 0',
      borderBottom: '1px solid var(--border-soft)',
    }}>
      <span style={{ color: 'var(--text-muted)', fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', flexShrink: 0, whiteSpace: 'nowrap' }}>
        {label}
      </span>
      <span style={{ color: 'var(--text-primary)', textAlign: 'right', fontFamily: 'var(--font-display)', fontSize: '0.72rem', fontWeight: 500 }}>
        {value}
      </span>
    </div>
  )
}

/* ── Section divider ───────────────────────────────────────── */
function Sec({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: '0.5rem' }}>
      <div style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '0.2rem' }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function fmtDeg(rashi: Rashi, degInSign: number) {
  return `${RASHI_NAMES[rashi]} ${degInSign.toFixed(2)}°`
}
function fmtTime(d: Date | string) {
  return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

export function AstroDetailsPanel({ chart }: { chart: ChartOutput }) {
  const moon = chart.grahas.find(g => g.id === 'Mo')
  const sun  = chart.grahas.find(g => g.id === 'Su')
  const rahu = chart.grahas.find(g => g.id === 'Ra')

  const moonChars = useMemo(() => {
    if (!moon) return null
    return getNakshatraCharacteristics(moon.nakshatraIndex, moon.pada)
  }, [moon])

  const induRashi  = moon ? getInduLagnaRashi(moon.rashi) : null
  const bhriguLon  = moon && rahu ? getBhriguBinduLon(moon.totalDegree, rahu.totalDegree) : null
  const bhriguFmt  = bhriguLon != null ? formatSiderealLongitude(bhriguLon) : null

  const beeja   = chart.upagrahas?.['Beeja Sphuta']
  const kshetra = chart.upagrahas?.['Kshetra Sphuta']

  const dayNight = useMemo(() => {
    try {
      const birth = new Date(`${chart.meta.birthDate}T${chart.meta.birthTime || '12:00'}`)
      const sr = new Date(chart.panchang.sunrise)
      const ss = new Date(chart.panchang.sunset)
      if (Number.isNaN(birth.getTime())) return '—'
      return birth >= sr && birth <= ss ? 'Day' : 'Night'
    } catch { return '—' }
  }, [chart.meta.birthDate, chart.meta.birthTime, chart.panchang.sunrise, chart.panchang.sunset])

  const eras = approxIndianEras(chart.meta.birthDate)

  const ascLord = useMemo(() => {
    const L: Record<Rashi, GrahaId> = {
      1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
      7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
    }
    return L[chart.lagnas.ascRashi]
  }, [chart.lagnas.ascRashi])

  const moonNak1 = (moon?.nakshatraIndex ?? 0) + 1
  const fmtLon = (lon: number | undefined | null): string => {
    if (lon == null || !Number.isFinite(lon)) return '—'
    const f = formatSiderealLongitude(lon)
    return fmtDeg(f.rashi, f.degInSign)
  }

  if (!moon || !moonChars) {
    return <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.72rem' }}>Moon data required.</p>
  }

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', fontSize: '0.72rem', paddingBottom: '0.5rem' }}>

      {/* ── Birth + Panchang merged ── */}
      <Sec title="Birth data &amp; Pañcāṅga">
        <Row label="Name"    value={chart.meta.name || '—'} />
        <Row label="Date"    value={chart.meta.birthDate} />
        <Row label="Time"    value={chart.meta.birthTime || '—'} />
        <Row label="Vāra"    value={`${chart.panchang.vara.name} · ${GRAHA_NAMES[chart.panchang.vara.lord]}`} />
        <Row label="Tithi"   value={`${chart.panchang.tithi.name} (${chart.panchang.tithi.number}/30) · ${chart.panchang.tithi.paksha === 'shukla' ? 'Śukla' : 'Kṛṣṇa'}`} />
        <Row label="Nakṣatra" value={`${moon.nakshatraName} · Pada ${moon.pada}`} />
        <Row label="Yoga"    value={chart.panchang.yoga.name} />
        <Row label="Karaṇa"  value={chart.panchang.karana.name} />
        <Row label="Sunrise / Sunset" value={`${fmtTime(chart.panchang.sunrise)} / ${fmtTime(chart.panchang.sunset)} (${dayNight})`} />
        <Row label="Place"   value={chart.meta.birthPlace || '—'} />
        <Row label="Coords"  value={`${chart.meta.latitude.toFixed(3)}°, ${chart.meta.longitude.toFixed(3)}°`} />
        <Row label="Ayanāṃśa" value={`${chart.meta.settings.ayanamsha} ${chart.meta.ayanamshaValue.toFixed(3)}°`} />
      </Sec>

      {/* ── Lagna & signs ── */}
      <Sec title="Lagna &amp; Signs">
        <Row label="Ascendant"      value={`${RASHI_NAMES[chart.lagnas.ascRashi]} · ${fmtDeg(chart.lagnas.ascRashi, chart.lagnas.ascDegreeInRashi)}`} />
        <Row label="Asc lord"       value={GRAHA_NAMES[ascLord]} />
        <Row label="Moon sign"      value={`${RASHI_NAMES[moon.rashi]} · ${RASHI_SANSKRIT[moon.rashi]}`} />
        <Row label="Moon tatva"     value={getRashiTatva(moon.rashi)} />
        {sun && <Row label="Sun sign" value={`${RASHI_NAMES[sun.rashi]} · ${fmtDeg(sun.rashi, sun.degree)}`} />}
      </Sec>

      {/* ── Nakshatra details ── */}
      <Sec title="Nakṣatra (Moon)">
        <Row label="Lord"    value={GRAHA_NAMES[moonChars.lord]} />
        <Row label="Deity"   value={moonChars.deity} />
        <Row label="Symbol"  value={moonChars.symbol} />
        <Row label="Gaṇa"    value={`${moonChars.gana} · koota: ${getGanaName(moonNak1)}`} />
        <Row label="Yoni"    value={moonChars.yoni} />
        <Row label="Nāḍī"    value={`${moonChars.nadi} · koota: ${getNadiName(moonNak1)}`} />
        <Row label="Varṇa"   value={`${moonChars.varna} · rāśi: ${getVarnaName(moon.rashi)}`} />
        <Row label="Vaśya"   value={getVashyaName(moon.rashi)} />
        <Row label="Śakti"   value={moonChars.shakti} />
        <Row label="Nature"  value={moonChars.nature} />
        <Row label="Paya"    value={getNakshatraPaya(moon.pada)} />
        <Row label="Nāma syllable" value={getPadaNamingSyllable(moon.nakshatraIndex, moon.pada)} />
      </Sec>

      {/* ── Special lagnas ── */}
      <Sec title="Special Lagnas &amp; Points">
        <Row label="Āruḍha (AL)"  value={chart.arudhas.AL ? RASHI_NAMES[chart.arudhas.AL] : '—'} />
        <Row label="Indu Lagna"   value={induRashi ? `${RASHI_NAMES[induRashi]} · ${RASHI_SANSKRIT[induRashi]}` : '—'} />
        {bhriguFmt && bhriguLon != null && (
          <Row label="Bhrigu Bindu" value={`${fmtDeg(bhriguFmt.rashi, bhriguFmt.degInSign)}`} />
        )}
        {chart.yogiPoint && (
          <>
            <Row label="Yogi"      value={GRAHA_NAMES[chart.yogiPoint.yogiGraha]} />
            <Row label="Sahayogi"  value={GRAHA_NAMES[chart.yogiPoint.sahayogiGraha]} />
            <Row label="Avayogi"   value={GRAHA_NAMES[chart.yogiPoint.avayogiGraha]} />
          </>
        )}
        <Row label="Hora Lagna"   value={fmtLon(chart.lagnas.horaLagna)} />
        <Row label="Ghati Lagna"  value={fmtLon(chart.lagnas.ghatiLagna)} />
        <Row label="Bhava Lagna"  value={fmtLon(chart.lagnas.bhavaLagna)} />
        <Row label="Praṇapada"    value={fmtLon(chart.lagnas.pranapada)} />
        <Row label="Śrī Lagna"    value={fmtLon(chart.lagnas.sriLagna)} />
        <Row label="Varṇada"      value={fmtLon(chart.lagnas.varnadaLagna)} />
        {beeja   && <Row label="Bīja Sphuta"   value={`${beeja.rashiName} ${beeja.degree.toFixed(2)}°`} />}
        {kshetra && <Row label="Kṣetra Sphuta" value={`${kshetra.rashiName} ${kshetra.degree.toFixed(2)}°`} />}
      </Sec>

      {/* ── Nodes & eras ── */}
      <Sec title="Nodes &amp; Hindu Eras">
        {rahu && <Row label="Rāhu" value={`${RASHI_NAMES[rahu.rashi]} · ${fmtDeg(rahu.rashi, rahu.degree)}`} />}
        {chart.grahas.find(g => g.id === 'Ke') && (() => {
          const k = chart.grahas.find(g => g.id === 'Ke')!
          return <Row label="Ketu" value={`${RASHI_NAMES[k.rashi]} · ${fmtDeg(k.rashi, k.degree)}`} />
        })()}
        <Row label="Śaka Samvat"   value={`~ ${eras.shaka}`} />
        <Row label="Vikram Samvat" value={`~ ${eras.vikram}`} />
      </Sec>

    </div>
  )
}
