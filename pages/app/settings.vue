<script setup lang="ts">
import UiContainer from '~/components/ui/Container.vue'
import UiSegmentedControl from '~/components/ui/SegmentedControl.vue'

type SettingsSection = 'global' | 'providers' | 'models'

const route = useRoute()
const router = useRouter()

const sectionRoutes: Record<SettingsSection, string> = {
  global: '/app/settings',
  providers: '/app/settings/providers',
  models: '/app/settings/models',
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
  <UiContainer size="wide" class="settings-page">
    <header class="settings-header">
      <h1>Settings</h1>
      <UiSegmentedControl
        v-model="section"
        :options="sectionOptions"
        variant="inline"
        accent="metal"
        bordered-options
        aria-label="Settings section"
      />
    </header>

    <div class="settings-panel">
      <NuxtPage :transition="false" keepalive />
    </div>
  </UiContainer>
</template>

<style scoped>
.settings-page {
  padding-block: var(--ll-space-10) var(--ll-space-16);
}

.settings-header {
  display: grid;
  gap: var(--ll-space-8);
}

.settings-header h1 {
  margin: 0;
  color: var(--ll-color-ink);
  font-family: var(--ll-font-display);
  font-size: clamp(2rem, 4vw, 3.25rem);
  font-weight: 620;
  line-height: 1.03;
  letter-spacing: -0.045em;
}

.settings-panel {
  min-height: 12rem;
  margin-top: var(--ll-space-10);
}

@media (max-width: 38rem) {
  .settings-page {
    padding-block-start: var(--ll-space-8);
  }

  .settings-header {
    gap: var(--ll-space-6);
  }

  .settings-header :deep(.ui-segmented-control--inline) {
    width: 100%;
    overflow-x: auto;
  }
}
</style>
