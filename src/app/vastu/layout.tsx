import type { Metadata } from 'next'
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://vedaansh.com'

export const metadata: Metadata = {
  title:       'Vāstu Śāstra — Directional Astrology',
  description: 'Vedic Vastu analysis using your birth chart: planetary directions, Vastu Dosha identification, remedies & directional strength (Digbala) from your Kundali.',
  alternates:  { canonical: `${BASE_URL}/vastu` },
  keywords:    ['Vastu Shastra', 'Vastu astrology', 'Digbala', 'directional strength', 'Vastu Dosha', 'planetary directions', 'Jyotish Vastu'],
  openGraph: {
    title:       'Vāstu Śāstra — Directional Astrology | Vedaansh',
    description: 'Planetary directions, Digbala & Vastu Dosha analysis from your Vedic birth chart.',
    url:         `${BASE_URL}/vastu`,
    type:        'website',
    images:      [{ url: '/og-default.png', width: 1200, height: 630, alt: 'Vastu Shastra — Vedaansh' }],
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Vāstu Śāstra — Directional Astrology | Vedaansh',
    description: 'Planetary directions, Digbala & Vastu Dosha analysis from your Vedic birth chart.',
    images:      ['/og-default.png'],
  },
}

export default function VastuLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
