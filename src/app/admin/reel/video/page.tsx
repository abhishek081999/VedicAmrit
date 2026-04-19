'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { encodeReelWebm } from '@/lib/reel/browser-reel-webm'
import { triggerBlobDownload } from '@/lib/reel/trigger-download'
import { webmToMp4ForInstagram } from '@/lib/reel/webm-to-mp4-instagram'
import { clearReelVideoHandoff, stashReelVideoHandoff, takeReelVideoHandoff } from '@/lib/reel/reel-video-draft'
import { ReelRemotionEditor } from '@/components/reel/ReelRemotionEditor'
import {
  mergeReelPropsFromRaw,
  REEL_PRESETS,
  type CinematicResolved,
  type ReelPresetId,
} from '@/lib/reel/reel-remotion-presets'
import {
  openInstagramCreate,
  openYouTubeUpload,
  shareMp4File,
} from '@/lib/reel/share-video-platforms'
import styles from './reel-video.module.css'

export default function ReelVideoPage() {
  const router = useRouter()
  const [files, setFiles] = useState<File[]>([])
  const [seconds, setSeconds] = useState(2.5)
  const [title, setTitle] = useState('Vedaansh')
  const [objectFit, setObjectFit] = useState<'cover' | 'contain'>('contain')
  const [enableZoom, setEnableZoom] = useState(true)
  const [zoomStart, setZoomStart] = useState(1.06)
  const [zoomEnd, setZoomEnd] = useState(1)
  const [enableFade, setEnableFade] = useState(true)
  const [fadeFrames, setFadeFrames] = useState(25)
  const [exporting, setExporting] = useState<{
    kind: 'webm' | 'mp4' | 'share'
    phase: 'encode' | 'convert'
    percent: number
  } | null>(null)
  const busy = exporting !== null
  const [err, setErr] = useState<string | null>(null)
  const [perImageSec, setPerImageSec] = useState<number[]>([])
  const [brandIconFile, setBrandIconFile] = useState<File | null>(null)
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null)
  const dragSourceRef = useRef<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [remotionPreset, setRemotionPreset] = useState<ReelPresetId>('vedaDefault')
  /** Optional overrides on top of preset (spring, title size, overlay). */
  const [remotionAdv, setRemotionAdv] = useState<{
    springDamping?: number
    springStiffness?: number
    titleFontSize?: number
    overlay?: 'subtle' | 'standard' | 'dramatic'
  }>({})
  /** Ken Burns easing, color grade, letterbox, grain, title entrance — merged on top of preset. */
  const [cinematicAdv, setCinematicAdv] = useState<Partial<CinematicResolved>>({})

  useEffect(() => {
    const { slides, brandIcon } = takeReelVideoHandoff()
    if (slides.length) setFiles((prev) => [...prev, ...slides])
    if (brandIcon) setBrandIconFile(brandIcon)
  }, [])

  useEffect(() => {
    const b = REEL_PRESETS[remotionPreset]
    setObjectFit(b.objectFit)
    setEnableFade(b.effects.enableFade)
    setFadeFrames(b.effects.fadeFrames)
    setEnableZoom(b.effects.enableZoom)
    setZoomStart(b.effects.zoomStart)
    setZoomEnd(b.effects.zoomEnd)
  }, [remotionPreset])

  useEffect(() => {
    setPerImageSec((prev) => {
      const n = files.length
      if (n === 0) return []
      const next = prev.slice(0, n)
      while (next.length < n) next.push(seconds)
      return next
    })
  }, [files, seconds])

  const previewUrls = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files])
  useEffect(() => {
    return () => previewUrls.forEach((u) => URL.revokeObjectURL(u))
  }, [previewUrls])

  const brandIconPreview = useMemo(
    () => (brandIconFile ? URL.createObjectURL(brandIconFile) : null),
    [brandIconFile],
  )
  useEffect(() => {
    return () => {
      if (brandIconPreview) URL.revokeObjectURL(brandIconPreview)
    }
  }, [brandIconPreview])

  const onFiles = useCallback(
    (list: FileList | null) => {
      if (!list?.length) return
      const next = Array.from(list).filter((f) => /^image\//.test(f.type) || /\.(png|jpe?g|webp)$/i.test(f.name))
      if (!next.length) return
      setFiles((prev) => [...prev, ...next])
      setPerImageSec((prev) => [...prev, ...next.map(() => seconds)])
    },
    [seconds],
  )

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiles(e.target.files)
    e.target.value = ''
  }

  const onDropUpload = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files?.length) onFiles(e.dataTransfer.files)
  }

  const reorderDnd = useCallback((from: number, to: number) => {
    if (from === to || from < 0 || to < 0) return
    setFiles((prev) => {
      if (from >= prev.length || to >= prev.length) return prev
      const next = [...prev]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      return next
    })
    setPerImageSec((prev) => {
      if (from >= prev.length || to >= prev.length) return prev
      const next = [...prev]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      return next
    })
  }, [])

  const REEL_SLIDE_MIME = 'application/x-jyotish-reel-slide-index'

  const onSlideDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData(REEL_SLIDE_MIME, String(index))
    e.dataTransfer.setData('text/plain', String(index))
    e.dataTransfer.effectAllowed = 'move'
    dragSourceRef.current = index
    setDraggingIndex(index)
    const img = new Image()
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
    e.dataTransfer.setDragImage(img, 0, 0)
  }

  const onSlideDragEnd = () => {
    dragSourceRef.current = null
    setDraggingIndex(null)
    setDropTargetIndex(null)
  }

  const onSlideDragOver = (e: React.DragEvent, index: number) => {
    const types = Array.from(e.dataTransfer.types)
    if (types.includes('Files') && dragSourceRef.current === null) return
    if (!types.includes(REEL_SLIDE_MIME) && !types.includes('text/plain')) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDropTargetIndex(index)
  }

  const onSlideDragLeave = (e: React.DragEvent) => {
    const related = e.relatedTarget as Node | null
    if (related && e.currentTarget.contains(related)) return
    setDropTargetIndex(null)
  }

  const onSlideDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    e.stopPropagation()
    const raw = e.dataTransfer.getData(REEL_SLIDE_MIME) || e.dataTransfer.getData('text/plain')
    const from = Number.parseInt(raw, 10)
    if (!Number.isFinite(from)) {
      setDropTargetIndex(null)
      return
    }
    reorderDnd(from, targetIndex)
    onSlideDragEnd()
  }

  const removeAt = (i: number) => {
    setFiles((prev) => prev.filter((_, j) => j !== i))
    setPerImageSec((prev) => prev.filter((_, j) => j !== i))
  }

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    setFiles((prev) => {
      if (j < 0 || j >= prev.length) return prev
      const copy = [...prev]
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
      return copy
    })
    setPerImageSec((prev) => {
      if (j < 0 || j >= prev.length) return prev
      const copy = [...prev]
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
      return copy
    })
  }

  const setSlideSec = (index: number, value: number) => {
    const v = Math.min(120, Math.max(0.25, Number.isFinite(value) ? value : 0.25))
    setPerImageSec((prev) => {
      const next = [...prev]
      next[index] = v
      return next
    })
  }

  const encodeReelBlob = async (onEncodeProgress?: (ratio: number) => void) => {
    const durs = files.map((_, i) => perImageSec[i] ?? seconds)
    return encodeReelWebm(files, {
      width: 1080,
      height: 1920,
      secondsPerImage: seconds,
      imageDurationsSeconds: durs,
      title: title.trim() || undefined,
      objectFit,
      effects: {
        enableZoom,
        zoomStart,
        zoomEnd,
      },
      onEncodeProgress,
    })
  }

  const buildMp4FromEditor = async (kind: 'mp4' | 'share'): Promise<Blob> => {
    if (!files.length) {
      throw new Error('Add at least one image (upload or send from Reel Generator).')
    }
    setExporting({ kind, phase: 'encode', percent: 0 })
    const webm = await encodeReelBlob((r) =>
      setExporting({ kind, phase: 'encode', percent: Math.round(r * 44) }),
    )
    setExporting({ kind, phase: 'convert', percent: 45 })
    const mp4 = await webmToMp4ForInstagram(webm, {
      onProgress: (r) =>
        setExporting({ kind, phase: 'convert', percent: Math.round(45 + r * 54) }),
    })
    setExporting({ kind, phase: 'convert', percent: 100 })
    return mp4
  }

  const exportMp4Instagram = async () => {
    setErr(null)
    if (!files.length) {
      setErr('Add at least one image (upload or send from Reel Generator).')
      return
    }
    try {
      const mp4 = await buildMp4FromEditor('mp4')
      triggerBlobDownload(mp4, `vedaansh-reel-${Date.now()}.mp4`)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Export failed')
    } finally {
      setExporting(null)
    }
  }

  const shareMp4Native = async () => {
    setErr(null)
    if (!files.length) {
      setErr('Add at least one image (upload or send from Reel Generator).')
      return
    }
    try {
      const mp4 = await buildMp4FromEditor('share')
      const name = `vedaansh-reel-${Date.now()}.mp4`
      const result = await shareMp4File(mp4, name)
      if (result === 'unavailable') {
        setErr(
          'Sharing the video file is not supported here (try Chrome on Android, or Safari on iPhone). Download the MP4, then use Open Instagram / Open YouTube upload below.',
        )
      } else if (result === 'error') {
        setErr('Share failed. Download the MP4 and upload it manually.')
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Share failed')
    } finally {
      setExporting(null)
    }
  }

  const exportWebm = async () => {
    setErr(null)
    if (!files.length) {
      setErr('Add at least one image (upload or send from Reel Generator).')
      return
    }
    setExporting({ kind: 'webm', phase: 'encode', percent: 0 })
    try {
      const blob = await encodeReelBlob((r) =>
        setExporting({ kind: 'webm', phase: 'encode', percent: Math.round(r * 99) }),
      )
      setExporting({ kind: 'webm', phase: 'encode', percent: 100 })
      triggerBlobDownload(blob, `vedaansh-reel-${Date.now()}.webm`)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Encode failed')
    } finally {
      setExporting(null)
    }
  }

  const resolvedRemotionPreview = useMemo(() => {
    if (!previewUrls.length) return null
    const durs = files.map((_, i) => perImageSec[i] ?? seconds)
    const uniform = durs.length > 1 && durs.every((s) => Math.abs(s - durs[0]) < 0.0001)
    const spring: { damping?: number; stiffness?: number } = {}
    if (remotionAdv.springDamping != null) spring.damping = remotionAdv.springDamping
    if (remotionAdv.springStiffness != null) spring.stiffness = remotionAdv.springStiffness
    return mergeReelPropsFromRaw({
      images: previewUrls,
      secondsPerImage: uniform ? durs[0] ?? seconds : seconds,
      imageDurations: uniform ? undefined : durs,
      title: title.trim() || undefined,
      objectFit,
      preset: remotionPreset,
      effects: {
        enableFade,
        fadeFrames,
        enableZoom,
        zoomStart,
        zoomEnd,
      },
      spring: Object.keys(spring).length ? spring : undefined,
      titleStyle: remotionAdv.titleFontSize != null ? { fontSize: remotionAdv.titleFontSize } : undefined,
      overlay: remotionAdv.overlay,
      cinematic: Object.keys(cinematicAdv).length ? cinematicAdv : undefined,
    })
  }, [
    previewUrls,
    files,
    perImageSec,
    seconds,
    title,
    objectFit,
    remotionPreset,
    enableFade,
    fadeFrames,
    enableZoom,
    zoomStart,
    zoomEnd,
    remotionAdv,
    cinematicAdv,
  ])

  const remotionPropsSnippet = useMemo(() => {
    const images = files.map(
      (_, i) => `reel-remotion-assets/slide-${String(i + 1).padStart(2, '0')}.png`,
    )
    const durs = files.map((_, i) => perImageSec[i] ?? seconds)
    const uniform =
      durs.length > 1 && durs.every((s) => Math.abs(s - durs[0]) < 0.0001)
    const payload: Record<string, unknown> = {
      images,
      preset: remotionPreset,
      secondsPerImage: uniform ? durs[0] ?? seconds : seconds,
      title: title.trim() || undefined,
      objectFit,
      effects: {
        enableFade,
        fadeFrames,
        enableZoom,
        zoomStart,
        zoomEnd,
      },
    }
    if (durs.length > 0 && !uniform) {
      payload.imageDurations = durs
    }
    if (remotionAdv.springDamping != null || remotionAdv.springStiffness != null) {
      payload.spring = {
        ...(remotionAdv.springDamping != null && { damping: remotionAdv.springDamping }),
        ...(remotionAdv.springStiffness != null && { stiffness: remotionAdv.springStiffness }),
      }
    }
    if (remotionAdv.titleFontSize != null) {
      payload.titleStyle = { fontSize: remotionAdv.titleFontSize }
    }
    if (remotionAdv.overlay != null) {
      payload.overlay = remotionAdv.overlay
    }
    if (Object.keys(cinematicAdv).length > 0) {
      payload.cinematic = cinematicAdv
    }
    return JSON.stringify(payload, null, 2)
  }, [
    files,
    perImageSec,
    seconds,
    title,
    objectFit,
    enableFade,
    fadeFrames,
    enableZoom,
    zoomStart,
    zoomEnd,
    remotionPreset,
    remotionAdv,
    cinematicAdv,
  ])

  const copyProps = async () => {
    try {
      await navigator.clipboard.writeText(remotionPropsSnippet)
    } catch {
      setErr('Could not copy to clipboard')
    }
  }

  const goStartNewReel = () => {
    clearReelVideoHandoff()
    router.push('/admin/reel')
  }

  const goEditInGenerator = () => {
    if (files.length) {
      stashReelVideoHandoff({ slides: files, brandIcon: brandIconFile ?? undefined })
    }
    router.push('/admin/reel')
  }

  return (
    <div className={styles.page}>
      <div className={styles.navRow}>
        <Link
          href="/admin/reel"
          style={{ fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none' }}
        >
          ← Reel Generator
        </Link>
        <span className={styles.navSep} aria-hidden>
          ·
        </span>
        <button type="button" className={styles.navButtonPrimary} onClick={() => goStartNewReel()}>
          Start new reel
        </button>
        <button
          type="button"
          className={styles.navButtonSecondary}
          onClick={() => goEditInGenerator()}
          title="Opens the generator; current slides are sent again if you re-open the video builder"
        >
          Edit in Generator
        </button>
      </div>
      <h1 className={styles.pageTitle}>Reel video (VedaEdit-style)</h1>

      {brandIconFile && brandIconPreview && (
        <div className={styles.brandRow}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={brandIconPreview}
            alt=""
            width={44}
            height={44}
            style={{ borderRadius: 10, objectFit: 'contain', background: '#0b1022' }}
          />
          <div className={styles.brandRowBody}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Veda icon included</div>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4, lineHeight: 1.45 }}>
              Sent from Reel Generator as <code style={{ fontSize: 11 }}>veda-icon.png</code>. Slides already show the
              logo in the artwork; keep this file for Remotion overlays, end cards, or other tools.
            </div>
          </div>
          <a
            href={brandIconPreview}
            download={brandIconFile.name || 'veda-icon.png'}
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              background: 'var(--surface-1)',
              border: '0.5px solid var(--border)',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text-primary)',
              textDecoration: 'none',
            }}
          >
            Download icon
          </a>
        </div>
      )}

      <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={onPick} />

      <div
        className={styles.dropZone}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDropUpload}
      >
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          style={{
            padding: '10px 18px',
            borderRadius: 10,
            border: 'none',
            background: '#6C5CE7',
            color: '#fff',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          Choose images
        </button>
        <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 12, marginBottom: 0 }}>
          Or drop files here. Below, drag the handle on each card to reorder (or use ↑ ↓).
        </p>
      </div>

      <div className={styles.formRowTwo}>
        <label className={styles.fieldCol}>
          Title on video (optional)
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Daily Panchang"
            className={styles.fullWidth}
            style={{
              padding: '10px 12px',
              borderRadius: 8,
              border: '0.5px solid var(--border)',
              background: 'var(--surface-1)',
              color: 'var(--text-primary)',
              fontSize: 14,
            }}
          />
        </label>
        <label className={styles.fieldCol}>
          Frame fit (Remotion + WebM zoom base)
          <select
            value={objectFit}
            onChange={(e) => setObjectFit(e.target.value as 'cover' | 'contain')}
            className={styles.fullWidth}
            style={{
              padding: '10px 12px',
              borderRadius: 8,
              border: '0.5px solid var(--border)',
              background: 'var(--surface-1)',
              color: 'var(--text-primary)',
              fontSize: 14,
            }}
          >
            <option value="contain">Contain — full chart visible (recommended for pañcāṅga)</option>
            <option value="cover">Cover — full bleed (lifestyle / photo reels)</option>
          </select>
        </label>
      </div>

      <label className={styles.presetField}>
        Remotion look (preset)
        <select
          value={remotionPreset}
          onChange={(e) => setRemotionPreset(e.target.value as ReelPresetId)}
          className={styles.fullWidth}
          style={{
            padding: '10px 12px',
            borderRadius: 8,
            border: '0.5px solid var(--border)',
            background: 'var(--surface-1)',
            color: 'var(--text-primary)',
            fontSize: 14,
          }}
        >
          <option value="vedaDefault">Veda default — balanced zoom, standard title band</option>
          <option value="minimal">Minimal — no Ken Burns, quick fade, smaller title</option>
          <option value="bold">Bold — strong gradient, cover fit, big title</option>
          <option value="chart">Chart — subtle zoom, long fade for readability (contain)</option>
          <option value="cinematic">Cinematic — letterbox, grain, vignette, eased Ken Burns</option>
        </select>
        <span style={{ fontWeight: 400, fontSize: 11, color: 'var(--text-tertiary)', lineHeight: 1.45 }}>
          Changing the preset updates zoom/fade/fit below to match. Override any field; the JSON still includes{' '}
          <code style={{ fontSize: 11 }}>preset</code> plus your tweaks for Remotion Studio.
        </span>
      </label>

      <div className={styles.editorCard}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
          Live Remotion editor
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 14px', lineHeight: 1.55 }}>
          In-browser preview uses the same <code style={{ fontSize: 11 }}>VedaReel</code> composition as{' '}
          <code style={{ fontSize: 11 }}>remotion:studio</code> and <code style={{ fontSize: 11 }}>reel:mp4</code>. Scrub the
          timeline, loop, and change playback speed. Use <strong>Advanced</strong> for spring/title/gradient, and{' '}
          <strong>Cinematic &amp; motion</strong> for easing, color grade, letterbox, film grain, and title entrance.
        </p>
        <ReelRemotionEditor resolved={resolvedRemotionPreview} />
        <details style={{ marginTop: 14 }}>
          <summary
            style={{
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 13,
              color: 'var(--text-primary)',
            }}
          >
            Advanced overrides
          </summary>
          <div className={styles.formStackWide}>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
              Spring damping (fade snap){' '}
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                Current:{' '}
                {remotionAdv.springDamping ?? resolvedRemotionPreview?.spring.damping ?? '—'}
              </span>
              <input
                type="range"
                min={4}
                max={36}
                step={1}
                value={remotionAdv.springDamping ?? resolvedRemotionPreview?.spring.damping ?? 12}
                onChange={(e) =>
                  setRemotionAdv((a) => ({ ...a, springDamping: Number(e.target.value) }))
                }
                style={{ width: '100%' }}
              />
            </label>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
              Spring stiffness
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                Current: {remotionAdv.springStiffness ?? resolvedRemotionPreview?.spring.stiffness ?? '—'}
              </span>
              <input
                type="range"
                min={40}
                max={220}
                step={5}
                value={remotionAdv.springStiffness ?? resolvedRemotionPreview?.spring.stiffness ?? 100}
                onChange={(e) =>
                  setRemotionAdv((a) => ({ ...a, springStiffness: Number(e.target.value) }))
                }
                style={{ width: '100%' }}
              />
            </label>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
              Title font size (px)
              <input
                type="range"
                min={24}
                max={88}
                step={1}
                value={remotionAdv.titleFontSize ?? resolvedRemotionPreview?.titleStyle.fontSize ?? 56}
                onChange={(e) =>
                  setRemotionAdv((a) => ({ ...a, titleFontSize: Number(e.target.value) }))
                }
                style={{ width: '100%' }}
              />
            </label>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
              Gradient overlay
              <select
                value={remotionAdv.overlay ?? resolvedRemotionPreview?.overlay ?? 'standard'}
                onChange={(e) =>
                  setRemotionAdv((a) => ({
                    ...a,
                    overlay: e.target.value as 'subtle' | 'standard' | 'dramatic',
                  }))
                }
                className={styles.fullWidth}
                style={{
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: '0.5px solid var(--border)',
                  background: 'var(--surface-2)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                }}
              >
                <option value="subtle">Subtle</option>
                <option value="standard">Standard</option>
                <option value="dramatic">Dramatic</option>
              </select>
            </label>
            <button
              type="button"
              onClick={() => setRemotionAdv({})}
              style={{
                justifySelf: 'start',
                padding: '8px 14px',
                borderRadius: 8,
                border: '0.5px solid var(--border)',
                background: 'var(--surface-2)',
                color: 'var(--text-primary)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Reset advanced overrides
            </button>
          </div>
        </details>

        <details style={{ marginTop: 14 }}>
          <summary
            style={{
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 13,
              color: 'var(--text-primary)',
            }}
          >
            Cinematic &amp; motion (Remotion-grade controls)
          </summary>
          <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: '10px 0 12px', lineHeight: 1.5, maxWidth: 520 }}>
            Zoom uses Remotion <code style={{ fontSize: 10 }}>interpolate</code> easing. Image grade uses CSS filters. Grain is a
            light noise overlay; vignette darkens edges. Title entrance runs once at the start of the reel.
          </p>
          <div className={styles.formStack}>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
              Ken Burns easing
              <select
                value={cinematicAdv.zoomEasing ?? resolvedRemotionPreview?.cinematic.zoomEasing ?? 'linear'}
                onChange={(e) =>
                  setCinematicAdv((c) => ({
                    ...c,
                    zoomEasing: e.target.value as CinematicResolved['zoomEasing'],
                  }))
                }
                className={styles.fullWidth}
                style={{
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: '0.5px solid var(--border)',
                  background: 'var(--surface-2)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                }}
              >
                <option value="linear">Linear</option>
                <option value="easeIn">Ease in</option>
                <option value="easeOut">Ease out</option>
                <option value="easeInOut">Ease in-out</option>
                <option value="cinematic">Cinematic bezier</option>
              </select>
            </label>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
              Title entrance (opening)
              <select
                value={
                  cinematicAdv.titleEntrance ?? resolvedRemotionPreview?.cinematic.titleEntrance ?? 'none'
                }
                onChange={(e) =>
                  setCinematicAdv((c) => ({
                    ...c,
                    titleEntrance: e.target.value as CinematicResolved['titleEntrance'],
                  }))
                }
                className={styles.fullWidth}
                style={{
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: '0.5px solid var(--border)',
                  background: 'var(--surface-2)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                }}
              >
                <option value="none">None</option>
                <option value="fade">Fade</option>
                <option value="rise">Rise + fade</option>
                <option value="dramatic">Dramatic (scale + rise)</option>
              </select>
            </label>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
              Title entrance length (frames @ 30fps)
              <input
                type="range"
                min={6}
                max={72}
                step={1}
                value={
                  cinematicAdv.titleEntranceFrames ??
                  resolvedRemotionPreview?.cinematic.titleEntranceFrames ??
                  22
                }
                onChange={(e) =>
                  setCinematicAdv((c) => ({
                    ...c,
                    titleEntranceFrames: Number(e.target.value),
                  }))
                }
                style={{ width: '100%' }}
              />
            </label>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
              Brightness ({(cinematicAdv.brightness ?? resolvedRemotionPreview?.cinematic.brightness ?? 1).toFixed(2)})
              <input
                type="range"
                min={0.65}
                max={1.35}
                step={0.01}
                value={cinematicAdv.brightness ?? resolvedRemotionPreview?.cinematic.brightness ?? 1}
                onChange={(e) =>
                  setCinematicAdv((c) => ({ ...c, brightness: Number(e.target.value) }))
                }
                style={{ width: '100%' }}
              />
            </label>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
              Contrast ({(cinematicAdv.contrast ?? resolvedRemotionPreview?.cinematic.contrast ?? 1).toFixed(2)})
              <input
                type="range"
                min={0.75}
                max={1.4}
                step={0.01}
                value={cinematicAdv.contrast ?? resolvedRemotionPreview?.cinematic.contrast ?? 1}
                onChange={(e) =>
                  setCinematicAdv((c) => ({ ...c, contrast: Number(e.target.value) }))
                }
                style={{ width: '100%' }}
              />
            </label>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
              Saturation ({(cinematicAdv.saturate ?? resolvedRemotionPreview?.cinematic.saturate ?? 1).toFixed(2)})
              <input
                type="range"
                min={0.5}
                max={1.5}
                step={0.01}
                value={cinematicAdv.saturate ?? resolvedRemotionPreview?.cinematic.saturate ?? 1}
                onChange={(e) =>
                  setCinematicAdv((c) => ({ ...c, saturate: Number(e.target.value) }))
                }
                style={{ width: '100%' }}
              />
            </label>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={cinematicAdv.letterbox ?? resolvedRemotionPreview?.cinematic.letterbox ?? false}
                onChange={(e) =>
                  setCinematicAdv((c) => ({ ...c, letterbox: e.target.checked }))
                }
              />
              Letterbox (2.39:1 style bars)
            </label>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
              Letterbox bar height (% of frame each)
              <input
                type="range"
                min={4}
                max={18}
                step={1}
                value={
                  cinematicAdv.letterboxBarPercent ??
                  resolvedRemotionPreview?.cinematic.letterboxBarPercent ??
                  8
                }
                onChange={(e) =>
                  setCinematicAdv((c) => ({
                    ...c,
                    letterboxBarPercent: Number(e.target.value),
                  }))
                }
                style={{ width: '100%' }}
              />
            </label>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
              Vignette strength
              <input
                type="range"
                min={0}
                max={1}
                step={0.02}
                value={cinematicAdv.vignette ?? resolvedRemotionPreview?.cinematic.vignette ?? 0}
                onChange={(e) =>
                  setCinematicAdv((c) => ({ ...c, vignette: Number(e.target.value) }))
                }
                style={{ width: '100%' }}
              />
            </label>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
              Film grain
              <input
                type="range"
                min={0}
                max={1}
                step={0.02}
                value={cinematicAdv.grain ?? resolvedRemotionPreview?.cinematic.grain ?? 0}
                onChange={(e) =>
                  setCinematicAdv((c) => ({ ...c, grain: Number(e.target.value) }))
                }
                style={{ width: '100%' }}
              />
            </label>
            <button
              type="button"
              onClick={() => setCinematicAdv({})}
              style={{
                justifySelf: 'start',
                padding: '8px 14px',
                borderRadius: 8,
                border: '0.5px solid var(--border)',
                background: 'var(--surface-2)',
                color: 'var(--text-primary)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Reset cinematic overrides
            </button>
          </div>
        </details>
      </div>

      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 8 }}>
        Default seconds (new slides &amp; &quot;Set all&quot;): {seconds.toFixed(1)}
      </label>
      <input
        type="range"
        min={0.5}
        max={6}
        step={0.5}
        value={seconds}
        onChange={(e) => setSeconds(Number(e.target.value))}
        style={{ width: '100%', maxWidth: 420, marginBottom: 8 }}
      />
      <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: '0 0 16px', maxWidth: 520 }}>
        Each thumbnail has its own duration (0.25–120s). Use this slider as the default, then fine-tune per slide.
      </p>

      <details open className={styles.motionDetails}>
        <summary style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--text-primary)' }}>
          Motion (matches videditz Remotion)
        </summary>
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--text-secondary)' }}>
            <input type="checkbox" checked={enableZoom} onChange={(e) => setEnableZoom(e.target.checked)} />
            Ken Burns zoom (scale from → to over each clip)
          </label>
          <div className={styles.zoomRow}>
            <label style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
              Zoom start: {zoomStart.toFixed(2)}
              <input
                type="range"
                min={1}
                max={1.2}
                step={0.01}
                value={zoomStart}
                onChange={(e) => setZoomStart(Number(e.target.value))}
                style={{ display: 'block', width: '100%', maxWidth: 200, marginTop: 4 }}
              />
            </label>
            <label style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
              Zoom end: {zoomEnd.toFixed(2)}
              <input
                type="range"
                min={1}
                max={1.2}
                step={0.01}
                value={zoomEnd}
                onChange={(e) => setZoomEnd(Number(e.target.value))}
                style={{ display: 'block', width: '100%', maxWidth: 200, marginTop: 4 }}
              />
            </label>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: 0 }}>
            WebM export uses the same zoom numbers (linear). Spring fade between slides is{' '}
            <strong>Remotion MP4 only</strong> — tune fade below for Studio/render.
          </p>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--text-secondary)' }}>
            <input type="checkbox" checked={enableFade} onChange={(e) => setEnableFade(e.target.checked)} />
            Spring fade-in between clips (MP4 / Studio)
          </label>
          <label style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
            Fade length (frames @ 30fps): {fadeFrames}
            <input
              type="range"
              min={8}
              max={60}
              step={1}
              value={fadeFrames}
              onChange={(e) => setFadeFrames(Number(e.target.value))}
              style={{ display: 'block', width: '100%', maxWidth: 320, marginTop: 4 }}
            />
          </label>
        </div>
      </details>

      {files.length > 0 && (
        <>
          <div className={styles.slideToolbar}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
              Order &amp; duration (drag ⋮⋮ to move)
            </span>
            <button
              type="button"
              onClick={() => setPerImageSec((prev) => prev.map(() => seconds))}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                border: '0.5px solid var(--border)',
                background: 'var(--surface-2)',
                fontSize: 12,
                cursor: 'pointer',
                color: 'var(--text-primary)',
              }}
            >
              Set all to {seconds.toFixed(1)}s
            </button>
          </div>
          <div className={styles.slideGrid}>
            {files.map((f, i) => (
              <div
                key={`${f.name}-${i}-${f.size}`}
                style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
                onDragOver={(e) => onSlideDragOver(e, i)}
                onDragLeave={onSlideDragLeave}
                onDrop={(e) => onSlideDrop(e, i)}
              >
                <div
                  draggable
                  onDragStart={(e) => onSlideDragStart(e, i)}
                  onDragEnd={onSlideDragEnd}
                  title="Drag to reorder slides"
                  style={{
                    padding: '6px 8px',
                    borderRadius: 8,
                    border:
                      dropTargetIndex === i
                        ? '2px dashed #6C5CE7'
                        : '0.5px solid var(--border)',
                    background:
                      draggingIndex === i ? 'rgba(108, 92, 231, 0.15)' : 'var(--surface-2)',
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    cursor: 'grab',
                    userSelect: 'none',
                    textAlign: 'center',
                  }}
                >
                  ⋮⋮ Drag
                </div>
                <div
                  style={{
                    position: 'relative',
                    borderRadius: 10,
                    overflow: 'hidden',
                    border: '0.5px solid var(--border)',
                    aspectRatio: '9 / 16',
                    background: '#0b1022',
                    opacity: draggingIndex === i ? 0.55 : 1,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewUrls[i]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      display: 'flex',
                      gap: 4,
                      padding: 6,
                      background: 'linear-gradient(transparent, rgba(0,0,0,0.75))',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      style={{ flex: 1, fontSize: 11, padding: 4, borderRadius: 6, border: 'none', cursor: 'pointer' }}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => move(i, 1)}
                      disabled={i === files.length - 1}
                      style={{ flex: 1, fontSize: 11, padding: 4, borderRadius: 6, border: 'none', cursor: 'pointer' }}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => removeAt(i)}
                      style={{
                        flex: 1,
                        fontSize: 11,
                        padding: 4,
                        borderRadius: 6,
                        border: 'none',
                        cursor: 'pointer',
                        background: 'rgba(220,38,38,0.9)',
                        color: '#fff',
                      }}
                    >
                      ✕
                    </button>
                  </div>
                  <span
                    style={{
                      position: 'absolute',
                      top: 6,
                      left: 6,
                      fontSize: 10,
                      fontWeight: 700,
                      color: '#fff',
                      background: 'rgba(0,0,0,0.55)',
                      padding: '2px 6px',
                      borderRadius: 6,
                    }}
                  >
                    {i + 1}
                  </span>
                </div>
                <label
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--text-tertiary)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}
                >
                  Seconds
                  <input
                    type="number"
                    min={0.25}
                    max={120}
                    step={0.1}
                    value={perImageSec[i] ?? seconds}
                    onChange={(e) => setSlideSec(i, Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      borderRadius: 6,
                      border: '0.5px solid var(--border)',
                      background: 'var(--surface-1)',
                      color: 'var(--text-primary)',
                      fontSize: 13,
                    }}
                  />
                </label>
              </div>
            ))}
          </div>
        </>
      )}

      {err && (
        <p style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }} role="alert">
          {err}
        </p>
      )}

      <div className={styles.exportStack}>
        <button
          type="button"
          onClick={() => void exportMp4Instagram()}
          disabled={busy || files.length === 0}
          style={{
            padding: '14px 22px',
            borderRadius: 10,
            border: 'none',
            background: files.length && !busy ? '#00B894' : 'var(--surface-3)',
            color: files.length && !busy ? '#fff' : 'var(--text-tertiary)',
            fontWeight: 600,
            cursor: files.length && !busy ? 'pointer' : 'not-allowed',
            fontSize: 15,
          }}
        >
          {!exporting || exporting.kind !== 'mp4'
            ? 'Download MP4 (Instagram)'
            : exporting.phase === 'encode'
              ? `Encoding slideshow… ${exporting.percent}%`
              : `Converting to MP4… ${exporting.percent}%`}
        </button>
        <button
          type="button"
          onClick={() => void exportWebm()}
          disabled={busy || files.length === 0}
          style={{
            padding: '10px 18px',
            borderRadius: 10,
            border: '0.5px solid var(--border)',
            background: 'var(--surface-2)',
            color: files.length && !busy ? 'var(--text-secondary)' : 'var(--text-tertiary)',
            fontWeight: 600,
            cursor: files.length && !busy ? 'pointer' : 'not-allowed',
            fontSize: 13,
          }}
        >
          {exporting?.kind === 'webm'
            ? `Encoding WebM… ${exporting.percent}%`
            : 'Download WebM (preview only)'}
        </button>
        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: 0, lineHeight: 1.5 }}>
          Instagram expects MP4 (H.264). WebM is for quick browser previews. The first MP4 export downloads
          FFmpeg in your browser (~tens of MB), then converts locally.
        </p>

        {busy && exporting && (
          <div className={styles.exportProgressWrap}>
            <p className={styles.exportProgressLabel}>
              {exporting.kind === 'mp4' || exporting.kind === 'share'
                ? exporting.phase === 'encode'
                  ? 'Step 1 of 2: recording slideshow to WebM in the browser'
                  : 'Step 2 of 2: FFmpeg (H.264) — first run may download FFmpeg core'
                : 'Encoding preview WebM'}
            </p>
            <div className={styles.exportProgressBar} role="progressbar" aria-valuenow={exporting.percent} aria-valuemin={0} aria-valuemax={100}>
              <div className={styles.exportProgressFill} style={{ width: `${exporting.percent}%` }} />
            </div>
          </div>
        )}

        <div className={styles.shareSection}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
            Share &amp; upload shortcuts
          </span>
          <div className={styles.shareActions}>
            <button
              type="button"
              onClick={() => void shareMp4Native()}
              disabled={busy || files.length === 0}
              style={{
                padding: '10px 16px',
                borderRadius: 10,
                border: '0.5px solid var(--border)',
                background: files.length && !busy ? 'var(--surface-1)' : 'var(--surface-3)',
                color: files.length && !busy ? 'var(--text-primary)' : 'var(--text-tertiary)',
                fontWeight: 600,
                cursor: files.length && !busy ? 'pointer' : 'not-allowed',
                fontSize: 13,
              }}
            >
              {exporting?.kind === 'share'
                ? exporting.phase === 'encode'
                  ? `Preparing share… ${exporting.percent}%`
                  : `Converting… ${exporting.percent}%`
                : 'Share video…'}
            </button>
            <button
              type="button"
              onClick={openYouTubeUpload}
              style={{
                padding: '10px 16px',
                borderRadius: 10,
                border: '0.5px solid #ff0000',
                background: 'rgba(255,0,0,0.08)',
                color: '#cc0000',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              Open YouTube upload
            </button>
            <button
              type="button"
              onClick={openInstagramCreate}
              style={{
                padding: '10px 16px',
                borderRadius: 10,
                border: '0.5px solid #E1306C',
                background: 'rgba(225,48,108,0.08)',
                color: '#c13584',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              Open Instagram
            </button>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: 0, lineHeight: 1.55, maxWidth: 560 }}>
            <strong>Share video</strong> uses your device&apos;s share sheet when supported (often you can send the MP4
            straight to Instagram or YouTube on phones). <strong>Open YouTube upload</strong> and{' '}
            <strong>Open Instagram</strong> jump to each site&apos;s create flow in a new tab — you still pick the MP4
            (usually the file you just downloaded). Instagram Reels are easiest from the mobile app after saving or
            sharing the file.
          </p>
        </div>
      </div>

      <details className={styles.remotionDetails}>
        <summary style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--text-primary)' }}>
          Remotion MP4 (presets, spring fade, data URLs from disk)
        </summary>
        <ol style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, marginTop: 12, paddingLeft: 18 }}>
          <li>
            Copy exported frames into <code>public/reel-remotion-assets/</code> (names matching the JSON below, or any
            names — the CLI sorts alphabetically).
          </li>
          <li>
            Preview: <code style={{ fontSize: 12 }}>npm run remotion:studio</code> — paste props JSON in Remotion (or edit
            defaults in <code>remotion/Root.tsx</code>). Presets: <code>vedaDefault</code>, <code>minimal</code>,{' '}
            <code>bold</code>, <code>chart</code>, <code>cinematic</code> (see dropdown above).
          </li>
          <li>
            Render: <code style={{ fontSize: 12 }}>npm run reel:mp4</code> writes <code>out/reel.mp4</code>. Flags:{' '}
            <code>--images-dir</code>, <code>--output</code>, <code>--title</code>, <code>--seconds-per-image</code>,{' '}
            <code>--durations 2,3,1.5</code> (per image, same order as sorted files),{' '}
            <code>--object-fit cover|contain</code>, <code>--preset chart</code> (optional).
          </li>
        </ol>
        <pre className={styles.remotionPre}>
          {files.length ? remotionPropsSnippet : '// Add images above for a ready-to-paste props example'}
        </pre>
        <button
          type="button"
          onClick={() => void copyProps()}
          disabled={!files.length}
          style={{
            marginTop: 10,
            padding: '8px 14px',
            borderRadius: 8,
            border: '0.5px solid var(--border)',
            background: 'var(--surface-2)',
            cursor: files.length ? 'pointer' : 'not-allowed',
            fontSize: 13,
          }}
        >
          Copy props JSON
        </button>
      </details>
    </div>
  )
}
