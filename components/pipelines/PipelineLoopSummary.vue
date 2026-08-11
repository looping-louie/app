<script setup lang="ts">
import UiPill from '~/components/ui/Pill.vue'

interface PipelineLoopAgent {
  persona_id: string
  model_id: string
  role: string
}

interface PipelineLoopStopConditions {
  max_iterations?: number | null
  max_tokens?: number | null
  timeout_seconds?: number | null
}

interface PipelineLoopSummary {
  id: string
  title: string
  flow: string | null
  agents: PipelineLoopAgent[]
  stop_conditions: PipelineLoopStopConditions | null
}

const props = withDefaults(defineProps<{
  loop: PipelineLoopSummary
  showTitle?: boolean
  showFlow?: boolean
  layout?: 'inline' | 'team-stop'
}>(), {
  showTitle: true,
  showFlow: true,
  layout: 'inline',
})

const { personaIcon } = usePersonaIcon()
const { modelLogo } = useModelLogo()

interface AgentRoleGroup {
  id: string
  shortLabel: string
  label: string
  agents: PipelineLoopAgent[]
}

const canonicalRoles = [
  { id: 'generator', shortLabel: 'G:', label: 'Generators', aliases: ['generator', 'generators'] },
  { id: 'reviewer', shortLabel: 'R:', label: 'Reviewers', aliases: ['reviewer', 'reviewers', 'eval', 'evaluator'] },
  { id: 'aggregator', shortLabel: 'A:', label: 'Aggregator', aliases: ['aggregator', 'aggregators'] },
]

function normalizedRole(role: string) {
  return role.trim().toLocaleLowerCase().replaceAll('_', '-').replaceAll(' ', '-')
}

const agentGroups = computed<AgentRoleGroup[]>(() => {
  const groups = new Map<string, AgentRoleGroup>()

  for (const agent of props.loop.agents) {
    const role = normalizedRole(agent.role)
    const definition = canonicalRoles.find(candidate => candidate.aliases.includes(role))
    const id = (definition?.id ?? role) || 'other'
    const label = definition?.label ?? labelFromId(role || 'other', '')
    const group = groups.get(id) ?? {
      id,
      shortLabel: definition?.shortLabel ?? `${label.charAt(0).toUpperCase()}:`,
      label,
      agents: [],
    }
    group.agents.push(agent)
    groups.set(id, group)
  }

  if (!groups.size) {
    return [{ id: 'generator', shortLabel: 'G:', label: 'Generators', agents: [] }]
  }

  return [
    ...canonicalRoles.flatMap(role => groups.has(role.id) ? [groups.get(role.id)!] : []),
    ...[...groups.values()].filter(group => !canonicalRoles.some(role => role.id === group.id)),
  ]
})

function labelFromId(value: string, namespace: string) {
  const short = value.replace(namespace, '')
  return short
    .replaceAll('_', ' ')
    .replaceAll('-', ' ')
    .replace(/\b\w/g, character => character.toUpperCase())
}

function compactStopConditions(stopConditions: PipelineLoopStopConditions | null) {
  if (!stopConditions) return 'None'

  const values = [
    stopConditions.max_iterations == null ? null : `${stopConditions.max_iterations.toLocaleString('en-US')} l.`,
    stopConditions.max_tokens == null ? null : `${stopConditions.max_tokens.toLocaleString('en-US')} t.`,
    stopConditions.timeout_seconds == null ? null : `${stopConditions.timeout_seconds.toLocaleString('en-US')} s.`,
  ].filter((value): value is string => Boolean(value))

  return values.length ? values.join(' OR ') : 'None'
}

function flowLabel(value: string | null) {
  if (!value) return 'Draft'
  return value.charAt(0).toUpperCase() + value.slice(1)
}
</script>

<template>
  <span
    class="pipeline-loop-summary"
    :class="[
      `pipeline-loop-summary--${layout}`,
      { 'pipeline-loop-summary--without-title': !showTitle },
    ]"
  >
    <strong v-if="showTitle" class="pipeline-loop-summary__title" :title="loop.title">{{ loop.title }}</strong>

    <span v-if="showFlow" class="pipeline-loop-summary__fact">
      <b>F:</b>
      <span>{{ flowLabel(loop.flow) }}</span>
    </span>

    <span class="pipeline-loop-summary__agent-groups">
      <span
        v-for="group in agentGroups"
        :key="group.id"
        class="pipeline-loop-summary__fact pipeline-loop-summary__role"
        :aria-label="group.label"
      >
        <b :title="group.label">{{ group.shortLabel }}</b>
        <span v-if="group.agents.length === 0" class="pipeline-loop-summary__empty">None</span>
        <span
          v-for="(agent, index) in group.agents"
          :key="`${group.id}-${agent.persona_id}-${agent.model_id}-${index}`"
          class="pipeline-loop-summary__agent-pair"
        >
          <UiPill
            icon-style="circle"
            :tooltip="`${labelFromId(agent.persona_id, 'builtin:persona:')} · ${labelFromId(agent.role, '')}`"
            :aria-label="`${labelFromId(agent.persona_id, 'builtin:persona:')} · ${labelFromId(agent.role, '')}`"
            :focusable="false"
          >
            <template #icon>
              <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
                <path :d="personaIcon({ id: agent.persona_id })" />
              </svg>
            </template>
          </UiPill>
          <UiPill
            :src="modelLogo(agent.model_id)"
            alt=""
            :tooltip="agent.model_id"
            :aria-label="agent.model_id"
            :focusable="false"
          />
        </span>
      </span>
    </span>

    <span class="pipeline-loop-summary__fact pipeline-loop-summary__stop">
      <b>S:</b>
      <span>{{ compactStopConditions(loop.stop_conditions) }}</span>
    </span>
  </span>
</template>

<style scoped>
.pipeline-loop-summary {
  display: flex;
  width: 100%;
  min-width: 0;
  align-items: center;
  gap: var(--ll-space-5);
  white-space: nowrap;
}

.pipeline-loop-summary--without-title {
  gap: var(--ll-space-3);
}

.pipeline-loop-summary__agent-groups {
  display: contents;
}

.pipeline-loop-summary--team-stop {
  display: grid;
  align-content: center;
  gap: var(--ll-space-3);
  white-space: normal;
}

.pipeline-loop-summary--team-stop .pipeline-loop-summary__agent-groups {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: var(--ll-space-3);
  white-space: nowrap;
}

.pipeline-loop-summary--team-stop .pipeline-loop-summary__stop {
  min-width: 0;
}

.pipeline-loop-summary__title {
  min-width: 10rem;
  flex: 1 1 28rem;
  overflow: hidden;
  color: var(--ll-color-ink);
  font: 650 var(--ll-text-sm) / 1.25 var(--ll-font-control);
  text-overflow: ellipsis;
}

.pipeline-loop-summary__fact,
.pipeline-loop-summary__agent-pair {
  display: inline-flex;
  flex: none;
  align-items: center;
}

.pipeline-loop-summary__fact {
  gap: var(--ll-space-2);
  color: var(--ll-color-text-muted);
  font-size: var(--ll-text-xs);
}

.pipeline-loop-summary__fact b {
  color: var(--ll-color-ink);
  font-family: var(--ll-font-mono);
  font-size: 0.6875rem;
  letter-spacing: 0.02em;
}

.pipeline-loop-summary__role {
  gap: var(--ll-space-2);
}

.pipeline-loop-summary__agent-pair {
  isolation: isolate;
}

.pipeline-loop-summary__agent-pair > :deep(.ui-icon-pill:first-child) {
  position: relative;
  z-index: 2;
}

.pipeline-loop-summary__agent-pair > :deep(.ui-icon-pill:last-child) {
  position: relative;
  z-index: 1;
  margin-left: -0.5833rem;
}

.pipeline-loop-summary__stop > span {
  font-family: var(--ll-font-mono);
}

.pipeline-loop-summary :deep(.ui-icon-pill__trigger) {
  min-height: 1.75rem;
}

.pipeline-loop-summary :deep(.ui-icon-pill__media) {
  width: 1.75rem;
  height: 1.75rem;
}

.pipeline-loop-summary :deep(.ui-icon-pill__media--icon svg) {
  width: 0.875rem;
  height: 0.875rem;
}

@media (max-width: 48rem) {
  .pipeline-loop-summary {
    gap: var(--ll-space-3);
  }

  .pipeline-loop-summary__title {
    min-width: 9rem;
  }
}
</style>
