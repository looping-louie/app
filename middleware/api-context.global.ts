export default defineNuxtRouteMiddleware(async (to) => {
  if (to.meta.layout === false) return
  const workspaceContext = useWorkspaceContext()
  await workspaceContext.initialize()
})
