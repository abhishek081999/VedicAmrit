'use client'
import React, { createContext, useContext, useState, useEffect, Dispatch, SetStateAction } from 'react'

interface AppLayoutContextType {
  isSidenavOpen: boolean
  setIsSidenavOpen: Dispatch<SetStateAction<boolean>>
  activeTab: string
  setActiveTab: Dispatch<SetStateAction<any>>
  language: 'en' | 'sa'
  setLanguage: Dispatch<SetStateAction<'en' | 'sa'>>
}

const AppLayoutContext = createContext<AppLayoutContextType | undefined>(undefined)

export function AppLayoutProvider({ children }: { children: React.ReactNode }) {
  const [isSidenavOpen, setIsSidenavOpen] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [language, setLanguage] = useState<'en' | 'sa'>('en')

  // Auto-close on small screens initially
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsSidenavOpen(false)
    }
    const saved = localStorage.getItem('vedaansh-lang')
    if (saved === 'en' || saved === 'sa') setLanguage(saved)
  }, [])

  useEffect(() => {
    localStorage.setItem('vedaansh-lang', language)
  }, [language])

  return (
    <AppLayoutContext.Provider value={{ isSidenavOpen, setIsSidenavOpen, activeTab, setActiveTab, language, setLanguage }}>
      {children}
    </AppLayoutContext.Provider>
  )
}

export function useAppLayout() {
  const context = useContext(AppLayoutContext)
  if (!context) throw new Error('useAppLayout must be used within AppLayoutProvider')
  return context
}
