# Jyotish Platform

A full-stack **Vedic Astrology** web application built with **Next.js 14** and **TypeScript**. Provides precise ephemeris-based chart calculations, Panchang elements, Vimshottari Dasha timelines, divisional charts (Vargas), and interactive chart rendering — all powered by Swiss Ephemeris.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 |
| Ephemeris | Swiss Ephemeris (`sweph`) |
| Database | MongoDB (Mongoose) + SQLite (local geo atlas) |
| Auth | NextAuth v5 (credentials + OAuth) |
| Cache | Upstash Redis (optional) |
| Payments | Razorpay · Stripe |
| Email | Resend |
| UI | Radix UI · Lucide Icons · TailwindCSS |
| State | Zustand |
| Testing | Vitest |

---

## Key Features

- **Precise Calculations**: Powered by Swiss Ephemeris for planetary positions, dignities, and dashas.
- **Dynamic Theming**: Premium **Light** and **Dark** modes with high-contrast astrological charts.
- **Advanced Chart Settings**: 
    - **Live Scaling**: Independently adjust sizes for Planets, Arudhas, and Degree details.
    - **Flexible Layouts**: Compare Varga charts using **Side-by-Side** or **Stacked** orientations.
    - **Overcrowding Handling**: Intelligent "Zig-Zag" planet positioning to prevent overlapping text.
    - **Arudha Clustering**: Short-labeled Arudha Padas are automatically grouped to fit inside house boundaries.
- **Divisional Charts (Vargas)**: Instant switching between D1 (Rashi) to D60 (Shastyamsha).
- **Vimshottari Dasha**: Hierarchical timeline view of Maha, Antar, and Pratyantar dashas.


---

## Project Structure

```
jyotish-platform/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── chart/calculate/    # POST — birth chart calculation
│   │   │   ├── panchang/           # GET  — daily panchang
│   │   │   ├── atlas/search/       # GET  — location search
│   │   │   └── auth/               # NextAuth route handlers
│   │   ├── layout.tsx              # Root layout
│   │   ├── page.tsx                # Main calculator UI
│   │   └── globals.css             # Global styles
│   ├── components/
│   │   ├── chakra/                 # Chart renderers
│   │   │   ├── ChakraSelector.tsx         # Style selector wrapper
│   │   │   ├── NorthIndianChakra.tsx      # North Indian diamond chart
│   │   │   ├── SouthIndianChakra.tsx      # South Indian square chart
│   │   │   ├── EastIndianChakra.tsx       # East Indian chart
│   │   │   ├── SarvatobhadraChakra.tsx    # Sarvatobhadra Chakra
│   │   │   └── VargaSwitcher.tsx          # Divisional chart switcher
│   │   ├── dasha/
│   │   │   └── DashaTree.tsx       # Expandable Vimshottari dasha timeline
│   │   └── ui/
│   │       ├── BirthForm.tsx       # Birth details input form
│   │       └── GrahaTable.tsx      # Planetary positions table
│   ├── lib/
│   │   ├── engine/
│   │   │   ├── calculator.ts       # High-level chart orchestrator
│   │   │   ├── ephemeris.ts        # Swiss Ephemeris wrappers & helpers
│   │   │   ├── nakshatra.ts        # Nakshatra, Tithi, Yoga, Karana, Vara
│   │   │   ├── houses.ts           # House cusp & lord calculations
│   │   │   ├── ayanamsha.ts        # Ayanamsha computation (Lahiri, etc.)
│   │   │   ├── vargas.ts           # Divisional charts (D1–D60)
│   │   │   ├── dignity.ts          # Planetary dignity (exalt/debi/mool)
│   │   │   ├── karakas.ts          # Chara/Sthira karakas
│   │   │   ├── arudhas.ts          # Arudha pada calculations
│   │   │   └── dasha/
│   │   │       └── vimshottari.ts  # Vimshottari Maha/Antar/Pratyantar dashas
│   │   ├── atlas/                  # SQLite geo atlas (cities + coordinates)
│   │   ├── db/                     # MongoDB connection singleton
│   │   ├── redis.ts                # Upstash Redis client & cache helpers
│   │   └── env.ts                  # Validated environment variables
│   ├── types/
│   │   └── astrology.ts            # Core TypeScript interfaces & types
│   └── auth.ts                     # NextAuth config
├── __tests__/
│   └── engine/
│       ├── core.test.ts            # Core ephemeris unit tests
│       ├── phase1.test.ts          # Panchang & dasha tests
│       └── phase2.test.ts          # Varga & dignity tests
├── ephe/                           # Swiss Ephemeris data files
├── scripts/
│   ├── seed-atlas.ts               # Seed SQLite geo database
│   └── check-mongo.cjs             # MongoDB connectivity check
├── .env.example                    # Environment variable template
├── auth.ts                         # Root-level NextAuth helper
├── middleware.ts                   # Auth & route protection middleware
└── vitest.config.ts                # Vitest configuration
```

---

## Prerequisites

- **Node.js** 18+
- **npm** 9+
- **MongoDB Atlas** (or a compatible MongoDB instance)
- Swiss Ephemeris data files (place inside `./ephe/`)

---

## Environment Setup

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in the required values:

   | Variable | Required | Description |
   |---|---|---|
   | `MONGODB_URI` | ✅ | MongoDB connection string |
   | `MONGODB_DB_NAME` | ☐ | DB name (default: `jyotish`) |
   | `AUTH_SECRET` | ✅ | NextAuth secret (run `npx auth secret`) |
   | `UPSTASH_REDIS_REST_URL` | ☐ | Upstash Redis URL (enables cache) |
   | `UPSTASH_REDIS_REST_TOKEN` | ☐ | Upstash Redis token |
   | `EPHE_PATH` | ☐ | Path to ephemeris files (default: `./ephe`) |
   | `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | ☐ | Razorpay payment keys |
   | `STRIPE_SECRET_KEY` | ☐ | Stripe payment key |
   | `RESEND_API_KEY` | ☐ | Resend email API key |

> ⚠️ **Never commit `.env` or `.env.local`.** Keep only placeholder values in `.env.example`.

---

## Install & Run

```bash
# Install dependencies
npm install

# Seed the geo atlas (first time only)
npm run seed:atlas

# Run the development server
npm run dev
```

The app will be available at `http://localhost:3000`.

---

## Quality Checks

```bash
# Run all engine unit tests
npm run test:engine

# Run tests in watch mode
npm run test:watch

# TypeScript type check
npm run typecheck

# Lint
npm run lint

# Production build
npm run build
```

---

## API Endpoints

### `POST /api/chart/calculate`

Calculates a full Vedic birth chart from birth details. Returns planetary positions, house cusps, Panchang, divisional charts, Dashas, dignities, and Arudhas.

**Request body:**

```json
{
  "name": "Sample Person",
  "birthDate": "1990-01-01",
  "birthTime": "12:30:00",
  "birthPlace": "Mumbai",
  "latitude": 19.076,
  "longitude": 72.8777,
  "timezone": "Asia/Kolkata",
  "settings": {
    "ayanamsha": "lahiri",
    "houseSystem": "whole_sign",
    "nodeMode": "mean",
    "karakaScheme": 8,
    "gulikaMode": "phaladipika",
    "chartStyle": "south",
    "showDegrees": true,
    "showNakshatra": false,
    "showKaraka": false,
    "showRetro": true
  }
}
```

---

### `GET /api/panchang?date=YYYY-MM-DD&lat=...&lon=...&tz=...`

Returns daily Panchang elements: Tithi, Nakshatra, Yoga, Karana, Vara, sunrise/sunset.

---

### `GET /api/atlas/search?q=<city name>`

Searches the local SQLite geo atlas for matching city names and returns coordinates and timezone.

---

## Utilities

### MongoDB connectivity check

```bash
node scripts/check-mongo.cjs
```

Expected output on success: `MongoDB connection OK` with the database name and host.

### Seed geo atlas

```bash
npm run seed:atlas
```

Populates the local SQLite database with city/location data for the location autocomplete feature.

---

## Engine Modules

| Module | Description |
|---|---|
| `ephemeris.ts` | Wraps `sweph` for Julian Day conversion, sidereal planet positions, and rise/set times |
| `nakshatra.ts` | Computes Nakshatra pada, Tithi, Yoga, Karana, and Vara for any moment |
| `houses.ts` | Calculates house cusps and lords using Whole Sign or Placidus systems |
| `ayanamsha.ts` | Applies Lahiri and other ayanamsha corrections |
| `vargas.ts` | Generates all divisional charts from D1 to D60 |
| `dignity.ts` | Evaluates exaltation, debilitation, Moolatrikona, and own-sign status |
| `karakas.ts` | Derives Chara and Sthira karakas from degree rankings |
| `arudhas.ts` | Computes Arudha Padas for all twelve houses |
| `dasha/vimshottari.ts` | Generates Maha Dasha, Antar Dasha, and Pratyantar Dasha timelines |

---

## Testing

Three test phases cover the full engine:

| File | Coverage |
|---|---|
| `core.test.ts` | Ephemeris accuracy near J2000, basic nakshatra |
| `phase1.test.ts` | Panchang elements, Vimshottari dasha sequencing & dates |
| `phase2.test.ts` | Vargas (D9, D10, etc.), dignity, karakas, and Arudhas |

---

## Product Plan

The full platform roadmap, feature tiers, and rollout details are documented in:

- [Vedic_Platform_JS_Full_Plan.docx](Vedic_Platform_JS_Full_Plan.docx)

---

## License

Private project — all rights reserved. Add your preferred open-source license before any public release.
