<script setup lang="ts">
export interface BreadcrumbItem {
  label: string
  to?: string
  href?: string
}

withDefaults(defineProps<{
  items: BreadcrumbItem[]
  ariaLabel?: string
}>(), {
  ariaLabel: 'Breadcrumb',
})
</script>

<template>
  <nav class="ui-breadcrumb" :aria-label="ariaLabel">
    <ol class="ui-breadcrumb__list">
      <li
        v-for="(item, index) in items"
        :key="`${item.label}-${index}`"
        class="ui-breadcrumb__item"
      >
        <NuxtLink
          v-if="index < items.length - 1 && item.to"
          :to="item.to"
          class="ui-breadcrumb__link"
        >
          {{ item.label }}
        </NuxtLink>
        <a
          v-else-if="index < items.length - 1 && item.href"
          :href="item.href"
          class="ui-breadcrumb__link"
        >
          {{ item.label }}
        </a>
        <span
          v-else
          class="ui-breadcrumb__label"
          :aria-current="index === items.length - 1 ? 'page' : undefined"
        >
          {{ item.label }}
        </span>

        <span
          v-if="index < items.length - 1"
          class="ui-breadcrumb__separator"
          aria-hidden="true"
        >/</span>
      </li>
    </ol>
  </nav>
</template>

<style scoped>
.ui-breadcrumb {
  color: var(--ll-color-primary);
  font-size: 0.8125rem;
  font-weight: 650;
  line-height: 1.2;
}

.ui-breadcrumb__list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0;
  padding: 0;
  margin: 0;
  list-style: none;
}

.ui-breadcrumb__item {
  display: inline-flex;
  align-items: center;
}

.ui-breadcrumb__link {
  color: inherit;
  text-decoration: none;
  transition: color var(--ll-duration-normal) var(--ll-ease-out);
}

.ui-breadcrumb__link:hover {
  color: var(--ll-color-primary-hover);
}

.ui-breadcrumb__link:focus-visible {
  border-radius: 0.125rem;
  outline: 2px solid currentColor;
  outline-offset: 0.25rem;
}

.ui-breadcrumb__separator {
  margin-inline: 0.45em;
  color: currentColor;
}
</style>
