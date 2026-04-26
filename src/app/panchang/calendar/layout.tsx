import type { Metadata } from 'next'
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://vedaansh.com'

export const metadata: Metadata = {
  title:       'Vedic Panchang Calendar — Monthly Tithi & Nakshatra',
  description: 'Monthly Vedic Panchang calendar: every day\'s Tithi, Nakshatra, Yoga, Karana, festivals, Ekadashi, Amavasya & Purnima. Swiss Ephemeris accuracy.',
  alternates:  { canonical: `${BASE_URL}/panchang/calendar` },
  keywords:    ['Vedic calendar', 'Panchang calendar', 'Tithi calendar', 'Ekadashi', 'Purnima', 'Amavasya', 'Hindu calendar', 'Nakshatra calendar'],
  openGraph: {
    title:       'Vedic Panchang Calendar — Tithi, Nakshatra & Festivals',
    description: 'Monthly Vedic calendar with every day\'s Tithi, Nakshatra, Yoga, festivals & auspicious days.',
    url:         `${BASE_URL}/panchang/calendar`,
    type:        'website',
    images:      [{ url: '/og-default.png', width: 1200, height: 630, alt: 'Vedic Panchang Calendar — Vedaansh' }],
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Vedic Panchang Calendar | Vedaansh',
    description: 'Monthly Tithi, Nakshatra, Yoga, festivals & auspicious days. Swiss Ephemeris accuracy.',
    images:      ['/og-default.png'],
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type':    'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home',             item: BASE_URL },
    { '@type': 'ListItem', position: 2, name: 'Pañcāṅga',         item: `${BASE_URL}/panchang` },
    { '@type': 'ListItem', position: 3, name: 'Monthly Calendar', item: `${BASE_URL}/panchang/calendar` },
  ],
}

export default function PanchangCalendarLayout({ children }: { children: React.ReactNode }) {
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
