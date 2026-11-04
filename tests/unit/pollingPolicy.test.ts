import { describe, expect, it } from 'vitest'

import { pollingPolicy } from '~/utils/pollingPolicy'

describe('polling policy', () => {
  it('limits run status refreshes to the one-minute catalog cadence', () => {
    expect(pollingPolicy.pipelineRuns.refreshDelay)
      .toBe(pollingPolicy.pipelineRuns.catalogDelay)
  })

  it('refreshes global notifications no more often than the catalog refresh cadence', () => {
    expect(pollingPolicy.humanGateNotifications.refreshDelay)
      .toBeGreaterThanOrEqual(pollingPolicy.pipelineRuns.catalogDelay)
  })

})
