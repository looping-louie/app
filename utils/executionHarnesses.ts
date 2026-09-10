import type { ExecutionHarness, ExecutionHarnessKind, ModelSummary } from '~/types/api'

export type ExecutionHarnessCatalogId = ExecutionHarnessKind

export interface ExecutionHarnessCatalogItem {
  id: ExecutionHarnessCatalogId
  name: string
  owner: string
  image: string
  modelSelection: 'linked_service' | 'local_policy'
  availabilityNote: string
  setupSteps: string[]
}

export const executionHarnesses: ExecutionHarnessCatalogItem[] = [
  {
    id: 'louie',
    name: 'Louie',
    owner: 'Looping Louie',
    image: '/brand/looping-louie-biplane.png',
    modelSelection: 'linked_service',
    availabilityNote: 'The runtime reports this capability in its workspace heartbeat.',
    setupSteps: [
      'Configure the execution workspace and its repository checkout.',
      'Keep the checkout clean before starting the runtime.',
      'Validate the runtime configuration, then keep the runtime running.',
    ],
  },
  {
    id: 'codex_cli',
    name: 'Codex',
    owner: 'OpenAI',
    image: '/images/harnesses/codex.webp',
    modelSelection: 'local_policy',
    availabilityNote: 'The runtime advertises Codex only while the CLI is installed and its local login check succeeds.',
    setupSteps: [
      'Install Codex CLI and confirm that codex login status succeeds.',
      'Configure the execution workspace and keep its repository checkout clean.',
      'Run looping-louie-runtime --config runtime.json --check.',
      'Start the runtime and keep it running so its heartbeat stays current.',
    ],
  },
]

export function executionHarnessCatalogId(harness: ExecutionHarness | null | undefined): ExecutionHarnessCatalogId {
  return harness?.kind ?? 'louie'
}

export function executionHarnessValue(id: ExecutionHarnessCatalogId): ExecutionHarness {
  return {
    kind: id,
    version: 'v1',
    config: {},
  }
}

export function executionHarnessItem(harness: ExecutionHarness | null | undefined) {
  const id = executionHarnessCatalogId(harness)
  return executionHarnesses.find(candidate => candidate.id === id) ?? executionHarnesses[0]!
}

export function isModelSelectableForHarness(
  model: ModelSummary,
  harness: ExecutionHarness | null | undefined,
) {
  return executionHarnessItem(harness).modelSelection === 'local_policy'
    ? model.enabled && model.status !== 'deprecated'
    : model.available
}
