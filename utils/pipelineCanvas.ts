import type { PipelineCanvasActivity } from '~/components/pipelines/PipelineCanvas.vue'
import type { ActivityLoopConfig, PipelineResponse } from '~/types/api'

export function pipelineCanvasActivities(
  pipeline: PipelineResponse,
  inheritedModelId: string | null = null,
): PipelineCanvasActivity[] {
  return pipeline.steps.map((activity, index) => {
    const instanceId = `pipeline-step-${index}`
    if (activity.type.endsWith('_loop')) {
      const config = activity.config as ActivityLoopConfig
      return {
        instanceId,
        type: 'loop',
        loop: {
          id: activity.id,
          title: activity.name,
          flow: activity.type.replace('_loop', ''),
          model_id: activity.model_id ?? pipeline.model_id ?? inheritedModelId,
          agents: config.agents,
          stop_conditions: config.stop_conditions,
        },
      }
    }

    return {
      instanceId,
      type: 'human-gate',
      gate: activity.type === 'quiz' ? 'multiple-choice-quiz' : 'human-review',
      title: activity.name,
    }
  })
}
