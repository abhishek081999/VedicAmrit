'use client';

import React from 'react';
import { 
  Sun, 
  Moon, 
  Shield, 
  Zap, 
  Compass, 
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface MuhurtaDiagnosticsProps {
  diagnostics: {
    choghadiya?: { type: string; quality: string };
    panchaka?: { label: string; isAuspicious: boolean; remainder: number };
    taraBala?: { name: string; score: number };
    chandraBala?: { house: number; isFavorable: boolean };
  };
}

export function MuhurtaDiagnostics({ diagnostics }: MuhurtaDiagnosticsProps) {
  if (!diagnostics) return null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginTop: '0.5rem' }}>
      
      {/* 1. Choghadiya */}
      {diagnostics.choghadiya && (
        <DiagCard 
          icon={<Sun className="w-4 h-4" />}
          label="Choghadiya"
          value={diagnostics.choghadiya.type}
          status={diagnostics.choghadiya.quality === 'Good' ? 'success' : diagnostics.choghadiya.quality === 'Bad' ? 'error' : 'warning'}
          desc={`${diagnostics.choghadiya.quality} Timing`}
        />
      )}

      {/* 2. Panchaka */}
      {diagnostics.panchaka && (
        <DiagCard 
          icon={<Shield className="w-4 h-4" />}
          label="Panchaka Status"
          value={diagnostics.panchaka.isAuspicious ? 'Shubh' : diagnostics.panchaka.label.split(' ')[0]}
          status={diagnostics.panchaka.isAuspicious ? 'success' : 'error'}
          desc={diagnostics.panchaka.isAuspicious ? 'Auspicious' : 'Avoided'}
        />
      )}

      {/* 3. Tara Bala */}
      {diagnostics.taraBala && (
        <DiagCard 
          icon={<Zap className="w-4 h-4" />}
          label="Tara Bala"
          value={diagnostics.taraBala.name}
          status={diagnostics.taraBala.score >= 50 ? 'success' : 'error'}
          desc={`${diagnostics.taraBala.score > 0 ? '+' : ''}${diagnostics.taraBala.score} Resonance`}
        />
      )}

      {/* 4. Chandra Bala */}
      {diagnostics.chandraBala && (
        <DiagCard 
          icon={<Moon className="w-4 h-4" />}
          label="Chandra Bala"
          value={`${diagnostics.chandraBala.house}th House`}
          status={diagnostics.chandraBala.isFavorable ? 'success' : 'error'}
          desc={diagnostics.chandraBala.isFavorable ? 'High Support' : 'Check Remedies'}
        />
      )}

    </div>
  );
}

interface DiagCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  status: 'success' | 'warning' | 'error' | 'neutral';
  desc: string;
}

function DiagCard({ icon, label, value, status, desc }: DiagCardProps) {
  const colors = {
    success: { text: 'var(--teal)', bg: 'rgba(78,205,196,0.1)', border: 'rgba(78,205,196,0.2)', icon: <CheckCircle2 className="w-3 h-3" /> },
    warning: { text: 'var(--amber)', bg: 'rgba(245,158,66,0.1)', border: 'rgba(245,158,66,0.2)', icon: <AlertCircle className="w-3 h-3" /> },
    error: { text: 'var(--rose)', bg: 'rgba(224,123,142,0.1)', border: 'rgba(224,123,142,0.2)', icon: <XCircle className="w-3 h-3" /> },
    neutral: { text: 'var(--text-secondary)', bg: 'var(--surface-3)', border: 'var(--border-soft)', icon: <ChevronRight className="w-3 h-3" /> }
  };

  const c = colors[status];

  return (
    <div style={{ 
      background: 'var(--surface-2)', 
      border: '1px solid var(--border-soft)', 
      borderRadius: 'var(--r-md)', 
      padding: '0.8rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ color: 'var(--gold)', opacity: 0.8 }}>{icon}</div>
        <div style={{ color: c.text }}>{c.icon}</div>
      </div>
      <div>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
          {label}
        </div>
        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
          {value}
        </div>
      </div>
      <div style={{ 
        fontSize: '0.65rem', 
        padding: '2px 6px', 
        background: c.bg, 
        border: `1px solid ${c.border}`, 
        borderRadius: '4px', 
        color: c.text,
        alignSelf: 'flex-start',
        fontWeight: 600
      }}>
        {desc}
      </div>
    </div>
  );
}
