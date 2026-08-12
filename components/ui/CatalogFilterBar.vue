<script setup lang="ts">
import UiPill from '~/components/ui/Pill.vue'

type FilterOption = { value: string; label: string }
type SelectionType = 'radio' | 'checkbox'

withDefaults(defineProps<{
  interactive?: boolean
  showSearch?: boolean
  statusOptions?: FilterOption[]
  thirdLabel?: string
  thirdIcon?: 'department' | 'labs' | 'task' | 'scribble-loop' | 'calendar-blank'
  thirdOptions?: FilterOption[]
  thirdSelectionType?: SelectionType
}>(), {
  interactive: false,
  showSearch: true,
  statusOptions: () => [
    { value: 'all', label: 'All' },
    { value: 'enabled', label: 'Enabled' },
    { value: 'disabled', label: 'Disabled' },
  ],
  thirdLabel: 'Department',
  thirdIcon: 'department',
  thirdOptions: () => [],
  thirdSelectionType: 'checkbox',
})

const status = defineModel<string>('status', { default: 'all' })
const category = defineModel<string | string[]>('category', { default: () => [] })
const sort = defineModel<string>('sort', { default: 'alphabetical-asc' })

const sortOptions = [
  { value: 'alphabetical-asc', label: 'Alphabetical (A–Z)' },
  { value: 'alphabetical-desc', label: 'Alphabetical (Z–A)' },
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
]
</script>

<template>
  <div class="ui-catalog-filter-bar" role="group" aria-label="Catalog filters">
    <div class="ui-catalog-filter-bar__group">
      <UiPill v-if="showSearch" aria-label="Search catalog">
        <template #icon>
          <svg viewBox="0 0 256 256" fill="currentColor" focusable="false">
            <path d="M229.66,218.34l-50.07-50.06a88.1,88.1,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z" />
          </svg>
        </template>
        Search
      </UiPill>

      <UiPill
        v-model="status"
        :clickable="interactive"
        selection-type="radio"
        :options="interactive ? statusOptions : undefined"
        aria-label="Filter catalog by status"
        dropdown-label="Status"
      >
        <template #icon>
          <svg viewBox="0 0 256 256" fill="currentColor" focusable="false">
            <path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z" />
          </svg>
        </template>
        Status
      </UiPill>

      <UiPill
        v-model="category"
        :clickable="interactive"
        :selection-type="thirdSelectionType"
        :options="interactive ? thirdOptions : undefined"
        :aria-label="`Filter catalog by ${thirdLabel.toLowerCase()}`"
        :dropdown-label="thirdLabel"
      >
        <template #icon>
          <svg v-if="thirdIcon === 'department'" viewBox="0 0 256 256" fill="currentColor" focusable="false">
            <path d="M240,208H224V96a16,16,0,0,0-16-16H144V32a16,16,0,0,0-24.88-13.32L39.12,72A16,16,0,0,0,32,85.34V208H16a8,8,0,0,0,0,16H240a8,8,0,0,0,0-16ZM208,96V208H144V96ZM48,85.34,128,32V208H48ZM112,112v16a8,8,0,0,1-16,0V112a8,8,0,1,1,16,0Zm-32,0v16a8,8,0,0,1-16,0V112a8,8,0,1,1,16,0Zm0,56v16a8,8,0,0,1-16,0V168a8,8,0,0,1,16,0Zm32,0v16a8,8,0,0,1-16,0V168a8,8,0,0,1,16,0Z" />
          </svg>
          <svg v-else-if="thirdIcon === 'labs'" viewBox="0 0 256 256" fill="currentColor" focusable="false">
            <path d="M248,124a56.11,56.11,0,0,0-32-50.61V72a48,48,0,0,0-88-26.49A48,48,0,0,0,40,72v1.39a56,56,0,0,0,0,101.2V176a48,48,0,0,0,88,26.49A48,48,0,0,0,216,176v-1.41A56.09,56.09,0,0,0,248,124ZM88,208a32,32,0,0,1-31.81-28.56A55.87,55.87,0,0,0,64,180h8a8,8,0,0,0,0-16H64A40,40,0,0,1,50.67,86.27,8,8,0,0,0,56,78.73V72a32,32,0,0,1,64,0v68.26A47.8,47.8,0,0,0,88,128a8,8,0,0,0,0,16,32,32,0,0,1,0,64Zm104-44h-8a8,8,0,0,0,0,16h8a55.87,55.87,0,0,0,7.81-.56A32,32,0,1,1,168,144a8,8,0,0,0,0-16,47.8,47.8,0,0,0-32,12.26V72a32,32,0,0,1,64,0v6.73a8,8,0,0,0,5.33,7.54A40,40,0,0,1,192,164Zm16-52a8,8,0,0,1-8,8h-4a36,36,0,0,1-36-36V80a8,8,0,0,1,16,0v4a20,20,0,0,0,20,20h4A8,8,0,0,1,208,112ZM60,120H56a8,8,0,0,1,0-16h4A20,20,0,0,0,80,84V80a8,8,0,0,1,16,0v4A36,36,0,0,1,60,120Z" />
          </svg>
          <svg v-else-if="thirdIcon === 'scribble-loop'" viewBox="0 0 256 256" fill="currentColor" focusable="false">
            <path d="M253.93,154.63c-1.32-1.46-24.09-26.22-61-40.56-1.72-18.42-8.46-35.17-19.41-47.92C158.87,49,137.58,40,112,40,60.48,40,26.89,86.18,25.49,88.15a8,8,0,0,0,13,9.31C38.8,97.05,68.81,56,112,56c20.77,0,37.86,7.11,49.41,20.57,7.42,8.64,12.44,19.69,14.67,32A140.87,140.87,0,0,0,140.6,104c-26.06,0-47.93,6.81-63.26,19.69C63.78,135.09,56,151,56,167.25A47.59,47.59,0,0,0,69.87,201.3c9.66,9.62,23.06,14.7,38.73,14.7,51.81,0,81.18-42.13,84.49-84.42a161.43,161.43,0,0,1,49,33.79,8,8,0,1,0,11.86-10.74Zm-94.46,21.64C150.64,187.09,134.66,200,108.6,200,83.32,200,72,183.55,72,167.25,72,144.49,93.47,120,140.6,120a124.34,124.34,0,0,1,36.78,5.68C176.93,144.44,170.46,162.78,159.47,176.27Z" />
          </svg>
          <svg v-else-if="thirdIcon === 'calendar-blank'" viewBox="0 0 256 256" fill="currentColor" focusable="false">
            <path d="M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32Zm0,176H48V88H208V208ZM48,72V48H72v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24V72Z" />
          </svg>
          <svg v-else viewBox="0 0 256 256" fill="currentColor" focusable="false">
            <path d="M76,152a36,36,0,1,0,36,36A36,36,0,0,0,76,152Zm0,56a20,20,0,1,1,20-20A20,20,0,0,1,76,208ZM42.34,106.34,56.69,92,42.34,77.66A8,8,0,0,1,53.66,66.34L68,80.69,82.34,66.34A8,8,0,0,1,93.66,77.66L79.31,92l14.35,14.34a8,8,0,0,1-11.32,11.32L68,103.31,53.66,117.66a8,8,0,0,1-11.32-11.32Zm187.32,96a8,8,0,0,1-11.32,11.32L204,199.31l-14.34,14.35a8,8,0,0,1-11.32-11.32L192.69,188l-14.35-14.34a8,8,0,0,1,11.32-11.32L204,176.69l14.34-14.35a8,8,0,0,1,11.32,11.32L215.31,188Zm-45.19-89.51c-6.18,22.33-25.32,41.63-46.53,46.93A8.13,8.13,0,0,1,136,160a8,8,0,0,1-1.93-15.76c15.63-3.91,30.35-18.91,35-35.68,3.19-11.5,3.22-29-14.71-46.9L152,59.31V80a8,8,0,0,1-16,0V40a8,8,0,0,1,8-8h40a8,8,0,0,1,0,16H163.31l2.35,2.34C183.9,68.59,190.58,90.78,184.47,112.83Z" />
          </svg>
        </template>
        {{ thirdLabel }}
      </UiPill>
    </div>

    <UiPill
      v-model="sort"
      :clickable="interactive"
      dropdown-align="right"
      selection-type="radio"
      :options="interactive ? sortOptions : undefined"
      aria-label="Sort catalog"
      dropdown-label="Sort"
    >
      <template #icon>
        <svg viewBox="0 0 256 256" fill="currentColor" focusable="false">
          <path d="M117.66,170.34a8,8,0,0,1,0,11.32l-32,32a8,8,0,0,1-11.32,0l-32-32a8,8,0,0,1,11.32-11.32L72,188.69V48a8,8,0,0,1,16,0V188.69l18.34-18.35A8,8,0,0,1,117.66,170.34Zm96-96-32-32a8,8,0,0,0-11.32,0l-32,32a8,8,0,0,0,11.32,11.32L168,67.31V208a8,8,0,0,0,16,0V67.31l18.34,18.35a8,8,0,0,0,11.32-11.32Z" />
        </svg>
      </template>
      Sort
    </UiPill>
  </div>
</template>

<style scoped>
.ui-catalog-filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ll-space-4);
}

.ui-catalog-filter-bar__group {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--ll-space-3);
}

@media (max-width: 38rem) {
  .ui-catalog-filter-bar {
    align-items: flex-start;
  }
}
</style>
