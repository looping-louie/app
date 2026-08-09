<script setup lang="ts">
interface LoopAgent {
  model_id: string
  persona_id: string
}

interface LoopStopConditions {
  max_iterations?: number | null
  max_tokens?: number | null
  timeout_seconds?: number | null
}

const props = withDefaults(defineProps<{
  agents?: LoopAgent[]
  stopConditions?: LoopStopConditions | null
}>(), {
  agents: () => [],
  stopConditions: null,
})

const { personaIcon } = usePersonaIcon()
const { modelLogo } = useModelLogo()
const { formatLoopStopConditions } = useLoopStopConditions()

const uniqueModels = computed(() => (
  Array.from(new Set(props.agents.map(agent => agent.model_id).filter(Boolean)))
))

const stopCondition = computed(() => formatLoopStopConditions(props.stopConditions))

function personaLabel(personaId: string) {
  return personaId.replace(/^builtin:persona:/, '')
}
</script>

<template>
  <div class="loop-card-details">
    <div class="loop-card-details__group">
      <span class="loop-card-details__label">
        {{ uniqueModels.length }} {{ uniqueModels.length === 1 ? 'model' : 'models' }}
      </span>
      <div v-if="uniqueModels.length" class="loop-card-details__avatars" aria-label="Models used">
        <NuxtLink
          v-for="modelId in uniqueModels"
          :key="modelId"
          :to="`/app/settings/models/${encodeURIComponent(modelId)}`"
          class="loop-card-details__avatar loop-card-details__avatar--model"
          :aria-label="modelId"
        >
          <img :src="modelLogo(modelId)" alt="" aria-hidden="true">
          <span class="loop-card-details__tooltip" role="tooltip">{{ modelId }}</span>
        </NuxtLink>
      </div>
    </div>

    <div class="loop-card-details__group">
      <span class="loop-card-details__label">
        {{ agents.length }} {{ agents.length === 1 ? 'agent' : 'agents' }}
      </span>
      <div v-if="agents.length" class="loop-card-details__avatars" aria-label="Agents used">
        <NuxtLink
          v-for="(agent, index) in agents"
          :key="`${agent.persona_id}-${index}`"
          :to="`/app/personas/${encodeURIComponent(agent.persona_id)}`"
          class="loop-card-details__avatar loop-card-details__avatar--agent"
          :aria-label="personaLabel(agent.persona_id)"
        >
          <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false">
            <path :d="personaIcon({ id: agent.persona_id, source_instruction_id: agent.persona_id })" />
          </svg>
          <span class="loop-card-details__tooltip" role="tooltip">{{ personaLabel(agent.persona_id) }}</span>
        </NuxtLink>
      </div>
    </div>

    <div v-if="stopCondition" class="loop-card-details__stop">
      <span class="loop-card-details__label">Stop condition</span>
      <span class="loop-card-details__value">{{ stopCondition }}</span>
    </div>
  </div>
</template>

<style scoped>
.loop-card-details {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--ll-space-4);
  margin-top: var(--ll-space-5);
  padding-top: var(--ll-space-4);
  border-top: 1px solid var(--ll-color-divider);
}

.loop-card-details__group,
.loop-card-details__stop {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: var(--ll-space-2);
}

.loop-card-details__stop {
  grid-column: 1 / -1;
  flex-direction: row;
  align-items: baseline;
  gap: var(--ll-space-3);
}

.loop-card-details__label {
  color: var(--ll-color-text-faint);
  font: 550 var(--ll-text-xs) / 1.2 var(--ll-font-mono);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.loop-card-details__avatars {
  display: flex;
  min-height: 1.75rem;
  align-items: center;
  padding-left: 0.0625rem;
}

.loop-card-details__avatar {
  position: relative;
  display: grid;
  width: 1.75rem;
  height: 1.75rem;
  flex: none;
  place-items: center;
  color: var(--ll-color-ink);
  background: var(--ll-color-canvas);
  border: 1px solid var(--ll-color-divider);
  border-radius: 50%;
  box-shadow: 0 0 0 2px var(--ll-color-card);
  text-decoration: none;
}

.loop-card-details__avatar + .loop-card-details__avatar {
  margin-left: -0.375rem;
}

.loop-card-details__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.loop-card-details__avatar svg {
  width: 0.9375rem;
  height: 0.9375rem;
}

.loop-card-details__tooltip {
  position: absolute;
  z-index: 4;
  bottom: calc(100% + var(--ll-space-2));
  left: 50%;
  width: max-content;
  max-width: 15rem;
  padding: var(--ll-space-2) var(--ll-space-3);
  pointer-events: none;
  color: var(--ll-color-canvas);
  background: var(--ll-color-metal-950);
  border-radius: var(--ll-radius-pill);
  box-shadow: var(--ll-shadow-raised);
  font: 550 var(--ll-text-xs) / 1.2 var(--ll-font-control);
  opacity: 0;
  transform: translate(-50%, 0.25rem);
  transition:
    opacity var(--ll-duration-fast) var(--ll-ease-out),
    transform var(--ll-duration-fast) var(--ll-ease-out);
}

.loop-card-details__avatar:is(:hover, :focus-visible) .loop-card-details__tooltip {
  opacity: 1;
  transform: translate(-50%, 0);
}

.loop-card-details__avatar:focus-visible {
  outline: 2px solid var(--ll-color-primary);
  outline-offset: 2px;
}

.loop-card-details__value {
  min-width: 0;
  overflow: hidden;
  color: var(--ll-color-text-muted);
  font-size: var(--ll-text-xs);
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
