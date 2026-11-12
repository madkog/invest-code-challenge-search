<script setup lang="ts">
import { useId } from 'vue'
import Checkbox from 'primevue/checkbox'

defineProps<{
  label: string
  modelValue: boolean
  count?: number
}>()

defineEmits<{ 'update:modelValue': [value: boolean] }>()

const inputId = useId()
</script>

<template>
  <div class="row">
    <Checkbox
      :model-value="modelValue"
      :input-id="inputId"
      binary
      @update:model-value="$emit('update:modelValue', $event)"
    />
    <label :for="inputId">{{ label }}</label>
    <span v-if="count !== undefined" class="n">{{ count }}</span>
  </div>
</template>

<style scoped>
.row {
  display: flex;
  gap: 10px;
  align-items: center;
  font-size: 14px;
}

label {
  cursor: pointer;
}

.n {
  margin-left: auto;
  color: var(--p-text-muted-color);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
</style>
