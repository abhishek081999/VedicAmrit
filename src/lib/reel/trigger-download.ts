/**
 * Trigger a file download from a Blob. Defers revokeObjectURL so the browser can start the save.
 */
export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.style.display = 'none'
  a.setAttribute('rel', 'noopener')
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.setTimeout(() => URL.revokeObjectURL(url), 120_000)
}
