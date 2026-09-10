<script setup lang="ts">
import UiBreadcrumb from '~/components/ui/Breadcrumb.vue'
import UiContainer from '~/components/ui/Container.vue'
import UiHeadingBlock from '~/components/ui/HeadingBlock.vue'

type ContainerSize = 'reading' | 'default' | 'wide' | 'full'
type HeadingLayout = 'centered' | 'split'
type HeadingSize = 'hero' | 'section' | 'subsection'
type HeadingAlign = 'center' | 'start'

interface BreadcrumbItem {
  label: string
  to?: string
  href?: string
}

const props = withDefaults(defineProps<{
  title?: string
  description?: string
  breadcrumbs?: BreadcrumbItem[]
  breadcrumbAriaLabel?: string
  containerSize?: ContainerSize
  headingLayout?: HeadingLayout
  headingSize?: HeadingSize
  headingAlign?: HeadingAlign
  showHeading?: boolean
}>(), {
  title: undefined,
  description: undefined,
  breadcrumbs: () => [],
  breadcrumbAriaLabel: 'Breadcrumb',
  containerSize: 'wide',
  headingLayout: 'split',
  headingSize: 'section',
  headingAlign: 'start',
  showHeading: true,
})

const slots = useSlots()
const hasHeading = computed(() => props.showHeading && Boolean(
  props.title
  || props.description
  || slots.title
  || slots.description
  || slots.actions,
))
</script>

<template>
  <UiContainer :size="containerSize" class="layout-page-shell">
    <div v-if="breadcrumbs.length || $slots.breadcrumb" class="layout-page-shell__breadcrumb">
      <slot name="breadcrumb">
        <UiBreadcrumb :items="breadcrumbs" :aria-label="breadcrumbAriaLabel" />
      </slot>
    </div>

    <UiHeadingBlock
      v-if="hasHeading"
      :layout="headingLayout"
      :size="headingSize"
      :align="headingAlign"
      class="layout-page-shell__heading"
    >
      <template v-if="title || $slots.title" #title>
        <slot name="title"><h1>{{ title }}</h1></slot>
      </template>
      <template v-if="description || $slots.description" #description>
        <slot name="description"><p>{{ description }}</p></slot>
      </template>
      <template v-if="$slots.actions" #aside>
        <div class="layout-page-shell__actions"><slot name="actions" /></div>
      </template>
    </UiHeadingBlock>

    <div v-if="$slots.navigation" class="layout-page-shell__navigation">
      <slot name="navigation" />
    </div>

    <div v-if="$slots.toolbar" class="layout-page-shell__toolbar">
      <slot name="toolbar" />
    </div>

    <div class="layout-page-shell__body"><slot /></div>

    <div v-if="$slots.footer" class="layout-page-shell__footer">
      <slot name="footer" />
    </div>
  </UiContainer>
</template>

<style scoped>
.layout-page-shell {
  padding-block: var(--ll-space-10) var(--ll-space-16);
}

.layout-page-shell__breadcrumb {
  margin-bottom: var(--ll-space-4);
}

.layout-page-shell__heading {
  margin-bottom: var(--layout-page-shell-heading-gap, var(--ll-space-8));
}

.layout-page-shell__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--ll-space-3);
}

.layout-page-shell__navigation {
  margin-bottom: var(--ll-space-8);
}

.layout-page-shell__toolbar {
  margin-bottom: var(--ll-space-10);
}

.layout-page-shell__body {
  min-width: 0;
}

@media (max-width: 48rem) {
  .layout-page-shell__actions {
    justify-content: flex-start;
  }
}
</style>
