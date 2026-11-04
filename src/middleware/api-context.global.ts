export default defineNuxtRouteMiddleware(async (to) => {
  if (to.meta.layout === false) return
  const projectContext = useProjectContext()
  await projectContext.initialize()
})
