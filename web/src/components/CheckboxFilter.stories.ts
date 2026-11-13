import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { fn } from 'storybook/test'

import CheckboxFilter from './CheckboxFilter.vue'

const meta = {
  title: 'Generic/CheckboxFilter',
  component: CheckboxFilter,
  args: { label: 'Betashares funds', modelValue: false, count: 102, 'onUpdate:modelValue': fn() },
} satisfies Meta<typeof CheckboxFilter>

export default meta
type Story = StoryObj<typeof meta>

export const Unchecked: Story = {}

export const Checked: Story = { args: { modelValue: true } }

// The count is left out while it loads or when it fails.
export const WithoutCount: Story = { args: { count: undefined } }
