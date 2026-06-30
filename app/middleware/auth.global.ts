export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore()
  const { isAuthenticated, isCook, verificationStatus } = storeToRefs(authStore)
  const isCookRoute = to.path === '/cook' || to.path.startsWith('/cook/')

  const publicPaths = ['/login', '/register', '/forgot-password', '/role', '/legal/offer', '/legal/privacy', '/legal/terms']
  const legalPaths = ['/legal/offer', '/legal/privacy', '/legal/terms']
  const authOnlyPaths = ['/login', '/register', '/forgot-password', '/role']

  if (!isAuthenticated.value) {
    if (!publicPaths.includes(to.path)) {
      return navigateTo({
        path: '/login',
        query: { redirect: to.fullPath },
      })
    }
    return
  }

  const user = authStore.user
  const cookHome = getCookHomePath(user, verificationStatus.value)

  if (legalPaths.includes(to.path)) {
    return
  }

  if (authOnlyPaths.includes(to.path)) {
    return navigateTo(isCook.value ? cookHome : '/')
  }

  if (isCook.value) {
    if (!isCookRoute) {
      return navigateTo(cookHome)
    }

    const status = verificationStatus.value
    const onVerify = to.path === '/cook/verify'

    if (status !== 'APPROVED' && !onVerify) {
      return navigateTo('/cook/verify')
    }

    if (status === 'APPROVED' && onVerify) {
      return navigateTo('/cook/dashboard')
    }

    return
  }

  if (isCookRoute) {
    return navigateTo('/')
  }
})
