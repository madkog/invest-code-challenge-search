<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

<template>
  <div class="empty" role="status">
    <i class="pi pi-search icon" aria-hidden="true"></i>
    <h3>{{ title }}</h3>
    <p v-if="$slots.default"><slot /></p>
    <div v-if="$slots.actions" class="actions"><slot name="actions" /></div>
  </div>
</template>

<style scoped>
.empty {
  display: grid;
  gap: 10px;
  justify-items: center;
  padding: 32px 24px;
  text-align: center;
  background: var(--p-content-background);
  border: 1px dashed var(--p-content-border-color);
  border-radius: 14px;
}

.icon {
  font-size: 2rem;
  color: var(--p-text-muted-color);
}

h3 {
  font-size: 20px;
}

p {
  max-width: 52ch;
  margin: 0;
  color: var(--p-text-muted-color);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}
</style>
