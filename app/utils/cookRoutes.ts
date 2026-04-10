import type { User } from '../types'

/** Main entry for an authenticated cook (verification vs dashboard). */
export function getCookHomePath(user: User | null) {
  if (user?.cook?.verificationStatus === 'APPROVED') {
    return '/cook/dashboard' as const
  }
  return '/cook/verify' as const
}
