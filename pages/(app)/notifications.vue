<script setup lang="ts">
import PageShell from '~/components/layout/PageShell.vue'
import UiAsyncStage from '~/components/ui/AsyncStage.vue'

definePageMeta({
  layout: 'app',
})

useHead({
  title: 'Notifications · Looping Louie',
})
</script>

<template>
  <PageShell
    title="Notifications"
    description="Review human gates, failed executions, and other items that need your attention."
  >
    <UiAsyncStage
      empty
      empty-label="You’re all caught up."
    />
  </PageShell>
</template>
