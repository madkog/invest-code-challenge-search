import type { StorybookConfig } from '@storybook/vue3-vite'

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.ts'],
  // Checks each story for accessibility problems, shown in the Accessibility panel.
  addons: ['@storybook/addon-a11y'],
  framework: { name: '@storybook/vue3-vite', options: {} },
  // The Vue DevTools plugin is for the app only, and gets in the way inside Storybook.
  viteFinal(viteConfig) {
    viteConfig.plugins = (viteConfig.plugins ?? [])
      .flat()
      .filter((plugin) => !(plugin && 'name' in plugin && plugin.name.includes('vue-devtools')))
    return viteConfig
  },
}

export default config
