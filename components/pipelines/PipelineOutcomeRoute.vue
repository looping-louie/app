<script setup lang="ts">
import UiPill from '~/components/ui/Pill.vue'

type Outcome = 'success' | 'failure'
type FailureMode = 'stop' | 'retry' | 'previous'

const props = withDefaults(defineProps<{
  highlighted?: Outcome | null
  failureMode?: FailureMode
  returnDepth?: number
}>(), {
  highlighted: null,
  failureMode: 'stop',
  returnDepth: 1,
})

const emit = defineEmits<{
  highlight: [outcome: Outcome | null]
}>()

const routeTurnY = 32
const retryTargetY = -144
const retryCrownY = retryTargetY - routeTurnY
const retryViewMinY = retryCrownY - 2
const retryViewHeight = 96 - retryViewMinY
const previousTargetY = computed(() => -382 - (Math.max(1, props.returnDepth) - 1) * 240)
const previousTargetX = computed(() => 452 - Math.min(3, Math.max(1, props.returnDepth) - 1) * 24)
const previousCrownY = computed(() => previousTargetY.value - 56)
const previousMidY = computed(() => Math.round((routeTurnY + previousCrownY.value + 24) / 2))
const previousViewMinY = computed(() => previousCrownY.value - 2)
const previousViewHeight = computed(() => 96 - previousViewMinY.value)

const routeViewBox = computed(() => {
  if (props.failureMode === 'retry') return `0 ${retryViewMinY} 1000 ${retryViewHeight}`
  if (props.failureMode === 'previous') return `0 ${previousViewMinY.value} 1000 ${previousViewHeight.value}`
  return '0 0 1000 96'
})

const routeStyle = computed(() => {
  if (props.failureMode === 'retry') {
    return { '--pipeline-retry-map-height': `${retryViewHeight * (5 / 6)}px` }
  }
  if (props.failureMode !== 'previous') return undefined
  return {
    '--pipeline-previous-map-height': `${previousViewHeight.value * (5 / 6)}px`,
    '--pipeline-previous-signal-top': `${previousMidY.value * (5 / 6)}px`,
  }
})

const previousLinePath = computed(() => [
  `M500 2V12Q500 ${routeTurnY} 484 ${routeTurnY}H276Q252 ${routeTurnY} 252 4`,
  `V${previousCrownY.value + 24}Q252 ${previousCrownY.value} 276 ${previousCrownY.value}`,
  `H${previousTargetX.value - 24}Q${previousTargetX.value} ${previousCrownY.value} ${previousTargetX.value} ${previousCrownY.value + 24}`,
  `V${previousTargetY.value}`,
].join(''))

const previousTipPath = computed(() => {
  const target = previousTargetY.value
  const targetX = previousTargetX.value
  return `M${targetX - 9} ${target - 12}L${targetX} ${target}L${targetX + 9} ${target - 12}`
})
</script>

<template>
  <div
    class="pipeline-outcome-route"
    draggable="false"
    :style="routeStyle"
    :class="[
      `pipeline-outcome-route--${failureMode}`,
      {
        'is-success-highlighted': highlighted === 'success',
        'is-failure-highlighted': highlighted === 'failure',
      },
    ]"
    @pointerdown.stop
    @mousedown.stop
    @dragstart.stop.prevent
  >
    <svg
      class="pipeline-outcome-route__map"
      :viewBox="routeViewBox"
      preserveAspectRatio="none"
      fill="none"
      aria-hidden="true"
    >
      <path class="pipeline-outcome-route__line pipeline-outcome-route__line--success" d="M500 2V84" />
      <path class="pipeline-outcome-route__tip pipeline-outcome-route__tip--success" d="M491 73C494 77 497 81 500 86C503 81 506 77 509 73" />

      <template v-if="failureMode === 'stop'">
        <path
          class="pipeline-outcome-route__line pipeline-outcome-route__line--failure"
          d="M500 2V16Q500 40 524 40H798"
          @pointerenter="emit('highlight', 'failure')"
          @pointerleave="emit('highlight', null)"
        />
        <path
          class="pipeline-outcome-route__tip pipeline-outcome-route__tip--failure"
          d="M786 31C791 34 795 37 801 40C795 43 791 46 786 49"
          @pointerenter="emit('highlight', 'failure')"
          @pointerleave="emit('highlight', null)"
        />
        <path
          class="pipeline-outcome-route__hit"
          d="M500 2V16Q500 40 524 40H798"
          @pointerenter="emit('highlight', 'failure')"
          @pointerleave="emit('highlight', null)"
        />
      </template>

      <template v-else-if="failureMode === 'retry'">
        <path class="pipeline-outcome-route__line pipeline-outcome-route__line--failure" d="M500 2V12Q500 32 516 32H680Q720 32 720-8V-136Q720-176 680-176H572Q548-176 548-152V-144" />
        <path class="pipeline-outcome-route__tip pipeline-outcome-route__tip--failure" d="M539-156L548-144L557-156" />
        <path
          class="pipeline-outcome-route__hit"
          d="M500 2V12Q500 32 516 32H680Q720 32 720-8V-136Q720-176 680-176H572Q548-176 548-152V-144"
          @mouseenter="emit('highlight', 'failure')"
          @mouseleave="emit('highlight', null)"
        />
      </template>

      <template v-else>
        <path class="pipeline-outcome-route__line pipeline-outcome-route__line--failure" :d="previousLinePath" />
        <path class="pipeline-outcome-route__tip pipeline-outcome-route__tip--failure" :d="previousTipPath" />
        <path
          class="pipeline-outcome-route__hit"
          :d="previousLinePath"
          @mouseenter="emit('highlight', 'failure')"
          @mouseleave="emit('highlight', null)"
        />
      </template>

      <path
        class="pipeline-outcome-route__hit"
        d="M500 2V84"
        @mouseenter="emit('highlight', 'success')"
        @mouseleave="emit('highlight', null)"
      />
    </svg>

    <span v-if="highlighted === 'success'" class="pipeline-outcome-route__signal pipeline-outcome-route__signal--success" aria-hidden="true">
      <svg viewBox="0 0 256 256" fill="currentColor">
        <path d="M243.28,68.24l-24-23.56a16,16,0,0,0-22.59,0L104,136.23l-36.69-35.6a16,16,0,0,0-22.58.05l-24,24a16,16,0,0,0,0,22.61l71.62,72a16,16,0,0,0,22.63,0L243.33,90.91A16,16,0,0,0,243.28,68.24ZM103.62,208,32,136l24-24a.6.6,0,0,1,.08.08l42.35,41.09a8,8,0,0,0,11.19,0L208.06,56,232,79.6Z" />
      </svg>
    </span>

    <span v-if="highlighted === 'failure'" class="pipeline-outcome-route__signal pipeline-outcome-route__signal--failure" aria-hidden="true">
      <svg viewBox="0 0 256 256" fill="currentColor">
        <path d="M236.8,188.09,149.35,36.22h0a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09ZM222.93,203.8a8.5,8.5,0,0,1-7.48,4.2H40.55a8.5,8.5,0,0,1-7.48-4.2,7.59,7.59,0,0,1,0-7.72L120.52,44.21a8.75,8.75,0,0,1,15,0l87.45,151.87A7.59,7.59,0,0,1,222.93,203.8ZM120,144V104a8,8,0,0,1,16,0v40a8,8,0,0,1-16,0Zm20,36a12,12,0,1,1-12-12A12,12,0,0,1,140,180Z" />
      </svg>
    </span>

    <UiPill
      v-if="failureMode === 'stop'"
      class="pipeline-outcome-route__stop"
      :focusable="false"
      @mouseenter="emit('highlight', 'failure')"
      @mouseleave="emit('highlight', null)"
    >
      <template #icon>
        <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
          <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216ZM160,88H96a8,8,0,0,0-8,8v64a8,8,0,0,0,8,8h64a8,8,0,0,0,8-8V96A8,8,0,0,0,160,88Zm-8,64H104V104h48Z" />
        </svg>
      </template>
      Stop &amp; report
    </UiPill>
  </div>
</template>

<style scoped>
.pipeline-outcome-route {
  position: relative;
  width: 100%;
  height: 5rem;
  color: var(--ll-color-divider);
  cursor: default;
}

.pipeline-outcome-route__map {
  position: absolute;
  z-index: 1;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
  cursor: default;
  pointer-events: none;
}

.pipeline-outcome-route--retry .pipeline-outcome-route__map {
  inset: auto 0 0;
  height: var(--pipeline-retry-map-height);
}

.pipeline-outcome-route--previous .pipeline-outcome-route__map {
  inset: auto 0 0;
  height: var(--pipeline-previous-map-height);
}

.pipeline-outcome-route__line,
.pipeline-outcome-route__tip {
  vector-effect: non-scaling-stroke;
  stroke: var(--ll-color-divider);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: stroke var(--ll-duration-normal) var(--ll-ease-out);
}

.pipeline-outcome-route__line--failure,
.pipeline-outcome-route__tip--failure {
  pointer-events: stroke;
  cursor: default;
}

.pipeline-outcome-route__hit {
  vector-effect: non-scaling-stroke;
  stroke: transparent;
  stroke-width: 28;
  pointer-events: stroke;
  cursor: default;
}

.pipeline-outcome-route.is-success-highlighted :is(.pipeline-outcome-route__line--success, .pipeline-outcome-route__tip--success) {
  stroke: var(--ll-color-primary-highlight);
}

.pipeline-outcome-route.is-failure-highlighted :is(.pipeline-outcome-route__line--failure, .pipeline-outcome-route__tip--failure) {
  stroke: var(--ll-color-brand);
}

.pipeline-outcome-route__signal {
  position: absolute;
  z-index: 3;
  display: grid;
  width: 1.1rem;
  height: 1.1rem;
  place-items: center;
  pointer-events: none;
}

.pipeline-outcome-route__signal svg {
  width: 100%;
  height: 100%;
}

.pipeline-outcome-route__signal--success {
  top: 1.85rem;
  left: calc(50% - 2rem);
  color: var(--ll-color-primary-highlight);
}

.pipeline-outcome-route__signal--failure {
  top: 0.25rem;
  left: 64.5%;
  color: var(--ll-color-brand);
}

.pipeline-outcome-route--retry .pipeline-outcome-route__signal--failure {
  top: -4.5rem;
  left: 73.5%;
}

.pipeline-outcome-route--previous .pipeline-outcome-route__signal--failure {
  top: var(--pipeline-previous-signal-top);
  left: 22%;
}

.pipeline-outcome-route__stop {
  position: absolute;
  z-index: 2;
  top: 0.5rem;
  right: clamp(0.25rem, 7vw, 7rem);
  transition: color var(--ll-duration-normal) var(--ll-ease-out);
}

.pipeline-outcome-route.is-failure-highlighted .pipeline-outcome-route__stop :deep(.ui-icon-pill__trigger) {
  color: var(--ll-color-brand);
  background: var(--ll-color-card);
  border-color: var(--ll-color-brand);
}

.pipeline-outcome-route.is-failure-highlighted .pipeline-outcome-route__stop :deep(.ui-icon-pill__icon) {
  color: var(--ll-color-brand);
}

@media (prefers-reduced-motion: no-preference) {
  .pipeline-outcome-route__line {
    animation: pipeline-outcome-draw 420ms var(--ll-ease-out) both;
  }

  .pipeline-outcome-route__tip {
    animation: pipeline-outcome-tip 260ms 220ms var(--ll-ease-out) both;
  }
}

@keyframes pipeline-outcome-draw {
  from { opacity: 0; stroke-dasharray: 0 700; }
  to { opacity: 1; stroke-dasharray: 700 0; }
}

@keyframes pipeline-outcome-tip {
  from { opacity: 0; }
  to { opacity: 1; }
}

@media (max-width: 48rem) {
  .pipeline-outcome-route__stop { right: 0; }
  .pipeline-outcome-route__signal--failure { left: 61%; }
  .pipeline-outcome-route--retry .pipeline-outcome-route__signal--failure { left: 76%; }
  .pipeline-outcome-route--previous .pipeline-outcome-route__signal--failure { left: 18%; }
}

@media (prefers-reduced-motion: reduce) {
  .pipeline-outcome-route__line,
  .pipeline-outcome-route__tip,
  .pipeline-outcome-route__stop { transition: none; }
}
</style>
