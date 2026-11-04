export type NotificationTone = 'success' | 'error'

export interface AppNotification {
  id: string
  tone: NotificationTone
  title: string
  description: string
}

export interface NotificationInput {
  tone: NotificationTone
  title: string
  description: string
  duration?: number
}

const notificationTimers = new Map<string, ReturnType<typeof setTimeout>>()
let notificationSequence = 0

export function useNotifications() {
  const notifications = useState<AppNotification[]>('ui-notifications', () => [])

  function dismiss(id: string) {
    const timer = notificationTimers.get(id)
    if (timer) clearTimeout(timer)
    notificationTimers.delete(id)
    notifications.value = notifications.value.filter(notification => notification.id !== id)
  }

  function notify(input: NotificationInput) {
    const id = `notification-${Date.now()}-${++notificationSequence}`
    const notification: AppNotification = {
      id,
      tone: input.tone,
      title: input.title,
      description: input.description,
    }

    notifications.value.slice(3).forEach(item => dismiss(item.id))
    notifications.value = [notification, ...notifications.value]

    const duration = input.duration ?? (input.tone === 'error' ? 8000 : 5000)
    if (import.meta.client && duration > 0) {
      notificationTimers.set(id, setTimeout(() => dismiss(id), duration))
    }

    return id
  }

  function success(title: string, description: string, duration?: number) {
    return notify({ tone: 'success', title, description, duration })
  }

  function error(title: string, description: string, duration?: number) {
    return notify({ tone: 'error', title, description, duration })
  }

  return {
    notifications: readonly(notifications),
    notify,
    success,
    error,
    dismiss,
  }
}
