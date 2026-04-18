export type ExportFormat = 'png' | 'jpeg'
export type HashtagPreset = 'balanced' | 'growth' | 'devotional'

/** Crop from the 1080×1920 reel canvas for other social formats (center crop). */
export type ExportAspectPreset = 'reel_9_16' | 'square_1_1' | 'feed_4_5'

export const EXPORT_ASPECT_META: Record<
  ExportAspectPreset,
  { label: string; short: string; aspectCss: string }
> = {
  reel_9_16: { label: 'Reels / Stories (9:16 · 1080×1920)', short: '9x16', aspectCss: '9/16' },
  square_1_1: { label: 'Square (1:1 · 1080×1080, center)', short: '1x1', aspectCss: '1/1' },
  feed_4_5: { label: 'Portrait feed (4:5 · 1080×1350, center)', short: '4x5', aspectCss: '4/5' },
}

/** Source rect on full reel canvas + output pixel size (same as crop for sharp export). */
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
    const sx = (fullW - side) / 2
    const sy = (fullH - side) / 2
    return { sx, sy, sw: side, sh: side, outW: side, outH: side }
  }
  // 4:5 — full width, vertical crop from middle
  const sh = Math.min(fullH, Math.round((fullW * 5) / 4))
  const sy = Math.max(0, (fullH - sh) / 2)
  return { sx: 0, sy, sw: fullW, sh, outW: fullW, outH: sh }
}

export interface ReelSettings {
  brandTitle: string
  instagramHandle: string
  ctaLine: string
  hashtagPreset: HashtagPreset
  showSafeGuides: boolean
  exportFormat: ExportFormat
  /** How the 1080×1920 reel is cropped when exporting (preview matches this). */
  exportAspect: ExportAspectPreset
  jpegQuality: number
}

export const HASHTAG_PRESETS: Record<HashtagPreset, string[]> = {
  balanced: ['#panchang', '#jyotish', '#vedicastrology', '#nakshatra', '#muhurta', '#dailyastrology', '#vedaansh'],
  growth: ['#reelsindia', '#viralreels', '#astroreels', '#hinduspirituality', '#vedicwisdom', '#explorepage', '#contentcreator'],
  devotional: ['#sanatandharma', '#templevibes', '#mantra', '#bhakti', '#dharma', '#vaidik', '#spiritualindia'],
}
