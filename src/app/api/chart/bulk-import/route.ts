// ─────────────────────────────────────────────────────────────
//  POST /api/chart/bulk-import
//  Accepts a multipart XLSX file, parses every row, validates
//  required fields, and inserts them as saved charts for the
//  authenticated user.  Returns per-row status so the UI can
//  show which rows succeeded / failed.
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import crypto from 'crypto'
import { auth } from '@/auth'
import connectDB from '@/lib/db/mongodb'
import { Chart } from '@/lib/db/models/Chart'
import { User }  from '@/lib/db/models/User'

export const runtime = 'nodejs'

const PLAN_LIMITS: Record<string, number> = {
  free: 3,
  gold: 1008,
  platinum: Infinity,
}

// Accepted column aliases (case-insensitive, trimmed)
const COL = {
  name:       ['name', 'full name', 'person name', 'person'],
  birthDate:  ['birth date', 'birthdate', 'date of birth', 'dob', 'date'],
  birthTime:  ['birth time', 'birthtime', 'time of birth', 'time'],
  birthPlace: ['birth place', 'birthplace', 'place', 'location', 'city'],
  latitude:   ['latitude', 'lat'],
  longitude:  ['longitude', 'lng', 'lon', 'long'],
  timezone:   ['timezone', 'time zone', 'tz', 'zone'],
  isPublic:   ['ispublic', 'is public', 'public'],
  isPersonal: ['ispersonal', 'is personal', 'personal'],
}

function matchHeader(header: string): string | null {
  const h = header.trim().toLowerCase()
  for (const [field, aliases] of Object.entries(COL)) {
    if (aliases.includes(h)) return field
  }
  return null
}

function coerceBool(v: unknown): boolean {
  if (typeof v === 'boolean') return v
  if (typeof v === 'number')  return v !== 0
  const s = String(v).trim().toLowerCase()
  return s === 'true' || s === 'yes' || s === '1'
}

// Excel stores dates as serial numbers — convert to YYYY-MM-DD
function coerceDate(v: unknown): string | null {
  if (v == null) return null
  if (typeof v === 'number') {
    // xlrd-style serial → JS Date
    const d = XLSX.SSF.parse_date_code(v)
    if (!d) return null
    const mm = String(d.M).padStart(2, '0')
    const dd = String(d.d).padStart(2, '0')
    return `${d.y}-${mm}-${dd}`
  }
  const s = String(v).trim()
  // Accept YYYY-MM-DD or DD/MM/YYYY or DD-MM-YYYY
  const yyyymmdd = s.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (yyyymmdd) return s
  const ddmmyyyy = s.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/)
  if (ddmmyyyy) return `${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}`
  return null
}

function coerceTime(v: unknown): string | null {
  if (v == null) return null
  if (typeof v === 'number') {
    // Fraction of a day
    const totalSecs = Math.round(v * 86400)
    const h = Math.floor(totalSecs / 3600)
    const m = Math.floor((totalSecs % 3600) / 60)
    const s = totalSecs % 60
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
  }
  const s = String(v).trim()
  // Normalise HH:MM → HH:MM:00
  if (/^\d{1,2}:\d{2}$/.test(s)) return `${s.padStart(5,'0')}:00`
  if (/^\d{1,2}:\d{2}:\d{2}$/.test(s)) return s.replace(/^(\d):/, '0$1:')
  return null
}

interface RowResult {
  row:     number
  name:    string
  status:  'success' | 'skipped' | 'error'
  message: string
  chartId?: string
}

export async function POST(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
  }
  const userId = session.user.id

  // ── Parse multipart ───────────────────────────────────────
  const formData = await req.formData().catch(() => null)
  if (!formData) {
    return NextResponse.json({ success: false, error: 'Could not parse form data' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  if (!file) {
    return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 })
  }

  const ext = file.name.split('.').pop()?.toLowerCase()
  if (!['xlsx', 'xls', 'csv'].includes(ext ?? '')) {
    return NextResponse.json({ success: false, error: 'Only .xlsx / .xls / .csv files are supported' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: false })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rawRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, { defval: null })

  if (!rawRows.length) {
    return NextResponse.json({ success: false, error: 'The sheet appears to be empty' }, { status: 400 })
  }

  // ── Connect DB and check plan limit ───────────────────────
  await connectDB()

  const user = await User.findById(userId).select('plan planExpiresAt').lean() as any
  const rawPlan: string = user?.plan ?? 'free'
  const expiry = user?.planExpiresAt
  const effectivePlan = (rawPlan !== 'free' && expiry && new Date(expiry) < new Date()) ? 'free' : rawPlan
  const limit = PLAN_LIMITS[effectivePlan] ?? 3

  let existing = await Chart.countDocuments({ userId })
  const slots = isFinite(limit) ? limit - existing : Infinity

  if (slots <= 0) {
    return NextResponse.json({
      success: false,
      error: `Chart limit reached (${effectivePlan} plan: ${limit} charts). Please upgrade to import more.`,
      limitReached: true,
    }, { status: 403 })
  }

  // ── Map column headers ────────────────────────────────────
  const headerMap: Record<string, string> = {}
  const firstRow = rawRows[0]
  for (const rawKey of Object.keys(firstRow)) {
    const field = matchHeader(rawKey)
    if (field) headerMap[rawKey] = field
  }

  // ── Process rows ──────────────────────────────────────────
  const results: RowResult[] = []
  let successCount = 0
  let importedSoFar = 0

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i]
    const rowNum = i + 2 // 1-indexed + header row

    // Map raw keys → canonical field names
    const mapped: Record<string, unknown> = {}
    for (const [rawKey, field] of Object.entries(headerMap)) {
      mapped[field] = row[rawKey]
    }

    const name       = mapped.name       ? String(mapped.name).trim()       : ''
    const birthPlace = mapped.birthPlace ? String(mapped.birthPlace).trim() : ''
    const timezone   = mapped.timezone   ? String(mapped.timezone).trim()   : ''
    const birthDate  = coerceDate(mapped.birthDate)
    const birthTime  = coerceTime(mapped.birthTime)
    const lat        = parseFloat(String(mapped.latitude  ?? ''))
    const lng        = parseFloat(String(mapped.longitude ?? ''))

    // Validate
    const errors: string[] = []
    if (!name)       errors.push('Name is required')
    if (!birthDate)  errors.push('Birth Date is missing or invalid (use YYYY-MM-DD)')
    if (!birthTime)  errors.push('Birth Time is missing or invalid (use HH:MM or HH:MM:SS)')
    if (!birthPlace) errors.push('Birth Place is required')
    if (isNaN(lat))  errors.push('Latitude must be a number')
    if (isNaN(lng))  errors.push('Longitude must be a number')
    if (!timezone)   errors.push('Timezone is required (e.g. Asia/Kolkata)')

    if (errors.length) {
      results.push({ row: rowNum, name: name || `Row ${rowNum}`, status: 'error', message: errors.join('; ') })
      continue
    }

    // Respect plan slot limit
    if (importedSoFar >= slots) {
      results.push({
        row: rowNum, name,
        status: 'skipped',
        message: `Skipped — chart limit reached for ${effectivePlan} plan`,
      })
      continue
    }

    const isPublic   = coerceBool(mapped.isPublic)
    const isPersonal = coerceBool(mapped.isPersonal)
    const slug       = isPublic ? crypto.randomBytes(5).toString('hex') : null

    try {
      const chart = await Chart.create({
        userId,
        name,
        birthDate,
        birthTime: birthTime!.length === 5 ? birthTime + ':00' : birthTime,
        birthPlace,
        latitude:  lat,
        longitude: lng,
        timezone,
        settings:  {},
        isPublic,
        isPersonal,
        slug,
      })

      results.push({ row: rowNum, name, status: 'success', message: 'Imported', chartId: chart._id.toString() })
      successCount++
      importedSoFar++
    } catch (err: any) {
      results.push({ row: rowNum, name, status: 'error', message: err?.message ?? 'DB insert failed' })
    }
  }

  return NextResponse.json({
    success:      true,
    imported:     successCount,
    total:        rawRows.length,
    results,
  })
}
