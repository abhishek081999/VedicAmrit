import type { Metadata } from 'next'
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://vedaansh.com'

export const metadata: Metadata = {
  title:       'Astrocartography — Vedic Locality Charts',
  description: 'Vedic Astrocartography (ACG): find your power locations worldwide using planetary lines, Parivartana zones & relocation chart strength analysis.',
  alternates:  { canonical: `${BASE_URL}/acg` },
  keywords:    ['astrocartography', 'Vedic locality chart', 'ACG', 'planetary lines', 'relocation astrology', 'power locations', 'Jyotish ACG'],
  openGraph: {
    title:       'Astrocartography — Vedic Locality Charts | Vedaansh',
    description: 'Find your power locations worldwide using Vedic planetary lines & relocation chart analysis.',
    url:         `${BASE_URL}/acg`,
    type:        'website',
    images:      [{ url: '/og-default.png', width: 1200, height: 630, alt: 'Astrocartography — Vedaansh' }],
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Astrocartography — Vedic Locality Charts | Vedaansh',
    description: 'Find your power locations worldwide using Vedic planetary lines & relocation chart analysis.',
    images:      ['/og-default.png'],
  },
}

export default function ACGLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
