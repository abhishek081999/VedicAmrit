# 🪐 Vedaansh — Vedic Jyotish Platform

> **Next.js 14 · TypeScript · MongoDB · Mongoose · NextAuth.js · swisseph**  
> **Kāla (Free) · Velā (₹299/mo) · Horā (₹999/mo)**

A full-featured Vedic astrology (Jyotish) web platform modelled on deva.guru, built entirely in TypeScript. The platform provides arc-second-accurate ephemeris calculations, multiple Dasha systems, divisional charts, Ashtakavarga, Shadbala, Muhurta finding, and interactive SVG chakra renderers — all powered by the Swiss Ephemeris C library via the `swisseph` npm package.

**Build Status: Phases 1–4 complete — Kāla free tier is live. Phase 5 (Velā) in progress.**

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 14.2 |
| Language | TypeScript | 5.4 |
| Ephemeris | sweph (Swiss Ephemeris npm) | 2.10.3 |
| Database | MongoDB Atlas + Mongoose ODM | 7.0 / 8.3 |
| Auth | NextAuth.js v5 | 5.0-beta |
| Cache | Upstash Redis | 4.6 |
| Geo Atlas | SQLite + better-sqlite3 (FTS5) | 9.4 |
| Styling | Custom CSS + Tailwind | 3.4 |
| Validation | Zod | 3.23 |
| Payments | Razorpay | 2.9 |
| Email | Resend | 3.2 |
| Testing | Vitest | 1.5 |
| Deploy | Vercel + MongoDB Atlas + Upstash | — |

---

## Features

### Kāla Edition — Free Forever ✅ Live

| Feature | Detail |
|---|---|
| **Chart Styles** | North Indian (default), South Indian, Sarvatobhadra — all with Transit Overlay |
| **Grahas** | All 9 Navagraha with DMS degrees, nakshatra, pada, dignity, combustion, avastha |
| **Vargas** | D1–D60; all 41 varga schemes in engine (D1–D150) |
| **Dasha Systems** | Vimshottarī (120yr, 6 levels: Maha→Deha), Yoginī (36yr), Chara/Jaimini |
| **Āruḍhas** | All 12 Bhava Arudhas (AL–A12) + Upapada Lagna |
| **Ṣaḍbala** | All 6 components with visual bars + Rupa totals + Strong/Weak badge |
| **Aṣṭakavarga** | SAV total grid + BAV grids for all 7 planets, color-coded |
| **Graha Yogas** | 6 categories: Pancha Mahapurusha, Raja, Dhana, Viparita, Special, Lunar |
| **Pañcāṅga** | Tithi, Vara, Nakshatra, Yoga, Karana, Rahu Kalam, Gulika, Abhijit, Hora table |
| **Monthly Calendar** | Full month grid — all days with Tithi/Nakshatra/Yoga/Bhadra; click for detail |
| **Muhūrta Finder** | 7 purposes; date range up to 60 days; A/B/C/D grade; auspicious windows |
| **Varṣaphal** | Solar Return — year picker, exact return moment UTC, full chart display |
| **Transit Overlay** | Toggle + date picker; current planets overlaid in violet/purple on natal chart |
| **Chart Comparison** | Side-by-side charts + compatibility analysis + 36-point Ashtakoot Gun Milan |
| **Public Sharing** | Toggle public → unique URL + dynamic Open Graph image + SEO metadata |
| **JHD / SJS Import** | Import birth data from Jagannatha Hora (.jhd) or Sri Jyoti Star (.sjs) files |
| **Chart Notes** | Per-chart text annotations with timestamps |
| **Save Charts** | Up to 3 charts per account |
| **Atlas** | 5.1M locations via GeoNames FTS5 SQLite — sub-50ms search |

### Velā Edition — ₹299/month ⏳ Planned (Phase 5)
1,008 charts across 3 devices · All 16 standard vargas in UI · Narayana Dasha · Ashtottari Dasha · Vimsopaka Bala · PDF chart export · Email chart reports · Advanced Muhurta filters · Batch CSV calculation · 100 API requests/day

### Horā Edition — ₹999/month ⏳ Planned (Phases 6–7)
10,008 charts · All 41 varga schemes in UI · 30+ Dasha systems · All Bala systems (Bhava Bala, Sphuta Drishti, Vaiseshikamsa) · Astrocartography (ACG lines on Leaflet map) · Bhava Chakra + Bhava Chalita SVG renderers · Tithi/Nakshatra/Dasha Pravesh charts · 36 Sahams · White-label chart sharing · 10,000 API requests/day

---

## Calculation Engine — 18 Modules

All engine modules are pure TypeScript functions (no side effects). Given the same inputs, they always return the same outputs.

| Module | Status | Description |
|---|---|---|
| `ephemeris.ts` | ✅ | swisseph wrapper — all 9 Navagraha + Ketu + Ascendant + outer planets |
| `ayanamsha.ts` | ✅ | 7 modes: Lahiri, True Chitra, True Revati, Raman, Yukteshwar, Usha-Shashi, Krishnamurti |
| `houses.ts` | ✅ | Whole Sign, Placidus, Equal, Bhava Chalita — cusps + bhavas |
| `nakshatra.ts` | ✅ | Nakshatra, Pada, Tithi, Yoga, Karana, Vara, Hora, Rahu/Gulika Kalam |
| `vargas.ts` | ✅ | All 41 varga schemes (D1–D150) — pure functions, each returns rashi 1–12 |
| `arudhas.ts` | ✅ | All 12 Bhava Arudhas (AL–A12) + Graha Arudhas with edge-case handling |
| `karakas.ts` | ✅ | Chara Karakas — 7-karaka and 8-karaka schemes (Ke=Scorpio, Ra=Aquarius) |
| `dignity.ts` | ✅ | Exaltation, debilitation, moolatrikona, own, friend, neutral, enemy |
| `shadbala.ts` | ✅ | All 6 components: Sthana, Dig, Kala, Chesta, Naisargika, Drik Bala — returns Rupas |
| `ashtakavarga.ts` | ✅ | Full BPHS bindu tables — SAV totals + BAV grids for all 7 planets |
| `yogas.ts` | ✅ | 6 categories: Pancha Mahapurusha, Raja, Dhana, Viparita, Special, Lunar |
| `ashtakoot.ts` | ✅ | 36-point Gun Milan: Varna, Vashya, Tara, Yoni, Maitri, Gana, Bhakoot, Nadi |
| `varshaphal.ts` | ✅ | Solar Return — bisection search on swisseph for arc-second precision |
| `sunrise.ts` | ✅ | Real astronomical rise/set via `swe_rise_trans` with geographic fallback |
| `calculator.ts` | ✅ | Main orchestrator — all 18 engines wired, returns `ChartOutput` |
| `dasha/vimshottari.ts` | ✅ | 120yr cycle, 6-level tree (Maha→Antar→Pratyantar→Sukshma→Prana→Deha) |
| `dasha/yogini.ts` | ✅ | 36yr, 8 Yoginis, birth balance from Moon nakshatra position |
| `dasha/chara.ts` | ✅ | Jaimini sign dasha, forward/reverse per parity, birth balance from Lagna degree |

---

## Project Structure

```
Vedaansh/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── page.tsx                  # Home / Chart form (main page)
│   │   ├── compare/page.tsx          # Chart Comparison + Ashtakoot
│   │   ├── panchang/
│   │   │   ├── page.tsx              # Daily Panchang
│   │   │   └── calendar/page.tsx     # Monthly Panchang calendar
│   │   ├── muhurta/page.tsx          # Muhurta Finder (7 purposes)
│   │   ├── my/charts/page.tsx        # Saved charts dashboard
│   │   ├── chart/[slug]/             # Public share page (SSR)
│   │   │   ├── page.tsx
│   │   │   ├── layout.tsx
│   │   │   ├── metadata.tsx
│   │   │   └── opengraph-image.tsx
│   │   ├── account/page.tsx          # User preferences + account
│   │   ├── pricing/page.tsx          # Subscription tiers
│   │   ├── login/ signup/ verify-email/
│   │   └── api/
│   │       ├── chart/                # calculate, save, list, delete, export
│   │       │   ├── calculate/        # Main chart calculation endpoint
│   │       │   ├── save/             # Save chart to MongoDB
│   │       │   ├── list/             # Paginated chart list
│   │       │   ├── delete/           # Delete chart
│   │       │   ├── notes/            # Per-chart annotations
│   │       │   ├── export/           # PDF export (Velā+)
│   │       │   ├── public/           # GET by slug (no auth)
│   │       │   ├── toggle-public/    # Share toggle
│   │       │   └── varshaphal/       # Solar Return calculation
│   │       ├── panchang/             # Daily Panchang + calendar
│   │       ├── atlas/search/         # 5.1M location FTS5 search
│   │       ├── auth/                 # NextAuth.js + custom auth
│   │       │   ├── [...nextauth]/    # NextAuth.js handler
│   │       │   ├── signup/           # Email/password registration
│   │       │   ├── verify/           # Email verification
│   │       │   ├── verify-email/     # Verify email token
│   │       │   └── refresh-plan/     # Refresh user plan in session
│   │       ├── payment/              # Razorpay integration
│   │       │   ├── checkout/         # Create payment order
│   │       │   └── verify/           # Verify payment
│   │       ├── user/me/              # GET profile, PATCH preferences
│   │       └── webhooks/razorpay/    # Razorpay webhook handler
│   ├── lib/
│   │   ├── engine/                   # 🔑 Core Jyotish engine (pure TS)
│   │   │   ├── ephemeris.ts          # Swiss Ephemeris wrapper
│   │   │   ├── ayanamsha.ts          # 7 ayanamsha modes
│   │   │   ├── houses.ts             # House systems (Whole, Placidus, etc.)
│   │   │   ├── nakshatra.ts          # Nakshatra, Tithi, Yoga, Karana
│   │   │   ├── nakshatraAdvanced.ts  # Advanced nakshatra calculations
│   │   │   ├── nakshatraRemedies.ts  # Nakshatra-based remedies
│   │   │   ├── vargas.ts             # All 41 varga schemes (D1-D150)
│   │   │   ├── arudhas.ts            # Bhava & Graha Arudhas
│   │   │   ├── karakas.ts            # Chara Karakas (7/8 schemes)
│   │   │   ├── dignity.ts            # Planetary dignity calculations
│   │   │   ├── shadbala.ts           # All 6 strength components
│   │   │   ├── ashtakavarga.ts       # BAV + SAV calculations
│   │   │   ├── yogas.ts              # 6 yoga categories
│   │   │   ├── ashtakoot.ts          # 36-point Gun Milan
│   │   │   ├── varshaphal.ts         # Solar Return calculations
│   │   │   ├── sunrise.ts            # Sunrise/sunset calculations
│   │   │   ├── calculator.ts         # Main orchestrator
│   │   │   └── dasha/                # Dasha systems
│   │   │       ├── vimshottari.ts    # 120yr Vimshottari (6 levels)
│   │   │       ├── yogini.ts         # 36yr Yogini Dasha
│   │   │       └── chara.ts          # Jaimini Chara Dasha
│   │   ├── db/
│   │   │   ├── mongodb.ts            # MongoClient singleton
│   │   │   └── models/               # User, Chart, Subscription
│   │   ├── atlas/                    # Geo atlas SQLite + FTS5
│   │   ├── pdf/                      # PDF generation utilities
│   │   ├── redis.ts                  # Upstash Redis client
│   │   ├── email.ts                  # Resend client
│   │   └── env.ts                    # Environment validation
│   ├── components/
│   │   ├── chakra/                   # SVG chart renderers
│   │   │   ├── NorthIndianChakra.tsx # Diamond kite style
│   │   │   ├── SouthIndianChakra.tsx # 4×4 grid style
│   │   │   ├── EastIndianChakra.tsx  # Eastern style
│   │   │   ├── CircleChakra.tsx      # Circular chart
│   │   │   ├── SarvatobhadraChakra.tsx # SBC 9×9 grid
│   │   │   ├── BhavaChakra.tsx       # Bhava Chalita view
│   │   │   ├── ChakraSelector.tsx    # Style switcher
│   │   │   └── VargaSwitcher.tsx     # Varga selection
│   │   ├── dasha/
│   │   │   └── DashaTree.tsx         # 6-level expandable tree
│   │   ├── dashboard/
│   │   │   └── PersonalDayCard.tsx   # Daily panchang card
│   │   ├── providers/                # React context providers
│   │   │   ├── ChartProvider.tsx
│   │   │   ├── LayoutProvider.tsx
│   │   │   └── SessionProvider.tsx
│   │   └── ui/                       # UI components
│   │       ├── AppFramework.tsx      # Collapsible sidebar
│   │       ├── BirthForm.tsx         # Chart input form
│   │       ├── LocationPicker.tsx    # Atlas search component
│   │       ├── GrahaTable.tsx        # Planet positions table
│   │       ├── ShadbalaTable.tsx     # Shadbala display
│   │       ├── ShadbalaVisuals.tsx   # Visual strength bars
│   │       ├── AshtakavargaGrid.tsx  # BAV/SAV grids
│   │       ├── YogaList.tsx          # Detected yogas
│   │       ├── NakshatraPanel.tsx    # Nakshatra details
│   │       ├── TransitOverlay.tsx    # Transit planet overlay
│   │       ├── VarshaphalPanel.tsx   # Solar Return panel
│   │       ├── ChartNotes.tsx        # Per-chart annotations
│   │       ├── ExportPdfButton.tsx   # PDF export trigger
│   │       ├── ThemeToggle.tsx       # Dark/Light/Classic
│   │       └── JsonLd.tsx            # SEO structured data
│   ├── types/
│   │   └── astrology.ts              # All TypeScript domain types
│   └── auth.ts                       # NextAuth.js configuration
├── __tests__/                        # Vitest engine tests
├── scripts/seed-atlas.ts
└── ephe/                             # Swiss Ephemeris .se1 data files
```

---

## API Routes

| Route | Status | Description |
|---|---|---|
| Route | Status | Description |
|---|---|---|
| `POST /api/chart/calculate` | ✅ | Zod validation → swisseph → all engines → Redis cache (24h) |
| `POST /api/chart/save` | ✅ | Save to MongoDB, optional public slug generation |
| `GET /api/chart/list` | ✅ | Paginated with search, authenticated user only |
| `DELETE /api/chart/delete` | ✅ | Owner-only delete with auth check |
| `GET/POST/DELETE /api/chart/notes` | ✅ | Per-chart annotations |
| `GET /api/chart/public` | ✅ | Fetch public chart by slug — no auth required |
| `POST /api/chart/toggle-public` | ✅ | Toggle `isPublic`, generate/remove slug |
| `POST /api/chart/varshaphal` | ✅ | Solar Return for given year — bisection search |
| `POST /api/chart/export` | ✅ | PDF chart export (Velā+) |
| `GET /api/panchang` | ✅ | Full Panchang for any date + location, Redis cached 24h |
| `GET /api/atlas/search` | ✅ | Location typeahead — 5.1M GeoNames via SQLite FTS5 |
| `GET /api/user/me` | ✅ | User profile + personal chart + preferences |
| `PATCH /api/user/me` | ✅ | Update user preferences |
| `POST /api/auth/signup` | ✅ | Email/password registration with bcrypt |
| `POST /api/auth/verify` | ✅ | Email verification token check |
| `POST /api/auth/verify-email` | ✅ | Verify email with token |
| `POST /api/auth/refresh-plan` | ✅ | Refresh user plan in session after upgrade |
| `POST /api/payment/checkout` | ✅ | Razorpay order creation for Velā/Horā |
| `POST /api/payment/verify` | ✅ | Verify Razorpay payment signature |
| `POST /api/webhooks/razorpay` | ✅ | Activate subscription on payment success |

---

## Prerequisites

- **Node.js** 18+
- **npm** 9+
- **MongoDB Atlas** (or compatible MongoDB instance)
- **Swiss Ephemeris data files** — place `.se1` files inside `./ephe/`

Download ephemeris files from [astro.com/ftp/swisseph/ephe](https://www.astro.com/ftp/swisseph/ephe/). Files needed for 1800–2400 CE:
- `sepl_18.se1` — main planetary ephemeris (~11MB)
- `semo_18.se1` — Moon ephemeris (~8MB)
- `seas_18.se1` — asteroids (~6MB)

---

## Environment Setup

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | ✅ | MongoDB Atlas connection string |
| `MONGODB_DB_NAME` | — | DB name (default: `vedaang`) |
| `AUTH_SECRET` | ✅ | NextAuth secret (`openssl rand -base64 32`) |
| `AUTH_URL` | ✅ | App base URL (`http://localhost:3000` or production domain) |
| `AUTH_GOOGLE_ID` | ✅ | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | ✅ | Google OAuth client secret |
| `AUTH_TRUST_HOST` | — | Set to `true` for development |
| `UPSTASH_REDIS_REST_URL` | — | Upstash Redis URL (enables caching) |
| `UPSTASH_REDIS_REST_TOKEN` | — | Upstash Redis token |
| `RAZORPAY_KEY_ID` | — | Razorpay key (required for paid tiers) |
| `RAZORPAY_KEY_SECRET` | — | Razorpay secret |
| `RAZORPAY_WEBHOOK_SECRET` | — | Razorpay webhook secret |
| `RESEND_API_KEY` | — | Resend email API key |
| `FROM_EMAIL` | — | Sender address (e.g. `noreply@vedaang.com`) |
| `EPHE_PATH` | — | Path to `.se1` files (default: `./ephe`) |
| `NEXT_PUBLIC_BASE_URL` | ✅ | Public app URL |

> ⚠️ Never commit `.env.local`. Only placeholder values belong in `.env.example`.

---

## Install & Run

```bash
# Install dependencies
npm install

# Seed the geo atlas (first time only — downloads 5.1M GeoNames records)
npm run seed:atlas

# Start development server
npm run dev
```

App available at `http://localhost:3000`.

---

## Testing

```bash
# Run all engine unit tests
npm run test:engine

# Watch mode
npm run test:watch

# TypeScript type check
npm run typecheck

# Lint
npm run lint

# Production build
npm run build
```

The test suite uses Vitest with reference chart fixtures in `__tests__/fixtures/`. Tolerances: ±0.005° for longitudes, ±1 day for Dasha dates, exact match for sign placements. **No calculation module ships until all reference chart tests pass.**

---

## Development Roadmap

| Phase | Timeline | Status | Deliverable |
|---|---|---|---|
| 1 — Engine Foundation | Weeks 1–8 | ✅ Complete | All 18 calc modules + Vitest suite |
| 2 — Atlas + Auth + DB | Weeks 9–13 | ✅ Complete | MongoDB live, NextAuth, 5.1M atlas |
| 3 — Frontend + Chakras | Weeks 14–21 | ✅ Complete | All SVG renderers, Dasha tree, full UI |
| 4 — Panchang + Launch | Weeks 22–26 | ✅ Complete | Kāla free tier live |
| 5 — Velā Features | Weeks 27–35 | ✅ Complete | Razorpay payments, PDF export, all Velā features |
| 6 — Horā Vargas & Dashas | Weeks 36–47 | 🕒 In Progress | 41 vargas in UI, 30+ Dasha systems |
| 7 — Horā Advanced Views | Weeks 48–57 | ⏳ Planned | Bhava Chakra, Astrocartography, Pravesh charts |
| 8 — Scale + Polish | Weeks 58–64 | ⏳ Planned | i18n, PWA, admin dashboard, load testing |

### Immediate Next Steps

- [x] **Razorpay payment integration** — Complete with checkout, verify, and webhook handlers `[REVENUE]`
- [x] **Panchang/Muhurta location picker** — Atlas search with 5.1M GeoNames `[UX]`
- [x] **PDF chart export** — Print-quality PDF with chart image, planet table, Dasha tree `[VELĀ]`
- [x] **Email verification** — Resend integration for secure signup `[AUTH]`
- [ ] **Ashtottari Dasha** — 108-year cycle, conditional per nakshatra `[ENGINE]`
- [ ] **Narayana Dasha** — Jaimini system for longevity analysis `[ENGINE]`
- [ ] **Sanskrit / English language toggle** — i18n infrastructure ready `[i18n]`

---

## The Golden Rule

> **Validate → Test → Build UI → Ship. In that order, every single time.**  
> One wrong Dasha date or planet degree destroys user trust permanently.  
> Never build the UI for a feature until its calculation module passes all reference chart tests.

---

## License

Private project — all rights reserved.

---

*Jyotiṣa — The Eye of the Vedas*  
*v2.2 · March 2026 · github.com/abhishek081999/Vedaansh*