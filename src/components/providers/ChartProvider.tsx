'use client'
import React, { createContext, useContext, useState, Dispatch, SetStateAction } from 'react'
import type { ChartOutput } from '@/types/astrology'

interface ChartContextType {
  chart: ChartOutput | null
  setChart: Dispatch<SetStateAction<ChartOutput | null>>
  isFormOpen: boolean
  setIsFormOpen: Dispatch<SetStateAction<boolean>>
  pendingDestination: string | null
  setPendingDestination: Dispatch<SetStateAction<string | null>>
}

const ChartContext = createContext<ChartContextType | undefined>(undefined)

export function ChartProvider({ children }: { children: React.ReactNode }) {
  const [chart, setChart] = useState<ChartOutput | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [pendingDestination, setPendingDestination] = useState<string | null>(null)

  return (
    <ChartContext.Provider
      value={{
        chart,
        setChart,
        isFormOpen,
        setIsFormOpen,
        pendingDestination,
        setPendingDestination,
      }}
    >
      {children}
    </ChartContext.Provider>
  )
}

export function useChart() {
  const context = useContext(ChartContext)
  if (!context) throw new Error('useChart must be used within ChartProvider')
  return context
}
