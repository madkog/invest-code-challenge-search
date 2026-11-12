<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Tag from 'primevue/tag'

import { SEARCH_STATUS, useSearchStore } from '../stores/search'

const store = useSearchStore()
const { status, error, count } = storeToRefs(store)

onMounted(() => store.search())
</script>

<template>
  <main>
    <h1>Fund search</h1>

    <!-- Search input with suggestions -->
    <section aria-label="Search"></section>

    <div>
      <!-- Filter panel -->
      <aside aria-label="Filters"></aside>

      <section aria-label="Results">
        <!-- Sort control -->

        <!-- Temporary status line until the result components are added -->
        <Message v-if="status === SEARCH_STATUS.LOADING" severity="info" :closable="false">
          Loading results...
        </Message>
        <div v-else-if="status === SEARCH_STATUS.ERROR">
          <Message severity="error" :closable="false">{{ error }}</Message>
          <Button label="Try again" severity="secondary" @click="store.search()" />
        </div>
        <Tag v-else :value="`${count} results`" />

        <!-- Result list, no-results state and pagination -->
      </section>
    </div>
  </main>
</template>
