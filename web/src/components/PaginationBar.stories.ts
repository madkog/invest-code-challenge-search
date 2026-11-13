import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { fn } from 'storybook/test'

import PaginationBar from './PaginationBar.vue'

const meta = {
  title: 'Generic/PaginationBar',
  component: PaginationBar,
  args: { page: 1, pageSize: 15, total: 834, onChange: fn() },
} satisfies Meta<typeof PaginationBar>

export default meta
type Story = StoryObj<typeof meta>

export const FirstPage: Story = {}

export const MiddlePage: Story = { args: { page: 20 } }

// Phones get a simpler "Page 2 of 56" layout with large buttons.
export const OnAPhone: Story = {
  args: { page: 2 },
  globals: { viewport: { value: 'mobile1' } },
}

// Hidden when everything fits on one page.
export const OnePage: Story = { args: { total: 9 } }
