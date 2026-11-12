<script setup lang="ts">
import { computed } from 'vue'

import { splitMatches } from '../utils/text'

const props = withDefaults(
  defineProps<{
    text: string
    terms: string[]
    // 'mark' underlines the matches in the brand colour. 'bold' makes them bold.
    variant?: 'mark' | 'bold'
  }>(),
  { variant: 'mark' },
)

const parts = computed(() => splitMatches(props.text, props.terms))
</script>

<template>
  <span>
    <template v-for="(part, index) in parts" :key="index">
      <mark v-if="part.match && variant === 'mark'">{{ part.text }}</mark>
      <b v-else-if="part.match" class="hit">{{ part.text }}</b>
      <template v-else>{{ part.text }}</template>
    </template>
  </span>
</template>

<style scoped>
mark {
  background: none;
  color: inherit;
  font-weight: 700;
  text-decoration: underline 2px var(--p-primary-500);
  text-underline-offset: 3px;
}

.hit {
  font-weight: 700;
}
</style>
