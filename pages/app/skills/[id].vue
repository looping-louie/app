<script setup lang="ts">
import UiButton from '~/components/ui/Button.vue'
import UiContainer from '~/components/ui/Container.vue'
import UiHeadingBlock from '~/components/ui/HeadingBlock.vue'

interface SkillDetail {
  id: string
  name: string
  description: string
  instructions: string
}

const route = useRoute()
const skillId = computed(() => String(route.params.id))
const { formatMarkdown } = useMarkdown()

const { data: skill, status, error, refresh } = await useAsyncData(
  () => `skill-${skillId.value}`,
  () => $fetch<SkillDetail>(`/api/v1/skills/${encodeURIComponent(skillId.value)}`),
)

const formattedInstructions = computed(() => formatMarkdown(
  skill.value?.instructions,
  { stripFirstHeading: true },
))

definePageMeta({
  layout: 'app',
})

useHead(() => ({
  title: skill.value
    ? `${skill.value.name} · Skills · Looping Louie`
    : 'Skill · Looping Louie',
}))
</script>

<template>
  <UiContainer size="wide" class="skill-page">
    <div v-if="status === 'pending'" class="skill-state" role="status">Loading skill…</div>
    <div v-else-if="error" class="skill-state skill-state--error" role="alert">
      <span>Skill could not be loaded.</span>
      <UiButton variant="stroke" size="sm" @click="refresh">Retry</UiButton>
    </div>
    <template v-else-if="skill">
      <UiHeadingBlock
        layout="centered"
        size="hero"
        eyebrow="Skills / Code"
        eyebrow-to="/app/skills"
        class="skill-heading"
      >
        <template #title>
          <h1>{{ skill.name }}</h1>
        </template>
        <template #description>
          <p>{{ skill.description }}</p>
        </template>
        <template #actions>
          <UiButton type="button">Editar</UiButton>
        </template>
      </UiHeadingBlock>

      <div class="skill-content">
        <h2 class="instructions-title">Instructions</h2>
        <div class="markdown-content" v-html="formattedInstructions" />
      </div>
    </template>
  </UiContainer>
</template>

<style scoped>
.skill-page {
  padding-block: var(--ll-space-10) var(--ll-space-16);
}

.skill-heading {
  margin-bottom: var(--ll-space-12);
}

.skill-content {
  width: 100%;
  max-width: 48rem;
  margin-inline: auto;
  text-align: left;
}

.instructions-title {
  margin: 0 0 var(--ll-space-6);
  color: var(--ll-color-text);
  font-size: 1.25rem;
  font-weight: 650;
  line-height: 1.15;
  letter-spacing: -0.025em;
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

.skill-state {
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

.skill-state--error {
  color: var(--ll-color-brand-ink);
}

@media (max-width: 38rem) {
  .skill-page {
    padding-block-start: var(--ll-space-8);
  }
}
</style>
