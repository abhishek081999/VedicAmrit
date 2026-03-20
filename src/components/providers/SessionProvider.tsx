'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/providers/SessionProvider.tsx
//  NextAuth.js v5 Client-side session context provider
// ─────────────────────────────────────────────────────────────

import { SessionProvider } from 'next-auth/react'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
