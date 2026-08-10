<script setup lang="ts">
withDefaults(defineProps<{
  as?: string
}>(), {
  as: 'section',
})
</script>

<template>
  <component
    :is="as"
    class="ui-section"
  >
    <div class="ui-section__inner"><slot /></div>
  </component>
</template>

<style scoped>
.ui-section {
  position: relative;
  width: 100%;
  overflow: hidden;
  box-sizing: border-box;
  background: var(--ll-color-canvas);
}

.ui-section__inner {
  width: 100%;
  box-sizing: border-box;
}

</style>
