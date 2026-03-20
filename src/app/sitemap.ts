// src/app/sitemap.ts
// Generates sitemap.xml — static pages + all public charts
import type { MetadataRoute } from 'next'
import connectDB from '@/lib/db/mongodb'
import { Chart } from '@/lib/db/models/Chart'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://vedicamrit.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url:              BASE_URL,
      lastModified:     new Date(),
      changeFrequency:  'daily',
      priority:         1,
    },
    {
      url:              `${BASE_URL}/panchang`,
      lastModified:     new Date(),
      changeFrequency:  'daily',
      priority:         0.9,
    },
    {
      url:              `${BASE_URL}/login`,
      lastModified:     new Date(),
      changeFrequency:  'monthly',
      priority:         0.5,
    },
  ]

  // Public chart pages
  try {
    await connectDB()
    const publicCharts = await Chart
      .find({ isPublic: true, slug: { $ne: null } })
      .select('slug updatedAt')
      .sort({ updatedAt: -1 })
      .limit(1000)
      .lean()

    const chartPages: MetadataRoute.Sitemap = publicCharts.map((c: any) => ({
      url:             `${BASE_URL}/chart/${c.slug}`,
      lastModified:    c.updatedAt ?? new Date(),
      changeFrequency: 'weekly' as const,
      priority:        0.7,
    }))

    return [...staticPages, ...chartPages]
  } catch {
    return staticPages
  }
}