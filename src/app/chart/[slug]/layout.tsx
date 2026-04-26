// src/app/chart/[slug]/layout.tsx
// Server component — exports generateMetadata for SEO
// The actual page is a client component (page.tsx)
import type { Metadata } from 'next'
import { generateChartMetadata } from './metadata'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://vedaansh.com'

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  return generateChartMetadata(params.slug)
}

export default function ChartLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { slug: string }
}) {
  const url = `${BASE_URL}/chart/${params.slug}`

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type':    'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home',        item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: 'Vedic Chart', item: url },
    ],
  }

  const profilePage = {
    '@context':  'https://schema.org',
    '@type':     'ProfilePage',
    url,
    mainEntity: {
      '@type': 'Person',
      description: 'Vedic Jyotish birth chart generated on Vedaansh',
    },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(profilePage) }} />
      {children}
    </>
  )
}