<script setup lang="ts">
import UiButton from '~/components/ui/Button.vue'
import UiCard from '~/components/ui/Card.vue'
import UiContainer from '~/components/ui/Container.vue'
import UiGrid from '~/components/ui/Grid.vue'
import UiHeadingBlock from '~/components/ui/HeadingBlock.vue'

type LoopStatus = 'scheduled' | 'preparing' | 'running' | 'completed'

interface LoopItem {
  name: string
  status: LoopStatus
  statusLabel: string
  detail: string
  meta: string
  progress?: number
}

interface LoopColumn {
  id: LoopStatus
  title: string
  loops: LoopItem[]
}

const columns: LoopColumn[] = [
  {
    id: 'scheduled',
    title: 'Programados',
    loops: [
      {
        name: 'Revisión de código — Sprint 24',
        status: 'scheduled',
        statusLabel: 'Programado',
        detail: 'Generador: mistral-7b · Revisores: 2',
        meta: 'Inicia: 15:30 · Umbral: 0.92',
      },
      {
        name: 'Moderación de contenido',
        status: 'scheduled',
        statusLabel: 'Programado',
        detail: 'Generador: qwen3-235b · Revisores: 3',
        meta: 'Inicia: 16:00 · Umbral: 0.95',
      },
    ],
  },
  {
    id: 'preparing',
    title: 'En preparación',
    loops: [
      {
        name: 'Resumen de documentos',
        status: 'preparing',
        statusLabel: 'Preparando',
        detail: 'Generador: llama-3.3-70b · Revisores: 2',
        meta: 'Configurando revisores · Umbral: 0.88',
      },
    ],
  },
  {
    id: 'running',
    title: 'En ejecución',
    loops: [
      {
        name: 'Razonamiento multi-agente',
        status: 'running',
        statusLabel: 'Ejecutando',
        detail: 'Generador: deepseek-v4 · Revisores: 3',
        meta: 'Intento 2 de 3 · Puntuación: 0.87',
        progress: 72,
      },
    ],
  },
  {
    id: 'completed',
    title: 'Completados',
    loops: [
      {
        name: 'Clasificación de tickets',
        status: 'completed',
        statusLabel: 'Completado',
        detail: 'Generador: gpt-oss-20b · Revisores: 2',
        meta: 'Finalizado: 14:12 · Puntuación: 0.94',
      },
      {
        name: 'Traducción técnica',
        status: 'completed',
        statusLabel: 'Completado',
        detail: 'Generador: gemma-4-31b · Revisores: 2',
        meta: 'Finalizado: 13:05 · Puntuación: 0.96',
      },
    ],
  },
]

definePageMeta({
  layout: 'app',
})

useHead({
  title: 'Dashboard · Looping Louie',
})
</script>

<template>
  <UiContainer size="wide" class="dashboard-page">
    <UiHeadingBlock layout="split" size="subsection" align="start" class="dashboard-header">
      <template #eyebrow>
        <span class="dashboard-eyebrow"><span aria-hidden="true" /> Flight operations</span>
      </template>

      <template #title>
        <h1>Dashboard</h1>
      </template>

      <template #description>
        <p>Vista general de las ejecuciones de Looping Louie: loops programados, en preparación, en ejecución y completados.</p>
      </template>

      <template #aside>
        <UiButton disabled>
          <template #leading>
            <svg viewBox="0 0 16 16" fill="none">
              <path d="M8 3.25v9.5M3.25 8h9.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            </svg>
          </template>
          Nuevo loop
        </UiButton>
      </template>
    </UiHeadingBlock>

    <UiGrid :columns="4" gap="md" class="kanban-board">
      <UiCard
        v-for="column in columns"
        :key="column.id"
        as="section"
        variant="editorial"
        class="kanban-column"
      >
        <template #title>
          <header class="column-header">
            <span class="column-dot" :class="`column-dot--${column.id}`" aria-hidden="true" />
            <h2 class="column-title">{{ column.title }}</h2>
            <span class="column-count" :aria-label="`${column.loops.length} loops`">{{ column.loops.length }}</span>
          </header>
        </template>

        <template #description>
          <div class="column-body">
            <UiCard
              v-for="loop in column.loops"
              :key="loop.name"
              as="article"
              variant="editorial"
              class="loop-card"
            >
              <template #title>
                <div class="loop-card-header">
                  <h3 class="loop-name">{{ loop.name }}</h3>
                  <span class="loop-badge" :class="`loop-badge--${loop.status}`">{{ loop.statusLabel }}</span>
                </div>
              </template>

              <template #description>
                <p>{{ loop.detail }}</p>
              </template>

              <template #meta>
                <p>{{ loop.meta }}</p>
                <progress
                  v-if="loop.progress !== undefined"
                  class="loop-progress"
                  :value="loop.progress"
                  max="100"
                  :aria-label="`Progreso de ${loop.name}: ${loop.progress}%`"
                >
                  {{ loop.progress }}%
                </progress>
              </template>
            </UiCard>
          </div>
        </template>
      </UiCard>
    </UiGrid>
  </UiContainer>
</template>

<style scoped>
.dashboard-page {
  padding-block: var(--ll-space-8) var(--ll-space-12);
}

.dashboard-header {
  margin-bottom: var(--ll-space-10);
}

.dashboard-header :deep(.ui-heading-block__description) {
  margin-top: var(--ll-space-3);
}

.dashboard-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: var(--ll-space-2);
  font: 600 var(--ll-text-xs) / 1 var(--ll-font-mono);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.dashboard-eyebrow > span {
  width: 0.4375rem;
  height: 0.4375rem;
  background: var(--ll-color-brand);
  border-radius: 50%;
}

.kanban-column {
  min-height: 22rem;
  overflow: visible;
  background: var(--ll-color-card);
  border-radius: var(--ll-radius-lg);
}

.kanban-column > :deep(.ui-card__content) {
  padding: var(--ll-space-4);
}

.kanban-column > :deep(.ui-card__content > .ui-card__title) {
  flex: none;
}

.kanban-column > :deep(.ui-card__content > .ui-card__description) {
  margin-top: 0;
}

.column-header {
  display: flex;
  align-items: center;
  gap: var(--ll-space-2);
  padding: var(--ll-space-1) 0 var(--ll-space-3);
  margin-bottom: var(--ll-space-3);
  border-bottom: 1px solid var(--ll-color-divider);
}

.column-dot {
  width: 0.5rem;
  height: 0.5rem;
  flex: none;
  border-radius: 50%;
}

.column-dot--scheduled { background: var(--ll-color-blue-300); }
.column-dot--preparing { background: var(--ll-color-brand-bright); }
.column-dot--running { background: var(--ll-color-primary); }
.column-dot--completed { background: var(--ll-color-metal-700); }

.column-title {
  flex: 1;
  margin: 0;
  color: var(--ll-color-ink);
  font: 600 var(--ll-text-xs) / 1.2 var(--ll-font-mono);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.column-count {
  display: inline-flex;
  min-width: 1.5rem;
  height: 1.5rem;
  align-items: center;
  justify-content: center;
  padding-inline: var(--ll-space-2);
  color: var(--ll-color-text-muted);
  background: var(--ll-color-surface-raised);
  border: 1px solid var(--ll-color-divider);
  border-radius: var(--ll-radius-pill);
  font: 600 var(--ll-text-xs) / 1 var(--ll-font-mono);
}

.column-body {
  display: flex;
  flex-direction: column;
  gap: var(--ll-space-3);
}

.kanban-column .loop-card.ui-card--editorial {
  min-height: 0;
  overflow: hidden;
  background: var(--ll-color-surface-raised);
  border-radius: var(--ll-radius-md);
}

.loop-card :deep(.ui-card__content) {
  padding: var(--ll-space-4);
}

.loop-card :deep(.ui-card__description) {
  margin-top: var(--ll-space-3);
  color: var(--ll-color-text-muted);
  font-size: var(--ll-text-xs);
  line-height: 1.45;
}

.loop-card :deep(.ui-card__footer) {
  margin-top: var(--ll-space-2);
  padding-top: 0;
}

.loop-card :deep(.ui-card__meta) {
  width: 100%;
  color: var(--ll-color-text-faint);
  font-size: var(--ll-text-xs);
  line-height: 1.45;
}

.loop-card :deep(.ui-card__meta p) {
  margin: 0;
}

.loop-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--ll-space-2);
}

.loop-name {
  margin: 0;
  color: var(--ll-color-ink);
  font-size: var(--ll-text-sm);
  font-weight: 650;
  line-height: 1.25;
  letter-spacing: -0.015em;
}

.loop-badge {
  flex: none;
  padding: 0.2rem 0.5rem;
  border-radius: var(--ll-radius-pill);
  font: 600 0.6875rem / 1 var(--ll-font-control);
  white-space: nowrap;
}

.loop-badge--scheduled {
  color: var(--ll-color-blue-700);
  background: var(--ll-color-blue-100);
}

.loop-badge--preparing {
  color: var(--ll-color-brand-ink);
  background: var(--ll-color-red-100);
}

.loop-badge--running {
  color: var(--ll-color-metal-025);
  background: var(--ll-color-primary);
}

.loop-badge--completed {
  color: var(--ll-color-text-muted);
  background: var(--ll-color-surface-muted);
}

.loop-progress {
  display: block;
  width: 100%;
  height: 0.25rem;
  margin-top: var(--ll-space-3);
  overflow: hidden;
  appearance: none;
  background: var(--ll-color-divider);
  border: 0;
  border-radius: var(--ll-radius-pill);
}

.loop-progress::-webkit-progress-bar {
  background: var(--ll-color-divider);
}

.loop-progress::-webkit-progress-value {
  background: var(--ll-color-primary);
  border-radius: var(--ll-radius-pill);
}

.loop-progress::-moz-progress-bar {
  background: var(--ll-color-primary);
  border-radius: var(--ll-radius-pill);
}

@media (max-width: 48rem) {
  .dashboard-page {
    padding-block: var(--ll-space-6) var(--ll-space-10);
  }

  .dashboard-header {
    margin-bottom: var(--ll-space-8);
  }
}
</style>
