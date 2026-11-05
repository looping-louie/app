<script setup lang="ts">
import PageShell from '~/components/layout/PageShell.vue'
import UiButton from '~/components/ui/Button.vue'
import UiSegmentedControl from '~/components/ui/SegmentedControl.vue'

type SettingsSection = 'global' | 'providers' | 'models' | 'mcps' | 'accounts' | 'tokens'

const props = withDefaults(defineProps<{
  showSave?: boolean
  saving?: boolean
}>(), {
  showSave: false,
  saving: false,
})

const emit = defineEmits<{ save: [] }>()

const route = useRoute()
const router = useRouter()
const auth = useAuthSession()

const sectionRoutes: Record<SettingsSection, string> = {
  global: '/settings',
  providers: '/settings/providers',
  models: '/settings/models',
  mcps: '/settings/mcps',
  accounts: '/settings/accounts',
  tokens: '/settings/tokens',
}

const sectionOptions = computed(() => [
  { value: 'global', label: 'Global configuration' },
  { value: 'providers', label: 'Providers' },
  { value: 'models', label: 'Models' },
  { value: 'mcps', label: 'MCPs' },
  { value: 'tokens', label: 'Personal tokens' },
  ...(auth.user.value?.role === 'admin'
    ? [{ value: 'accounts' as const, label: 'Accounts' }]
    : []),
])

function sectionFromPath(path: string): SettingsSection {
  if (path.startsWith(sectionRoutes.providers)) return 'providers'
  if (path.startsWith(sectionRoutes.models)) return 'models'
  if (path.startsWith(sectionRoutes.mcps)) return 'mcps'
  if (path.startsWith(sectionRoutes.accounts)) return 'accounts'
  if (path.startsWith(sectionRoutes.tokens)) return 'tokens'
  return 'global'
}

const activeSection = ref<SettingsSection>(sectionFromPath(route.path))
const section = computed({
  get: () => activeSection.value,
  set: (nextSection: SettingsSection) => {
    activeSection.value = nextSection
    const nextRoute = sectionRoutes[nextSection]
    if (route.path !== nextRoute) void router.push(nextRoute)
  },
})

watch(() => route.path, path => {
  activeSection.value = sectionFromPath(path)
})

onMounted(() => {
  void preloadRouteComponents(sectionRoutes.providers)
  void preloadRouteComponents(sectionRoutes.models)
  void preloadRouteComponents(sectionRoutes.mcps)
  void preloadRouteComponents(sectionRoutes.tokens)
  if (auth.user.value?.role === 'admin') {
    void preloadRouteComponents(sectionRoutes.accounts)
  }
})
</script>

<template>
  <PageShell title="Settings" class="settings-page">
    <template #navigation>
      <div class="settings-navigation">
        <UiSegmentedControl
          v-model="section"
          :options="sectionOptions"
          variant="inline"
          accent="metal"
          bordered-options
          aria-label="Settings section"
        />
        <UiButton v-if="showSave" :loading="saving" @click="emit('save')">Save defaults</UiButton>
      </div>
    </template>

    <div class="settings-panel"><slot /></div>
  </PageShell>
</template>

<style scoped>
.settings-navigation { display: flex; width: 100%; align-items: center; justify-content: space-between; gap: var(--ll-space-6); }
.settings-panel { min-height: 12rem; }
@media (max-width: 38rem) {
  .settings-navigation { flex-wrap: wrap; }
  .settings-page :deep(.ui-segmented-control--inline) { flex: 1 1 100%; width: auto; overflow-x: auto; }
  .settings-navigation :deep(.ui-button) { margin-left: auto; }
}
</style>