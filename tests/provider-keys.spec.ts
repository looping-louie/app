import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { nextTick } from 'vue'
import KeysPage from '~/pages/app/keys.vue'

// ── Types ────────────────────────────────────────────

interface Provider {
  id: string
  name: string
  description: string
  logo: string
  enabled: boolean
  requiresApiKey: boolean
  baseUrl?: string
  keyTrimmed?: string
  modelCount: number
}

interface SaveResult {
  key_trimmed: string
  model_count: number
}

interface SetEnabledResult {
  has_credential: boolean
  key_trimmed?: string
  model_count?: number
}

// ── Mock factories ───────────────────────────────────

function makeProvider(overrides: Partial<Provider> = {}): Provider {
  return {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT models.',
    logo: '/providers/openai.jpg',
    enabled: false,
    requiresApiKey: true,
    modelCount: 0,
    ...overrides,
  }
}

const sampleProviders: Provider[] = [
  makeProvider({
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT models.',
    logo: '/providers/openai.jpg',
    modelCount: 0,
  }),
  makeProvider({
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude models.',
    logo: '/providers/anthropic.jpg',
    modelCount: 0,
  }),
  makeProvider({
    id: 'ollama',
    name: 'Ollama',
    description: 'Local models.',
    logo: '/providers/ollama.jpg',
    requiresApiKey: false,
    baseUrl: 'http://localhost:11434',
    modelCount: 0,
  }),
]

// ── Composable mocks ────────────────────────────────

const mockProviders = ref<Provider[]>([])
const mockPending = ref(false)
const mockError = ref<string | null>(null)

const fetchProviders = vi.fn(async () => {
  mockProviders.value = [...sampleProviders]
})

const saveCredential = vi.fn(async (_id: string, _body: Record<string, string>): Promise<SaveResult> => {
  return { key_trimmed: 'sk-…1234', model_count: 42 }
})

const setEnabled = vi.fn(async (_id: string, _enabled: boolean): Promise<SetEnabledResult> => {
  return { has_credential: false }
})

vi.mock('~/composables/useProviders', () => ({
  useProviders: () => ({
    providers: mockProviders,
    pending: mockPending,
    error: mockError,
    fetchProviders,
    saveCredential,
    setEnabled,
  }),
}))

const mockToasts = ref<Array<{ id: number; message: string; type: 'success' | 'error' }>>([])
let toastId = 0

const pushToast = vi.fn((message: string, type: 'success' | 'error' = 'success') => {
  mockToasts.value.push({ id: ++toastId, message, type })
})

const dismissToast = vi.fn((id: number) => {
  mockToasts.value = mockToasts.value.filter((t) => t.id !== id)
})

vi.mock('~/composables/useToasts', () => ({
  useToasts: () => ({
    toasts: mockToasts,
    pushToast,
    dismissToast,
  }),
}))

// ── Layout mock ──────────────────────────────────────

// Stub NuxtLayout so the page renders its content directly.
const NuxtLayout = { template: '<div><slot /></div>' }

// ── Helpers ──────────────────────────────────────────

function mountKeys() {
  return mount(KeysPage, {
    global: {
      plugins: [createTestingPinia({ stubActions: false })],
      stubs: {
        NuxtLayout,
        NuxtLink: true,
        ClientOnly: { template: '<div><slot /></div>' },
        Teleport: { template: '<div><slot /></div>' },
        TransitionGroup: { template: '<div><slot /></div>' },
        Transition: { template: '<div><slot /></div>' },
      },
    },
  })
}

function getProviderById(wrapper: ReturnType<typeof mount>, id: string) {
  return mockProviders.value.find((p) => p.id === id)!
}

function findProviderCard(wrapper: ReturnType<typeof mount>, id: string) {
  const cards = wrapper.findAll('.provider-card')
  return cards.find((c) => c.find('img').attributes('src')?.includes(id))
}

function findToggle(wrapper: ReturnType<typeof mount>, id: string) {
  const card = findProviderCard(wrapper, id)
  return card?.find('[role="switch"]')
}

async function clickToggle(wrapper: ReturnType<typeof mount>, id: string) {
  const toggle = findToggle(wrapper, id)
  await toggle!.trigger('click')
  await flushPromises()
}

// ── Tests ───────────────────────────────────────────

describe('provider keys page', () => {
  beforeEach(() => {
    mockProviders.value = []
    mockPending.value = false
    mockError.value = null
    mockToasts.value = []
    toastId = 0
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ── Sidebar ──────────────────────────────────────

  describe('sidebar', () => {
    it('renders nav items in the exact expected order', async () => {
      const wrapper = mountKeys()
      await flushPromises()

      const navItems = wrapper.findAll('.nav-item')
      const labels = navItems.map((n) => n.attributes('aria-label'))

      expect(labels).toEqual([
        'Runs',
        'Observability',
        'Human review',
        'Ideas',
        'Tasks',
        'Loops',
        'Councils',
        'Personas',
        'Skills',
        'Models',
        'Settings',
      ])
    })

    it('renders horizontal dividers between groups but no section headings', async () => {
      const wrapper = mountKeys()
      await flushPromises()

      const dividers = wrapper.findAll('.nav-divider')
      // 5 groups → 4 dividers between them
      expect(dividers).toHaveLength(4)

      // No heading elements inside the nav
      const nav = wrapper.find('.sidebar-nav')
      expect(nav.find('h2').exists()).toBe(false)
      expect(nav.find('h3').exists()).toBe(false)
      expect(nav.find('.nav-group-title').exists()).toBe(false)
    })
  })

  // ── First-load empty state ──────────────────────

  it('shows an empty state in Enabled providers on first load when none are enabled', async () => {
    mockProviders.value = sampleProviders.map((p) => ({ ...p, enabled: false }))
    const wrapper = mountKeys()
    await flushPromises()

    const sections = wrapper.findAll('.providers-section')
    const enabledSection = sections[0]
    const empty = enabledSection.find('.empty-state')
    expect(empty.exists()).toBe(true)
    expect(empty.text()).toContain('not enabled any providers')
  })

  // ── Provider ordering ───────────────────────────

  it('renders providers in the exact order returned by the composable', async () => {
    const ordered = [
      makeProvider({ id: 'z-last', name: 'Z Last', logo: '/providers/z-last.jpg' }),
      makeProvider({ id: 'a-first', name: 'A First', logo: '/providers/a-first.jpg' }),
      makeProvider({ id: 'm-middle', name: 'M Middle', logo: '/providers/m-middle.jpg' }),
    ]
    mockProviders.value = ordered
    const wrapper = mountKeys()
    await flushPromises()

    const cards = wrapper.findAll('.provider-card')
    const srcs = cards.map((c) => c.find('img').attributes('src'))
    expect(srcs).toEqual(['/providers/z-last.jpg', '/providers/a-first.jpg', '/providers/m-middle.jpg'])
  })

  // ── JPEG logo paths ─────────────────────────────

  it('uses .jpg paths for provider logos', async () => {
    mockProviders.value = sampleProviders
    const wrapper = mountKeys()
    await flushPromises()

    const logos = wrapper.findAll('.provider-logo')
    expect(logos.length).toBeGreaterThan(0)
    logos.forEach((logo) => {
      const src = logo.attributes('src') || ''
      expect(src).toMatch(/\.jpg$/)
    })
  })

  // ── Moving between Available and Enabled ────────

  it('moves a provider from Available to Enabled when toggled on', async () => {
    mockProviders.value = sampleProviders.map((p) => ({ ...p, enabled: false }))
    setEnabled.mockResolvedValue({ has_credential: false })

    const wrapper = mountKeys()
    await flushPromises()

    const sections = wrapper.findAll('.providers-section')
    expect(sections[0].findAll('.provider-card')).toHaveLength(0) // enabled
    expect(sections[1].findAll('.provider-card')).toHaveLength(3) // available

    await clickToggle(wrapper, 'openai')

    const sectionsAfter = wrapper.findAll('.providers-section')
    expect(sectionsAfter[0].findAll('.provider-card')).toHaveLength(1) // now enabled
    expect(sectionsAfter[1].findAll('.provider-card')).toHaveLength(2) // available
  })

  it('moves a provider from Enabled to Available when toggled off', async () => {
    mockProviders.value = sampleProviders.map((p) => ({ ...p, enabled: false }))
    setEnabled.mockResolvedValue({ has_credential: false })

    const wrapper = mountKeys()
    await flushPromises()

    // Enable first
    await clickToggle(wrapper, 'openai')
    expect(wrapper.findAll('.providers-section')[0].findAll('.provider-card')).toHaveLength(1)

    // Disable
    setEnabled.mockResolvedValue({ has_credential: true })
    await clickToggle(wrapper, 'openai')

    const sections = wrapper.findAll('.providers-section')
    expect(sections[0].findAll('.provider-card')).toHaveLength(0)
    expect(sections[1].findAll('.provider-card')).toHaveLength(3)
  })

  // ── Successful credential save ──────────────────

  it('saves credentials and updates the provider card', async () => {
    mockProviders.value = sampleProviders.map((p) => ({ ...p, enabled: false }))
    setEnabled.mockResolvedValue({ has_credential: false })
    saveCredential.mockResolvedValue({ key_trimmed: 'sk-…abcd', model_count: 15 })

    const wrapper = mountKeys()
    await flushPromises()

    // Enable openai → shows config form
    await clickToggle(wrapper, 'openai')

    const card = findProviderCard(wrapper, 'openai')!
    const apiKeyInput = card.find('input[type="password"]')
    await apiKeyInput.setValue('sk-test-key-12345')

    const saveBtn = card.find('.btn-save')
    await saveBtn.trigger('click')
    await flushPromises()

    expect(saveCredential).toHaveBeenCalledWith('openai', { api_key: 'sk-test-key-12345' })

    // Provider should now show masked key and model count
    const updatedCard = findProviderCard(wrapper, 'openai')!
    expect(updatedCard.text()).toContain('sk-…abcd')
    expect(updatedCard.text()).toContain('15')
  })

  // ── Toast success message ──────────────────────

  it('pushes a success toast on credential save', async () => {
    mockProviders.value = sampleProviders.map((p) => ({ ...p, enabled: false }))
    setEnabled.mockResolvedValue({ has_credential: false })
    saveCredential.mockResolvedValue({ key_trimmed: 'sk-…abcd', model_count: 15 })

    const wrapper = mountKeys()
    await flushPromises()

    await clickToggle(wrapper, 'openai')
    const card = findProviderCard(wrapper, 'openai')!
    await card.find('input[type="password"]').setValue('sk-test-key-12345')
    await card.find('.btn-save').trigger('click')
    await flushPromises()

    expect(pushToast).toHaveBeenCalledWith(
      expect.stringContaining('API key saved successfully'),
    )
  })

  // ── model_count from API ───────────────────────

  it('displays model_count returned by the API after enabling with existing credential', async () => {
    mockProviders.value = sampleProviders.map((p) => ({ ...p, enabled: false }))
    setEnabled.mockResolvedValue({
      has_credential: true,
      key_trimmed: 'sk-…9999',
      model_count: 77,
    })

    const wrapper = mountKeys()
    await flushPromises()

    await clickToggle(wrapper, 'openai')

    const card = findProviderCard(wrapper, 'openai')!
    expect(card.text()).toContain('77')
  })

  // ── Masked key from key_trimmed ─────────────────

  it('renders the masked key from key_trimmed after enabling with existing credential', async () => {
    mockProviders.value = sampleProviders.map((p) => ({ ...p, enabled: false }))
    setEnabled.mockResolvedValue({
      has_credential: true,
      key_trimmed: 'sk-…9999',
      model_count: 5,
    })

    const wrapper = mountKeys()
    await flushPromises()

    await clickToggle(wrapper, 'openai')

    const card = findProviderCard(wrapper, 'openai')!
    expect(card.text()).toContain('sk-…9999')
  })

  // ── Clear plaintext input after save ─────────────

  it('clears the plaintext API key input after a successful save', async () => {
    mockProviders.value = sampleProviders.map((p) => ({ ...p, enabled: false }))
    setEnabled.mockResolvedValue({ has_credential: false })
    saveCredential.mockResolvedValue({ key_trimmed: 'sk-…abcd', model_count: 15 })

    const wrapper = mountKeys()
    await flushPromises()

    await clickToggle(wrapper, 'openai')
    const card = findProviderCard(wrapper, 'openai')!
    const input = card.find('input[type="password"]')
    await input.setValue('sk-test-key-12345')
    await card.find('.btn-save').trigger('click')
    await flushPromises()

    // Config form should be gone, so no password input visible
    const updatedCard = findProviderCard(wrapper, 'openai')!
    expect(updatedCard.find('input[type="password"]').exists()).toBe(false)
  })

  // ── Failed save returns provider to Available ──

  it('returns the provider to Available providers when save fails', async () => {
    mockProviders.value = sampleProviders.map((p) => ({ ...p, enabled: false }))
    setEnabled.mockResolvedValue({ has_credential: false })
    saveCredential.mockRejectedValue(new Error('Invalid API key'))

    const wrapper = mountKeys()
    await flushPromises()

    await clickToggle(wrapper, 'openai')
    const card = findProviderCard(wrapper, 'openai')!
    await card.find('input[type="password"]').setValue('sk-bad-key')
    await card.find('.btn-save').trigger('click')
    await flushPromises()

    const provider = getProviderById(wrapper, 'openai')
    expect(provider.enabled).toBe(false)

    const sections = wrapper.findAll('.providers-section')
    expect(sections[0].findAll('.provider-card')).toHaveLength(0)
    expect(sections[1].findAll('.provider-card')).toHaveLength(3)
  })

  // ── Disabling without deleting credential ──────

  it('disables a provider without deleting the stored credential', async () => {
    mockProviders.value = sampleProviders.map((p) => ({
      ...p,
      enabled: false,
      keyTrimmed: 'sk-…1234',
      modelCount: 10,
    }))
    // First enable: has credential
    setEnabled.mockResolvedValueOnce({ has_credential: true, key_trimmed: 'sk-…1234', model_count: 10 })

    const wrapper = mountKeys()
    await flushPromises()

    // Enable
    await clickToggle(wrapper, 'openai')
    const provider = getProviderById(wrapper, 'openai')
    expect(provider.enabled).toBe(true)
    expect(provider.keyTrimmed).toBe('sk-…1234')

    // Disable
    setEnabled.mockResolvedValueOnce({ has_credential: true })
    await clickToggle(wrapper, 'openai')

    expect(setEnabled).toHaveBeenCalledWith('openai', false)
    expect(provider.enabled).toBe(false)
    // Credential info preserved in local state
    expect(provider.keyTrimmed).toBe('sk-…1234')
  })

  // ── Re-enabling an existing credential ──────────

  it('re-enables a provider with an existing credential without showing the config form', async () => {
    mockProviders.value = sampleProviders.map((p) => ({ ...p, enabled: false }))
    setEnabled.mockResolvedValue({
      has_credential: true,
      key_trimmed: 'sk-…5678',
      model_count: 20,
    })

    const wrapper = mountKeys()
    await flushPromises()

    await clickToggle(wrapper, 'openai')

    const card = findProviderCard(wrapper, 'openai')!
    // Should not show config form
    expect(card.find('.config-form').exists()).toBe(false)
    // Should show masked key
    expect(card.text()).toContain('sk-…5678')
    expect(card.text()).toContain('20')
  })

  // ── Ollama with base URL and no API key ─────────

  it('allows saving Ollama with a base URL and no API key', async () => {
    mockProviders.value = sampleProviders.map((p) => ({ ...p, enabled: false }))
    setEnabled.mockResolvedValue({ has_credential: false })
    saveCredential.mockResolvedValue({ key_trimmed: '', model_count: 5 })

    const wrapper = mountKeys()
    await flushPromises()

    await clickToggle(wrapper, 'ollama')
    const card = findProviderCard(wrapper, 'ollama')!

    // Should have a URL input
    const urlInput = card.find('input[type="url"]')
    expect(urlInput.exists()).toBe(true)
    await urlInput.setValue('http://localhost:11434')

    // API key input should be optional
    const passwordInput = card.find('input[type="password"]')
    expect(passwordInput.exists()).toBe(true)
    // Leave password empty

    await card.find('.btn-save').trigger('click')
    await flushPromises()

    expect(saveCredential).toHaveBeenCalledWith('ollama', {
      base_url: 'http://localhost:11434',
    })
  })

  // ── Loading state ──────────────────────────────

  it('shows a loading state while providers are being fetched', async () => {
    mockPending.value = true
    mockProviders.value = []

    const wrapper = mountKeys()
    await flushPromises()

    const spinners = wrapper.findAll('.spinner')
    expect(spinners.length).toBeGreaterThan(0)
    expect(wrapper.text()).toContain('Loading providers')
  })

  // ── API error state ─────────────────────────────

  it('shows an error state with retry button when fetch fails', async () => {
    mockError.value = 'Failed to load providers'
    mockProviders.value = []

    const wrapper = mountKeys()
    await flushPromises()

    const errorCards = wrapper.findAll('.state-error')
    expect(errorCards.length).toBeGreaterThan(0)
    expect(wrapper.text()).toContain('Failed to load providers')

    const retryBtn = wrapper.find('.btn-retry')
    expect(retryBtn.exists()).toBe(true)
  })

  // ── No plaintext key in HTML, storage, or console ─

  it('does not render the plaintext API key in the HTML after save', async () => {
    mockProviders.value = sampleProviders.map((p) => ({ ...p, enabled: false }))
    setEnabled.mockResolvedValue({ has_credential: false })
    saveCredential.mockResolvedValue({ key_trimmed: 'sk-…abcd', model_count: 15 })

    const wrapper = mountKeys()
    await flushPromises()

    await clickToggle(wrapper, 'openai')
    const card = findProviderCard(wrapper, 'openai')!
    await card.find('input[type="password"]').setValue('sk-super-secret-key')
    await card.find('.btn-save').trigger('click')
    await flushPromises()

    const html = wrapper.html()
    expect(html).not.toContain('sk-super-secret-key')
  })

  it('does not store the plaintext API key in browser storage', async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
    const localStorageSetSpy = vi.spyOn(window.localStorage, 'setItem')

    mockProviders.value = sampleProviders.map((p) => ({ ...p, enabled: false }))
    setEnabled.mockResolvedValue({ has_credential: false })
    saveCredential.mockResolvedValue({ key_trimmed: 'sk-…abcd', model_count: 15 })

    const wrapper = mountKeys()
    await flushPromises()

    await clickToggle(wrapper, 'openai')
    const card = findProviderCard(wrapper, 'openai')!
    await card.find('input[type="password"]').setValue('sk-super-secret-key')
    await card.find('.btn-save').trigger('click')
    await flushPromises()

    const allCalls = [
      ...(setItemSpy.mock.calls || []),
      ...(localStorageSetSpy.mock.calls || []),
    ]
    allCalls.forEach((call) => {
      const value = String(call[1] || '')
      expect(value).not.toContain('sk-super-secret-key')
    })
  })

  it('does not log the plaintext API key to the console', async () => {
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
    const consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})

    mockProviders.value = sampleProviders.map((p) => ({ ...p, enabled: false }))
    setEnabled.mockResolvedValue({ has_credential: false })
    saveCredential.mockResolvedValue({ key_trimmed: 'sk-…abcd', model_count: 15 })

    const wrapper = mountKeys()
    await flushPromises()

    await clickToggle(wrapper, 'openai')
    const card = findProviderCard(wrapper, 'openai')!
    await card.find('input[type="password"]').setValue('sk-super-secret-key')
    await card.find('.btn-save').trigger('click')
    await flushPromises()

    const allCalls = [
      ...consoleLogSpy.mock.calls,
      ...consoleErrorSpy.mock.calls,
      ...consoleWarnSpy.mock.calls,
      ...consoleInfoSpy.mock.calls,
      ...consoleDebugSpy.mock.calls,
    ]
    allCalls.forEach((call) => {
      call.forEach((arg) => {
        expect(String(arg)).not.toContain('sk-super-secret-key')
      })
    })
  })
})
