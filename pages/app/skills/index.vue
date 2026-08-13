<script setup lang="ts">
import CatalogShell from '~/components/catalog/CatalogShell.vue'
import UiButton from '~/components/ui/Button.vue'
import UiCard from '~/components/ui/Card.vue'
import UiCatalogFilterBar from '~/components/ui/CatalogFilterBar.vue'
import UiGrid from '~/components/ui/Grid.vue'
import UiStatusText from '~/components/ui/StatusText.vue'
import type { SkillCategory, SkillSort, SkillStatus } from '~/types/api'
import { instructionCategoryLabels, instructionCategoryOptions } from '~/utils/instructionCategories'

const api = useApiClient()
const router = useRouter()
const { searchQuery: skillSearchQuery, searchTerm: skillSearchTerm } = useCatalogSearch()
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
  search: skillSearchTerm.value || undefined,
}))

const { data, status, refresh } = await useAsyncData(
  'skills-catalog',
  () => api.skills.list(skillQuery.value),
  { watch: [skillQuery] },
)

const skills = computed(() => data.value?.items ?? [])
const skillTotal = computed(() => data.value?.total ?? 0)

watch([skillStatus, skillCategories, skillSort, skillSearchTerm], () => {
  skillOffset.value = 0
}, { deep: true })

const { formatDate } = useDateTime()
const skillIconPath = 'M197.58,129.06,146,110l-19-51.62a15.92,15.92,0,0,0-29.88,0L78,110l-51.62,19a15.92,15.92,0,0,0,0,29.88L78,178l19,51.62a15.92,15.92,0,0,0,29.88,0L146,178l51.62-19a15.92,15.92,0,0,0,0-29.88ZM137,164.22a8,8,0,0,0-4.74,4.74L112,223.85,91.78,169A8,8,0,0,0,87,164.22L32.15,144,87,123.78A8,8,0,0,0,91.78,119L112,64.15,132.22,119a8,8,0,0,0,4.74,4.74L191.85,144Z'
const skillSearchItems = computed(() => skills.value.map(skill => ({
  id: skill.id,
  label: skill.name,
  description: skill.description,
  group: 'Skills',
  keywords: skill.category ? [instructionCategoryLabels[skill.category]] : [],
  iconPath: skillIconPath,
})))

async function selectSkillSearchResult(item: { id: string }) {
  await router.push(`/app/skills/${encodeURIComponent(item.id)}`)
}

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
    <template #actions><UiButton to="/app/skills/new">Create new skill</UiButton></template>
    <template #filters>
      <UiCatalogFilterBar
        v-model:status="skillStatus"
        v-model:category="skillCategories"
        v-model:sort="skillSort"
        v-model:search="skillSearchQuery"
        interactive
        :search-items="skillSearchItems"
        search-placeholder="Search skills…"
        search-empty-title="No skills found"
        search-empty-description="Try another name, description, or area."
        third-label="Area"
        third-icon="department"
        :third-options="instructionCategoryOptions"
        @search-select="selectSkillSearchResult"
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
            {{ skill.category ? instructionCategoryLabels[skill.category] : 'Uncategorised' }}
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
