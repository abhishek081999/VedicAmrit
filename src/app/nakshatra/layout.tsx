import type { Metadata } from 'next'
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://vedaansh.com'

export const metadata: Metadata = {
  title:       'Nakshatra Analysis — Vedic Astrology',
  description: 'Deep Nakshatra analysis: Pada, ruling deity, planet, compatibility, remedies, Yogini Dasha & transit activation. Swiss Ephemeris precision for all 27 Nakshatras.',
  alternates:  { canonical: `${BASE_URL}/nakshatra` },
  keywords:    ['Nakshatra', 'Vedic nakshatra', 'birth star', 'Pada', 'Yogini dasha', 'nakshatra compatibility', 'Ashwini', 'Rohini', 'Hasta'],
  openGraph: {
    title:       'Nakshatra Analysis — Vedaansh',
    description: 'All 27 Nakshatras — Pada, deity, planet, Yogini Dasha & remedies. Swiss Ephemeris accuracy.',
    url:         `${BASE_URL}/nakshatra`,
    type:        'website',
    images:      [{ url: '/og-default.png', width: 1200, height: 630, alt: 'Nakshatra Analysis — Vedaansh' }],
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Nakshatra Analysis — Vedaansh',
    description: 'All 27 Nakshatras — Pada, deity, planet, Yogini Dasha & remedies.',
    images:      ['/og-default.png'],
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type':    'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home',      item: BASE_URL },
    { '@type': 'ListItem', position: 2, name: 'Nakshatra', item: `${BASE_URL}/nakshatra` },
  ],
}

export default function NakshatraLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  )
}
