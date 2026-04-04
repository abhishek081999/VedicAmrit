// src/components/ui/JsonLd.tsx
// Injects JSON-LD structured data into page <head>
// Use in server components only

export function WebsiteJsonLd() {
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://vedaansh.com'
  const data = {
    '@context': 'https://schema.org',
    '@type':    'WebSite',
    name:       'Vedaansh',
    url:         BASE_URL,
    description: 'Free Vedic astrology platform. Calculate birth charts, Dasha, Navamsha & Panchang.',
    potentialAction: {
      '@type':       'SearchAction',
      target:        `${BASE_URL}/?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

export function SoftwareAppJsonLd() {
  const data = {
    '@context':       'https://schema.org',
    '@type':          'SoftwareApplication',
    name:             'Vedaansh',
    operatingSystem: 'Web',
    applicationCategory: 'LifestyleApplication',
    offers: {
      '@type': 'Offer',
      price:   '0',
      priceCurrency: 'INR',
    },
    description: 'Professional Vedic Jyotish platform with Swiss Ephemeris precision.',
    featureList: [
      'Vedic birth chart (Kundali)',
      '41 varga divisional charts',
      'Vimshottari Dasha',
      'Daily Panchang',
      'Āruḍha Lagnas',
    ],
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

export function ChartPageJsonLd({
  name, birthDate, birthPlace, url,
}: {
  name: string; birthDate: string; birthPlace: string; url: string
}) {
  const data = {
    '@context': 'https://schema.org',
    '@type':    'ProfilePage',
    name:       `${name} — Vedic Birth Chart`,
    url,
    mainEntity: {
      '@type': 'Person',
      name,
      birthDate,
      birthPlace: { '@type': 'Place', name: birthPlace },
    },
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}