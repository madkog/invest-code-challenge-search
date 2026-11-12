import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'

import EmptyState from '../EmptyState.vue'

describe('EmptyState', () => {
  it('shows the title as a status message', () => {
    const wrapper = mount(EmptyState, { props: { title: 'No matches for “zzz”' } })

    expect(wrapper.attributes('role')).toBe('status')
    expect(wrapper.get('h3').text()).toBe('No matches for “zzz”')
  })

  it('shows the description and the actions when given', () => {
    const wrapper = mount(EmptyState, {
      props: { title: 'No matches' },
      slots: { default: 'Try fewer words.', actions: '<button>Clear filters</button>' },
    })

    expect(wrapper.get('p').text()).toBe('Try fewer words.')
    expect(wrapper.get('button').text()).toBe('Clear filters')
  })

  it('leaves out the description and actions when not given', () => {
    const wrapper = mount(EmptyState, { props: { title: 'No matches' } })

    expect(wrapper.find('p').exists()).toBe(false)
    expect(wrapper.find('.actions').exists()).toBe(false)
  })
})
