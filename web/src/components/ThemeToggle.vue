<script setup lang="ts">
import { computed } from 'vue'
import Button from 'primevue/button'

const props = defineProps<{ dark: boolean }>()

defineEmits<{ toggle: [] }>()

// The button says what pressing it will do.
const label = computed(() => (props.dark ? 'Switch to light theme' : 'Switch to dark theme'))
</script>

<template>
  <Button
    :icon="dark ? 'pi pi-sun' : 'pi pi-moon'"
    :aria-label="label"
    :title="label"
    text
    rounded
    @click="$emit('toggle')"
  />
</template>
