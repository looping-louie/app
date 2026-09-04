<script setup lang="ts">
import UiPill from '~/components/ui/Pill.vue'

const props = withDefaults(defineProps<{
  compact?: boolean
}>(), {
  compact: false,
})

const {
  activeWorkspace,
  activeWorkspaceId,
  error,
  selectWorkspace,
  status,
  workspaces,
} = useWorkspaceContext()
const options = computed(() => workspaces.value.map(workspace => ({
  value: workspace.id,
  label: workspace.name,
})))

function changeWorkspace(value: string | string[]) {
  if (typeof value !== 'string' || value === activeWorkspaceId.value) return
  if (selectWorkspace(value) && import.meta.client) window.location.reload()
}
</script>

<template>
  <UiPill
    v-if="status === 'success' && workspaces.length"
    :model-value="activeWorkspaceId ?? undefined"
    :options="options"
    clickable
    selection-type="radio"
    :dropdown-align="compact ? 'left' : 'right'"
    dropdown-label="Execution workspace"
    :tooltip="compact ? activeWorkspace?.name : undefined"
    :aria-label="`Execution workspace: ${activeWorkspace?.name ?? 'not selected'}`"
    @update:model-value="changeWorkspace"
  >
    <template #icon>
      <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
        <path d="M216,72H130.67L102.93,51.2a16.12,16.12,0,0,0-9.6-3.2H40A16,16,0,0,0,24,64V200a16,16,0,0,0,16,16H216.89A15.13,15.13,0,0,0,232,200.89V88A16,16,0,0,0,216,72Zm0,128H40V64H93.33L123.2,86.4A8,8,0,0,0,128,88h88Z" />
      </svg>
    </template>
    <template v-if="!props.compact">{{ activeWorkspace?.name ?? 'Select workspace' }}</template>
  </UiPill>
  <span v-else-if="status === 'error'" class="workspace-switcher__state" :title="error">{{ compact ? '!' : 'Workspace unavailable' }}</span>
  <span v-else-if="status === 'success'" class="workspace-switcher__state">{{ compact ? '—' : 'No workspace' }}</span>
</template>

<style scoped>
.workspace-switcher__state {
  color: var(--ll-color-text-muted);
  font-size: var(--ll-text-sm);
}
</style>
