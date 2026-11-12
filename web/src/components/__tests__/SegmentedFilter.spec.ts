import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'

import SegmentedFilter from '../SegmentedFilter.vue'
import { withPrimeVue } from './primeVue'

const options = [
  { value: 'all', label: 'All', count: 12 },
  { value: 'etf', label: 'ETFs', count: 8 },
  { value: 'share', label: 'Shares' },
]

function mountFilter(modelValue = 'all') {
  return mount(SegmentedFilter, {
    props: { label: 'Type', modelValue, options },
    global: withPrimeVue,
  })
}

describe('SegmentedFilter', () => {
  it('shows each option with its count, when it has one', () => {
    const buttons = mountFilter().findAll('button')

    expect(buttons.map((button) => button.text())).toEqual(['All12', 'ETFs8', 'Shares'])
    expect(buttons.map((button) => button.find('.n').exists())).toEqual([true, true, false])
  })

  it('names the group with its label', () => {
    const wrapper = mountFilter()

    const labelId = wrapper.get('.lbl').attributes('id')
    expect(wrapper.get('[role="group"]').attributes('aria-labelledby')).toBe(labelId)
    expect(wrapper.get('.lbl').text()).toBe('Type')
  })

  it('marks the chosen option', () => {
    const buttons = mountFilter('etf').findAll('button')

    expect(buttons.map((button) => button.attributes('aria-pressed'))).toEqual([
      'false',
      'true',
      'false',
    ])
  })

  it('reports a new choice', async () => {
    const wrapper = mountFilter()

    await wrapper.findAll('button')[1]!.trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([['etf']])
  })

  it('does not allow clearing the choice', async () => {
    const wrapper = mountFilter()

    await wrapper.findAll('button')[0]!.trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })
})
