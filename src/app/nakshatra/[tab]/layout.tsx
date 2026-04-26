import type { Metadata } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://vedaansh.com'

const TAB_META: Record<string, { title: string; description: string }> = {
  overview: {
    title:       'Nakshatra Overview — Birth Star Analysis',
    description: 'Your birth Nakshatra at a glance: ruling planet, deity, Gana, Nadi, symbol, Pada & introductory interpretation via Swiss Ephemeris.',
  },
  compatibility: {
    title:       'Nakshatra Compatibility — Vedic Star Matching',
    description: 'Nakshatra-based compatibility analysis: Navtara, Stree-Dirgha, Vedha, Rajju & Mahendra compatibility scoring for relationships.',
  },
  remedies: {
    title:       'Nakshatra Remedies — Vedic Prescriptions',
    description: 'Personalized Nakshatra remedies: mantras, gemstones, colours, fasting days & deity worship based on your birth star.',
  },
  transits: {
    title:       'Nakshatra Transits — Planetary Activations',
    description: 'Live and upcoming planetary transit activations through your birth Nakshatra and its trines, with timing precision via Swiss Ephemeris.',
  },
  muhurta: {
    title:       'Nakshatra Muhurta — Auspicious Star Timings',
    description: 'Nakshatra-based Muhurta guidance: identify auspicious and inauspicious days based on transit Nakshatra and your birth star.',
  },
}

const DEFAULT_META = {
  title:       'Nakshatra Analysis — Vedic Astrology',
  description: 'Deep Nakshatra analysis: Pada, deity, planet, Yogini Dasha, compatibility & remedies. Swiss Ephemeris precision for all 27 Nakshatras.',
}

export async function generateMetadata(
  { params }: { params: { tab: string } }
): Promise<Metadata> {
  const meta = TAB_META[params.tab] ?? DEFAULT_META
  const url  = `${BASE_URL}/nakshatra/${params.tab}`

  return {
    title:       meta.title,
    description: meta.description,
    alternates:  { canonical: url },
    openGraph: {
      title:       `${meta.title} | Vedaansh`,
      description: meta.description,
      url,
      type:        'website',
      images:      [{ url: '/og-default.png', width: 1200, height: 630, alt: meta.title }],
    },
    twitter: {
      card:        'summary_large_image',
      title:       `${meta.title} | Vedaansh`,
      description: meta.description,
      images:      ['/og-default.png'],
    },
  }
}

export default function NakshatraTabLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
