import type {
  ActivityLoopConfig,
  PipelineActivityStepRequest,
  PipelineActivityStepResponse,
} from '~/types/api'

type PipelineStep = PipelineActivityStepRequest | PipelineActivityStepResponse

export function effectiveModelId(
  agentModelId: string | null | undefined,
  activityModelId: string | null | undefined,
  inheritedModelId: string | null | undefined,
) {
  return agentModelId ?? activityModelId ?? inheritedModelId ?? null
}

export function pipelineStepsHaveModelIds(
  steps: PipelineStep[],
  inheritedModelId: string | null | undefined,
) {
  return steps.every((step) => {
    if (!step.type.endsWith('_loop')) return true
    const config = step.config as ActivityLoopConfig
    return config.agents.every(agent => Boolean(effectiveModelId(
      agent.model_id,
      step.model_id,
      inheritedModelId,
    )))
  })
}

export function modelIdLabel(modelId: string | null | undefined) {
  return modelId ?? 'No model configured'
}
