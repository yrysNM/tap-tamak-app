import type { User, VerificationStatus } from '../types'

/** Main entry for an authenticated cook (verification vs dashboard). */
export function getCookHomePath(
  user: User | null,
  verificationStatus?: VerificationStatus | null
) {
  void user
  const status = verificationStatus ?? null
  if (status === 'APPROVED') {
    return '/cook/dashboard' as const
  }
  return '/cook/verify' as const
}
