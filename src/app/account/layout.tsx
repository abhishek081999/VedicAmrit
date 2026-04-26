import type { Metadata } from 'next'
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://vedaansh.com'

export const metadata: Metadata = {
  title:       'Account — Vedaansh',
  description: 'Manage your Vedaansh account: profile, subscription, theme preferences and notification settings.',
  alternates:  { canonical: `${BASE_URL}/account` },
  robots:      { index: false, follow: false },
}

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
