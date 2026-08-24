<script setup lang="ts">
import PersonaExecutionPanel from '~/components/personas/PersonaExecutionPanel.vue'
import PersonaSkillsEditor from '~/components/personas/PersonaSkillsEditor.vue'
import PageShell from '~/components/layout/PageShell.vue'
import UiButton from '~/components/ui/Button.vue'
import UiMarkdownContent from '~/components/ui/MarkdownContent.vue'
import UiModal from '~/components/ui/Modal.vue'
import { apiErrorCode, apiErrorMessage } from '~/utils/api/errors'
import { entityActionMenuOptions } from '~/utils/entityActionMenu'

const route = useRoute()
const router = useRouter()
const personaId = computed(() => String(route.params.id))
const { personaIcon } = usePersonaIcon()
const api = useApiClient()
const deleteModalOpen = ref(false)
const deleting = ref(false)
const deleteError = ref('')
const editing = ref(false)
const saving = ref(false)
const editName = ref('')
const editDescription = ref('')
const editInstructions = ref('')
const editSkillIds = ref<string[]>([])
const editServiceId = ref('')
const editModelId = ref('')
const editSelectionError = ref('')
const editError = ref('')
const editDirty = ref(false)
const leaveModalOpen = ref(false)
const leaveActionPending = ref(false)
const allowRouteLeave = ref(false)
const pendingDestination = ref<string | null>(null)
const editNameElement = ref<HTMLElement | null>(null)
const editDescriptionElement = ref<HTMLElement | null>(null)
const editBody = ref<InstanceType<typeof UiMarkdownContent> | null>(null)

const { data: persona, status, error, refresh } = await useAsyncData(
  () => `persona-${personaId.value}`,
  () => api.personas.get(personaId.value),
)
const { data: skillsData } = await useAsyncData(
  'persona-edit-skills',
  () => api.skills.list({ status: 'enabled', sort: 'alphabetical-asc', offset: 0 }),
)
const {
  data: linkedServicesData,
  status: linkedServicesStatus,
  refresh: refreshLinkedServices,
} = await useAsyncData(
  'persona-detail-linked-services',
  () => api.linkedServices.list(),
)
const availableSkills = computed(() => skillsData.value?.items ?? [])
const linkedServices = computed(() => linkedServicesData.value ?? [])
const visibleSkillIds = computed(() => editing.value ? editSkillIds.value : persona.value?.skill_ids ?? [])
const personaActionMenuOptions = computed(() => entityActionMenuOptions.map(option => (
  option.value === 'delete' ? { ...option, disabled: !persona.value?.editable } : option
)))

function editableText(element: HTMLElement | null) {
  return element?.innerText.replace(/\u00a0/g, ' ').trim() ?? ''
}

function beginEditing() {
  if (!persona.value?.editable) return
  editName.value = persona.value.name
  editDescription.value = persona.value.description
  editInstructions.value = persona.value.instructions
  editSkillIds.value = [...persona.value.skill_ids]
  editServiceId.value = persona.value.linked_service?.reference_id ?? ''
  editModelId.value = persona.value.config?.model ?? ''
  editSelectionError.value = ''
  editError.value = ''
  editDirty.value = false
  editing.value = true
  nextTick(() => editNameElement.value?.focus())
}

function cancelEditing() {
  if (saving.value) return
  if (editDirty.value) {
    pendingDestination.value = null
    leaveModalOpen.value = true
    return
  }
  editing.value = false
  editError.value = ''
  editSelectionError.value = ''
}

function markEditDirty() {
  editDirty.value = true
  editError.value = ''
}

function updateEditService(serviceId: string) {
  editServiceId.value = serviceId
  editSelectionError.value = ''
  markEditDirty()
}

function updateEditModel(modelId: string) {
  editModelId.value = modelId
  editSelectionError.value = ''
  markEditDirty()
}

function validateExecutionSelection() {
  const service = linkedServices.value.find(item => (
    item.id === editServiceId.value
    && item.enabled
    && item.config.configured
  ))
  const valid = Boolean(service?.config.available_models.includes(editModelId.value))
  editSelectionError.value = valid
    ? ''
    : 'Choose an enabled, configured connection and one of its available models.'
  return valid
}

async function saveEditing() {
  if (!persona.value || saving.value) return false
  const name = editableText(editNameElement.value)
  const description = editableText(editDescriptionElement.value)
  const instructions = editBody.value?.readMarkdown().trim() ?? ''
  if (!name || !instructions) {
    editError.value = !name ? 'Give this agent a name.' : 'Write the instructions for this agent.'
    return false
  }
  if (!validateExecutionSelection()) return false
  saving.value = true
  editError.value = ''
  try {
    persona.value = await api.personas.patch(personaId.value, {
      expected_version: persona.value.version,
      name,
      description,
      instructions,
      linked_service: {
        type: 'LinkedServiceReference',
        reference_id: editServiceId.value,
      },
      config: { model: editModelId.value },
      skill_ids: editSkillIds.value,
    })
    editing.value = false
    editDirty.value = false
    clearNuxtData('agents-catalog')
    return true
  } catch (cause) {
    if (apiErrorCode(cause) === 'linked_service_selection_unavailable') {
      editSelectionError.value = 'This connection is disabled, unconfigured, or no longer deploys the selected model. Choose another selection.'
      await refreshLinkedServices()
    } else {
      editError.value = apiErrorMessage(cause, 'The agent could not be saved. Please try again.')
    }
    return false
  } finally {
    saving.value = false
  }
}

function updateSkills(skillIds: string[]) {
  editSkillIds.value = skillIds
  markEditDirty()
}

async function discardChanges() {
  leaveModalOpen.value = false
  editing.value = false
  editDirty.value = false
  editSelectionError.value = ''
  if (pendingDestination.value) {
    allowRouteLeave.value = true
    await router.push(pendingDestination.value)
  }
}

async function saveChangesAndLeave() {
  if (leaveActionPending.value) return
  leaveActionPending.value = true
  const destination = pendingDestination.value
  try {
    if (!await saveEditing()) return
    leaveModalOpen.value = false
    if (destination) {
      allowRouteLeave.value = true
      await router.push(destination)
    }
  } finally {
    leaveActionPending.value = false
  }
}

function selectAction(option: { value: string }) {
  if (option.value !== 'delete' || !persona.value?.editable) return
  deleteError.value = ''
  deleteModalOpen.value = true
}

function updateDeleteModal(open: boolean) {
  if (!open && deleting.value) return
  deleteModalOpen.value = open
  if (!open) deleteError.value = ''
}

async function deletePersona() {
  if (!persona.value?.editable || deleting.value) return
  deleting.value = true
  deleteError.value = ''
  try {
    try {
      await api.personas.remove(personaId.value)
    } catch (cause) {
      if (!['instruction_not_found', 'instruction_not_owned'].includes(apiErrorCode(cause) ?? '')) throw cause
    }
    deleteModalOpen.value = false
    window.location.replace('/personas')
  } catch (cause) {
    deleteError.value = apiErrorMessage(cause, 'The agent could not be deleted. Please try again.')
  } finally {
    deleting.value = false
  }
}

function onBeforeUnload(event: BeforeUnloadEvent) {
  if (!editing.value || !editDirty.value || allowRouteLeave.value) return
  event.preventDefault()
  event.returnValue = ''
}

onBeforeRouteLeave((to) => {
  if (allowRouteLeave.value || !editing.value || !editDirty.value) return true
  pendingDestination.value = to.fullPath
  leaveModalOpen.value = true
  return false
})

onMounted(() => window.addEventListener('beforeunload', onBeforeUnload))
onBeforeUnmount(() => window.removeEventListener('beforeunload', onBeforeUnload))

definePageMeta({
  layout: 'app',
})

useHead(() => ({
  title: persona.value
    ? `${persona.value.name} · Agents · Looping Louie`
    : 'Agent · Looping Louie',
}))
</script>

<template>
  <PageShell
    class="persona-page"
    :breadcrumbs="persona ? [
      { label: 'Agents', to: '/personas' },
      { label: persona.name },
    ] : []"
    :show-heading="Boolean(persona)"
  >
    <template #title>
      <h1
        v-if="persona"
        ref="editNameElement"
        :class="{ 'persona-editable': editing }"
        :contenteditable="editing ? 'true' : undefined"
        :role="editing ? 'textbox' : undefined"
        :tabindex="editing ? 0 : undefined"
        spellcheck="true"
        @input="markEditDirty"
        @keydown.enter.prevent
      >{{ editing ? editName : persona.name }}</h1>
    </template>
    <template #description>
      <p
        v-if="persona"
        ref="editDescriptionElement"
        :class="{ 'persona-editable': editing }"
        :contenteditable="editing ? 'true' : undefined"
        :role="editing ? 'textbox' : undefined"
        :tabindex="editing ? 0 : undefined"
        spellcheck="true"
        @input="markEditDirty"
      >{{ editing ? editDescription : persona.description }}</p>
    </template>
    <template #actions>
      <div v-if="persona" class="persona-actions">
        <template v-if="editing">
          <UiButton type="button" :loading="saving" @click="saveEditing">Save</UiButton>
          <UiButton type="button" variant="secondary" :disabled="saving" @click="cancelEditing">Cancel</UiButton>
        </template>
        <template v-else>
          <UiButton type="button" :disabled="!persona.editable" @click="beginEditing">Edit</UiButton>
          <UiButton
            type="button"
            variant="secondary"
            dropdown
            dropdown-align="right"
            icon-only
            aria-label="More agent actions"
            dropdown-label="Agent actions"
            :options="personaActionMenuOptions"
            :disabled="deleting"
            @select="selectAction"
          >
            <template #leading>
              <svg viewBox="0 0 256 256" fill="currentColor">
                <circle cx="128" cy="56" r="12" />
                <circle cx="128" cy="128" r="12" />
                <circle cx="128" cy="200" r="12" />
              </svg>
            </template>
          </UiButton>
        </template>
      </div>
    </template>

    <div v-if="status === 'pending'" class="persona-state" role="status">Loading agent…</div>
    <div v-else-if="error" class="persona-state persona-state--error" role="alert">
      <span>Agent could not be loaded.</span>
      <UiButton variant="stroke" size="sm" @click="() => refresh()">Retry</UiButton>
    </div>
    <template v-else-if="persona">
      <p v-if="editError" class="persona-edit-error" role="alert">{{ editError }}</p>

      <div class="persona-content">
        <UiMarkdownContent
          ref="editBody"
          :content="editing ? editInstructions : persona.instructions"
          :editable="editing"
          @change="markEditDirty"
          @click.capture="editing && $event.preventDefault()"
        />

        <aside class="persona-aside" :class="{ 'persona-aside--editing': editing }" aria-label="Agent details">
          <div class="persona-icon-card" role="img" :aria-label="`${persona.name} icon`">
            <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false">
              <path :d="personaIcon(persona)" />
            </svg>
          </div>

          <PersonaExecutionPanel
            :services="linkedServices"
            :service-id="editing ? editServiceId : persona.linked_service?.reference_id"
            :model-id="editing ? editModelId : persona.config?.model"
            :editing="editing"
            :loading="linkedServicesStatus === 'pending'"
            :load-error="linkedServicesStatus === 'error'"
            :selection-error="editSelectionError"
            :disabled="saving"
            @update:service-id="updateEditService"
            @update:model-id="updateEditModel"
            @retry="refreshLinkedServices"
          />

          <PersonaSkillsEditor
            v-if="visibleSkillIds.length || editing"
            :skill-ids="visibleSkillIds"
            :skills="availableSkills"
            :editing="editing"
            @update:skill-ids="updateSkills"
          />
        </aside>
      </div>
    </template>

    <UiModal
      v-if="persona"
      :open="deleteModalOpen"
      title="Delete this agent?"
      :description="`This permanently deletes ${persona.name}. This action cannot be undone.`"
      :close-on-backdrop="!deleting"
      :show-close="!deleting"
      @update:open="updateDeleteModal"
    >
      <template #icon>
        <svg viewBox="0 0 256 256" fill="currentColor">
          <path d="M216,48H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM192,208H64V64H192ZM80,24a8,8,0,0,1,8-8h80a8,8,0,0,1,0,16H88A8,8,0,0,1,80,24Z" />
        </svg>
      </template>
      <p v-if="deleteError" class="persona-delete-error" role="alert">{{ deleteError }}</p>
      <template #actions>
        <UiButton data-autofocus variant="secondary" :disabled="deleting" @click="deleteModalOpen = false">Cancel</UiButton>
        <UiButton variant="coral" :loading="deleting" @click="deletePersona">Delete agent</UiButton>
      </template>
    </UiModal>

    <UiModal
      v-model:open="leaveModalOpen"
      title="Save your changes?"
      description="You have unsaved changes to this agent. Save them before leaving, or discard them."
      :close-on-backdrop="!leaveActionPending"
      :show-close="!leaveActionPending"
    >
      <template #icon>
        <svg viewBox="0 0 256 256" fill="currentColor">
          <path d="M216,32H176a8,8,0,0,0-8,8V72H88V40a8,8,0,0,0-8-8H40A16,16,0,0,0,24,48V208a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V48A16,16,0,0,0,216,32ZM72,48V80a8,8,0,0,0,8,8h96a8,8,0,0,0,8-8V48h32V208H40V48Zm88,8a12,12,0,1,1-12-12A12,12,0,0,1,160,56ZM128,112a40,40,0,1,0,40,40A40,40,0,0,0,128,112Zm0,64a24,24,0,1,1,24-24A24,24,0,0,1,128,176Z" />
        </svg>
      </template>
      <p v-if="editError" class="persona-edit-error" role="alert">{{ editError }}</p>
      <template #actions>
        <UiButton variant="coral" :disabled="leaveActionPending" @click="discardChanges">Discard changes</UiButton>
        <UiButton data-autofocus :loading="leaveActionPending" @click="saveChangesAndLeave">Save changes</UiButton>
      </template>
    </UiModal>
  </PageShell>
</template>

<style scoped>
.persona-page {
  --layout-page-shell-heading-gap: var(--ll-space-12);
}

.persona-editable { border-radius: var(--ll-radius-sm); outline: 1px solid transparent; transition: outline-color var(--ll-duration-fast) var(--ll-ease-out), box-shadow var(--ll-duration-fast) var(--ll-ease-out); }
.persona-editable:hover { outline-color: var(--ll-color-divider); }
.persona-editable:focus { outline: 1px solid var(--ll-color-primary); box-shadow: 0 0 0 3px var(--ll-color-primary-highlight); }

.persona-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--ll-space-3);
}

.persona-content {
  display: grid;
  width: 100%;
  grid-template-columns: minmax(0, 48rem) minmax(12rem, 1fr);
  align-items: start;
  gap: clamp(2rem, 7vw, 7rem);
}

.persona-aside {
  position: sticky;
  top: var(--ll-space-6);
  display: flex;
  width: min(100%, 15.625rem);
  min-width: 0;
  flex-direction: column;
  justify-self: end;
  gap: var(--ll-space-6);
}

.persona-aside--editing { width: min(100%, 26rem); }

.persona-icon-card {
  display: grid;
  width: 100%;
  aspect-ratio: 4 / 3;
  box-sizing: border-box;
  place-items: center;
  color: var(--ll-color-primary-depth);
  background: var(--ll-color-highlight);
  border: 1px solid var(--ll-color-divider);
  border-radius: var(--ll-radius-structural);
}

.persona-icon-card svg {
  width: 5rem;
  height: 5rem;
}

.persona-state {
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

.persona-state--error {
  color: var(--ll-color-brand-ink);
}

.persona-delete-error,
.persona-edit-error {
  margin: 0;
  color: var(--ll-color-brand-ink);
  font: 500 var(--ll-text-sm) / 1.45 var(--ll-font-control);
}

.persona-edit-error { margin: calc(-1 * var(--ll-space-8)) 0 var(--ll-space-8); }

@media (max-width: 48rem) {
  .persona-content {
    grid-template-columns: minmax(0, 1fr);
  }

  .persona-actions {
    justify-content: flex-start;
  }

  .persona-aside {
    position: static;
    width: min(100%, 20rem);
    justify-self: start;
  }
}
</style>
