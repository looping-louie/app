<script setup lang="ts">
import PageShell from '~/components/layout/PageShell.vue'
import UiButton from '~/components/ui/Button.vue'
import UiSegmentedControl from '~/components/ui/SegmentedControl.vue'

type SettingsSection = 'global' | 'providers' | 'models' | 'mcps'

const route = useRoute()
const router = useRouter()

const sectionRoutes: Record<SettingsSection, string> = {
  global: '/settings',
  providers: '/settings/providers',
  models: '/settings/models',
  mcps: '/settings/mcps',
}

const sectionOptions = [
  { value: 'global', label: 'Global configuration' },
  { value: 'providers', label: 'Providers' },
  { value: 'models', label: 'Models' },
  { value: 'mcps', label: 'MCPs' },
]

function sectionFromPath(path: string): SettingsSection {
  if (path.startsWith(sectionRoutes.providers)) return 'providers'
  if (path.startsWith(sectionRoutes.models)) return 'models'
  if (path.startsWith(sectionRoutes.mcps)) return 'mcps'
  return 'global'
}

const activeSection = ref<SettingsSection>(sectionFromPath(route.path))
const settingsNavigationDirty = ref(false)
const settingsNavigationSaving = ref(false)
const settingsNavigationSave = shallowRef<(() => Promise<void> | void) | null>(null)

provide('settings-navigation', {
  dirty: settingsNavigationDirty,
  saving: settingsNavigationSaving,
  save: settingsNavigationSave,
})

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
})

async function saveGlobalDefaults() {
  await settingsNavigationSave.value?.()
}

definePageMeta({
  layout: 'app',
  pageTransition: false,
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
        <UiButton
          v-if="section === 'global' && settingsNavigationDirty"
          :loading="settingsNavigationSaving"
          @click="saveGlobalDefaults"
        >
          Save defaults
        </UiButton>
      </div>
    </template>

    <div class="settings-panel">
      <NuxtPage :transition="false" keepalive />
    </div>
  </PageShell>
</template>

<style scoped>
.settings-navigation {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: var(--ll-space-6);
}

.settings-panel {
  min-height: 12rem;
}

@media (max-width: 38rem) {
  .settings-navigation {
    flex-wrap: wrap;
  }

  .settings-page :deep(.ui-segmented-control--inline) {
    flex: 1 1 100%;
    width: auto;
    overflow-x: auto;
  }

  .settings-navigation :deep(.ui-button) {
    margin-left: auto;
  }
}
</style>
