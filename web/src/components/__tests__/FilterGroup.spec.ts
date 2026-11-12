import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'

import FilterGroup from '../FilterGroup.vue'

describe('FilterGroup', () => {
  it('groups its content in a fieldset with a legend', () => {
    const wrapper = mount(FilterGroup, {
      props: { legend: 'Fund features' },
      slots: { default: '<input type="checkbox" />' },
    })

    expect(wrapper.element.tagName).toBe('FIELDSET')
    expect(wrapper.get('legend').text()).toBe('Fund features')
    expect(wrapper.find('input').exists()).toBe(true)
  })
})
