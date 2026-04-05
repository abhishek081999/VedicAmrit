/**
 * Parse a coordinate string (Decimal or DMS) into decimal degrees.
 * Supports:
 * - 73.31
 * - 73:31
 * - 73 31
 * - 73°31'
 */
export function parseCoordinate(val: string): number {
  if (!val) return 0
  const clean = val.trim()
  
  // Try simple float first (must contain a dot and no colon/space/degree)
  if (/^-?\d+\.\d+$/.test(clean) && !/[\s:°'"]/.test(clean)) {
    return parseFloat(clean)
  }

  // Handle DMS formats
  // Regex to find up to 3 numeric parts
  const parts = clean.split(/[:\s°'"]+/).filter(p => p.length > 0)
  if (parts.length >= 1) {
    const d = parseFloat(parts[0]) || 0
    const m = parseFloat(parts[1]) || 0
    const s = parseFloat(parts[2]) || 0
    
    const sign = d < 0 ? -1 : 1
    const absD = Math.abs(d)
    
    return sign * (absD + m / 60 + s / 3600)
  }

  return parseFloat(clean) || 0
}
