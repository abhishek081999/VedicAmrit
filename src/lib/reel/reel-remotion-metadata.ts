import type { ReelPropsResolved } from './reel-remotion-presets'

export const REEL_PREVIEW_FPS = 30

export function getReelDurationFrames(resolved: ReelPropsResolved, fps = REEL_PREVIEW_FPS): number {
  const totalSeconds = resolved.images.reduce((sum, _, index) => {
    return sum + (resolved.imageDurations?.[index] ?? resolved.secondsPerImage)
  }, 0)
  return Math.max(1, Math.ceil(totalSeconds * fps))
}
