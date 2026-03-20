// src/app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    template: '%s — Jyotiṣa',
    default: 'Jyotiṣa — Vedic Astrology Platform',
  },
  description:
    'Professional Vedic Jyotish platform. Calculate birth charts, Vimshottari Dasha, Navamsha, Panchang — with arc-second precision via Swiss Ephemeris.',
  keywords: ['Jyotish', 'Vedic astrology', 'birth chart', 'Dasha', 'Panchang', 'Navamsha'],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: 'Jyotiṣa',
  },
}

// Inline script injected before first paint — prevents theme flash
const themeScript = `
(function(){
  try {
    var t = localStorage.getItem('jyotish-theme');
    document.documentElement.setAttribute('data-theme', t === 'light' ? 'light' : 'dark');
  } catch(e){}
})();
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Prevent flash of wrong theme */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
