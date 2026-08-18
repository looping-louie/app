<script setup lang="ts">
type SectionStageInverse = 'none' | 'top' | 'bottom' | 'both'

const props = withDefaults(defineProps<{
  as?: string
  inverse?: SectionStageInverse
}>(), {
  as: 'div',
  inverse: 'none',
})

const stageRoot = ref<HTMLElement | null>(null)
const stageShell = ref<HTMLElement | null>(null)
const stageContent = ref<HTMLElement | null>(null)
const stageSize = reactive({
  width: 0,
  height: 0,
  radius: 0,
  band: 0,
  leftReach: 0,
  rightReach: 0,
})
let resizeObserver: ResizeObserver | undefined

const hasInverseTop = computed(() => props.inverse === 'top' || props.inverse === 'both')
const hasInverseBottom = computed(() => props.inverse === 'bottom' || props.inverse === 'both')

const stagePath = computed(() => {
  const width = stageSize.width
  const height = stageSize.height
  const topBand = hasInverseTop.value ? stageSize.band : 0
  const bottomBand = hasInverseBottom.value ? stageSize.band : 0
  const availableCurveHeight = Math.max(0, height - topBand - bottomBand)
  const radius = Math.max(0, Math.min(stageSize.radius, width / 2, availableCurveHeight / 2))
  const leftReach = Math.max(radius, stageSize.leftReach)
  const rightReach = Math.max(radius, stageSize.rightReach)

  if (!width || !height || !radius) return ''

  const top = hasInverseTop.value
    ? `M ${-leftReach} 0 H ${width + rightReach} V ${topBand} H ${width + radius} Q ${width} ${topBand} ${width} ${topBand + radius}`
    : `M ${radius} 0 H ${width - radius} A ${radius} ${radius} 0 0 1 ${width} ${radius}`

  const bottom = hasInverseBottom.value
    ? `V ${height - bottomBand - radius} Q ${width} ${height - bottomBand} ${width + radius} ${height - bottomBand} H ${width + rightReach} V ${height} H ${-leftReach} V ${height - bottomBand} H ${-radius} Q 0 ${height - bottomBand} 0 ${height - bottomBand - radius}`
    : `V ${height - radius} A ${radius} ${radius} 0 0 1 ${width - radius} ${height} H ${radius} A ${radius} ${radius} 0 0 1 0 ${height - radius}`

  const closingEdge = hasInverseTop.value
    ? `V ${topBand + radius} Q 0 ${topBand} ${-radius} ${topBand} H ${-leftReach} V 0`
    : `V ${radius} A ${radius} ${radius} 0 0 1 ${radius} 0`

  return `${top} ${bottom} ${closingEdge} Z`
})

function measureStage() {
  if (!stageRoot.value || !stageShell.value || !stageContent.value) return

  const shellBounds = stageShell.value.getBoundingClientRect()
  const styles = getComputedStyle(stageShell.value)
  const contentStyles = getComputedStyle(stageContent.value)
  const viewportWidth = document.documentElement.clientWidth
  stageSize.width = shellBounds.width
  stageSize.height = shellBounds.height
  stageSize.radius = Number.parseFloat(styles.borderTopLeftRadius) || 0
  stageSize.band = Number.parseFloat(contentStyles.paddingTop) || 0
  stageSize.leftReach = shellBounds.left
  stageSize.rightReach = viewportWidth - shellBounds.right
}

onMounted(() => {
  measureStage()
  resizeObserver = new ResizeObserver(measureStage)
  if (stageRoot.value) resizeObserver.observe(stageRoot.value)
  if (stageShell.value) resizeObserver.observe(stageShell.value)
})

onBeforeUnmount(() => resizeObserver?.disconnect())
</script>

<template>
  <component
    :is="as"
    ref="stageRoot"
    class="ui-section-stage"
    :class="`ui-section-stage--inverse-${inverse}`"
  >
    <div ref="stageShell" class="ui-section-stage__shell">
      <svg
        v-if="stagePath"
        class="ui-section-stage__shell-svg"
        :viewBox="`0 0 ${stageSize.width} ${stageSize.height}`"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          class="ui-section-stage__shell-path"
          :d="stagePath"
          vector-effect="non-scaling-stroke"
        />
      </svg>

      <div ref="stageContent" class="ui-section-stage__content"><slot /></div>
    </div>
  </component>
</template>

<style scoped>
.ui-section-stage {
  --ui-section-stage-shell-padding: 1rem;
  --ui-section-stage-shell-radius: calc(
    var(--ll-radius-stage) + var(--ui-section-stage-shell-padding)
  );

  position: relative;
  width: 100%;
  overflow: visible;
  box-sizing: border-box;
  background: var(--ll-color-canvas);
}

.ui-section-stage__shell {
  position: relative;
  z-index: 1;
  width: calc(100% - 2 * var(--ui-section-stage-shell-padding));
  margin-inline: auto;
  background: var(--ll-color-section);
  border-radius: var(--ui-section-stage-shell-radius);
}

.ui-section-stage__shell-svg {
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
}

.ui-section-stage__shell-path {
  fill: var(--ll-color-section);
  stroke: transparent;
}

.ui-section-stage__content {
  --ui-surface-radius: var(--ll-radius-stage);

  position: relative;
  z-index: 1;
  padding: var(--ui-section-stage-shell-padding);
}

@media (min-width: 40rem) {
  .ui-section-stage {
    --ui-section-stage-shell-padding: 1.6875rem;
  }
}
</style>
