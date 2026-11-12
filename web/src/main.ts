import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import 'primeicons/primeicons.css'
import './theme/global.css'

import App from './App.vue'
import preset from './theme/preset'
import { logError } from './utils/logError'

const app = createApp(App)

// Errors thrown inside components are logged the same way as API errors.
app.config.errorHandler = (error, _instance, info) => logError('Vue error', error, { info })

app.use(createPinia())
app.use(PrimeVue, { theme: { preset, options: { darkModeSelector: '.app-dark' } } })

// Dark mode follows the OS setting. The PrimeVue theme switches on the `app-dark` class.
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)')
function syncColourScheme() {
  document.documentElement.classList.toggle('app-dark', darkQuery.matches)
}
syncColourScheme()
darkQuery.addEventListener('change', syncColourScheme)

app.mount('#app')
