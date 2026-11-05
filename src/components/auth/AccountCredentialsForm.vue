<script setup lang="ts">
import UiButton from '~/components/ui/Button.vue'
import UiTextField from '~/components/ui/TextField.vue'

const props = withDefaults(defineProps<{
  submitLabel: string
  busy?: boolean
  error?: string
}>(), {
  busy: false,
  error: '',
})

const emit = defineEmits<{
  submit: [credentials: { username: string, password: string }]
}>()

const username = ref('')
const password = ref('')

function submit() {
  emit('submit', {
    username: username.value,
    password: password.value,
  })
}
</script>

<template>
  <form class="account-credentials-form" @submit.prevent="submit">
    <UiTextField
      v-model="username"
      label="Username"
      autocomplete="username"
      required
    />
    <UiTextField
      v-model="password"
      label="Password"
      type="password"
      autocomplete="current-password"
      hint="Use at least 12 characters."
      required
    />
    <p v-if="props.error" class="account-credentials-form__error" role="alert">
      {{ props.error }}
    </p>
    <UiButton type="submit" :loading="props.busy" block>
      {{ props.submitLabel }}
    </UiButton>
  </form>
</template>

<style scoped>
.account-credentials-form {
  display: grid;
  gap: var(--ll-space-5);
}

.account-credentials-form__error {
  margin: 0;
  color: var(--ll-color-brand);
  font: 500 var(--ll-text-sm) / 1.4 var(--ll-font-control);
}
</style>
