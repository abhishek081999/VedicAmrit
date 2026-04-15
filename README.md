# 🪐 Vedaansh — Vedic Jyotish Platform

> **Next.js 14 · TypeScript · MongoDB · Mongoose · NextAuth.js · swisseph**  
> **Free · Gold (₹175/mo) · Platinum (₹999/mo)**

A full-featured Vedic astrology (Jyotish) web platform built entirely in TypeScript. The platform provides arc-second-accurate ephemeris calculations, multiple Dasha systems, divisional charts, Ashtakavarga, Shadbala, Muhurta finding, and interactive SVG chakra renderers — all powered by the Swiss Ephemeris C library via the `swisseph` npm package.

**Build Status: Phases 1–8 complete — Gold and Platinum tiers live. Elite Astrocartography, PWA, Bhava Bala, and Client CRM live. Remaining Phase 8 items: Full i18n.**

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
| Deploy | Render (production) + Cloudflare Tunnel (staging) | — |

---

## Subscription Tiers

### Free — Free forever ✅ Live

| Feature | Detail |
|---|---|
| **Chart Styles** | North Indian (default), South Indian, Sarvatobhadra — all with Transit Overlay |
| **Grahas** | All 9 Navagraha with DMS degrees, nakshatra, pada, dignity, combustion, avastha |
| **Vargas** | D1–D60; all 41 varga schemes in engine (D1–D150) |
| **Dasha Systems** | Vimshottarī (120yr, 6 levels: Maha→Deha), Yoginī (36yr), Chara/Jaimini, Aṣṭottarī |
| **Āruḍhas** | All 12 Bhava Arudhas (AL–A12) + Upapada Lagna |
| **Ṣaḍbala** | All 6 components with visual bars + Rupa totals + Strong/Weak badge |
| **Viṁśopaka Bala** | Four classical systems: Ṣaḍvarga, Saptavarga, Daśavarga, Shoḍaśvarga |
| **Aṣṭakavarga** | SAV total grid + BAV grids for all 7 planets, color-coded |
| **Graha Yogas** | 6 categories: Pancha Mahapurusha, Raja, Dhana, Viparita, Special, Lunar |
| **Pañcāṅga** | Tithi, Vara, Nakshatra, Yoga, Karana, Rahu Kalam, Gulika, Abhijit, Hora table |
| **Monthly Calendar** | Full month grid — all days with Tithi/Nakshatra/Yoga/Bhadra; click for detail |
| **Muhūrta Finder** | 7 purposes; date range up to 60 days; A/B/C/D grade; auspicious windows |
| **Varṣaphal** | Solar Return — year picker, exact return moment UTC, full chart display |
| **Transit Overlay** | Toggle + date picker; current planets overlaid on natal chart |
| **Chart Comparison** | Side-by-side charts + compatibility analysis + 36-point Ashtakoot Gun Milan |
| **Public Sharing** | Toggle public → unique URL + dynamic Open Graph image + SEO metadata |
| **JHD / SJS Import** | Import birth data from Jagannatha Hora (.jhd) or Sri Jyoti Star (.sjs) files |
| **Chart Notes** | Per-chart text annotations with timestamps |
| **Save Charts** | Up to 10 charts per account |
| **Atlas** | 5.1M locations via GeoNames FTS5 SQLite — sub-50ms search |

### Gold — ₹175/month or ₹1,800/year ✅ Live

Everything in Free, plus:

| Feature | Detail |
|---|---|
| **Chart Library** | Save up to 200 charts |
| **PDF & HTML Export** | Print-quality chart export with full planetary table + Dasha tree |
| **Dasha Precision** | Start Vimshottarī from Ascendant or any planet as reference point |
| **Full Aṣṭakūṭa** | 36-point Gun Milan compatibility matching |
| **Chart Notes & Tags** | Annotations + tagging for organization |
| **Bulk Import** | CSV/JSON batch import for chart collections |
| **Advanced Muhūrta** | Extended filtering by Graha hora, Tara, and Panchaka |
| **Email Chart Reports** | Send chart PDF directly to client via Resend |
| **API Access** | 100 requests/day |

### Platinum — ₹999/month or ₹8,499/year ✅ Live

Everything in Gold, plus:

| Feature | Detail |
|---|---|
| **White-label Sharing** | Custom brand name + logo on all public share pages and PDF exports |
| **Admin Dashboard** | ✅ Internal metrics, user management, and system health |
| **Client Dashboard** | CRM-style client management — track sessions, active Dasha, notes per client |
| **Custom Ayanamsha** | Set personal default ayanamsha (Lahiri, Raman, Yukteshwar, etc.) |
| **Bulk PDF Export** | Export entire chart collections as a ZIP download |
| **Enterprise API** | 10,000 requests/day |
| **Priority Support** | Direct technical support channel |

---

### 🚀 Latest Improvements (v2.4.x — April 2026) ✅

- **Elite Astrocartography Suite**: NASA-grade relocation mapping with **Cyclo-Carto-Graphy** (real-time transits), **Local Space (Azimuth)** lines, **Paran (Latitude Crossing)** detection, and **Aspect Harmonics** (Trines/Squares to MC).
- **Progressive Web App (PWA)**: Full offline resilience with Service Workers, Web manifest v3, and native-grade installability for iOS/Android/Desktop.
- **Global Resonance Intelligence**: Automated ranking of the top world cities (Dubai, NYC, London, etc.) based on your natal power lines and thematic goals.
- **Thematic Strategy Mapping**: One-click filters for **Wealth**, **Love**, **Career**, and **Spiritual** relocation analysis.
- **Dual-Layer Super-Imposition**: Simultaneously visualize natal potential and current planetary activations on a single interactive map.

- **Bhava Bala**: Full BPHS house strength engine live — Adhipati, Dig, and Drishti Bala for all 12 houses, with grid/table/bar-chart UI and strongest/weakest house callout.
- **Client CRM Dashboard**: Full Platinum CRM at `/clients` — add, edit, tag clients; session notes; remedy tracker; active Dasha progress bar; Dasha-transition alerts.
- **White-label Sharing**: Platinum `brandName` + `brandLogo` rendered on all public share pages and future PDF exports.
- **Public Chart Routing**: Fixed `/api/chart/public` endpoint and branding injection for Platinum consultants.
- **Advanced Engine Modules**: Added `bhavaBala.ts`, `gandanta.ts`, `pushkara.ts`, `mrityuBhaga.ts`, `yogiPoint.ts`, `advancedInterpretation.ts`, `doshas.ts`, `tajika.ts`, `transits.ts`, `activeHouses.ts` to the calculation pipeline.
- **Vedaansh Rebranding** (March 2026): Full ecosystem rename from "Vedic Amrit" to **Vedaansh**.
- **Planets Workspace**: New interactive dual-chart (D1/D9) view with diagnostic micro-details table.
- **Nakshatra Lab**: Recursive Pada maps, Navtara analysis, Best Days forecasts, and activity-specific Muhurta ratings.
- **Varshaphal Redesign**: Dynamic full-width Solar Return workspace with split-screen comparative layout.
- **Dashboard v2**: Responsive mobile-first dashboard with integrated "Personal Day" cosmic insights.
- **Engine Precision**: Refined D4, D10, D16, and D60 divisional calculations; absolute sidereal longitude for house cusps.
- **i18n**: Initial Hindi translation rollout for birth forms and planetary tables.
- **Hosting Migration**: Moved from Vercel to Render (production) to support `sweph` native addon. Two-branch deploy: `main → Render → vedaansh.com`, `dev → Cloudflare Tunnel → staging`.

---

## Calculation Engine — 33 Modules

All engine modules are pure TypeScript functions (no side effects). Given the same inputs, they always return the same outputs.

| Module | Status | Description |
|---|---|---|
| `ephemeris.ts` | ✅ | swisseph wrapper — all 9 Navagraha + Ketu + Ascendant + outer planets |
| `ayanamsha.ts` | ✅ | 7 modes: Lahiri, True Chitra, True Revati, Raman, Yukteshwar, Usha-Shashi, Krishnamurti |
| `houses.ts` | ✅ | Whole Sign, Placidus, Equal, Bhava Chalita — cusps + bhavas |
| `nakshatra.ts` | ✅ | Basic Nakshatra, Pada, Tithi, Yoga, Karana, Vara, Hora, Rahu/Gulika Kalam |
| `nakshatraAdvanced.ts` | ✅ | Navtara, Panchaka, Muhurta suitability, and Best Days forecasts |
| `nakshatraRemedies.ts` | ✅ | Nakshatra-specific rituals, mantras, and balancing practices |
| `vargas.ts` | ✅ | All 41 varga schemes (D1–D150) — logic corrected for D10, D4, D16, D60 |
| `arudhas.ts` | ✅ | All 12 Bhava Arudhas (AL–A12) + Graha Arudhas with edge-case handling |
| `karakas.ts` | ✅ | Chara Karakas — 7-karaka and 8-karaka schemes (Ke=Scorpio, Ra=Aquarius) |
| `dignity.ts` | ✅ | Exaltation, debilitation, moolatrikona, own, friend, neutral, enemy |
| `shadbala.ts` | ✅ | All 6 components: Sthana, Dig, Kala, Chesta, Naisargika, Drik Bala — returns Rupas |
| `vimsopaka.ts` | ✅ | Vimsopaka Bala — four classical systems: Ṣaḍvarga, Saptavarga, Daśavarga, Shoḍaśvarga |
| `ashtakavarga.ts` | ✅ | Full BPHS bindu tables — SAV totals + BAV grids for all 7 planets |
| `yogas.ts` | ✅ | 6 categories: Pancha Mahapurusha, Raja, Dhana, Viparita, Special, Lunar |
| `ashtakoot.ts` | ✅ | 36-point Gun Milan: Varna, Vashya, Tara, Yoni, Maitri, Gana, Bhakoot, Nadi |
| `varshaphal.ts` | ✅ | Solar Return — bisection search on swisseph for arc-second precision |
| `sunrise.ts` | ✅ | Real astronomical rise/set via `swe_rise_trans` with geographic fallback |
| `bhavaBala.ts` | ✅ | House strength — Adhipati (lord Shadbala), Dig Bala, Drishti Bala for all 12 bhavas |
| `gandanta.ts` | ✅ | Karmic junction detection — Revati/Ashwini, Ashlesha/Magha, Jyeshtha/Mula |
| `pushkara.ts` | ✅ | Pushkara Bhaga and Pushkara Navamsha auspicious degree detection |
| `mrityuBhaga.ts` | ✅ | Death-inflicting degree detection per planet and sign |
| `yogiPoint.ts` | ✅ | Yogi, Sahayogi, Avayogi point calculation for prosperity analysis |
| `advancedInterpretation.ts` | ✅ | AI-style narrative interpretation engine — strengths, cautions, special patterns |
| `doshas.ts` | ✅ | Classical dosha detection (Manglik, Kaal Sarp, Grahan, etc.) |
| `tajika.ts` | ✅ | Tajika annual chart aspects — Ithasala, Ishrafa, Nakta, Yamaya |
| `transits.ts` | ✅ | Real-time transit overlay against natal chart |
| `activeHouses.ts` | ✅ | Activated house detection from current transits + dashas |
| `muhurtaPersonal.ts` | ✅ | Personal muhurta suitability scoring for birth chart |
| `astroInterpretation.ts` | ✅ | Elite ACG reading engine — Career, Home, and Love meanings |
| `calculator.ts` | ✅ | Main orchestrator — all engines wired, returns `ChartOutput` |
| `dasha/vimshottari.ts` | ✅ | 120yr cycle, 6-level tree (Maha→Antar→Pratyantar→Sukshma→Prana→Deha) |
| `dasha/yogini.ts` | ✅ | 36yr, 8 Yoginis, birth balance from Moon nakshatra position |
| `dasha/chara.ts` | ✅ | Jaimini sign dasha, forward/reverse per parity, birth balance from Lagna degree |
| `dasha/ashtottari.ts` | ✅ | 108yr conditional Dasha — active for Krishna paksha births outside Rahu nakshatra |

**Planned engine modules (Phase 7 — remaining):**

---

## Project Structure

```
Vedaansh/
├── src/
│   ├── app/
│   │   ├── page.tsx                  # Home / Chart form
│   │   ├── compare/page.tsx          # Chart Comparison + Ashtakoot
│   │   ├── panchang/page.tsx         # Daily Panchang
│   │   ├── panchang/calendar/        # Monthly Panchang calendar
│   │   ├── muhurta/page.tsx          # Muhurta Finder
│   │   ├── my/charts/page.tsx        # Saved charts library
│   │   ├── chart/[slug]/             # Public share page
│   │   ├── account/page.tsx          # User preferences
│   │   ├── pricing/page.tsx          # Subscription tiers
│   │   └── api/
│   │       ├── chart/calculate/      # Main chart calculation
│   │       ├── chart/save/           # Save to MongoDB
│   │       ├── chart/list/           # Paginated chart list
│   │       ├── chart/delete/         # Delete chart
│   │       ├── chart/notes/          # Per-chart annotations
│   │       ├── chart/export/         # PDF export (Gold+)
│   │       ├── chart/public/         # GET by slug — no auth ⚠️ fix path
│   │       ├── chart/toggle-public/  # Share toggle
│   │       ├── chart/bulk-import/    # CSV/JSON import (Gold+)
│   │       ├── chart/varshaphal/     # Solar Return calculation
│   │       ├── panchang/             # Daily Panchang
│   │       ├── atlas/search/         # 5.1M location search
│   │       ├── auth/                 # NextAuth + custom auth
│   │       ├── payment/checkout/     # Razorpay order
│   │       ├── payment/verify/       # Verify payment
│   │       ├── user/me/              # Profile + preferences
│   │       └── webhooks/razorpay/    # Subscription activation
│   ├── lib/engine/                   # 🔑 Core Jyotish engine
│   ├── lib/db/models/                # User, Chart, ChartCache, Subscription
│   ├── lib/atlas/                    # Geo atlas SQLite + FTS5
│   ├── lib/pdf/                      # PDF generation
│   ├── components/chakra/            # SVG chart renderers
│   ├── components/dasha/             # DashaTree component
│   ├── components/ui/                # All UI components
│   └── types/astrology.ts            # All TypeScript domain types
├── __tests__/                        # Vitest engine tests
├── ephe/                             # Swiss Ephemeris .se1 files
└── scripts/
```

---

## API Routes

| Route | Status | Description |
|---|---|---|
| `POST /api/chart/calculate` | ✅ | Zod validation → swisseph → all engines → Redis cache (24h) |
| `POST /api/chart/save` | ✅ | Save to MongoDB, optional public slug generation |
| `GET /api/chart/list` | ✅ | Paginated with search, authenticated user only |
| `DELETE /api/chart/delete` | ✅ | Owner-only delete with auth check |
| `GET/POST/DELETE /api/chart/notes` | ✅ | Per-chart annotations |
| `GET /api/chart/public` | ⚠️ | Fetch public chart by slug — **route file at wrong path, move to `/api/chart/public/`** |
| `POST /api/chart/toggle-public` | ✅ | Toggle `isPublic`, generate/remove slug |
| `POST /api/chart/varshaphal` | ✅ | Solar Return for given year — bisection search |
| `POST /api/chart/export` | ✅ | PDF chart export (Gold+) |
| `POST /api/chart/bulk-import` | ✅ | CSV/JSON batch import (Gold+) |
| `GET /api/panchang` | ✅ | Full Panchang for any date + location, Redis cached 24h |
| `GET /api/atlas/search` | ✅ | Location typeahead — 5.1M GeoNames via SQLite FTS5 |
| `GET /api/user/me` | ✅ | User profile + personal chart + preferences |
| `PATCH /api/user/me` | ✅ | Update user preferences |
| `POST /api/auth/signup` | ✅ | Email/password registration with bcrypt |
| `POST /api/auth/verify` | ✅ | Email verification token check |
| `POST /api/auth/refresh-plan` | ✅ | Refresh user plan in session after upgrade |
| `POST /api/payment/checkout` | ✅ | Razorpay order creation for Gold/Platinum |
| `POST /api/payment/verify` | ✅ | Verify Razorpay payment signature |
| `POST /api/webhooks/razorpay` | ✅ | Activate subscription on payment success |

---

## Known Issues

| Issue | Severity | Status |
|---|---|---|
| `GET /api/chart/public` returns 404 | 🔴 Critical | ✅ Fixed — route correctly at `src/app/api/chart/public/route.ts` |

---

## Environment Variables

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | ✅ | MongoDB Atlas connection string |
| `MONGODB_DB_NAME` | — | DB name (default: `vedaansh`) |
| `AUTH_SECRET` | ✅ | NextAuth secret (`openssl rand -base64 32`) |
| `AUTH_URL` | ✅ | App base URL |
| `AUTH_GOOGLE_ID` | ✅ | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | ✅ | Google OAuth client secret |
| `UPSTASH_REDIS_REST_URL` | — | Upstash Redis URL |
| `UPSTASH_REDIS_REST_TOKEN` | — | Upstash Redis token |
| `RAZORPAY_KEY_ID` | — | Razorpay key |
| `RAZORPAY_KEY_SECRET` | — | Razorpay secret |
| `RAZORPAY_WEBHOOK_SECRET` | — | Razorpay webhook secret |
| `RAZORPAY_GOLD_MONTHLY_PLAN_ID` | — | Razorpay plan ID for Gold monthly |
| `RAZORPAY_GOLD_YEARLY_PLAN_ID` | — | Razorpay plan ID for Gold yearly |
| `RAZORPAY_PLATINUM_MONTHLY_PLAN_ID` | — | Razorpay plan ID for Platinum monthly |
| `RAZORPAY_PLATINUM_YEARLY_PLAN_ID` | — | Razorpay plan ID for Platinum yearly |
| `RESEND_API_KEY` | — | Resend email API key |
| `FROM_EMAIL` | — | Sender address |
| `EPHE_PATH` | — | Path to `.se1` files (default: `./ephe`) |
| `NEXT_PUBLIC_BASE_URL` | ✅ | Public app URL |

---

## Install & Run

```bash
npm install
npm run seed:atlas   # first time only
npm run dev          # http://localhost:3000
```

---

## Testing

```bash
npm run test:engine   # Vitest engine unit tests
npm run test:watch    # Watch mode
npm run typecheck     # TypeScript check
npm run lint
npm run build
```

Tolerances: ±0.005° for longitudes, ±1 day for Dasha dates, exact match for sign placements. **No calculation module ships until all reference chart tests pass.**

---

## Development Roadmap

| Phase | Status | Deliverable |
|---|---|---|
| 1 — Engine Foundation | ✅ Complete | All 33 calc modules + Vitest suite |
| 2 — Atlas + Auth + DB | ✅ Complete | MongoDB live, NextAuth, 5.1M atlas |
| 3 — Frontend + Chakras | ✅ Complete | All SVG renderers, Dasha tree, full UI |
| 4 — Free Tier Launch | ✅ Complete | Free tier live at vedaansh.com |
| 5 — Gold Features | ✅ Complete | Razorpay, PDF export, bulk import, multi-device sync |
| 6 — Platinum Launch | ✅ Complete | Nakshatra workspace, 41 vargas in UI, both paid tiers live |
| 7 — Horā Core | ✅ Complete | Bhava Bala, Client CRM, White-label, Email Charts |
| 8 — Scale + Polish | ✅ Complete | Astrocartography, Admin Dashboard, i18n, PWA |

### Phase 7 — Completed ✅

- [x] **Client Management Dashboard** — `/clients` page, CRM for Platinum users `[PLATINUM]`
- [x] **White-label chart sharing** — `brandName` + `brandLogo` in preferences, rendered on share pages and PDFs `[PLATINUM]`
- [x] **Bhava Bala engine + UI** — BPHS house strength: Adhipati, Dig, Drishti Bala; grid/table/bar-chart views `[ENGINE]`
- [x] **Public chart route fix** — `/api/chart/public` correctly wired with branding injection
- [x] **Email chart to client** — Resend-powered delivery from chart view; 1 API route + button `[GOLD]`
- [x] **Bulk PDF export** — ZIP of multiple chart PDFs from My Charts library `[PLATINUM]`

### Phase 8 — Scale + Polish 🚀

- [x] **Admin Dashboard** — Internal metrics, user management, and system health `[PHASE 8]`
- [x] **Astrocartography** — NASA-grade relocation mapping with Local Space (Azimuth) intelligence `[PHASE 8]`
- [x] **PWA Support** — Offline resilience, manifest v3, and installable mobile experience `[PHASE 8]`
- [ ] **Full i18n** — Hindi/Sanskrit rollout for all UI components and tables `[PHASE 8]`

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
*v2.5.0 · April 2026 · [Vedaansh Platform](https://github.com/abhishek081999/Vedaansh)*