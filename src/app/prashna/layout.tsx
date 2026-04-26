import type { Metadata } from 'next'
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://vedaansh.com'

export const metadata: Metadata = {
  title:       'Prashna — Krishneeyam Kerala Horary Astrology',
  description: 'Prashna Jyotish powered by Krishneeyam (Kerala horary): Yes/No verdicts, When timing, What/Who analysis, Lost Article recovery, Health, Pregnancy & Travel queries using traditional Aroodha-Udaya, Seershodaya, Oordhwamukha rules.',
  alternates:  { canonical: `${BASE_URL}/prashna` },
  keywords:    ['Prashna', 'horary astrology', 'Krishneeyam', 'Kerala astrology', 'Prashna Jyotish', 'Aroodha', 'Udaya Lagna', 'Yes No astrology', 'Nashta Prashna', 'KP horary', 'Prasna Marga'],
  openGraph: {
    title:       'Prashna — Krishneeyam Kerala Horary | Vedaansh',
    description: 'Instant Prashna chart with Krishneeyam rules: Yes/No, When, What, Who, Lost Article, Health & more.',
    url:         `${BASE_URL}/prashna`,
    type:        'website',
    images:      [{ url: '/og-default.png', width: 1200, height: 630, alt: 'Prashna Kerala Horary Astrology — Vedaansh' }],
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Prashna — Krishneeyam Kerala Horary | Vedaansh',
    description: 'Instant Prashna chart with traditional Krishneeyam rules for Yes/No, timing, lost articles & more.',
    images:      ['/og-default.png'],
  },
}

export default function PrashnaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
