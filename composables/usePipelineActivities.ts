import type { ActivityResponse, PipelineActivityStep } from '~/types/api'

export function usePipelineActivities() {
  const api = useApiClient()

  async function resolve(steps: PipelineActivityStep[]) {
    const ids = [...new Set(steps.map(step => step.activity_id))]
    const activities = await Promise.all(ids.map(async (id) => {
      try {
        return await api.activities.get(id)
      } catch {
        return null
      }
    }))
    return activities.filter((activity): activity is ActivityResponse => activity !== null)
  }

  return { resolve }
}
