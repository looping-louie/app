import type {
  ActivityLoopConfig,
  ModelTarget,
  PipelineActivityStepRequest,
  PipelineActivityStepResponse,
} from '~/types/api'

type PipelineStep = PipelineActivityStepRequest | PipelineActivityStepResponse

export function effectiveModelTarget(
  agentTarget: ModelTarget | null | undefined,
  activityTarget: ModelTarget | null | undefined,
  inheritedTarget: ModelTarget | null | undefined,
) {
  return agentTarget ?? activityTarget ?? inheritedTarget ?? null
}

export function pipelineStepsHaveModelTargets(
  steps: PipelineStep[],
  inheritedTarget: ModelTarget | null | undefined,
) {
  return steps.every((step) => {
    if (!step.type.endsWith('_loop')) return true
    const config = step.config as ActivityLoopConfig
    return config.agents.every(agent => Boolean(effectiveModelTarget(
      agent.model_target,
      step.model_target,
      inheritedTarget,
    )))
  })
}

export function modelTargetLabel(target: ModelTarget | null | undefined) {
  return target ? target.model_id : 'No model configured'
}
