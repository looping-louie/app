<script setup lang="ts">
import PageShell from '~/components/layout/PageShell.vue'
import UiButton from '~/components/ui/Button.vue'
import UiMarkdownContent from '~/components/ui/MarkdownContent.vue'
import UiModal from '~/components/ui/Modal.vue'
import { apiErrorMessage } from '~/utils/api/errors'
import { entityActionMenuOptions } from '~/utils/entityActionMenu'

const route = useRoute()
const router = useRouter()
const skillId = computed(() => String(route.params.id))
const api = useApiClient()
const notifications = useNotifications()
const deleteModalOpen = ref(false)
const deleting = ref(false)
const deleteError = ref('')

const { data: skill, status, error, refresh } = await useAsyncData(
  () => `skill-${skillId.value}`,
  () => api.skills.get(skillId.value),
)

const skillActionMenuOptions = computed(() => entityActionMenuOptions.map(option => (
  option.value === 'delete' ? { ...option, disabled: !skill.value?.editable } : option
)))

function selectAction(option: { value: string }) {
  if (option.value !== 'delete' || !skill.value?.editable) return
  deleteError.value = ''
  deleteModalOpen.value = true
}

function updateDeleteModal(open: boolean) {
  if (!open && deleting.value) return
  deleteModalOpen.value = open
  if (!open) deleteError.value = ''
}

async function deleteSkill() {
  if (!skill.value?.editable || deleting.value) return

  const skillName = skill.value.name
  deleting.value = true
  deleteError.value = ''

  try {
    await api.skills.remove(skillId.value)
    deleteModalOpen.value = false
    clearNuxtData('skills-catalog')
    notifications.success(
      'Skill deleted',
      `${skillName} has been deleted.`,
    )
    await router.push('/skills')
  } catch (cause) {
    deleteError.value = apiErrorMessage(cause, 'The skill could not be deleted. Please try again.')
  } finally {
    deleting.value = false
  }
}

definePageMeta({
  layout: 'app',
})

useHead(() => ({
  title: skill.value
    ? `${skill.value.name} · Skills · Looping Louie`
    : 'Skill · Looping Louie',
}))
</script>

<template>
  <PageShell
    class="skill-page"
    :title="skill?.name"
    :description="skill?.description"
    :breadcrumbs="skill ? [{ label: 'Skills', to: '/skills' }, { label: skill.name }] : []"
    :show-heading="Boolean(skill)"
  >
    <template #actions>
      <div v-if="skill" class="skill-actions">
        <UiButton type="button">Edit</UiButton>
        <UiButton
          type="button"
          variant="secondary"
          dropdown
          dropdown-align="right"
          icon-only
          aria-label="More skill actions"
          dropdown-label="Skill actions"
          :options="skillActionMenuOptions"
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
      </div>
    </template>

    <div v-if="status === 'pending'" class="skill-state" role="status">Loading skill…</div>
    <div v-else-if="error" class="skill-state skill-state--error" role="alert">
      <span>Skill could not be loaded.</span>
      <UiButton variant="stroke" size="sm" @click="() => refresh()">Retry</UiButton>
    </div>
    <template v-else-if="skill">
      <div class="skill-content">
        <h2 class="instructions-title">Instructions</h2>
        <UiMarkdownContent :content="skill.instructions" strip-first-heading />
      </div>
    </template>

    <UiModal
      v-if="skill"
      :open="deleteModalOpen"
      title="Delete this skill?"
      :description="`This permanently deletes ${skill.name}. This action cannot be undone.`"
      :close-on-backdrop="!deleting"
      :show-close="!deleting"
      @update:open="updateDeleteModal"
    >
      <template #icon>
        <svg viewBox="0 0 256 256" fill="currentColor">
          <path d="M216,48H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM192,208H64V64H192ZM80,24a8,8,0,0,1,8-8h80a8,8,0,0,1,0,16H88A8,8,0,0,1,80,24Z" />
        </svg>
      </template>
      <p v-if="deleteError" class="skill-delete-error" role="alert">{{ deleteError }}</p>
      <template #actions>
        <UiButton data-autofocus variant="secondary" :disabled="deleting" @click="updateDeleteModal(false)">Cancel</UiButton>
        <UiButton variant="coral" :loading="deleting" @click="deleteSkill">Delete skill</UiButton>
      </template>
    </UiModal>
  </PageShell>
</template>

<style scoped>
.skill-page { --layout-page-shell-heading-gap: var(--ll-space-12); }

.skill-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--ll-space-3);
}

.skill-content {
  width: 100%;
  max-width: 48rem;
  text-align: left;
}

.instructions-title {
  margin: 0 0 var(--ll-space-6);
  color: var(--ll-color-text);
  font-size: 1.25rem;
  font-weight: 650;
  line-height: 1.15;
  letter-spacing: -0.025em;
}

.skill-state {
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

.skill-state--error {
  color: var(--ll-color-brand-ink);
}

.skill-delete-error {
  margin: 0;
  color: var(--ll-color-brand-ink);
  font: 500 var(--ll-text-sm) / 1.5 var(--ll-font-control);
}

@media (max-width: 48rem) {
  .skill-actions {
    justify-content: flex-start;
  }
}
</style>
