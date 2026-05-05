'use client'
// src/components/dashboard/PersonalDayCard.tsx — Compact inline layout

import React, { useState, useEffect } from 'react'
import { TARA_NAMES, TARA_QUALITIES } from '@/lib/engine/nakshatraAdvanced'
import { NAKSHATRA_NAMES, PanchangData } from '@/types/astrology'

interface PersonalDayCardProps {
  birthMoonNakIdx: number
  birthMoonName:   string
  latitude:        number
  longitude:       number
  timezone:        string
  todayPanchang?:  PanchangData | null
  birthDate:       string
}

export function PersonalDayCard({
  birthMoonNakIdx,
  birthMoonName,
  latitude,
  longitude,
  timezone,
  todayPanchang,
  birthDate
}: PersonalDayCardProps) {
  const [todayNak, setTodayNak] = useState<{ index: number; name: string } | null>(null)
  const [loading, setLoading] = useState(!todayPanchang)

  useEffect(() => {
    if (todayPanchang) {
      setTodayNak({ index: todayPanchang.nakshatra.index, name: todayPanchang.nakshatra.name })
      setLoading(false)
      return
    }
    async function fetchToday() {
      const todayString = new Date().toISOString().split('T')[0]
      const cacheKey = `panchang_${todayString}_${latitude}_${longitude}`
      try {
        const cached = sessionStorage.getItem(cacheKey)
        if (cached) {
          const json = JSON.parse(cached)
          setTodayNak({ index: json.nakshatra.index, name: json.nakshatra.name })
          setLoading(false)
          return
        }
      } catch {}
      try {
        const res = await fetch(`/api/panchang?date=${todayString}&lat=${latitude}&lng=${longitude}&tz=${encodeURIComponent(timezone)}`)
        const json = await res.json()
        if (json.success) {
          setTodayNak({ index: json.data.nakshatra.index, name: json.data.nakshatra.name })
          try { sessionStorage.setItem(cacheKey, JSON.stringify(json.data)) } catch {}
        }
      } catch (err) {
        console.error('Failed to fetch daily insights:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchToday()
  }, [latitude, longitude, timezone, todayPanchang])

  if (loading) {
    return (
      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.4rem 0' }}>
        Loading cosmic data…
      </div>
    )
  }

  if (!todayNak) return null

  const diff     = (todayNak.index - birthMoonNakIdx + 27) % 27
  const taraIdx  = diff % 9
  const taraName = TARA_NAMES[taraIdx]
  const q        = TARA_QUALITIES[taraName]

  const isAuspicious = q.quality === 'auspicious'
  const isDanger     = q.quality === 'inauspicious'
  const accentColor  = isAuspicious ? 'var(--teal)' : isDanger ? 'var(--rose)' : 'var(--gold)'
  const qualityLabel = isAuspicious ? 'Auspicious' : isDanger ? 'Caution' : 'Neutral'

  // BCP Calculation
  const birthDateObj = new Date(birthDate)
  const now = new Date()
  let age = now.getFullYear() - birthDateObj.getFullYear()
  const mDiff = now.getMonth() - birthDateObj.getMonth()
  if (mDiff < 0 || (mDiff === 0 && now.getDate() < birthDateObj.getDate())) {
    age--
  }
  const bcpYear = age + 1
  const bcpHouse = ((bcpYear - 1) % 12) + 1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.72rem' }}>

      {/* ── Status row ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{
          fontSize: '0.6rem', fontWeight: 700, padding: '1px 7px',
          borderRadius: 3, border: `1px solid ${accentColor}`,
          color: accentColor, letterSpacing: '0.05em', textTransform: 'uppercase'
        }}>
          {qualityLabel}
        </span>
        <span style={{
          fontSize: '0.6rem', fontWeight: 700, padding: '1px 7px',
          borderRadius: 3, border: '1px solid var(--border-soft)',
          background: 'var(--gold-faint)', color: 'var(--text-gold)',
          letterSpacing: '0.05em', textTransform: 'uppercase'
        }} title={`Bhrigu Chakra Paddhati - Year ${bcpYear}`}>
          BCP: H{bcpHouse}
        </span>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
          Tarabala: <strong style={{ color: accentColor }}>{taraName} #{taraIdx + 1}</strong>
        </span>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
          ☽ <strong style={{ color: 'var(--text-primary)' }}>{todayNak.name}</strong>
        </span>
      </div>

      {/* ── Guidance ── */}
      <div style={{
        borderLeft: `2px solid ${accentColor}`,
        paddingLeft: '0.45rem',
        fontSize: '0.68rem',
        color: 'var(--text-secondary)',
        lineHeight: 1.4,
      }}>
        {q.recommendation}
      </div>

      {/* ── Birth moon note ── */}
      <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', opacity: 0.75 }}>
        Birth Moon: {birthMoonName}
      </div>
    </div>
  )
}
