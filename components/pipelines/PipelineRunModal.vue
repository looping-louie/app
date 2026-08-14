<script setup lang="ts">
import UiButton from '~/components/ui/Button.vue'
import UiModal from '~/components/ui/Modal.vue'
import UiTextField from '~/components/ui/TextField.vue'
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
const submitting = ref(false)
const error = ref('')

watch(() => props.open, (open) => {
  if (!open) return
  prompt.value = ''
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
    const run = await api.pipelines.createRun(props.pipelineId, {
      input: { prompt: initialPrompt },
    })
    emit('update:open', false)
    await router.push({ path: '/runs', query: { pipeline: props.pipelineId, run: run.id } })
  } catch (cause) {
    error.value = apiErrorMessage(cause, 'The pipeline could not be started. Please try again.')
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
    </form>

    <template #actions>
      <UiButton type="button" variant="secondary" :disabled="submitting" @click="close">Cancel</UiButton>
      <UiButton type="button" :disabled="!prompt.trim()" :loading="submitting" @click="submit">Run pipeline</UiButton>
    </template>
  </UiModal>
</template>

<style scoped>
.pipeline-run-form { display: grid; min-width: 0; }
</style>
