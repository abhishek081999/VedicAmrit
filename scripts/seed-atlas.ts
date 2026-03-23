#!/usr/bin/env tsx
// ─────────────────────────────────────────────────────────────
//  scripts/seed-atlas.ts
//  Import GeoNames allCountries.txt → SQLite FTS5 atlas.db
//
//  HOW TO RUN:
//    1. Download: https://download.geonames.org/export/dump/allCountries.zip
//    2. Unzip to: scripts/allCountries.txt  (~350MB)
//    3. Run: npm run seed:atlas
//
//  OUTPUT: src/lib/atlas/atlas.db  (~180MB)
//  TIME:   ~3–5 minutes for 5.1M rows
//
//  GeoNames TSV columns (tab-separated):
//   0: geonameid   1: name        2: asciiname   3: alternatenames
//   4: latitude    5: longitude   6: feature_class  7: feature_code
//   8: country_code 9: cc2       10: admin1_code  11: admin2_code
//  12: admin3_code 13: admin4_code 14: population  15: elevation
//  16: dem         17: timezone   18: modification_date
// ─────────────────────────────────────────────────────────────

import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'
import readline from 'readline'

// ── Config ────────────────────────────────────────────────────

const INPUT_FILE  = path.join(process.cwd(), 'scripts', 'allCountries.txt')
const OUTPUT_DIR  = path.join(process.cwd(), 'src', 'lib', 'atlas')
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'atlas.db')

// Only keep populated places + major geographic features
// P = populated place, A = administrative area, T = mountain/island (useful for charts)
const KEEP_FEATURES = new Set(['P', 'A'])

// Minimum population for P-class features (skip tiny villages < 500)
// Set to 0 to include all populated places
const MIN_POPULATION = 500

// ── Admin1 code → name mapping (populated from admin1CodesASCII.txt if available) ──
// Fallback: use the code itself
const admin1Names: Map<string, string> = new Map()

async function loadAdmin1Names(): Promise<void> {
  const admin1File = path.join(process.cwd(), 'scripts', 'admin1CodesASCII.txt')
  if (!fs.existsSync(admin1File)) {
    console.log('admin1CodesASCII.txt not found — admin1 names will use codes')
    return
  }

  const rl = readline.createInterface({
    input: fs.createReadStream(admin1File),
    crlfDelay: Infinity,
  })

  for await (const line of rl) {
    const parts = line.split('\t')
    if (parts.length >= 2) {
      admin1Names.set(parts[0], parts[1])  // e.g. "IN.MH" → "Maharashtra"
    }
  }

  console.log(`Loaded ${admin1Names.size} admin1 names`)
}

// ── Main ──────────────────────────────────────────────────────

async function main() {
  console.log('=== Jyotish Atlas Seeder ===')
  console.log(`Input:  ${INPUT_FILE}`)
  console.log(`Output: ${OUTPUT_FILE}`)

  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`\nERROR: ${INPUT_FILE} not found`)
    console.error('Download from: https://download.geonames.org/export/dump/allCountries.zip')
    process.exit(1)
  }

  // Create output directory
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })

  // Remove old DB if exists
  if (fs.existsSync(OUTPUT_FILE)) {
    fs.unlinkSync(OUTPUT_FILE)
    console.log('Removed old atlas.db')
  }

  // Load admin1 names
  await loadAdmin1Names()

  // Open SQLite
  const db = new Database(OUTPUT_FILE)
  db.pragma('journal_mode = WAL')
  db.pragma('synchronous = NORMAL')
  db.pragma('cache_size = -64000')   // 64MB cache
  db.pragma('temp_store = memory')

  // ── Create tables ────────────────────────────────────────

  db.exec(`
    -- Main locations table
    CREATE TABLE IF NOT EXISTS locations (
      id          INTEGER PRIMARY KEY,
      name        TEXT NOT NULL,
      ascii_name  TEXT NOT NULL,
      country     TEXT NOT NULL,
      admin1      TEXT NOT NULL,
      latitude    REAL NOT NULL,
      longitude   REAL NOT NULL,
      timezone    TEXT NOT NULL,
      population  INTEGER NOT NULL DEFAULT 0,
      feature     TEXT NOT NULL DEFAULT 'P'
    );

    -- FTS5 virtual table for fast prefix search
    CREATE VIRTUAL TABLE IF NOT EXISTS locations_fts USING fts5(
      name,
      ascii_name,
      country,
      admin1,
      latitude UNINDEXED,
      longitude UNINDEXED,
      timezone UNINDEXED,
      population UNINDEXED,
      content='locations',
      content_rowid='id',
      tokenize='ascii'
    );
  `)

  // ── Prepared statements ───────────────────────────────────

  const insertLocation = db.prepare(`
    INSERT INTO locations (id, name, ascii_name, country, admin1, latitude, longitude, timezone, population, feature)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  // ── Stream and parse GeoNames file ────────────────────────

  const rl = readline.createInterface({
    input: fs.createReadStream(INPUT_FILE, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  })

  let total     = 0
  let inserted  = 0
  let skipped   = 0
  let batchSize = 0
  const BATCH   = 10_000

  // Use a transaction for performance (10k rows per commit)
  let insertBatch = db.transaction((rows: any[][]) => {
    for (const row of rows) insertLocation.run(...row)
  })

  let batch: any[][] = []

  const processLine = (line: string) => {
    if (!line.trim()) return
    total++

    const cols = line.split('\t')
    if (cols.length < 18) return

    const featureClass = cols[6]
    const population   = parseInt(cols[14] || '0', 10)

    // Filter: only keep useful feature classes
    if (!KEEP_FEATURES.has(featureClass)) {
      skipped++
      return
    }

    // Skip very small places
    if (featureClass === 'P' && population < MIN_POPULATION) {
      skipped++
      return
    }

    const id          = parseInt(cols[0], 10)
    const name        = cols[1]?.trim()
    const asciiName   = cols[2]?.trim() || name
    const country     = cols[8]?.trim() || ''
    const admin1Code  = cols[10]?.trim() || ''
    const latitude    = parseFloat(cols[4])
    const longitude   = parseFloat(cols[5])
    const timezone    = cols[17]?.trim() || 'UTC'

    if (!name || isNaN(latitude) || isNaN(longitude)) return

    // Look up admin1 name (e.g., "IN.MH" → "Maharashtra")
    const admin1Key  = `${country}.${admin1Code}`
    const admin1Name = admin1Names.get(admin1Key) || admin1Code

    batch.push([id, name, asciiName, country, admin1Name, latitude, longitude, timezone, population, featureClass])
    inserted++
    batchSize++

    if (batchSize >= BATCH) {
      insertBatch(batch as any)
      batch = []
      batchSize = 0
      process.stdout.write(`\r  Inserted: ${inserted.toLocaleString()} / Skipped: ${skipped.toLocaleString()} / Total: ${total.toLocaleString()}`)
    }
  }

  console.log('\nProcessing GeoNames data...')
  for await (const line of rl) {
    processLine(line)
  }

  // Final batch
  if (batch.length > 0) {
    insertBatch(batch as any)
  }

  console.log(`\n\nInserted: ${inserted.toLocaleString()} locations`)
  console.log(`Skipped:  ${skipped.toLocaleString()} (small villages / non-place features)`)

  // ── Build FTS5 index ──────────────────────────────────────

  console.log('\nBuilding FTS5 index...')
  db.exec(`INSERT INTO locations_fts(locations_fts) VALUES('rebuild')`)

  // ── Create regular indexes ────────────────────────────────

  console.log('Creating indexes...')
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_locations_country ON locations(country);
    CREATE INDEX IF NOT EXISTS idx_locations_pop ON locations(population DESC);
  `)

  // ── Stats ─────────────────────────────────────────────────

  const count = (db.prepare('SELECT COUNT(*) as n FROM locations').get() as any).n
  const size  = fs.statSync(OUTPUT_FILE).size

  console.log(`\n=== Done ===`)
  console.log(`Rows in DB: ${count.toLocaleString()}`)
  console.log(`DB size:    ${(size / 1024 / 1024).toFixed(1)} MB`)
  console.log(`Output:     ${OUTPUT_FILE}`)

  db.close()

  // ── Test query ────────────────────────────────────────────

  console.log('\nRunning test query: "Mumbai"...')
  const testDb   = new Database(OUTPUT_FILE, { readonly: true })
  const testStmt = testDb.prepare(`
    SELECT name, country, admin1, latitude, longitude, timezone
    FROM locations_fts
    WHERE locations_fts MATCH '"Mumbai"*'
    ORDER BY rank, population DESC
    LIMIT 5
  `)
  const results = testStmt.all()
  if (results.length > 0) {
    console.log('Test results:')
    results.forEach((r: any) => console.log(`  ${r.name}, ${r.admin1}, ${r.country} — ${r.latitude}, ${r.longitude}`))
  } else {
    console.warn('  No results found — FTS index may need rebuild')
  }
  testDb.close()
}

main().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
