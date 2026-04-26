import type { Metadata } from 'next'
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://vedaansh.com'

export const metadata: Metadata = {
  title:       'Client Management — Vedaansh',
  description: 'Manage your astrology clients: save multiple charts, add notes, track Dasha timelines and share birth chart reports. Platinum feature.',
  alternates:  { canonical: `${BASE_URL}/clients` },
  robots:      { index: false, follow: false },
}

export default function ClientsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
