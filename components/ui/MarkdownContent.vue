<script setup lang="ts">
const props = withDefaults(defineProps<{
  content?: string | null
  stripFirstHeading?: boolean
  stripFirstParagraph?: boolean
  editable?: boolean
}>(), {
  content: '',
  stripFirstHeading: false,
  stripFirstParagraph: false,
  editable: false,
})

const emit = defineEmits<{
  change: []
}>()

const { formatMarkdown } = useMarkdown()
const root = ref<HTMLElement | null>(null)
const renderedContent = computed(() => formatMarkdown(props.content, {
  stripFirstHeading: props.stripFirstHeading,
  stripFirstParagraph: props.stripFirstParagraph,
}))

function inlineMarkdown(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? ''
  if (!(node instanceof HTMLElement)) return ''
  const content = [...node.childNodes].map(inlineMarkdown).join('')
  if (node.matches('strong, b')) return `**${content}**`
  if (node.matches('em, i')) return `*${content}*`
  if (node.matches('code') && node.parentElement?.tagName !== 'PRE') return `\`${content}\``
  if (node.matches('a')) return `[${content}](${node.getAttribute('href') ?? ''})`
  if (node.matches('br')) return '\n'
  return content
}

function blockMarkdown(element: HTMLElement): string {
  if (element.matches('h1, h2, h3, h4, h5, h6')) {
    return `${'#'.repeat(Number(element.tagName.slice(1)))} ${inlineMarkdown(element)}`
  }
  if (element.matches('ul, ol')) {
    return [...element.children].map((item, index) => (
      `${element.tagName === 'OL' ? `${index + 1}.` : '-'} ${inlineMarkdown(item)}`
    )).join('\n')
  }
  if (element.matches('blockquote')) return inlineMarkdown(element).split('\n').map(line => `> ${line}`).join('\n')
  if (element.matches('pre')) return `\`\`\`\n${element.textContent ?? ''}\n\`\`\``
  if (element.matches('hr')) return '---'
  return inlineMarkdown(element)
}

function readMarkdown() {
  if (!root.value) return props.content ?? ''
  return [...root.value.children]
    .map(child => blockMarkdown(child as HTMLElement).trim())
    .filter(Boolean)
    .join('\n\n')
}

defineExpose({ focus: () => root.value?.focus(), readMarkdown })
</script>

<template>
  <div
    ref="root"
    class="ui-markdown-content"
    :class="{ 'ui-markdown-content--editable': editable }"
    :contenteditable="editable ? 'true' : undefined"
    :role="editable ? 'textbox' : undefined"
    :aria-multiline="editable || undefined"
    :tabindex="editable ? 0 : undefined"
    v-html="renderedContent"
    @input="emit('change')"
  />
</template>

<style scoped>
.ui-markdown-content {
  color: var(--ll-color-text);
  font-size: var(--ll-text-md);
  line-height: 1.75;
  text-align: left;
}

.ui-markdown-content--editable { min-height: 12rem; border-radius: var(--ll-radius-sm); outline: 1px solid transparent; transition: outline-color var(--ll-duration-fast) var(--ll-ease-out), box-shadow var(--ll-duration-fast) var(--ll-ease-out); }
.ui-markdown-content--editable:hover { outline-color: var(--ll-color-divider); }
.ui-markdown-content--editable:focus { outline: 1px solid var(--ll-color-primary); box-shadow: 0 0 0 3px var(--ll-color-primary-highlight); }

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
