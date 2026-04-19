'use client'

import dynamic from 'next/dynamic'
import type { ReelPropsResolved } from '@/lib/reel/reel-remotion-presets'

const ReelRemotionPlayerInner = dynamic(() => import('./ReelRemotionPlayerInner'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: '100%',
        boxSizing: 'border-box',
        padding: 24,
        textAlign: 'center',
        fontSize: 13,
        color: 'var(--text-tertiary)',
        borderRadius: 12,
        border: '0.5px dashed var(--border)',
        background: 'var(--surface-2)',
      }}
    >
      Loading Remotion preview…
    </div>
  ),
})

export type ReelRemotionEditorProps = {
  resolved: ReelPropsResolved | null
}

export function ReelRemotionEditor({ resolved }: ReelRemotionEditorProps) {
  if (!resolved || resolved.images.length === 0) {
    return (
      <div
        style={{
          width: '100%',
          boxSizing: 'border-box',
          padding: 28,
          textAlign: 'center',
          fontSize: 13,
          color: 'var(--text-tertiary)',
          borderRadius: 12,
          border: '0.5px dashed var(--border)',
          background: 'var(--surface-2)',
        }}
      >
        Add images to see a live Remotion preview (same composition as Studio / CLI render).
      </div>
    )
  }

  return <ReelRemotionPlayerInner resolved={resolved} />
}
