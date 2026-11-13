import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { fn } from 'storybook/test'

import { A200, CBA, LOGO, LONG_NAME, VAS } from '../../../stories/fixtures'
import InstrumentRow from './InstrumentRow.vue'

const meta = {
  title: 'Search/InstrumentRow',
  component: InstrumentRow,
  args: { instrument: { ...A200, logoUrl: LOGO }, terms: [], onSelect: fn() },
} satisfies Meta<typeof InstrumentRow>

export default meta
type Story = StoryObj<typeof meta>

// A flagship Betashares ETF in Auto Invest, with its tags.
export const FlagshipEtf: Story = {}

export const OtherIssuer: Story = { args: { instrument: VAS } }

// Shares show their shares on issue instead of the currency and id.
export const Share: Story = { args: { instrument: CBA } }

// The search words are underlined in the ticker, name and issuer.
export const WithMatches: Story = { args: { terms: ['australia'] } }

export const LongName: Story = { args: { instrument: LONG_NAME } }

// On a phone the ticker sits above the name.
export const OnAPhone: Story = {
  args: { instrument: LONG_NAME },
  globals: { viewport: { value: 'mobile1' } },
}
