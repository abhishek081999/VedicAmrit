import type { Metadata } from 'next'
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://vedaansh.com'

export const metadata: Metadata = {
  title:       'Sign In — Vedaansh',
  description: 'Sign in to Vedaansh to access your saved birth charts, Dasha timelines & personal astrology dashboard.',
  alternates:  { canonical: `${BASE_URL}/login` },
  robots:      { index: false, follow: false },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
