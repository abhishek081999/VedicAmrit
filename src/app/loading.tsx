import React from 'react'

export default function Loading() {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-page, #09090f)',
      zIndex: 9999,
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        {/* Spinning mandala ring */}
        <div style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          border: '2px solid var(--border, rgba(201,168,76,0.14))',
          borderTopColor: 'var(--gold, #c9a84c)',
          animation: 'spin 0.9s linear infinite',
        }} />
        <p style={{
          fontSize: '0.75rem',
          letterSpacing: '0.18em',
          color: 'var(--text-muted, #7a7498)',
          textTransform: 'uppercase',
          margin: 0,
        }}>
          Vedaansh
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
