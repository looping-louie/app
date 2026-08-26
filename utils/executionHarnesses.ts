import type { ExecutionHarness } from '~/types/api'

export type ExecutionHarnessCatalogId =
  | 'codex'
  | 'pi'
  | 'cursor'
  | 'copilot'
  | 'claude'
  | 'grok-build'
  | 'hermes'
  | 'openclaw'

export interface ExecutionHarnessCatalogItem {
  id: ExecutionHarnessCatalogId
  name: string
  owner: string
  image: string
}

export const executionHarnesses: ExecutionHarnessCatalogItem[] = [
  { id: 'codex', name: 'Codex', owner: 'OpenAI', image: '/images/harnesses/codex.webp' },
  { id: 'pi', name: 'Pi', owner: 'Badlogic', image: '/images/harnesses/pi.webp' },
  { id: 'cursor', name: 'Cursor', owner: 'SpaceX AI', image: '/images/harnesses/cursor.webp' },
  { id: 'copilot', name: 'Copilot', owner: 'Microsoft', image: '/images/harnesses/copilot.webp' },
  { id: 'claude', name: 'Claude', owner: 'Anthropic', image: '/images/harnesses/claude.webp' },
  { id: 'grok-build', name: 'Grok build', owner: 'SpaceXAI', image: '/images/harnesses/grok-build.webp' },
  { id: 'hermes', name: 'Hermes', owner: 'Nous Research', image: '/images/harnesses/hermes.webp' },
  { id: 'openclaw', name: 'OpenClaw', owner: 'OpenAI', image: '/images/harnesses/openclaw.webp' },
]

export function executionHarnessCatalogId(harness: ExecutionHarness | null | undefined): ExecutionHarnessCatalogId {
  const kind = String(harness?.kind ?? '')
  if (!kind || kind === 'codex_cli' || kind === 'louie') return 'codex'
  return executionHarnesses.some(item => item.id === kind)
    ? kind as ExecutionHarnessCatalogId
    : 'codex'
}

export function executionHarnessValue(id: ExecutionHarnessCatalogId): ExecutionHarness {
  return {
    kind: (id === 'codex' ? 'codex_cli' : id) as ExecutionHarness['kind'],
    version: 'v1',
    config: {},
  }
}
