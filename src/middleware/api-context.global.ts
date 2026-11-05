export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuthSession()
  await auth.refresh()

  const isAuthenticationPage = to.path === '/login' || to.path === '/setup'

  if (auth.setupRequired.value) {
    if (to.path !== '/setup') return navigateTo('/setup')
    return
  }

  if (!auth.user.value) {
    if (!isAuthenticationPage) return navigateTo('/login')
    return
  }

  if (isAuthenticationPage) return navigateTo('/runs')
  if (to.meta.layout === false) return

  const projectContext = useProjectContext()
  await projectContext.initialize()
})
