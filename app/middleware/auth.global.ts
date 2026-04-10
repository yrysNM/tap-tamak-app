export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore()
  const { isAuthenticated, isCook } = storeToRefs(authStore)

  const authFlowPaths = ['/login', '/register', '/forgot-password', '/role']

  if (!isAuthenticated.value) {
    if (!authFlowPaths.includes(to.path)) {
      return navigateTo({
        path: '/login',
        query: { redirect: to.fullPath },
      })
    }
    return
  }

  const user = authStore.user
  const cookHome = getCookHomePath(user)

  if (authFlowPaths.includes(to.path)) {
    return navigateTo(isCook.value ? cookHome : '/')
  }

  if (isCook.value) {
    if (!to.path.startsWith('/cook')) {
      return navigateTo(cookHome)
    }

    const status = user?.cook?.verificationStatus
    const onVerify = to.path === '/cook/verify'

    if (status !== 'APPROVED' && !onVerify) {
      return navigateTo('/cook/verify')
    }

    if (status === 'APPROVED' && onVerify) {
      return navigateTo('/cook/dashboard')
    }

    return
  }

  if (to.path.startsWith('/cook')) {
    return navigateTo('/')
  }
})
