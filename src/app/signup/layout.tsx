import type { Metadata } from 'next'
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://vedaansh.com'

export const metadata: Metadata = {
  title:       'Create Account — Vedaansh',
  description: 'Create your free Vedaansh account to save birth charts, track Dasha periods & access your personal Vedic astrology dashboard.',
  alternates:  { canonical: `${BASE_URL}/signup` },
  robots:      { index: false, follow: false },
}

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
