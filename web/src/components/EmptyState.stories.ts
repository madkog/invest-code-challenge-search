import type { Meta, StoryObj } from '@storybook/vue3-vite'
import Button from 'primevue/button'

import EmptyState from './EmptyState.vue'

const meta = {
  title: 'Generic/EmptyState',
  component: EmptyState,
  args: { title: 'No matches for “zzz”' },
} satisfies Meta<typeof EmptyState>

export default meta
type Story = StoryObj<typeof meta>

export const TitleOnly: Story = {}

export const WithHelpAndActions: Story = {
  render: (args) => ({
    components: { EmptyState, Button },
    setup: () => ({ args }),
    template: `
      <EmptyState v-bind="args">
        Every word has to appear in the same place, like the name or the ticker. Try fewer words.
        <template #actions>
          <Button label="Clear filters" size="small" />
          <Button label="gold" size="small" severity="secondary" outlined rounded />
        </template>
      </EmptyState>`,
  }),
}
