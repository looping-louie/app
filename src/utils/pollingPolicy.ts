export const pollingPolicy = {
  pipelineRuns: {
    refreshDelay: 60_000,
    catalogDelay: 60_000,
  },
  humanGateNotifications: {
    refreshDelay: 60_000,
  },
} as const
