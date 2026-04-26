import type { Metadata } from 'next'
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://vedaansh.com'

export const metadata: Metadata = {
  title:       'Jaimini Astrology — Chara Dasha & Karakas',
  description: 'Jaimini Jyotish on your Vedic chart: Atmakaraka, Amatyakaraka, Chara Dasha periods, Jaimini aspects, Arudha Lagnas & Sphuta calculations.',
  alternates:  { canonical: `${BASE_URL}/jaimini` },
  keywords:    ['Jaimini astrology', 'Chara Dasha', 'Atmakaraka', 'Amatyakaraka', 'Jaimini Karakas', 'Jaimini aspects', 'Arudha Lagna'],
  openGraph: {
    title:       'Jaimini Astrology — Chara Dasha & Karakas | Vedaansh',
    description: 'Atmakaraka, Chara Dasha, Jaimini aspects & Arudha Lagnas on your Vedic birth chart.',
    url:         `${BASE_URL}/jaimini`,
    type:        'website',
    images:      [{ url: '/og-default.png', width: 1200, height: 630, alt: 'Jaimini Astrology — Vedaansh' }],
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Jaimini Astrology — Chara Dasha & Karakas | Vedaansh',
    description: 'Atmakaraka, Chara Dasha, Jaimini aspects & Arudha Lagnas on your Vedic birth chart.',
    images:      ['/og-default.png'],
  },
}

export default function JaiminiLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
