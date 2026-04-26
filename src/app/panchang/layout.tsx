import type { Metadata } from 'next'
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://vedaansh.com'

export const metadata: Metadata = {
  title:       'Daily Pañcāṅga — Vedic Calendar',
  description: 'Free daily Vedic Panchang: Tithi, Vara, Nakshatra, Yoga, Karana, Rahu Kalam, Gulika & Abhijit Muhurta. Real sunrise/sunset via Swiss Ephemeris.',
  alternates:  { canonical: `${BASE_URL}/panchang` },
  openGraph: {
    title:       'Daily Pañcāṅga — Vedaansh',
    description: 'Free daily Vedic Panchang with astronomical sunrise, Rahu Kalam, Nakshatra & Hora table.',
    url:         `${BASE_URL}/panchang`,
    type:        'website',
    images:      [{ url: '/og-default.png', width: 1200, height: 630, alt: 'Daily Panchang — Vedaansh' }],
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Daily Pañcāṅga — Vedaansh',
    description: 'Tithi, Nakshatra, Yoga, Karana, Rahu Kalam & Hora table — free every day.',
    images:      ['/og-default.png'],
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type':    'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home',     item: BASE_URL },
    { '@type': 'ListItem', position: 2, name: 'Pañcāṅga', item: `${BASE_URL}/panchang` },
  ],
}

export default function PanchangLayout({ children }: { children: React.ReactNode }) {
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