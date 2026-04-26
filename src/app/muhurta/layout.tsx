import type { Metadata } from 'next'
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://vedaansh.com'

export const metadata: Metadata = {
  title:       'Muhurta — Auspicious Time Selector',
  description: 'Find the perfect Muhurta for weddings, business launches & important events. Vedic Panchang analysis: Tithi, Nakshatra, Yoga, Karana, Rahu Kalam & personal Dasha compatibility.',
  alternates:  { canonical: `${BASE_URL}/muhurta` },
  keywords:    ['Muhurta', 'auspicious time', 'Vedic election astrology', 'wedding Muhurta', 'Shubh Muhurta', 'Rahu Kalam', 'Tithi', 'Nakshatra timing'],
  openGraph: {
    title:       'Muhurta — Auspicious Time Selector | Vedaansh',
    description: 'Tithi, Nakshatra, Yoga, Karana & personal Dasha analysis to find your perfect auspicious time.',
    url:         `${BASE_URL}/muhurta`,
    type:        'website',
    images:      [{ url: '/og-default.png', width: 1200, height: 630, alt: 'Muhurta — Vedaansh' }],
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Muhurta — Auspicious Time Selector | Vedaansh',
    description: 'Find your perfect auspicious Muhurta using Vedic Panchang & personal Dasha compatibility.',
    images:      ['/og-default.png'],
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type':    'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home',    item: BASE_URL },
    { '@type': 'ListItem', position: 2, name: 'Muhurta', item: `${BASE_URL}/muhurta` },
  ],
}

export default function MuhurtaLayout({ children }: { children: React.ReactNode }) {
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
