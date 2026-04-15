// ─────────────────────────────────────────────────────────────
//  src/app/admin/layout.tsx
//  Dedicated layout for administrative dashboard.
//  Includes authentication guard and admin sidebar.
// ─────────────────────────────────────────────────────────────

import React from 'react'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const user = session?.user as any

  if (!user || user.role !== 'admin') {
    redirect('/')
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-page)', overflow: 'hidden' }}>
      
      <AdminSidebar user={user} />

      {/* ── Main Content Area ────────────────────────────────── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header style={{ 
          height: 64, 
          borderBottom: '1px solid var(--border)', 
          background: 'var(--surface-1)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          padding: '0 1.5rem'
        }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>System Overview</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <ThemeToggle />
          </div>
        </header>

        <section style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          {children}
        </section>
      </main>
    </div>
  )
}
