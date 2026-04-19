import React from 'react'
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'
import type { OverlayVariant, ReelProps, ZoomEasingId } from './reel-schema'

function resolveImgSrc(src: string): string {
  if (
    src.startsWith('data:') ||
    src.startsWith('blob:') ||
    src.startsWith('http://') ||
    src.startsWith('https://')
  ) {
    return src
  }
  return staticFile(src)
}

const OVERLAY_GRADIENT: Record<OverlayVariant, string> = {
  subtle:
    'linear-gradient(180deg, rgba(0, 0, 0, 0.35) 0%, rgba(0, 0, 0, 0) 45%, rgba(0, 0, 0, 0.35) 100%)',
  standard:
    'linear-gradient(180deg, rgba(0, 0, 0, 0.65) 0%, rgba(0, 0, 0, 0) 45%, rgba(0, 0, 0, 0.6) 100%)',
  dramatic:
    'linear-gradient(180deg, rgba(0, 0, 0, 0.82) 0%, rgba(0, 0, 0, 0.08) 40%, rgba(0, 0, 0, 0.78) 100%)',
}

function getZoomEasing(id: ZoomEasingId) {
  switch (id) {
    case 'easeIn':
      return Easing.in(Easing.cubic)
    case 'easeOut':
      return Easing.out(Easing.cubic)
    case 'easeInOut':
      return Easing.inOut(Easing.cubic)
    case 'cinematic':
      return Easing.bezier(0.45, 0.05, 0.55, 0.95)
    default:
      return Easing.linear
  }
}

/** SVG noise tile for film grain (static, cheap). */
function GrainLayer({ opacity }: { opacity: number }) {
  if (opacity <= 0) return null
  const svg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(#n)" opacity="0.55"/></svg>`,
  )
  return (
    <AbsoluteFill
      style={{
        pointerEvents: 'none',
        opacity: Math.min(1, opacity),
        mixBlendMode: 'overlay',
        backgroundImage: `url("data:image/svg+xml,${svg}")`,
        backgroundSize: '256px 256px',
      }}
    />
  )
}

export const VedaReel: React.FC<ReelProps> = ({
  images,
  title,
  secondsPerImage,
  imageDurations,
  effects,
  objectFit,
  titleStyle,
  spring: springCfg,
  overlay,
  cinematic,
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const fit = objectFit ?? 'contain'

  const framesByImage = images.map((_, index) => {
    const seconds = imageDurations?.[index] ?? secondsPerImage
    return Math.max(1, Math.floor(seconds * fps))
  })

  const startFrames = framesByImage.reduce<number[]>((acc, framesForImage, index) => {
    if (index === 0) {
      acc.push(0)
      return acc
    }
    acc.push(acc[index - 1] + framesByImage[index - 1])
    return acc
  }, [])

  const overlayCss: React.CSSProperties = {
    background: OVERLAY_GRADIENT[overlay],
    pointerEvents: 'none',
  }

  const damp = springCfg.damping
  const stiff = springCfg.stiffness
  const zoomEase = getZoomEasing(cinematic.zoomEasing)

  const bar = cinematic.letterbox ? Math.min(22, Math.max(0, cinematic.letterboxBarPercent)) : 0
  const vignetteOpacity = Math.min(1, Math.max(0, cinematic.vignette))

  const tFrames = Math.max(1, cinematic.titleEntranceFrames)
  let titleOpacity = 1
  let titleY = 0
  let titleScale = 1
  if (title && cinematic.titleEntrance !== 'none' && frame < tFrames) {
    const p = interpolate(frame, [0, tFrames - 1], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    })
    if (cinematic.titleEntrance === 'fade') {
      titleOpacity = p
    } else if (cinematic.titleEntrance === 'rise') {
      titleOpacity = p
      titleY = interpolate(p, [0, 1], [40, 0])
    } else if (cinematic.titleEntrance === 'dramatic') {
      titleOpacity = interpolate(p, [0, 0.35], [0, 1], { extrapolateRight: 'clamp' })
      titleY = interpolate(p, [0, 1], [52, 0])
      titleScale = interpolate(p, [0, 1], [0.9, 1])
    }
  }

  const imgFilter = `brightness(${cinematic.brightness}) contrast(${cinematic.contrast}) saturate(${cinematic.saturate})`

  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
      <AbsoluteFill
        style={{
          top: `${bar}%`,
          height: `${100 - 2 * bar}%`,
          zIndex: 1,
        }}
      >
        {images.map((src, index) => {
          const from = startFrames[index]
          const framesPerImageLocal = framesByImage[index]
          const localFrame = frame - from

          const zoomStart = effects.zoomStart
          const zoomEnd = effects.zoomEnd
          const scale =
            effects.enableZoom === false
              ? 1
              : interpolate(localFrame, [0, Math.max(1, framesPerImageLocal - 1)], [zoomStart, zoomEnd], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                  easing: zoomEase,
                })

          const opacity =
            index === 0 || effects.enableFade === false
              ? 1
              : spring({
                  fps,
                  frame: localFrame,
                  config: { damping: damp, stiffness: stiff },
                  durationInFrames: Math.min(effects.fadeFrames, framesPerImageLocal),
                })

          return (
            <Sequence key={index} from={from} durationInFrames={framesPerImageLocal}>
              <AbsoluteFill
                style={{
                  opacity,
                  transform: `scale(${scale})`,
                }}
              >
                <Img
                  src={resolveImgSrc(src)}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: fit,
                    filter: imgFilter,
                  }}
                />
              </AbsoluteFill>
            </Sequence>
          )
        })}
      </AbsoluteFill>

      {vignetteOpacity > 0 ? (
        <AbsoluteFill
          style={{
            pointerEvents: 'none',
            zIndex: 3,
            background: `radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,${0.2 + vignetteOpacity * 0.75}) 100%)`,
          }}
        />
      ) : null}

      {cinematic.grain > 0 ? (
        <AbsoluteFill style={{ zIndex: 4, pointerEvents: 'none' }}>
          <GrainLayer opacity={cinematic.grain} />
        </AbsoluteFill>
      ) : null}

      <AbsoluteFill style={{ ...overlayCss, zIndex: 5 }}>
        {title ? (
          <div
            style={{
              marginTop: titleStyle.marginTop,
              textAlign: 'center',
              color: titleStyle.color,
              fontSize: titleStyle.fontSize,
              fontFamily: titleStyle.fontFamily,
              fontWeight: titleStyle.fontWeight,
              letterSpacing: titleStyle.letterSpacing,
              textTransform: titleStyle.textTransform,
              textShadow: titleStyle.textShadow,
              opacity: titleOpacity,
              transform: `translateY(${titleY}px) scale(${titleScale})`,
            }}
          >
            {title}
          </div>
        ) : null}
      </AbsoluteFill>

      {cinematic.letterbox && bar > 0 ? (
        <>
          <AbsoluteFill
            style={{
              top: 0,
              height: `${bar}%`,
              backgroundColor: '#000',
              zIndex: 6,
              pointerEvents: 'none',
            }}
          />
          <AbsoluteFill
            style={{
              bottom: 0,
              height: `${bar}%`,
              backgroundColor: '#000',
              zIndex: 6,
              pointerEvents: 'none',
            }}
          />
        </>
      ) : null}
    </AbsoluteFill>
  )
}
