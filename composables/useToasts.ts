import type { Ref } from 'vue'

export interface Toast {
  id: number
  message: string
  type: 'success' | 'error'
}

const toasts: Ref<Toast[]> = ref([])
let nextId = 0

export function useToasts() {
  function pushToast(message: string, type: 'success' | 'error' = 'success') {
    const id = nextId++
    toasts.value.push({ id, message, type })
    setTimeout(() => {
      dismissToast(id)
    }, 5000)
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
