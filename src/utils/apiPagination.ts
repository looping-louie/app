import type { ApiListResponse } from '~/types/api'

export async function collectApiPages<T>(
  fetchPage: (offset: number) => Promise<ApiListResponse<T>>,
) {
  const items: T[] = []
  let total = 0
  do {
    const page = await fetchPage(items.length)
    items.push(...page.items)
    total = page.total
    if (!page.items.length) break
  } while (items.length < total)
  return items
}
