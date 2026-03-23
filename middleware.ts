// ─────────────────────────────────────────────────────────────
//  src/middleware.ts
//  Edge middleware — auth checks + tier-based feature gating
//  Runs before every request on protected routes
// ─────────────────────────────────────────────────────────────

import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/chart',
  '/my',
  '/muhurta',
  '/research',
  '/account',
]

// API routes that require authentication
const PROTECTED_API = [
  '/api/chart/save',
  '/api/chart/delete',
  '/api/user',
  '/api/subscription',
  '/api/muhurta',
  '/api/research',
]

// Routes requiring Velā+ plan
const VELA_ROUTES = ['/muhurta']
const VELA_API    = ['/api/muhurta', '/api/chart/export']

// Routes requiring Horā plan
const HORA_ROUTES  = ['/research']
const HORA_API     = ['/api/research']

export default auth((req: NextRequest & { auth: any }) => {
  const { pathname } = req.nextUrl
  const session      = req.auth

  // ── API route protection ──────────────────────────────────
  const isProtectedApi = PROTECTED_API.some((p) => pathname.startsWith(p))
  if (isProtectedApi && !session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Velā API gating ───────────────────────────────────────
  const isVelaApi = VELA_API.some((p) => pathname.startsWith(p))
  if (isVelaApi && session?.user) {
    const plan = session.user.plan ?? 'kala'
    if (plan === 'kala') {
      return NextResponse.json(
        { error: 'This feature requires Velā or Horā plan', upgradeRequired: true },
        { status: 403 },
      )
    }
  }

  // ── Horā API gating ───────────────────────────────────────
  const isHoraApi = HORA_API.some((p) => pathname.startsWith(p))
  if (isHoraApi && session?.user) {
    const plan = session.user.plan ?? 'kala'
    if (plan !== 'hora') {
      return NextResponse.json(
        { error: 'This feature requires Horā plan', upgradeRequired: true },
        { status: 403 },
      )
    }
  }

  // ── Page route protection ─────────────────────────────────
  const isProtectedPage = PROTECTED_ROUTES.some((p) => pathname.startsWith(p))
  if (isProtectedPage && !session?.user) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ── Velā page gating ──────────────────────────────────────
  const isVelaPage = VELA_ROUTES.some((p) => pathname.startsWith(p))
  if (isVelaPage && session?.user) {
    const plan = session.user.plan ?? 'kala'
    if (plan === 'kala') {
      const upgradeUrl = new URL('/account?upgrade=vela', req.url)
      return NextResponse.redirect(upgradeUrl)
    }
  }

  // ── Horā page gating ──────────────────────────────────────
  const isHoraPage = HORA_ROUTES.some((p) => pathname.startsWith(p))
  if (isHoraPage && session?.user) {
    const plan = session.user.plan ?? 'kala'
    if (plan !== 'hora') {
      const upgradeUrl = new URL('/account?upgrade=hora', req.url)
      return NextResponse.redirect(upgradeUrl)
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Match all routes except static files, images, and _next
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
