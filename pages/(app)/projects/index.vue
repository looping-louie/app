<script setup lang="ts">
import PageShell from '~/components/layout/PageShell.vue'
import UiAsyncStage from '~/components/ui/AsyncStage.vue'
import UiButton from '~/components/ui/Button.vue'
import UiCard from '~/components/ui/Card.vue'

const { error, initialize, projects, status } = useProjectContext()

definePageMeta({ layout: 'app' })
useHead({ title: 'Projects · Looping Louie' })
</script>

<template>
  <PageShell title="Projects" description="Choose where Looping Louie applies each pipeline run.">
    <template #actions>
      <UiButton to="/projects/new" variant="primary">New project</UiButton>
    </template>

    <UiAsyncStage
      :status="status"
      :empty="status === 'success' && !projects.length"
      :error-label="error"
      empty-label="No projects yet. Add the first execution target."
      @retry="initialize(true)"
    >
      <div class="project-list">
        <UiCard
          v-for="project in projects"
          :key="project.id"
          :to="`/projects/${project.id}`"
          accent-on-hover
          variant="row"
        >
          <template #title><h2>{{ project.name }}</h2></template>
          <template #meta><code>{{ project.id }}</code></template>
        </UiCard>
      </div>
    </UiAsyncStage>
  </PageShell>
</template>

<style scoped>
.project-list { display: grid; gap: var(--ll-space-3); padding: var(--ll-space-4); }
.project-list code { color: var(--ll-color-text-faint); font: 400 var(--ll-text-xs) / 1.4 var(--ll-font-mono); }
</style>
