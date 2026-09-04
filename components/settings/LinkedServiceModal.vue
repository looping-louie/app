<script setup lang="ts">
import type { LinkedServiceResponse } from '~/types/api'
import type { ProviderCatalogItem } from '~/composables/useProviders'
import UiButton from '~/components/ui/Button.vue'
import UiModal from '~/components/ui/Modal.vue'
import UiTextField from '~/components/ui/TextField.vue'

export interface LinkedServiceFormValue {
  name: string
  apiKey: string
  baseUrl: string
}

const props = withDefaults(defineProps<{
  open: boolean
  provider: ProviderCatalogItem | null
  service?: LinkedServiceResponse | null
  saving?: boolean
  error?: string
}>(), {
  service: null,
  saving: false,
  error: '',
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  submit: [value: LinkedServiceFormValue]
}>()

const name = ref('')
const apiKey = ref('')
const baseUrl = ref('')
const nameError = ref('')
const apiKeyError = ref('')
const resourceNamePattern = /^[\p{L}\p{N}_][^.+?/<>*%&:\s]*$/u
const editing = computed(() => Boolean(props.service))
const title = computed(() => editing.value
  ? `Manage ${props.service?.name ?? 'connection'}`
  : `Connect ${props.provider?.name ?? 'provider'}`)

watch(
  () => [props.open, props.provider?.id, props.service?.id] as const,
  ([open]) => {
    if (!open || !props.provider) return

    name.value = props.service?.name
      ?? `${props.provider.id}_${props.provider.linkedServices.length + 1}`
    apiKey.value = ''
    baseUrl.value = props.service?.config.base_url
      ?? props.provider.defaultBaseUrl
      ?? ''
    nameError.value = ''
    apiKeyError.value = ''
  },
)

function updateOpen(open: boolean) {
  if (!props.saving) emit('update:open', open)
}

function submit() {
  if (!props.provider || props.saving) return

  const trimmedName = name.value.trim()
  const trimmedApiKey = apiKey.value.trim()
  nameError.value = ''
  apiKeyError.value = ''

  if (!trimmedName) nameError.value = 'Give this connection a name.'
  else if (trimmedName.length > 140 || !resourceNamePattern.test(trimmedName)) {
    nameError.value = 'Use letters, numbers, underscores or hyphens, without spaces.'
  }

  if (!editing.value && props.provider.requiresApiKey && !trimmedApiKey) {
    apiKeyError.value = 'Enter an API key to test this connection.'
  }

  if (nameError.value || apiKeyError.value) return

  emit('submit', {
    name: trimmedName,
    apiKey: trimmedApiKey,
    baseUrl: baseUrl.value.trim(),
  })
}
</script>

<template>
  <UiModal
    :open="open"
    :title="title"
    :description="editing
      ? 'Update this user connection. New credentials are tested before they are saved.'
      : 'Add an independent user connection. Its credentials are tested before it is saved.'"
    :close-on-backdrop="!saving"
    :show-close="!saving"
    @update:open="updateOpen"
  >
    <form v-if="provider" class="linked-service-form" @submit.prevent="submit">
      <UiTextField
        v-model="name"
        label="Connection name"
        placeholder="primary_openai"
        :error="nameError"
        maxlength="140"
        required
        data-autofocus
      />

      <UiTextField
        v-if="provider.requiresApiKey"
        v-model="apiKey"
        label="API key"
        type="password"
        :placeholder="editing && service?.config.key_trimmed ? service.config.key_trimmed : 'Enter API key'"
        :hint="editing && service?.config.key_trimmed ? 'Leave blank to keep the current key.' : undefined"
        :error="apiKeyError"
        :required="!editing"
        autocomplete="new-password"
      />

      <UiTextField
        v-model="baseUrl"
        label="Base URL"
        type="url"
        :placeholder="provider.defaultBaseUrl ?? 'https://api.example.com/v1'"
        hint="Leave blank to use the provider default."
        inputmode="url"
      />

      <p v-if="error" class="linked-service-form__error" role="alert">{{ error }}</p>
    </form>

    <template #actions>
      <UiButton variant="secondary" :disabled="saving" @click="updateOpen(false)">Cancel</UiButton>
      <UiButton :loading="saving" @click="submit">{{ editing ? 'Save changes' : 'Connect' }}</UiButton>
    </template>
  </UiModal>
</template>

<style scoped>
.linked-service-form {
  display: grid;
  gap: var(--ll-space-5);
}

.linked-service-form__error {
  margin: 0;
  color: var(--ll-color-brand);
  font-size: var(--ll-text-sm);
  line-height: 1.45;
}
</style>
