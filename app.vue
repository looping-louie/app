<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <UiNotificationViewport />
  </div>
</template>

<script setup lang="ts">
import UiNotificationViewport from '~/components/ui/NotificationViewport.vue'
</script>
