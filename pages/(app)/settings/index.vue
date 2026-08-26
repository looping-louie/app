<script setup lang="ts">
import type { Ref, ShallowRef } from 'vue'
import UiCollectionGroupTitle from '~/components/ui/CollectionGroupTitle.vue'
import UiGrid from '~/components/ui/Grid.vue'
import UiPill from '~/components/ui/Pill.vue'
import UiSectionStage from '~/components/ui/SectionStage.vue'
import UiTextField from '~/components/ui/TextField.vue'
import UiToggle from '~/components/ui/Toggle.vue'

interface ExecutionDefaultsForm {
  harness: string
  defaultBranch: string
  protectedBranches: string
  allowCommits: boolean
  allowPullRequests: boolean
  createRunBranches: boolean
  requireMergeApproval: boolean
}

interface SettingsNavigationState {
  dirty: Ref<boolean>
  saving: Ref<boolean>
  save: ShallowRef<(() => Promise<void> | void) | null>
}

const harnesses = [
  { id: 'codex', name: 'Codex', owner: 'OpenAI', image: '/images/harnesses/codex.webp' },
  { id: 'pi', name: 'Pi', owner: 'Badlogic', image: '/images/harnesses/pi.webp' },
  { id: 'cursor', name: 'Cursor', owner: 'SpaceX AI', image: '/images/harnesses/cursor.webp' },
  { id: 'copilot', name: 'Copilot', owner: 'Microsoft', image: '/images/harnesses/copilot.webp' },
  { id: 'claude', name: 'Claude', owner: 'Anthropic', image: '/images/harnesses/claude.webp' },
  { id: 'grok-build', name: 'Grok build', owner: 'SpaceXAI', image: '/images/harnesses/grok-build.webp' },
  { id: 'hermes', name: 'Hermes', owner: 'Nous Research', image: '/images/harnesses/hermes.webp' },
  { id: 'openclaw', name: 'OpenClaw', owner: 'OpenAI', image: '/images/harnesses/openclaw.webp' },
]

const initialDefaults: ExecutionDefaultsForm = {
  harness: 'codex',
  defaultBranch: 'main',
  protectedBranches: 'main, master',
  allowCommits: true,
  allowPullRequests: true,
  createRunBranches: true,
  requireMergeApproval: false,
}

const defaults = reactive<ExecutionDefaultsForm>({ ...initialDefaults })
const savedDefaults = ref<ExecutionDefaultsForm>({ ...initialDefaults })
const isDirty = computed(() => JSON.stringify(defaults) !== JSON.stringify(savedDefaults.value))
const settingsNavigation = inject<SettingsNavigationState>('settings-navigation')

async function saveDefaults() {
  if (!settingsNavigation || settingsNavigation.saving.value) return

  settingsNavigation.saving.value = true
  savedDefaults.value = { ...defaults }
  await nextTick()
  settingsNavigation.saving.value = false
}

if (settingsNavigation) {
  settingsNavigation.save.value = saveDefaults
  watch(isDirty, dirty => {
    settingsNavigation.dirty.value = dirty
  }, { immediate: true })

  onUnmounted(() => {
    if (settingsNavigation.save.value === saveDefaults) {
      settingsNavigation.dirty.value = false
      settingsNavigation.save.value = null
    }
  })
}

definePageMeta({
  pageTransition: false,
})

useHead({
  title: 'Settings · Looping Louie',
})
</script>

<template>
  <div class="global-configuration">
    <section class="configuration-section" aria-labelledby="default-harness-title">
      <UiCollectionGroupTitle
        id="default-harness-title"
        title="Default harness"
        heading-as="h2"
      />
      <UiSectionStage inverse="bottom">
        <UiGrid :columns="4" gap="md" class="harness-grid" role="radiogroup" aria-label="Default harness">
          <UiPill
            v-for="harness in harnesses"
            :key="harness.id"
            variant="selectable"
            icon-style="circle"
            :src="harness.image"
            alt=""
            :description="harness.owner"
            :selected="defaults.harness === harness.id"
            :aria-label="`Use ${harness.name} by ${harness.owner} as the default harness`"
            @click="defaults.harness = harness.id"
          >
            {{ harness.name }}
          </UiPill>
        </UiGrid>
      </UiSectionStage>
    </section>

    <section class="configuration-section" aria-labelledby="execution-defaults-title">
      <UiCollectionGroupTitle
        id="execution-defaults-title"
        title="Execution defaults"
        heading-as="h2"
      />
      <UiSectionStage inverse="both">
        <div class="execution-defaults">
          <div class="execution-defaults__row">
            <div class="execution-defaults__copy">
              <h3>Default branch</h3>
              <p>The branch new runs use when no branch is specified.</p>
            </div>
            <UiTextField
              v-model="defaults.defaultBranch"
              label="Default branch"
              hide-label
              placeholder="main"
              autocomplete="off"
            />
          </div>

          <div class="execution-defaults__row">
            <div class="execution-defaults__copy">
              <h3>Protected branches</h3>
              <p>Comma-separated branches that harnesses must not commit to directly.</p>
            </div>
            <UiTextField
              v-model="defaults.protectedBranches"
              label="Protected branches"
              hide-label
              placeholder="main, master"
              autocomplete="off"
            />
          </div>

          <div class="execution-defaults__toggle-grid">
            <div class="execution-defaults__toggle-option">
              <div class="execution-defaults__copy">
                <h3>Allow commits</h3>
                <p>Let harnesses create commits after an approved execution.</p>
              </div>
              <UiToggle v-model="defaults.allowCommits" aria-label="Allow commits" />
            </div>

            <div class="execution-defaults__toggle-option">
              <div class="execution-defaults__copy">
                <h3>Allow pull requests</h3>
                <p>Let harnesses open pull requests with their completed changes.</p>
              </div>
              <UiToggle v-model="defaults.allowPullRequests" aria-label="Allow pull requests" />
            </div>

            <div class="execution-defaults__toggle-option">
              <div class="execution-defaults__copy">
                <h3>Create a branch for every run</h3>
                <p>Keep each execution isolated from the default branch.</p>
              </div>
              <UiToggle v-model="defaults.createRunBranches" aria-label="Create a branch for every run" />
            </div>

            <div class="execution-defaults__toggle-option">
              <div class="execution-defaults__copy">
                <h3>Require approval before merge</h3>
                <p>Hold completed pull requests until a reviewer approves them.</p>
              </div>
              <UiToggle v-model="defaults.requireMergeApproval" aria-label="Require approval before merge" />
            </div>
          </div>
        </div>
      </UiSectionStage>
    </section>
  </div>
</template>

<style scoped>
.global-configuration {
  display: grid;
  gap: var(--ll-space-12);
}

.configuration-section {
  min-width: 0;
}

.configuration-section :deep(.ui-section-stage) {
  --ui-section-stage-shell-inset: 0rem;
}

.harness-grid {
  padding: var(--ll-space-2);
}

.execution-defaults {
  display: grid;
  padding: var(--ll-space-2);
}

.execution-defaults__row {
  display: grid;
  min-width: 0;
  min-height: 5.5rem;
  box-sizing: border-box;
  grid-template-columns: minmax(14rem, 1fr) minmax(16rem, 0.7fr);
  align-items: center;
  gap: var(--ll-space-8);
  padding: var(--ll-space-4) var(--ll-space-5);
  border-bottom: 1px solid var(--ll-color-divider);
}

.execution-defaults__row:last-child {
  border-bottom: 0;
}

.execution-defaults__toggle-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.execution-defaults__toggle-option {
  display: grid;
  min-width: 0;
  min-height: 6.5rem;
  box-sizing: border-box;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--ll-space-5);
  padding: var(--ll-space-4) var(--ll-space-5);
}

.execution-defaults__toggle-option:nth-child(even) {
  border-left: 1px solid var(--ll-color-divider);
}

.execution-defaults__toggle-option:nth-child(-n + 2) {
  border-bottom: 1px solid var(--ll-color-divider);
}

.execution-defaults__copy {
  display: grid;
  min-width: 0;
  gap: var(--ll-space-1);
}

.execution-defaults__copy h3,
.execution-defaults__copy p {
  margin: 0;
}

.execution-defaults__copy h3 {
  color: var(--ll-color-ink);
  font: 600 var(--ll-text-md) / 1.25 var(--ll-font-control);
}

.execution-defaults__copy p {
  color: var(--ll-color-text-muted);
  font: 400 var(--ll-text-sm) / 1.45 var(--ll-font-control);
}

@media (max-width: 44rem) {
  .execution-defaults__row {
    grid-template-columns: minmax(0, 1fr) auto;
    gap: var(--ll-space-3) var(--ll-space-5);
    padding-inline: var(--ll-space-3);
  }

  .execution-defaults__row > :deep(.ui-text-field) {
    grid-column: 1 / -1;
  }

  .execution-defaults__toggle-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .execution-defaults__toggle-option {
    min-height: 5.5rem;
    padding-inline: var(--ll-space-3);
    border-bottom: 1px solid var(--ll-color-divider);
  }

  .execution-defaults__toggle-option:nth-child(even) {
    border-left: 0;
  }

  .execution-defaults__toggle-option:last-child {
    border-bottom: 0;
  }
}
</style>
