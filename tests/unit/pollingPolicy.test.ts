import { describe, expect, it } from 'vitest'

import { pollingPolicy } from '~/utils/pollingPolicy'

describe('polling policy', () => {
  it('limits global notification refreshes to the catalog refresh cadence', () => {
    expect(pollingPolicy.humanGateNotifications.refreshDelay)
      .toBe(pollingPolicy.pipelineRuns.catalogDelay)
  })

  it('caps passive run polling at the catalog refresh cadence', () => {
    expect(pollingPolicy.pipelineRuns.passiveMaximumDelay)
      .toBe(pollingPolicy.pipelineRuns.catalogDelay)
  })
})
