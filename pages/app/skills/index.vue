<script setup lang="ts">
import UiCard from '~/components/ui/Card.vue'
import UiCatalogFilterBar from '~/components/ui/CatalogFilterBar.vue'
import UiContainer from '~/components/ui/Container.vue'
import UiGrid from '~/components/ui/Grid.vue'
import UiHeadingBlock from '~/components/ui/HeadingBlock.vue'
import UiSectionStage from '~/components/ui/SectionStage.vue'
import UiStatusText from '~/components/ui/StatusText.vue'

interface SkillSummary {
  id: string
  name: string
  description: string
  updated_at: string
  enabled: boolean
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
const skillStatus = ref('all')
const skillTasks = ref<string[]>([])
const skillSort = ref('alphabetical-asc')

const skillTaskOptions = [
  { value: 'coding', label: 'Coding' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'selling', label: 'Selling' },
  { value: 'writing', label: 'Writing' },
]

const { formatDate } = useDateTime()

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

    <UiCatalogFilterBar
      v-model:status="skillStatus"
      v-model:category="skillTasks"
      v-model:sort="skillSort"
      interactive
      :show-search="false"
      third-label="Task"
      third-icon="task"
      :third-options="skillTaskOptions"
      class="catalog-filters"
    />

    <div v-if="status === 'pending'" class="catalog-state" role="status">Loading skills…</div>
    <div v-else-if="error" class="catalog-state catalog-state--error" role="alert">
      <span>Skills could not be loaded.</span>
      <button type="button" @click="refresh">Retry</button>
    </div>
    <UiSectionStage v-else inverse="bottom" class="catalog-stage">
      <div v-if="skills.length === 0" class="catalog-state">No skills found.</div>
      <UiGrid v-else :columns="3" gap="md">
        <UiCard
          v-for="skill in skills"
          :key="skill.id"
          :to="`/app/skills/${skill.id}`"
          variant="editorial"
          accent-on-hover
          class="catalog-card"
        >
          <template #eyebrow>Engineering</template>
          <template #title>
            <h2>{{ skill.name }}</h2>
          </template>
          <template #description>
            <p>{{ skill.description }}</p>
          </template>
          <template #meta>
            <time :datetime="skill.updated_at">{{ formatDate(skill.updated_at) }}</time>
          </template>
          <template #trailing>
            <UiStatusText
              :tone="skill.enabled ? 'enabled' : 'disabled'"
              activation="card-hover"
            >
              {{ skill.enabled ? 'enabled' : 'disabled' }}
            </UiStatusText>
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
  margin-bottom: var(--ll-space-6);
}

.catalog-filters {
  margin-bottom: var(--ll-space-10);
}

.catalog-stage :deep(.ui-section-stage__shell) {
  width: 100%;
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
