/**
 * Hand off {@link File} blobs from the Reel Generator (same tab) to the Video Builder page.
 * Not persisted across tabs or reloads.
 */
export type ReelVideoHandoff = {
  slides: File[]
  /** Optional `veda-icon.png` for overlays / Remotion `public` reference */
  brandIcon?: File
}

declare global {
  interface Window {
    __JYOTISH_REEL_VIDEO_HANDOFF__?: ReelVideoHandoff
  }
}

export function stashReelVideoHandoff(payload: ReelVideoHandoff): void {
  if (typeof window === 'undefined') return
  window.__JYOTISH_REEL_VIDEO_HANDOFF__ = payload
}

/** Slides only; use {@link stashReelVideoHandoff} to include the Veda icon. */
export function stashReelVideoFiles(slides: File[]): void {
  stashReelVideoHandoff({ slides })
}

export function takeReelVideoHandoff(): ReelVideoHandoff {
  if (typeof window === 'undefined') return { slides: [] }
  const h = window.__JYOTISH_REEL_VIDEO_HANDOFF__
  delete window.__JYOTISH_REEL_VIDEO_HANDOFF__
  return h ?? { slides: [] }
}

/** Clear pending handoff (e.g. before starting a fresh reel in the generator). */
export function clearReelVideoHandoff(): void {
  if (typeof window === 'undefined') return
  delete window.__JYOTISH_REEL_VIDEO_HANDOFF__
}
