<script setup lang="ts">
import UiAsyncStage from '~/components/ui/AsyncStage.vue'
import UiButton from '~/components/ui/Button.vue'
import UiCollectionGroupTitle from '~/components/ui/CollectionGroupTitle.vue'
import UiPill from '~/components/ui/Pill.vue'
import UiSectionStage from '~/components/ui/SectionStage.vue'
import UiTextField from '~/components/ui/TextField.vue'
import type { WorkspaceResponse } from '~/types/api'
import { apiErrorMessage } from '~/utils/api/errors'

const api = useApiClient()
const notifications = useNotifications()
const {
  activeWorkspaceId,
  createWorkspace,
  error: contextError,
  initialize,
  replaceWorkspace,
  selectWorkspace,
  status,
  workspaces,
} = useWorkspaceContext()
const newWorkspaceName = ref('')
const creating = ref(false)
const createError = ref('')
const savingWorkspaceId = ref('')
const workspaceErrors = reactive<Record<string, string>>({})
const workspaceNames = reactive<Record<string, string>>({})

watch(workspaces, (items) => {
  items.forEach((workspace) => {
    if (!(workspace.id in workspaceNames)) workspaceNames[workspace.id] = workspace.name
  })
}, { immediate: true })

async function createNewWorkspace() {
  const name = newWorkspaceName.value.trim()
  if (!name || creating.value) return
  creating.value = true
  createError.value = ''
  try {
    const workspace = await createWorkspace({ name })
    workspaceNames[workspace.id] = workspace.name
    newWorkspaceName.value = ''
    notifications.success('Workspace created', `${workspace.name} is now the active execution workspace.`)
  } catch (cause) {
    createError.value = apiErrorMessage(cause, 'The workspace could not be created. Please try again.')
  } finally {
    creating.value = false
  }
}

async function saveWorkspace(workspace: WorkspaceResponse) {
  const name = workspaceNames[workspace.id]?.trim() ?? ''
  if (!name || name === workspace.name || savingWorkspaceId.value) return
  savingWorkspaceId.value = workspace.id
  workspaceErrors[workspace.id] = ''
  try {
    const updated = await api.workspaces.patch(workspace.id, { name })
    replaceWorkspace(updated)
    workspaceNames[workspace.id] = updated.name
    notifications.success('Workspace updated', `${updated.name} has been renamed.`)
  } catch (cause) {
    workspaceErrors[workspace.id] = apiErrorMessage(cause, 'The workspace could not be updated.')
  } finally {
    savingWorkspaceId.value = ''
  }
}

function makeActive(workspace: WorkspaceResponse) {
  if (!selectWorkspace(workspace.id)) return
  notifications.success('Workspace selected', `${workspace.name} will be used for execution runs.`)
}

definePageMeta({ pageTransition: false })
useHead({ title: 'Workspaces · Settings · Looping Louie' })
</script>

<template>
  <div class="workspace-settings">
    <section aria-labelledby="workspace-create-title">
      <UiCollectionGroupTitle id="workspace-create-title" title="Create workspace" heading-as="h2" />
      <UiSectionStage inverse="bottom">
        <form class="workspace-create" @submit.prevent="createNewWorkspace">
          <UiTextField
            v-model="newWorkspaceName"
            label="Workspace name"
            placeholder="e.g. Product engineering"
            :error="createError"
            required
          />
          <UiButton type="submit" :disabled="!newWorkspaceName.trim()" :loading="creating">Create workspace</UiButton>
        </form>
      </UiSectionStage>
    </section>

    <section aria-labelledby="workspace-list-title">
      <UiCollectionGroupTitle id="workspace-list-title" title="Execution workspaces" heading-as="h2" />
      <UiAsyncStage
        :status="status"
        :empty="status === 'success' && !workspaces.length"
        :error-label="contextError"
        empty-label="No execution workspaces yet. Create one to run pipelines."
        @retry="initialize(true)"
      >
        <div class="workspace-list">
          <form
            v-for="workspace in workspaces"
            :key="workspace.id"
            class="workspace-row"
            @submit.prevent="saveWorkspace(workspace)"
          >
            <div class="workspace-row__identity">
              <UiTextField
                v-model="workspaceNames[workspace.id]"
                :label="`Name for ${workspace.name}`"
                hide-label
                :error="workspaceErrors[workspace.id]"
              />
              <code>{{ workspace.id }}</code>
            </div>
            <UiPill v-if="workspace.id === activeWorkspaceId" :focusable="false">Active</UiPill>
            <UiButton
              v-else
              type="button"
              variant="stroke"
              size="sm"
              @click="makeActive(workspace)"
            >
              Use for runs
            </UiButton>
            <UiButton
              type="submit"
              variant="secondary"
              size="sm"
              :disabled="!workspaceNames[workspace.id]?.trim() || workspaceNames[workspace.id]?.trim() === workspace.name"
              :loading="savingWorkspaceId === workspace.id"
            >
              Save name
            </UiButton>
          </form>
        </div>
      </UiAsyncStage>
    </section>
  </div>
</template>

<style scoped>
.workspace-settings { display: grid; gap: var(--ll-space-12); }
.workspace-create { display: grid; grid-template-columns: minmax(0, 28rem) auto; align-items: end; gap: var(--ll-space-4); padding: var(--ll-space-6); }
.workspace-list { display: grid; gap: var(--ll-space-3); padding: var(--ll-space-4); }
.workspace-row { display: grid; grid-template-columns: minmax(0, 1fr) auto auto; align-items: center; gap: var(--ll-space-4); padding: var(--ll-space-4); border: 1px solid var(--ll-color-divider); border-radius: var(--ll-radius-structural); }
.workspace-row__identity { display: grid; min-width: 0; gap: var(--ll-space-2); }
.workspace-row__identity code { overflow: hidden; color: var(--ll-color-text-muted); font: 400 var(--ll-text-xs) / 1.4 var(--ll-font-mono); text-overflow: ellipsis; }
@media (max-width: 48rem) { .workspace-create, .workspace-row { grid-template-columns: 1fr; align-items: stretch; } }
</style>
