import type { Metadata } from 'next'
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://vedaansh.com'

export const metadata: Metadata = {
  title:       'Personal Transit Roadmap — Vedaansh',
  description: 'Your personal Vedic transit roadmap: upcoming planetary transits, Dasha periods & key astrological windows visualised on an interactive timeline.',
  alternates:  { canonical: `${BASE_URL}/roadmap` },
  keywords:    ['Vedic transit', 'planetary transit', 'Dasha timeline', 'Jyotish roadmap', 'transit calendar', 'personal astrology forecast'],
  openGraph: {
    title:       'Personal Transit Roadmap | Vedaansh',
    description: 'Upcoming planetary transits, Dasha periods & key astrological windows on an interactive Vedic timeline.',
    url:         `${BASE_URL}/roadmap`,
    type:        'website',
    images:      [{ url: '/og-default.png', width: 1200, height: 630, alt: 'Transit Roadmap — Vedaansh' }],
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Personal Transit Roadmap | Vedaansh',
    description: 'Upcoming planetary transits, Dasha periods & key astrological windows on an interactive timeline.',
    images:      ['/og-default.png'],
  },
}

export default function RoadmapLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
