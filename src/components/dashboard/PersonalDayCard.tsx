'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/dashboard/PersonalDayCard.tsx
//  Premium 'Cosmic Weather' widget for the Dashboard
//  Matches birth moon with current transiting moon
// ─────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react'
import { TARA_NAMES, TARA_QUALITIES } from '@/lib/engine/nakshatraAdvanced'
import { NAKSHATRA_NAMES } from '@/types/astrology'

interface PersonalDayCardProps {
  birthMoonNakIdx: number
  birthMoonName:   string
  latitude:        number
  longitude:       number
  timezone:        string
}

export function PersonalDayCard({ birthMoonNakIdx, birthMoonName, latitude, longitude, timezone }: PersonalDayCardProps) {
  const [todayNak, setTodayNak] = useState<{ index: number; name: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchToday() {
      const todayString = new Date().toISOString().split('T')[0]
      const cacheKey = `panchang_${todayString}_${latitude}_${longitude}`
      
      // Try session storage first
      try {
        const cached = sessionStorage.getItem(cacheKey)
        if (cached) {
          const json = JSON.parse(cached)
          setTodayNak({
            index: json.nakshatra.index,
            name:  json.nakshatra.name
          })
          setLoading(false)
          return
        }
      } catch (err) {
        // Ignore storage errors
      }

      try {
        const res = await fetch(`/api/panchang?date=${todayString}&lat=${latitude}&lng=${longitude}&tz=${encodeURIComponent(timezone)}`)
        const json = await res.json()
        if (json.success) {
          setTodayNak({
            index: json.data.nakshatra.index,
            name:  json.data.nakshatra.name
          })
          try {
            sessionStorage.setItem(cacheKey, JSON.stringify(json.data))
          } catch (e) {}
        }
      } catch (err) {
        console.error('Failed to fetch daily insights:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchToday()
  }, [latitude, longitude, timezone])

  if (loading) {
    return (
      <div className="card fade-up" style={{ padding: '1.5rem', minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>
          Tuning into today&apos;s cosmic frequency...
        </div>
      </div>
    )
  }

  if (!todayNak) return null

  // Calculate Tara Bala
  // (Today's Nak - Birth Nak + 1) % 9
  const diff = (todayNak.index - birthMoonNakIdx + 27) % 27
  const taraIdx = diff % 9
  const taraName = TARA_NAMES[taraIdx]
  const q = TARA_QUALITIES[taraName]

  const isAuspicious = q.quality === 'auspicious'
  const isDanger = q.quality === 'inauspicious'

  return (
    <div className="card fade-up" style={{ 
      padding: '0', 
      overflow: 'hidden',
      border: `1px solid ${isAuspicious ? 'rgba(78,205,196,0.2)' : isDanger ? 'rgba(224,123,142,0.2)' : 'var(--border-soft)'}`,
      background: `linear-gradient(135deg, var(--surface-2) 0%, ${isAuspicious ? 'rgba(78,205,196,0.03)' : isDanger ? 'rgba(224,123,142,0.03)' : 'var(--surface-1)'} 100%)`
    }}>
      <div style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div>
            <div className="label-caps" style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>Your Cosmic Weather</div>
            <h3 style={{ margin: '0.2rem 0 0', fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 600 }}>
              {isAuspicious ? 'Auspicious' : isDanger ? 'Caution Advised' : 'Neutral Day'}
            </h3>
          </div>
          <div style={{ 
            width: 42, height: 42, borderRadius: '50%', 
            background: isAuspicious ? 'var(--teal)' : isDanger ? 'var(--rose)' : 'var(--gold)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.2rem', boxShadow: `0 0 15px ${isAuspicious ? 'var(--teal)' : isDanger ? 'var(--rose)' : 'var(--gold)'}44`
          }}>
            {isAuspicious ? '✨' : isDanger ? '⚠️' : '⚖️'}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.25rem' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tarabala</div>
            <div style={{ 
              fontSize: '1rem', fontWeight: 600, color: isAuspicious ? 'var(--teal)' : isDanger ? 'var(--rose)' : 'var(--text-gold)',
              marginTop: 2
            }}>
              {taraName} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)' }}>(#{taraIdx + 1})</span>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Moon Transit</div>
            <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>
              {todayNak.name}
            </div>
          </div>
        </div>

        <div style={{ 
          background: 'var(--surface-3)', 
          padding: '0.85rem', 
          borderRadius: 'var(--r-sm)',
          fontSize: '0.85rem',
          lineHeight: 1.5,
          color: 'var(--text-secondary)',
          borderLeft: `3px solid ${isAuspicious ? 'var(--teal)' : isDanger ? 'var(--rose)' : 'var(--gold)'}`
        }}>
          <strong>Guidance:</strong> {q.recommendation}
        </div>
      </div>
      
      <div style={{ 
        padding: '0.75rem 1.25rem', 
        background: 'rgba(0,0,0,0.05)', 
        borderTop: '1px solid var(--border-soft)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          Based on birth Moon: <strong>{birthMoonName}</strong>
        </span>
        <span style={{ 
          fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', 
          color: 'var(--text-gold)', letterSpacing: '0.05em' 
        }}>
          Velā Insights →
        </span>
      </div>
    </div>
  )
}
