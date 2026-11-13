import type { Meta, StoryObj } from '@storybook/vue3-vite'

import CheckboxFilter from './CheckboxFilter.vue'
import FilterGroup from './FilterGroup.vue'

const meta = {
  title: 'Generic/FilterGroup',
  component: FilterGroup,
  args: { legend: 'Fund features' },
} satisfies Meta<typeof FilterGroup>

export default meta
type Story = StoryObj<typeof meta>

export const WithCheckboxes: Story = {
  render: (args) => ({
    components: { FilterGroup, CheckboxFilter },
    setup: () => ({ args }),
    template: `
      <FilterGroup v-bind="args" style="max-width: 270px">
        <CheckboxFilter label="Betashares funds" :model-value="true" :count="102" />
        <CheckboxFilter label="Flagship funds" :model-value="false" :count="9" />
        <CheckboxFilter label="In Auto Invest" :model-value="false" :count="95" />
      </FilterGroup>`,
  }),
}
