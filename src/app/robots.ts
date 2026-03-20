// src/app/robots.ts
import type { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://vedicamrit.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow:     '/',
        disallow:  ['/api/', '/my/', '/account/', '/verify-email/'],
      },
    ],
    sitemap:    `${BASE_URL}/sitemap.xml`,
    host:       BASE_URL,
  }
}