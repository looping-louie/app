<script setup lang="ts">
import UiCollectionGroupTitle from '~/components/ui/CollectionGroupTitle.vue'

type CollectionGroupTitleSurface = 'plain' | 'notched'

withDefaults(defineProps<{
  as?: string
  headingAs?: string
  title: string
  titleSurface?: CollectionGroupTitleSurface
}>(), {
  as: 'section',
  headingAs: 'h4',
  titleSurface: 'plain',
})
</script>

<template>
  <component
    :is="as"
    class="ui-collection-group"
    :class="`ui-collection-group--title-${titleSurface}`"
  >
    <UiCollectionGroupTitle
      v-if="titleSurface === 'notched'"
      :heading-as="headingAs"
      :title="title"
    >
      <slot name="title">{{ title }}</slot>
    </UiCollectionGroupTitle>
    <div v-else class="ui-collection-group__title-rail">
      <component :is="headingAs" class="ui-collection-group__title">
        <slot name="title">{{ title }}</slot>
      </component>
    </div>
    <div class="ui-collection-group__content"><slot /></div>
  </component>
</template>

<style scoped>
.ui-collection-group {
  display: grid;
  min-width: 0;
  align-content: start;
  gap: var(--ll-space-5);
  padding: 0;
  position: static;
  z-index: auto;
}

.ui-collection-group__title-rail {
  display: flex;
  min-width: 0;
  align-items: flex-end;
  justify-content: center;
}

.ui-collection-group__title {
  margin: 0;
  color: var(--ll-color-ink);
  font-size: var(--ll-text-sm);
  font-weight: 650;
  line-height: 1.25;
  text-align: center;
}

.ui-collection-group__content {
  display: grid;
  min-width: 0;
  gap: var(--ll-space-3);
}

.ui-collection-group--title-notched {
  --ui-collection-group-notch-size: 1.75rem;
  --ui-collection-group-title-height: 3.375rem;

  grid-template-rows: var(--ui-collection-group-title-height) minmax(0, 1fr);
  gap: 0;
}

.ui-collection-group--title-notched .ui-collection-group__content {
  padding-top: var(--ll-space-4);
}
</style>
