<script setup lang="ts">
import SettingsPageShell from '~/components/settings/SettingsPageShell.vue'
import UiButton from '~/components/ui/Button.vue'
import UiModal from '~/components/ui/Modal.vue'
import UiTextField from '~/components/ui/TextField.vue'
import type {
  PersonalAccessTokenCreatedResponse,
  PersonalAccessTokenResponse,
} from '~/types/api'
import { apiErrorMessage } from '~/utils/api/errors'

definePageMeta({ layout: 'app' })
useHead({ title: 'Personal tokens · Looping Louie' })

const api = useApiClient()
const notifications = useNotifications()
const name = ref('')
const expiresAt = ref(defaultExpiryDate())
const neverExpires = ref(false)
const creating = ref(false)
const creationError = ref('')
const revokingTokenId = ref<string | null>(null)
const issuedToken = ref<PersonalAccessTokenCreatedResponse | null>(null)
const copying = ref(false)

const {
  data: tokens,
  status,
  error,
  refresh,
} = await useAsyncData(
  'personal-access-tokens',
  () => api.authentication.listPersonalAccessTokens(),
)

async function createToken() {
  if (creating.value) return
  creating.value = true
  creationError.value = ''
  try {
    const token = await api.authentication.createPersonalAccessToken({
      name: name.value,
      expires_at: neverExpires.value ? null : `${expiresAt.value}T23:59:59Z`,
    })
    tokens.value = [token, ...(tokens.value ?? [])]
    issuedToken.value = token
    name.value = ''
    expiresAt.value = defaultExpiryDate()
    neverExpires.value = false
  } catch (cause) {
    creationError.value = apiErrorMessage(
      cause,
      'The personal token could not be created.',
    )
  } finally {
    creating.value = false
  }
}

async function revokeToken(token: PersonalAccessTokenResponse) {
  if (revokingTokenId.value) return
  revokingTokenId.value = token.id
  try {
    await api.authentication.revokePersonalAccessToken(token.id)
    tokens.value = (tokens.value ?? []).map(candidate => (
      candidate.id === token.id
        ? { ...candidate, revoked_at: new Date().toISOString() }
        : candidate
    ))
    notifications.success('Token revoked', `${token.name} can no longer access the API.`)
  } catch (cause) {
    notifications.error(
      'Token wasn’t revoked',
      apiErrorMessage(cause, 'The personal token could not be revoked.'),
    )
  } finally {
    revokingTokenId.value = null
  }
}

async function copyToken() {
  if (!issuedToken.value || copying.value) return
  copying.value = true
  try {
    await navigator.clipboard.writeText(issuedToken.value.token)
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

function tokenStatus(token: PersonalAccessTokenResponse) {
  if (token.revoked_at) return 'Revoked'
  if (token.expires_at && new Date(token.expires_at) <= new Date()) return 'Expired'
  return 'Active'
}
</script>

<template>
  <SettingsPageShell>
    <div v-if="status === 'pending' || status === 'idle'" class="token-state" role="status">
      Loading personal tokens…
    </div>
    <div v-else-if="status === 'error'" class="token-state token-state--error" role="alert">
      <span>{{ apiErrorMessage(error, 'Personal tokens could not be loaded.') }}</span>
      <UiButton variant="stroke" size="sm" @click="() => refresh()">Retry</UiButton>
    </div>
    <div v-else class="token-settings">
      <section class="token-settings__section">
        <div>
          <h2>Create personal token</h2>
          <p>Use this token for Postman, scripts, CI, or other headless API access. It will be shown once.</p>
        </div>
        <form class="token-create-form" @submit.prevent="createToken">
          <UiTextField v-model="name" label="Token name" autocomplete="off" required />
          <UiTextField
            v-model="expiresAt"
            label="Expiry date"
            type="date"
            :disabled="neverExpires"
            :required="!neverExpires"
          />
          <label class="token-never-expires">
            <input v-model="neverExpires" type="checkbox">
            Never expires
          </label>
          <p v-if="creationError" class="token-error" role="alert">{{ creationError }}</p>
          <UiButton type="submit" :loading="creating">Create token</UiButton>
        </form>
      </section>

      <section class="token-settings__section">
        <div>
          <h2>Personal tokens</h2>
          <p>Revoking a token takes effect immediately and cannot be undone.</p>
        </div>
        <ul class="token-list">
          <li v-for="token in tokens" :key="token.id" class="token-list__item">
            <div>
              <strong>{{ token.name }}</strong>
              <span>
                {{ tokenStatus(token) }} · Created {{ formatDate(token.created_at) }}
                · Expires {{ formatDate(token.expires_at) }}
                · Last used {{ token.last_used_at ? formatDate(token.last_used_at) : 'Never' }}
              </span>
            </div>
            <UiButton
              v-if="!token.revoked_at"
              size="sm"
              variant="coral"
              :loading="revokingTokenId === token.id"
              @click="revokeToken(token)"
            >Revoke</UiButton>
          </li>
        </ul>
      </section>
    </div>

    <UiModal
      :open="issuedToken !== null"
      title="Copy your personal token"
      description="This is the only time the full token will be shown. Store it in a password manager or secret store."
      :close-on-backdrop="false"
      @update:open="value => { if (!value) issuedToken = null }"
    >
      <code v-if="issuedToken" class="issued-token">{{ issuedToken.token }}</code>
      <template #actions>
        <UiButton variant="stroke" :loading="copying" @click="copyToken">Copy token</UiButton>
        <UiButton @click="issuedToken = null">I stored it securely</UiButton>
      </template>
    </UiModal>
  </SettingsPageShell>
</template>

<style scoped>
.token-settings { display: grid; gap: var(--ll-space-10); }
.token-settings__section { display: grid; gap: var(--ll-space-5); }
.token-settings h2, .token-settings p { margin: 0; }
.token-settings h2 { font: 600 var(--ll-text-lg) / 1.2 var(--ll-font-display); }
.token-settings p, .token-list__item span { color: var(--ll-color-text-muted); font: 400 var(--ll-text-sm) / 1.5 var(--ll-font-control); }
.token-create-form { display: grid; max-width: 32rem; gap: var(--ll-space-4); }
.token-never-expires { display: flex; align-items: center; gap: var(--ll-space-2); font: 500 var(--ll-text-sm) / 1.2 var(--ll-font-control); }
.token-error { color: var(--ll-color-brand) !important; }
.token-list { display: grid; margin: 0; padding: 0; border-top: 1px solid var(--ll-color-divider); list-style: none; }
.token-list__item { display: flex; align-items: center; justify-content: space-between; gap: var(--ll-space-5); padding: var(--ll-space-4) 0; border-bottom: 1px solid var(--ll-color-divider); }
.token-list__item > div { display: grid; gap: var(--ll-space-1); }
.token-state { display: flex; align-items: center; gap: var(--ll-space-4); min-height: 12rem; }
.token-state--error { color: var(--ll-color-brand); }
.issued-token { display: block; overflow-wrap: anywhere; padding: var(--ll-space-4); color: var(--ll-color-ink); background: var(--ll-color-metal-025); border: 1px solid var(--ll-color-divider); border-radius: var(--ll-radius-structural); font: 500 var(--ll-text-sm) / 1.5 var(--ll-font-mono); }
@media (max-width: 48rem) {
  .token-list__item { align-items: flex-start; flex-direction: column; }
}
</style>
