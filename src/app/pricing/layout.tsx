import type { Metadata } from 'next'
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://vedaansh.com'

export const metadata: Metadata = {
  title:       'Pricing — Vedaansh',
  description: 'Explore Vedaansh subscription plans. Generate free Vedic birth charts forever. Upgrade to Platinum for unlimited charts, advanced interpretations & priority support.',
  alternates:  { canonical: `${BASE_URL}/pricing` },
  openGraph: {
    title:       'Pricing — Vedaansh',
    description: 'Free Vedic astrology forever. Upgrade for unlimited charts, advanced features & more.',
    url:         `${BASE_URL}/pricing`,
    type:        'website',
    images:      [{ url: '/og-default.png', width: 1200, height: 630, alt: 'Vedaansh Pricing Plans' }],
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Pricing — Vedaansh',
    description: 'Free Vedic astrology forever. Upgrade for unlimited charts, advanced features & more.',
    images:      ['/og-default.png'],
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type':    'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home',    item: BASE_URL },
    { '@type': 'ListItem', position: 2, name: 'Pricing', item: `${BASE_URL}/pricing` },
  ],
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
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
