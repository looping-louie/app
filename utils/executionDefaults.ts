export function effectiveModelId(
  agentModelId: string | null | undefined,
  activityModelId: string | null | undefined,
  inheritedModelId: string | null | undefined,
) {
  return agentModelId ?? activityModelId ?? inheritedModelId ?? null
}

export function modelIdLabel(modelId: string | null | undefined) {
  return modelId ?? 'No model configured'
}
