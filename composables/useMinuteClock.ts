export function useMinuteClock() {
  const now = ref(Date.now())
  let timer: ReturnType<typeof setInterval> | undefined

  onMounted(() => {
    timer = setInterval(() => {
      now.value = Date.now()
    }, 60_000)
  })

  onBeforeUnmount(() => {
    if (timer) clearInterval(timer)
  })

  return readonly(now)
}
