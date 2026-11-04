<script setup lang="ts">
import UiDirectoryOption from '~/components/ui/DirectoryOption.vue'
import type { InstructionCategory } from '~/types/api'
import { instructionCategoryOptions } from '~/utils/instructionCategories'

defineProps<{
  modelValue: InstructionCategory | ''
}>()

const emit = defineEmits<{
  'update:modelValue': [value: InstructionCategory]
}>()

const root = ref<HTMLElement | null>(null)

function select(value: string | string[]) {
  if (typeof value === 'string') emit('update:modelValue', value as InstructionCategory)
}

function focus() {
  root.value?.querySelector<HTMLInputElement>('input')?.focus()
}

defineExpose({ focus })
</script>

<template>
  <div ref="root" class="instruction-category-selector" role="radiogroup" aria-label="Category">
    <UiDirectoryOption
      v-for="option in instructionCategoryOptions"
      :key="option.value"
      :model-value="modelValue"
      :value="option.value"
      :title="option.label"
      :description="option.group"
      selection-type="radio"
      name="instruction-category"
      @update:model-value="select"
    >
      <template #media>
        <svg viewBox="0 0 256 256" fill="currentColor"><path :d="option.iconPath" /></svg>
      </template>
    </UiDirectoryOption>
  </div>
</template>

<style scoped>
.instruction-category-selector {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--ll-space-3);
}

.instruction-category-selector :deep(.ui-directory-option) {
  border-radius: var(--ll-radius-pill);
}

@media (max-width: 34rem) {
  .instruction-category-selector {
    grid-template-columns: 1fr;
  }
}
</style>
