import type { UserPlan } from '@/types/astrology'

export const CHART_SAVE_LIMITS: Record<UserPlan, number> = {
  free: 20,
  gold: 200,
  platinum: Infinity,
}

export function getEffectivePlan(plan: string | null | undefined, planExpiresAt?: Date | string | null): UserPlan {
  const normalized: UserPlan = plan === 'gold' || plan === 'platinum' ? plan : 'free'
  if (normalized === 'free') return 'free'
  if (!planExpiresAt) return normalized
  const expiry = new Date(planExpiresAt)
  if (!Number.isFinite(expiry.getTime())) return normalized
  return expiry < new Date() ? 'free' : normalized
}

export function getChartSaveLimit(plan: string | null | undefined, planExpiresAt?: Date | string | null): number {
  const effectivePlan = getEffectivePlan(plan, planExpiresAt)
  return CHART_SAVE_LIMITS[effectivePlan]
}
