// src/app/robots.ts
import type { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://vedaansh.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow:     '/',
        disallow:  ['/api/', '/my/', '/account/', '/admin/', '/verify-email/', '/forgot/', '/reset-password/', '/scrubber/', '/mockup/'],
      },
    ],
    sitemap:    `${BASE_URL}/sitemap.xml`,
    host:       BASE_URL,
  }
}