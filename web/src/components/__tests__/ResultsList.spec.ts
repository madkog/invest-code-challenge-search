import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'

import ResultsList from '../ResultsList.vue'

const items = [
  { id: 'a', name: 'First' },
  { id: 'b', name: 'Second' },
]

// mount() cannot infer the item type of a generic component, so the key takes unknown.
const key = (item: unknown) => (item as (typeof items)[number]).id

describe('ResultsList', () => {
  it('renders each item with the item slot', () => {
    const wrapper = mount(ResultsList, {
      props: { items, itemKey: key },
      slots: {
        item: `<template #item="{ item }"><span class="name">{{ item.name }}</span></template>`,
      },
    })

    expect(wrapper.findAll('li')).toHaveLength(2)
    expect(wrapper.findAll('.name').map((name) => name.text())).toEqual(['First', 'Second'])
  })

  it('labels the list', () => {
    const wrapper = mount(ResultsList, {
      props: { items, itemKey: key, label: 'Search results' },
    })

    expect(wrapper.get('ul').attributes('aria-label')).toBe('Search results')
  })

  it('renders an empty list when there are no items', () => {
    const wrapper = mount(ResultsList, {
      props: { items: [] as typeof items, itemKey: key },
    })

    expect(wrapper.findAll('li')).toHaveLength(0)
  })
})
