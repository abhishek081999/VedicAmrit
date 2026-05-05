'use client'

import React from 'react'
import type { BhavaBalaResult } from '@/types/astrology'
import { BhavaBalaVisuals } from './BhavaBalaVisuals'

export function BhavaBalaTable({ bhavaBala, chart }: { bhavaBala: BhavaBalaResult, chart?: any }) {
  return <BhavaBalaVisuals bhavaBala={bhavaBala} chart={chart} />
}
