export function useCatalogSearch(delay = 250) {
  const searchQuery = ref('')
  const searchTerm = ref('')
  let timer: ReturnType<typeof setTimeout> | undefined

  watch(searchQuery, (value) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      searchTerm.value = value.trim()
      timer = undefined
    }, delay)
  })

  onBeforeUnmount(() => {
    if (timer) clearTimeout(timer)
  })

  return {
    searchQuery,
    searchTerm,
  }
}
