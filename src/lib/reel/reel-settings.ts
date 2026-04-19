export type ExportFormat = 'png' | 'jpeg'
export type HashtagPreset = 'balanced' | 'growth' | 'devotional'

/**
 * Export size + source rectangle on the 1080×1920 master canvas.
 * Square / 4:5 always use the **full frame** as the source; the renderer scales it
 * to fit inside the output (letterboxed, centered) so **nothing is cropped** — dense
 * slides stay fully visible, just smaller with empty bars on the sides or top/bottom.
 */
export type ExportAspectPreset = 'reel_9_16' | 'square_1_1' | 'feed_4_5'

export const EXPORT_ASPECT_META: Record<
  ExportAspectPreset,
  { label: string; short: string; aspectCss: string }
> = {
  reel_9_16: { label: 'Reels / Stories (9:16 · 1080×1920)', short: '9x16', aspectCss: '9/16' },
  square_1_1: { label: 'Square (1:1 · 1080×1080, fit full slide)', short: '1x1', aspectCss: '1/1' },
  feed_4_5: { label: 'Portrait feed (4:5 · 1080×1350, fit full slide)', short: '4x5', aspectCss: '4/5' },
}

/** Source rect + output size. Non-9:16 presets use the full canvas; the export step letterboxes to outW×outH. */
export function getExportCropRect(
  preset: ExportAspectPreset,
  fullW = 1080,
  fullH = 1920,
): { sx: number; sy: number; sw: number; sh: number; outW: number; outH: number } {
  if (preset === 'reel_9_16') {
    return { sx: 0, sy: 0, sw: fullW, sh: fullH, outW: fullW, outH: fullH }
  }
  if (preset === 'square_1_1') {
    const side = Math.min(fullW, fullH)
    return { sx: 0, sy: 0, sw: fullW, sh: fullH, outW: side, outH: side }
  }
  const outH = Math.min(fullH, Math.round((fullW * 5) / 4))
  return { sx: 0, sy: 0, sw: fullW, sh: fullH, outW: fullW, outH }
}

export interface ReelSettings {
  brandTitle: string
  instagramHandle: string
  ctaLine: string
  hashtagPreset: HashtagPreset
  showSafeGuides: boolean
  exportFormat: ExportFormat
  /** Export aspect: 9:16 native, or square / 4:5 with full frame scaled to fit (letterboxed, no crop). */
  exportAspect: ExportAspectPreset
  jpegQuality: number
}

export const HASHTAG_PRESETS: Record<HashtagPreset, string[]> = {
  balanced: ['#panchang', '#jyotish', '#vedicastrology', '#nakshatra', '#muhurta', '#dailyastrology', '#vedaansh'],
  growth: ['#reelsindia', '#viralreels', '#astroreels', '#hinduspirituality', '#vedicwisdom', '#explorepage', '#contentcreator'],
  devotional: ['#sanatandharma', '#templevibes', '#mantra', '#bhakti', '#dharma', '#vaidik', '#spiritualindia'],
}
