import { getRequestURL, proxyRequest } from 'h3'

export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)
  const requestUrl = getRequestURL(event)
  const apiTarget = config.apiProxyTarget.replace(/\/$/, '')

  return proxyRequest(event, `${apiTarget}${requestUrl.pathname}${requestUrl.search}`)
})
