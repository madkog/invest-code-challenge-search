<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Avatar from 'primevue/avatar'

import { readableTextColour } from '../utils/colour'

const props = withDefaults(
  defineProps<{
    // Shown when there is no image, or it fails to load. Only the first 2 characters are used.
    label: string
    imageUrl?: string | null
    // Background for the label. The text colour is chosen to be readable on it.
    colour?: string | null
    size?: 'normal' | 'large' | 'xlarge'
  }>(),
  { imageUrl: null, colour: null, size: 'large' },
)

const FALLBACK_COLOUR = '#64748B'

const imageFailed = ref(false)
// A new image gets a fresh chance to load.
watch(
  () => props.imageUrl,
  () => {
    imageFailed.value = false
  },
)

const showImage = computed(() => Boolean(props.imageUrl) && !imageFailed.value)
const initials = computed(() => props.label.slice(0, 2).toUpperCase())
const labelStyle = computed(() => {
  const background = props.colour || FALLBACK_COLOUR
  return {
    background,
    color: readableTextColour(background),
    fontWeight: 700,
    fontSize: '13px',
    fontFamily: 'var(--f-mono)',
  }
})
</script>

<template>
  <Avatar
    v-if="showImage"
    :image="imageUrl ?? undefined"
    shape="circle"
    :size="size"
    @error="imageFailed = true"
  />
  <Avatar v-else :label="initials" shape="circle" :size="size" :style="labelStyle" />
</template>
