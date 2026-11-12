import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'

import ListSkeleton from '../ListSkeleton.vue'
import { withPrimeVue } from './primeVue'

describe('ListSkeleton', () => {
  it('shows 6 placeholder rows by default', () => {
    const wrapper = mount(ListSkeleton, { global: withPrimeVue })

    expect(wrapper.findAll('.row')).toHaveLength(6)
  })

  it('shows the number of rows it is given', () => {
    const wrapper = mount(ListSkeleton, { props: { rows: 3 }, global: withPrimeVue })

    expect(wrapper.findAll('.row')).toHaveLength(3)
  })

  it('is marked busy and labelled, and hides the placeholders from screen readers', () => {
    const wrapper = mount(ListSkeleton, { global: withPrimeVue })

    expect(wrapper.attributes('aria-busy')).toBe('true')
    expect(wrapper.attributes('aria-label')).toBe('Loading results')
    expect(wrapper.findAll('.row').every((row) => row.attributes('aria-hidden') === 'true')).toBe(
      true,
    )
  })
})
