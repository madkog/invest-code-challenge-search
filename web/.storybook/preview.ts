import { setup, type Preview } from '@storybook/vue3-vite'
import PrimeVue from 'primevue/config'
import 'primeicons/primeicons.css'

import '../src/theme/global.css'
import preset from '../src/theme/preset'

// The same PrimeVue setup as the app (src/main.ts).
setup((app) => {
  app.use(PrimeVue, { theme: { preset, options: { darkModeSelector: '.app-dark' } } })
})

const preview: Preview = {
  // A Theme switch in the toolbar, to see every story in light and dark.
  globalTypes: {
    theme: {
      description: 'Light or dark theme',
      toolbar: { title: 'Theme', icon: 'mirror', items: ['light', 'dark'], dynamicTitle: true },
    },
  },
  initialGlobals: { theme: 'light' },
  decorators: [
    (_story, context) => {
      document.documentElement.classList.toggle('app-dark', context.globals.theme === 'dark')
      return { template: '<story />' }
    },
  ],
  parameters: {
    layout: 'padded',
    controls: { expanded: true },
  },
}

export default preview
