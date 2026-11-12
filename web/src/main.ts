import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import 'primeicons/primeicons.css'

import App from './App.vue'
import preset from './theme/preset'

const app = createApp(App)

app.use(createPinia())
app.use(PrimeVue, { theme: { preset, options: { darkModeSelector: false } } })

app.mount('#app')
