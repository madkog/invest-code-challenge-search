import type { GlobalMountOptions } from '@vue/test-utils'
import PrimeVue from 'primevue/config'

import preset from '../../theme/preset'

// jsdom has no matchMedia, which some PrimeVue components call when they mount.
if (typeof (globalThis as { matchMedia?: unknown }).matchMedia !== 'function') {
  Object.defineProperty(globalThis, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }),
  })
}

// Mount options that install PrimeVue with the app theme, for components that use it.
export const withPrimeVue: GlobalMountOptions = {
  plugins: [[PrimeVue, { theme: { preset } }]],
}
