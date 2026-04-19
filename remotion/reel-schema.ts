import { z } from 'zod'
import {
  mergeReelPropsFromRaw,
  REEL_PRESET_IDS,
  type ReelPropsInput,
  type ReelPropsResolved,
  type ReelEffectsResolved,
  type TitleStyleResolved,
  type SpringResolved,
} from '../src/lib/reel/reel-remotion-presets'

const reelEffectsPartialSchema = z.object({
  enableFade: z.boolean().optional(),
  fadeFrames: z.number().int().min(1).max(120).optional(),
  enableZoom: z.boolean().optional(),
  zoomStart: z.number().min(1).max(2).optional(),
  zoomEnd: z.number().min(1).max(2).optional(),
})

const titleStylePartialSchema = z.object({
  fontSize: z.number().min(12).max(120).optional(),
  marginTop: z.number().min(0).max(400).optional(),
  fontFamily: z.string().optional(),
  color: z.string().optional(),
  letterSpacing: z.number().optional(),
  textTransform: z.enum(['none', 'uppercase', 'capitalize']).optional(),
  fontWeight: z.union([z.number(), z.string()]).optional(),
  textShadow: z.string().optional(),
})

const springPartialSchema = z.object({
  damping: z.number().positive().optional(),
  stiffness: z.number().positive().optional(),
})

const cinematicPartialSchema = z.object({
  zoomEasing: z.enum(['linear', 'easeIn', 'easeOut', 'easeInOut', 'cinematic']).optional(),
  titleEntrance: z.enum(['none', 'fade', 'rise', 'dramatic']).optional(),
  titleEntranceFrames: z.number().int().min(6).max(90).optional(),
  brightness: z.number().min(0.6).max(1.4).optional(),
  contrast: z.number().min(0.6).max(1.5).optional(),
  saturate: z.number().min(0).max(2).optional(),
  letterbox: z.boolean().optional(),
  letterboxBarPercent: z.number().min(0).max(22).optional(),
  vignette: z.number().min(0).max(1).optional(),
  grain: z.number().min(0).max(1).optional(),
})

/** Input shape (paste from admin / partial overrides). Transforms to resolved props. */
export const reelPropsInputSchema = z
  .object({
    images: z.array(z.string()).min(1, 'Add at least one image.'),
    secondsPerImage: z.number().positive().optional(),
    imageDurations: z.array(z.number().positive()).optional(),
    title: z.string().optional(),
    objectFit: z.enum(['cover', 'contain']).optional(),
    preset: z.enum(REEL_PRESET_IDS).optional(),
    effects: reelEffectsPartialSchema.optional(),
    titleStyle: titleStylePartialSchema.optional(),
    spring: springPartialSchema.optional(),
    overlay: z.enum(['subtle', 'standard', 'dramatic']).optional(),
    cinematic: cinematicPartialSchema.optional(),
  })
  .transform((raw) => mergeReelPropsFromRaw(raw as ReelPropsInput))

export const reelPropsSchema = reelPropsInputSchema

export type ReelProps = ReelPropsResolved
export type ReelEffects = ReelEffectsResolved
export type TitleStyle = TitleStyleResolved
export type SpringConfig = SpringResolved
export type {
  OverlayVariant,
  ReelPresetId,
  ZoomEasingId,
  TitleEntranceId,
  CinematicResolved,
} from '../src/lib/reel/reel-remotion-presets'
