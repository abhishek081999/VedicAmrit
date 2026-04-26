import type { Metadata } from 'next'
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://vedaansh.com'

export const metadata: Metadata = {
  title:       'Prashna — Vedic Horary Astrology',
  description: 'Prashna Jyotish (Vedic horary astrology): cast an instant chart for your question and receive traditional answers using Nakshatra, Ascendant & planetary positions via Swiss Ephemeris.',
  alternates:  { canonical: `${BASE_URL}/prashna` },
  keywords:    ['Prashna', 'horary astrology', 'Vedic horary', 'Prashna Jyotish', 'question chart', 'KP horary', 'Prasna'],
  openGraph: {
    title:       'Prashna — Vedic Horary Astrology | Vedaansh',
    description: 'Cast an instant Prashna (horary) chart for your question — Nakshatra, Ascendant & planetary analysis.',
    url:         `${BASE_URL}/prashna`,
    type:        'website',
    images:      [{ url: '/og-default.png', width: 1200, height: 630, alt: 'Prashna Horary Astrology — Vedaansh' }],
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Prashna — Vedic Horary Astrology | Vedaansh',
    description: 'Cast an instant Prashna chart for your question — traditional Vedic horary analysis.',
    images:      ['/og-default.png'],
  },
}

export default function PrashnaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
