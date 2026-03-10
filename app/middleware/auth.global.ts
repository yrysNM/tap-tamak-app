import { useAuthStore } from '../stores/auth'

const PUBLIC_PATHS = ['/', '/login', '/register', '/role', '/forgot-password', '/cooks', '/dishes']

function isPublicRoute(path: string): boolean {
  if (PUBLIC_PATHS.includes(path)) return true
  if (path.startsWith('/cooks/') || path.startsWith('/dishes/')) return true
  return false
}

export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore()

  if (isPublicRoute(to.path)) {
    // Redirect authenticated users away from auth-only pages
    if (auth.isAuthenticated && ['/login', '/register', '/role'].includes(to.path)) {
      return navigateTo(auth.isCook ? '/cook/dashboard' : '/')
    }
    // Authenticated cook on home: send to cook dashboard
    if (to.path === '/' && auth.isAuthenticated && auth.isCook) {
      return navigateTo('/cook/dashboard')
    }
    return
  }

  if (!auth.isAuthenticated) {
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  }

  // Cook-only routes
  if (to.path.startsWith('/cook') && !auth.isCook) {
    return navigateTo('/')
  }
})
