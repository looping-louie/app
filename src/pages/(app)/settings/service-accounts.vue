<script setup lang="ts">
import SettingsPageShell from '~/components/settings/SettingsPageShell.vue'
import UiButton from '~/components/ui/Button.vue'
import UiModal from '~/components/ui/Modal.vue'
import UiTextField from '~/components/ui/TextField.vue'
import type {
  ProjectResponse,
  ServiceAccountCreatedResponse,
  ServiceAccountResponse,
} from '~/types/api'
import { apiErrorMessage } from '~/utils/api/errors'

definePageMeta({ layout: 'app' })
useHead({ title: 'Service accounts · Looping Louie' })

const api = useApiClient()
const auth = useAuthSession()
const notifications = useNotifications()
const name = ref('')
const projectIds = ref<string[]>([])
const expiresAt = ref(defaultExpiryDate())
const neverExpires = ref(false)
const creating = ref(false)
const creationError = ref('')
const revokingAccountId = ref<string | null>(null)
const issuedAccount = ref<ServiceAccountCreatedResponse | null>(null)
const copying = ref(false)

if (auth.user.value?.role !== 'admin') {
  await navigateTo('/settings')
}

const {
  data,
  status,
  error,
  refresh,
} = await useAsyncData(
  'service-accounts',
  async () => ({
    accounts: await api.authentication.listServiceAccounts(),
    projects: await api.projects.list(),
  }),
)

const accounts = computed(() => data.value?.accounts ?? [])
const projects = computed(() => data.value?.projects ?? [])
const projectNames = computed(() => new Map(
  projects.value.map(project => [project.id, project.name]),
))

async function createServiceAccount() {
  if (creating.value) return
  creating.value = true
  creationError.value = ''
  try {
    const account = await api.authentication.createServiceAccount({
      name: name.value,
      project_ids: projectIds.value,
      expires_at: neverExpires.value ? null : `${expiresAt.value}T23:59:59Z`,
    })
    data.value = {
      accounts: [account, ...accounts.value],
      projects: projects.value,
    }
    issuedAccount.value = account
    name.value = ''
    projectIds.value = []
    expiresAt.value = defaultExpiryDate()
    neverExpires.value = false
  } catch (cause) {
    creationError.value = apiErrorMessage(
      cause,
      'The service account could not be created.',
    )
  } finally {
    creating.value = false
  }
}

async function revokeServiceAccount(account: ServiceAccountResponse) {
  if (revokingAccountId.value) return
  revokingAccountId.value = account.id
  try {
    await api.authentication.revokeServiceAccount(account.id)
    data.value = {
      accounts: accounts.value.map(candidate => (
        candidate.id === account.id
          ? { ...candidate, revoked_at: new Date().toISOString() }
          : candidate
      )),
      projects: projects.value,
    }
    notifications.success(
      'Service account revoked',
      `${account.name} can no longer authenticate a runtime.`,
    )
  } catch (cause) {
    notifications.error(
      'Service account wasn’t revoked',
      apiErrorMessage(cause, 'The service account could not be revoked.'),
    )
  } finally {
    revokingAccountId.value = null
  }
}

async function copyToken() {
  if (!issuedAccount.value || copying.value) return
  copying.value = true
  try {
    await navigator.clipboard.writeText(issuedAccount.value.token)
    notifications.success('Token copied', 'Store it securely before closing this dialog.')
  } catch {
    notifications.error(
      'Token wasn’t copied',
      'Copy the token manually and store it securely before closing this dialog.',
    )
  } finally {
    copying.value = false
  }
}

function defaultExpiryDate() {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() + 90)
  return date.toISOString().slice(0, 10)
}

function formatDate(value: string | null) {
  return value
    ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value))
    : 'Never'
}

function accountStatus(account: ServiceAccountResponse) {
  if (account.revoked_at) return 'Revoked'
  if (account.expires_at && new Date(account.expires_at) <= new Date()) return 'Expired'
  return 'Active'
}

function projectName(projectId: string) {
  return projectNames.value.get(projectId) ?? projectId
}
</script>

<template>
  <SettingsPageShell>
    <div v-if="status === 'pending' || status === 'idle'" class="service-account-state" role="status">
      Loading service accounts…
    </div>
    <div v-else-if="status === 'error'" class="service-account-state service-account-state--error" role="alert">
      <span>{{ apiErrorMessage(error, 'Service accounts could not be loaded.') }}</span>
      <UiButton variant="stroke" size="sm" @click="() => refresh()">Retry</UiButton>
    </div>
    <div v-else class="service-account-settings">
      <section class="service-account-settings__section">
        <div>
          <h2>Create service account</h2>
          <p>Use one account for each runtime deployment. It can access only the selected projects and its token will be shown once.</p>
        </div>
        <form class="service-account-create-form" @submit.prevent="createServiceAccount">
          <UiTextField v-model="name" label="Service account name" autocomplete="off" required />
          <fieldset class="project-selection">
            <legend>Accessible projects</legend>
            <p>Select every project this runtime deployment may execute.</p>
            <label v-for="project in projects" :key="project.id" class="project-selection__option">
              <input v-model="projectIds" type="checkbox" :value="project.id">
              {{ project.name }}
            </label>
          </fieldset>
          <UiTextField
            v-model="expiresAt"
            label="Expiry date"
            type="date"
            :disabled="neverExpires"
            :required="!neverExpires"
          />
          <label class="service-account-never-expires">
            <input v-model="neverExpires" type="checkbox">
            Never expires
          </label>
          <p v-if="creationError" class="service-account-error" role="alert">{{ creationError }}</p>
          <UiButton type="submit" :disabled="projectIds.length === 0" :loading="creating">
            Create service account
          </UiButton>
        </form>
      </section>

      <section class="service-account-settings__section">
        <div>
          <h2>Service accounts</h2>
          <p>Revoking a service account immediately stops its runtime from authenticating.</p>
        </div>
        <ul class="service-account-list">
          <li v-for="account in accounts" :key="account.id" class="service-account-list__item">
            <div>
              <strong>{{ account.name }}</strong>
              <span>
                {{ accountStatus(account) }} · Created {{ formatDate(account.created_at) }}
                · Expires {{ formatDate(account.expires_at) }}
                · Last used {{ account.last_used_at ? formatDate(account.last_used_at) : 'Never' }}
              </span>
              <span>Projects: {{ account.project_ids.map(projectName).join(', ') }}</span>
            </div>
            <UiButton
              v-if="!account.revoked_at"
              size="sm"
              variant="coral"
              :loading="revokingAccountId === account.id"
              @click="revokeServiceAccount(account)"
            >Revoke</UiButton>
          </li>
        </ul>
      </section>
    </div>

    <UiModal
      :open="issuedAccount !== null"
      title="Copy your service account token"
      description="This is the only time the full token will be shown. Store it in the runtime deployment’s secret store."
      :close-on-backdrop="false"
      @update:open="value => { if (!value) issuedAccount = null }"
    >
      <code v-if="issuedAccount" class="issued-service-account-token">{{ issuedAccount.token }}</code>
      <template #actions>
        <UiButton variant="stroke" :loading="copying" @click="copyToken">Copy token</UiButton>
        <UiButton @click="issuedAccount = null">I stored it securely</UiButton>
      </template>
    </UiModal>
  </SettingsPageShell>
</template>

<style scoped>
.service-account-settings { display: grid; gap: var(--ll-space-10); }
.service-account-settings__section { display: grid; gap: var(--ll-space-5); }
.service-account-settings h2, .service-account-settings p { margin: 0; }
.service-account-settings h2 { font: 600 var(--ll-text-lg) / 1.2 var(--ll-font-display); }
.service-account-settings p, .service-account-list__item span, .project-selection { color: var(--ll-color-text-muted); font: 400 var(--ll-text-sm) / 1.5 var(--ll-font-control); }
.service-account-create-form { display: grid; max-width: 32rem; gap: var(--ll-space-4); }
.project-selection { display: grid; gap: var(--ll-space-2); margin: 0; padding: var(--ll-space-4); border: 1px solid var(--ll-color-divider); border-radius: var(--ll-radius-structural); }
.project-selection legend { padding: 0 var(--ll-space-1); color: var(--ll-color-ink); font-weight: 600; }
.project-selection__option, .service-account-never-expires { display: flex; align-items: center; gap: var(--ll-space-2); color: var(--ll-color-ink); font: 500 var(--ll-text-sm) / 1.2 var(--ll-font-control); }
.service-account-error { color: var(--ll-color-brand) !important; }
.service-account-list { display: grid; margin: 0; padding: 0; border-top: 1px solid var(--ll-color-divider); list-style: none; }
.service-account-list__item { display: flex; align-items: center; justify-content: space-between; gap: var(--ll-space-5); padding: var(--ll-space-4) 0; border-bottom: 1px solid var(--ll-color-divider); }
.service-account-list__item > div { display: grid; gap: var(--ll-space-1); }
.service-account-state { display: flex; align-items: center; gap: var(--ll-space-4); min-height: 12rem; }
.service-account-state--error { color: var(--ll-color-brand); }
.issued-service-account-token { display: block; overflow-wrap: anywhere; padding: var(--ll-space-4); color: var(--ll-color-ink); background: var(--ll-color-metal-025); border: 1px solid var(--ll-color-divider); border-radius: var(--ll-radius-structural); font: 500 var(--ll-text-sm) / 1.5 var(--ll-font-mono); }
@media (max-width: 48rem) {
  .service-account-list__item { align-items: flex-start; flex-direction: column; }
}
</style>
