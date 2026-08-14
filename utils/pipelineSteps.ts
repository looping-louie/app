import type { PipelineActivityStepRequest, PipelineActivityStepResponse } from '~/types/api'

function cloneApiValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export function pipelineStepRequestsFromResponse(
  steps: PipelineActivityStepResponse[],
): PipelineActivityStepRequest[] {
  return steps.map(step => ({
    name: step.name,
    description: step.description,
    type: step.type,
    config: cloneApiValue(step.config),
    dependsOn: step.dependsOn.map(dependency => ({ ...dependency })),
  })) as PipelineActivityStepRequest[]
}
