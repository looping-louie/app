<script setup lang="ts">
import UiButton from '~/components/ui/Button.vue'
import UiPill from '~/components/ui/Pill.vue'

type Role = 'generator' | 'reviewer' | 'aggregator'

interface PreviewMember {
  id: string
  name: string
  icon: string
  model: string
  modelImage?: string
  modelInitials?: string
}

interface StopConditions {
  max_iterations: number | null
  max_tokens: number | null
  timeout_seconds: number | null
}

const props = withDefaults(defineProps<{
  title: string
  prompt: string
  flow: string
  generators: PreviewMember[]
  reviewers: PreviewMember[]
  aggregators: PreviewMember[]
  stopConditions?: StopConditions
  showStopConditions?: boolean
  variant?: 'aside' | 'review'
}>(), {
  stopConditions: undefined,
  showStopConditions: false,
  variant: 'aside',
})

const emit = defineEmits<{
  editBrief: []
  editFlow: []
  editStopConditions: []
  editRole: [role: Role]
  editModel: [role: Role, personaId: string]
  remove: [role: Role, personaId: string]
}>()

const groups = computed(() => [
  { role: 'generator' as const, label: 'Generators', empty: 'Choose who creates the first answer', members: props.generators },
  { role: 'reviewer' as const, label: 'Reviewers', empty: 'Optional quality check', members: props.reviewers },
  { role: 'aggregator' as const, label: 'Aggregator', empty: 'None selected', members: props.aggregators },
])

const flowLabel = computed(() => props.flow
  ? `${props.flow[0].toUpperCase()}${props.flow.slice(1)}`
  : 'Not selected')

const stopConditionValues = computed(() => {
  if (!props.stopConditions) return []
  return [
    props.stopConditions.max_iterations ? `${props.stopConditions.max_iterations.toLocaleString('en-US')} loops` : null,
    props.stopConditions.max_tokens ? `${props.stopConditions.max_tokens.toLocaleString('en-US')} tokens` : null,
    props.stopConditions.timeout_seconds ? `${props.stopConditions.timeout_seconds.toLocaleString('en-US')} seconds` : null,
  ].filter((value): value is string => Boolean(value))
})
</script>

<template>
  <aside class="loop-team-preview" :class="`loop-team-preview--${variant}`" aria-label="Loop summary">
    <span v-if="variant === 'aside'" class="loop-team-preview__eyebrow">Your loop</span>

    <button type="button" class="loop-team-preview__brief" aria-label="Edit loop brief" @click="emit('editBrief')">
      <h2>{{ title || 'Untitled loop' }}</h2>
      <p>{{ prompt || 'Your prompt will appear here.' }}</p>
    </button>

    <button type="button" class="loop-team-preview__summary-section" aria-label="Edit loop flow" @click="emit('editFlow')">
      <strong>Flow</strong>
      <span><UiPill>{{ flowLabel }}</UiPill></span>
    </button>

    <div class="loop-team-preview__route">
      <template v-for="(group, index) in groups" :key="group.role">
        <section>
          <button type="button" class="loop-team-preview__section-title" :aria-label="`Edit ${group.label.toLowerCase()}`" @click="emit('editRole', group.role)">
            <strong>{{ group.label }}</strong>
          </button>
          <ul v-if="group.members.length">
            <li v-for="member in group.members" :key="member.id" class="loop-team-preview__member">
              <button type="button" class="loop-team-preview__member-target" :aria-label="`Edit ${group.role} ${member.name}`" @click="emit('editRole', group.role)">
                <UiPill icon-style="circle">
                  <template #icon>
                    <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path :d="member.icon" /></svg>
                  </template>
                  {{ member.name }}
                </UiPill>
              </button>
              <span class="loop-team-preview__model-actions" :class="{ 'loop-team-preview__model-actions--empty': !member.model }">
                <button v-if="member.model" type="button" class="loop-team-preview__model-target" :aria-label="`Edit model ${member.model} for ${member.name}`" @click="emit('editModel', group.role, member.id)">
                  <UiPill v-if="member.modelImage" :src="member.modelImage" alt="" :tooltip="member.model" :focusable="false" />
                  <UiPill v-else icon-style="circle" :tooltip="member.model" :focusable="false">
                    <template #icon><span class="loop-team-preview__model-initials">{{ member.modelInitials }}</span></template>
                  </UiPill>
                </button>
                <UiButton class="loop-team-preview__remove" variant="coral" size="sm" icon-only :aria-label="`Remove ${group.role} ${member.name}`" @click="emit('remove', group.role, member.id)">
                  <template #leading>
                    <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z" /></svg>
                  </template>
                </UiButton>
              </span>
            </li>
          </ul>
          <button v-else type="button" class="loop-team-preview__empty" :aria-label="`Choose ${group.label.toLowerCase()}`" @click="emit('editRole', group.role)">{{ group.empty }}</button>
        </section>
        <i v-if="index < groups.length - 1" aria-hidden="true">↓</i>
      </template>
    </div>

    <i v-if="variant === 'aside'" class="loop-team-preview__connector" aria-hidden="true">↓</i>

    <button v-if="showStopConditions" type="button" class="loop-team-preview__summary-section" aria-label="Edit stop conditions" @click="emit('editStopConditions')">
      <strong>Stop conditions</strong>
      <span class="loop-team-preview__conditions">
        <template v-if="stopConditionValues.length">
          <span v-for="(condition, index) in stopConditionValues" :key="condition" class="loop-team-preview__condition">
            <UiPill>{{ condition }}</UiPill>
            <b v-if="index < stopConditionValues.length - 1" class="loop-team-preview__or">OR</b>
          </span>
        </template>
        <UiPill v-else>Not configured</UiPill>
      </span>
    </button>

    <i v-if="variant === 'aside' && showStopConditions" class="loop-team-preview__connector" aria-hidden="true">↓</i>

    <div v-if="variant === 'aside'" class="loop-team-preview__output" aria-label="Final output">
      <UiPill tooltip="Final output">
        <template #icon>
          <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M238.73,43.67A8,8,0,0,0,232,40H152a8,8,0,0,0-7.28,4.69L135.94,64H28a8,8,0,0,0-5.92,13.38L57.19,116,22.08,154.62A8,8,0,0,0,28,168h73.09a8,8,0,0,0,7.28-4.69L117.15,144h62.43l-34.86,76.69a8,8,0,1,0,14.56,6.62l80-176A8,8,0,0,0,238.73,43.67ZM95.94,152H46.08l27.84-30.62a8,8,0,0,0,0-10.76L46.08,80h82.59Zm90.91-24H124.42l32.73-72h62.43Z" /></svg>
        </template>
      </UiPill>
    </div>
  </aside>
</template>

<style scoped>
.loop-team-preview {
  position: sticky;
  z-index: 30;
  top: var(--ll-space-6);
  display: grid;
  gap: var(--ll-space-3);
  padding: var(--ll-space-6);
  background: var(--ll-color-metal-025);
  border: 1px solid var(--ll-color-divider);
  border-radius: var(--ll-radius-structural);
  box-shadow: var(--ll-shadow-raised);
}

.loop-team-preview--review {
  position: relative;
  top: auto;
  padding: 0;
  background: transparent;
  border: 0;
  border-radius: 0;
  box-shadow: none;
}

.loop-team-preview__eyebrow { color: var(--ll-color-primary); font: 600 var(--ll-text-xs) / 1 var(--ll-font-control); text-align: center; text-transform: uppercase; letter-spacing: 0.08em; }
.loop-team-preview__brief,
.loop-team-preview__summary-section,
.loop-team-preview__section-title,
.loop-team-preview__empty {
  padding: 0;
  color: inherit;
  background: transparent;
  border: 0;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.loop-team-preview__brief { display: grid; gap: var(--ll-space-3); padding: var(--ll-space-6) var(--ll-space-8); border-radius: var(--ll-radius-md); }
.loop-team-preview__brief h2 { margin: 0; color: var(--ll-color-ink); font: 600 1.2rem / 1.2 var(--ll-font-display); }
.loop-team-preview__brief p { display: -webkit-box; overflow: hidden; margin: 0; color: var(--ll-color-text-muted); font-size: var(--ll-text-sm); -webkit-box-orient: vertical; -webkit-line-clamp: 3; }
.loop-team-preview__summary-section { display: grid; min-width: 0; gap: var(--ll-space-3); padding: var(--ll-space-6) var(--ll-space-8); background: var(--ll-color-canvas); border: 1px solid var(--ll-color-divider); border-radius: var(--ll-radius-structural); }
.loop-team-preview__summary-section > span { display: flex; min-width: 0; }
.loop-team-preview__summary-section > span :deep(.ui-icon-pill) { max-width: 100%; }
.loop-team-preview__summary-section > span :deep(.ui-icon-pill__trigger) { max-width: 100%; }
.loop-team-preview__conditions { flex-wrap: wrap; align-items: center; gap: var(--ll-space-2) 0; }
.loop-team-preview__condition { display: inline-flex; min-width: 0; align-items: center; }
.loop-team-preview__or { margin-inline: var(--ll-space-3); color: var(--ll-color-text-muted); font: 600 var(--ll-text-xs) / 1 var(--ll-font-mono); }
.loop-team-preview__route { display: grid; justify-items: stretch; gap: var(--ll-space-2); }
.loop-team-preview__route > i { color: var(--ll-color-metal-500); font-style: normal; text-align: center; }
.loop-team-preview__connector { color: var(--ll-color-metal-500); font-style: normal; text-align: center; }
.loop-team-preview__route section { display: grid; gap: var(--ll-space-3); padding: var(--ll-space-6) var(--ll-space-8); background: var(--ll-color-canvas); border: 1px solid var(--ll-color-divider); border-radius: var(--ll-radius-structural); }
.loop-team-preview__summary-section strong,
.loop-team-preview__route strong { font: 600 var(--ll-text-xs) / 1 var(--ll-font-control); text-transform: uppercase; letter-spacing: 0.06em; }
.loop-team-preview__section-title { width: fit-content; border-radius: var(--ll-radius-sm); }
.loop-team-preview__empty { color: var(--ll-color-text-muted); font-size: var(--ll-text-xs); border-radius: var(--ll-radius-sm); }
.loop-team-preview ul { display: grid; gap: var(--ll-space-2); padding: 0; margin: 0; list-style: none; }
.loop-team-preview__member { display: flex; min-width: 0; align-items: center; gap: var(--ll-space-2); }
.loop-team-preview__member-target,
.loop-team-preview__model-target {
  display: block;
  min-width: 0;
  padding: 0;
  color: inherit;
  background: transparent;
  border: 0;
  font: inherit;
  cursor: pointer;
}
.loop-team-preview__member-target { flex: 0 1 auto; }
.loop-team-preview__member-target :deep(.ui-icon-pill__trigger) { max-width: 100%; }
.loop-team-preview__model-actions { position: relative; display: inline-block; width: 2rem; height: 2rem; flex: 0 0 2rem; }
.loop-team-preview__model-actions--empty { width: 0; flex-basis: 0; }
.loop-team-preview__brief:hover h2,
.loop-team-preview__brief:focus-visible h2,
.loop-team-preview__section-title:hover strong,
.loop-team-preview__section-title:focus-visible strong { color: var(--ll-color-primary); }
.loop-team-preview__brief:focus-visible,
.loop-team-preview__summary-section:focus-visible,
.loop-team-preview__section-title:focus-visible,
.loop-team-preview__empty:focus-visible,
.loop-team-preview__member-target:focus-visible,
.loop-team-preview__model-target:focus-visible { outline: 2px solid var(--ll-color-primary); outline-offset: 2px; }
.loop-team-preview__model-initials { font: 650 0.625rem / 1 var(--ll-font-mono); }
.loop-team-preview__remove { position: absolute; z-index: 2; top: 50%; left: calc(100% + var(--ll-space-2)); opacity: 0; transform: translateY(-50%); transition: opacity var(--ll-duration-fast) var(--ll-ease-out); }
.loop-team-preview__model-actions--empty .loop-team-preview__remove { left: 0; }
.loop-team-preview__member:hover .loop-team-preview__remove,
.loop-team-preview__remove:focus-visible { opacity: 1; }
.loop-team-preview__output { position: relative; z-index: 8; display: flex; justify-content: center; margin-block: var(--ll-space-1) calc(-1 * var(--ll-space-2)); }
.loop-team-preview__output :deep(.ui-icon-pill) { z-index: 8; }

@media (hover: none) {
  .loop-team-preview__remove { opacity: 1; }
}
</style>
