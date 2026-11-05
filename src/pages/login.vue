<script setup lang="ts">
import AccountCredentialsForm from '~/components/auth/AccountCredentialsForm.vue'
import UiCard from '~/components/ui/Card.vue'
import { apiErrorMessage } from '~/utils/api/errors'

definePageMeta({ layout: false })

const auth = useAuthSession()
const submitting = ref(false)
const submitError = ref('')

async function login(credentials: { username: string, password: string }) {
  submitting.value = true
  submitError.value = ''
  try {
    await auth.login(credentials)
    await navigateTo('/runs')
  } catch (cause) {
    submitError.value = apiErrorMessage(
      cause,
      'The username or password was not accepted.',
    )
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <main class="account-page">
    <UiCard class="account-page__card">
      <template #eyebrow>Looping Louie</template>
      <template #title><h1>Sign in</h1></template>
      <template #description>
        <p>Use a local account created by this Looping Louie instance.</p>
      </template>
      <AccountCredentialsForm
        submit-label="Sign in"
        :busy="submitting"
        :error="submitError"
        @submit="login"
      />
    </UiCard>
  </main>
</template>

<style scoped>
.account-page {
  display: grid;
  min-height: 100vh;
  place-items: center;
  padding: var(--ll-space-6);
  background: var(--ll-color-canvas);
}

.account-page__card {
  width: min(100%, 28rem);
}

:deep(.account-page__card .ui-card__content) {
  gap: var(--ll-space-5);
}
</style>
