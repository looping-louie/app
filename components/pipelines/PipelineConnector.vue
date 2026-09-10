<script setup lang="ts">
type PipelineConnectorVariant = 'vertical' | 'branches'

withDefaults(defineProps<{
  variant?: PipelineConnectorVariant
}>(), {
  variant: 'vertical',
})
</script>

<template>
  <svg
    v-if="variant === 'branches'"
    class="pipeline-connector pipeline-connector--branches"
    viewBox="0 0 768 88"
    preserveAspectRatio="none"
    fill="none"
    aria-hidden="true"
  >
    <path class="pipeline-connector__line" d="M384 2C384 24 128 15 128 67" />
    <path class="pipeline-connector__line" d="M384 2C384 25 384 43 384 67" />
    <path class="pipeline-connector__line" d="M384 2C384 24 640 15 640 67" />
    <path class="pipeline-connector__tip" d="M119 59C122 63 125 66 128 70C131 66 134 63 137 59" />
    <path class="pipeline-connector__tip" d="M375 59C378 63 381 66 384 70C387 66 390 63 393 59" />
    <path class="pipeline-connector__tip" d="M631 59C634 63 637 66 640 70C643 66 646 63 649 59" />
  </svg>

  <svg
    v-else
    class="pipeline-connector pipeline-connector--vertical"
    viewBox="0 0 96 64"
    fill="none"
    aria-hidden="true"
  >
    <path class="pipeline-connector__line" d="M48 2V53" />
    <path class="pipeline-connector__tip" d="M39 46C42 50 45 53 48 57C51 53 54 50 57 46" />
  </svg>
</template>

<style scoped>
.pipeline-connector {
  display: block;
  overflow: visible;
  color: var(--ll-color-divider);
  pointer-events: none;
}

.pipeline-connector--vertical {
  width: 4.5rem;
  height: 3rem;
}

.pipeline-connector--branches {
  width: 100%;
  height: 4.75rem;
}

.pipeline-connector__line,
.pipeline-connector__tip {
  vector-effect: non-scaling-stroke;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.pipeline-connector__line {
  stroke-dasharray: 1 0;
}

@media (prefers-reduced-motion: no-preference) {
  .pipeline-connector__line {
    animation: pipeline-connector-draw 420ms var(--ll-ease-out) both;
  }

  .pipeline-connector__tip {
    animation: pipeline-connector-tip 260ms 220ms var(--ll-ease-out) both;
  }
}

@keyframes pipeline-connector-draw {
  from {
    opacity: 0;
    stroke-dasharray: 0 500;
  }

  to {
    opacity: 1;
    stroke-dasharray: 500 0;
  }
}

@keyframes pipeline-connector-tip {
  from {
    opacity: 0;
    transform: translateY(-0.25rem);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
