/**
 * Routes that should not trigger the birth-details drawer when no chart is loaded.
 * Pañcāṅga / calendar: optional defaults on-page.
 * Compare (/compare): collects Chart A & B on the page itself.
 */
export function routeAllowsWithoutChart(hrefOrPath: string): boolean {
  const path = (hrefOrPath.split('?')[0] || '').replace(/\/+$/, '') || '/'
  return (
    path.startsWith('/prashna') ||
    path.startsWith('/panchang') ||
    path.startsWith('/compare')
  )
}
