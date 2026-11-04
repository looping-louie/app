<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <ClientOnly>
      <UiNotificationViewport />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import UiNotificationViewport from '~/components/ui/NotificationViewport.vue'
</script>
