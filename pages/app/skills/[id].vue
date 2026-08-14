<script setup lang="ts">
import PageShell from '~/components/layout/PageShell.vue'
import UiButton from '~/components/ui/Button.vue'
import UiMarkdownContent from '~/components/ui/MarkdownContent.vue'
import { entityActionMenuOptions } from '~/utils/entityActionMenu'

const route = useRoute()
const skillId = computed(() => String(route.params.id))
const api = useApiClient()

const { data: skill, status, error, refresh } = await useAsyncData(
  () => `skill-${skillId.value}`,
  () => api.skills.get(skillId.value),
)

definePageMeta({
  layout: 'app',
})

useHead(() => ({
  title: skill.value
    ? `${skill.value.name} · Skills · Looping Louie`
    : 'Skill · Looping Louie',
}))
</script>

<template>
  <PageShell
    class="skill-page"
    :title="skill?.name"
    :description="skill?.description"
    :breadcrumbs="skill ? [{ label: 'Skills', to: '/app/skills' }, { label: skill.name }] : []"
    :show-heading="Boolean(skill)"
  >
    <template #actions>
      <div v-if="skill" class="skill-actions">
        <UiButton type="button">Edit</UiButton>
        <UiButton
          type="button"
          variant="secondary"
          dropdown
          dropdown-align="right"
          icon-only
          aria-label="More skill actions"
          dropdown-label="Skill actions"
          :options="entityActionMenuOptions"
        >
          <template #leading>
            <svg viewBox="0 0 256 256" fill="currentColor">
              <circle cx="128" cy="56" r="12" />
              <circle cx="128" cy="128" r="12" />
              <circle cx="128" cy="200" r="12" />
            </svg>
          </template>
        </UiButton>
      </div>
    </template>

    <div v-if="status === 'pending'" class="skill-state" role="status">Loading skill…</div>
    <div v-else-if="error" class="skill-state skill-state--error" role="alert">
      <span>Skill could not be loaded.</span>
      <UiButton variant="stroke" size="sm" @click="() => refresh()">Retry</UiButton>
    </div>
    <template v-else-if="skill">
      <div class="skill-content">
        <h2 class="instructions-title">Instructions</h2>
        <UiMarkdownContent :content="skill.instructions" strip-first-heading />
      </div>
    </template>
  </PageShell>
</template>

<style scoped>
.skill-page { --layout-page-shell-heading-gap: var(--ll-space-12); }

.skill-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--ll-space-3);
}

.skill-content {
  width: 100%;
  max-width: 48rem;
  text-align: left;
}

.instructions-title {
  margin: 0 0 var(--ll-space-6);
  color: var(--ll-color-text);
  font-size: 1.25rem;
  font-weight: 650;
  line-height: 1.15;
  letter-spacing: -0.025em;
}

.skill-state {
  display: flex;
  min-height: 14rem;
  align-items: center;
  justify-content: center;
  gap: var(--ll-space-4);
  color: var(--ll-color-text-muted);
  background: var(--ll-color-section);
  border-radius: var(--ll-radius-structural);
  font-size: var(--ll-text-sm);
}

.skill-state--error {
  color: var(--ll-color-brand-ink);
}

@media (max-width: 48rem) {
  .skill-actions {
    justify-content: flex-start;
  }
}
</style>
