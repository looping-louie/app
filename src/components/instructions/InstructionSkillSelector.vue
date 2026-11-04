<script setup lang="ts">
import InstructionSkillOption from '~/components/instructions/InstructionSkillOption.vue'
import UiTextField from '~/components/ui/TextField.vue'
import type { SkillSummary } from '~/types/api'
import { instructionCategoryLabels } from '~/utils/instructionCategories'

const props = defineProps<{
  skills: SkillSummary[]
  modelValue: string[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
  continue: []
}>()

const query = ref('')
const root = ref<HTMLElement | null>(null)
const searchField = ref<InstanceType<typeof UiTextField> | null>(null)

const filteredSkills = computed(() => {
  const search = query.value.trim().toLocaleLowerCase()
  if (!search) return props.skills
  return props.skills.filter(skill => [
    skill.name,
    skill.description,
    skillArea(skill.category),
  ].some(value => value.toLocaleLowerCase().includes(search)))
})

function skillArea(category: SkillSummary['category']) {
  return category ? instructionCategoryLabels[category] : 'Uncategorised'
}

function optionInputs() {
  if (!root.value) return []
  return [...root.value.querySelectorAll<HTMLInputElement>('.instruction-skill-selector__options input:not(:disabled)')]
}

async function updateSelection(value: string | string[]) {
  if (!Array.isArray(value)) return
  const addedSkill = value.some(id => !props.modelValue.includes(id))
  emit('update:modelValue', value)
  if (!addedSkill) return
  query.value = ''
  await nextTick()
  searchField.value?.focus()
}

function onKeydown(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
    event.preventDefault()
    emit('continue')
    return
  }

  const target = event.target
  if (!(target instanceof HTMLInputElement)) return
  const search = root.value?.querySelector<HTMLInputElement>('input[type="search"]')
  const options = optionInputs()
  const optionIndex = options.indexOf(target)

  if (event.key === 'Enter') {
    event.preventDefault()
    if (target === search) options[0]?.focus()
    else if (optionIndex >= 0) target.click()
  } else if (event.key === 'ArrowDown') {
    event.preventDefault()
    if (target === search) options[0]?.focus()
    else options[optionIndex + 1]?.focus()
  } else if (event.key === 'ArrowUp' && optionIndex >= 0) {
    event.preventDefault()
    if (optionIndex === 0) search?.focus()
    else options[optionIndex - 1]?.focus()
  }
}

async function resetAndFocus() {
  query.value = ''
  await nextTick()
  searchField.value?.focus()
}

defineExpose({ resetAndFocus })
</script>

<template>
  <div ref="root" class="instruction-skill-selector" @keydown="onKeydown">
    <UiTextField
      ref="searchField"
      v-model="query"
      type="search"
      label="Search skills"
      hide-label
      placeholder="Search skills…"
      hint="Use ↑ and ↓ to browse, Enter or Space to select, and Ctrl or Cmd + Enter to continue."
    />
    <div v-if="filteredSkills.length" class="instruction-skill-selector__options" aria-live="polite">
      <InstructionSkillOption
        v-for="skill in filteredSkills"
        :key="skill.id"
        :skill="skill"
        :model-value="modelValue"
        @update:model-value="updateSelection"
      />
    </div>
    <div v-else class="instruction-skill-selector__empty" role="status">No skills match “{{ query }}”.</div>
  </div>
</template>

<style scoped>
.instruction-skill-selector { display: grid; gap: var(--ll-space-5); }
.instruction-skill-selector__options { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--ll-space-3); }
.instruction-skill-selector__empty { display: grid; min-height: 10rem; place-items: center; color: var(--ll-color-text-muted); font-size: var(--ll-text-sm); }
@media (max-width: 34rem) { .instruction-skill-selector__options { grid-template-columns: 1fr; } }
</style>
