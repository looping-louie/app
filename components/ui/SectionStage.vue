<script setup lang="ts">
type SectionStageInverse = 'none' | 'top' | 'bottom' | 'both'

const props = withDefaults(defineProps<{
  as?: string
  inverse?: SectionStageInverse
}>(), {
  as: 'div',
  inverse: 'none',
})

const stageShell = ref<HTMLElement | null>(null)
const stageSize = reactive({ width: 0, height: 0, radius: 0 })
let resizeObserver: ResizeObserver | undefined

const hasInverseTop = computed(() => props.inverse === 'top' || props.inverse === 'both')
const hasInverseBottom = computed(() => props.inverse === 'bottom' || props.inverse === 'both')

const stagePath = computed(() => {
  const width = stageSize.width
  const height = stageSize.height
  const radius = Math.min(stageSize.radius, width / 2, height / 2)

  if (!width || !height || !radius) return ''

  const top = hasInverseTop.value
    ? `M 0 ${radius} Q 0 0 ${-radius} 0 H ${width + radius} Q ${width} 0 ${width} ${radius}`
    : `M ${radius} 0 H ${width - radius} A ${radius} ${radius} 0 0 1 ${width} ${radius}`

  const bottom = hasInverseBottom.value
    ? `V ${height - radius} Q ${width} ${height} ${width + radius} ${height} H ${-radius} Q 0 ${height} 0 ${height - radius}`
    : `V ${height - radius} A ${radius} ${radius} 0 0 1 ${width - radius} ${height} H ${radius} A ${radius} ${radius} 0 0 1 0 ${height - radius}`

  const left = hasInverseTop.value
    ? `V ${radius}`
    : `V ${radius} A ${radius} ${radius} 0 0 1 ${radius} 0`

  return `${top} ${bottom} ${left} Z`
})

function measureStage() {
  if (!stageShell.value) return

  const bounds = stageShell.value.getBoundingClientRect()
  const styles = getComputedStyle(stageShell.value)
  stageSize.width = Math.round(bounds.width)
  stageSize.height = Math.round(bounds.height)
  stageSize.radius = Number.parseFloat(styles.borderTopLeftRadius) || 0
}

onMounted(() => {
  measureStage()
  resizeObserver = new ResizeObserver(measureStage)
  if (stageShell.value) resizeObserver.observe(stageShell.value)
})

onBeforeUnmount(() => resizeObserver?.disconnect())
</script>

<template>
  <component
    :is="as"
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

      <div class="ui-section-stage__content"><slot /></div>
    </div>
  </component>
</template>

<style scoped>
.ui-section-stage {
  --ui-section-stage-shell-padding: 1rem;
  --ui-section-stage-shell-radius: calc(
    var(--ll-radius-structural) + var(--ui-section-stage-shell-padding)
  );

  position: relative;
  width: 100%;
  overflow: hidden;
  box-sizing: border-box;
  background: var(--ll-color-canvas);
}

.ui-section-stage__shell {
  position: relative;
  width: calc(100% - 2 * var(--ui-section-stage-shell-padding));
  margin-inline: auto;
  background: var(--ll-color-section);
  border-radius: var(--ui-section-stage-shell-radius);
}

.ui-section-stage__shell-svg {
  position: absolute;
  inset: 0;
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
