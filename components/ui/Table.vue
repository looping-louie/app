<script setup lang="ts">
import UiPill from '~/components/ui/Pill.vue'

export interface TableColumn {
  key: string
  label: string
  type?: 'text' | 'option'
  align?: 'start' | 'center' | 'end'
  width?: string
}

type TableRow = Record<string, unknown>

const props = withDefaults(defineProps<{
  columns: TableColumn[]
  rows: TableRow[]
  rowKey?: string | ((row: TableRow, index: number) => string | number)
  caption?: string
  ariaLabel?: string
}>(), {
  rowKey: 'id',
  caption: undefined,
  ariaLabel: undefined,
})

function resolveRowKey(row: TableRow, index: number) {
  if (typeof props.rowKey === 'function') return props.rowKey(row, index)
  const value = row[props.rowKey]
  return typeof value === 'string' || typeof value === 'number' ? value : index
}

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value)
}

function optionValues(value: unknown) {
  if (Array.isArray(value)) return value.filter(item => item !== null && item !== undefined && item !== '')
  return value === null || value === undefined || value === '' ? [] : [value]
}
</script>

<template>
  <div class="ui-table-frame">
    <table class="ui-table" :aria-label="ariaLabel">
      <caption v-if="$slots.caption || caption" class="ui-table__caption">
        <slot name="caption">{{ caption }}</slot>
      </caption>

      <thead>
        <tr>
          <th
            v-for="column in columns"
            :key="column.key"
            scope="col"
            :class="`ui-table__cell--align-${column.align ?? 'start'}`"
            :style="column.width ? { width: column.width } : undefined"
          >
            <slot :name="`heading-${column.key}`" :column="column">
              {{ column.label }}
            </slot>
          </th>
        </tr>
      </thead>

      <tbody>
        <tr v-if="rows.length === 0" class="ui-table__empty-row">
          <td :colspan="columns.length">
            <slot name="empty">No data available.</slot>
          </td>
        </tr>
        <tr v-for="(row, rowIndex) in rows" :key="resolveRowKey(row, rowIndex)">
          <td
            v-for="column in columns"
            :key="column.key"
            :class="`ui-table__cell--align-${column.align ?? 'start'}`"
          >
            <slot
              :name="`cell-${column.key}`"
              :row="row"
              :column="column"
              :value="row[column.key]"
              :row-index="rowIndex"
            >
              <slot
                name="cell"
                :row="row"
                :column="column"
                :value="row[column.key]"
                :row-index="rowIndex"
              >
                <span v-if="column.type === 'option'" class="ui-table__options">
                  <UiPill
                    v-for="(option, optionIndex) in optionValues(row[column.key])"
                    :key="`${formatValue(option)}-${optionIndex}`"
                    :focusable="false"
                  >
                    {{ formatValue(option) }}
                  </UiPill>
                  <span v-if="optionValues(row[column.key]).length === 0" class="ui-table__empty">—</span>
                </span>
                <span v-else>{{ formatValue(row[column.key]) }}</span>
              </slot>
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.ui-table-frame {
  width: 100%;
  min-width: 0;
  overflow-x: auto;
  box-sizing: border-box;
  background: var(--ll-color-card);
  border: 1px solid var(--ll-color-divider);
  border-radius: var(--ui-surface-radius, var(--ll-radius-structural));
}

.ui-table {
  width: 100%;
  min-width: 40rem;
  border-spacing: 0;
  border-collapse: separate;
  color: var(--ll-color-ink);
  font-size: var(--ll-text-sm);
  line-height: 1.45;
  text-align: left;
}

.ui-table__caption {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  padding: 0;
  margin: -1px;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.ui-table th,
.ui-table td {
  padding: var(--ll-space-4) var(--ll-space-5);
  vertical-align: middle;
}

.ui-table th {
  color: var(--ll-color-ink);
  background: var(--ll-color-highlight);
  font-family: var(--ll-font-control);
  font-size: var(--ll-text-xs);
  font-weight: 650;
  letter-spacing: 0.035em;
  text-transform: uppercase;
}

.ui-table td {
  background: var(--ll-color-card);
  transition: background var(--ll-duration-normal) var(--ll-ease-out);
}

.ui-table tbody tr:first-child td,
.ui-table tbody tr + tr td {
  border-top: 1px solid var(--ll-color-divider);
}

.ui-table tbody tr:hover td {
  background: color-mix(in srgb, var(--ll-color-highlight) 82%, var(--ll-color-divider));
}

.ui-table__empty-row td {
  height: 7rem;
  color: var(--ll-color-text-muted);
  text-align: center;
}

.ui-table__cell--align-center {
  text-align: center;
}

.ui-table__cell--align-end {
  text-align: right;
}

.ui-table__options {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: inherit;
  gap: var(--ll-space-2);
}

.ui-table__empty {
  color: var(--ll-color-text-faint);
}

@media (max-width: 44rem) {
  .ui-table {
    min-width: 36rem;
  }

  .ui-table th,
  .ui-table td {
    padding-inline: var(--ll-space-4);
  }
}

@media (prefers-reduced-motion: reduce) {
  .ui-table td {
    transition: none;
  }
}
</style>
