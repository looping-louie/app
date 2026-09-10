<script setup lang="ts">
import UiButton from '~/components/ui/Button.vue'

const props = withDefaults(defineProps<{
  total: number
  pageSize?: number
  ariaLabel?: string
  previousLabel?: string
  nextLabel?: string
}>(), {
  pageSize: 12,
  ariaLabel: 'Pagination',
  previousLabel: 'Previous',
  nextLabel: 'Next',
})

const offset = defineModel<number>('offset', { default: 0 })

const safeTotal = computed(() => Math.max(0, props.total))
const safePageSize = computed(() => Math.max(1, props.pageSize))
const pageCount = computed(() => Math.ceil(safeTotal.value / safePageSize.value))
const hasPreviousPage = computed(() => offset.value > 0)
const hasNextPage = computed(() => offset.value + safePageSize.value < safeTotal.value)
const rangeStart = computed(() => safeTotal.value === 0 ? 0 : Math.min(offset.value + 1, safeTotal.value))
const rangeEnd = computed(() => Math.min(offset.value + safePageSize.value, safeTotal.value))

function previousPage() {
  offset.value = Math.max(0, offset.value - safePageSize.value)
}

function nextPage() {
  if (!hasNextPage.value) return
  offset.value += safePageSize.value
}

watch([safeTotal, safePageSize, offset], () => {
  const lastOffset = safeTotal.value === 0
    ? 0
    : Math.floor((safeTotal.value - 1) / safePageSize.value) * safePageSize.value
  const normalizedOffset = Math.min(Math.max(0, offset.value), lastOffset)

  if (offset.value !== normalizedOffset) offset.value = normalizedOffset
}, { immediate: true })
</script>

<template>
  <nav v-if="pageCount > 1" class="ui-pagination" :aria-label="ariaLabel">
    <UiButton variant="secondary" :disabled="!hasPreviousPage" @click="previousPage">
      {{ previousLabel }}
    </UiButton>
    <span class="ui-pagination__range" aria-live="polite">
      {{ rangeStart }}–{{ rangeEnd }} of {{ safeTotal }}
    </span>
    <UiButton variant="secondary" :disabled="!hasNextPage" @click="nextPage">
      {{ nextLabel }}
    </UiButton>
  </nav>
</template>

<style scoped>
.ui-pagination {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--ll-space-3);
  margin-top: var(--ll-space-8);
}

.ui-pagination__range {
  color: var(--ll-color-text-muted);
  font: 500 0.75rem / 1.2 var(--ll-font-mono);
  font-variant-numeric: tabular-nums;
}

@media (max-width: 30rem) {
  .ui-pagination {
    justify-content: space-between;
  }
}
</style>
