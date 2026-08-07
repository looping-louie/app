<script setup lang="ts">
import UiIconPill from '~/components/ui/IconPill.vue'
</script>

<template>
  <div class="ui-catalog-filter-bar" role="group" aria-label="Catalog filters">
    <div class="ui-catalog-filter-bar__group">
      <UiIconPill aria-label="Search catalog">
        <template #icon>
          <svg viewBox="0 0 256 256" fill="currentColor" focusable="false">
            <path d="M229.66,218.34l-50.07-50.06a88.1,88.1,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z" />
          </svg>
        </template>
        Search
      </UiIconPill>

      <UiIconPill aria-label="Filter catalog by status">
        <template #icon>
          <svg viewBox="0 0 256 256" fill="currentColor" focusable="false">
            <path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z" />
          </svg>
        </template>
        Status
      </UiIconPill>

      <UiIconPill aria-label="Filter catalog by department">
        <template #icon>
          <svg viewBox="0 0 256 256" fill="currentColor" focusable="false">
            <path d="M240,208H224V96a16,16,0,0,0-16-16H144V32a16,16,0,0,0-24.88-13.32L39.12,72A16,16,0,0,0,32,85.34V208H16a8,8,0,0,0,0,16H240a8,8,0,0,0,0-16ZM208,96V208H144V96ZM48,85.34,128,32V208H48ZM112,112v16a8,8,0,0,1-16,0V112a8,8,0,1,1,16,0Zm-32,0v16a8,8,0,0,1-16,0V112a8,8,0,1,1,16,0Zm0,56v16a8,8,0,0,1-16,0V168a8,8,0,0,1,16,0Zm32,0v16a8,8,0,0,1-16,0V168a8,8,0,0,1,16,0Z" />
          </svg>
        </template>
        Department
      </UiIconPill>
    </div>

    <UiIconPill aria-label="Sort catalog">
      <template #icon>
        <svg viewBox="0 0 256 256" fill="currentColor" focusable="false">
          <path d="M117.66,170.34a8,8,0,0,1,0,11.32l-32,32a8,8,0,0,1-11.32,0l-32-32a8,8,0,0,1,11.32-11.32L72,188.69V48a8,8,0,0,1,16,0V188.69l18.34-18.35A8,8,0,0,1,117.66,170.34Zm96-96-32-32a8,8,0,0,0-11.32,0l-32,32a8,8,0,0,0,11.32,11.32L168,67.31V208a8,8,0,0,0,16,0V67.31l18.34,18.35a8,8,0,0,0,11.32-11.32Z" />
        </svg>
      </template>
      Sort
    </UiIconPill>
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
