<script setup lang="ts">
import UiButton from '~/components/ui/Button.vue'
import UiCommandPalette from '~/components/ui/CommandPalette.vue'
import type { SkillSummary } from '~/types/api'
import { instructionCategoryLabels, instructionCategoryOptions } from '~/utils/instructionCategories'

interface SkillPaletteItem {
  id: string
  label: string
  description?: string
  group?: string
  keywords?: string[]
  iconPath?: string
  disabled?: boolean
}

const props = defineProps<{
  skillIds: string[]
  skills: SkillSummary[]
  editing: boolean
}>()

const emit = defineEmits<{
  'update:skillIds': [value: string[]]
}>()

const paletteOpen = ref(false)
const paletteQuery = ref('')
const skillsById = computed(() => new Map(props.skills.map(skill => [skill.id, skill])))
const categoryIcons = new Map(instructionCategoryOptions.map(option => [option.value, option.iconPath]))
const defaultIcon = 'M197.58,129.06,146,110l-19-51.62a15.92,15.92,0,0,0-29.88,0L78,110l-51.62,19a15.92,15.92,0,0,0,0,29.88L78,178l19,51.62a15.92,15.92,0,0,0,29.88,0L146,178l51.62-19a15.92,15.92,0,0,0,0-29.88Z'

const paletteItems = computed<SkillPaletteItem[]>(() => props.skills.map(skill => ({
  id: skill.id,
  label: skill.name,
  description: skill.category ? instructionCategoryLabels[skill.category] : 'Uncategorised',
  group: 'Skills',
  keywords: [skill.description, skill.id],
  iconPath: skill.category ? categoryIcons.get(skill.category) ?? defaultIcon : defaultIcon,
  disabled: props.skillIds.includes(skill.id),
})))

function skillLabel(skillId: string) {
  return skillsById.value.get(skillId)?.name ?? skillId.replace('builtin:skill:', '')
}

function removeSkill(skillId: string) {
  emit('update:skillIds', props.skillIds.filter(id => id !== skillId))
}

function openPalette() {
  paletteQuery.value = ''
  paletteOpen.value = true
}

function addSkill(item: SkillPaletteItem) {
  if (!item.disabled && !props.skillIds.includes(item.id)) emit('update:skillIds', [...props.skillIds, item.id])
}
</script>

<template>
  <div class="persona-skills-editor" aria-labelledby="persona-skills-title">
    <h3 id="persona-skills-title">Skills:</h3>
    <ul class="persona-skills-editor__list">
      <li v-for="skillId in skillIds" :key="skillId">
        <UiButton :to="editing ? undefined : `/app/skills/${encodeURIComponent(skillId)}`" variant="secondary" size="sm">
          {{ skillLabel(skillId) }}
        </UiButton>
        <span v-if="editing" class="persona-skills-editor__remove-control">
          <UiButton class="persona-skills-editor__remove" variant="coral" size="sm" icon-only :aria-label="`Delete ${skillLabel(skillId)}`" @click="removeSkill(skillId)">
            <template #leading><svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M216,48H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM192,208H64V64H192ZM80,24a8,8,0,0,1,8-8h80a8,8,0,0,1,0,16H88A8,8,0,0,1,80,24Z" /></svg></template>
          </UiButton>
          <span class="persona-skills-editor__remove-tooltip" role="tooltip">Delete</span>
        </span>
      </li>
      <li v-if="editing">
        <UiButton variant="secondary" size="sm" icon-only aria-label="Add a skill" :disabled="!skills.length" @click="openPalette">
          <template #leading><svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M216,120H136V40a8,8,0,0,0-16,0v80H40a8,8,0,0,0,0,16h80v80a8,8,0,0,0,16,0V136h80a8,8,0,0,0,0-16Z" /></svg></template>
        </UiButton>
      </li>
    </ul>

    <UiCommandPalette
      v-model:open="paletteOpen"
      v-model:query="paletteQuery"
      :items="paletteItems"
      :keyboard-shortcut="false"
      option-style="card"
      placeholder="Search skills…"
      aria-label="Add a skill"
      empty-title="No skills found"
      empty-description="Try another name, description, or category."
      @select="addSkill"
    />
  </div>
</template>

<style scoped>
.persona-skills-editor { display: flex; min-width: 0; flex-direction: column; align-items: flex-start; gap: var(--ll-space-4); }
.persona-skills-editor h3 { margin: 0; color: var(--ll-color-ink); font: 650 var(--ll-text-lg) / 1.2 var(--ll-font-display); }
.persona-skills-editor__list { display: flex; padding: 0; margin: 0; flex-direction: column; align-items: flex-start; gap: var(--ll-space-3); list-style: none; }
.persona-skills-editor__list li { display: flex; min-width: 0; align-items: center; gap: var(--ll-space-2); }
.persona-skills-editor__remove-control { position: relative; display: block; width: 1.75rem; height: 1.75rem; flex: 0 0 1.75rem; }
.persona-skills-editor__remove { --ui-button-height: 1.75rem; --ui-button-coral-fill: var(--ll-color-brand-bright); --ui-button-coral-border-start: var(--ll-color-brand-bright); --ui-button-coral-border-end: var(--ll-color-brand-bright); color: var(--ll-color-metal-025); opacity: 0; transition: opacity var(--ll-duration-fast) var(--ll-ease-out); }
.persona-skills-editor__list li:hover .persona-skills-editor__remove,
.persona-skills-editor__remove:focus-visible { opacity: 1; }
.persona-skills-editor__remove-tooltip { position: absolute; z-index: 20; bottom: calc(100% + var(--ll-space-2)); left: 50%; width: max-content; padding: var(--ll-space-2) var(--ll-space-3); pointer-events: none; color: var(--ll-color-metal-025); background: var(--ll-color-metal-950); border-radius: var(--ll-radius-pill); box-shadow: var(--ll-shadow-raised); font: 550 var(--ll-text-xs) / 1.2 var(--ll-font-control); opacity: 0; transform: translate(-50%, 0.25rem); transition: opacity var(--ll-duration-fast) var(--ll-ease-out), transform var(--ll-duration-fast) var(--ll-ease-out); }
.persona-skills-editor__remove:is(:hover, :focus-visible) + .persona-skills-editor__remove-tooltip { opacity: 1; transform: translate(-50%, 0); }
@media (prefers-reduced-motion: reduce) { .persona-skills-editor__remove, .persona-skills-editor__remove-tooltip { transition: none; } }
</style>
