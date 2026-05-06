# 🪐 Vedaansh — Vedic Jyotish Platform

> **Next.js 14 · TypeScript · MongoDB · Mongoose · NextAuth.js · swisseph**  
> **Free · Gold (₹175/mo) · Platinum (₹999/mo)**

A full-featured Vedic astrology (Jyotish) web platform built entirely in TypeScript. The platform provides arc-second-accurate ephemeris calculations, multiple Dasha systems, divisional charts, Ashtakavarga, Shadbala, Muhurta finding, interactive SVG chakra renderers — all powered by the Swiss Ephemeris C library via the `swisseph` npm package.

**Build Status: All 10 phases complete. v2.6.0 live. Remaining: Full i18n rollout.**

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
| **Save Charts** | Up to 20 charts per account (free) |
| **Atlas** | 5.1M locations via GeoNames FTS5 SQLite — sub-50ms search |
| **Sarvatobhadra Chakra** | Classical 9×9 predictive grid; transit Vedha analysis; Dhana (financial) pulse meter; body-part resonance alerts; cell-level interaction with row/column vedha glow |
| **Prashna (Horary)** | Oracle compass with remedial directions, ruling planets, KP significators (A–D levels) |
| **Jaimini** | Dedicated Jaimini workspace with Chara Dasha + special aspects |
| **Nakshatra Lab** | Recursive Pada maps, Navtara analysis, Best Days forecasts, activity-specific Muhurta ratings |
| **Planets Workspace** | Interactive dual-chart (D1/D9) view with diagnostic micro-details table |
| **Interactive Aspects** | Parashari Drishti visualized on all chakras with animated lines |
| **Vastu Analysis** | Correlate birth chart with Vastu orientations |

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
| **Admin Dashboard** | Internal metrics, user management, and system health |
| **Client Dashboard** | CRM-style client management — track sessions, active Dasha, notes per client |
| **Custom Ayanamsha** | Set personal default ayanamsha (Lahiri, Raman, Yukteshwar, etc.) |
| **Bulk PDF Export** | Export entire chart collections as a ZIP download |
| **Enterprise API** | 10,000 requests/day |
| **Priority Support** | Direct technical support channel |

---

### 🚀 Latest Improvements (v2.6.x — May 2026) ✅

- **Sarvatobhadra Chakra (SBC)**: Classical 9×9 predictive grid fully interactive — transit Vedha analysis, Dhana (financial) pulse meter, body-part resonance alerts, cell-level interaction with row/column vedha glow.
- **Consultation Booking System**: Full-featured client/practitioner booking portal with categories, service listings, practitioner profiles, booking flow, and admin management — including automated reminders and pending-cleanup cron jobs.
- **KP Significators Engine**: Krishnamurti Paddhati significator levels (A–D) for all 12 houses, integrated into Prashna dashboard.
- **Prashna (Horary) Professional**: Oracle compass SVG for remedial directions, ruling planets analytics, KP significators, and "Copy Report to Clipboard" feature.
- **Vastu Analysis**: Correlate birth chart placements with classical Vastu directions and zones.
- **Upagraha Support**: Engine-level calculation for all Upagrahas (Dhooma, Vyatipata, Parivesha, Indrachapa, Upaketu, plus the five Dhuma chain nodes).
- **Jaimini Workspace**: Dedicated page with Chara Dasha visualization and Jaimini special aspects.
- **Elite Astrocartography Suite**: NASA-grade relocation mapping with Cyclo-Carto-Graphy (real-time transits), Local Space (Azimuth) lines, Paran (Latitude Crossing) detection, and Aspect Harmonics (Trines/Squares to MC).
- **Progressive Web App (PWA)**: Full offline resilience with Service Workers, Web manifest v3, and native-grade installability for iOS/Android/Desktop.
- **Consultancy-Grade Reporting**: Restricted tooltips to planet names in details tables, "Copy Report to Clipboard" for all analysis panels.
- **Bhava Bala**: Full BPHS house strength engine — Adhipati, Dig, and Drishti Bala for all 12 houses, with grid/table/bar-chart UI and strongest/weakest house callout.
- **Client CRM Dashboard**: Full Platinum CRM at `/clients` — add, edit, tag clients; session notes; remedy tracker; active Dasha progress bar; Dasha-transition alerts.
- **White-label Sharing**: Platinum `brandName` + `brandLogo` rendered on all public share pages and future PDF exports.
- **Admin Command Center**: Internal metrics, user management, and system health monitoring at `/admin`.
- **Vedaansh Rebranding** (March 2026): Full ecosystem rename from "Vedic Amrit" to **Vedaansh**.
- **Dashboard v2**: Responsive mobile-first dashboard with integrated "Personal Day" cosmic insights.
- **i18n**: Initial Hindi translation rollout for birth forms and planetary tables.

---

## Calculation Engine — 43 Modules

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
| `muhurtaAdvanced.ts` | ✅ | Advanced Muhurta — Tara, Panchaka, Graha Hora filtering |
| `muhurtaAnalysis.ts` | ✅ | Muhurta window analysis with graded suitability |
| `muhurtaPersonal.ts` | ✅ | Personal muhurta suitability scoring for birth chart |
| `astroInterpretation.ts` | ✅ | Elite ACG reading engine — Career, Home, and Love meanings |
| `aspects.ts` | ✅ | Visual Parashari Drishti — standard and special planetary house aspects |
| `astrocartography.ts` | ✅ | NASA-grade relocation: Cyclo-Carto-Graphy, Local Space, Paran lines |
| `kpEngine.ts` | ✅ | Krishnamurti Paddhati — house significators at A (star lord) through D levels |
| `krishneeyam.ts` | ✅ | Krishneeyam — refinement of KP sub-lord theory |
| `sarvatobhadra.ts` | ✅ | Sarvatobhadra Chakra — 9×9 predictive grid with transit Vedha |
| `sbcUseCases.ts` | ✅ | SBC use-case categorization (Dhana, health, travel, etc.) |
| `upagrahas.ts` | ✅ | Upagraha calculation (Dhooma, Vyatipata, Parivesha, Indrachapa, Upaketu, etc.) |
| `astroDetailsDerived.ts` | ✅ | Derived planetary details for UI display |
| `interpretations.ts` | ✅ | General chart interpretations and narrative text |
| `grahaDisplayColors.ts` | ✅ | Standard planetary color mappings for UI rendering |
| `calculator.ts` | ✅ | Main orchestrator — all engines wired, returns `ChartOutput` |
| `dasha/vimshottari.ts` | ✅ | 120yr cycle, 6-level tree (Maha→Antar→Pratyantar→Sukshma→Prana→Deha) |
| `dasha/yogini.ts` | ✅ | 36yr, 8 Yoginis, birth balance from Moon nakshatra position |
| `dasha/chara.ts` | ✅ | Jaimini sign dasha, forward/reverse per parity, birth balance from Lagna degree |
| `dasha/ashtottari.ts` | ✅ | 108yr conditional Dasha — active for Krishna paksha births outside Rahu nakshatra |

---

## Project Structure

```
Vedaansh/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Home / Chart form
│   │   ├── layout.tsx                  # Root layout with providers
│   │   ├── home/                       # Landing page sections
│   │   ├── account/                    # User profile + preferences
│   │   ├── acg/                        # Astrocartography relocation map
│   │   ├── admin/                      # Admin command center
│   │   │   ├── charts/                 # All charts admin view
│   │   │   ├── reel/                   # Reel management
│   │   │   ├── revenue/                # Revenue analytics
│   │   │   └── users/                  # User management
│   │   ├── astrology/                  # Astrology workspace
│   │   ├── chart/[slug]/               # Public share page
│   │   ├── clients/                    # Platinum CRM dashboard
│   │   ├── compare/                    # Chart Comparison + Ashtakoot
│   │   ├── consult/                    # Consultation booking portal
│   │   │   ├── [categorySlug]/         # Category listing
│   │   │   ├── admin/                  # Consult admin
│   │   │   ├── book/                   # Booking flow
│   │   │   ├── booking/                # Booking management
│   │   │   ├── dept/                   # Department view
│   │   │   ├── me/                     # My consultations
│   │   │   └── p/                      # Practitioner profiles
│   │   ├── forgot/                     # Password reset request
│   │   ├── jaimini/                    # Jaimini workspace
│   │   ├── login/                      # Login page
│   │   ├── muhurta/                    # Muhurta Finder
│   │   ├── my/
│   │   │   ├── charts/                 # Saved charts library
│   │   │   └── consultations/          # My consultation history
│   │   ├── nakshatra/                  # Nakshatra Lab workspace
│   │   ├── panchang/                   # Daily Panchang + Calendar
│   │   ├── prashna/                    # Horary (Prashna) dashboard
│   │   ├── pricing/                    # Subscription tiers
│   │   ├── reset-password/             # Password reset form
│   │   ├── roadmap/                    # Development roadmap
│   │   ├── sbc/                        # Sarvatobhadra Chakra
│   │   ├── scrubber/                   # Scrubber tool
│   │   ├── signup/                     # Registration
│   │   ├── vastu/                      # Vastu analysis
│   │   ├── verify-email/               # Email verification
│   │   └── api/
│   │       ├── admin/
│   │       │   ├── charts/             # Admin chart CRUD
│   │       │   ├── revenue/            # Revenue data
│   │       │   ├── stats/              # System metrics
│   │       │   └── users/              # User admin
│   │       ├── atlas/search/           # 5.1M location search
│   │       ├── auth/
│   │       │   ├── [...nextauth]/      # NextAuth handler
│   │       │   ├── forgot-password/    # Request reset
│   │       │   ├── refresh-plan/       # Session plan refresh
│   │       │   ├── reset-password/     # Execute reset
│   │       │   ├── signup/             # Email/password register
│   │       │   └── verify-email/       # Verify token
│   │       ├── chart/
│   │       │   ├── astrocartography/   # ACG calculation
│   │       │   ├── bulk-export/        # Bulk PDF ZIP (Plat.)
│   │       │   ├── bulk-import/        # CSV/JSON import (Gold+)
│   │       │   ├── calculate/          # Main chart calculation
│   │       │   ├── delete/             # Owner-only delete
│   │       │   ├── export/             # PDF export (Gold+)
│   │       │   ├── export-xlsx/        # Excel export
│   │       │   ├── list/               # Paginated chart list
│   │       │   ├── notes/              # Per-chart annotations
│   │       │   ├── public/             # GET by slug — no auth
│   │       │   ├── relocate/           # Relocation chart
│   │       │   ├── save/               # Save to MongoDB
│   │       │   ├── send-email/         # Email chart (Gold+)
│   │       │   ├── template/           # Chart templates
│   │       │   ├── toggle-public/      # Share toggle
│   │       │   └── varshaphal/         # Solar Return calc
│   │       ├── clients/                # CRM API (Platinum)
│   │       ├── consult/
│   │       │   ├── admin/              # Consult admin
│   │       │   ├── auth/               # Consult auth
│   │       │   ├── bookings/           # Booking CRUD
│   │       │   ├── categories/         # Service categories
│   │       │   ├── dept/               # Departments
│   │       │   ├── me/                 # My consults
│   │       │   ├── practitioners/      # Practitioner profiles
│   │       │   └── services/           # Services listing
│   │       ├── cron/
│   │       │   ├── consult-pending-cleanup/  # Stale bookings
│   │       │   ├── consultation-complete/    # Auto-complete
│   │       │   └── consultation-reminders/   # Email reminders
│   │       ├── health/                 # System health check
│   │       ├── muhurta/timeline/       # Muhurta timeline data
│   │       ├── panchang/               # Daily Panchang
│   │       ├── payment/
│   │       │   ├── checkout/           # Razorpay order
│   │       │   └── verify/             # Verify payment
│   │       ├── transit/                # Transit data
│   │       ├── transits/planets/       # Planet-specific transits
│   │       ├── user/
│   │       │   ├── default-chart/      # Default chart pref
│   │       │   └── me/                 # Profile + prefs
│   │       └── webhooks/razorpay/      # Subscription activation
│   ├── lib/engine/                     # 🔑 Core Jyotish engine (43 modules)
│   │   └── dasha/                      # Dasha subsystems
│   ├── lib/db/models/                  # User, Chart, ChartCache, Subscription, etc.
│   ├── lib/atlas/                      # Geo atlas SQLite + FTS5
│   ├── lib/pdf/                        # PDF generation
│   ├── components/
│   │   ├── admin/                      # Admin UI components
│   │   ├── chakra/                     # SVG chart renderers
│   │   ├── consult/                    # Consultation UI
│   │   ├── dasha/                      # DashaTree component
│   │   ├── dashboard/                  # Dashboard widgets
│   │   ├── home/                       # Landing page components
│   │   ├── panchang/                   # Panchang UI
│   │   ├── providers/                  # React context providers
│   │   ├── reel/                       # Remotion reel components
│   │   ├── shell/                      # Layout shell (header, nav, footer)
│   │   └── ui/                         # All shared UI components
│   └── types/astrology.ts              # All TypeScript domain types
├── __tests__/                          # Vitest engine tests
├── ephe/                               # Swiss Ephemeris .se1 files
├── remotion/                           # Remotion video reel config
└── scripts/                            # Utility scripts
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
| `GET /api/chart/public` | ✅ | Fetch public chart by slug |
| `POST /api/chart/toggle-public` | ✅ | Toggle `isPublic`, generate/remove slug |
| `POST /api/chart/varshaphal` | ✅ | Solar Return for given year — bisection search |
| `POST /api/chart/export` | ✅ | PDF chart export (Gold+) |
| `POST /api/chart/bulk-import` | ✅ | CSV/JSON batch import (Gold+) |
| `POST /api/chart/bulk-export` | ✅ | Bulk PDF ZIP export (Platinum) |
| `GET /api/chart/export-xlsx` | ✅ | Excel chart export |
| `POST /api/chart/relocate` | ✅ | Relocation chart calculation |
| `POST /api/chart/send-email` | ✅ | Email chart PDF (Gold+) |
| `GET /api/chart/template` | ✅ | Chart template presets |
| `POST /api/chart/astrocartography` | ✅ | ACG relocation lines computation |
| `GET /api/panchang` | ✅ | Full Panchang for any date + location, Redis cached 24h |
| `GET /api/atlas/search` | ✅ | Location typeahead — 5.1M GeoNames via SQLite FTS5 |
| `GET /api/transit` | ✅ | Current transit positions |
| `GET /api/transits/planets` | ✅ | Planet-specific transit details |
| `GET /api/muhurta/timeline` | ✅ | Muhurta timeline windows |
| `GET /api/user/me` | ✅ | User profile + personal chart + preferences |
| `PATCH /api/user/me` | ✅ | Update user preferences |
| `GET/PATCH /api/user/default-chart` | ✅ | Default chart preference |
| `POST /api/auth/signup` | ✅ | Email/password registration with bcrypt |
| `POST /api/auth/verify-email` | ✅ | Email verification token check |
| `POST /api/auth/forgot-password` | ✅ | Password reset email request |
| `POST /api/auth/reset-password` | ✅ | Execute password reset with token |
| `POST /api/auth/refresh-plan` | ✅ | Refresh user plan in session after upgrade |
| `POST /api/payment/checkout` | ✅ | Razorpay order creation for Gold/Platinum |
| `POST /api/payment/verify` | ✅ | Verify Razorpay payment signature |
| `POST /api/webhooks/razorpay` | ✅ | Activate subscription on payment success |
| `GET/POST /api/clients` | ✅ | CRM client CRUD (Platinum) |
| `GET /api/clients/[id]` | ✅ | Single client detail + session notes (Platinum) |
| `GET /api/consult/categories` | ✅ | Consultation service categories |
| `GET /api/consult/services` | ✅ | Services listing |
| `GET /api/consult/practitioners` | ✅ | Practitioner profiles |
| `POST /api/consult/bookings` | ✅ | Create booking |
| `GET /api/consult/me` | ✅ | My consultations |
| `GET /api/consult/admin` | ✅ | Consult admin panel |
| `GET /api/consult/dept` | ✅ | Department listings |
| `GET /api/health` | ✅ | System health endpoint |
| `GET /api/admin/stats` | ✅ | System-wide metrics (Admin) |
| `GET /api/admin/users` | ✅ | User management (Admin) |
| `GET /api/admin/charts` | ✅ | All charts view (Admin) |
| `GET /api/admin/revenue` | ✅ | Revenue analytics (Admin) |
| `GET /api/cron/consultation-reminders` | ✅ | Auto-email reminders for upcoming consults |
| `GET /api/cron/consultation-complete` | ✅ | Auto-complete stale consultations |
| `GET /api/cron/consult-pending-cleanup` | ✅ | Cleanup abandoned bookings |

---

## Known Issues

| Issue | Severity | Status |
|---|---|---|
| All major issues resolved | — | ✅ Stable |

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
| 8 — Scale + Polish | ✅ Complete | Astrocartography, Admin Dashboard, PWA, i18n (partial) |
| 9 — Elite Analysis | ✅ Complete | Interactive Aspects, Prashna Professional, CRM v2 |
| 10 — Sarvatobhadra & Ecosystem | ✅ Complete | SBC, Vastu, Jaimini, KP Engine, Consultation Portal, Upagrahas |

### Remaining Work

- [ ] **Full i18n** — Hindi/Sanskrit rollout for all UI components and tables

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
*v2.6.0 · May 2026 · [Vedaansh Platform](https://github.com/abhishek081999/Vedaansh)*