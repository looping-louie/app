<script setup lang="ts">
import UiButton from '~/components/ui/Button.vue'
import UiCard from '~/components/ui/Card.vue'

type HumanGateKind = 'human-review' | 'multiple-choice-quiz'

withDefaults(defineProps<{
  title: string
  instanceId: string
  gate: HumanGateKind
  readonly?: boolean
  variant?: 'default' | 'compact'
}>(), {
  readonly: false,
  variant: 'default',
})

const emit = defineEmits<{
  remove: [instanceId: string]
}>()
</script>

<template>
  <article class="pipeline-human-gate-card" :class="`pipeline-human-gate-card--${variant}`">
    <UiButton
      v-if="!readonly"
      class="pipeline-human-gate-card__remove"
      variant="coral"
      size="sm"
      icon-only
      :aria-label="`Remove ${title}`"
      @click.stop="emit('remove', instanceId)"
    >
      <template #leading>
        <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
          <path d="M216,48H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM192,208H64V64H192ZM80,24a8,8,0,0,1,8-8h80a8,8,0,0,1,0,16H88A8,8,0,0,1,80,24Z" />
        </svg>
      </template>
    </UiButton>

    <UiCard variant="editorial" class="pipeline-human-gate-card__main">
      <template #eyebrow>HUMAN GATE</template>
      <template #title><h3>{{ title }}</h3></template>
      <template #description>
        <p>{{ gate === 'multiple-choice-quiz' ? 'One manual pass or fail decision' : 'One manual approval decision' }}</p>
      </template>
    </UiCard>
  </article>
</template>

<style scoped>
.pipeline-human-gate-card { position: relative; display: flex; width: 100%; min-height: 7.5rem; align-items: stretch; justify-content: center; }
.pipeline-human-gate-card__main { width: min(100%, 26rem); min-height: 7.5rem; transition: border-color var(--ll-duration-normal) var(--ll-ease-out), background var(--ll-duration-normal) var(--ll-ease-out), box-shadow var(--ll-duration-normal) var(--ll-ease-out); }
.pipeline-human-gate-card__main :deep(.ui-card__content) { justify-content: center; padding: var(--ll-space-5) var(--ll-space-6); }
.pipeline-human-gate-card--compact, .pipeline-human-gate-card--compact .pipeline-human-gate-card__main { min-height: 5rem; }
.pipeline-human-gate-card--compact .pipeline-human-gate-card__main :deep(.ui-card__content) { padding: var(--ll-space-3) var(--ll-space-4); }
.pipeline-human-gate-card--compact .pipeline-human-gate-card__main :deep(.ui-card__eyebrow) { margin-bottom: var(--ll-space-2); font-size: 0.625rem; }
.pipeline-human-gate-card--compact .pipeline-human-gate-card__main :deep(.ui-card__title h3) { font-size: 1rem; line-height: 1.2; }
.pipeline-human-gate-card--compact .pipeline-human-gate-card__main :deep(.ui-card__description) { margin-top: var(--ll-space-2); font-size: var(--ll-text-xs); line-height: 1.35; }
.pipeline-human-gate-card__remove { position: absolute; z-index: 3; top: 50%; right: calc(50% + 14rem); opacity: 0; pointer-events: none; transform: translate(0.5rem, -50%); transition: opacity var(--ll-duration-normal) var(--ll-ease-out), transform var(--ll-duration-normal) var(--ll-ease-out); }
.pipeline-human-gate-card:is(:hover, :focus-within) .pipeline-human-gate-card__main { background: var(--ll-color-card); border-color: var(--ll-color-divider); box-shadow: var(--ll-shadow-raised); }
.pipeline-human-gate-card:is(:hover, :focus-within) .pipeline-human-gate-card__remove { opacity: 1; pointer-events: auto; transform: translate(0, -50%); }

@media (max-width: 70rem) {
  .pipeline-human-gate-card__main { width: 100%; }
  .pipeline-human-gate-card__remove { top: var(--ll-space-3); right: var(--ll-space-3); transform: translateY(-0.25rem); }
  .pipeline-human-gate-card:is(:hover, :focus-within) .pipeline-human-gate-card__remove { transform: translateY(0); }
}

@media (hover: none) {
  .pipeline-human-gate-card__remove { opacity: 1; pointer-events: auto; }
}

@media (prefers-reduced-motion: reduce) {
  .pipeline-human-gate-card__main, .pipeline-human-gate-card__remove { transition: none; }
}
</style>
