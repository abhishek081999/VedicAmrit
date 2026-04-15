'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Briefcase, 
  Plane, 
  Home, 
  Heart, 
  Stethoscope, 
  Sprout, 
  Zap,
  AlertTriangle
} from 'lucide-react';
import { MuhurtaActivity, MuhurtaScore } from '@/lib/engine/muhurtaAnalysis';

interface TimelineDataPoint {
  time: string; // ISO string
  scores: Record<MuhurtaActivity, MuhurtaScore>;
}

interface MuhurtaTimelineProps {
  data: TimelineDataPoint[];
  loading?: boolean;
}

const activities = [
  { id: 'BUSINESS' as MuhurtaActivity, label: 'Business', icon: Briefcase },
  { id: 'TRAVEL' as MuhurtaActivity, label: 'Travel', icon: Plane },
  { id: 'REAL_ESTATE' as MuhurtaActivity, label: 'Property', icon: Home },
  { id: 'RELATIONSHIP' as MuhurtaActivity, label: 'Connection', icon: Heart },
  { id: 'HEALTH' as MuhurtaActivity, label: 'Wellness', icon: Stethoscope },
  { id: 'SPIRITUAL' as MuhurtaActivity, label: 'Spiritual', icon: Sprout },
];

export const MuhurtaTimeline: React.FC<MuhurtaTimelineProps> = ({ data, loading }) => {
  const [selectedActivity, setSelectedActivity] = useState<MuhurtaActivity>('BUSINESS');

  const activeData = useMemo(() => {
    return (data || []).map(point => ({
      ...point,
      info: point.scores[selectedActivity]
    }));
  }, [data, selectedActivity]);

  return (
    <div style={{
      background: 'var(--surface-1)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-lg)',
      padding: '1.5rem',
      boxShadow: 'var(--shadow-card)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Header Area */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ 
            width: 32, height: 32, borderRadius: 'var(--r-sm)', background: 'var(--gold-faint)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)' 
          }}>
            <Zap className="w-5 h-5" />
          </div>
          <h2 style={{ 
            margin: 0, fontSize: '1.5rem', fontFamily: 'var(--font-display)', color: 'var(--text-primary)' 
          }}>
            Advanced Muhurta Intelligence
          </h2>
        </div>
        <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          Personalized auspicious windows for the next 24 hours
        </p>
      </div>

      {/* Activity Selector */}
      <div style={{ 
        display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '1.5rem',
        scrollbarWidth: 'none'
      }}>
        {activities.map(act => {
          const isActive = selectedActivity === act.id;
          const Icon = act.icon;
          return (
            <button
              key={act.id}
              onClick={() => setSelectedActivity(act.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem',
                borderRadius: 'var(--r-md)', border: '1px solid',
                borderColor: isActive ? 'var(--gold)' : 'var(--border)',
                background: isActive ? 'var(--gold-faint)' : 'var(--surface-2)',
                color: isActive ? 'var(--gold-light)' : 'var(--text-secondary)',
                cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap',
                fontFamily: 'var(--font-body)', fontSize: '0.85rem', fontWeight: isActive ? 600 : 400
              }}
            >
              <Icon className="w-4 h-4" />
              {act.label}
            </button>
          );
        })}
      </div>

      {/* Timeline Chart Container */}
      <div style={{ position: 'relative', height: '180px', marginBottom: '1.5rem', background: 'var(--surface-0)', borderRadius: 'var(--r-md)', padding: '1.25rem' }}>
        {loading ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            <div className="animate-pulse flex items-center gap-2">
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gold)' }} />
              Syncing with planetary grid...
            </div>
          </div>
        ) : (
          <div style={{ height: '100%', display: 'flex', alignItems: 'flex-end', gap: '4px' }}>
            {activeData.map((d, i) => (
              <motion.div
                key={d.time}
                initial={{ height: 0 }}
                animate={{ height: `${d.info.score}%` }}
                style={{
                  flex: 1,
                  minWidth: '4px',
                  borderRadius: '2px 2px 0 0',
                  background: d.info.score > 75 ? 'var(--teal)' : d.info.score > 50 ? 'var(--amber)' : 'var(--border-bright)',
                  opacity: d.info.score < 35 ? 0.3 : 0.8,
                  position: 'relative'
                }}
              >
                {/* Simple marker for every 4 hours */}
                {i % 8 === 0 && (
                  <div style={{ 
                    position: 'absolute', bottom: '-20px', left: '50%', transform: 'translateX(-50%)',
                    fontSize: '9px', color: 'var(--text-muted)', whiteSpace: 'nowrap', fontWeight: 600
                  }}>
                    {new Date(d.time).toLocaleTimeString([], { hour: '2-digit', hour12: true }).replace(':00', '')}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Footer / Legend Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid var(--border-soft)', paddingTop: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 10, height: 10, borderRadius: '2px', background: 'var(--teal)' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>Excellent</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 10, height: 10, borderRadius: '2px', background: 'var(--amber)' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Favorable</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 10, height: 10, borderRadius: '2px', background: 'var(--border-bright)' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Neutral</span>
          </div>
        </div>

        {activeData.length > 0 && (
          <div style={{ 
            padding: '0.75rem 1rem', background: 'var(--gold-faint)', border: '1px solid var(--border-soft)', 
            borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', gap: '0.75rem' 
          }}>
            <AlertTriangle className="w-4 h-4 text-[var(--gold)] shrink-0" />
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-gold)', fontWeight: 500 }}>
              Peak resonance at <span style={{ color: 'var(--gold-light)', fontWeight: 700 }}>{new Date(activeData.reduce((prev, curr) => prev.info.score > curr.info.score ? prev : curr).time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span> — Ideal for initiating {activities.find(a => a.id === selectedActivity)?.label.toLowerCase()} plans.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
