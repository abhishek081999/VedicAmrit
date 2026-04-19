'use client'

import { Player } from '@remotion/player'
import { useMemo, useState } from 'react'
import { VedaReel } from '../../../remotion/VedaReel'
import { getReelDurationFrames, REEL_PREVIEW_FPS } from '@/lib/reel/reel-remotion-metadata'
import type { ReelPropsResolved } from '@/lib/reel/reel-remotion-presets'
import playerStyles from './reel-player.module.css'

type Props = {
  resolved: ReelPropsResolved
}

export default function ReelRemotionPlayerInner({ resolved }: Props) {
  const durationInFrames = useMemo(() => getReelDurationFrames(resolved), [resolved])
  const [loop, setLoop] = useState(true)
  const [playbackRate, setPlaybackRate] = useState(1)

  const playerKey = useMemo(
    () =>
      `${resolved.preset}-${resolved.images.length}-${resolved.images.map((u) => u.slice(-24)).join('-')}-${durationInFrames}`,
    [resolved.preset, resolved.images, durationInFrames],
  )

  return (
    <div className={playerStyles.shell}>
      <div className={playerStyles.controlsRow}>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
          <input type="checkbox" checked={loop} onChange={(e) => setLoop(e.target.checked)} />
          Loop
        </label>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          Speed
          <select
            value={playbackRate}
            onChange={(e) => setPlaybackRate(Number(e.target.value))}
            style={{
              padding: '4px 8px',
              borderRadius: 6,
              border: '0.5px solid var(--border)',
              background: 'var(--surface-1)',
              color: 'var(--text-primary)',
              fontSize: 12,
              minWidth: 0,
              maxWidth: '100%',
            }}
          >
            <option value={0.5}>0.5×</option>
            <option value={0.75}>0.75×</option>
            <option value={1}>1×</option>
            <option value={1.25}>1.25×</option>
            <option value={1.5}>1.5×</option>
            <option value={2}>2×</option>
          </select>
        </label>
        <span className={playerStyles.meta}>
          {durationInFrames} frames · {(durationInFrames / REEL_PREVIEW_FPS).toFixed(2)}s · Space to play/pause
        </span>
      </div>
      <div className={playerStyles.playerFrame}>
        <Player
          key={playerKey}
          component={VedaReel}
          inputProps={resolved}
          durationInFrames={durationInFrames}
          fps={REEL_PREVIEW_FPS}
          compositionWidth={1080}
          compositionHeight={1920}
          controls
          loop={loop}
          playbackRate={playbackRate}
          showVolumeControls={false}
          spaceKeyToPlayOrPause
          doubleClickToFullscreen
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  )
}
