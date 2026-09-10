import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useApiClient } from '~/composables/useApiClient'
import { useWorkspaceContext } from '~/composables/useWorkspaceContext'

describe('API project context', () => {
  const state = new Map<string, { value: unknown }>()
  const fetchMock = vi.fn()

  beforeEach(() => {
    state.clear()
    fetchMock.mockReset()
    vi.stubGlobal('$fetch', fetchMock)
    vi.stubGlobal('useApiClient', useApiClient)
    vi.stubGlobal('useCookie', () => ({ value: 'project-1' }))
    vi.stubGlobal('useState', (key: string, factory: () => unknown) => {
      if (!state.has(key)) state.set(key, { value: factory() })
      return state.get(key)
    })
    vi.stubGlobal('computed', (getter: () => unknown) => ({
      get value() { return getter() },
    }))
  })

  it('uses Project routes and selection headers', async () => {
    fetchMock.mockResolvedValue({ items: [], total: 0 })
    const api = useApiClient()

    await api.workspaces.list()
    await api.pipelineRuns.list({ offset: 0 })

    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/v1/projects')
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/v1/pipeline-runs', {
      headers: { 'X-Project-ID': 'project-1' },
      query: { offset: 0 },
    })
  })

  it('does not register the same user again when only Project loading fails', async () => {
    fetchMock.mockImplementation((path: string) => {
      if (path === '/api/v1/users') return Promise.resolve({ id: 'user-1' })
      return Promise.reject(new Error('Projects unavailable'))
    })
    const context = useWorkspaceContext()

    await context.initialize()
    await context.initialize()

    expect(fetchMock.mock.calls.filter(([path]) => path === '/api/v1/users')).toHaveLength(1)
    expect(fetchMock.mock.calls.filter(([path]) => path === '/api/v1/projects')).toHaveLength(2)
  })
})
