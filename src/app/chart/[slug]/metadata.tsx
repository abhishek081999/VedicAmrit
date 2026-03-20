// src/app/chart/[slug]/metadata.ts
// Server-side metadata generation for public chart pages
import type { Metadata } from 'next'
import connectDB from '@/lib/db/mongodb'
import { Chart } from '@/lib/db/models/Chart'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://vedicamrit.com'
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export async function generateChartMetadata(slug: string): Promise<Metadata> {
  try {
    await connectDB()
    const chart = await Chart.findOne({ slug, isPublic: true })
      .select('name birthDate birthPlace').lean()

    if (!chart) {
      return {
        title: 'Chart Not Found',
        description: 'This chart is private or does not exist.',
        robots: { index: false, follow: false },
      }
    }

    const d     = new Date((chart as any).birthDate + 'T12:00:00Z')
    const date  = `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
    const name  = (chart as any).name      as string
    const place = (chart as any).birthPlace as string

    const title       = `${name} — Vedic Birth Chart`
    const description = `Vedic Jyotish chart for ${name}, born ${date}${place ? ` in ${place}` : ''}. Includes Rashi chart, Navamsha, Dasha, Āruḍhas & Pañcāṅga.`
    const url         = `${BASE_URL}/chart/${slug}`
    const ogImage     = `${BASE_URL}/chart/${slug}/opengraph-image`

    return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: {
        title,
        description,
        url,
        type:     'profile',
        images:   [{ url: ogImage, width: 1200, height: 630, alt: `${name} — Vedic Chart` }],
        siteName: 'Vedic Amrit',
      },
      twitter: {
        card:        'summary_large_image',
        title,
        description,
        images:      [ogImage],
      },
    }
  } catch {
    return {
      title:       'Vedic Chart — Vedic Amrit',
      description: 'View this Vedic Jyotish birth chart on Vedic Amrit.',
    }
  }
}