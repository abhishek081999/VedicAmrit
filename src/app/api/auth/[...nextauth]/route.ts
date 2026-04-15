// ─────────────────────────────────────────────────────────────
//  src/app/api/auth/[...nextauth]/route.ts
//  Entry point for NextAuth (handlers export)
// ─────────────────────────────────────────────────────────────

import { handlers } from '@/auth'

// Auth.js route
export const { GET, POST } = handlers
