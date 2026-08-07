<script setup lang="ts">
import UiCard from '~/components/ui/Card.vue'
import UiContainer from '~/components/ui/Container.vue'
import UiGrid from '~/components/ui/Grid.vue'
import UiHeadingBlock from '~/components/ui/HeadingBlock.vue'
import UiSectionStage from '~/components/ui/SectionStage.vue'

interface SkillSummary {
  id: string
  name: string
  description: string
}

interface SkillListResponse {
  items: SkillSummary[]
  total: number
}

const { data, status, error, refresh } = await useAsyncData(
  'skills-catalog',
  () => $fetch<SkillListResponse>('/api/v1/skills'),
)

const skills = computed(() => data.value?.items ?? [])

definePageMeta({
  layout: 'app',
})

useHead({
  title: 'Skills · Looping Louie',
})
</script>

<template>
  <UiContainer size="wide" class="catalog-page">
    <UiHeadingBlock layout="split" size="section" align="start" class="catalog-heading">
      <template #title>
        <h1>Skills</h1>
      </template>
      <template #description>
        <p>Capabilities available to agents when they participate in a loop.</p>
      </template>
    </UiHeadingBlock>

    <div v-if="status === 'pending'" class="catalog-state" role="status">Loading skills…</div>
    <div v-else-if="error" class="catalog-state catalog-state--error" role="alert">
      <span>Skills could not be loaded.</span>
      <button type="button" @click="refresh">Retry</button>
    </div>
    <UiSectionStage v-else inverse="both">
      <div v-if="skills.length === 0" class="catalog-state">No skills found.</div>
      <UiGrid v-else :columns="2" gap="md">
        <UiCard
          v-for="skill in skills"
          :key="skill.id"
          variant="editorial"
          class="catalog-card"
        >
          <template #title>
            <h2>{{ skill.name }}</h2>
          </template>
          <template #description>
            <p>{{ skill.description }}</p>
          </template>
        </UiCard>
      </UiGrid>
    </UiSectionStage>
  </UiContainer>
</template>

<style scoped>
.catalog-page {
  padding-block: var(--ll-space-10) var(--ll-space-16);
}

.catalog-heading {
  margin-bottom: var(--ll-space-10);
}

.catalog-state {
  display: flex;
  min-height: 10rem;
  align-items: center;
  justify-content: center;
  gap: var(--ll-space-4);
  color: var(--ll-color-text-muted);
  background: var(--ll-color-section);
  border-radius: var(--ll-radius-structural);
  font-size: var(--ll-text-sm);
}

.catalog-state--error {
  color: var(--ll-color-brand-ink);
}

.catalog-state button {
  padding: var(--ll-space-2) var(--ll-space-4);
  color: var(--ll-color-ink);
  background: var(--ll-color-card);
  border: 1px solid var(--ll-color-divider);
  border-radius: var(--ll-radius-pill);
  cursor: pointer;
  font: 600 var(--ll-text-sm) / 1 var(--ll-font-control);
}

.catalog-card :deep(.ui-card__description p) {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 4;
}
</style>
