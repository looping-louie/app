<script setup lang="ts">
import UiBreadcrumb from '~/components/ui/Breadcrumb.vue'
import UiButton from '~/components/ui/Button.vue'
import UiContainer from '~/components/ui/Container.vue'
import UiHeadingBlock from '~/components/ui/HeadingBlock.vue'
import UiMarkdownContent from '~/components/ui/MarkdownContent.vue'
import { entityActionMenuOptions } from '~/utils/entityActionMenu'

const route = useRoute()
const personaId = computed(() => String(route.params.id))
const { personaIcon } = usePersonaIcon()
const api = useApiClient()

const { data: persona, status, error, refresh } = await useAsyncData(
  () => `persona-${personaId.value}`,
  () => api.personas.get(personaId.value),
)

function skillLabel(skillId: string) {
  return skillId.replace('builtin:skill:', '')
}

definePageMeta({
  layout: 'app',
})

useHead(() => ({
  title: persona.value
    ? `${persona.value.name} · Agents · Looping Louie`
    : 'Agent · Looping Louie',
}))
</script>

<template>
  <UiContainer size="wide" class="persona-page">
    <div v-if="status === 'pending'" class="persona-state" role="status">Loading agent…</div>
    <div v-else-if="error" class="persona-state persona-state--error" role="alert">
      <span>Agent could not be loaded.</span>
      <UiButton variant="stroke" size="sm" @click="() => refresh()">Retry</UiButton>
    </div>
    <template v-else-if="persona">
      <UiBreadcrumb
        class="persona-breadcrumb"
        :items="[
          { label: 'Agents', to: '/app/personas' },
          { label: persona.name },
        ]"
      />

      <UiHeadingBlock
        layout="split"
        size="section"
        align="start"
        class="persona-heading"
      >
        <template #title>
          <h1>{{ persona.name }}</h1>
        </template>
        <template #description>
          <p>{{ persona.description }}</p>
        </template>
        <template #aside>
          <div class="persona-actions">
            <UiButton type="button">Edit</UiButton>
            <UiButton
              type="button"
              variant="secondary"
              dropdown
              dropdown-align="right"
              icon-only
              aria-label="More agent actions"
              dropdown-label="Agent actions"
              :options="entityActionMenuOptions"
            >
              <template #leading>
                <svg viewBox="0 0 256 256" fill="currentColor">
                  <circle cx="128" cy="56" r="12" />
                  <circle cx="128" cy="128" r="12" />
                  <circle cx="128" cy="200" r="12" />
                </svg>
              </template>
            </UiButton>
          </div>
        </template>
      </UiHeadingBlock>

      <div class="persona-content">
        <UiMarkdownContent
          :content="persona.instructions"
          strip-first-heading
          strip-first-paragraph
        />

        <aside class="persona-aside" aria-label="Agent details">
          <div class="persona-icon-card" role="img" :aria-label="`${persona.name} icon`">
            <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false">
              <path :d="personaIcon(persona)" />
            </svg>
          </div>

          <div v-if="persona.skill_ids.length" class="persona-skills" aria-labelledby="persona-skills-title">
            <h3 id="persona-skills-title">Skills:</h3>
            <div class="persona-skills__list">
              <UiButton
                v-for="skillId in persona.skill_ids"
                :key="skillId"
                :to="`/app/skills/${encodeURIComponent(skillId)}`"
                variant="secondary"
                size="sm"
              >
                {{ skillLabel(skillId) }}
              </UiButton>
            </div>
          </div>
        </aside>
      </div>
    </template>
  </UiContainer>
</template>

<style scoped>
.persona-page {
  padding-block: var(--ll-space-10) var(--ll-space-16);
}

.persona-heading {
  margin-bottom: var(--ll-space-12);
}

.persona-breadcrumb {
  margin-bottom: var(--ll-space-4);
}

.persona-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--ll-space-3);
}

.persona-content {
  display: grid;
  width: 100%;
  grid-template-columns: minmax(0, 48rem) minmax(12rem, 1fr);
  align-items: start;
  gap: clamp(2rem, 7vw, 7rem);
}

.persona-aside {
  position: sticky;
  top: var(--ll-space-6);
  display: flex;
  width: min(100%, 15.625rem);
  min-width: 0;
  flex-direction: column;
  justify-self: end;
  gap: var(--ll-space-6);
}

.persona-icon-card {
  display: grid;
  width: 100%;
  aspect-ratio: 4 / 3;
  box-sizing: border-box;
  place-items: center;
  color: var(--ll-color-primary-depth);
  background: var(--ll-color-highlight);
  border: 1px solid var(--ll-color-divider);
  border-radius: var(--ll-radius-structural);
}

.persona-icon-card svg {
  width: 5rem;
  height: 5rem;
}

.persona-skills {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--ll-space-4);
}

.persona-skills h3 {
  margin: 0;
  color: var(--ll-color-ink);
  font-family: var(--ll-font-display);
  font-size: var(--ll-text-lg);
  font-weight: 650;
  line-height: 1.2;
}

.persona-skills__list {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--ll-space-3);
}

.persona-state {
  display: flex;
  min-height: 14rem;
  align-items: center;
  justify-content: center;
  gap: var(--ll-space-4);
  color: var(--ll-color-text-muted);
  background: var(--ll-color-section);
  border-radius: var(--ll-radius-structural);
  font-size: var(--ll-text-sm);
}

.persona-state--error {
  color: var(--ll-color-brand-ink);
}

@media (max-width: 38rem) {
  .persona-page {
    padding-block-start: var(--ll-space-8);
  }
}

@media (max-width: 48rem) {
  .persona-content {
    grid-template-columns: minmax(0, 1fr);
  }

  .persona-actions {
    justify-content: flex-start;
  }

  .persona-aside {
    position: static;
    width: min(100%, 20rem);
    justify-self: start;
  }
}
</style>
