<script setup lang="ts">
import SettingsPageShell from '~/components/settings/SettingsPageShell.vue'
import UiAsyncStage from '~/components/ui/AsyncStage.vue'
import UiCatalogFilterBar from '~/components/ui/CatalogFilterBar.vue'
import UiGrid from '~/components/ui/Grid.vue'
import UiPagination from '~/components/ui/Pagination.vue'
import UiPill from '~/components/ui/Pill.vue'

interface McpOption {
  id: string
  name: string
  category: string
  logoSrc: string
}

const route = useRoute()
const router = useRouter()
const { searchQuery: mcpSearchQuery, searchTerm: mcpSearchTerm } = useCatalogSearch()
const mcpStatus = ref('all')
const mcpCategories = ref<string[]>([])
const mcpSort = ref('alphabetical-asc')
const mcpOffset = ref(0)
const mcpPageSize = 24
const mcpEnabledState = reactive<Record<string, boolean>>({})
const keyIconPath = 'M216.57,39.43A80,80,0,0,0,83.91,120.78L28.69,176A15.86,15.86,0,0,0,24,187.31V216a16,16,0,0,0,16,16H72a8,8,0,0,0,8-8V208H96a8,8,0,0,0,8-8V184h16a8,8,0,0,0,5.66-2.34l9.56-9.57A79.73,79.73,0,0,0,160,176h.1A80,80,0,0,0,216.57,39.43ZM224,98.1c-1.09,34.09-29.75,61.86-63.89,61.9H160a63.7,63.7,0,0,1-23.65-4.51,8,8,0,0,0-8.84,1.68L116.69,168H96a8,8,0,0,0-8,8v16H72a8,8,0,0,0-8,8v16H40V187.31l58.83-58.82a8,8,0,0,0,1.68-8.84A63.72,63.72,0,0,1,96,95.92c0-34.14,27.81-62.8,61.9-63.89A64,64,0,0,1,224,98.1ZM192,76a12,12,0,1,1-12-12A12,12,0,0,1,192,76Z'

const mcpOptions: McpOption[] = [
  { id: 'slack', name: 'Slack', category: 'Team conversations', logoSrc: 'https://cdn.simpleicons.org/slack/292F33' },
  { id: 'salesforce', name: 'Salesforce', category: 'Customer relationship management', logoSrc: 'https://cdn.simpleicons.org/salesforce/292F33' },
  { id: 'sharepoint', name: 'SharePoint', category: 'Project knowledge', logoSrc: 'https://cdn.simpleicons.org/microsoftsharepoint/292F33' },
  { id: 'google-drive', name: 'Google Drive', category: 'Shared files', logoSrc: 'https://cdn.simpleicons.org/googledrive/292F33' },
  { id: 'github', name: 'GitHub', category: 'Repository activity', logoSrc: 'https://cdn.simpleicons.org/github/292F33' },
  { id: 'jira', name: 'Jira', category: 'Issues and delivery', logoSrc: 'https://cdn.simpleicons.org/jira/292F33' },
]

const mcpStatusOptions = [
  { value: 'all', label: 'All' },
  { value: 'enabled', label: 'Enabled' },
  { value: 'disabled', label: 'Disabled' },
]

const mcpCategoryOptions = mcpOptions.map(mcp => ({
  value: mcp.category,
  label: mcp.category,
}))

const filteredMcps = computed(() => {
  const search = mcpSearchTerm.value.toLocaleLowerCase()
  const originalOrder = new Map(mcpOptions.map((mcp, index) => [mcp.id, index]))

  return mcpOptions
    .filter((mcp) => {
      const matchesSearch = !search || `${mcp.name} ${mcp.category}`.toLocaleLowerCase().includes(search)
      const matchesStatus = mcpStatus.value === 'all'
        || (mcpStatus.value === 'enabled' && mcpEnabled(mcp))
        || (mcpStatus.value === 'disabled' && !mcpEnabled(mcp))
      const matchesCategory = !mcpCategories.value.length || mcpCategories.value.includes(mcp.category)
      return matchesSearch && matchesStatus && matchesCategory
    })
    .sort((left, right) => {
      if (mcpSort.value === 'alphabetical-desc') return right.name.localeCompare(left.name)
      if (mcpSort.value === 'newest') return (originalOrder.get(right.id) ?? 0) - (originalOrder.get(left.id) ?? 0)
      if (mcpSort.value === 'oldest') return (originalOrder.get(left.id) ?? 0) - (originalOrder.get(right.id) ?? 0)
      return left.name.localeCompare(right.name)
    })
})
const visibleMcps = computed(() => filteredMcps.value.slice(mcpOffset.value, mcpOffset.value + mcpPageSize))
const mcpSearchItems = computed(() => mcpOptions.map(mcp => ({
  id: mcp.id,
  label: mcp.name,
  description: mcp.category,
  group: 'MCPs',
  keywords: [mcp.category],
  imageSrc: mcp.logoSrc,
  imageAlt: '',
})))

watch([mcpStatus, mcpCategories, mcpSort, mcpSearchTerm], () => {
  mcpOffset.value = 0
}, { deep: true })

function mcpEnabled(mcp: McpOption) {
  return mcpEnabledState[mcp.id] ?? false
}

function setMcpEnabled(mcp: McpOption, enabled: boolean) {
  mcpEnabledState[mcp.id] = enabled
}

function focusedMcpId() {
  const value = Array.isArray(route.query.mcp) ? route.query.mcp[0] : route.query.mcp
  return typeof value === 'string' ? value : ''
}

async function revealFocusedMcp() {
  const mcpId = focusedMcpId()
  if (!mcpId) return
  await nextTick()
  document.getElementById(`mcp-${mcpId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

watch([visibleMcps, () => route.query.mcp], () => void revealFocusedMcp(), { immediate: true })

async function selectMcpSearchResult(item: { id: string }) {
  await router.replace({
    query: {
      ...route.query,
      mcp: item.id,
    },
  })
}

definePageMeta({
  pageTransition: false,
})

useHead({
  title: 'MCPs · Settings · Looping Louie',
})
</script>

<template>
  <SettingsPageShell>
    <section aria-labelledby="mcps-heading">
    <h2 id="mcps-heading" class="visually-hidden">MCPs</h2>

    <UiCatalogFilterBar
      v-model:status="mcpStatus"
      v-model:category="mcpCategories"
      v-model:sort="mcpSort"
      v-model:search="mcpSearchQuery"
      interactive
      :search-items="mcpSearchItems"
      search-placeholder="Search MCPs…"
      search-empty-title="No MCPs found"
      search-empty-description="Try another MCP or category."
      :status-options="mcpStatusOptions"
      third-label="Categories"
      third-icon="department"
      :third-options="mcpCategoryOptions"
      class="mcps-filters"
      @search-select="selectMcpSearchResult"
    />

    <UiAsyncStage
      status="success"
      :empty="visibleMcps.length === 0"
      empty-label="No MCPs found."
    >
      <UiGrid :columns="3" gap="lg" class="mcps-grid">
        <UiPill
          v-for="mcp in visibleMcps"
          :id="`mcp-${mcp.id}`"
          :key="mcp.id"
          variant="catalog"
          :src="mcp.logoSrc"
          alt=""
          :description="mcp.category"
          toggle
          :toggle-value="mcpEnabled(mcp)"
          :toggle-label="`${mcpEnabled(mcp) ? 'Disconnect' : 'Connect'} ${mcp.name}`"
          :action-icon-path="keyIconPath"
          :action-label="`Configure credentials for ${mcp.name}`"
          action-visibility="always"
          class="mcp-item"
          :class="{ 'mcp-item--focused': focusedMcpId() === mcp.id }"
          @update:toggle-value="setMcpEnabled(mcp, $event)"
        >
          {{ mcp.name }}
        </UiPill>
      </UiGrid>
    </UiAsyncStage>

    <UiPagination
      v-if="filteredMcps.length > mcpPageSize"
      v-model:offset="mcpOffset"
      :total="filteredMcps.length"
      :page-size="mcpPageSize"
      aria-label="MCPs pagination"
    />
    </section>
  </SettingsPageShell>
</template>

<style scoped>
.mcps-filters {
  margin-bottom: var(--ll-space-10);
}

.mcps-grid { column-gap: var(--ll-space-20); }

.mcp-item {
  min-width: 0;
}

.mcp-item :deep(.ui-icon-pill__media--image) {
  background: var(--ll-color-metal-025);
}

.mcp-item :deep(.ui-icon-pill__media--image img) {
  box-sizing: border-box;
  padding: 0.55rem;
  object-fit: contain;
}

.mcp-item--focused {
  background: var(--ll-color-primary-highlight);
  border-color: var(--ll-color-primary);
  box-shadow: 0 0 0 3px var(--ll-color-primary-highlight);
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  margin: -1px;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
