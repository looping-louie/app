<script setup lang="ts">
import UiButton from '~/components/ui/Button.vue'
import UiModal from '~/components/ui/Modal.vue'
import UiSegmentedControl from '~/components/ui/SegmentedControl.vue'
import UiTextField from '~/components/ui/TextField.vue'
import type { PipelineRunCommitMode } from '~/types/api'
import { apiErrorMessage } from '~/utils/api/errors'

const props = defineProps<{
  open: boolean
  pipelineId: string
  pipelineName: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const router = useRouter()
const api = useApiClient()
const prompt = ref('')
const commitMode = ref<PipelineRunCommitMode>('allow')
const preparedRunId = ref('')
const submitting = ref(false)
const error = ref('')
const commitModeOptions = [
  { value: 'allow', label: 'Allow commit' },
  { value: 'forbid', label: 'Leave uncommitted' },
]

watch(() => props.open, (open) => {
  if (!open) return
  prompt.value = ''
  commitMode.value = 'allow'
  preparedRunId.value = ''
  error.value = ''
})

function close() {
  if (!submitting.value) emit('update:open', false)
}

async function submit() {
  const initialPrompt = prompt.value.trim()
  if (!initialPrompt || submitting.value) return
  submitting.value = true
  error.value = ''
  try {
    if (!preparedRunId.value) {
      const preparedRun = await api.pipelines.createRun(props.pipelineId, {
        input: initialPrompt,
        commit_mode: commitMode.value,
      })
      preparedRunId.value = preparedRun.id
    }
    const run = await api.pipelines.startRun(props.pipelineId, preparedRunId.value)
    emit('update:open', false)
    await router.push({ path: '/runs', query: { pipeline: props.pipelineId, run: run.id } })
  } catch (cause) {
    error.value = preparedRunId.value
      ? apiErrorMessage(cause, 'The run was prepared but could not be started. Try starting it again.')
      : apiErrorMessage(cause, 'The pipeline run could not be prepared. Please try again.')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <UiModal
    :open="open"
    title="Run pipeline"
    :description="`Give ${pipelineName} the initial context it needs to start.`"
    :close-on-backdrop="!submitting"
    show-close
    @update:open="emit('update:open', $event)"
  >
    <form class="pipeline-run-form" @submit.prevent="submit">
      <UiTextField
        v-model="prompt"
        label="Initial prompt"
        multiline
        :rows="7"
        required
        data-autofocus
        placeholder="Describe the outcome you want from this pipeline…"
        :error="error"
        @keydown.meta.enter.prevent="submit"
        @keydown.ctrl.enter.prevent="submit"
      />
      <fieldset class="pipeline-run-form__commit-mode" :disabled="submitting || Boolean(preparedRunId)">
        <legend>Repository changes</legend>
        <UiSegmentedControl
          v-model="commitMode"
          :options="commitModeOptions"
          aria-label="Repository commit policy"
        />
        <p>
          {{ commitMode === 'allow'
            ? 'Allow the runtime to commit successful changes.'
            : 'Apply successful changes without creating a commit.' }}
        </p>
      </fieldset>
    </form>

    <template #actions>
      <UiButton type="button" variant="secondary" :disabled="submitting" @click="close">Cancel</UiButton>
      <UiButton type="button" :disabled="!prompt.trim()" :loading="submitting" @click="submit">
        {{ preparedRunId ? 'Retry start' : 'Run pipeline' }}
      </UiButton>
    </template>
  </UiModal>
</template>

<style scoped>
.pipeline-run-form { display: grid; min-width: 0; gap: var(--ll-space-5); }
.pipeline-run-form__commit-mode { display: grid; gap: var(--ll-space-2); padding: 0; margin: 0; border: 0; }
.pipeline-run-form__commit-mode legend { margin-bottom: var(--ll-space-2); font-size: var(--ll-text-sm); font-weight: 650; }
.pipeline-run-form__commit-mode p { margin: 0; color: var(--ll-color-text-muted); font-size: var(--ll-text-xs); }
</style>
