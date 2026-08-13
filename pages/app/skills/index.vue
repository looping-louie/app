<script setup lang="ts">
import CatalogShell from '~/components/catalog/CatalogShell.vue'
import UiCard from '~/components/ui/Card.vue'
import UiCatalogFilterBar from '~/components/ui/CatalogFilterBar.vue'
import UiGrid from '~/components/ui/Grid.vue'
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

const { data, status, refresh } = await useAsyncData(
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
  <CatalogShell
    title="Skills"
    description="Capabilities available to agents when they participate in a loop."
    :status="status"
    :empty="skills.length === 0"
    loading-label="Loading skills…"
    error-label="Skills could not be loaded."
    empty-label="No skills found."
    @retry="refresh"
  >
    <template #filters>
      <UiCatalogFilterBar
        v-model:status="skillStatus"
        v-model:category="skillTasks"
        v-model:sort="skillSort"
        interactive
        :show-search="false"
        third-label="Task"
        third-icon="task"
        :third-options="skillTaskOptions"
      />
    </template>

    <UiGrid :columns="3" gap="md">
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
  </CatalogShell>
</template>

<style scoped>
.catalog-card :deep(.ui-card__description p) {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 4;
}
</style>
