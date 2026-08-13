<script setup lang="ts">
import CatalogShell from '~/components/catalog/CatalogShell.vue'
import UiCard from '~/components/ui/Card.vue'
import UiCatalogFilterBar from '~/components/ui/CatalogFilterBar.vue'
import UiGrid from '~/components/ui/Grid.vue'
import UiStatusText from '~/components/ui/StatusText.vue'
import type { SkillCategory, SkillSort, SkillStatus } from '~/types/api'

const api = useApiClient()
const skillStatus = ref('all')
const skillCategories = ref<SkillCategory[]>([])
const skillSort = ref<SkillSort>('alphabetical-asc')
const skillOffset = ref(0)
const skillPageSize = 12

const skillQuery = computed(() => ({
  offset: skillOffset.value,
  status: skillStatus.value === 'all' ? undefined : skillStatus.value as SkillStatus,
  category: skillCategories.value.length ? skillCategories.value : undefined,
  sort: skillSort.value,
}))

const { data, status, refresh } = await useAsyncData(
  'skills-catalog',
  () => api.skills.list(skillQuery.value),
  { watch: [skillQuery] },
)

const skills = computed(() => data.value?.items ?? [])
const skillTotal = computed(() => data.value?.total ?? 0)

const skillCategoryOptions: Array<{ value: SkillCategory; label: string; group: string }> = [
  { value: 'software_engineering', label: 'Software engineering', group: 'Engineering' },
  { value: 'quality_reliability', label: 'Quality & reliability', group: 'Engineering' },
  { value: 'security_privacy', label: 'Security & privacy', group: 'Engineering' },
  { value: 'data_ai', label: 'Data & AI', group: 'Engineering' },
  { value: 'content_brand', label: 'Content & brand', group: 'Marketing' },
  { value: 'growth_acquisition', label: 'Growth & acquisition', group: 'Marketing' },
  { value: 'research_analytics', label: 'Research & analytics', group: 'Marketing' },
  { value: 'product_discovery_strategy', label: 'Product discovery & strategy', group: 'Product & Design' },
  { value: 'product_design_ux', label: 'Product design & UX', group: 'Product & Design' },
  { value: 'delivery_planning', label: 'Delivery & planning', group: 'Product & Design' },
  { value: 'sales', label: 'Sales', group: 'Sales & Customer' },
  { value: 'customer_success_support', label: 'Customer success & support', group: 'Sales & Customer' },
]

const skillCategoryLabels = Object.fromEntries(
  skillCategoryOptions.map(option => [option.value, option.label]),
) as Record<SkillCategory, string>

watch([skillStatus, skillCategories, skillSort], () => {
  skillOffset.value = 0
}, { deep: true })

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
    v-model:pagination-offset="skillOffset"
    :pagination-total="skillTotal"
    :pagination-page-size="skillPageSize"
    loading-label="Loading skills…"
    error-label="Skills could not be loaded."
    empty-label="No skills found."
    @retry="refresh"
  >
    <template #filters>
      <UiCatalogFilterBar
        v-model:status="skillStatus"
        v-model:category="skillCategories"
        v-model:sort="skillSort"
        interactive
        :show-search="false"
        third-label="Area"
        third-icon="department"
        :third-options="skillCategoryOptions"
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
          <template #eyebrow>
            {{ skill.category ? skillCategoryLabels[skill.category] : 'Uncategorised' }}
          </template>
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
