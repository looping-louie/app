<script setup lang="ts">
import UiDirectoryOption from '~/components/ui/DirectoryOption.vue'
import type { SkillSummary } from '~/types/api'
import { instructionCategoryLabels, instructionCategoryOptions } from '~/utils/instructionCategories'

const props = withDefaults(defineProps<{
  skill: SkillSummary
  modelValue: string[]
  disableHover?: boolean
}>(), {
  disableHover: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const categoryIcons = new Map(instructionCategoryOptions.map(option => [option.value, option.iconPath]))
const defaultIcon = 'M197.58,129.06,146,110l-19-51.62a15.92,15.92,0,0,0-29.88,0L78,110l-51.62,19a15.92,15.92,0,0,0,0,29.88L78,178l19,51.62a15.92,15.92,0,0,0,29.88,0L146,178l51.62-19a15.92,15.92,0,0,0,0-29.88Z'
const icon = computed(() => props.skill.category
  ? categoryIcons.get(props.skill.category) ?? defaultIcon
  : defaultIcon)
const area = computed(() => props.skill.category
  ? instructionCategoryLabels[props.skill.category]
  : 'Uncategorised')

function update(value: string | string[]) {
  if (Array.isArray(value)) emit('update:modelValue', value)
}
</script>

<template>
  <UiDirectoryOption
    class="instruction-skill-option"
    :class="{ 'instruction-skill-option--no-hover': disableHover }"
    :model-value="modelValue"
    :value="skill.id"
    :title="skill.name"
    :description="area"
    selection-type="checkbox"
    @update:model-value="update"
  >
    <template #media><svg viewBox="0 0 256 256" fill="currentColor"><path :d="icon" /></svg></template>
  </UiDirectoryOption>
</template>

<style scoped>
.instruction-skill-option { border-radius: var(--ll-radius-pill); }
.instruction-skill-option.ui-directory-option--selected { background: transparent; border-color: transparent; }
.instruction-skill-option:not(.instruction-skill-option--no-hover):hover,
.instruction-skill-option:not(.instruction-skill-option--no-hover):focus-within { background: var(--ll-color-card); border-color: var(--ll-color-divider); box-shadow: var(--ll-shadow-raised); }
.instruction-skill-option--no-hover:hover,
.instruction-skill-option--no-hover:focus-within { background: transparent; border-color: transparent; box-shadow: none; }
</style>
