/**
 * Shared Remotion reel presets + merge helpers (used by remotion/ and admin UI).
 */

export const REEL_PRESET_IDS = ['vedaDefault', 'minimal', 'bold', 'chart', 'cinematic'] as const
export type ReelPresetId = (typeof REEL_PRESET_IDS)[number]

export type ReelEffectsResolved = {
  enableFade: boolean
  fadeFrames: number
  enableZoom: boolean
  zoomStart: number
  zoomEnd: number
}

export type TitleStyleResolved = {
  fontSize: number
  marginTop: number
  fontFamily: string
  color: string
  letterSpacing: number
  textTransform: 'none' | 'uppercase' | 'capitalize'
  fontWeight: number | string
  textShadow: string
}

export type SpringResolved = {
  damping: number
  stiffness: number
}

export type OverlayVariant = 'subtle' | 'standard' | 'dramatic'

/** Ken Burns zoom curve (Remotion easing). */
export type ZoomEasingId = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'cinematic'

/** Title animates once at the start of the reel (shared title strip). */
export type TitleEntranceId = 'none' | 'fade' | 'rise' | 'dramatic'

export type CinematicResolved = {
  zoomEasing: ZoomEasingId
  titleEntrance: TitleEntranceId
  titleEntranceFrames: number
  /** CSS filter multipliers on each slide image */
  brightness: number
  contrast: number
  saturate: number
  letterbox: boolean
  /** Height of top + bottom bar as % of frame height (each bar). */
  letterboxBarPercent: number
  /** 0 = off, 1 = strong vignette */
  vignette: number
  /** 0 = off, 1 = visible grain */
  grain: number
}

/** Fully resolved props after preset merge (what VedaReel renders). */
export type ReelPropsResolved = {
  images: string[]
  secondsPerImage: number
  imageDurations?: number[]
  title?: string
  objectFit: 'cover' | 'contain'
  preset: ReelPresetId
  effects: ReelEffectsResolved
  titleStyle: TitleStyleResolved
  spring: SpringResolved
  overlay: OverlayVariant
  cinematic: CinematicResolved
}

const BASE_TITLE: TitleStyleResolved = {
  fontSize: 56,
  marginTop: 110,
  fontFamily: 'Georgia, "Times New Roman", serif',
  color: 'white',
  letterSpacing: 1,
  textTransform: 'uppercase',
  fontWeight: 700,
  textShadow: '0 2px 24px rgba(0,0,0,0.5)',
}

const BASE_SPRING: SpringResolved = { damping: 12, stiffness: 100 }

export const DEFAULT_CINEMATIC: CinematicResolved = {
  zoomEasing: 'linear',
  titleEntrance: 'none',
  titleEntranceFrames: 22,
  brightness: 1,
  contrast: 1,
  saturate: 1,
  letterbox: false,
  letterboxBarPercent: 8,
  vignette: 0,
  grain: 0,
}

/**
 * Named looks: tweak zoom/fade/title/overlay; CLI + Studio + admin JSON use `preset`.
 */
export const REEL_PRESETS: Record<
  ReelPresetId,
  Omit<ReelPropsResolved, 'images' | 'secondsPerImage' | 'imageDurations' | 'title'>
> = {
  vedaDefault: {
    preset: 'vedaDefault',
    objectFit: 'contain',
    effects: {
      enableFade: true,
      fadeFrames: 25,
      enableZoom: true,
      zoomStart: 1.06,
      zoomEnd: 1,
    },
    titleStyle: { ...BASE_TITLE },
    spring: { ...BASE_SPRING },
    overlay: 'standard',
    cinematic: { ...DEFAULT_CINEMATIC },
  },
  minimal: {
    preset: 'minimal',
    objectFit: 'contain',
    effects: {
      enableFade: true,
      fadeFrames: 12,
      enableZoom: false,
      zoomStart: 1,
      zoomEnd: 1,
    },
    titleStyle: {
      ...BASE_TITLE,
      fontSize: 36,
      letterSpacing: 0.5,
      textTransform: 'none',
      textShadow: '0 1px 12px rgba(0,0,0,0.45)',
    },
    spring: { damping: 18, stiffness: 140 },
    overlay: 'subtle',
    cinematic: {
      ...DEFAULT_CINEMATIC,
      zoomEasing: 'easeOut',
      titleEntrance: 'fade',
      titleEntranceFrames: 14,
    },
  },
  bold: {
    preset: 'bold',
    objectFit: 'cover',
    effects: {
      enableFade: true,
      fadeFrames: 35,
      enableZoom: true,
      zoomStart: 1.12,
      zoomEnd: 1,
    },
    titleStyle: {
      ...BASE_TITLE,
      fontSize: 64,
      letterSpacing: 1.5,
      textShadow: '0 4px 32px rgba(0,0,0,0.65)',
    },
    spring: { damping: 10, stiffness: 90 },
    overlay: 'dramatic',
    cinematic: {
      ...DEFAULT_CINEMATIC,
      zoomEasing: 'easeInOut',
      contrast: 1.06,
      saturate: 1.08,
      vignette: 0.25,
    },
  },
  chart: {
    preset: 'chart',
    objectFit: 'contain',
    effects: {
      enableFade: true,
      fadeFrames: 40,
      enableZoom: true,
      zoomStart: 1.02,
      zoomEnd: 1,
    },
    titleStyle: {
      ...BASE_TITLE,
      fontSize: 42,
      marginTop: 100,
      letterSpacing: 0.8,
    },
    spring: { damping: 14, stiffness: 95 },
    overlay: 'standard',
    cinematic: {
      ...DEFAULT_CINEMATIC,
      zoomEasing: 'easeOut',
      brightness: 1.02,
      contrast: 1.03,
    },
  },
  cinematic: {
    preset: 'cinematic',
    objectFit: 'cover',
    effects: {
      enableFade: true,
      fadeFrames: 42,
      enableZoom: true,
      zoomStart: 1.1,
      zoomEnd: 1.02,
    },
    titleStyle: {
      ...BASE_TITLE,
      fontSize: 52,
      marginTop: 96,
      letterSpacing: 2,
      textShadow: '0 6px 40px rgba(0,0,0,0.75)',
    },
    spring: { damping: 11, stiffness: 78 },
    overlay: 'dramatic',
    cinematic: {
      zoomEasing: 'cinematic',
      titleEntrance: 'dramatic',
      titleEntranceFrames: 36,
      brightness: 0.94,
      contrast: 1.12,
      saturate: 1.06,
      letterbox: true,
      letterboxBarPercent: 10,
      vignette: 0.55,
      grain: 0.18,
    },
  },
}

export type ReelPropsInput = {
  images: string[]
  secondsPerImage?: number
  imageDurations?: number[]
  title?: string
  objectFit?: 'cover' | 'contain'
  preset?: ReelPresetId
  effects?: Partial<ReelEffectsResolved>
  titleStyle?: Partial<TitleStyleResolved>
  spring?: Partial<SpringResolved>
  overlay?: OverlayVariant
  cinematic?: Partial<CinematicResolved>
}

export function mergeReelPropsFromRaw(raw: ReelPropsInput): ReelPropsResolved {
  const pid: ReelPresetId = raw.preset ?? 'vedaDefault'
  const base = REEL_PRESETS[pid]
  return {
    images: raw.images,
    secondsPerImage: raw.secondsPerImage ?? 2.5,
    imageDurations: raw.imageDurations,
    title: raw.title,
    objectFit: raw.objectFit ?? base.objectFit,
    preset: pid,
    effects: { ...base.effects, ...raw.effects },
    titleStyle: { ...base.titleStyle, ...raw.titleStyle },
    spring: { ...base.spring, ...raw.spring },
    overlay: raw.overlay ?? base.overlay,
    cinematic: {
      ...base.cinematic,
      ...(raw.cinematic ?? {}),
    },
  }
}
