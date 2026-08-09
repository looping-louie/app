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

export function useModelLogo() {
  function modelLogo(modelId: string): string {
    const normalizedId = modelId.toLowerCase()
    const match = modelLogoPatterns.find(candidate => (
      candidate.patterns.some(pattern => normalizedId.includes(pattern))
    ))

    return `/images/models/${match?.logo ?? 'openai'}.webp`
  }

  return { modelLogo }
}
