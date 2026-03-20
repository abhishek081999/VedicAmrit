// ─────────────────────────────────────────────────────────────
//  src/app/api/auth/[...nextauth]/route.ts
//  Entry point for NextAuth (handlers export)
// ─────────────────────────────────────────────────────────────

import { handlers } from '@/auth'

export const { GET, POST } = handlers
