import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { fn } from 'storybook/test'

import MultiSelectFilter from './MultiSelectFilter.vue'

const meta = {
  title: 'Generic/MultiSelectFilter',
  component: MultiSelectFilter,
  args: {
    label: 'Issuer',
    modelValue: [],
    placeholder: 'All issuers',
    selectedLabel: '{0} issuers',
    options: [
      { value: 'betashares', label: 'Betashares', count: 102 },
      { value: 'vanguard', label: 'Vanguard', count: 38 },
      { value: 'blackrock', label: 'iShares (BlackRock)', count: 61 },
      { value: 'vaneck', label: 'VanEck', count: 44 },
    ],
    'onUpdate:modelValue': fn(),
  },
  decorators: [() => ({ template: '<div style="max-width: 270px"><story /></div>' })],
} satisfies Meta<typeof MultiSelectFilter>

export default meta
type Story = StoryObj<typeof meta>

export const NoneChosen: Story = {}

export const OneChosen: Story = { args: { modelValue: ['vanguard'] } }

// More than two chosen shows a count instead of the names.
export const SeveralChosen: Story = {
  args: { modelValue: ['betashares', 'vanguard', 'vaneck'] },
}
