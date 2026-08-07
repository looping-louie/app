<script setup lang="ts">
import UiButton from '~/components/ui/Button.vue'
import UiContainer from '~/components/ui/Container.vue'
import UiHeadingBlock from '~/components/ui/HeadingBlock.vue'

interface PersonaDetail {
  id: string
  name: string
  description: string
  instructions: string
  skill_ids: string[]
}

const route = useRoute()
const personaId = computed(() => String(route.params.id))
const { formatMarkdown } = useMarkdown()

const { data: persona, status, error, refresh } = await useAsyncData(
  () => `persona-${personaId.value}`,
  () => $fetch<PersonaDetail>(`/api/v1/personas/${encodeURIComponent(personaId.value)}`),
)

const formattedInstructions = computed(() => formatMarkdown(
  persona.value?.instructions,
  { stripFirstHeading: true, stripFirstParagraph: true },
))

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
      <UiButton variant="stroke" size="sm" @click="refresh">Retry</UiButton>
    </div>
    <template v-else-if="persona">
      <UiHeadingBlock
        layout="centered"
        size="hero"
        eyebrow="Agents / Code"
        eyebrow-to="/app/personas"
        class="persona-heading"
      >
        <template #title>
          <h1>{{ persona.name }}</h1>
        </template>
        <template #description>
          <p>{{ persona.description }}</p>
        </template>
        <template #actions>
          <UiButton type="button">Editar</UiButton>
        </template>
      </UiHeadingBlock>

      <div class="persona-content">
        <div class="markdown-content" v-html="formattedInstructions" />

        <div v-if="persona.skill_ids.length" class="persona-skills" aria-label="Agent skills">
          <UiButton
            v-for="skillId in persona.skill_ids"
            :key="skillId"
            :to="`/app/skills/${skillId}`"
            variant="secondary"
            size="sm"
          >
            {{ skillId }}
          </UiButton>
        </div>
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

.persona-content {
  width: 100%;
  max-width: 48rem;
  margin-inline: auto;
}

.markdown-content {
  color: var(--ll-color-text);
  font-size: var(--ll-text-md);
  line-height: 1.75;
  text-align: left;
}

.markdown-content :deep(:is(h1, h2, h3, h4, h5, h6)) {
  margin: var(--ll-space-8) 0 var(--ll-space-3);
  color: var(--ll-color-ink);
  font-family: var(--ll-font-display);
  font-weight: 650;
  line-height: 1.2;
  letter-spacing: -0.025em;
}

.markdown-content :deep(:is(h1, h2):first-child) {
  margin-top: 0;
}

.markdown-content :deep(h1) {
  font-size: 1.75rem;
}

.markdown-content :deep(h2) {
  font-size: 1.375rem;
}

.markdown-content :deep(:is(h3, h4, h5, h6)) {
  font-size: 1.0625rem;
}

.markdown-content :deep(p) {
  margin: 0 0 var(--ll-space-4);
}

.markdown-content :deep(:is(ul, ol)) {
  margin: 0 0 var(--ll-space-5);
  padding-left: 1.5rem;
}

.markdown-content :deep(li + li) {
  margin-top: var(--ll-space-2);
}

.markdown-content :deep(:is(strong, code)) {
  color: var(--ll-color-ink);
}

.markdown-content :deep(code) {
  padding: 0.125rem 0.3rem;
  background: var(--ll-color-highlight);
  border-radius: 0.25rem;
  font: 500 0.88em / 1.4 var(--ll-font-mono);
}

.markdown-content :deep(pre) {
  overflow-x: auto;
  margin: 0 0 var(--ll-space-5);
  padding: var(--ll-space-4);
  color: var(--ll-color-ink);
  background: var(--ll-color-canvas);
  border: 1px solid var(--ll-color-divider);
  border-radius: 0.625rem;
}

.markdown-content :deep(pre code) {
  padding: 0;
  background: transparent;
}

.markdown-content :deep(a) {
  color: var(--ll-color-primary);
  text-underline-offset: 0.15em;
}

.markdown-content :deep(blockquote) {
  margin: 0 0 var(--ll-space-5);
  padding-left: var(--ll-space-4);
  color: var(--ll-color-text-muted);
  border-left: 3px solid var(--ll-color-primary);
}

.markdown-content :deep(hr) {
  margin: var(--ll-space-8) 0;
  border: 0;
  border-top: 1px solid var(--ll-color-divider);
}

.persona-skills {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ll-space-3);
  margin-top: var(--ll-space-8);
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
</style>
