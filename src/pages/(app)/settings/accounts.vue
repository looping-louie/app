<script setup lang="ts">
import SettingsPageShell from '~/components/settings/SettingsPageShell.vue'
import UiButton from '~/components/ui/Button.vue'
import UiTextField from '~/components/ui/TextField.vue'
import type { LocalAccountResponse } from '~/types/api'
import { apiErrorMessage } from '~/utils/api/errors'

definePageMeta({ layout: 'app' })
useHead({ title: 'Accounts · Looping Louie' })

const api = useApiClient()
const auth = useAuthSession()
const notifications = useNotifications()
const username = ref('')
const password = ref('')
const creationError = ref('')
const creating = ref(false)
const changingAccountId = ref<string | null>(null)
const passwordResetAccountId = ref<string | null>(null)
const replacementPassword = ref('')

if (auth.user.value?.role !== 'admin') {
  await navigateTo('/settings')
}

const {
  data: accounts,
  status,
  error,
  refresh,
} = await useAsyncData('local-accounts', () => api.authentication.listAccounts())

async function createMember() {
  if (creating.value) return
  creating.value = true
  creationError.value = ''
  try {
    const account = await api.authentication.createMember({
      username: username.value,
      password: password.value,
    })
    accounts.value = [...(accounts.value ?? []), account]
      .sort((left, right) => left.username.localeCompare(right.username))
    username.value = ''
    password.value = ''
    notifications.success('Account created', `${account.username} can now sign in.`)
  } catch (cause) {
    creationError.value = apiErrorMessage(
      cause,
      'The member account could not be created.',
    )
  } finally {
    creating.value = false
  }
}

async function setAccountActive(account: LocalAccountResponse, isActive: boolean) {
  changingAccountId.value = account.id
  try {
    const updated = await api.authentication.setMemberActive(account.id, {
      is_active: isActive,
    })
    replaceAccount(updated)
    notifications.success(
      isActive ? 'Account activated' : 'Account deactivated',
      `${updated.username}'s active sessions have been revoked.`,
    )
  } catch (cause) {
    notifications.error(
      'Account wasn’t updated',
      apiErrorMessage(cause, 'The account state could not be changed.'),
    )
  } finally {
    changingAccountId.value = null
  }
}

async function resetPassword(account: LocalAccountResponse) {
  if (!replacementPassword.value) return
  changingAccountId.value = account.id
  try {
    const updated = await api.authentication.resetMemberPassword(
      account.id,
      replacementPassword.value,
    )
    replaceAccount(updated)
    passwordResetAccountId.value = null
    replacementPassword.value = ''
    notifications.success(
      'Password reset',
      `${updated.username}'s active sessions have been revoked.`,
    )
  } catch (cause) {
    notifications.error(
      'Password wasn’t reset',
      apiErrorMessage(cause, 'The member password could not be replaced.'),
    )
  } finally {
    changingAccountId.value = null
  }
}

function replaceAccount(updated: LocalAccountResponse) {
  accounts.value = (accounts.value ?? []).map(account => (
    account.id === updated.id ? updated : account
  ))
}
</script>

<template>
  <SettingsPageShell>
    <div v-if="status === 'pending' || status === 'idle'" class="account-state" role="status">
      Loading local accounts…
    </div>
    <div v-else-if="status === 'error'" class="account-state account-state--error" role="alert">
      <span>{{ apiErrorMessage(error, 'Local accounts could not be loaded.') }}</span>
      <UiButton variant="stroke" size="sm" @click="() => refresh()">Retry</UiButton>
    </div>
    <div v-else class="account-settings">
      <section class="account-settings__section">
        <div>
          <h2>Create member account</h2>
          <p>Set an initial password and share it with the member through a trusted channel.</p>
        </div>
        <form class="account-create-form" @submit.prevent="createMember">
          <UiTextField v-model="username" label="Username" autocomplete="off" required />
          <UiTextField
            v-model="password"
            label="Initial password"
            type="password"
            autocomplete="new-password"
            hint="Use at least 12 characters."
            required
          />
          <p v-if="creationError" class="account-error" role="alert">{{ creationError }}</p>
          <UiButton type="submit" :loading="creating">Create member</UiButton>
        </form>
      </section>

      <section class="account-settings__section">
        <div>
          <h2>Local accounts</h2>
          <p>Deactivating or resetting a member account immediately ends its active sessions.</p>
        </div>
        <ul class="account-list">
          <li v-for="account in accounts" :key="account.id" class="account-list__item">
            <div>
              <strong>{{ account.username }}</strong>
              <span>{{ account.role }} · {{ account.is_active ? 'Active' : 'Inactive' }}</span>
            </div>
            <div v-if="account.role === 'member'" class="account-list__actions">
              <template v-if="passwordResetAccountId === account.id">
                <UiTextField
                  v-model="replacementPassword"
                  label="Replacement password"
                  type="password"
                  autocomplete="new-password"
                  required
                  hide-label
                />
                <UiButton
                  size="sm"
                  :loading="changingAccountId === account.id"
                  @click="resetPassword(account)"
                >Save password</UiButton>
                <UiButton size="sm" variant="stroke" @click="passwordResetAccountId = null">
                  Cancel
                </UiButton>
              </template>
              <template v-else>
                <UiButton size="sm" variant="stroke" @click="passwordResetAccountId = account.id">
                  Reset password
                </UiButton>
                <UiButton
                  size="sm"
                  :variant="account.is_active ? 'coral' : 'secondary'"
                  :loading="changingAccountId === account.id"
                  @click="setAccountActive(account, !account.is_active)"
                >{{ account.is_active ? 'Deactivate' : 'Activate' }}</UiButton>
              </template>
            </div>
          </li>
        </ul>
      </section>
    </div>
  </SettingsPageShell>
</template>

<style scoped>
.account-settings { display: grid; gap: var(--ll-space-10); }
.account-settings__section { display: grid; gap: var(--ll-space-5); }
.account-settings h2, .account-settings p { margin: 0; }
.account-settings h2 { font: 600 var(--ll-text-lg) / 1.2 var(--ll-font-display); }
.account-settings p, .account-list__item span { color: var(--ll-color-text-muted); font: 400 var(--ll-text-sm) / 1.5 var(--ll-font-control); }
.account-create-form { display: grid; max-width: 32rem; gap: var(--ll-space-4); }
.account-error { color: var(--ll-color-brand) !important; }
.account-list { display: grid; margin: 0; padding: 0; border-top: 1px solid var(--ll-color-divider); list-style: none; }
.account-list__item { display: flex; align-items: center; justify-content: space-between; gap: var(--ll-space-5); padding: var(--ll-space-4) 0; border-bottom: 1px solid var(--ll-color-divider); }
.account-list__item > div:first-child { display: grid; gap: var(--ll-space-1); }
.account-list__actions { display: flex; align-items: center; gap: var(--ll-space-3); }
.account-list__actions :deep(.ui-text-field) { width: 14rem; }
.account-state { display: flex; align-items: center; gap: var(--ll-space-4); min-height: 12rem; }
.account-state--error { color: var(--ll-color-brand); }
@media (max-width: 48rem) {
  .account-list__item { align-items: flex-start; flex-direction: column; }
  .account-list__actions { flex-wrap: wrap; }
}
</style>
