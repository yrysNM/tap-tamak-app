import { useAuthStore } from '../stores/auth'

const PUBLIC_PATHS = ['/', '/login', '/register', '/forgot-password', '/cooks', '/dishes']

function isPublicRoute(path: string): boolean {
  if (PUBLIC_PATHS.includes(path)) return true
  if (path === '/cooks' || path === '/') return true
  if (path.startsWith('/cooks/') || path.startsWith('/dishes/')) return true
  return false
}

function isCookRoute(path: string): boolean {
  return path.startsWith('/cook')
}

export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore()
  const redirectTo = useState<string>('redirectTo', () => '/')

  if (isPublicRoute(to.path)) {
    if (to.path === '/login' && authStore.isAuthenticated) {
      const queryRedirect = to.query.redirect as string | undefined
      const target = redirectTo.value || queryRedirect || '/'
      redirectTo.value = '/'
      return navigateTo(target)
    }
    return
  }

  if (!authStore.isAuthenticated) {
    redirectTo.value = to.fullPath || '/'
    return navigateTo({
      path: '/login',
      query: { redirect: to.fullPath },
    })
  }

  if (isCookRoute(to.path) && authStore.user?.role !== 'COOK') {
    return navigateTo('/')
  }
})

