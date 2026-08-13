<script setup lang="ts">
const props = withDefaults(defineProps<{
  content?: string | null
  stripFirstHeading?: boolean
  stripFirstParagraph?: boolean
}>(), {
  content: '',
  stripFirstHeading: false,
  stripFirstParagraph: false,
})

const { formatMarkdown } = useMarkdown()
const renderedContent = computed(() => formatMarkdown(props.content, {
  stripFirstHeading: props.stripFirstHeading,
  stripFirstParagraph: props.stripFirstParagraph,
}))
</script>

<template>
  <div class="ui-markdown-content" v-html="renderedContent" />
</template>

<style scoped>
.ui-markdown-content {
  color: var(--ll-color-text);
  font-size: var(--ll-text-md);
  line-height: 1.75;
  text-align: left;
}

.ui-markdown-content :deep(:is(h1, h2, h3, h4, h5, h6)) {
  margin: var(--ll-space-8) 0 var(--ll-space-3);
  color: var(--ll-color-ink);
  font-family: var(--ll-font-display);
  font-weight: 650;
  line-height: 1.2;
  letter-spacing: -0.025em;
}

.ui-markdown-content :deep(:is(h1, h2):first-child) {
  margin-top: 0;
}

.ui-markdown-content :deep(h1) {
  font-size: 1.75rem;
}

.ui-markdown-content :deep(h2) {
  font-size: 1.375rem;
}

.ui-markdown-content :deep(:is(h3, h4, h5, h6)) {
  font-size: 1.0625rem;
}

.ui-markdown-content :deep(p) {
  margin: 0 0 var(--ll-space-4);
}

.ui-markdown-content :deep(:is(ul, ol)) {
  margin: 0 0 var(--ll-space-5);
  padding-left: 1.5rem;
}

.ui-markdown-content :deep(li + li) {
  margin-top: var(--ll-space-2);
}

.ui-markdown-content :deep(:is(strong, code)) {
  color: var(--ll-color-ink);
}

.ui-markdown-content :deep(code) {
  padding: 0.125rem 0.3rem;
  background: var(--ll-color-highlight);
  border-radius: 0.25rem;
  font: 500 0.88em / 1.4 var(--ll-font-mono);
}

.ui-markdown-content :deep(pre) {
  overflow-x: auto;
  margin: 0 0 var(--ll-space-5);
  padding: var(--ll-space-4);
  color: var(--ll-color-ink);
  background: var(--ll-color-canvas);
  border: 1px solid var(--ll-color-divider);
  border-radius: 0.625rem;
}

.ui-markdown-content :deep(pre code) {
  padding: 0;
  background: transparent;
}

.ui-markdown-content :deep(a) {
  color: var(--ll-color-primary);
  text-underline-offset: 0.15em;
}

.ui-markdown-content :deep(blockquote) {
  margin: 0 0 var(--ll-space-5);
  padding-left: var(--ll-space-4);
  color: var(--ll-color-text-muted);
  border-left: 3px solid var(--ll-color-primary);
}

.ui-markdown-content :deep(hr) {
  margin: var(--ll-space-8) 0;
  border: 0;
  border-top: 1px solid var(--ll-color-divider);
}
</style>
