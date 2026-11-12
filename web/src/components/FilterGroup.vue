<script setup lang="ts">
defineProps<{
  legend: string
}>()
</script>

<template>
  <fieldset class="group">
    <legend>{{ legend }}</legend>
    <slot />
  </fieldset>
</template>

<style scoped>
.group {
  display: grid;
  gap: 10px;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}

legend {
  padding: 0;
  margin-bottom: 8px;
  font: 700 13px var(--f-display);
}
</style>
