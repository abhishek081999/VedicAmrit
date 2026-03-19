// ─────────────────────────────────────────────────────────────
//  src/components/chakra/SarvatobhadraChakra.tsx
//  Sarvatobhadra Chakra (SBC) — classical Muhurta grid
//
//  Structure:
//   - 9×9 grid = 81 cells
//   - Outer ring (border cells):  27 Nakshatras + 4 corners (directions)
//   - Second ring:                Tithi (30 tithis distributed)
//   - Third ring:                 Vara (weekday lords)
//   - Inner ring:                 Vowels / Consonants (for Vedha analysis)
//   - Centre cell (5,5):          "Brahma" — the focal point
//
//  Nakshatra ring layout (outer 28 cells, 4 corners = directions):
//   Starting from top-left corner going clockwise:
//   N (top row L→R): Nak 1–7  (Ashwini → Punarvasu)  +  NE corner
//   E (right col T→B): Nak 8–14 (Pushya → Vishakha)  +  SE corner
//   S (bottom row R→L): Nak 15–21 (Anuradha → Dhanishtha) + SW corner
//   W (left col B→T): Nak 22–27 + Nak 0 (Shatabhisha, PBhadra, UBhadra,
//                                         Revati, Ashwini partial, Bharani)
//                      + NW corner
//
//  The 4 corner cells show the cardinal directions:
//   TL=NW, TR=NE, BR=SE, BL=SW
//
//  Grahas are placed on their birth nakshatra cell with a coloured dot.
//  Tithi number shows in second ring. Vara lord shows in third ring.
//
//  Reference: Phaladeepika Ch. 26, K.N. Rao's Muhurta texts
// ─────────────────────────────────────────────────────────────
'use client'

import type { GrahaData, GrahaId } from '@/types/astrology'
import { NAKSHATRA_NAMES, NAKSHATRA_LORDS } from '@/types/astrology'

// ── Nakshatra ring — 28 outer cells (27 nakshatras + 4 corners) ──
// The outer ring goes clockwise from top-left corner.
// We map each of the 36 border cells of the 9×9 grid:
//   top row    (row=0, col=0..8)  = 9 cells
//   right col  (col=8, row=1..8)  = 8 cells  (not re-counting corners)
//   bottom row (row=8, col=7..0)  = 8 cells
//   left col   (col=0, row=7..1)  = 7 cells
// Total = 32 border cells. We use only the non-corner 28 for nakshatras.

// Mapping: nakshatra index (0–26) → [row, col] in the 9×9 grid
// Layout (clockwise from top-left, corners at col 0/8 × row 0/8):
//
//  TL  N1  N2  N3  N4  N5  N6  N7  TR
//  N27  ·   ·   ·   ·   ·   ·   ·  N8
//  N26  ·   ·   ·   ·   ·   ·   ·  N9
//  N25  ·   ·   ·   ·   ·   ·   · N10
//  N24  ·   ·   ·   ·   ·   ·   · N11
//  N23  ·   ·   ·   ·   ·   ·   · N12
//  N22  ·   ·   ·   ·   ·   ·   · N13
//  N21  ·   ·   ·   ·   ·   ·   · N14
//  BL N20 N19 N18 N17 N16 N15 N14c BR
//
//  Wait — we have 27 nakshatras and 28 non-corner border cells.
//  The 28th cell gets a special label "Abhijit" (the 28th nakshatra).

// 9×9 = 81 cells. Border positions (row, col):
// top row: (0,0)..(0,8)  → 9 cells
// right col (excluding corners): (1,8)..(7,8) → 7 cells
// bottom row: (8,8)..(8,0) → 9 cells
// left col (excluding corners): (7,0)..(1,0) → 7 cells
// Total border = 32, corners = 4, edge non-corner = 28

// The 28 non-corner edge cells clockwise starting from (0,1):
function buildNakshatraMap(): Record<number, { row: number; col: number }> {
  const cells: [number, number][] = []
  // Top row left-to-right (skip corners)
  for (let c = 1; c <= 7; c++) cells.push([0, c])
  // Right col top-to-bottom (skip corners)
  for (let r = 1; r <= 7; r++) cells.push([r, 8])
  // Bottom row right-to-left (skip corners)
  for (let c = 7; c >= 1; c--) cells.push([8, c])
  // Left col bottom-to-top (skip corners)
  for (let r = 7; r >= 1; r--) cells.push([r, 0])
  // Now we have 28 cells. Assign nakshatras 0–26 + Abhijit at index 27

  const map: Record<number, { row: number; col: number }> = {}
  for (let i = 0; i <= 27; i++) {
    map[i] = { row: cells[i][0], col: cells[i][1] }
  }
  return map
}

const NAK_CELL = buildNakshatraMap()

// 4 corner cells — cardinal directions
const CORNERS: Record<string, [number, number]> = {
  NW: [0, 0], NE: [0, 8],
  SE: [8, 8], SW: [8, 0],
}
const CORNER_LABELS: Record<string, string> = {
  NW: 'NW', NE: 'NE', SE: 'SE', SW: 'SW',
}

// Tithi ring — second ring (cells at distance 1 from border)
// 30 tithis arranged clockwise, starting from top at (1,1)
// The second ring has 24 cells:
// top: (1,1)..(1,7)=7, right: (2,7)..(6,7)=5, bottom: (7,7)..(7,1)=7, left: (6,1)..(2,1)=5
function buildTithiMap(): Record<number, { row: number; col: number }> {
  const cells: [number, number][] = []
  for (let c = 1; c <= 7; c++) cells.push([1, c])
  for (let r = 2; r <= 7; r++) cells.push([r, 7])
  for (let c = 6; c >= 1; c--) cells.push([7, c])
  for (let r = 6; r >= 2; r--) cells.push([r, 1])
  // 24 cells for 30 tithis — some cells hold multiple tithis
  const map: Record<number, { row: number; col: number }> = {}
  for (let t = 0; t < 30; t++) {
    const [row, col] = cells[t % cells.length]; map[t] = { row, col }
  }
  return map
}

const TITHI_CELL = buildTithiMap()

// Vara ring — third ring
// 7 weekday lords in 20 inner-ring cells:
// cells at distance 2 from border
function buildVaraMap(): Record<number, { row: number; col: number }> {
  const varaLords: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa']
  // Third ring top: (2,2)..(2,6)=5, right: (3,6)..(5,6)=3, bottom: (6,6)..(6,2)=5, left: (5,2)..(3,2)=3 = 16
  const cells: [number, number][] = []
  for (let c = 2; c <= 6; c++) cells.push([2, c])
  for (let r = 3; r <= 5; r++) cells.push([r, 6])
  for (let c = 5; c >= 2; c--) cells.push([6, c])
  for (let r = 5; r >= 3; r--) cells.push([r, 2])
  const map: Record<number, { row: number; col: number }> = {}
  for (let i = 0; i < 7; i++) {
    const [row, col] = cells[i % cells.length]; map[i] = { row, col }
  }
  return map
}

const VARA_CELL = buildVaraMap()

// Inner 9 cells (3×3 centre: rows 3-5, cols 3-5)
// Centre = (4,4) = Brahma
// These 8 surrounding cells show vowel/consonant groups (Aksharas)
// for Vedha analysis (used in SBC Muhurta)
const AKSHARA_CELLS: Array<{ row: number; col: number; label: string }> = [
  { row: 3, col: 3, label: 'ka' },
  { row: 3, col: 4, label: 'cha' },
  { row: 3, col: 5, label: 'ṭa' },
  { row: 4, col: 3, label: 'ta' },
  { row: 4, col: 5, label: 'pa' },
  { row: 5, col: 3, label: 'ya' },
  { row: 5, col: 4, label: 'śa' },
  { row: 5, col: 5, label: 'ha' },
]

// ── Dignity colour (same palette as other chakras) ────────────

function dignityColor(dignity: string, isRetro: boolean): string {
  if (isRetro) return '#d4788a'
  switch (dignity) {
    case 'exalted':      return '#4ecdc4'
    case 'moolatrikona': return '#c9a84c'
    case 'own':          return '#e2c97e'
    case 'debilitated':  return '#e07070'
    default:             return '#c8c0e0'
  }
}

// Graha dot colours (for the nakshatra ring indicators)
const GRAHA_DOT: Record<GrahaId, string> = {
  Su: '#e8b84b', Mo: '#d0e8f0', Ma: '#e07070',
  Me: '#78d478', Ju: '#f0c878', Ve: '#e8b0d8',
  Sa: '#9090c0', Ra: '#8878b0', Ke: '#c0b490',
}

// Short nakshatra names for the small grid cells
const NAK_SHORT: string[] = [
  'Aśw', 'Bha', 'Kṛt', 'Roh', 'Mṛg', 'Ārd', 'Pun',
  'Puṣ', 'Āśl', 'Mag', 'PPh', 'UPh', 'Has', 'Chi', 'Swā',
  'Viś', 'Anu', 'Jye', 'Mūl', 'PĀṣ', 'UĀṣ', 'Śra',
  'Dha', 'Śat', 'PBh', 'UBh', 'Rev',
]

// ── Props ─────────────────────────────────────────────────────

interface SarvatobhadraProps {
  grahas:        GrahaData[]      // all 9 grahas with nakshatraIndex
  moonNakIndex:  number           // 0–26, birth nakshatra of Moon
  tithiNumber:   number           // 1–30, current tithi
  varaNumber:    number           // 0=Sun … 6=Sat
  size?:         number
  showGrahas?:   boolean          // show graha indicators on nak cells
  showTithi?:    boolean
  showVara?:     boolean
  showAkshara?:  boolean
}

// ── Component ─────────────────────────────────────────────────

export function SarvatobhadraChakra({
  grahas,
  moonNakIndex,
  tithiNumber,
  varaNumber,
  size = 486,   // 9×54 = perfect for 54px cells
  showGrahas   = true,
  showTithi    = true,
  showVara     = true,
  showAkshara  = true,
}: SarvatobhadraProps) {
  const GRID = 9
  const cell = size / GRID

  // Build a lookup: nakshatraIndex → array of grahas in that nak
  const byNak: Record<number, GrahaData[]> = {}
  if (showGrahas) {
    for (const g of grahas) {
      const idx = g.nakshatraIndex
      if (!byNak[idx]) byNak[idx] = []
      byNak[idx].push(g)
    }
  }

  // Font sizes
  const fs = {
    nak:    Math.round(cell * 0.16),   // nakshatra short name
    lord:   Math.round(cell * 0.13),   // nakshatra lord
    tithi:  Math.round(cell * 0.17),
    vara:   Math.round(cell * 0.16),
    aksh:   Math.round(cell * 0.18),
    brahma: Math.round(cell * 0.16),
    dot:    Math.round(cell * 0.11),   // graha dot label
    dir:    Math.round(cell * 0.14),   // corner direction
  }

  function cx(col: number) { return col * cell + cell / 2 }
  function cy(row: number) { return row * cell + cell / 2 }

  // Highlight the Moon's birth nakshatra cell
  const moonCell = NAK_CELL[moonNakIndex]

  // Tithi cell for current tithi (1-based → 0-based)
  const tithiCell = showTithi
    ? TITHI_CELL[(tithiNumber - 1) % 30]
    : null

  // Vara cell
  const varaCell = showVara ? VARA_CELL[varaNumber % 7] : null

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
      aria-label="Sarvatobhadra Chakra"
    >
      {/* Background */}
      <rect width={size} height={size} fill="var(--surface-1, #1a1a2e)" rx="8" />

      {/* ── Full grid lines ─────────────────────────────────── */}
      <g stroke="rgba(201,168,76,0.12)" strokeWidth="0.5">
        {Array.from({ length: GRID + 1 }, (_, i) => (
          <g key={i}>
            <line x1={i * cell} y1={0} x2={i * cell} y2={size} />
            <line x1={0} y1={i * cell} x2={size} y2={i * cell} />
          </g>
        ))}
      </g>

      {/* ── Ring backgrounds ─────────────────────────────────── */}

      {/* Nakshatra ring (outer) */}
      {Array.from({ length: GRID }, (_, r) =>
        Array.from({ length: GRID }, (_, c) => {
          const isOuter = r === 0 || r === 8 || c === 0 || c === 8
          if (!isOuter) return null
          const isCorner = (r === 0 || r === 8) && (c === 0 || c === 8)
          return (
            <rect
              key={`bg-${r}-${c}`}
              x={c * cell + 0.5} y={r * cell + 0.5}
              width={cell - 1} height={cell - 1}
              fill={
                isCorner
                  ? 'rgba(201,168,76,0.04)'
                  : 'rgba(255,255,255,0.018)'
              }
              stroke="none"
            />
          )
        })
      )}

      {/* Tithi ring (second ring) */}
      {[1, 7].map((r) =>
        Array.from({ length: 7 }, (_, i) => (
          <rect
            key={`tithi-top-${r}-${i + 1}`}
            x={(i + 1) * cell + 0.5} y={r * cell + 0.5}
            width={cell - 1} height={cell - 1}
            fill="rgba(180,140,220,0.04)"
            stroke="none"
          />
        ))
      )}
      {[1, 7].map((c) =>
        Array.from({ length: 5 }, (_, i) => (
          <rect
            key={`tithi-side-${c}-${i + 2}`}
            x={c * cell + 0.5} y={(i + 2) * cell + 0.5}
            width={cell - 1} height={cell - 1}
            fill="rgba(180,140,220,0.04)"
            stroke="none"
          />
        ))
      )}

      {/* Vara ring (third ring) */}
      {[2, 6].map((r) =>
        Array.from({ length: 5 }, (_, i) => (
          <rect
            key={`vara-h-${r}-${i + 2}`}
            x={(i + 2) * cell + 0.5} y={r * cell + 0.5}
            width={cell - 1} height={cell - 1}
            fill="rgba(100,180,140,0.04)"
            stroke="none"
          />
        ))
      )}
      {[2, 6].map((c) =>
        Array.from({ length: 3 }, (_, i) => (
          <rect
            key={`vara-v-${c}-${i + 3}`}
            x={c * cell + 0.5} y={(i + 3) * cell + 0.5}
            width={cell - 1} height={cell - 1}
            fill="rgba(100,180,140,0.04)"
            stroke="none"
          />
        ))
      )}

      {/* ── Moon birth nakshatra highlight ───────────────────── */}
      {moonCell && (
        <rect
          x={moonCell.col * cell + 1} y={moonCell.row * cell + 1}
          width={cell - 2} height={cell - 2}
          fill="rgba(208,232,240,0.12)"
          stroke="rgba(208,232,240,0.5)"
          strokeWidth="1.5"
          rx="2"
        />
      )}

      {/* ── Current Tithi highlight ───────────────────────────── */}
      {tithiCell && (
        <rect
          x={tithiCell.col * cell + 1} y={tithiCell.row * cell + 1}
          width={cell - 2} height={cell - 2}
          fill="rgba(180,140,220,0.10)"
          stroke="rgba(180,140,220,0.4)"
          strokeWidth="1"
          rx="2"
        />
      )}

      {/* ── Current Vara highlight ────────────────────────────── */}
      {varaCell && (
        <rect
          x={varaCell.col * cell + 1} y={varaCell.row * cell + 1}
          width={cell - 2} height={cell - 2}
          fill="rgba(100,180,140,0.10)"
          stroke="rgba(100,180,140,0.4)"
          strokeWidth="1"
          rx="2"
        />
      )}

      {/* ── Corner direction labels ───────────────────────────── */}
      {Object.entries(CORNERS).map(([dir, [r, c]]) => (
        <g key={`corner-${dir}`}>
          <text
            x={cx(c)} y={cy(r) + fs.dir * 0.4}
            fontSize={fs.dir}
            fill="rgba(201,168,76,0.4)"
            fontFamily="Cormorant Garamond, serif"
            textAnchor="middle"
            letterSpacing="1"
          >
            {CORNER_LABELS[dir]}
          </text>
        </g>
      ))}

      {/* ── Nakshatra cells ───────────────────────────────────── */}
      {Array.from({ length: 28 }, (_, i) => {
        const { row, col } = NAK_CELL[i]
        const nakName = i < 27 ? NAK_SHORT[i] : 'Abh'    // Abhijit at index 27
        const lord    = i < 27 ? NAKSHATRA_LORDS[i] : 'Su' as GrahaId
        const isMoon  = i === moonNakIndex
        const nakGrahas = byNak[i] ?? []

        return (
          <g key={`nak-${i}`}>
            {/* Nakshatra short name */}
            <text
              x={cx(col)} y={cy(row) - fs.nak * 0.55}
              fontSize={fs.nak}
              fill={isMoon ? '#d0e8f0' : 'rgba(201,168,76,0.75)'}
              fontFamily="Cormorant Garamond, serif"
              fontWeight={isMoon ? '600' : '400'}
              textAnchor="middle"
            >
              {nakName}
            </text>

            {/* Lord */}
            <text
              x={cx(col)} y={cy(row) + fs.lord * 0.6}
              fontSize={fs.lord}
              fill={isMoon ? 'rgba(208,232,240,0.65)' : 'rgba(201,168,76,0.35)'}
              fontFamily="Cormorant Garamond, serif"
              textAnchor="middle"
            >
              {lord}
            </text>

            {/* Nakshatra index number (tiny, top-left of cell) */}
            <text
              x={col * cell + cell * 0.1}
              y={row * cell + cell * 0.2}
              fontSize={fs.nak * 0.7}
              fill="rgba(201,168,76,0.2)"
              fontFamily="Cormorant Garamond, serif"
            >
              {i + 1}
            </text>

            {/* Graha dots for planets in this nakshatra */}
            {nakGrahas.map((g, gi) => {
              const dotX = col * cell + cell * 0.15 + gi * cell * 0.25
              const dotY = row * cell + cell * 0.8
              return (
                <g key={`dot-${g.id}`}>
                  <circle
                    cx={dotX + cell * 0.08}
                    cy={dotY - cell * 0.02}
                    r={cell * 0.065}
                    fill={dignityColor(g.dignity, g.isRetro)}
                    opacity="0.85"
                  />
                  <text
                    x={dotX + cell * 0.22}
                    y={dotY + fs.dot * 0.38}
                    fontSize={fs.dot}
                    fill={dignityColor(g.dignity, g.isRetro)}
                    fontFamily="Cormorant Garamond, serif"
                    fontWeight="500"
                  >
                    {g.id}
                  </text>
                </g>
              )
            })}
          </g>
        )
      })}

      {/* ── Tithi labels (second ring) ────────────────────────── */}
      {showTithi && Array.from({ length: 30 }, (_, t) => {
        const { row, col } = TITHI_CELL[t]
        const isCurrentTithi = t === (tithiNumber - 1) % 30
        // Multiple tithis can map to same cell — show comma-separated numbers
        const cellTithis = Array.from({ length: 30 }, (_, i) => i)
          .filter((i) => TITHI_CELL[i].row === row && TITHI_CELL[i].col === col)
        if (cellTithis[0] !== t) return null  // only render once per cell

        return (
          <text
            key={`tithi-${t}`}
            x={cx(col)}
            y={cy(row) + fs.tithi * 0.4}
            fontSize={fs.tithi}
            fill={isCurrentTithi ? 'rgba(180,140,220,0.9)' : 'rgba(180,140,220,0.35)'}
            fontFamily="Cormorant Garamond, serif"
            fontWeight={isCurrentTithi ? '600' : '400'}
            textAnchor="middle"
          >
            {cellTithis.map((i) => i + 1).join('/')}
          </text>
        )
      })}

      {/* ── Vara labels (third ring) ──────────────────────────── */}
      {showVara && (['Su','Mo','Ma','Me','Ju','Ve','Sa'] as GrahaId[]).map((lord, i) => {
        const { row, col } = VARA_CELL[i]
        const isCurrent = i === varaNumber % 7
        return (
          <text
            key={`vara-${i}`}
            x={cx(col)}
            y={cy(row) + fs.vara * 0.4}
            fontSize={fs.vara}
            fill={isCurrent ? 'rgba(100,210,160,0.9)' : 'rgba(100,180,140,0.35)'}
            fontFamily="Cormorant Garamond, serif"
            fontWeight={isCurrent ? '600' : '400'}
            textAnchor="middle"
          >
            {lord}
          </text>
        )
      })}

      {/* ── Akshara (consonant group) inner ring ─────────────── */}
      {showAkshara && AKSHARA_CELLS.map(({ row, col, label }) => (
        <text
          key={`aksh-${label}`}
          x={cx(col)} y={cy(row) + fs.aksh * 0.4}
          fontSize={fs.aksh}
          fill="rgba(184,176,212,0.4)"
          fontFamily="Cormorant Garamond, serif"
          fontStyle="italic"
          textAnchor="middle"
        >
          {label}
        </text>
      ))}

      {/* ── Centre: Brahma ───────────────────────────────────── */}
      <rect
        x={4 * cell + 2} y={4 * cell + 2}
        width={cell - 4} height={cell - 4}
        fill="rgba(201,168,76,0.06)"
        stroke="rgba(201,168,76,0.3)"
        strokeWidth="1"
        rx="3"
      />
      <text
        x={cx(4)} y={cy(4) - fs.brahma * 0.5}
        fontSize={fs.brahma}
        fill="rgba(201,168,76,0.65)"
        fontFamily="Cormorant Garamond, serif"
        fontStyle="italic"
        textAnchor="middle"
      >
        Brahma
      </text>
      {/* Decorative star / asterisk in centre */}
      <g
        transform={`translate(${cx(4)}, ${cy(4) + fs.brahma * 0.6})`}
        stroke="rgba(201,168,76,0.35)"
        strokeWidth="0.8"
        strokeLinecap="round"
      >
        {[0, 45, 90, 135].map((deg) => {
          const r  = cell * 0.18
          const rd = (deg * Math.PI) / 180
          return (
            <line
              key={deg}
              x1={-Math.cos(rd) * r} y1={-Math.sin(rd) * r}
              x2={Math.cos(rd) * r}  y2={Math.sin(rd) * r}
            />
          )
        })}
      </g>

      {/* ── Ring border emphasis lines ────────────────────────── */}
      <g stroke="rgba(201,168,76,0.25)" strokeWidth="0.75" fill="none">
        {/* Outer nakshatra ring border (inner edge) */}
        <rect x={cell} y={cell} width={cell * 7} height={cell * 7} />
        {/* Tithi ring border (inner edge) */}
        <rect x={cell * 2} y={cell * 2} width={cell * 5} height={cell * 5} />
        {/* Vara ring border (inner edge) */}
        <rect x={cell * 3} y={cell * 3} width={cell * 3} height={cell * 3} />
      </g>

      {/* ── Outer border of entire chart ─────────────────────── */}
      <rect
        x={0.5} y={0.5}
        width={size - 1} height={size - 1}
        fill="none"
        stroke="rgba(201,168,76,0.35)"
        strokeWidth="1"
        rx="8"
      />
    </svg>
  )
}
