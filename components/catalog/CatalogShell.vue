<script setup lang="ts">
import UiAsyncStage from '~/components/ui/AsyncStage.vue'
import UiContainer from '~/components/ui/Container.vue'
import UiHeadingBlock from '~/components/ui/HeadingBlock.vue'
import UiPagination from '~/components/ui/Pagination.vue'

type AsyncStageStatus = 'idle' | 'pending' | 'success' | 'error'
type SectionStageInverse = 'none' | 'top' | 'bottom' | 'both'

withDefaults(defineProps<{
  title: string
  description: string
  status?: AsyncStageStatus
  empty?: boolean
  inverse?: SectionStageInverse
  loadingLabel?: string
  errorLabel?: string
  emptyLabel?: string
  paginationTotal?: number
  paginationOffset?: number
  paginationPageSize?: number
}>(), {
  status: 'success',
  empty: false,
  inverse: 'bottom',
  loadingLabel: 'Loading…',
  errorLabel: 'Content could not be loaded.',
  emptyLabel: 'Nothing to show yet.',
  paginationOffset: 0,
  paginationPageSize: 12,
})

defineEmits<{
  retry: []
  'update:paginationOffset': [offset: number]
}>()
</script>

<template>
  <UiContainer size="wide" class="catalog-shell">
    <UiHeadingBlock layout="split" size="section" align="start" class="catalog-shell__heading">
      <template #title><h1>{{ title }}</h1></template>
      <template #description><p>{{ description }}</p></template>
      <template v-if="$slots.actions" #aside>
        <div class="catalog-shell__actions"><slot name="actions" /></div>
      </template>
    </UiHeadingBlock>

    <div v-if="$slots.filters" class="catalog-shell__filters"><slot name="filters" /></div>

    <UiAsyncStage
      :status="status"
      :empty="empty"
      :inverse="inverse"
      :loading-label="loadingLabel"
      :error-label="errorLabel"
      :empty-label="emptyLabel"
      class="catalog-shell__stage"
      @retry="$emit('retry')"
    >
      <template v-if="$slots.loading" #loading><slot name="loading" /></template>
      <template v-if="$slots.error" #error><slot name="error" /></template>
      <template v-if="$slots.empty" #empty><slot name="empty" /></template>
      <slot />
    </UiAsyncStage>

    <UiPagination
      v-if="status === 'success' && paginationTotal !== undefined"
      :offset="paginationOffset"
      :total="paginationTotal"
      :page-size="paginationPageSize"
      aria-label="Catalog pagination"
      @update:offset="$emit('update:paginationOffset', $event)"
    />
  </UiContainer>
</template>

<style scoped>
.catalog-shell {
  padding-block: var(--ll-space-10) var(--ll-space-16);
}

.catalog-shell__heading {
  margin-bottom: var(--ll-space-6);
}

.catalog-shell__actions {
  display: flex;
  justify-content: flex-end;
}

.catalog-shell__filters {
  margin-bottom: var(--ll-space-10);
}

</style>
