import type { Meta, StoryObj } from '@storybook/vue3-vite'

import { LOGO } from '../stories/fixtures'
import AvatarBadge from './AvatarBadge.vue'

const meta = {
  title: 'Generic/AvatarBadge',
  component: AvatarBadge,
  args: { label: 'A200', size: 'large' },
  argTypes: { size: { control: 'inline-radio', options: ['normal', 'large', 'xlarge'] } },
} satisfies Meta<typeof AvatarBadge>

export default meta
type Story = StoryObj<typeof meta>

export const Logo: Story = { args: { imageUrl: LOGO } }

// No logo, so the first two letters show instead.
export const Initials: Story = {}

// A logo that fails to load falls back to the letters.
export const BrokenLogo: Story = { args: { imageUrl: 'missing-logo.png' } }

export const ExtraLarge: Story = { args: { imageUrl: LOGO, size: 'xlarge' } }
