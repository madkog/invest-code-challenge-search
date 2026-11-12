<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Avatar from 'primevue/avatar'

const props = withDefaults(
  defineProps<{
    // Shown when there is no image, or it fails to load. Only the first 2 characters are used.
    label: string
    imageUrl?: string | null
    size?: 'normal' | 'large' | 'xlarge'
  }>(),
  { imageUrl: null, size: 'large' },
)

// White on the mid grey, which reads at 4.8:1 in both themes.
const LABEL_STYLE = {
  background: 'var(--p-surface-500)',
  color: 'var(--p-surface-0)',
  fontWeight: 700,
  fontSize: '13px',
  fontFamily: 'var(--f-mono)',
}

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
</script>

<template>
  <Avatar
    v-if="showImage"
    :image="imageUrl ?? undefined"
    shape="circle"
    :size="size"
    @error="imageFailed = true"
  />
  <Avatar v-else :label="initials" shape="circle" :size="size" :style="LABEL_STYLE" />
</template>
