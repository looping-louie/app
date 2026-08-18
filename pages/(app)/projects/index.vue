<script setup lang="ts">
import PageShell from '~/components/layout/PageShell.vue'
import UiAsyncStage from '~/components/ui/AsyncStage.vue'
import UiButton from '~/components/ui/Button.vue'
import UiCatalogFilterBar from '~/components/ui/CatalogFilterBar.vue'

definePageMeta({
  layout: 'app',
})

useHead({
  title: 'Projects · Looping Louie',
})
</script>

<template>
  <PageShell
    title="Projects"
    description="Organize shared work, teammates, and progress in one place."
  >
    <template #actions>
      <UiButton to="/projects/new" variant="primary">New project</UiButton>
    </template>

    <template #toolbar>
      <UiCatalogFilterBar
        third-label="Teammate"
        third-icon="user-circle"
      />
    </template>

    <UiAsyncStage
      empty
      empty-label="No projects yet."
    />
  </PageShell>
</template>
