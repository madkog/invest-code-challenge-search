<script setup lang="ts">
import Button from 'primevue/button'
import Message from 'primevue/message'

withDefaults(
  defineProps<{
    title: string
    // The detail, for example the message the API returned.
    message?: string
    retryLabel?: string
  }>(),
  { message: '', retryLabel: 'Try again' },
)

defineEmits<{ retry: [] }>()
</script>

<template>
  <Message severity="error" :closable="false">
    <div class="content">
      <span>
        <strong>{{ title }}</strong>
        <template v-if="message"> {{ message }}</template>
      </span>
      <span><Button :label="retryLabel" size="small" @click="$emit('retry')" /></span>
    </div>
  </Message>
</template>

<style scoped>
.content {
  display: grid;
  gap: 8px;
}
</style>
