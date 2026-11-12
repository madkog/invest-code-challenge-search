import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Paginator from 'primevue/paginator'

import PaginationBar from '../PaginationBar.vue'
import { withPrimeVue } from '@/__tests__/primeVue'

function mountBar(props: { page: number; pageSize: number; total: number }) {
  return mount(PaginationBar, { props, global: withPrimeVue })
}

describe('PaginationBar', () => {
  it('is hidden when everything fits on one page', () => {
    const wrapper = mountBar({ page: 1, pageSize: 15, total: 15 })

    expect(wrapper.findComponent(Paginator).exists()).toBe(false)
  })

  it('is shown when there is more than one page', () => {
    const wrapper = mountBar({ page: 1, pageSize: 15, total: 40 })

    expect(wrapper.findComponent(Paginator).exists()).toBe(true)
  })

  it('stays shown after choosing a large page size, so it can be changed back', () => {
    const wrapper = mountBar({ page: 1, pageSize: 50, total: 40 })

    expect(wrapper.findComponent(Paginator).exists()).toBe(true)
  })

  it('gives the paginator the position of the 1-based page', () => {
    const wrapper = mountBar({ page: 3, pageSize: 15, total: 40 })

    const paginator = wrapper.getComponent(Paginator)
    expect(paginator.props('first')).toBe(30)
    expect(paginator.props('rows')).toBe(15)
    expect(paginator.props('totalRecords')).toBe(40)
  })

  it('reports a page change as a 1-based page', () => {
    const wrapper = mountBar({ page: 1, pageSize: 15, total: 40 })

    wrapper.getComponent(Paginator).vm.$emit('page', { first: 15, rows: 15, page: 1, pageCount: 3 })

    expect(wrapper.emitted('change')).toEqual([[{ page: 2, pageSize: 15 }]])
  })

  it('reports a page size change', () => {
    const wrapper = mountBar({ page: 2, pageSize: 15, total: 100 })

    wrapper.getComponent(Paginator).vm.$emit('page', { first: 0, rows: 30, page: 0, pageCount: 4 })

    expect(wrapper.emitted('change')).toEqual([[{ page: 1, pageSize: 30 }]])
  })
})
