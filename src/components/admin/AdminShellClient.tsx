'use client'
import React, { useState, useEffect } from 'react'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

export function AdminShellClient({ children, user }: { children: React.ReactNode, user: any }) {
  const [isMobile, setIsMobile] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Auto-close sidebar on mobile navigation
  useEffect(() => {
    setSidebarOpen(false)
  }, [/* dependency on pathname would go here if needed, but sidebar is usually stable */])

  return (
    <div style={{ 
      display: 'flex', 
      height: '100vh', 
      background: 'var(--bg-page)', 
      overflow: 'hidden',
      flexDirection: isMobile ? 'column' : 'row'
    }}>
      
      {/* ── Sidebar Desktop / Mobile Drawer ─────────────────── */}
      <div style={{
        position: isMobile ? 'fixed' : 'relative',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 1000,
        transform: isMobile ? (sidebarOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        width: 260
      }}>
        <AdminSidebar user={user} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* ── Overlay for Mobile ─────────────────────────────── */}
      {isMobile && sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(2px)',
            zIndex: 999
          }}
        />
      )}

      {/* ── Main Content Area ────────────────────────────────── */}
      <main style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        overflow: 'hidden',
        width: '100%'
      }}>
        <header style={{ 
          height: isMobile ? 56 : 64, 
          borderBottom: '1px solid var(--border)', 
          background: 'var(--surface-1)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          padding: isMobile ? '0 1rem' : '0 1.5rem',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {isMobile && (
              <button 
                onClick={() => setSidebarOpen(true)}
                style={{ 
                  background: 'transparent', border: 'none', color: 'var(--text-primary)', 
                  fontSize: '1.25rem', cursor: 'pointer', padding: 4, display: 'flex'
                }}
              >
                ☰
              </button>
            )}
            <h2 style={{ fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              {isMobile ? 'Admin Panel' : 'System Overview'}
            </h2>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <ThemeToggle />
          </div>
        </header>

        <section style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: isMobile ? '1rem' : '1.5rem',
          WebkitOverflowScrolling: 'touch' 
        }}>
          {children}
        </section>
      </main>
    </div>
  )
}
