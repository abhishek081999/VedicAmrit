// src/app/layout.tsx
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider }      from '@/components/providers/SessionProvider'
import { AppLayoutProvider } from '@/components/providers/LayoutProvider'
import { AppFramework }      from '@/components/ui/AppFramework'

// ── Prevent theme flash ───────────────────────────────────────
const themeScript = `(function(){try{var t=localStorage.getItem('jyotish-theme');document.documentElement.setAttribute('data-theme',t==='light'?'light':'dark')}catch(e){}})();`

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://vedicamrit.com'

// ── Root metadata ─────────────────────────────────────────────
export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  title: {
    template: '%s — Vedic Amrit',
    default:  'Vedic Amrit — Free Vedic Astrology & Jyotiṣa Platform',
  },

  description:
    'Calculate free Vedic birth charts (Kundali), Vimshottari Dasha, Navamsha, all 16 varga charts, Panchang & Āruḍhas. Arc-second accuracy via Swiss Ephemeris. No login required.',

  keywords: [
    'Vedic astrology', 'Jyotish', 'kundali', 'birth chart', 'free horoscope',
    'Vimshottari Dasha', 'Navamsha', 'D9 chart', 'Panchang', 'Arudha Lagna',
    'Rahu Kalam', 'Nakshatra', 'Swiss Ephemeris', 'Vedic Amrit',
    'Lahiri ayanamsha', 'divisional charts', 'varga charts',
  ],

  authors:  [{ name: 'Vedic Amrit' }],
  creator:  'Vedic Amrit',
  publisher:'Vedic Amrit',

  // ── Open Graph ──────────────────────────────────────────────
  openGraph: {
    type:      'website',
    locale:    'en_IN',
    url:        BASE_URL,
    siteName:  'Vedic Amrit',
    title:     'Vedic Amrit — Free Vedic Astrology Platform',
    description:
      'Free Vedic birth charts, Dasha, 16 vargas, Panchang. Swiss Ephemeris precision.',
    images: [{
      url:    '/og-default.png',
      width:  1200,
      height: 630,
      alt:    'Vedic Amrit — Vedic Astrology Platform',
    }],
  },

  // ── Twitter card ────────────────────────────────────────────
  twitter: {
    card:        'summary_large_image',
    site:        '@vedicamrit',
    title:       'Vedic Amrit — Free Vedic Astrology',
    description: 'Free birth charts, Dasha, 16 vargas, Panchang. Swiss Ephemeris precision.',
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
  applicationName: 'Vedic Amrit',
  category:        'astrology',
}

// ── Viewport ──────────────────────────────────────────────────
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)',  color: '#0e0e18' },
    { media: '(prefers-color-scheme: light)', color: '#faf8f2' },
  ],
  width:          'device-width',
  initialScale:    1,
  maximumScale:    5,
}

// ── Root Layout ───────────────────────────────────────────────
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="icon"       href="/favicon.ico" sizes="any" />
        <link rel="icon"       href="/icon.svg"    type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest"   href="/manifest.json" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <AuthProvider>
          <AppLayoutProvider>
            <AppFramework>
              {children}
            </AppFramework>
          </AppLayoutProvider>
        </AuthProvider>
      </body>
    </html>
  )
}