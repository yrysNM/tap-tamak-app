import { useAuthStore } from '../stores/auth'

export function useRedirectByRole() {
  const auth = useAuthStore()
  return () => navigateTo(auth.isCook ? '/cook/dashboard' : '/')
}
