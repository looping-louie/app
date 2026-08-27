import type { ExecutionHarness, ExecutionHarnessKind } from '~/types/api'

export type ExecutionHarnessCatalogId = ExecutionHarnessKind

export interface ExecutionHarnessCatalogItem {
  id: ExecutionHarnessCatalogId
  name: string
  owner: string
  image: string
}

export const executionHarnesses: ExecutionHarnessCatalogItem[] = [
  { id: 'louie', name: 'Louie', owner: 'Looping Louie', image: '/brand/looping-louie-biplane.png' },
  { id: 'codex_cli', name: 'Codex CLI', owner: 'OpenAI', image: '/images/harnesses/codex.webp' },
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
