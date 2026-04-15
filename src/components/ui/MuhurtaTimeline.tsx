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
import { MuhurtaDiagnostics } from './MuhurtaDiagnostics';

interface TimelineDataPoint {
  time: string;
  scores: Record<string, any>;
}

interface MuhurtaTimelineProps {
  data: TimelineDataPoint[];
  loading?: boolean;
}

const activities = [
  { id: 'BUSINESS', label: 'Business', icon: Briefcase },
  { id: 'TRAVEL', label: 'Travel', icon: Plane },
  { id: 'MARRIAGE', label: 'Marriage', icon: Heart },
  { id: 'REAL_ESTATE', label: 'Property', icon: Home },
  { id: 'HEALTH', label: 'Wellness', icon: Stethoscope },
  { id: 'EDUCATION', label: 'Knowledge', icon: Sprout },
  { id: 'GENERAL', label: 'General', icon: Zap },
];

export function MuhurtaTimeline(props: MuhurtaTimelineProps) {
  const data = props.data || [];
  const loading = props.loading || false;
  const [selectedActivity, setSelectedActivity] = useState('BUSINESS');

  const activeData = useMemo(() => {
    return data.map(point => ({
      time: point.time,
      info: point.scores[selectedActivity] || { score: 50, label: 'Neutral', factors: [] }
    }));
  }, [data, selectedActivity]);

  const bestWindow = useMemo(() => {
    if (!activeData.length) return null;
    let max = activeData[0];
    for (const d of activeData) {
      if (d.info.score > max.info.score) max = d;
    }
    return max;
  }, [activeData]);

  const bestTimeStr = useMemo(() => {
    if (!bestWindow) return '';
    const date = new Date(bestWindow.time);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, [bestWindow]);

  const activityLabel = useMemo(() => {
    const act = activities.find(a => a.id === selectedActivity);
    return act ? act.label : 'Activity';
  }, [selectedActivity]);

  return (
    <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '1.5rem', boxShadow: 'var(--shadow-card)', position: 'relative' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 32, height: 32, borderRadius: 'var(--r-sm)', background: 'var(--gold-faint)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)' }}>
            <Zap className="w-5 h-5" />
          </div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            Muhurta Intelligence
          </h2>
        </div>
        <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          Auspicious windows for the next 24 hours
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
        {activities.map(act => {
          const isActive = selectedActivity === act.id;
          const Icon = act.icon;
          return (
            <button key={act.id} onClick={() => setSelectedActivity(act.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem', borderRadius: 'var(--r-md)', border: '1px solid', borderColor: isActive ? 'var(--gold)' : 'var(--border)', background: isActive ? 'var(--gold-faint)' : 'var(--surface-2)', color: isActive ? 'var(--gold-light)' : 'var(--text-secondary)', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'var(--font-body)', fontSize: '0.85rem' }}>
              <Icon className="w-4 h-4" />
              {act.label}
            </button>
          );
        })}
      </div>

      <div style={{ position: 'relative', height: '160px', marginBottom: '1.5rem', background: 'var(--surface-0)', borderRadius: 'var(--r-md)', padding: '1.25rem' }}>
        {loading ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Syncing with planetary grid...</div>
        ) : (
          <div style={{ height: '100%', display: 'flex', alignItems: 'flex-end', gap: '4px' }}>
            {activeData.map((d, i) => (
              <motion.div key={i} initial={{ height: 0 }} animate={{ height: d.info.score + '%' }} style={{ flex: 1, minWidth: '4px', borderRadius: '2px 2px 0 0', background: d.info.score > 75 ? 'var(--teal)' : d.info.score > 50 ? 'var(--amber)' : 'var(--border-bright)', opacity: d.info.score < 35 ? 0.3 : 0.8, position: 'relative' }}>
                {i % 8 === 0 && (
                  <div style={{ position: 'absolute', bottom: '-20px', left: '50%', transform: 'translateX(-50%)', fontSize: '9px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{new Date(d.time).getHours()}:00</div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid var(--border-soft)', paddingTop: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--teal)' }} />
            <span style={{ fontSize: '0.7rem', color: 'var(--text-primary)' }}>High</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--amber)' }} />
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Good</span>
          </div>
        </div>
        {bestTimeStr && (
          <div style={{ padding: '0.75rem 1rem', background: 'var(--gold-faint)', border: '1px solid var(--border-soft)', borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <AlertTriangle className="w-4 h-4 text-[var(--gold)]" />
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-gold)', fontWeight: 600 }}>
                Peak resonance at {bestTimeStr}
              </p>
            </div>
            
            <MuhurtaDiagnostics diagnostics={bestWindow?.info.diagnostics} />
            
            {bestWindow?.info.factors.length > 0 && (
               <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', borderTop: '1px solid rgba(201,168,76,0.1)', paddingTop: '0.8rem', marginTop: '0.4rem' }}>
                  {bestWindow?.info.factors.filter((f: string) => !f.includes(':')).map((f: string, i: number) => (
                    <span key={i} style={{ fontSize: '0.65rem', padding: '2px 6px', background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '4px', color: 'var(--text-gold)' }}>
                      {f}
                    </span>
                  ))}
               </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
