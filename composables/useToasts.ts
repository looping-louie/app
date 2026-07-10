export interface Toast {
  id: number
  message: string
  type: 'success' | 'error'
}

export function useToasts() {
  const toasts = ref<Toast[]>([])
  let nextId = 1

  function pushToast(message: string, type: 'success' | 'error' = 'success') {
    const id = nextId++
    toasts.value.push({ id, message, type })
    setTimeout(() => dismissToast(id), 5000)
  }

  function dismissToast(id: number) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  return {
    toasts,
    pushToast,
    dismissToast
  }
}
