// src/app/chart/[slug]/layout.tsx
// Server component — exports generateMetadata for SEO
// The actual page is a client component (page.tsx)
import type { Metadata } from 'next'
import { generateChartMetadata } from './metadata'

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  return generateChartMetadata(params.slug)
}

export default function ChartLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}