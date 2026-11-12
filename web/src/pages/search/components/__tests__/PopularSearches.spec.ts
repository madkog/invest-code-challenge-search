import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'

import { withPrimeVue } from '@/__tests__/primeVue'
import PopularSearches from '../PopularSearches.vue'

describe('PopularSearches', () => {
  it('shows a button for each term, in a labelled group', () => {
    const wrapper = mount(PopularSearches, {
      props: { terms: ['bank', 'gold'] },
      global: withPrimeVue,
    })

    expect(wrapper.get('[role="group"]').attributes('aria-label')).toBe('Popular searches')
    expect(wrapper.findAll('button').map((button) => button.text())).toEqual(['bank', 'gold'])
  })

  it('shows a label, which can be changed', () => {
    const wrapper = mount(PopularSearches, { props: { terms: [] }, global: withPrimeVue })
    expect(wrapper.get('.label').text()).toBe('Popular')

    return wrapper.setProps({ label: 'Try' }).then(() => {
      expect(wrapper.get('.label').text()).toBe('Try')
    })
  })

  it('reports the term that was picked', async () => {
    const wrapper = mount(PopularSearches, {
      props: { terms: ['bank', 'gold'] },
      global: withPrimeVue,
    })

    await wrapper.findAll('button')[1]!.trigger('click')

    expect(wrapper.emitted('pick')).toEqual([['gold']])
  })
})
