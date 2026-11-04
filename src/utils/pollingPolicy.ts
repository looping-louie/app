export const pollingPolicy = {
  pipelineRuns: {
    activeDelay: 2_500,
    passiveMaximumDelay: 30_000,
    catalogDelay: 30_000,
  },
  humanGateNotifications: {
    refreshDelay: 30_000,
  },
} as const
