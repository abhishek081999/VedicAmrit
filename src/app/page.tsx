// src/app/page.tsx — server component
// Renders a crawlable SEO hero above the client chart app.
// Google indexes the hero; users get the full interactive app.
import dynamic from 'next/dynamic'
import Image   from 'next/image'

const HomeClient = dynamic(
  () => import('@/components/home/HomeClient').then(m => m.default ?? m),
  { ssr: false }
)

const FEATURES = [
  { label: 'Free Vedic Birth Chart (Kundali)',        desc: 'Full Lagna, Moon & Sun charts with house lords' },
  { label: 'All 41 Varga (Divisional) Charts',        desc: 'D1 through D60 via Swiss Ephemeris' },
  { label: 'Vimshottari & Yogini Dasha',              desc: 'Antardasha & Pratyantardasha precision timelines' },
  { label: 'Daily Pañcāṅga',                          desc: 'Tithi, Nakshatra, Yoga, Karana, Rahu Kalam' },
  { label: 'Ashtakavarga & Shadbala',                 desc: 'Bindus, Rekhas, planetary strength tables' },
  { label: 'Jaimini Astrology',                       desc: 'Atmakaraka, Chara Dasha, Arudha Lagnas' },
  { label: 'KP Stellar Astrology',                    desc: 'Sub-lord system with cuspal interlinks' },
  { label: 'Kundali Matching (Synastry)',             desc: '36-point Ashtakoot compatibility scoring' },
]

export default function Page() {
  return (
    <>
      {/* ── SEO Hero — visible to crawlers & users alike ── */}
      <section
        aria-label="Vedaansh — Free Vedic Astrology Platform"
        style={{
          position:   'absolute',
          width:       1,
          height:      1,
          overflow:   'hidden',
          clip:        'rect(0,0,0,0)',
          whiteSpace: 'nowrap',
          border:      0,
        }}
      >
        <h1>Vedaansh — Free Vedic Astrology &amp; Jyotiṣa Calculator</h1>
        <p>
          Calculate your free Vedic birth chart (Kundali) instantly with arc-second accuracy
          via Swiss Ephemeris. No login required. Includes Vimshottari Dasha, all 41 varga
          charts, Navamsha (D9), Panchang, Arudha Lagnas, Shadbala, Ashtakavarga and more.
        </p>
        <h2>What you get — completely free</h2>
        <ul>
          {FEATURES.map(f => (
            <li key={f.label}>
              <strong>{f.label}</strong> — {f.desc}
            </li>
          ))}
        </ul>
        <p>
          Vedaansh uses the Swiss Ephemeris library for planetary positions accurate to
          arc-seconds. Supports Lahiri (Chitrapaksha) ayanamsha. Trusted by astrologers
          and students across India and worldwide.
        </p>
        <Image
          src="/veda-icon.png"
          alt="Vedaansh Vedic Astrology Platform"
          width={64}
          height={64}
          priority
        />
      </section>

      {/* ── Full interactive chart app ── */}
      <HomeClient />
    </>
  )
}
