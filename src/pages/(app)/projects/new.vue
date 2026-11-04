<script setup lang="ts">
import PageShell from '~/components/layout/PageShell.vue'
import UiButton from '~/components/ui/Button.vue'
import UiSectionStage from '~/components/ui/SectionStage.vue'
import UiTextField from '~/components/ui/TextField.vue'
import { apiErrorMessage } from '~/utils/api/errors'

const router = useRouter()
const { createProject } = useProjectContext()
const name = ref('')
const projectPath = ref('')
const creating = ref(false)
const error = ref('')

const normalizedName = computed(() => name.value.trim())
const normalizedPath = computed(() => projectPath.value.trim())
const pathIsAbsolute = computed(() => (
  normalizedPath.value.startsWith('/') || /^[A-Za-z]:[\\/]/.test(normalizedPath.value)
))
const canCreate = computed(() => Boolean(normalizedName.value && normalizedPath.value && pathIsAbsolute.value))

async function submit() {
  if (!canCreate.value || creating.value) return
  creating.value = true
  error.value = ''
  try {
    // TODO(api): persist the absolute checkout path when Project supports it.
    await createProject({ name: normalizedName.value })
    await router.push('/projects')
  } catch (cause) {
    error.value = apiErrorMessage(cause, 'The project could not be created. Please try again.')
  } finally {
    creating.value = false
  }
}

definePageMeta({ layout: 'app' })
useHead({ title: 'New project · Looping Louie' })
</script>

<template>
  <PageShell title="New project" description="Add a local checkout as an execution target." class="project-create-page">
    <UiSectionStage inverse="bottom">
      <form class="project-create" @submit.prevent="submit">
        <div class="project-create__fields">
          <UiTextField
            v-model="name"
            label="Name"
            required
            data-autofocus
            autocomplete="off"
            placeholder="Looping Louie"
          />
          <UiTextField
            v-model="projectPath"
            label="Project path"
            required
            autocomplete="off"
            spellcheck="false"
            placeholder="/home/jadraque/Documents/source/looping-louie"
            :error="normalizedPath && !pathIsAbsolute ? 'Enter an absolute local path.' : undefined"
            hint="Path persistence requires API support. For now, only the project name will be saved."
          />
        </div>
        <p v-if="error" class="project-create__error" role="alert">{{ error }}</p>
        <div class="project-create__actions">
          <UiButton to="/projects" variant="secondary">Cancel</UiButton>
          <UiButton type="submit" :disabled="!canCreate" :loading="creating">Create project</UiButton>
        </div>
      </form>
    </UiSectionStage>
  </PageShell>
</template>

<style scoped>
.project-create { display: grid; max-width: 52rem; gap: var(--ll-space-6); padding: var(--ll-space-6); }
.project-create__fields { display: grid; gap: var(--ll-space-5); }
.project-create__actions { display: flex; justify-content: flex-end; gap: var(--ll-space-3); }
.project-create__error { margin: 0; color: var(--ll-color-brand-ink); font-size: var(--ll-text-sm); }
@media (max-width: 36rem) { .project-create__actions { align-items: stretch; flex-direction: column-reverse; } }
</style>
