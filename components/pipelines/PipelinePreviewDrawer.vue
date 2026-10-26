<script setup lang="ts">
import PipelineCanvas from '~/components/pipelines/PipelineCanvas.vue'
import UiAsyncStage from '~/components/ui/AsyncStage.vue'
import UiButton from '~/components/ui/Button.vue'
import UiDrawer from '~/components/ui/Drawer.vue'
import { apiErrorMessage } from '~/utils/api/errors'
import { pipelineCanvasActivities } from '~/utils/pipelineCanvas'

const props = defineProps<{
  open: boolean
  pipelineId: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const api = useApiClient()
const { data: pipeline, status, error, execute } = useAsyncData(
  () => `pipeline-preview-${props.pipelineId}`,
  () => api.pipelines.get(props.pipelineId),
  { immediate: false },
)
const selectedPipeline = computed(() => pipeline.value?.id === props.pipelineId ? pipeline.value : null)
const activities = computed(() => selectedPipeline.value ? pipelineCanvasActivities(selectedPipeline.value) : [])
const errorMessage = computed(() => apiErrorMessage(error.value, 'Pipeline could not be loaded.'))

watch(
  () => [props.open, props.pipelineId] as const,
  ([open, pipelineId]) => {
    if (!open || !pipelineId || pipeline.value?.id === pipelineId) return
    void execute()
  },
  { immediate: true },
)
</script>

<template>
  <UiDrawer
    :open="open"
    :title="selectedPipeline?.name || 'Pipeline details'"
    :description="selectedPipeline?.description || 'Inspect the pipeline used by this run.'"
    size="default"
    @update:open="emit('update:open', $event)"
  >
    <template #actions>
      <UiButton
        v-if="pipelineId"
        :to="`/pipelines/${encodeURIComponent(pipelineId)}`"
        variant="stroke"
        size="sm"
        icon-only
        aria-label="Open pipeline"
        title="Open pipeline"
      >
        <template #leading>
          <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
            <path d="M224,104a8,8,0,0,1-16,0V59.31l-98.34,98.35a8,8,0,0,1-11.32-11.32L196.69,48H152a8,8,0,0,1,0-16h64a8,8,0,0,1,8,8Zm-32,24a8,8,0,0,0-8,8v72H48V72h72a8,8,0,0,0,0-16H48A16,16,0,0,0,32,72V208a16,16,0,0,0,16,16H184a16,16,0,0,0,16-16V136A8,8,0,0,0,192,128Z" />
          </svg>
        </template>
      </UiButton>
    </template>

    <UiAsyncStage
      :status="status"
      loading-label="Loading pipeline…"
      :error-label="errorMessage"
      @retry="() => execute()"
    >
      <div v-if="selectedPipeline" class="pipeline-preview">
        <PipelineCanvas :activities="activities" readonly variant="compact" aria-label="Pipeline design" />
      </div>
    </UiAsyncStage>
  </UiDrawer>
</template>

<style scoped>
.pipeline-preview { min-width: 0; }
</style>
