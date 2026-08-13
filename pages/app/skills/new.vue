<script setup lang="ts">
import UiBreadcrumb from '~/components/ui/Breadcrumb.vue'
import UiButton from '~/components/ui/Button.vue'
import UiCollectionGroupTitle from '~/components/ui/CollectionGroupTitle.vue'
import UiContainer from '~/components/ui/Container.vue'
import UiDirectoryOption from '~/components/ui/DirectoryOption.vue'
import UiFormProgress from '~/components/ui/FormProgress.vue'
import UiModal from '~/components/ui/Modal.vue'
import UiSectionStage from '~/components/ui/SectionStage.vue'
import UiTextField from '~/components/ui/TextField.vue'
import type { SkillCategory } from '~/types/api'
import { apiErrorMessage } from '~/utils/api/errors'
import { instructionCategoryOptions } from '~/utils/instructionCategories'

type BuilderStep = 'details' | 'category' | 'prompt'

const steps = ['Details', 'Category', 'Prompt']
const stepOrder: BuilderStep[] = ['details', 'category', 'prompt']
const descriptionMaxLength = 160
const api = useApiClient()
const route = useRoute()
const router = useRouter()
const step = ref<BuilderStep>(isBuilderStep(route.query.step) ? route.query.step : 'details')
const title = ref('')
const description = ref('')
const category = ref<SkillCategory | ''>('')
const prompt = ref('')
const errors = reactive({ title: '', description: '', category: '', prompt: '' })
const saving = ref(false)
const saveError = ref('')
const exitModalOpen = ref(false)
const exitActionPending = ref(false)
const allowRouteLeave = ref(false)
const pendingDestination = ref('/app/skills')
const questionRoot = ref<HTMLElement | null>(null)
const titleField = ref<InstanceType<typeof UiTextField> | null>(null)
const promptField = ref<InstanceType<typeof UiTextField> | null>(null)
const categoryRoot = ref<HTMLElement | null>(null)
const promptStage = ref<HTMLElement | null>(null)
const navigationRoot = ref<HTMLElement | null>(null)
const navigationBounds = reactive({ left: 0, width: 0 })
const localKey = 'looping-louie:skill-builder-draft:v1'
let questionResizeObserver: ResizeObserver | undefined

const stepIndex = computed(() => stepOrder.indexOf(step.value))
const descriptionHint = computed(() => (
  `${description.value.length}/${descriptionMaxLength} characters · Press Ctrl or Cmd + Enter to continue.`
))
const canContinue = computed(() => {
  if (step.value === 'details') {
    return Boolean(title.value.trim() && description.value.trim() && description.value.length <= descriptionMaxLength)
  }
  if (step.value === 'category') return Boolean(category.value)
  return Boolean(prompt.value.trim() && !saving.value)
})
const hasProgress = computed(() => Boolean(
  title.value.trim() || description.value.trim() || category.value || prompt.value.trim(),
))
const navigationStyle = computed(() => navigationBounds.width
  ? { left: `${navigationBounds.left}px`, width: `${navigationBounds.width}px` }
  : undefined)

function isBuilderStep(value: unknown): value is BuilderStep {
  return typeof value === 'string' && stepOrder.includes(value as BuilderStep)
}

function clearError(field: keyof typeof errors) {
  errors[field] = ''
  saveError.value = ''
}

function validateDetails() {
  errors.title = title.value.trim() ? '' : 'Give this skill a title.'
  errors.description = description.value.trim() ? '' : 'Describe when this skill should be used.'
  if (description.value.length > descriptionMaxLength) {
    errors.description = `Keep the description to ${descriptionMaxLength} characters or fewer.`
  }
  return !errors.title && !errors.description
}

function validatePrompt() {
  errors.prompt = prompt.value.trim() ? '' : 'Write the instructions for this skill.'
  return !errors.prompt
}

async function focusCurrentStep() {
  await nextTick()
  if (step.value === 'details') titleField.value?.focus()
  else if (step.value === 'category') categoryRoot.value?.querySelector<HTMLInputElement>('input')?.focus()
  else promptField.value?.focus()
}

async function goTo(next: BuilderStep) {
  step.value = next
  saveLocalDraft()
  await router.replace({ query: { ...route.query, step: next } })
  window.scrollTo({ top: 0, behavior: 'smooth' })
  await focusCurrentStep()
  measureLayout()
}

async function goBack() {
  const previous = stepOrder[stepIndex.value - 1]
  if (previous) await goTo(previous)
}

async function continueCurrentStep() {
  if (step.value === 'details') {
    if (validateDetails()) await goTo('category')
    return
  }
  if (step.value === 'category') {
    if (category.value) await goTo('prompt')
    else errors.category = 'Choose a category.'
    return
  }
  if (validatePrompt()) await createSkill()
}

async function chooseCategory(value: string | string[]) {
  if (saving.value || typeof value !== 'string') return
  category.value = value as SkillCategory
  clearError('category')
  await goTo('prompt')
}

function saveLocalDraft() {
  if (!import.meta.client) return
  localStorage.setItem(localKey, JSON.stringify({
    step: step.value,
    title: title.value,
    description: description.value,
    category: category.value,
    prompt: prompt.value,
    updatedAt: new Date().toISOString(),
  }))
}

function restoreLocalDraft() {
  if (!import.meta.client) return
  const raw = localStorage.getItem(localKey)
  if (!raw) return
  try {
    const draft = JSON.parse(raw) as Record<string, unknown>
    title.value = typeof draft.title === 'string' ? draft.title : ''
    description.value = typeof draft.description === 'string' ? draft.description : ''
    prompt.value = typeof draft.prompt === 'string' ? draft.prompt : ''
    category.value = instructionCategoryOptions.some(option => option.value === draft.category)
      ? draft.category as SkillCategory
      : ''
    if (!isBuilderStep(route.query.step) && isBuilderStep(draft.step)) step.value = draft.step
  } catch {
    localStorage.removeItem(localKey)
  }
}

async function createSkill() {
  if (!validatePrompt() || saving.value || !category.value || !validateDetails()) return
  saving.value = true
  saveError.value = ''
  try {
    const skill = await api.skills.create({
      name: title.value.trim(),
      description: description.value.trim(),
      instructions: prompt.value.trim(),
      metadata: { category: category.value },
    })
    localStorage.removeItem(localKey)
    clearNuxtData('skills-catalog')
    allowRouteLeave.value = true
    await router.push(`/app/skills/${encodeURIComponent(skill.id)}`)
  } catch (error) {
    saveError.value = apiErrorMessage(error, 'The skill could not be saved. Please try again.')
    saveLocalDraft()
  } finally {
    saving.value = false
  }
}

async function leaveBuilder() {
  allowRouteLeave.value = true
  exitModalOpen.value = false
  await router.push(pendingDestination.value)
}

async function saveDraftAndLeave() {
  if (exitActionPending.value) return
  exitActionPending.value = true
  try {
    saveLocalDraft()
    await leaveBuilder()
  } finally {
    exitActionPending.value = false
  }
}

async function discardDraftAndLeave() {
  if (exitActionPending.value) return
  exitActionPending.value = true
  try {
    localStorage.removeItem(localKey)
    await leaveBuilder()
  } finally {
    exitActionPending.value = false
  }
}

function isTextEditingTarget(target: EventTarget | null) {
  return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement
}

function onPanelKeydown(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
    event.preventDefault()
    void continueCurrentStep()
  }
}

function onBuilderKeydown(event: KeyboardEvent) {
  if (event.defaultPrevented || event.repeat || exitModalOpen.value || isTextEditingTarget(event.target)) return
  if (event.key === 'ArrowUp' && stepIndex.value > 0) {
    event.preventDefault()
    void goBack()
  } else if (event.key === 'ArrowDown' && step.value !== 'prompt' && canContinue.value) {
    event.preventDefault()
    void continueCurrentStep()
  }
}

function measureNavigation() {
  if (!questionRoot.value) return
  const bounds = questionRoot.value.getBoundingClientRect()
  navigationBounds.left = bounds.left
  navigationBounds.width = bounds.width
}

function measurePromptStage() {
  if (step.value !== 'prompt' || !promptStage.value || !navigationRoot.value) return
  const shell = promptStage.value.querySelector<HTMLElement>('.ui-section-stage__shell')
  const firstButton = navigationRoot.value.querySelector<HTMLElement>('.ui-button')
  if (!shell || !firstButton) return
  const styles = getComputedStyle(document.documentElement)
  const gap = Number.parseFloat(styles.getPropertyValue('--ll-space-4')) || 16
  const height = Math.max(120, firstButton.getBoundingClientRect().top - shell.getBoundingClientRect().top - gap)
  promptStage.value.style.setProperty('--prompt-stage-height', `${height}px`)
}

function measureLayout() {
  measureNavigation()
  measurePromptStage()
}

function onBeforeUnload(event: BeforeUnloadEvent) {
  if (!hasProgress.value || allowRouteLeave.value) return
  event.preventDefault()
  event.returnValue = ''
}

onBeforeRouteLeave((to) => {
  if (allowRouteLeave.value || to.path === route.path || !hasProgress.value) return true
  pendingDestination.value = to.fullPath
  exitModalOpen.value = true
  return false
})

onMounted(async () => {
  restoreLocalDraft()
  window.addEventListener('beforeunload', onBeforeUnload)
  window.addEventListener('resize', measureLayout)
  document.addEventListener('keydown', onBuilderKeydown)
  questionResizeObserver = new ResizeObserver(measureLayout)
  if (questionRoot.value) questionResizeObserver.observe(questionRoot.value)
  await focusCurrentStep()
  measureLayout()
})

onBeforeUnmount(() => {
  questionResizeObserver?.disconnect()
  window.removeEventListener('beforeunload', onBeforeUnload)
  window.removeEventListener('resize', measureLayout)
  document.removeEventListener('keydown', onBuilderKeydown)
})

definePageMeta({ layout: 'app' })
useHead({ title: 'Create a skill · Looping Louie' })
</script>

<template>
  <UiContainer size="wide" class="skill-builder">
    <header class="skill-builder__topbar">
      <UiFormProgress :steps="steps" :current="stepIndex" />
    </header>

    <main ref="questionRoot" class="skill-builder__question">
      <UiBreadcrumb
        :items="[{ label: 'Skills', to: '/app/skills' }, { label: 'Create new skill' }]"
        class="skill-builder__breadcrumb"
      />

      <Transition name="builder-question" mode="out-in">
        <section v-if="step === 'details'" key="details" class="builder-panel" @keydown="onPanelKeydown">
          <div class="builder-panel__heading">
            <h1>Tell us about this skill</h1>
            <p>Give it a clear title and a concise description so people can recognise it across the product.</p>
          </div>
          <div class="builder-field-stage">
            <UiCollectionGroupTitle title="Title *" heading-as="h2" />
            <UiSectionStage inverse="bottom">
              <UiTextField
                ref="titleField"
                v-model="title"
                label="Title"
                hide-label
                required
                placeholder="e.g. Review API compatibility"
                :error="errors.title"
                @input="clearError('title')"
              />
            </UiSectionStage>
          </div>
          <div class="builder-field-stage">
            <UiCollectionGroupTitle title="Description *" heading-as="h2" />
            <UiSectionStage inverse="bottom">
              <UiTextField
                v-model="description"
                label="Description"
                hide-label
                multiline
                :rows="5"
                :maxlength="descriptionMaxLength"
                required
                placeholder="Explain what this skill does and when an agent should use it…"
                :hint="descriptionHint"
                :error="errors.description"
                @input="clearError('description')"
              />
            </UiSectionStage>
          </div>
        </section>

        <section v-else-if="step === 'category'" key="category" class="builder-panel">
          <div class="builder-panel__heading">
            <h1>What kind of skill is it?</h1>
            <p>Choose one category. Selecting it will take you directly to the final step.</p>
          </div>
          <div class="builder-field-stage">
            <UiCollectionGroupTitle title="Category" heading-as="h2" />
            <UiSectionStage inverse="bottom">
              <div ref="categoryRoot" class="category-options" role="group" aria-label="Skill category">
                <UiDirectoryOption
                  v-for="option in instructionCategoryOptions"
                  :key="option.value"
                  :model-value="category"
                  :value="option.value"
                  :title="option.label"
                  :description="option.group"
                  selection-type="radio"
                  name="skill-category"
                  @update:model-value="chooseCategory"
                >
                  <template #media>
                    <svg viewBox="0 0 256 256" fill="currentColor"><path :d="option.iconPath" /></svg>
                  </template>
                </UiDirectoryOption>
              </div>
              <p v-if="errors.category" class="builder-field-error" role="alert">{{ errors.category }}</p>
            </UiSectionStage>
          </div>
        </section>

        <section v-else key="prompt" class="builder-panel" @keydown="onPanelKeydown">
          <div class="builder-panel__heading">
            <h1>What should the agent do?</h1>
            <p>Write the reusable instructions the agent should follow whenever this skill is applied.</p>
          </div>
          <div ref="promptStage" class="builder-field-stage builder-field-stage--prompt">
            <UiCollectionGroupTitle title="Prompt *" heading-as="h2" />
            <UiSectionStage inverse="bottom">
              <UiTextField
                ref="promptField"
                v-model="prompt"
                label="Prompt"
                hide-label
                multiline
                :rows="14"
                required
                placeholder="Write clear, actionable instructions for the agent…"
                hint="Markdown is supported. Press Ctrl or Cmd + Enter to save."
                :error="errors.prompt"
                @input="clearError('prompt')"
              />
            </UiSectionStage>
          </div>
          <p v-if="saveError" class="builder-save-error" role="alert">{{ saveError }}</p>
        </section>
      </Transition>

      <nav ref="navigationRoot" class="builder-navigation" :style="navigationStyle" aria-label="Form steps">
        <UiButton class="builder-navigation__back" variant="secondary" :disabled="stepIndex === 0" @click="goBack">
          Back <kbd aria-hidden="true">↑</kbd>
        </UiButton>
        <UiButton class="builder-navigation__continue" :disabled="!canContinue" :loading="saving" @click="continueCurrentStep">
          {{ step === 'prompt' ? 'Save skill' : 'Continue' }}
          <kbd aria-hidden="true">{{ step === 'prompt' ? 'Ctrl/⌘ ↵' : '↓' }}</kbd>
        </UiButton>
      </nav>
    </main>

    <UiModal
      v-model:open="exitModalOpen"
      title="Leave this skill unfinished?"
      description="Save your progress as a draft so you can continue later, or discard it permanently."
      :close-on-backdrop="!exitActionPending"
      :show-close="!exitActionPending"
    >
      <template #icon>
        <svg viewBox="0 0 256 256" fill="currentColor"><path d="M236.8,188.09,149.35,36.22h0a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09ZM222.93,203.8a8.5,8.5,0,0,1-7.48,4.2H40.55a8.5,8.5,0,0,1-7.48-4.2,7.59,7.59,0,0,1,0-7.72L120.52,44.21a8.75,8.75,0,0,1,15,0l87.45,151.87A7.59,7.59,0,0,1,222.93,203.8ZM120,144V104a8,8,0,0,1,16,0v40a8,8,0,0,1-16,0Zm20,36a12,12,0,1,1-12-12A12,12,0,0,1,140,180Z" /></svg>
      </template>
      <template #actions>
        <UiButton variant="coral" :disabled="exitActionPending" @click="discardDraftAndLeave">Discard draft</UiButton>
        <UiButton data-autofocus :loading="exitActionPending" @click="saveDraftAndLeave">Save draft</UiButton>
      </template>
    </UiModal>
  </UiContainer>
</template>

<style scoped>
.skill-builder { padding-block: var(--ll-space-6) var(--ll-space-16); }
.skill-builder__topbar { width: calc(100% + var(--ui-container-gutter)); margin-bottom: var(--ll-space-10); }
.skill-builder__question { max-width: 52rem; min-width: 0; padding-bottom: 7rem; }
.skill-builder__breadcrumb { margin-bottom: var(--ll-space-5); }
.builder-panel { display: grid; gap: var(--ll-space-6); }
.builder-panel__heading { display: grid; max-width: 48rem; gap: var(--ll-space-3); }
.builder-panel__heading h1 { max-width: 18ch; margin: 0; color: var(--ll-color-ink); font: 550 clamp(2rem, 4vw, 3.5rem) / 1.02 var(--ll-font-display); letter-spacing: -0.04em; }
.builder-panel__heading p { max-width: 42rem; margin: 0; color: var(--ll-color-text-muted); font-size: 1.05rem; line-height: 1.55; }
.builder-field-stage { min-width: 0; }
.builder-panel :deep(.ui-section-stage__shell) { width: 100%; margin-inline: 0; }
.category-options { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--ll-space-3); }
.category-options :deep(.ui-directory-option) { border-radius: var(--ll-radius-pill); }
.builder-field-stage--prompt :deep(.ui-section-stage__shell) { height: var(--prompt-stage-height, 28rem); }
.builder-field-stage--prompt :deep(.ui-section-stage__content),
.builder-field-stage--prompt :deep(.ui-text-field) { height: 100%; box-sizing: border-box; }
.builder-field-stage--prompt :deep(.ui-text-field) { grid-template-rows: minmax(0, 1fr) auto; }
.builder-field-stage--prompt :deep(.ui-text-field__control--textarea) { height: 100%; min-height: 0; }
.builder-field-error,
.builder-save-error { margin: var(--ll-space-3) 0 0; color: var(--ll-color-brand-ink); font: 500 var(--ll-text-xs) / 1.45 var(--ll-font-control); }
.builder-navigation { position: fixed; z-index: 40; bottom: var(--ll-space-4); display: flex; box-sizing: border-box; align-items: center; justify-content: space-between; gap: var(--ll-space-4); padding-block: var(--ll-space-8) max(var(--ll-space-3), env(safe-area-inset-bottom)); background: linear-gradient(180deg, transparent 0, color-mix(in srgb, var(--ll-color-canvas) 94%, transparent) 28%, var(--ll-color-canvas) 58%); }
.builder-navigation__back :deep(.ui-button__label),
.builder-navigation__continue :deep(.ui-button__label) { display: inline-flex; align-items: center; line-height: 1; }
.builder-navigation kbd { display: inline-grid; min-width: 1.35rem; height: 1.35rem; box-sizing: border-box; place-items: center; padding-inline: 0.3rem; margin-left: var(--ll-space-2); color: currentColor; background: color-mix(in srgb, currentColor 8%, transparent); border: 1px solid color-mix(in srgb, currentColor 22%, transparent); border-radius: var(--ll-radius-sm); font: 600 0.6875rem / 1 var(--ll-font-mono); box-shadow: 0 1px 0 color-mix(in srgb, currentColor 20%, transparent); white-space: nowrap; }
.builder-question-enter-active,
.builder-question-leave-active { transition: opacity 150ms ease, transform 180ms var(--ll-ease-out); }
.builder-question-enter-from { opacity: 0; transform: translateY(0.75rem); }
.builder-question-leave-to { opacity: 0; transform: translateY(-0.5rem); }
@media (max-width: 34rem) { .category-options { grid-template-columns: 1fr; } .builder-navigation { bottom: 0; } }
@media (prefers-reduced-motion: reduce) { .builder-question-enter-active, .builder-question-leave-active { transition: none; } }
</style>
