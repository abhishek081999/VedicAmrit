import type { Metadata } from 'next'
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://vedaansh.com'

export const metadata: Metadata = {
  title:       'Chart Comparison & Synastry — Vedaansh',
  description: 'Compare two Vedic birth charts side-by-side. Ashtakoot compatibility scoring, Dosha analysis, Guna Milan & synastry overlays for relationships and compatibility.',
  alternates:  { canonical: `${BASE_URL}/compare` },
  keywords:    ['Kundali matching', 'synastry', 'chart comparison', 'Ashtakoot', 'Guna Milan', 'compatibility', 'Dosha', 'Vedic compatibility'],
  openGraph: {
    title:       'Chart Comparison & Kundali Matching — Vedaansh',
    description: 'Compare two Vedic charts: Ashtakoot compatibility, Dosha analysis & synastry overlays.',
    url:         `${BASE_URL}/compare`,
    type:        'website',
    images:      [{ url: '/og-default.png', width: 1200, height: 630, alt: 'Chart Comparison — Vedaansh' }],
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Chart Comparison & Kundali Matching — Vedaansh',
    description: 'Ashtakoot compatibility, Dosha analysis & synastry overlays for two Vedic charts.',
    images:      ['/og-default.png'],
  },
}

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
