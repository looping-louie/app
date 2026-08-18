<script setup lang="ts">
import PageShell from '~/components/layout/PageShell.vue'
import UiSegmentedControl from '~/components/ui/SegmentedControl.vue'

type SettingsSection = 'global' | 'providers' | 'models'

const route = useRoute()
const router = useRouter()

const sectionRoutes: Record<SettingsSection, string> = {
  global: '/settings',
  providers: '/settings/providers',
  models: '/settings/models',
}

const sectionOptions = [
  { value: 'global', label: 'Global configuration' },
  { value: 'providers', label: 'Providers' },
  { value: 'models', label: 'Models' },
]

function sectionFromPath(path: string): SettingsSection {
  if (path.startsWith(sectionRoutes.providers)) return 'providers'
  if (path.startsWith(sectionRoutes.models)) return 'models'
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
})

definePageMeta({
  layout: 'app',
  pageTransition: false,
})
</script>

<template>
  <PageShell title="Settings" class="settings-page">
    <template #navigation>
      <UiSegmentedControl
        v-model="section"
        :options="sectionOptions"
        variant="inline"
        accent="metal"
        bordered-options
        aria-label="Settings section"
      />
    </template>

    <div class="settings-panel">
      <NuxtPage :transition="false" keepalive />
    </div>
  </PageShell>
</template>

<style scoped>
.settings-panel {
  min-height: 12rem;
}

@media (max-width: 38rem) {
  .settings-page :deep(.ui-segmented-control--inline) {
    width: 100%;
    overflow-x: auto;
  }
}
</style>
