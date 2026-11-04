const modelLogoPatterns = [
  { logo: 'anthropic', patterns: ['anthropic', 'claude'] },
  { logo: 'deepseek', patterns: ['deepseek'] },
  { logo: 'gemma', patterns: ['gemma'] },
  { logo: 'gemini', patterns: ['gemini', 'google'] },
  { logo: 'grok', patterns: ['grok', 'x.ai', 'xai'] },
  { logo: 'kimi', patterns: ['kimi', 'moonshot'] },
  { logo: 'meta', patterns: ['meta', 'llama'] },
  { logo: 'minimax', patterns: ['minimax'] },
  { logo: 'nvidia', patterns: ['nvidia', 'nemotron'] },
  { logo: 'openai', patterns: ['openai', 'gpt-', '/gpt', ':gpt', 'o1-', 'o3-', 'o4-'] },
  { logo: 'qwen', patterns: ['qwen'] },
] as const

const providerLogoFiles: Record<string, string> = {
  anthropic: 'anthropic',
  deepcogito: 'deepcogito',
  deepseek: 'deepseek',
  meta: 'meta',
  minimax: 'minimax',
  mistral: 'mistral',
  mistralai: 'mistral',
  moonshot: 'moonshot',
  moonshotai: 'moonshot',
  nvidia: 'nvidia',
  openai: 'openai',
  qwen: 'qwen',
  xai: 'grok',
  zai: 'zai',
}

function normalizeProvider(provider: string): string {
  return provider.toLowerCase().replace(/[^a-z0-9]+/g, '')
}

export function useModelLogo() {
  function modelLogo(modelId: string): string {
    const normalizedId = modelId.toLowerCase()
    const match = modelLogoPatterns.find(candidate => (
      candidate.patterns.some(pattern => normalizedId.includes(pattern))
    ))

    return `/images/models/${match?.logo ?? 'openai'}.webp`
  }

  function providerLogo(provider: string, family = ''): string | undefined {
    const normalizedProvider = normalizeProvider(provider)

    if (normalizedProvider === 'google') {
      const googleLogo = family.toLowerCase().startsWith('gemma') ? 'gemma' : 'gemini'
      return `/images/models/${googleLogo}.webp`
    }

    const logo = providerLogoFiles[normalizedProvider]
    return logo ? `/images/models/${logo}.webp` : undefined
  }

  return { modelLogo, providerLogo }
}
