// src/app/layout.tsx
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider }      from '@/components/providers/SessionProvider'
import { AppLayoutProvider } from '@/components/providers/LayoutProvider'
import { ChartProvider }     from '@/components/providers/ChartProvider'
import { AppFramework }      from '@/components/ui/AppFramework'

// ── Prevent theme flash ───────────────────────────────────────
const themeScript = `(function(){try{var t=localStorage.getItem('jyotish-theme');document.documentElement.setAttribute('data-theme',t==='light'?'light':t==='dark'?'dark':'classic')}catch(e){}})();`

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://vedaansh.com'

// ── Root metadata ─────────────────────────────────────────────
export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  title: {
    template: '%s — Vedaansh',
    default:  'Vedaansh — Free Vedic Astrology & Jyotiṣa Platform',
  },

  description:
    'Calculate free Vedic birth charts (Kundali), Vimshottari Dasha, Navamsha, all 41 varga charts, Panchang & Āruḍhas. Arc-second accuracy via Swiss Ephemeris. No login required.',

  keywords: [
    'Vedic astrology', 'Jyotish', 'kundali', 'birth chart', 'free horoscope',
    'Vimshottari Dasha', 'Navamsha', 'D9 chart', 'Panchang', 'Arudha Lagna',
    'Rahu Kalam', 'Nakshatra', 'Swiss Ephemeris', 'Vedaansh',
    'Lahiri ayanamsha', 'divisional charts', 'varga charts',
  ],

  authors:  [{ name: 'Vedaansh' }],
  creator:  'Vedaansh',
  publisher:'Vedaansh',

  // ── Open Graph ──────────────────────────────────────────────
  openGraph: {
    type:      'website',
    locale:    'en_IN',
    url:        BASE_URL,
    siteName:  'Vedaansh',
    title:     'Vedaansh — Free Vedic Astrology Platform',
    description:
      'Free Vedic birth charts, Dasha, 41 vargas, Panchang. Swiss Ephemeris precision.',
    images: [{
      url:    '/og-default.png',
      width:  1200,
      height: 630,
      alt:    'Vedaansh — Vedic Astrology Platform',
    }],
  },

  // ── Twitter card ────────────────────────────────────────────
  twitter: {
    card:        'summary_large_image',
    site:        '@vedaansh',
    title:       'Vedaansh — Free Vedic Astrology',
    description: 'Free birth charts, Dasha, 41 vargas, Panchang. Swiss Ephemeris precision.',
    images:      ['/og-default.png'],
  },

  // ── Canonical & alternates ──────────────────────────────────
  alternates: {
    canonical: BASE_URL,
    languages: { 'en-IN': BASE_URL },
  },

  // ── Robots ──────────────────────────────────────────────────
  robots: {
    index:           true,
    follow:          true,
    googleBot: {
      index:               true,
      follow:              true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet':       -1,
    },
  },

  // ── App metadata ────────────────────────────────────────────
  applicationName: 'Vedaansh',
  category:        'astrology',
}

// ── Viewport ──────────────────────────────────────────────────
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)',  color: '#0b0b14' },
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
  ],
  width:          'device-width',
  initialScale:    1,
  maximumScale:    5,
  viewportFit:     'cover',
}

// ── Root Layout ───────────────────────────────────────────────
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="icon" type="image/png" href="/veda-icon.png" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Vedaansh" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <AuthProvider>
          <AppLayoutProvider>
            <ChartProvider>
              <AppFramework>
                {children}
              </AppFramework>
            </ChartProvider>
          </AppLayoutProvider>
        </AuthProvider>
      </body>
    </html>
  )
}