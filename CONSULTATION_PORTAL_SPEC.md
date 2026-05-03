# Consultation Portal — Full Technical Specification

**Version:** 1.3 (Cloudinary chosen for uploads)
**Status:** Approved for build
**Owner:** Vedaansh Engineering
**Last updated:** 2026-05-02

---

## 0. Document map

1. [Goals & non-goals](#1-goals--non-goals)
2. [Glossary](#2-glossary)
3. [High-level architecture](#3-high-level-architecture)
4. [Role hierarchy & permissions](#4-role-hierarchy--permissions)
5. [Authentication & authorization](#5-authentication--authorization)
6. [Data model](#6-data-model) — includes [§6.11 Media: photos, logos, category art](#611-media-consultant-photos-logos-and-platform-assets)
7. [Route map](#7-route-map)
8. [API surface](#8-api-surface)
9. [Slot engine](#9-slot-engine)
10. [Booking lifecycle](#10-booking-lifecycle)
11. [Payments & commission](#11-payments--commission)
12. [Email system](#12-email-system)
13. [Reminder cron](#13-reminder-cron)
14. [Refund & cancellation](#14-refund--cancellation)
15. [Dashboard specifications](#15-dashboard-specifications)
16. [UI / styling guidelines](#16-ui--styling-guidelines)
17. [Environment variables](#17-environment-variables)
18. [File-by-file inventory](#18-file-by-file-inventory)
19. [Phased build plan](#19-phased-build-plan)
20. [Testing strategy](#20-testing-strategy)
21. [Security & compliance](#21-security--compliance)
22. [Operational runbook](#22-operational-runbook)
23. [Out of scope (V2 roadmap)](#23-out-of-scope-v2-roadmap)
24. [Appendix: complete implementation reference](#24-appendix-complete-implementation-reference) — *error codes, validation, API bodies, indexes, constants, edge cases*

---

## 1. Goals & non-goals

### 1.1 Goals

- Add a **fully self-contained Consultation Portal** to the existing Vedaansh Jyotish Platform, accessible at `/consult`, that lets any logged-in Vedaansh user book paid 1:1 sessions with practitioners across multiple categories (astrologers, healers, doctors, vastu experts, tarot readers, etc.).
- Provide **three distinct staff dashboards**:
  - **Super Admin** — global control plane.
  - **Consultant Admin** — per-category (department) manager.
  - **Practitioner** — individual provider.
- Make **everything customizable** without code changes: categories, practitioner profiles, services, prices, slot durations, buffers, weekly availability, per-day exceptions, commission %, cancellation window, reminder lead time, email templates, branding.
- Process payments via **Razorpay**, with platform-collected revenue and a configurable commission split tracked per booking.
- Send **transactional emails** (booking confirmation, practitioner notification, reschedule, cancellation, reminder, refund) via Resend, with DB-driven templates editable by super-admin.
- Keep the consultation system **fully isolated** from the existing astrology product (separate collections, separate staff auth, separate route tree). Only the booker identity is shared with the astrology user account.

### 1.2 Non-goals (V1)

- No integrated video room — practitioner provides a `meetingLink` per booking (Zoom / Google Meet / Jitsi etc.).
- No reviews / ratings UI (data field reserved on `ConsultPractitioner` for V2).
- No automated payouts — settlements are manual, tracked in audit log; Razorpay Route comes in V2.
- No coupons / discount codes.
- No group / multi-attendee sessions.
- No recurring / package bookings.
- No in-app chat.
- No two-way Google / Outlook calendar sync.
- No multi-currency at booking time — V1 ships with one default currency in `ConsultSettings` (INR by default).

---

## 2. Glossary

| Term | Meaning |
|---|---|
| **Booker / Client** | An authenticated Vedaansh user who books a session. Stored in existing `users` collection. |
| **Staff** | Any of `super_admin`, `consultant_admin`, `practitioner`. Stored in new `consult_staff` collection. |
| **Category** | A discipline / department (e.g. "Astrology", "Reiki Healing", "Ayurvedic Doctor"). One Consultant Admin per category. |
| **Practitioner** | An individual provider; belongs to exactly one category. |
| **Service** | A bookable offering by a practitioner (e.g. "30-min Birth Chart Reading — ₹999"). |
| **Slot** | A concrete time window derived from availability rules minus exceptions and bookings. |
| **Booking** | A confirmed (or pending) reservation of a slot for a service by a booker. |
| **Commission** | Platform's cut of a paid booking (`commissionPercent` in `ConsultSettings`). |
| **Net** | Practitioner's earnings after commission. |

---

## 3. High-level architecture

```mermaid
flowchart LR
    Booker["Vedaansh user (booker)"] -->|browses| PublicSite["/consult/* public pages"]
    PublicSite -->|create + pay| BookingAPI["POST /api/consult/bookings"]
    BookingAPI --> Razorpay
    Razorpay -->|webhook| WebhookAPI["/api/webhooks/razorpay"]
    BookingAPI -->|mail| Resend
    WebhookAPI --> ConsultDB[(MongoDB: consult_* collections)]
    BookingAPI --> ConsultDB

    subgraph StaffPlane["Staff plane (separate JWT cookie auth)"]
      direction TB
      Super["Super Admin"] --> SuperDash["/consult/admin/*"]
      Dept["Consultant Admin (category-scoped)"] --> DeptDash["/consult/dept/*"]
      Pract["Practitioner"] --> PrDash["/consult/me/*"]
    end

    SuperDash --> StaffAPI["/api/consult/admin/*"]
    DeptDash --> StaffAPI2["/api/consult/dept/*"]
    PrDash --> StaffAPI3["/api/consult/me/*"]
    StaffAPI --> ConsultDB
    StaffAPI2 --> ConsultDB
    StaffAPI3 --> ConsultDB

    Cron["External / Vercel cron (15 min)"] -->|with CRON_SECRET| ReminderAPI["/api/cron/consultation-reminders"]
    ReminderAPI --> Resend
    ReminderAPI --> ConsultDB
```

### 3.1 Tech stack (already in repo)

- **Framework**: Next.js 14 App Router + TypeScript
- **DB**: MongoDB (Mongoose) — see [src/lib/db/mongodb.ts](src/lib/db/mongodb.ts)
- **Existing auth (for bookers)**: NextAuth v5 — see [src/auth.ts](src/auth.ts)
- **New auth (for staff)**: Custom HS256 JWT cookie, signed with `AUTH_SECRET`. No new dependency — implemented with Web Crypto.
- **Payments**: `razorpay` package (already a dependency)
- **Email**: `resend` package (already a dependency)
- **Validation**: `zod` everywhere on API boundaries
- **Time / TZ math**: `date-fns` + `date-fns-tz` (already installed)
- **Styling**: Tailwind + the existing CSS variable system in [src/app/globals.css](src/app/globals.css)

### 3.2 Why a separate staff auth?

Mixing `super_admin` / `consultant_admin` / `practitioner` into the existing `User.role` would force the astrology code to know about consultation roles and vice-versa. A separate `consult_staff` collection + a separate cookie keeps the two products **independently deployable, reasonable to reason about, and safer** (a compromised astrology session cannot escalate to staff privileges, and vice versa).

---

## 4. Role hierarchy & permissions

### 4.1 Role tree

```
Platform
├── Super Admin              (one or many; bootstrap via env)
│   └── Consultant Admin     (one per category, owns that category)
│       └── Practitioner     (many per category)
└── Booker                   (any authenticated Vedaansh user)
```

### 4.2 Permissions matrix

| Capability | Super Admin | Consultant Admin (own category) | Practitioner (self only) | Booker |
|---|:---:|:---:|:---:|:---:|
| Create / edit / archive **categories** | yes | no | no | no |
| Invite / suspend **consultant admins** | yes | no | no | no |
| Create / edit / suspend **practitioners** | yes | yes (own category) | edit own profile only | no |
| Edit **practitioner profile** content | yes | yes | own only | no |
| Manage **services** (CRUD) | yes | yes (own category) | own only | no |
| Manage **availability rules + exceptions** | yes (override) | yes (own category) | own only | no |
| View **all bookings** | yes | own category only | own only | own only |
| Cancel a booking on behalf of someone | yes | own category | own | own |
| Issue **refund** | yes | own category | no | request only |
| Edit **email templates** | yes | no | no | no |
| Edit **platform settings** (commission %, etc.) | yes | no | no | no |
| View **revenue / commission reports** | platform-wide | own category | own earnings | no |
| Mark **payout settled** | yes | no | no | no |
| View **audit log** | yes | own category | no | no |

### 4.3 Authorization helpers (`src/lib/consult/auth.ts`)

```ts
requireSuperAdmin()                           // throws 401/403 if not super_admin
requireConsultantAdmin(categoryId?: string)   // super passes; consultant_admin passes only if categoryId matches their own
requirePractitioner(practitionerId?: string)  // super passes; consultant_admin passes within own category; practitioner passes only for their own id
```

---

## 5. Authentication & authorization

### 5.1 Booker auth (unchanged)

Bookers continue to sign in via existing NextAuth flow at `/login`. Their `session.user.id` is the `userId` written on `ConsultBooking`. **No schema changes to the existing `User` model.**

### 5.2 Staff auth (new)

- **Login URL**: `/consult/admin/login` — a single page that accepts email + password and dispatches based on the `role` returned from the server.
- **Endpoint**: `POST /api/consult/auth/login` — validates credentials against `consult_staff`, sets an HttpOnly cookie:

  ```
  Cookie name : vedaansh_consult_session
  Algorithm   : HS256
  Secret      : process.env.AUTH_SECRET
  Payload     : { sid: <staff._id>, role, categoryId?, iat, exp }
  TTL         : 30 days
  Flags       : HttpOnly; Secure (in prod); SameSite=Lax; Path=/
  ```

- **Session helper**: `getStaffSession()` reads the cookie, verifies the signature, returns `{ sid, role, categoryId, staff }` or `null`. Re-fetches `consult_staff` on each call so a `isActive=false` flip immediately revokes access on next request.
- **Logout**: `POST /api/consult/auth/logout` clears the cookie.
- **/me**: `GET /api/consult/auth/me` returns the resolved staff record for client-side hydration.
- **Bootstrap**: `scripts/seed-consult-superadmin.ts` reads `CONSULT_SUPERADMIN_EMAIL` + `CONSULT_SUPERADMIN_PASSWORD` and creates the first `super_admin` row if none exists. Wired as `npm run seed:consult-admin`.

### 5.3 Middleware updates

Extend [middleware.ts](middleware.ts):

```
/consult/admin/*     → require staff cookie, redirect to /consult/admin/login if absent
/consult/dept/*      → require staff cookie with role in {super_admin, consultant_admin}
/consult/me/*        → require staff cookie with role in {super_admin, consultant_admin, practitioner}

/api/consult/admin/* → 401 if no staff cookie
/api/consult/dept/*  → 401/403 enforced in route via requireConsultantAdmin
/api/consult/me/*    → 401/403 enforced in route via requirePractitioner

/consult/book/*      → require NextAuth session, redirect to /login otherwise
```

### 5.4 Login page UX

A single login page handles all three staff roles. After successful login, server returns the role; the client redirects to:

- `super_admin`       → `/consult/admin`
- `consultant_admin`  → `/consult/dept`
- `practitioner`      → `/consult/me`

Practitioners receive an invite email containing a one-time `setPasswordToken` (stored on their `consult_staff` record). They land on `/consult/admin/set-password?token=…`, set a password, and are auto-logged in.

---

## 6. Data model

All consultation collections are namespaced with the `consult_` prefix and live under `src/lib/db/models/consult/`.

### 6.1 `ConsultStaff`

```ts
{
  _id:               ObjectId
  email:             string  // unique, lowercased
  name:              string
  passwordHash:      string | null         // null until invite is accepted
  role:              'super_admin' | 'consultant_admin' | 'practitioner'
  categoryId:        ObjectId | null       // required for consultant_admin & practitioner
  practitionerId:    ObjectId | null       // 1:1 link for role='practitioner'
  isActive:          boolean
  invitedBy:         ObjectId | null
  setPasswordToken:  string | null
  setPasswordExpires: Date | null
  lastLoginAt:       Date | null
  createdAt: Date
  updatedAt: Date
}
```

Indexes: `{ email: 1 }` unique, `{ role: 1, categoryId: 1 }`, `{ practitionerId: 1 }`.

### 6.2 `ConsultCategory`

```ts
{
  _id:           ObjectId
  slug:          string  // unique, kebab-case, used in URLs
  name:          string
  description:   string
  icon:          string  // emoji or icon key
  color:         string  // hex; used for UI accents
  displayOrder:  number
  isActive:      boolean
  intakeFormSchema?: Array<{
    key:      string
    label:    string
    type:     'text' | 'textarea' | 'select' | 'date' | 'checkbox'
    required: boolean
    options?: string[]   // for select
  }>
  createdAt: Date
  updatedAt: Date
}
```

Indexes: `{ slug: 1 }` unique, `{ displayOrder: 1, isActive: 1 }`.

### 6.3 `ConsultPractitioner`

```ts
{
  _id:             ObjectId
  staffId:         ObjectId           // ref ConsultStaff
  categoryId:      ObjectId           // ref ConsultCategory
  slug:            string             // unique, kebab-case, used in URL
  displayName:     string
  headline:        string             // one-liner
  bio:             string             // markdown
  photo:           string | null      // HTTPS URL — see §6.11 (never raw binary in MongoDB for V1)
  // Optional when using first-party upload (object storage); omit for paste-URL-only MVP:
  // photoStorage?: 'external_url' | 's3' | 'r2' | 'vercel_blob'
  // photoObjectKey?: string | null
  // photoUpdatedAt?: Date | null
  languages:       string[]           // ['en', 'hi', 'sa']
  specialties:     string[]
  experienceYears: number
  qualifications:  string[]
  timezone:        string             // IANA, e.g. 'Asia/Kolkata'
  isPublished:     boolean
  sortOrder:       number
  ratingAvg:       number             // reserved, default 0
  totalSessions:   number             // denormalized counter
  createdAt: Date
  updatedAt: Date
}
```

Indexes: `{ slug: 1 }` unique, `{ categoryId: 1, isPublished: 1, sortOrder: 1 }`, `{ staffId: 1 }`.

### 6.4 `ConsultService`

```ts
{
  _id:              ObjectId
  practitionerId:   ObjectId
  title:            string
  description:      string
  durationMinutes:  number             // e.g. 30, 45, 60
  priceAmount:      number             // in smallest unit (paise)
  currency:         'INR' | 'USD' | 'EUR'
  mode:             'video' | 'phone' | 'in_person' | 'chat'
  isActive:         boolean
  sortOrder:        number
  createdAt: Date
  updatedAt: Date
}
```

Indexes: `{ practitionerId: 1, isActive: 1, sortOrder: 1 }`.

### 6.5 `ConsultAvailabilityRule`

Weekly recurring availability.

```ts
{
  _id:                 ObjectId
  practitionerId:      ObjectId
  dayOfWeek:           0 | 1 | 2 | 3 | 4 | 5 | 6   // 0 = Sunday
  startMin:            number   // minutes from local midnight, e.g. 540 = 09:00
  endMin:              number   // exclusive end, e.g. 1080 = 18:00
  slotDurationMinutes: number   // chunking interval, e.g. 30
  bufferMinutes:       number   // gap between bookings
  timezone:            string   // IANA — usually mirrors practitioner.timezone
  isActive:            boolean
  createdAt: Date
  updatedAt: Date
}
```

Indexes: `{ practitionerId: 1, dayOfWeek: 1, isActive: 1 }`.

### 6.6 `ConsultSlotException`

Per-date overrides. Two types:

- `unavailable` — practitioner blocks a window (or whole day if no `startMin/endMin`).
- `available_extra` — practitioner adds a window that doesn't fit the weekly rule (vacation make-ups, special hours).

```ts
{
  _id:            ObjectId
  practitionerId: ObjectId
  date:           string                     // 'YYYY-MM-DD' in practitioner.timezone
  type:           'unavailable' | 'available_extra'
  startMin?:      number
  endMin?:        number
  reason?:        string
  createdAt: Date
}
```

Indexes: `{ practitionerId: 1, date: 1 }`.

### 6.7 `ConsultBooking`

```ts
{
  _id:               ObjectId
  bookingCode:       string                  // human-readable, e.g. 'CN-7Y2K9P'
  userId:            ObjectId                // ref User (booker)
  practitionerId:    ObjectId
  serviceId:         ObjectId
  categoryId:        ObjectId

  slotStart:         Date                    // UTC
  slotEnd:           Date                    // UTC
  durationMinutes:   number
  mode:              'video' | 'phone' | 'in_person' | 'chat'
  meetingLink:       string | null

  intake: {
    notes:   string
    answers: Record<string, unknown>         // matches category.intakeFormSchema
  }

  status:           'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled' | 'no_show'

  priceAmount:        number                 // gross, paise
  commissionPercent:  number                 // snapshot at booking time
  commissionAmount:   number
  netToPractitioner:  number
  currency:           'INR' | 'USD' | 'EUR'

  razorpayOrderId:   string | null
  razorpayPaymentId: string | null
  paidAt:            Date | null
  refundId:          string | null
  refundedAt:        Date | null
  refundAmount:      number | null

  cancellationReason: string | null
  cancelledAt:        Date | null
  cancelledByRole:    'booker' | 'practitioner' | 'consultant_admin' | 'super_admin' | null

  rescheduleHistory: Array<{
    from:        Date
    to:          Date
    reason?:     string
    actorRole:   string
    at:          Date
  }>

  reminderSentAt:  Date | null

  payoutSettled:   boolean                   // for manual settlement tracking
  payoutSettledAt: Date | null

  createdAt: Date
  updatedAt: Date
}
```

Indexes:

- `{ bookingCode: 1 }` unique
- `{ userId: 1, slotStart: -1 }`
- `{ practitionerId: 1, slotStart: 1 }`
- `{ status: 1, slotStart: 1 }`
- `{ razorpayOrderId: 1 }` sparse unique
- `{ razorpayPaymentId: 1 }` sparse unique

Concurrency safeguard: a partial unique index on `{ practitionerId: 1, slotStart: 1 }` filtered by `status ∈ {pending, confirmed}` prevents double-booking the same slot.

### 6.8 `ConsultEmailTemplate`

```ts
{
  _id:          ObjectId
  key:          string                   // unique: 'booking_confirmed_client', etc.
  subject:      string                   // mustache vars allowed
  html:         string                   // mustache vars allowed
  isActive:     boolean
  lastEditedBy: ObjectId | null
  updatedAt:    Date
  createdAt:    Date
}
```

Indexes: `{ key: 1 }` unique.

### 6.9 `ConsultSettings` (singleton)

A single row identified by `{ singleton: 'global' }`.

```ts
{
  singleton:               'global'
  commissionPercent:       number        // e.g. 15
  defaultCurrency:         'INR' | 'USD' | 'EUR'
  brandName:               string
  brandLogo:               string | null
  supportEmail:            string
  defaultBufferMinutes:    number
  defaultSlotMinutes:      number
  reminderHoursBefore:     number        // e.g. 24
  cancellationWindowHours: number        // e.g. 12
  bookingLeadHours:        number        // min hours between now and slot start
  maxAdvanceBookingDays:   number        // e.g. 60
  updatedAt: Date
}
```

### 6.10 `ConsultAuditLog`

```ts
{
  _id:         ObjectId
  actorStaffId: ObjectId | null
  actorRole:    string
  action:       string                   // e.g. 'category.create', 'booking.refund'
  targetType:   string                   // 'category' | 'practitioner' | 'booking' | …
  targetId:     ObjectId | null
  payload:      Record<string, unknown>  // before/after diff, sanitized
  ip:           string
  userAgent:    string
  createdAt:    Date
}
```

Indexes: `{ createdAt: -1 }`, `{ actorStaffId: 1, createdAt: -1 }`, `{ targetType: 1, targetId: 1 }`.

### 6.11 Media: consultant photos, logos, and platform assets

This section answers: **where does the consultant’s image live, who can change it, and what the app actually stores?**

**Project decision (Vedaansh on Render):** first-party image uploads use **[Cloudinary](https://cloudinary.com/)**. The API uploads to Cloudinary from `POST …/upload-photo`; **`ConsultPractitioner.photo`** stores Cloudinary’s **`secure_url`**. Optional field **`photoCloudinaryPublicId`** (or reuse a generic `photoRemoteId`) stores Cloudinary **`public_id`** so replacing/deleting an image can call Cloudinary’s destroy API. **Mode A** (staff pastes any HTTPS image URL) remains supported alongside uploads.

#### 6.11.1 Core rule (V1)

- **MongoDB stores references only** — typically an **absolute HTTPS URL** string pointing at the image bytes elsewhere.
- **MongoDB does not store** raw image binary (`Buffer`), Base64 blobs in documents, or GridFS for profile photos in MVP (GridFS is reserved for V2 if you want everything self-hosted).
- The **canonical field** for a consultant’s public face is **`ConsultPractitioner.photo`** — `string | null`, meaning “URL of the profile image shown on `/consult`, directory cards, and booking emails.”

If `photo` is `null`, the UI uses a **deterministic fallback**: initials avatar from `displayName` on a category-tinted circle, or a generic silhouette SVG — same pattern as the rest of Vedaansh.

#### 6.11.2 What `photo` points to (three supported ingestion modes)

| Mode | What gets saved in DB | Where bytes live | Best for |
|---|---|---|---|
| **A — External URL (paste)** | The URL string the staff pastes | Third-party host (Imgur, Cloudinary, Google user content, practitioner’s own CDN, etc.) | Fastest MVP; zero storage bill |
| **B — First-party upload** | Public URL returned by your upload API | **Cloudinary** (default for this project on Render), or AWS S3 / Cloudflare R2 / B2 / Vercel Blob | Production; predictable URLs; delete-on-replace |
| **C — Bundled static** | Path like `/consult-assets/featured/dr-sharma.jpg` | **`public/`** in the Next.js repo | Only for **platform-curated** heroes or seed data — **not** for every consultant (requires redeploy to change) |

**Recommendation:** ship **Mode A** first if time-constrained; add **Mode B** via **Cloudinary** (`POST /api/consult/me/upload-photo`, etc.) before public launch so consultants are not dependent on random paste URLs.

#### 6.11.3 Detailed flow — Mode B (recommended production path)

```mermaid
sequenceDiagram
    actor Staff as Practitioner or Admin
    participant UI as Profile form<br/>multipart file input
    participant API as POST /api/consult/.../upload-photo
    participant Store as Object storage<br/>(S3 / R2 / Vercel Blob)
    participant DB as MongoDB<br/>consult_practitioners

    Staff->>UI: choose JPEG/PNG/WebP
    UI->>API: multipart file + CSRF-safe cookie
    API->>API: verify staff auth; size/type check
    API->>Store: putObject(key, body, contentType)
    Store-->>API: public URL (or signed CDN URL)
    API->>DB: photo = publicUrl; optional photoObjectKey = key
    API-->>UI: { url }
    UI-->>Staff: preview + saved
```

- **Object key convention** (example): `consult/practitioners/{practitionerId}/{uuid}.{ext}` — makes orphan cleanup and GDPR deletion obvious.
- **After a successful new upload**, if the previous image was stored in **your** bucket (`photoObjectKey` present), **delete the old object** to avoid storage leaks.

#### 6.11.4 Optional schema extensions (when using Mode B)

If you implement first-party upload, extend `ConsultPractitioner` (same collection, additive fields):

```ts
photo:              string | null   // public HTTPS URL (always)
photoStorage:       'external_url' | 's3' | 'r2' | 'vercel_blob' | null
photoObjectKey:     string | null   // set when bytes are in your bucket; used for delete
photoContentType:   string | null   // e.g. 'image/jpeg'
photoByteSize:      number | null     // bytes; for admin moderation
photoUpdatedAt:     Date | null
```

- **`photoStorage: 'external_url'`** — staff pasted a URL; **never** try to delete remote bytes (you don’t own them).
- **`photoObjectKey`** — always set when `photoStorage` is your bucket; **omit** for external URLs.

#### 6.11.5 Validation rules (paste URL — Mode A)

| Check | Rule |
|---|---|
| Scheme | Must be `https:` (reject `http:` in production to avoid mixed content and downgrade attacks). |
| Host allowlist (optional) | Super-admin setting `allowedPhotoHosts: string[]` — if empty, any HTTPS host; if set, only those hosts (stops some SSRF abuse from staff paste). |
| SSRF hardening | Server-side `HEAD` or `GET` with **timeout (3s)**, **max redirect hops (3)**, **block RFC1918 / loopback** — never fetch internal IPs from the Next.js server when “validating” a URL. Safer: skip remote fetch in MVP and only validate URL shape + HTTPS. |
| Length | Max URL length **2048** characters (matches typical browser limits). |

#### 6.11.6 Validation rules (upload — Mode B)

| Check | Suggested limit |
|---|---|
| MIME | Allow `image/jpeg`, `image/png`, `image/webp` only (reject GIF/SVG in V1 — SVG XSS surface). |
| Max size | **5 MB** per file (adjust per hosting). |
| Dimensions | Optional: reject if width or height **> 4096px** server-side using `sharp` or probe — **optional dependency**; can skip in MVP and rely on CSS `object-cover`. |
| Magic bytes | Verify file signature matches claimed MIME (don’t trust browser-provided type alone). |

#### 6.11.7 Display rules in the product

| Surface | Behaviour |
|---|---|
| **Directory cards** (`/consult`, `/consult/[category]`) | Square or rounded-square **thumbnail**, **cover** crop (`object-cover`), fixed height ~160–200px, lazy-loaded `<Image>` from `next/image` with `sizes` for responsive srcset. |
| **Profile hero** (`/consult/p/[slug]`) | Larger image or circular avatar + name; optional blurred background using same URL (`blurDataURL` optional V2). |
| **Emails** | Many clients block external images by default — always include **alt text** with practitioner name; `brandLogo` same rules. Use **absolute HTTPS** URLs only in HTML. |
| **Staff dashboards** | Small 40–48px avatar in tables and headers. |

#### 6.11.8 Who can set or change the consultant image

| Role | Can change `ConsultPractitioner.photo` |
|---|---|
| **Super Admin** | Yes — any practitioner |
| **Consultant Admin** | Yes — only practitioners in **their** `categoryId` |
| **Practitioner** | Yes — **own** profile only (`/consult/me/profile`) |
| **Booker** | Never |

All changes — especially URL paste from admin — should append **`ConsultAuditLog`** (`action: 'practitioner.photo_update'`, store previous URL redacted if needed).

#### 6.11.9 Platform brand logo (`ConsultSettings.brandLogo`)

- Same storage philosophy: **string URL**, HTTPS, typically uploaded once by super-admin on `/consult/admin/settings`.
- Used in email templates as `{{brandLogoUrl}}` and optionally in `/consult` header.
- Prefer **wide rectangular** logo (e.g. **~600×120 px** max display width in email); store hi-res PNG/WebP with transparent background.

#### 6.11.10 Category visuals (`ConsultCategory.icon`, `ConsultCategory.color`)

- **`icon`** — flexible encoding for MVP:
  - **Single Unicode emoji** (e.g. `✨`, `🔮`) — zero hosting cost; render as text.
  - **Or** short **icon key** aligned with Lucide (`'Sparkles'`) if you map keys to SVG components in code — still no binary in DB.
  - **Or** HTTPS URL to a small PNG/SVG — same validation as practitioner photo for pasted URLs.
- **`color`** — hex string `#RRGGBB` for category accent borders and avatar fallback ring — **not** an image.

#### 6.11.11 Email templates and inline images

- Transactional HTML lives in `ConsultEmailTemplate` — images inside templates must use **public absolute URLs** (same domain as `NEXT_PUBLIC_APP_URL` or CDN).
- Do **not** embed multi-megabyte Base64 images in MongoDB template bodies — link to hosted assets under `/public` or object storage.

#### 6.11.12 Broken / stale URLs

- If `photo` URL returns 404 at runtime (browser `onError` on `<img>`), fall back to **initials avatar**; optionally show staff-only banner “Image failed to load — update URL.”
- Periodic job (V2): HEAD-check practitioner photos weekly and notify consultant admin.

#### 6.11.13 Environment variables (when using object storage)

**Default for this project — Cloudinary** (set on Render service → Environment):

```bash
# Cloudinary — practitioner photos + optional brand logo upload
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
# Optional: folder prefix for consult assets (e.g. consult/practitioners)
CLOUDINARY_UPLOAD_FOLDER=vedaansh/consult
```

- Server-only: **`CLOUDINARY_API_SECRET`** never exposed to the browser.
- Upload API uses signed upload or server-side `upload_stream` with `folder: process.env.CLOUDINARY_UPLOAD_FOLDER`.
- **`next/image`:** add Cloudinary host to `images.remotePatterns` in [next.config.mjs](next.config.mjs), e.g. `hostname: 'res.cloudinary.com'`, `pathname: '/your_cloud_name/**'` (match [Next.js remote patterns](https://nextjs.org/docs/app/api-reference/components/image#remotepatterns)).

**Alternatives** (if you migrate off Cloudinary):

```bash
# AWS S3 / compatible (R2, MinIO)
CONSULT_S3_BUCKET=vedaansh-consult
CONSULT_S3_REGION=auto
CONSULT_S3_ACCESS_KEY_ID=...
CONSULT_S3_SECRET_ACCESS_KEY=...
CONSULT_S3_PUBLIC_BASE_URL=https://cdn.example.com

# Vercel Blob (only if also deploying to Vercel)
BLOB_READ_WRITE_TOKEN=...
```

Public pages never receive raw secrets — only the API routes that write to storage.

#### 6.11.14 Consultant Admin vs practitioner — same image rules

- **Consultant Admin** editing a practitioner’s photo uses the **same** field (`photo`) and the **same** upload endpoint — authorization ensures `categoryId` match.
- **Super Admin** bypasses category scope.

#### 6.11.15 Related fields (not images)

- **`bio`** — Markdown or sanitized HTML; **not** stored as image. Sanitize on render (no raw `<script>`).
- **`qualifications`** — text array; certificates as PDFs = **V2** (`ConsultPractitionerCertificate` model + file upload).

---

## 7. Route map

### 7.1 Public (booker) pages

| Route | Purpose |
|---|---|
| `/consult` | Landing — hero + category grid + featured practitioners |
| `/consult/[categorySlug]` | Practitioner directory in a category, with filters |
| `/consult/p/[practitionerSlug]` | Practitioner profile + service list + slot picker |
| `/consult/book/[serviceId]?start=…` | Intake form + summary + Razorpay handoff |
| `/consult/booking/[bookingId]` | Post-payment confirmation page |
| `/my/consultations` | Booker's own bookings: upcoming + past, with cancel / reschedule actions |

### 7.2 Staff pages

| Route | Required role |
|---|---|
| `/consult/admin/login` | (anyone) |
| `/consult/admin/set-password` | invited staff with valid token |
| `/consult/admin` | super_admin |
| `/consult/admin/categories` | super_admin |
| `/consult/admin/admins` | super_admin |
| `/consult/admin/practitioners` | super_admin |
| `/consult/admin/bookings` | super_admin |
| `/consult/admin/revenue` | super_admin |
| `/consult/admin/email-templates` | super_admin |
| `/consult/admin/settings` | super_admin |
| `/consult/admin/audit` | super_admin |
| `/consult/dept` | consultant_admin (or super) |
| `/consult/dept/practitioners` | consultant_admin |
| `/consult/dept/bookings` | consultant_admin |
| `/consult/dept/revenue` | consultant_admin |
| `/consult/me` | practitioner (or super / consultant_admin viewing-as) |
| `/consult/me/profile` | practitioner |
| `/consult/me/services` | practitioner |
| `/consult/me/availability` | practitioner |
| `/consult/me/bookings` | practitioner |
| `/consult/me/earnings` | practitioner |

---

## 8. API surface

All `/api/consult/*` routes return JSON envelopes: `{ success: true, data }` or `{ success: false, error: { code, message, details? } }`.

### 8.1 Auth

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/consult/auth/login` | none | email + password → set staff cookie |
| POST | `/api/consult/auth/logout` | staff | clear cookie |
| GET  | `/api/consult/auth/me` | staff | resolve current staff |
| POST | `/api/consult/auth/set-password` | one-time token | accept invite, set password |

### 8.2 Public catalog

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/consult/categories` | none | active categories, ordered |
| GET | `/api/consult/practitioners?category=&q=&lang=` | none | published practitioner directory |
| GET | `/api/consult/practitioners/[slug]` | none | profile + active services |
| GET | `/api/consult/practitioners/[id]/slots?from=&to=` | none | free slots in range |

### 8.3 Booking

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/consult/bookings` | booker (NextAuth) | create pending booking + Razorpay order |
| POST | `/api/consult/bookings/[id]/verify` | booker | verify Razorpay signature → confirm |
| GET | `/api/consult/bookings/[id]` | booker (own) / staff | booking detail |
| POST | `/api/consult/bookings/[id]/cancel` | booker / staff | cancel + optional refund |
| POST | `/api/consult/bookings/[id]/reschedule` | booker / staff | move to a new slot |
| POST | `/api/consult/bookings/[id]/refund` | super / consultant_admin | issue Razorpay refund |
| GET | `/api/consult/me/bookings/list` | booker | own bookings |

### 8.4 Practitioner self-service

| Method | Path | Auth |
|---|---|---|
| GET / PATCH | `/api/consult/me/profile` | practitioner |
| POST | `/api/consult/me/upload-photo` | practitioner — multipart → object storage; updates `photo` + optional `photoObjectKey` (§6.11) |
| GET / POST / PATCH / DELETE | `/api/consult/me/services[/id]` | practitioner |
| GET / POST / PATCH / DELETE | `/api/consult/me/availability[/id]` | practitioner |
| GET / POST / DELETE | `/api/consult/me/exceptions[/id]` | practitioner |
| GET | `/api/consult/me/bookings` | practitioner |
| GET | `/api/consult/me/earnings?from=&to=` | practitioner |

### 8.5 Consultant Admin (dept-scoped)

| Method | Path | Auth |
|---|---|---|
| GET / POST / PATCH / DELETE | `/api/consult/dept/practitioners[/id]` | consultant_admin |
| POST | `/api/consult/dept/practitioners/[id]/upload-photo` | consultant_admin — scoped to own category (§6.11) |
| GET | `/api/consult/dept/bookings` | consultant_admin |
| GET | `/api/consult/dept/revenue` | consultant_admin |
| GET | `/api/consult/dept/stats` | consultant_admin |

### 8.6 Super Admin

| Method | Path | Auth |
|---|---|---|
| GET / POST / PATCH / DELETE | `/api/consult/admin/categories[/id]` | super |
| GET / POST / PATCH / DELETE | `/api/consult/admin/staff[/id]` | super |
| GET / POST / PATCH / DELETE | `/api/consult/admin/practitioners[/id]` | super |
| POST | `/api/consult/admin/practitioners/[id]/upload-photo` | super — same as practitioner upload but any practitioner ID |
| GET | `/api/consult/admin/bookings` | super |
| GET | `/api/consult/admin/revenue` | super |
| GET | `/api/consult/admin/stats` | super |
| GET / PATCH | `/api/consult/admin/settings` | super |
| GET / POST / PATCH / DELETE | `/api/consult/admin/email-templates[/key]` | super |
| POST | `/api/consult/admin/email-templates/[key]/test` | super |
| POST | `/api/consult/admin/payouts/[bookingId]/settle` | super |
| GET | `/api/consult/admin/audit` | super |

### 8.7 Webhooks & cron

| Method | Path | Auth |
|---|---|---|
| POST | `/api/webhooks/razorpay` | Razorpay HMAC | extended for `payment.captured`, `payment.failed`, `refund.processed` on consultation orders |
| POST | `/api/cron/consultation-reminders` | `Authorization: Bearer ${CRON_SECRET}` |

---

## 9. Slot engine

`src/lib/consult/slots.ts`

### 9.1 Inputs

- `practitionerId`
- `from: Date` (UTC)
- `to: Date` (UTC, inclusive cap; max `settings.maxAdvanceBookingDays` ahead)
- Optional `serviceId` — if given, output is filtered to slots wide enough for that service's `durationMinutes`.

### 9.2 Algorithm

```mermaid
flowchart TD
    A["Load practitioner + timezone"] --> B["Load active ConsultAvailabilityRule rows"]
    B --> C["For each day in from..to (in practitioner TZ): expand matching weekly rules into [startMin..endMin] windows"]
    C --> D["Chunk each window into slots of slotDurationMinutes with bufferMinutes between"]
    D --> E["Load ConsultSlotException rows in range"]
    E --> F["Subtract 'unavailable' windows; add 'available_extra' windows"]
    F --> G["Load ConsultBooking with status in {pending,confirmed} overlapping range"]
    G --> H["Subtract booked intervals"]
    H --> I["Convert remaining slots to UTC"]
    I --> J["Filter: slotStart >= now + settings.bookingLeadHours"]
    J --> K["If serviceId given: keep only slots where slotStart + serviceDuration fits within the originating window"]
    K --> L["Return Slot[]: { startUtc, endUtc, durationMinutes }"]
```

### 9.3 Concurrency / atomicity

When a booker submits `POST /api/consult/bookings`:

1. Re-run the slot engine for the requested window.
2. If the requested `start` is no longer free → return `409 SLOT_TAKEN`.
3. Insert `ConsultBooking` with status `pending`. The partial unique index on `{practitionerId, slotStart}` filtered by `status ∈ {pending, confirmed}` enforces single-occupancy at the DB level — a duplicate insert fails fast.
4. Create Razorpay order with `notes: { bookingId, bookingCode }` and return `{ orderId, keyId, amount, currency }`.

Pending bookings auto-expire after 15 minutes if not verified — a cleanup job (or lazy check) flips `status` from `pending` to `cancelled` so the slot is freed.

---

## 10. Booking lifecycle

```mermaid
stateDiagram-v2
    [*] --> pending: POST /bookings (slot reserved, Razorpay order created)
    pending --> confirmed: /verify ok or webhook payment.captured
    pending --> cancelled: 15-min TTL expiry / user abandons / payment.failed
    confirmed --> rescheduled: /reschedule (within window)
    rescheduled --> confirmed: new slot accepted
    confirmed --> completed: cron after slotEnd
    confirmed --> cancelled: /cancel (within window) → optional refund
    confirmed --> no_show: practitioner marks
    completed --> [*]
    cancelled --> [*]
    no_show --> [*]
```

### 10.1 Sequence — happy path

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant FE as Next.js page
    participant API as /api/consult
    participant DB as MongoDB
    participant RZ as Razorpay
    participant RS as Resend

    U->>FE: pick service + slot + intake
    FE->>API: POST /bookings
    API->>DB: re-check slot, insert pending Booking
    API->>RZ: orders.create(amount, notes:{bookingId})
    API-->>FE: { orderId, keyId, amount }
    FE->>RZ: open Razorpay Checkout
    U->>RZ: pay
    RZ-->>FE: payment success { paymentId, signature }
    FE->>API: POST /bookings/{id}/verify { paymentId, signature }
    API->>API: HMAC verify
    API->>DB: status=confirmed, paidAt=now
    API->>RS: booking_confirmed_client + booking_received_practitioner
    API-->>FE: { success: true }
    FE-->>U: redirect /consult/booking/{id}
    Note over RZ,API: Webhook payment.captured arrives later<br/>(idempotent on razorpayPaymentId)
```

---

## 11. Payments & commission

### 11.1 Pricing snapshot

At booking creation, the booking row freezes:

- `priceAmount`         = `service.priceAmount`
- `commissionPercent`   = `settings.commissionPercent` (snapshot)
- `commissionAmount`    = `Math.round(priceAmount * commissionPercent / 100)`
- `netToPractitioner`   = `priceAmount - commissionAmount`
- `currency`            = `service.currency` (must match `settings.defaultCurrency` in V1)

This guarantees that later changes to `settings.commissionPercent` or `service.priceAmount` do **not** rewrite history.

### 11.2 Razorpay flow

- `orders.create({ amount, currency, receipt: bookingCode, notes: { bookingId, type: 'consult' } })`
- Verify on `/verify` using `razorpay_payment_id|razorpay_order_id` HMAC with `RAZORPAY_KEY_SECRET`.
- Webhook `/api/webhooks/razorpay` (extended) handles late events idempotently:
  - `payment.captured`  → ensure `confirmed`
  - `payment.failed`    → ensure `cancelled` if still `pending`
  - `refund.processed`  → write `refundId`, `refundedAt`, `refundAmount`

### 11.3 Practitioner earnings

`/consult/me/earnings`:

- Filters: date range, status.
- Aggregates: gross, commission, net, count of bookings, breakdown per service.
- `payoutSettled` flag indicates whether super-admin has marked this booking as paid out manually.

### 11.4 Manual settlement (V1)

Super admin sees an "Outstanding payouts" view grouped by practitioner. Marking settled:

- Sets `payoutSettled = true` and `payoutSettledAt = now` on each included booking.
- Writes a `ConsultAuditLog` entry (`action: 'payout.settle'`, `payload: { bookingIds, amount, mode }`).

---

## 12. Email system

### 12.1 Templates

Each template has a stable `key`, a default coded version (in `src/lib/consult/email-defaults.ts`), and an optional override row in `consult_email_templates`. The sender always:

1. Looks up `consult_email_templates` by `key` and `isActive: true`.
2. Falls back to the coded default if absent.
3. Renders mustache-style variables.

| Key | Recipient | Trigger |
|---|---|---|
| `booking_confirmed_client` | booker | after successful verify |
| `booking_received_practitioner` | practitioner | after successful verify |
| `booking_rescheduled` | booker + practitioner | after reschedule |
| `booking_cancelled` | booker + practitioner | after cancel |
| `booking_reminder` | booker (+ practitioner) | reminder cron |
| `booking_refunded` | booker | after refund |
| `staff_invite` | invited staff | super/dept invites a new staff |

### 12.2 Variables (common)

`{{userName}}`, `{{practitionerName}}`, `{{categoryName}}`, `{{serviceTitle}}`, `{{durationMinutes}}`, `{{slotStartLocal}}`, `{{slotStartIso}}`, `{{timezone}}`, `{{meetingLink}}`, `{{bookingCode}}`, `{{priceFormatted}}`, `{{cancelUrl}}`, `{{rescheduleUrl}}`, `{{supportEmail}}`, `{{brandName}}`, `{{brandLogoUrl}}`.

### 12.3 Editor UX

`/consult/admin/email-templates`:

- List of all keys with last-updated timestamp and a green/grey active dot.
- Editor: subject input, monospace HTML editor (textarea is fine for V1), live preview pane (right side), variable hint cheatsheet, "Send test to me" button.

---

## 13. Reminder cron

- Endpoint: `POST /api/cron/consultation-reminders`
- Auth: `Authorization: Bearer ${CRON_SECRET}` header check.
- Run cadence: every 15 minutes.
- Query:

  ```
  status: 'confirmed'
  reminderSentAt: null
  slotStart: between (now + reminderHoursBefore - 15 min) and (now + reminderHoursBefore + 15 min)
  ```

- For each match, send `booking_reminder` to booker (and optionally practitioner), set `reminderSentAt = now`.
- Idempotent: setting `reminderSentAt` is the dedupe key.

---

## 14. Refund & cancellation

### 14.1 Booker-initiated cancel

- Allowed only if `slotStart - now > settings.cancellationWindowHours`.
- If allowed and `paidAt` exists, automatically issue a full Razorpay refund.
- Status → `cancelled`, `cancellationReason`, `cancelledByRole = 'booker'`, write audit log.
- Send `booking_cancelled` + (if refunded) `booking_refunded`.

### 14.2 Staff-initiated cancel / refund

- Super admin and consultant admin (own category) can cancel + refund **at any time**.
- Practitioner can cancel but cannot refund directly — they trigger an email to consultant admin who issues the refund.
- Refund endpoint accepts `amount` (defaults to full).

### 14.3 Reschedule

- Booker can reschedule once if `slotStart - now > settings.cancellationWindowHours`.
- Picks a new free slot of the same service / duration.
- Old slot freed, new slot reserved atomically (single transaction-ish operation).
- Push `{ from, to, actorRole, at }` to `rescheduleHistory`.
- Send `booking_rescheduled`.

---

## 15. Dashboard specifications

### 15.1 Super Admin (`/consult/admin`)

Top-level stat cards:

- Today's bookings (count + total)
- Gross revenue (this month)
- Commission earned (this month)
- Active practitioners

Charts:

- Revenue last 30 days (line)
- Bookings by category (bar)
- Top 5 practitioners by revenue (table)

Sub-pages: as listed in [§7.2](#72-staff-pages). Each list page has search, filters, pagination, CSV export.

### 15.2 Consultant Admin (`/consult/dept`)

Same shape as super, **scoped to `categoryId`**:

- Practitioner roster for the category
- Bookings list (category-only)
- Revenue (category-only)
- Pending invites

### 15.3 Practitioner (`/consult/me`)

- **Home**: today's schedule (timeline), this week's calendar, upcoming bookings (next 5), recent cancellations.
- **Profile**: edit `displayName`, `headline`, `bio`, `photo`, `languages`, `specialties`, `qualifications`, `timezone`.
- **Services**: CRUD with sort.
- **Availability**: weekly rule editor (7-day grid with add/remove windows per day), slot duration / buffer, "Block date" button for exceptions.
- **Bookings**: list, mark `completed` / `no_show`, attach `meetingLink`, view intake.
- **Earnings**: gross / commission / net per period, with detail table.

---

## 16. UI / styling guidelines

- Reuse existing CSS variables in [src/app/globals.css](src/app/globals.css) (`--surface-1`, `--gold`, `--accent`, `--text-muted`, etc.).
- Reuse the admin shell pattern from [src/components/admin/AdminShellClient.tsx](src/components/admin/AdminShellClient.tsx). Build a parallel `src/components/consult/ConsultShellClient.tsx` that:
  - Reads `getStaffSession()`.
  - Renders different sidebars based on role (`super_admin` / `consultant_admin` / `practitioner`).
  - Provides a global "Acting as: <role>" pill in the header.
- Public consultation pages get a polished landing matching the existing Vedaansh aesthetic — gold accents on dark surfaces, rounded `var(--r-lg)` cards, generous spacing.
- All forms use Zod schemas shared between client and server.
- All amounts displayed via a `formatMoney(amount, currency)` helper that handles paise → rupees, etc.
- All times displayed in the booker's locale via `Intl.DateTimeFormat`, but always include the practitioner's timezone label next to the slot.

---

## 17. Environment variables

Add to [.env.example](.env.example):

```bash
# ── Consultation Portal ──────────────────────────────────────
# Bootstrap super-admin (one-time; ignored after first run)
CONSULT_SUPERADMIN_EMAIL=admin@vedaansh.com
CONSULT_SUPERADMIN_PASSWORD=change-me-immediately

# Cron auth (used by /api/cron/consultation-reminders)
CRON_SECRET=replace-with-32-byte-random
```

**Images (Cloudinary — project default):** set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, and optionally `CLOUDINARY_UPLOAD_FOLDER`. See [§6.11.13](#6113-environment-variables-when-using-object-storage). Paste-only Mode A works without Cloudinary.

Reused (already present):

- `AUTH_SECRET` — also signs the staff JWT cookie.
- `MONGODB_URI`, `MONGODB_DB_NAME`
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`
- `RESEND_API_KEY`, `FROM_EMAIL`
- `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_APP_NAME`

---

## 18. File-by-file inventory

### 18.1 New files

```
src/lib/db/models/consult/
  ConsultStaff.ts
  ConsultCategory.ts
  ConsultPractitioner.ts
  ConsultService.ts
  ConsultAvailabilityRule.ts
  ConsultSlotException.ts
  ConsultBooking.ts
  ConsultEmailTemplate.ts
  ConsultSettings.ts
  ConsultAuditLog.ts
  index.ts                       // barrel export

src/lib/consult/
  constants.ts                   // §24.2 — TTLs, limits, rate caps (single source)
  auth.ts                        // signStaffToken, verifyStaffToken, getStaffSession, requireXxx
  slots.ts                       // slot engine
  emails.ts                      // template-driven sender
  email-defaults.ts              // hard-coded fallback templates
  bookingCodes.ts                // generates 'CN-XXXXXX' codes
  audit.ts                       // writeAudit() helper
  razorpay.ts                    // thin wrapper for orders/refunds
  zod.ts                         // shared validators

src/app/consult/
  layout.tsx                     // public consult shell
  page.tsx                       // landing
  [category]/page.tsx
  p/[slug]/page.tsx
  book/[serviceId]/page.tsx
  booking/[id]/page.tsx
  admin/login/page.tsx
  admin/set-password/page.tsx
  admin/layout.tsx               // staff shell (server component)
  admin/page.tsx                 // super-admin home
  admin/categories/page.tsx
  admin/admins/page.tsx
  admin/practitioners/page.tsx
  admin/practitioners/[id]/page.tsx
  admin/bookings/page.tsx
  admin/revenue/page.tsx
  admin/email-templates/page.tsx
  admin/email-templates/[key]/page.tsx
  admin/settings/page.tsx
  admin/audit/page.tsx
  dept/layout.tsx
  dept/page.tsx
  dept/practitioners/page.tsx
  dept/bookings/page.tsx
  dept/revenue/page.tsx
  me/layout.tsx
  me/page.tsx
  me/profile/page.tsx
  me/services/page.tsx
  me/availability/page.tsx
  me/bookings/page.tsx
  me/earnings/page.tsx

src/app/my/consultations/page.tsx

src/app/api/consult/
  auth/login/route.ts
  auth/logout/route.ts
  auth/me/route.ts
  auth/set-password/route.ts
  categories/route.ts
  practitioners/route.ts
  practitioners/[slug]/route.ts
  practitioners/[id]/slots/route.ts
  bookings/route.ts
  bookings/[id]/route.ts
  bookings/[id]/verify/route.ts
  bookings/[id]/cancel/route.ts
  bookings/[id]/reschedule/route.ts
  bookings/[id]/refund/route.ts
  me/profile/route.ts
  me/services/route.ts
  me/services/[id]/route.ts
  me/availability/route.ts
  me/availability/[id]/route.ts
  me/exceptions/route.ts
  me/exceptions/[id]/route.ts
  me/bookings/route.ts
  me/earnings/route.ts
  me/bookings/list/route.ts
  me/upload-photo/route.ts
  dept/practitioners/route.ts
  dept/practitioners/[id]/route.ts
  dept/practitioners/[id]/upload-photo/route.ts
  dept/bookings/route.ts
  dept/revenue/route.ts
  dept/stats/route.ts
  admin/categories/route.ts
  admin/categories/[id]/route.ts
  admin/staff/route.ts
  admin/staff/[id]/route.ts
  admin/practitioners/route.ts
  admin/practitioners/[id]/route.ts
  admin/practitioners/[id]/upload-photo/route.ts
  admin/bookings/route.ts
  admin/revenue/route.ts
  admin/stats/route.ts
  admin/settings/route.ts
  admin/email-templates/route.ts
  admin/email-templates/[key]/route.ts
  admin/email-templates/[key]/test/route.ts
  admin/payouts/[bookingId]/settle/route.ts
  admin/audit/route.ts

src/app/api/cron/consultation-reminders/route.ts
src/app/api/cron/consult-pending-cleanup/route.ts
src/app/api/cron/consultation-complete/route.ts    // optional — §24.21 auto completed

src/components/consult/
  ConsultShellClient.tsx
  ConsultSidebar.tsx
  PublicHeader.tsx
  CategoryCard.tsx
  PractitionerCard.tsx
  SlotPicker.tsx
  AvailabilityEditor.tsx
  ServiceForm.tsx
  IntakeForm.tsx
  BookingsTable.tsx
  RazorpayCheckoutButton.tsx
  EmailTemplateEditor.tsx
  StatCard.tsx                   // local copy or shared with admin
  Calendar.tsx

scripts/seed-consult-superadmin.ts

CONSULTATION_PORTAL_SPEC.md      // (this file)
```

### 18.2 Edited files

- [middleware.ts](middleware.ts) — add `/consult/admin|dept|me` and `/api/consult/admin|dept|me|staff` gates.
- [src/app/api/webhooks/razorpay/route.ts](src/app/api/webhooks/razorpay/route.ts) — branch on `notes.type === 'consult'` and update `ConsultBooking` accordingly.
- [package.json](package.json) — add script `"seed:consult-admin": "tsx scripts/seed-consult-superadmin.ts"`.
- [.env.example](.env.example) — add new vars.
- [src/lib/email.ts](src/lib/email.ts) — extract `createLayout` helper to be reusable from `src/lib/consult/emails.ts`.

---

## 19. Phased build plan

Each phase is shippable and can be hidden behind a feature flag (`NEXT_PUBLIC_CONSULT_ENABLED`).

### Phase 1 — Foundations

- All Mongo models in `src/lib/db/models/consult/`.
- `src/lib/consult/auth.ts` (JWT cookie signer/verifier + session helpers + role guards).
- `/api/consult/auth/{login,logout,me,set-password}`.
- `/consult/admin/login` and `/consult/admin/set-password` pages.
- `scripts/seed-consult-superadmin.ts` + `npm run seed:consult-admin`.
- Middleware updates.
- `ConsultSettings` singleton initialiser (auto-create with defaults on first read).

**Acceptance**: super-admin can log in at `/consult/admin/login` and lands on a placeholder `/consult/admin` page that displays their session.

### Phase 2 — Catalog management

- Categories CRUD (super) at `/consult/admin/categories`.
- Consultant-admin invite/CRUD (super) at `/consult/admin/admins`.
- Practitioner CRUD (super) and dept-scoped CRUD (consultant_admin) at `/consult/admin/practitioners` and `/consult/dept/practitioners`.
- Practitioner self-edit at `/consult/me/profile`.
- `staff_invite` email + invite acceptance flow.
- Audit log writes for every mutation.

**Acceptance**: super-admin can create a category, invite a consultant_admin, who can in turn invite a practitioner; practitioner can set their password and edit their profile.

### Phase 3 — Services + availability + slot engine

- `ConsultService` CRUD pages.
- `ConsultAvailabilityRule` weekly editor + `ConsultSlotException` editor at `/consult/me/availability`.
- `src/lib/consult/slots.ts` engine + unit tests.
- Public `GET /api/consult/practitioners/[id]/slots`.

**Acceptance**: a practitioner with services + a weekly rule sees correctly generated slots from the public API; blocking a date removes those slots.

### Phase 4 — Public booking UI

- `/consult` landing.
- `/consult/[category]` directory with filters.
- `/consult/p/[slug]` profile + service list + slot picker.
- `/consult/book/[serviceId]?start=…` intake form.
- Mobile responsive.

**Acceptance**: a logged-in user can navigate from landing to a confirmed booking summary screen (no payment yet).

### Phase 5 — Payments & confirmation

- `POST /api/consult/bookings` creating Razorpay order + pending row.
- Razorpay Checkout button component.
- `/api/consult/bookings/[id]/verify`.
- Webhook extension in `/api/webhooks/razorpay`.
- 15-minute pending TTL cleanup.
- `/consult/booking/[id]` confirmation page.
- `/my/consultations` user list with cancel + reschedule.

**Acceptance**: an end-to-end booking with Razorpay test keys completes; cancellation refunds correctly; webhook idempotency verified by replay.

### Phase 6 — Emails + reminder cron

- `ConsultEmailTemplate` model + super-admin editor + test-send.
- `src/lib/consult/emails.ts` template-driven sender with mustache rendering.
- `src/lib/consult/email-defaults.ts` with all keys.
- `/api/cron/consultation-reminders` + `CRON_SECRET`.

**Acceptance**: all six transactional emails fire correctly; reminder cron emits exactly one email per booking inside the window.

### Phase 7 — Dashboards

- `ConsultShellClient` + role-aware sidebar.
- Super-admin dashboard with stats, revenue chart, audit viewer.
- Consultant-admin dept-scoped dashboard.
- Practitioner home + earnings page.

**Acceptance**: each role sees only their permitted data; numbers tie out to raw collections within ±0.

### Phase 8 — Polish

- Refund flow UI (super + dept).
- `/consult/admin/settings` (commission %, reminder hours, cancellation window, branding).
- Empty states + skeleton loaders everywhere.
- Accessibility pass: keyboard nav, focus rings, ARIA labels on slot grid.
- `.env.example` finalized.
- Update [README.md](README.md) with a Consultation Portal section.

---

## 20. Testing strategy

### 20.1 Unit tests (Vitest — already configured)

- Slot engine: weekly expansion, exception subtraction, booking subtraction, TZ-DST correctness, lead-time clamp, service-duration filter.
- Commission math: rounding, paise correctness, idempotence under repeated calls.
- Mustache template rendering with missing variables.
- Booking-code generator collisions over 1M samples.

### 20.2 Integration tests

- Auth: login → cookie → /me → logout cycle for each role.
- Booking happy path with mocked Razorpay (orders.create + verify).
- Concurrent double-booking attempt → exactly one succeeds (test the partial unique index).
- Cancellation outside window vs inside window.
- Webhook replay idempotency.

### 20.3 Manual QA

- Razorpay test mode end-to-end.
- Resend test inbox for every email type.
- Three browser sessions simultaneously (super, dept, practitioner) verifying scope isolation.

---

## 21. Security & compliance

- All staff routes are HttpOnly-cookie gated; CSRF mitigated by SameSite=Lax + same-origin POSTs.
- `passwordHash` uses bcrypt with cost 12 (consistent with existing auth).
- Rate-limit `/api/consult/auth/login` and `/api/consult/auth/set-password` via existing Upstash Redis (`@upstash/redis` is already a dependency) — 5 attempts per IP per 15 min.
- All zod-validated inputs; reject unknown fields via `.strict()`.
- Razorpay webhook HMAC verification (`RAZORPAY_WEBHOOK_SECRET`).
- Audit log captures actor IP and user-agent; retention forever (no PII redaction needed in V1 — payloads exclude raw payment objects, only IDs).
- PII: practitioner photos and bios are public; booking intake notes are visible to the practitioner and dept/super admins, never exposed publicly.

---

## 22. Operational runbook

### 22.1 First-run setup

```
1.  Set CONSULT_SUPERADMIN_EMAIL + CONSULT_SUPERADMIN_PASSWORD in .env.local
2.  Set CRON_SECRET to a 32-byte random string
3.  npm install   (no new deps required)
4.  npm run seed:consult-admin
5.  npm run dev
6.  Visit /consult/admin/login → log in with the bootstrap credentials
7.  Open /consult/admin/settings → set commissionPercent, currency, reminderHoursBefore, cancellationWindowHours
8.  Create at least one category, one consultant_admin, one practitioner
```

### 22.2 Daily ops

- Monitor `/consult/admin/audit` for unusual activity.
- Check Razorpay dashboard for failed captures vs `consult_bookings.status='pending'` older than 30 min — these should auto-cancel.
- Cron heartbeat: a healthy `/api/cron/consultation-reminders` returns `{ processed: N }` every 15 min.

### 22.3 Common incidents

| Symptom | Likely cause | Fix |
|---|---|---|
| Slot picker shows no slots | timezone mismatch / no active rule | check `ConsultPractitioner.timezone` and `ConsultAvailabilityRule.isActive` |
| Booking stuck `pending` | webhook not delivered | re-run verify; check Razorpay webhook health |
| Reminder not sent | cron not configured | hit `/api/cron/consultation-reminders` manually with `CRON_SECRET` |
| Practitioner can't log in | invite token expired | super or dept resends invite from staff page |

---

## 23. Out of scope (V2 roadmap)

- **Video room**: Daily.co or Jitsi embed with auto-generated room URLs.
- **Reviews & ratings**: post-session prompt + moderation queue + display on profiles.
- **Razorpay Route**: automated payouts to practitioner sub-merchants; KYC workflow.
- **Coupons & discounts**: code-based and bulk promos.
- **Group / recurring sessions**.
- **In-app chat** between booker and practitioner pre-session.
- **Calendar sync**: two-way Google / Outlook / iCal.
- **Multi-currency at booking time** (per practitioner currency).
- **Internationalization** of consultation pages (matching existing `language` setting).
- **Mobile push notifications** for upcoming sessions.
- **Analytics & funnel tracking** (Mixpanel / PostHog) for booking conversion.

---

## 24. Appendix: complete implementation reference

This section is the **single source of truth** for implementers: copy-paste field limits, error codes, index definitions, and request/response contracts. It does not replace earlier narrative sections; it **nails down** what those sections only summarized.

### 24.1 Mongoose model → MongoDB collection names

Mongoose lowercases and pluralizes by default. **Planned** collection names (set explicitly in `Schema` with `collection: '...'` to avoid surprises):

| Model | `collection` name | Notes |
|---|---|---|
| `ConsultStaff` | `consult_staff` | |
| `ConsultCategory` | `consult_categories` | |
| `ConsultPractitioner` | `consult_practitioners` | |
| `ConsultService` | `consult_services` | |
| `ConsultAvailabilityRule` | `consult_availability_rules` | |
| `ConsultSlotException` | `consult_slot_exceptions` | |
| `ConsultBooking` | `consult_bookings` | |
| `ConsultEmailTemplate` | `consult_email_templates` | |
| `ConsultSettings` | `consult_settings` | singleton document |
| `ConsultAuditLog` | `consult_audit_logs` | |

**Always** set `collection` explicitly in each model file so production DB names never drift from this table.

### 24.2 Global constants (code: `src/lib/consult/constants.ts`)

| Constant | Value | Where used |
|---|---:|---|
| `PENDING_BOOKING_TTL_MS` | `15 * 60 * 1000` (15 min) | Auto-cancel `pending` if unpaid; free slot |
| `PENDING_CLEANUP_CRON_EVERY_MS` | `5 * 60 * 1000` (5 min) | How often cleanup job runs (or on-demand in API) |
| `STAFF_JWT_TTL_S` | `30 * 24 * 60 * 60` (30 days) | Staff session cookie `maxAge` |
| `BCRYPT_COST` | `12` | `bcrypt` rounds for `ConsultStaff.passwordHash` |
| `BOOKING_CODE_PREFIX` | `"CN-"` | Human booking code |
| `BOOKING_CODE_ENTROPY` | 6 chars from `A-Z0-9` (no ambiguous 0/O) or Crockford base32 | Collision re-roll up to 10 times |
| `MAX_LIST_PAGE_SIZE` | `100` | Default list cap |
| `DEFAULT_LIST_PAGE_SIZE` | `20` | Default page size |
| `MAX_BIO_LENGTH` | `20_000` | `ConsultPractitioner.bio` (markdown) |
| `MAX_INTAKE_NOTES` | `5_000` | `ConsultBooking.intake.notes` |
| `SET_PASSWORD_TOKEN_TTL_MS` | `7 * 24 * 60 * 60 * 1000` (7 days) | Invite link expiry |
| `CRON_REMINDER_WINDOW_MIN` | `15` | Match `reminderHoursBefore ±` window in minutes |
| `RATE_LIMIT_AUTH` | 5 req / 15 min / IP | Login + set-password |
| `RATE_LIMIT_BOOKING_CREATE` | 10 req / hour / userId | Anti-abuse |
| `MIN_SERVICE_DURATION_MIN` | `5` | |
| `MAX_SERVICE_DURATION_MIN` | `480` (8h) | Sanity cap for 1:1 |
| `MIN_SLOT_DURATION_MIN` | `5` | |
| `MAX_SLOT_DURATION_MIN` | `180` | |
| `MAX_BUFFER_MIN` | `120` | |
| `MAX_PHOTO_URL_LENGTH` | `2048` | `photo` string |
| `MEETING_LINK_MAX` | `2000` | URLs can be long with query params |

### 24.3 Error code catalog

All API errors return:

```json
{ "success": false, "error": { "code": "SLOT_TAKEN", "message": "…", "details": {} } }
```

| `code` | HTTP | When |
|---|---:|---|
| `UNAUTHORIZED` | 401 | No staff / no booker session |
| `FORBIDDEN` | 403 | Role or category scope violation |
| `NOT_FOUND` | 404 | Entity missing or wrong scope |
| `VALIDATION_ERROR` | 400 | Zod / business rule (field errors in `details`) |
| `SLOT_TAKEN` | 409 | Slot no longer free at commit |
| `SLOT_INVALID` | 400 | `start` not on slot grid for service |
| `PAYMENT_VERIFICATION_FAILED` | 400 | Bad Razorpay signature / wrong order |
| `PAYMENT_ALREADY_PROCESSED` | 200* or 409 | Idempotent success / duplicate (return prior state) |
| `BOOKING_EXPIRED` | 410 | `pending` past TTL; user must rebook |
| `CANCEL_WINDOW_CLOSED` | 403 | Booker cancel too close to `slotStart` |
| `RESCHEDULE_WINDOW_CLOSED` | 403 | Same |
| `REFUND_FAILED` | 502 | Razorpay API error (surface `details.razorpayMessage`) |
| `SERVICE_UNAVAILABLE` | 503 | Settings missing / DB down |

\*Prefer returning `{ success: true, data: { idempotent: true } }` with 200 for idempotent verify.

### 24.4 API envelope & HTTP status conventions

- **Success**: `200` with `{ success: true, data: T }`. Use `201` only if you want REST purism on POST creates (optional; V1 can stay `200` everywhere for simplicity).
- **Client errors**: `400` validation, `401` auth, `403` scope, `404` missing, `409` conflict, `410` gone (expired pending).
- **Server errors**: `500` uncaught; `502` upstream (Razorpay/Resend).

### 24.5 Pagination, sorting, filtering (all `GET` list endpoints)

**Query params (shared):**

| Param | Type | Default | Max |
|---|---|---|---|
| `page` | int ≥ 1 | 1 | — |
| `pageSize` | int | 20 | 100 |
| `sort` | string | entity-specific | whitelist only |
| `order` | `asc` \| `desc` | `desc` for dates, `asc` for names | — |

**Bookings list (`admin`, `dept`, `me`, booker):**

- `status` — comma-separated: `pending,confirmed,...`
- `from` / `to` — ISO 8601 instant on `slotStart` (UTC)

**Practitioner directory (public):**

- `category` — slug or ObjectId string
- `q` — search `displayName`, `headline`, `specialties` (text index)
- `lang` — filter if `languages` contains
- `minPrice` / `maxPrice` — paise, across minimum active service price

**Response shape:**

```json
{
  "success": true,
  "data": {
    "items": [ … ],
    "page": 1,
    "pageSize": 20,
    "total": 137,
    "totalPages": 7
  }
}
```

### 24.6 Field validation matrix (Zod — summary)

**ConsultStaff (invite / patch)**

| Field | Rules |
|---|---|
| `email` | `.email()`, lowercased, max 254 |
| `name` | trim, 1–120 chars |
| `password` (set) | min 12, max 128, require at least one letter + one digit (adjust to policy) |

**ConsultCategory**

| Field | Rules |
|---|---|
| `slug` | `^[a-z0-9]+(?:-[a-z0-9]+)*$`, 2–80 chars, unique |
| `name` | 1–80 chars |
| `description` | max 10_000 |
| `color` | `^#[0-9A-Fa-f]{6}$` |
| `icon` | max 64 chars (emoji or key) |

**ConsultPractitioner**

| Field | Rules |
|---|---|
| `slug` | same as category slug rules, unique globally |
| `displayName` | 1–120 |
| `headline` | max 200 |
| `bio` | max `MAX_BIO_LENGTH` |
| `timezone` | must be valid IANA via `Intl` or tz database allowlist |
| `languages` | array of ISO 639-1 codes, max 10 entries |
| `specialties` | max 20 strings, each max 80 chars |
| `experienceYears` | 0–80 |
| `qualifications` | max 15 strings, each max 200 chars |

**ConsultService**

| Field | Rules |
|---|---|
| `title` | 1–120 |
| `durationMinutes` | `MIN_SERVICE_DURATION_MIN`–`MAX_SERVICE_DURATION_MIN` |
| `priceAmount` | int ≥ 100 paise (₹1 minimum) unless super overrides |
| `currency` | must equal `ConsultSettings.defaultCurrency` in V1 |

**ConsultAvailabilityRule**

| Field | Rules |
|---|---|
| `dayOfWeek` | 0–6 |
| `startMin` / `endMin` | 0–1440, `startMin < endMin` |
| `slotDurationMinutes` | `MIN_SLOT_DURATION_MIN`–`MAX_SLOT_DURATION_MIN` |
| `bufferMinutes` | 0–`MAX_BUFFER_MIN` |

**ConsultBooking (create)**

| Field | Rules |
|---|---|
| `serviceId` | valid ObjectId |
| `slotStart` | ISO UTC instant; must match engine slot for that service |
| `intake.notes` | optional, max `MAX_INTAKE_NOTES` |
| `intake.answers` | object keys must exist in category `intakeFormSchema`; types enforced |

**ConsultSettings (patch)**

| Field | Rules |
|---|---|
| `commissionPercent` | 0–100, max 2 decimal places stored as hundredths if needed |
| `reminderHoursBefore` | 1–168 |
| `cancellationWindowHours` | 0–168 |
| `bookingLeadHours` | 0–720 |
| `maxAdvanceBookingDays` | 1–365 |

### 24.7 Key API contracts (request / response)

#### `POST /api/consult/auth/login`

**Request**

```json
{ "email": "admin@x.com", "password": "••••••••••••" }
```

**Response**

```json
{
  "success": true,
  "data": {
    "role": "super_admin",
    "redirect": "/consult/admin",
    "staff": { "_id": "…", "email": "…", "name": "…", "role": "super_admin" }
  }
}
```

Sets cookie `vedaansh_consult_session` (details §24.8).

#### `POST /api/consult/bookings`

**Headers:** NextAuth session cookie required.

**Request**

```json
{
  "serviceId": "664…",
  "slotStart": "2026-05-15T04:30:00.000Z",
  "intake": { "notes": "…", "answers": { "topic": "career" } }
}
```

**Response (200)**

```json
{
  "success": true,
  "data": {
    "bookingId": "664…",
    "bookingCode": "CN-A3F9Q2",
    "amount": 99900,
    "currency": "INR",
    "razorpayOrderId": "order_xxx",
    "razorpayKeyId": "${RAZORPAY_KEY_ID}",
    "status": "pending",
    "expiresAt": "2026-05-02T12:15:00.000Z"
  }
}
```

#### `POST /api/consult/bookings/[id]/verify`

**Request**

```json
{
  "razorpay_order_id": "order_xxx",
  "razorpay_payment_id": "pay_xxx",
  "razorpay_signature": "…"
}
```

**Response**

```json
{ "success": true, "data": { "bookingId": "…", "status": "confirmed", "idempotent": false } }
```

#### `GET /api/consult/practitioners/[id]/slots`

**Query:** `from=2026-05-01T00:00:00.000Z&to=2026-05-07T23:59:59.999Z&serviceId=664…` (optional service filter)

**Response**

```json
{
  "success": true,
  "data": {
    "timezone": "Asia/Kolkata",
    "slots": [
      { "start": "2026-05-15T04:30:00.000Z", "end": "2026-05-15T05:00:00.000Z", "durationMinutes": 30 }
    ]
  }
}
```

### 24.8 Staff JWT cookie — exact specification

| Property | Value |
|---|---|
| Name | `vedaansh_consult_session` |
| Value | JWT string, 3 segments Base64URL |
| Algorithm | HS256 |
| Secret | `process.env.AUTH_SECRET` (same as NextAuth — **must** be ≥ 32 random bytes in prod) |
| Payload claims | `sid` (staff ObjectId string), `role`, `cat` (optional category ObjectId string), `iat`, `exp` |
| `exp` | `iat + STAFF_JWT_TTL_S` |
| Cookie attributes | `HttpOnly`, `Path=/`, `SameSite=Lax`, `Secure` in production |
| Refresh | On each successful `GET /api/consult/auth/me`, optionally re-issue sliding expiration (optional V1.1) |

**Important:** On every authorized API call, **reload** `consult_staff` by `sid` and verify `isActive === true`.

### 24.9 Booking code generation (`bookingCodes.ts`)

Format: `CN-` + **6** alphanumeric characters.

- Charset: exclude `0`, `O`, `I`, `1`, `L` to reduce support confusion (optional Crockford base32).
- Uniqueness: query `consult_bookings` for `bookingCode`; retry up to 10 times on collision.
- **Never** derive booking codes from sequential IDs (privacy).

### 24.10 Pending booking TTL cleanup

**Triggers (any one is acceptable for V1):**

1. **Cron route** `POST /api/cron/consult-pending-cleanup` + `CRON_SECRET` every 5 minutes.
2. **Lazy:** run cleanup at start of `POST /bookings` and `GET .../slots` (cheap indexed query on `status=pending` + `createdAt < now - 15m`).
3. **Vercel cron** calling the same endpoint.

**Cleanup logic:**

```text
find { status: 'pending', createdAt: { $lt: now - 15min } }
updateMany { status: 'cancelled', cancelledByRole: null, cancellationReason: 'payment_timeout' }
```

Do **not** send cancellation emails for timeout (noise). Audit optional.

### 24.11 Razorpay — order, verify, webhook (field mapping)

**Order create**

| Razorpay field | Source |
|---|---|
| `amount` | `ConsultBooking.priceAmount` (integer paise) |
| `currency` | `INR` for V1 India-first |
| `receipt` | `bookingCode` truncated to **40 chars** (Razorpay limit) — if code longer, use last 40 of Mongo `_id` hex |
| `notes` | `{ type: 'consult', bookingId, bookingCode }` — **all string values** for Razorpay note constraints |

**Verify (client callback)**

```text
message = order_id + "|" + payment_id
expected = HMAC_SHA256(message, RAZORPAY_KEY_SECRET)
compare timing-safe expected === signature
```

**Webhook**

- Verify `X-Razorpay-Signature` with raw body + `RAZORPAY_WEBHOOK_SECRET`.
- Parse `payload.payment.entity` → `order_id`, `id`, `status`.
- Load booking by `notes.bookingId` or lookup by `razorpayOrderId`.
- **Idempotency:** if `razorpayPaymentId` already set and matches → `200 OK` no-op.

### 24.12 Partial unique index — exact MongoDB definition

Prevents double-booking same practitioner + start for active holds:

```js
db.consult_bookings.createIndex(
  { practitionerId: 1, slotStart: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ['pending', 'confirmed'] }
    },
    name: 'uniq_practitioner_slot_active'
  }
)
```

**Note:** `rescheduled` is not in the filter — old row moves out of `confirmed` before new insert (single transaction or two-step with careful ordering).

### 24.13 Timezone, DST, and slot engine edge cases

| Scenario | Rule |
|---|---|
| Practitioner changes `timezone` | Recompute slots; **do not** rewrite existing `ConsultBooking.slotStart` (immutable UTC instant). Show warning to practitioner: “future slots only.” |
| DST gap (spring forward) | Non-existent local times **never** appear in slot lists — iterate in UTC slices or use `date-fns-tz` conversion and skip invalid. |
| DST overlap (fall back) | Same local wall-clock can occur twice — **always** store UTC in DB; display converts unambiguously. |
| `slotMin` boundary | `endMin` is **exclusive** for chunking; last slot must satisfy `slotStart + duration + buffers ≤ endMin`. |
| Cross-midnight windows | V1 **disallowed**: each `ConsultAvailabilityRule` must satisfy `startMin < endMin` within same calendar day in local TZ. For overnight clinics, use **two rules** (e.g. Mon 22:00–24:00 as two windows split — see V2) or `available_extra` exceptions. |

### 24.14 Reschedule & cancel — decision table

| Actor | Cancel | Reschedule | Refund on cancel |
|---|---|---|---|
| Booker | Allowed if `now < slotStart - cancellationWindow` | Same window | Auto full refund if paid |
| Practitioner | Always allowed | N/A (use admin reschedule API) | Via dept/super |
| Consultant Admin | Category scope | Category scope | Full/partial via Razorpay |
| Super Admin | All | All | Full/partial |

**Reschedule implementation:** atomically (ordered):

1. Verify new slot free.
2. Set old booking `status: rescheduled` **or** update in place with `rescheduleHistory` push — pick **one** pattern and stick to it (spec recommends: single row update + history array to preserve `bookingCode`).

### 24.15 Middleware — path behavior (exact prefixes)

| Prefix | Unauthenticated browser | Unauthenticated API |
|---|---|---|
| `/consult/admin` (except `/login`, `/set-password`) | 302 → `/consult/admin/login` | 401 JSON |
| `/consult/dept` | 302 → login | 401 |
| `/consult/me` | 302 → login | 401 |
| `/consult/book` | 302 → `/login?callbackUrl=…` | 401 |
| `/api/consult/admin/*` | — | 401 |
| `/api/consult/dept/*` | — | 401 |
| `/api/consult/me/*` | — | 401 |

**Excluded from staff gate:** `/consult`, `/consult/[category]`, `/consult/p/*`, static assets, `/api/consult/categories`, `/api/consult/practitioners`, `/api/consult/bookings` POST only if… — **booker routes under `/api/consult/bookings` use NextAuth**, not staff cookie.

**Matcher:** extend existing Next.js `matcher` in [middleware.ts](middleware.ts) so consult paths are included while preserving current astrology routes.

### 24.16 Rate limits (implementation)

| Route key | Limit | Store |
|---|---|---|
| `consult:auth:login` | 5 / 15 min / IP | Upstash Redis |
| `consult:auth:set-password` | 5 / 15 min / IP | Upstash |
| `consult:booking:create` | 10 / hour / userId | Upstash |

Return `429` with `code: 'RATE_LIMITED'` and `Retry-After` header (seconds).

### 24.17 Logging & correlation

- Generate `x-request-id` (UUID) per incoming request; attach to all logs.
- Log lines: `level`, `requestId`, `route`, `staffId?`, `userId?`, `durationMs`, `outcome`.
- **Never** log full payment payloads — only `order_id`, `payment_id`, `bookingId`.

### 24.18 Feature flag

| Env | Meaning |
|---|---|
| `NEXT_PUBLIC_CONSULT_ENABLED` | `'true'` → show `/consult` nav entry + routes; `'false'` → 404 all `/consult/*` public pages (staff URLs return maintenance message) |

Implementation: guard in root `consult/layout.tsx` and middleware optional bypass.

### 24.19 Data exposure matrix

| Data | Public | Booker | Practitioner | Dept admin | Super |
|---|---|---|---|---|---|
| Practitioner `bio`, `photo`, services | yes | yes | own | category | all |
| `ConsultBooking.intake` | no | own rows | own bookings | category | all |
| `razorpayPaymentId` | no | no | no | no | yes (admin UI, not export to CSV without mask) |
| `ConsultAuditLog` | no | no | no | no | yes (full); dept: **category-filtered** if implemented V2 |

### 24.20 Intake form examples (`intakeFormSchema`)

**Astrology**

```json
[
  { "key": "topic", "label": "Main topic", "type": "select", "required": true, "options": ["Career", "Relationship", "Health", "Spiritual"] },
  { "key": "notes", "label": "Anything else?", "type": "textarea", "required": false }
]
```

**Doctor (generic)**

```json
[
  { "key": "chiefComplaint", "label": "Chief complaint", "type": "textarea", "required": true },
  { "key": "medicationAllergies", "label": "Allergies", "type": "text", "required": false }
]
```

Render rules: **required** fields block submit; answers stored under `intake.answers` as strings/booleans; server validates keys exist in schema.

### 24.21 Post-session status (`completed` / `no_show`)

| Transition | Who | Condition |
|---|---|---|
| → `completed` | Practitioner or admin | `now >= slotEnd` (or manual override after session) |
| → `no_show` | Practitioner or admin | Booker did not join — **no automatic detection** in V1 |

Optional cron: `POST /api/cron/consultation-complete` sets `confirmed` → `completed` when `slotEnd < now - 1h` (idempotent).

---

*End of specification.*
