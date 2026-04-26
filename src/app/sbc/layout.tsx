import type { Metadata } from 'next'
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://vedaansh.com'

export const metadata: Metadata = {
  title:       'Sarvatobhadra Chakra — Vedic Transit Grid',
  description: 'Sarvatobhadra Chakra (SBC): analyze planetary transits, Vedhas, Nakshatra activation & auspicious periods on the traditional 9×9 Vedic transit grid.',
  alternates:  { canonical: `${BASE_URL}/sbc` },
  keywords:    ['Sarvatobhadra Chakra', 'SBC', 'Vedic transit', 'Vedha', 'Nakshatra transit', 'Vedic grid', 'transit analysis'],
  openGraph: {
    title:       'Sarvatobhadra Chakra — Vedic Transit Grid | Vedaansh',
    description: 'Planetary transits, Vedhas & Nakshatra activation on the traditional Sarvatobhadra Chakra.',
    url:         `${BASE_URL}/sbc`,
    type:        'website',
    images:      [{ url: '/og-default.png', width: 1200, height: 630, alt: 'Sarvatobhadra Chakra — Vedaansh' }],
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Sarvatobhadra Chakra — Vedic Transit Grid | Vedaansh',
    description: 'Planetary transits, Vedhas & Nakshatra activation on the traditional Sarvatobhadra Chakra.',
    images:      ['/og-default.png'],
  },
}

export default function SBCLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
