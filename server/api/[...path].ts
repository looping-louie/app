import { getRequestURL, proxyRequest } from 'h3'

export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)
  const requestUrl = getRequestURL(event)
  const apiBaseUrl = config.apiBaseUrl.replace(/\/$/, '')

  return proxyRequest(event, `${apiBaseUrl}${requestUrl.pathname}${requestUrl.search}`)
})
