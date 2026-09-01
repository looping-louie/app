<script setup lang="ts">
import PipelineLoopSummary from '~/components/pipelines/PipelineLoopSummary.vue'
import UiButton from '~/components/ui/Button.vue'
import UiCard from '~/components/ui/Card.vue'

interface PipelineLoopAgent {
  model_id?: string | null
  persona_id: string
  role: string
}

interface PipelineLoopStopConditions {
  max_iterations?: number | null
  max_tokens?: number | null
  timeout_seconds?: number | null
}

interface PipelineLoop {
  id: string
  title: string
  flow: string | null
  model_id?: string | null
  agents: PipelineLoopAgent[]
  stop_conditions: PipelineLoopStopConditions | null
}

const props = withDefaults(defineProps<{
  loop: PipelineLoop
  instanceId: string
  readonly?: boolean
}>(), {
  readonly: false,
})

const emit = defineEmits<{
  remove: [instanceId: string]
}>()

const eyebrow = computed(() => `LOOP · ${(props.loop.flow || 'DRAFT').toUpperCase()}`)
</script>

<template>
  <article class="pipeline-loop-card">
    <UiButton
      v-if="!readonly"
      class="pipeline-loop-card__remove"
      variant="coral"
      size="sm"
      icon-only
      :aria-label="`Remove ${loop.title}`"
      @click.stop="emit('remove', instanceId)"
    >
      <template #leading>
        <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
          <path d="M216,48H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM192,208H64V64H192ZM80,24a8,8,0,0,1,8-8h80a8,8,0,0,1,0,16H88A8,8,0,0,1,80,24Z" />
        </svg>
      </template>
    </UiButton>

    <UiCard variant="editorial" class="pipeline-loop-card__main">
      <template #eyebrow>{{ eyebrow }}</template>
      <template #title><h3>{{ loop.title }}</h3></template>
      <template #description>
        <PipelineLoopSummary :loop="loop" :show-title="false" :show-flow="false" layout="team-stop" />
      </template>
    </UiCard>
  </article>
</template>

<style scoped>
.pipeline-loop-card {
  position: relative;
  display: flex;
  width: 100%;
  min-height: 7.5rem;
  align-items: stretch;
  justify-content: center;
  outline: none;
}

.pipeline-loop-card__main {
  width: min(100%, 32rem);
  min-height: 7.5rem;
  transition:
    border-color var(--ll-duration-normal) var(--ll-ease-out),
    background var(--ll-duration-normal) var(--ll-ease-out),
    box-shadow var(--ll-duration-normal) var(--ll-ease-out);
}

.pipeline-loop-card__main :deep(.ui-card__content) {
  justify-content: center;
  padding: var(--ll-space-5) var(--ll-space-6);
}

.pipeline-loop-card__main :deep(.ui-card__description) {
  width: 100%;
}

.pipeline-loop-card__remove {
  position: absolute;
  z-index: 3;
  top: 50%;
  right: calc(50% - 18rem);
  opacity: 0;
  transform: translate(0.5rem, -50%);
  transition:
    opacity var(--ll-duration-normal) var(--ll-ease-out),
    transform var(--ll-duration-normal) var(--ll-ease-out);
}

.pipeline-loop-card:is(:hover, :focus, :focus-within) .pipeline-loop-card__main {
  background: var(--ll-color-card);
  border-color: var(--ll-color-divider);
  box-shadow: var(--ll-shadow-raised);
}

.pipeline-loop-card:is(:hover, :focus, :focus-within) .pipeline-loop-card__remove {
  opacity: 1;
  pointer-events: auto;
  transform: translate(0, -50%);
}

.pipeline-loop-card:focus-visible .pipeline-loop-card__main {
  outline: 2px solid var(--ll-color-primary);
  outline-offset: 3px;
}

@media (max-width: 70rem) {
  .pipeline-loop-card {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--ll-space-3);
  }

  .pipeline-loop-card__main {
    position: static;
    width: 100%;
  }

  .pipeline-loop-card__remove {
    top: var(--ll-space-3);
    right: var(--ll-space-3);
    transform: translateY(-0.25rem);
  }

  .pipeline-loop-card:is(:hover, :focus, :focus-within) .pipeline-loop-card__remove {
    transform: translateY(0);
  }
}

@media (hover: none) {
  .pipeline-loop-card__remove {
    opacity: 1;
    pointer-events: auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  .pipeline-loop-card__main,
  .pipeline-loop-card__remove {
    transition: none;
  }
}
</style>
