import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { fn } from 'storybook/test'

import ThemeToggle from './ThemeToggle.vue'

const meta = {
  title: 'Generic/ThemeToggle',
  component: ThemeToggle,
  args: { dark: false, onToggle: fn() },
} satisfies Meta<typeof ThemeToggle>

export default meta
type Story = StoryObj<typeof meta>

// In the light theme it offers dark, with a moon.
export const Light: Story = {}

// In the dark theme it offers light, with a sun.
export const Dark: Story = { args: { dark: true }, globals: { theme: 'dark' } }
