/** YouTube web upload (user picks the exported MP4). */
export const YOUTUBE_UPLOAD_URL = 'https://www.youtube.com/upload'

/**
 * Instagram create flow in the browser (requires login). Reels are often finished in the mobile app;
 * this link still helps users get to the right place.
 */
export const INSTAGRAM_CREATE_URL = 'https://www.instagram.com/vedaanshlife'

export type ShareMp4Result = 'shared' | 'unavailable' | 'cancelled' | 'error'

/**
 * Native share sheet (common on mobile) with the MP4 file — user can pick Instagram, YouTube, Drive, etc.
 */
export async function shareMp4File(blob: Blob, filename: string): Promise<ShareMp4Result> {
  if (typeof navigator === 'undefined' || !navigator.share) return 'unavailable'

  const file = new File([blob], filename.endsWith('.mp4') ? filename : `${filename}.mp4`, {
    type: 'video/mp4',
  })

  const payload: ShareData = {
    files: [file],
    title: 'Reel video',
  }

  if (typeof navigator.canShare === 'function' && !navigator.canShare(payload)) {
    return 'unavailable'
  }

  try {
    await navigator.share(payload)
    return 'shared'
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled'
    if (e instanceof Error && e.name === 'AbortError') return 'cancelled'
    return 'error'
  }
}

export function openYouTubeUpload(): void {
  window.open(YOUTUBE_UPLOAD_URL, '_blank', 'noopener,noreferrer')
}

export function openInstagramCreate(): void {
  window.open(INSTAGRAM_CREATE_URL, '_blank', 'noopener,noreferrer')
}
