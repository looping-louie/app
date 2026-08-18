<script setup lang="ts">
import WizardShell from '~/components/layout/WizardShell.vue'
import UiBreadcrumb from '~/components/ui/Breadcrumb.vue'
import UiButton from '~/components/ui/Button.vue'
import UiCollectionGroupTitle from '~/components/ui/CollectionGroupTitle.vue'
import UiGridList from '~/components/ui/GridList.vue'
import UiPill from '~/components/ui/Pill.vue'
import UiSectionStage from '~/components/ui/SectionStage.vue'
import UiTextField from '~/components/ui/TextField.vue'

type ProjectBuilderStep = 'basics' | 'team' | 'repository' | 'constitution' | 'plugins'
type ProjectPermission = 'read' | 'write' | 'maintain' | 'admin'
type RestrictionKey = keyof RepositoryRestrictions

interface TeamMemberDraft {
  id: string
  email: string
  permission: ProjectPermission
}

interface RepositoryRestrictions {
  protectDefaultBranch: boolean
  allowDirectPushes: boolean
  requirePullRequest: boolean
  requireApprovals: boolean
  requirePassingChecks: boolean
  requireSignedCommits: boolean
  allowForcePushes: boolean
  allowBranchDeletion: boolean
}

interface McpOption {
  id: string
  name: string
  category: string
  logoSrc: string
}

const steps = ['Basics', 'Team', 'Repository', 'Constitution', 'Plugins']
const stepOrder: ProjectBuilderStep[] = ['basics', 'team', 'repository', 'constitution', 'plugins']
const route = useRoute()
const router = useRouter()
const step = ref<ProjectBuilderStep>(isProjectBuilderStep(route.query.step) ? route.query.step : 'basics')
const projectName = ref('')
const projectDescription = ref('')
const repositoryUrl = ref('')
let teammateCounter = 1
const teammates = ref<TeamMemberDraft[]>([createTeammate()])
const defaultBranch = ref('main')
const restrictions = reactive<RepositoryRestrictions>({
  protectDefaultBranch: true,
  allowDirectPushes: false,
  requirePullRequest: true,
  requireApprovals: true,
  requirePassingChecks: true,
  requireSignedCommits: false,
  allowForcePushes: false,
  allowBranchDeletion: false,
})
const requiredApprovals = ref('1')
const projectMemoryEnabled = ref(true)
const memoryMaxCharacters = ref('1000')
const constitution = ref(`# Project constitution

## Mission
Describe what this project exists to achieve.

## Working agreements
- Keep changes small, reviewable, and easy to reverse.
- Explain important decisions in the repository.
- Prefer existing project conventions over introducing new ones.

## Quality bar
- Add tests for changed behaviour.
- Keep documentation current.
- Never commit credentials or personal data.
`)
const mcpSearch = ref('')
const connectedMcpIds = ref<string[]>([])
const creating = ref(false)
const panelRoot = ref<HTMLElement | null>(null)
const questionRoot = ref<HTMLElement | null>(null)
const teamRoot = ref<HTMLElement | null>(null)
const navigationBounds = reactive({ left: 0, width: 0 })
const localKey = 'looping-louie:project-builder-draft:v1'
let draftReady = false
let questionResizeObserver: ResizeObserver | undefined

const permissionOptions = [
  { value: 'read', label: 'Read' },
  { value: 'write', label: 'Write' },
  { value: 'maintain', label: 'Maintain' },
  { value: 'admin', label: 'Admin' },
]

const mcpOptions: McpOption[] = [
  { id: 'slack', name: 'Slack', category: 'Team conversations', logoSrc: 'https://cdn.simpleicons.org/slack/292F33' },
  { id: 'salesforce', name: 'Salesforce', category: 'Customer relationship management', logoSrc: 'https://cdn.simpleicons.org/salesforce/292F33' },
  { id: 'sharepoint', name: 'SharePoint', category: 'Project knowledge', logoSrc: 'https://cdn.simpleicons.org/microsoftsharepoint/292F33' },
  { id: 'google-drive', name: 'Google Drive', category: 'Shared files', logoSrc: 'https://cdn.simpleicons.org/googledrive/292F33' },
  { id: 'github', name: 'GitHub', category: 'Repository activity', logoSrc: 'https://cdn.simpleicons.org/github/292F33' },
  { id: 'jira', name: 'Jira', category: 'Issues and delivery', logoSrc: 'https://cdn.simpleicons.org/jira/292F33' },
]
const keyIconPath = 'M216.57,39.43A80,80,0,0,0,83.91,120.78L28.69,176A15.86,15.86,0,0,0,24,187.31V216a16,16,0,0,0,16,16H72a8,8,0,0,0,8-8V208H96a8,8,0,0,0,8-8V184h16a8,8,0,0,0,5.66-2.34l9.56-9.57A79.73,79.73,0,0,0,160,176h.1A80,80,0,0,0,216.57,39.43ZM224,98.1c-1.09,34.09-29.75,61.86-63.89,61.9H160a63.7,63.7,0,0,1-23.65-4.51,8,8,0,0,0-8.84,1.68L116.69,168H96a8,8,0,0,0-8,8v16H72a8,8,0,0,0-8,8v16H40V187.31l58.83-58.82a8,8,0,0,0,1.68-8.84A63.72,63.72,0,0,1,96,95.92c0-34.14,27.81-62.8,61.9-63.89A64,64,0,0,1,224,98.1ZM192,76a12,12,0,1,1-12-12A12,12,0,0,1,192,76Z'

const restrictionDefinitions: Array<{ id: RestrictionKey; title: string; description: string }> = [
  { id: 'protectDefaultBranch', title: 'Protect the default branch', description: 'Apply these safeguards to the main working branch.' },
  { id: 'allowDirectPushes', title: 'Allow direct pushes to main or master', description: 'Let contributors bypass pull requests on the default branch.' },
  { id: 'requirePullRequest', title: 'Require a pull request', description: 'Changes must be proposed on a separate branch before merging.' },
  { id: 'requireApprovals', title: 'Require approvals', description: 'A minimum number of teammates must approve each pull request.' },
  { id: 'requirePassingChecks', title: 'Require passing checks', description: 'Tests and required status checks must pass before merge.' },
  { id: 'requireSignedCommits', title: 'Require signed commits', description: 'Only accept commits whose authorship can be verified.' },
  { id: 'allowForcePushes', title: 'Allow force pushes', description: 'Permit rewriting branch history after it has been shared.' },
  { id: 'allowBranchDeletion', title: 'Allow branch deletion', description: 'Let merged or inactive branches be removed from the repository.' },
]

const stepIndex = computed(() => stepOrder.indexOf(step.value))
const isLastStep = computed(() => stepIndex.value === stepOrder.length - 1)
const navigationStyle = computed(() => navigationBounds.width
  ? { left: `${navigationBounds.left}px`, width: `${navigationBounds.width}px` }
  : undefined)
const restrictionItems = computed(() => restrictionDefinitions.map(item => ({
  ...item,
  checked: restrictions[item.id],
  actionLabel: item.title,
  ariaLabel: `${item.title}: ${restrictions[item.id] ? 'enabled' : 'disabled'}`,
})))
const memoryItems = computed(() => [{
  id: 'projectMemory',
  title: 'Project memory',
  description: 'Keep shared context available to every agent working in this project.',
  checked: projectMemoryEnabled.value,
  actionLabel: 'Project memory',
  ariaLabel: `Project memory: ${projectMemoryEnabled.value ? 'enabled' : 'disabled'}`,
}])
const filteredMcps = computed(() => {
  const query = mcpSearch.value.trim().toLocaleLowerCase()
  if (!query) return mcpOptions
  return mcpOptions.filter(option => `${option.name} ${option.category}`.toLocaleLowerCase().includes(query))
})
const teammateItems = computed(() => teammates.value.map(member => ({ id: member.id })))

function isProjectBuilderStep(value: unknown): value is ProjectBuilderStep {
  return typeof value === 'string' && stepOrder.includes(value as ProjectBuilderStep)
}

function createTeammate(): TeamMemberDraft {
  const member = { id: `teammate-${teammateCounter}`, email: '', permission: 'read' as const }
  teammateCounter += 1
  return member
}

function permissionLabel(permission: ProjectPermission) {
  return permissionOptions.find(option => option.value === permission)?.label ?? 'Read'
}

function teammateEmail(id: string) {
  return teammates.value.find(member => member.id === id)?.email ?? ''
}

function teammatePermission(id: string): ProjectPermission {
  return teammates.value.find(member => member.id === id)?.permission ?? 'read'
}

function updateTeammateEmail(id: string, email: string) {
  const member = teammates.value.find(candidate => candidate.id === id)
  if (member) member.email = email
}

function updateTeammatePermission(id: string, permission: string | string[]) {
  if (typeof permission !== 'string' || !permissionOptions.some(option => option.value === permission)) return
  const member = teammates.value.find(candidate => candidate.id === id)
  if (member) member.permission = permission as ProjectPermission
}

async function addTeammate() {
  teammates.value.push(createTeammate())
  await nextTick()
  teamRoot.value?.querySelectorAll<HTMLInputElement>('input[type="email"]')?.item(teammates.value.length - 1)?.focus()
}

function removeTeammate(id: string) {
  teammates.value = teammates.value.filter(member => member.id !== id)
}

function updateRestriction(item: { id: string }, value: boolean) {
  if (item.id in restrictions) restrictions[item.id as RestrictionKey] = value
}

function updateMemory(_item: { id: string }, value: boolean) {
  projectMemoryEnabled.value = value
}

function setMcpConnected(id: string, connected: boolean) {
  connectedMcpIds.value = connected
    ? [...new Set([...connectedMcpIds.value, id])]
    : connectedMcpIds.value.filter(candidate => candidate !== id)
}

async function focusCurrentStep() {
  await nextTick()
  panelRoot.value?.querySelector<HTMLElement>('[data-step-autofocus], input, textarea, button:not(:disabled)')?.focus()
}

async function goTo(next: ProjectBuilderStep) {
  if (next === step.value) return
  step.value = next
  saveLocalDraft()
  await router.replace({ query: { ...route.query, step: next } })
  if (import.meta.client) window.scrollTo({ top: 0, behavior: 'smooth' })
  await focusCurrentStep()
  measureNavigation()
}

async function goBack() {
  const previous = stepOrder[stepIndex.value - 1]
  if (previous) await goTo(previous)
}

async function goForward() {
  const next = stepOrder[stepIndex.value + 1]
  if (next) await goTo(next)
}

async function createProject() {
  if (creating.value) return
  creating.value = true
  if (import.meta.client) localStorage.removeItem(localKey)
  await router.push('/projects')
}

function saveLocalDraft() {
  if (!import.meta.client || !draftReady) return
  localStorage.setItem(localKey, JSON.stringify({
    step: step.value,
    projectName: projectName.value,
    projectDescription: projectDescription.value,
    repositoryUrl: repositoryUrl.value,
    teammates: teammates.value,
    defaultBranch: defaultBranch.value,
    restrictions: { ...restrictions },
    requiredApprovals: requiredApprovals.value,
    projectMemoryEnabled: projectMemoryEnabled.value,
    memoryMaxCharacters: memoryMaxCharacters.value,
    constitution: constitution.value,
    connectedMcpIds: connectedMcpIds.value,
    updatedAt: new Date().toISOString(),
  }))
}

function restoreLocalDraft() {
  if (!import.meta.client) return
  const raw = localStorage.getItem(localKey)
  if (!raw) return
  try {
    const draft = JSON.parse(raw) as Record<string, unknown>
    projectName.value = typeof draft.projectName === 'string' ? draft.projectName : ''
    projectDescription.value = typeof draft.projectDescription === 'string' ? draft.projectDescription : ''
    repositoryUrl.value = typeof draft.repositoryUrl === 'string' ? draft.repositoryUrl : ''
    defaultBranch.value = typeof draft.defaultBranch === 'string' ? draft.defaultBranch : 'main'
    requiredApprovals.value = typeof draft.requiredApprovals === 'string' ? draft.requiredApprovals : '1'
    projectMemoryEnabled.value = typeof draft.projectMemoryEnabled === 'boolean' ? draft.projectMemoryEnabled : true
    memoryMaxCharacters.value = typeof draft.memoryMaxCharacters === 'string' ? draft.memoryMaxCharacters : '1000'
    constitution.value = typeof draft.constitution === 'string' ? draft.constitution : constitution.value

    if (Array.isArray(draft.teammates)) {
      teammates.value = draft.teammates.flatMap((candidate) => {
        if (!candidate || typeof candidate !== 'object') return []
        const member = candidate as Record<string, unknown>
        const permission = permissionOptions.some(option => option.value === member.permission)
          ? member.permission as ProjectPermission
          : 'read'
        return [{
          id: createTeammate().id,
          email: typeof member.email === 'string' ? member.email : '',
          permission,
        }]
      })
    }

    if (draft.restrictions && typeof draft.restrictions === 'object') {
      const savedRestrictions = draft.restrictions as Record<string, unknown>
      restrictionDefinitions.forEach(({ id }) => {
        if (typeof savedRestrictions[id] === 'boolean') restrictions[id] = savedRestrictions[id]
      })
    }

    connectedMcpIds.value = Array.isArray(draft.connectedMcpIds)
      ? draft.connectedMcpIds.filter((id): id is string => typeof id === 'string' && mcpOptions.some(option => option.id === id))
      : []
    if (!isProjectBuilderStep(route.query.step) && isProjectBuilderStep(draft.step)) step.value = draft.step
  } catch {
    localStorage.removeItem(localKey)
  }
}

function isInteractiveTarget(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest('input, textarea, select, button, a, [contenteditable="true"], [role="menu"], [role="listbox"]'))
}

function onPanelKeydown(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
    event.preventDefault()
    if (isLastStep.value) void createProject()
    else void goForward()
  }
}

function onBuilderKeydown(event: KeyboardEvent) {
  if (event.defaultPrevented || event.repeat || isInteractiveTarget(event.target)) return
  if (event.key === 'ArrowUp' && stepIndex.value > 0) {
    event.preventDefault()
    void goBack()
  } else if (event.key === 'ArrowDown' && !isLastStep.value) {
    event.preventDefault()
    void goForward()
  }
}

function measureNavigation() {
  if (!questionRoot.value) return
  const bounds = questionRoot.value.getBoundingClientRect()
  navigationBounds.left = bounds.left
  navigationBounds.width = bounds.width
}

watch(() => route.query.step, async (requestedStep) => {
  if (!isProjectBuilderStep(requestedStep) || requestedStep === step.value) return
  step.value = requestedStep
  await focusCurrentStep()
  measureNavigation()
})

watch([
  step,
  projectName,
  projectDescription,
  repositoryUrl,
  teammates,
  defaultBranch,
  restrictions,
  requiredApprovals,
  projectMemoryEnabled,
  memoryMaxCharacters,
  constitution,
  connectedMcpIds,
], saveLocalDraft, { deep: true })

onMounted(async () => {
  restoreLocalDraft()
  draftReady = true
  document.addEventListener('keydown', onBuilderKeydown)
  window.addEventListener('resize', measureNavigation)
  questionResizeObserver = new ResizeObserver(measureNavigation)
  if (questionRoot.value) questionResizeObserver.observe(questionRoot.value)
  await focusCurrentStep()
  measureNavigation()
})

onBeforeUnmount(() => {
  questionResizeObserver?.disconnect()
  document.removeEventListener('keydown', onBuilderKeydown)
  window.removeEventListener('resize', measureNavigation)
})

definePageMeta({ layout: 'app' })
useHead({ title: 'Create a project · Looping Louie' })
</script>

<template>
  <WizardShell :steps="steps" :current="stepIndex" class="project-builder">
    <main ref="questionRoot" class="project-builder__question">
      <UiBreadcrumb
        :items="[{ label: 'Projects', to: '/projects' }, { label: 'Create new project' }]"
        class="project-builder__breadcrumb"
      />

      <Transition name="builder-question" mode="out-in" @after-enter="focusCurrentStep">
        <section
          v-if="step === 'basics'"
          ref="panelRoot"
          key="basics"
          class="builder-panel"
          @keydown="onPanelKeydown"
        >
          <div class="builder-panel__heading">
            <h1>Start with the project basics</h1>
            <p>Name the work, explain its purpose, and point the project at its source repository.</p>
          </div>

          <div class="builder-field-stage">
            <UiCollectionGroupTitle title="Name" heading-as="h2" />
            <UiSectionStage inverse="bottom">
              <UiTextField
                v-model="projectName"
                data-step-autofocus
                label="Project name"
                hide-label
                placeholder="e.g. Customer portal"
              />
            </UiSectionStage>
          </div>

          <div class="builder-field-stage">
            <UiCollectionGroupTitle title="Description" heading-as="h2" />
            <UiSectionStage inverse="bottom">
              <UiTextField
                v-model="projectDescription"
                label="Project description"
                hide-label
                multiline
                :rows="5"
                placeholder="Explain what the project is for and what success looks like…"
              />
            </UiSectionStage>
          </div>

          <div class="builder-field-stage">
            <UiCollectionGroupTitle title="Repository" heading-as="h2" />
            <UiSectionStage inverse="bottom">
              <UiTextField
                v-model="repositoryUrl"
                label="Repository URL"
                hide-label
                type="url"
                inputmode="url"
                autocomplete="url"
                placeholder="https://github.com/your-team/project"
                hint="GitHub, GitLab, Bitbucket, or any Git-compatible repository URL."
              />
            </UiSectionStage>
          </div>
        </section>

        <section
          v-else-if="step === 'team'"
          ref="panelRoot"
          key="team"
          class="builder-panel"
          @keydown="onPanelKeydown"
        >
          <div class="builder-panel__heading">
            <h1>Who should have access?</h1>
            <p>Invite teammates by email and decide what each person can do inside this project.</p>
          </div>

          <div class="builder-field-stage">
            <UiCollectionGroupTitle
              :title="`${teammates.length} ${teammates.length === 1 ? 'invitation' : 'invitations'}`"
              heading-as="h2"
            />
            <UiSectionStage inverse="bottom">
              <div ref="teamRoot" class="team-editor">
                <UiGridList
                  v-if="teammates.length"
                  :items="teammateItems"
                  class="team-editor__list"
                  aria-label="Project teammate invitations"
                >
                  <template #leading="{ item }">
                    <UiTextField
                      :model-value="teammateEmail(item.id)"
                      :data-step-autofocus="item.id === teammates[0]?.id ? '' : undefined"
                      label="Teammate"
                      type="email"
                      inputmode="email"
                      autocomplete="email"
                      placeholder="name@company.com"
                      @update:model-value="updateTeammateEmail(item.id, $event)"
                    />
                  </template>

                  <template #metadata="{ item }">
                    <div class="team-permission">
                      <span class="team-permission__label">Permission</span>
                      <span class="team-permission__control">
                        <UiPill
                          :model-value="teammatePermission(item.id)"
                          clickable
                          selection-type="radio"
                          :options="permissionOptions"
                          :aria-label="`Permission: ${permissionLabel(teammatePermission(item.id))}`"
                          dropdown-label="Project permission"
                          @update:model-value="updateTeammatePermission(item.id, $event)"
                        >
                          <template #icon>
                            <svg viewBox="0 0 256 256" fill="currentColor" focusable="false">
                              <path d="M208,40H48A16,16,0,0,0,32,56V200a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V56A16,16,0,0,0,208,40Zm0,160H48V56H208V200ZM96,112a8,8,0,0,1,8-8h48a8,8,0,0,1,0,16H104A8,8,0,0,1,96,112Zm0,32a8,8,0,0,1,8-8h48a8,8,0,0,1,0,16H104A8,8,0,0,1,96,144Z" />
                            </svg>
                          </template>
                          {{ permissionLabel(teammatePermission(item.id)) }}
                        </UiPill>
                      </span>
                    </div>
                  </template>

                  <template #trailing="{ item }">
                    <UiButton
                      variant="coral"
                      size="sm"
                      icon-only
                      aria-label="Remove teammate"
                      @click="removeTeammate(item.id)"
                    >
                      <template #leading>
                        <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
                          <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z" />
                        </svg>
                      </template>
                    </UiButton>
                  </template>
                </UiGridList>

                <p v-if="!teammates.length" class="team-editor__empty">No teammates invited yet. You can also continue on your own.</p>

                <div class="team-editor__actions">
                  <UiButton variant="secondary" @click="addTeammate">
                    <template #leading>
                      <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
                        <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm48-88a8,8,0,0,1-8,8H136v32a8,8,0,0,1-16,0V136H88a8,8,0,0,1,0-16h32V88a8,8,0,0,1,16,0v32h32A8,8,0,0,1,176,128Z" />
                      </svg>
                    </template>
                    Add another
                  </UiButton>
                </div>
              </div>
            </UiSectionStage>
          </div>
        </section>

        <section
          v-else-if="step === 'repository'"
          ref="panelRoot"
          key="repository"
          class="builder-panel"
          @keydown="onPanelKeydown"
        >
          <div class="builder-panel__heading">
            <h1>Set repository guardrails</h1>
            <p>Choose how changes reach the default branch and what every contributor must satisfy.</p>
          </div>

          <div class="builder-field-stage">
            <UiCollectionGroupTitle title="Repository rules" heading-as="h2" />
            <UiSectionStage inverse="bottom">
              <div class="repository-settings">
                <UiTextField
                  v-model="defaultBranch"
                  data-step-autofocus
                  label="Default branch"
                  placeholder="main"
                  hint="The branch these protections apply to."
                />

                <UiGridList
                  :items="restrictionItems"
                  variant="key-value"
                  action="toggle"
                  aria-label="Repository restrictions"
                  @toggle="updateRestriction"
                >
                  <template #leading="{ item }"><h4>{{ item.title }}</h4></template>
                  <template #metadata="{ item }"><span>{{ item.description }}</span></template>
                </UiGridList>

                <label v-if="restrictions.requireApprovals" class="number-setting">
                  <span class="number-setting__copy">
                    <strong>Minimum approvals</strong>
                    <small>Required before a pull request can merge.</small>
                  </span>
                  <input v-model="requiredApprovals" type="number" min="1" max="10" inputmode="numeric">
                </label>
              </div>
            </UiSectionStage>
          </div>

          <div class="builder-field-stage">
            <UiCollectionGroupTitle title="Shared project memory" heading-as="h2" />
            <UiSectionStage inverse="bottom">
              <div class="repository-settings">
                <UiGridList
                  :items="memoryItems"
                  variant="key-value"
                  action="toggle"
                  aria-label="Project memory settings"
                  @toggle="updateMemory"
                >
                  <template #leading="{ item }"><h4>{{ item.title }}</h4></template>
                  <template #metadata="{ item }"><span>{{ item.description }}</span></template>
                </UiGridList>

                <label v-if="projectMemoryEnabled" class="number-setting">
                  <span class="number-setting__copy">
                    <strong>Maximum memory size</strong>
                    <small>Upper limit for stored shared context.</small>
                  </span>
                  <span class="number-setting__value">
                    <input v-model="memoryMaxCharacters" type="number" min="1000" step="1000" inputmode="numeric">
                    <small>characters</small>
                  </span>
                </label>
              </div>
            </UiSectionStage>
          </div>
        </section>

        <section
          v-else-if="step === 'constitution'"
          ref="panelRoot"
          key="constitution"
          class="builder-panel"
          @keydown="onPanelKeydown"
        >
          <div class="builder-panel__heading">
            <h1>Write the project constitution</h1>
            <p>Give every person and agent one shared source of truth for how work should happen.</p>
          </div>

          <div class="builder-field-stage">
            <UiCollectionGroupTitle title="Info" heading-as="h2">
              <span class="constitution-info-title">
                <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
                  <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm-8-80V112a8,8,0,0,1,16,0v64a8,8,0,0,1-16,0Zm20-52a12,12,0,1,1-12-12A12,12,0,0,1,140,84Z" />
                </svg>
                Info
              </span>
            </UiCollectionGroupTitle>
            <UiSectionStage inverse="bottom">
              <div class="constitution-explainer">
                <p><code>constitution.md</code> works like one repository-wide <code>AGENTS.md</code> shared by every user and agent in the project.</p>
                <ul>
                  <li>It defines principles, constraints, and the expected quality bar.</li>
                  <li>Its instructions apply consistently across the entire repository.</li>
                  <li>Project-specific files can add context without contradicting this shared foundation.</li>
                </ul>
              </div>
            </UiSectionStage>
          </div>

          <div class="builder-field-stage builder-field-stage--constitution">
            <UiCollectionGroupTitle title="constitution.md" heading-as="h2" />
            <UiSectionStage inverse="bottom">
              <UiTextField
                v-model="constitution"
                data-step-autofocus
                class="constitution-editor"
                label="Project constitution"
                hide-label
                multiline
                :rows="18"
                placeholder="# Project constitution\n\nDescribe the shared rules for this repository…"
                hint="Markdown is supported. These instructions will apply to the whole project."
              />
            </UiSectionStage>
          </div>
        </section>

        <section
          v-else
          ref="panelRoot"
          key="plugins"
          class="builder-panel"
          @keydown="onPanelKeydown"
        >
          <div class="builder-panel__heading">
            <h1>Connect project tools</h1>
            <p>Add optional MCP integrations so agents can work with the services your team already uses.</p>
          </div>

          <div class="builder-field-stage">
            <UiCollectionGroupTitle title="Available MCPs" heading-as="h2" />
            <UiSectionStage inverse="bottom">
              <div class="mcp-catalog">
                <UiTextField
                  v-model="mcpSearch"
                  data-step-autofocus
                  label="Search MCPs"
                  hide-label
                  type="search"
                  autocomplete="off"
                  placeholder="Search MCPs…"
                />

                <div v-if="filteredMcps.length" class="mcp-catalog__grid" aria-live="polite">
                  <UiPill
                    v-for="mcp in filteredMcps"
                    :key="mcp.id"
                    class="mcp-option"
                    variant="catalog"
                    :src="mcp.logoSrc"
                    alt=""
                    :description="mcp.category"
                    toggle
                    :toggle-value="connectedMcpIds.includes(mcp.id)"
                    :toggle-label="`${connectedMcpIds.includes(mcp.id) ? 'Disconnect' : 'Connect'} ${mcp.name}`"
                    :action-icon-path="keyIconPath"
                    :action-label="`Configure credentials for ${mcp.name}`"
                    action-visibility="always"
                    @update:toggle-value="setMcpConnected(mcp.id, $event)"
                  >
                    {{ mcp.name }}
                  </UiPill>
                </div>
                <p v-else class="mcp-catalog__empty">No MCPs match “{{ mcpSearch }}”.</p>
              </div>
            </UiSectionStage>
          </div>
        </section>
      </Transition>

      <nav class="builder-navigation" :style="navigationStyle" aria-label="Form steps">
        <UiButton
          class="builder-navigation__back"
          variant="secondary"
          :disabled="stepIndex === 0"
          @click="goBack"
        >
          Back <kbd aria-hidden="true">↑</kbd>
        </UiButton>
        <UiButton
          v-if="!isLastStep"
          class="builder-navigation__continue"
          @click="goForward"
        >
          Continue <kbd aria-hidden="true">↓</kbd>
        </UiButton>
        <UiButton
          v-else
          class="builder-navigation__continue"
          :loading="creating"
          @click="createProject"
        >
          Create project <kbd aria-hidden="true">Ctrl/⌘ ↵</kbd>
        </UiButton>
      </nav>
    </main>
  </WizardShell>
</template>

<style scoped>
.project-builder__question {
  max-width: 52rem;
  min-width: 0;
  padding-bottom: 7rem;
}

.project-builder__breadcrumb { margin-bottom: var(--ll-space-5); }

.builder-panel {
  display: grid;
  gap: var(--ll-space-6);
}

.builder-panel__heading {
  display: grid;
  max-width: 48rem;
  gap: var(--ll-space-3);
}

.builder-panel__heading h1 {
  max-width: 18ch;
  margin: 0;
  color: var(--ll-color-ink);
  font: 550 clamp(2rem, 4vw, 3.5rem) / 1.02 var(--ll-font-display);
  letter-spacing: -0.04em;
}

.builder-panel__heading p {
  max-width: 42rem;
  margin: 0;
  color: var(--ll-color-text-muted);
  font-size: 1.05rem;
  line-height: 1.55;
}

.builder-field-stage { min-width: 0; }
.builder-panel :deep(.ui-section-stage__shell) { width: 100%; margin-inline: 0; }

.team-editor,
.repository-settings,
.mcp-catalog {
  display: grid;
  gap: var(--ll-space-5);
}

.team-editor__list :deep(.ui-grid-list__item) {
  grid-template-columns: minmax(0, 1fr) minmax(10rem, 0.55fr) auto;
  align-items: end;
}

.team-editor__list :deep(.ui-grid-list__metadata) { display: block; }

.team-permission {
  display: grid;
  gap: var(--ll-space-2);
}

.team-permission__label {
  color: var(--ll-color-ink);
  font: 600 var(--ll-text-sm) / 1.2 var(--ll-font-control);
}

.team-permission__control {
  display: flex;
  height: 3rem;
  align-items: center;
}

.team-editor__list :deep(.ui-grid-list__trailing) { align-self: end; padding-bottom: 0.4375rem; }
.team-editor__actions { display: flex; justify-content: flex-start; }
.team-editor__empty { margin: 0; padding: var(--ll-space-6); color: var(--ll-color-text-muted); text-align: center; }

.repository-settings > :deep(.ui-grid-list) {
  padding-top: var(--ll-space-2);
  border-top: 1px solid var(--ll-color-divider);
}

.repository-settings :deep(.ui-grid-list--key-value .ui-grid-list__item) { align-items: center; }
.repository-settings :deep(.ui-grid-list--key-value .ui-grid-list__leading),
.repository-settings :deep(.ui-grid-list--key-value .ui-grid-list__trailing) { padding-block: 0; }
.repository-settings :deep(.ui-grid-list--key-value .ui-grid-list__metadata) { align-items: center; }

.number-setting {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ll-space-6);
  padding: var(--ll-space-4) var(--ll-space-5);
  background: var(--ll-color-card);
  border: 1px solid var(--ll-color-divider);
  border-radius: var(--ui-surface-radius, var(--ll-radius-structural));
}

.number-setting__copy { display: grid; gap: var(--ll-space-1); }
.number-setting__copy strong { color: var(--ll-color-ink); font-size: var(--ll-text-md); }
.number-setting__copy small,
.number-setting__value small { color: var(--ll-color-text-muted); font-size: var(--ll-text-xs); }
.number-setting__value { display: flex; align-items: center; gap: var(--ll-space-2); }

.number-setting input {
  width: 6rem;
  height: 2.5rem;
  box-sizing: border-box;
  padding-inline: var(--ll-space-3);
  color: var(--ll-color-ink);
  background: var(--ll-color-canvas);
  border: 1px solid var(--ll-color-divider);
  border-radius: var(--ll-radius-sm);
  font: 600 var(--ll-text-sm) / 1 var(--ll-font-mono);
  text-align: right;
}

.number-setting input:focus-visible {
  border-color: var(--ll-color-primary);
  outline: 2px solid var(--ll-color-primary);
  outline-offset: 2px;
}

.constitution-explainer {
  color: var(--ll-color-text);
  font-size: var(--ll-text-md);
  line-height: 1.65;
}

.constitution-explainer p { margin: 0 0 var(--ll-space-4); }
.constitution-explainer ul { padding-left: 1.4rem; margin: 0; }
.constitution-explainer li + li { margin-top: var(--ll-space-2); }
.constitution-explainer code { color: var(--ll-color-ink); font-family: var(--ll-font-mono); }
.constitution-info-title { display: inline-flex; align-items: center; gap: var(--ll-space-2); }
.constitution-info-title svg { width: 1rem; height: 1rem; flex: 0 0 1rem; }
.constitution-editor :deep(.ui-text-field__control) { font-family: var(--ll-font-mono); font-size: var(--ll-text-sm); }

.mcp-catalog__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--ll-space-3);
}

.mcp-option :deep(.ui-icon-pill__media--image) { background: var(--ll-color-metal-025); }
.mcp-option :deep(.ui-icon-pill__media--image img) { box-sizing: border-box; padding: 0.55rem; object-fit: contain; }
.mcp-catalog__empty { margin: 0; padding: var(--ll-space-8); color: var(--ll-color-text-muted); text-align: center; }

.builder-navigation {
  position: fixed;
  z-index: 40;
  bottom: var(--ll-space-4);
  display: flex;
  box-sizing: border-box;
  align-items: center;
  justify-content: space-between;
  gap: var(--ll-space-4);
  padding-block: var(--ll-space-8) max(var(--ll-space-3), env(safe-area-inset-bottom));
  background: linear-gradient(180deg, transparent 0, color-mix(in srgb, var(--ll-color-canvas) 94%, transparent) 28%, var(--ll-color-canvas) 58%);
}

.builder-navigation__back :deep(.ui-button__label),
.builder-navigation__continue :deep(.ui-button__label) { display: inline-flex; align-items: center; line-height: 1; }

.builder-navigation kbd {
  display: inline-grid;
  min-width: 1.35rem;
  height: 1.35rem;
  box-sizing: border-box;
  place-items: center;
  padding-inline: 0.3rem;
  margin-left: var(--ll-space-2);
  color: currentColor;
  background: color-mix(in srgb, currentColor 8%, transparent);
  border: 1px solid color-mix(in srgb, currentColor 22%, transparent);
  border-radius: var(--ll-radius-sm);
  font: 600 0.6875rem / 1 var(--ll-font-mono);
  box-shadow: 0 1px 0 color-mix(in srgb, currentColor 20%, transparent);
  white-space: nowrap;
}

.builder-question-enter-active,
.builder-question-leave-active { transition: opacity 150ms ease, transform 180ms var(--ll-ease-out); }
.builder-question-enter-from { opacity: 0; transform: translateY(0.75rem); }
.builder-question-leave-to { opacity: 0; transform: translateY(-0.5rem); }

@media (max-width: 48rem) {
  .mcp-catalog__grid { grid-template-columns: 1fr; }
}

@media (max-width: 44rem) {
  .team-editor__list :deep(.ui-grid-list__item) { align-items: start; }
  .team-editor__list :deep(.ui-grid-list__metadata) { display: block; }
  .team-editor__list :deep(.ui-grid-list__trailing) { align-self: center; padding-bottom: 0; }
}

@media (max-width: 34rem) {
  .builder-navigation { bottom: 0; }
  .number-setting { align-items: flex-start; flex-direction: column; }
  .number-setting__value { width: 100%; }
}

@media (prefers-reduced-motion: reduce) {
  .builder-question-enter-active,
  .builder-question-leave-active,
  .mcp-option { transition: none; }
}
</style>
