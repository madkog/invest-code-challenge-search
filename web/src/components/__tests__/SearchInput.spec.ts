import { afterEach, describe, it, expect, vi } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import AutoComplete from 'primevue/autocomplete'

import SearchInput from '../SearchInput.vue'
import type { SuggestionGroup } from '../../types/ui'
import { withPrimeVue } from './primeVue'

const groups: SuggestionGroup[] = [
  {
    title: 'Popular searches',
    items: [{ key: 'popular:bank', label: 'bank', icon: 'popular' }],
  },
  {
    title: 'ETFs and shares',
    items: [
      { key: 'VAS', label: 'Vanguard Australian Shares', icon: 'item', badge: 'VAS', meta: 'ETF' },
    ],
  },
]

function mountInput(props: Record<string, unknown> = {}) {
  return mount(SearchInput, {
    props: { modelValue: '', ...props },
    global: withPrimeVue,
    attachTo: document.body,
  })
}

enableAutoUnmount(afterEach)

describe('SearchInput', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('has a labelled input and a Search button', () => {
    const wrapper = mountInput({ placeholder: 'Ticker, fund name or issuer' })

    expect(wrapper.get('form').attributes('role')).toBe('search')
    expect(wrapper.get('label[for="search-input"]').text()).toBe('Search')
    expect(wrapper.get('input#search-input').attributes('placeholder')).toBe(
      'Ticker, fund name or issuer',
    )
    expect(wrapper.get('button[type="submit"]').text()).toBe('Search')
  })

  it('uses the labels it is given', () => {
    const wrapper = mountInput({ label: 'Search by ticker', buttonLabel: 'Go' })

    expect(wrapper.get('label').text()).toBe('Search by ticker')
    expect(wrapper.get('button').text()).toBe('Go')
  })

  it('shows the text it is given', () => {
    const wrapper = mountInput({ modelValue: 'vanguard' })

    expect(wrapper.get('input').element.value).toBe('vanguard')
  })

  it('reports typing', async () => {
    const wrapper = mountInput()

    await wrapper.get('input').setValue('gold')

    expect(wrapper.emitted('update:modelValue')).toEqual([['gold']])
  })

  it('submits the text from the button', async () => {
    const wrapper = mountInput({ modelValue: 'bank OR mining' })

    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('submit')).toEqual([['bank OR mining']])
  })

  it('does not search while typing, only suggests', async () => {
    const wrapper = mountInput()

    await wrapper.get('input').setValue('gold')

    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('asks for suggestions with the typed text', () => {
    const wrapper = mountInput()

    wrapper.getComponent(AutoComplete).vm.$emit('complete', { originalEvent: {}, query: ' vas ' })

    expect(wrapper.emitted('complete')).toEqual([['vas']])
  })

  it('asks for suggestions with empty text when the box gets focus', () => {
    const wrapper = mountInput()

    wrapper.getComponent(AutoComplete).vm.$emit('complete', { originalEvent: {}, query: '' })

    expect(wrapper.emitted('complete')).toEqual([['']])
  })

  it('reports a picked suggestion without submitting', () => {
    const wrapper = mountInput({ groups })
    const option = groups[1]!.items[0]

    wrapper
      .getComponent(AutoComplete)
      .vm.$emit('option-select', { originalEvent: {}, value: option })

    expect(wrapper.emitted('select')).toEqual([[option]])
    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('ignores the option object the box reports after a pick', () => {
    const wrapper = mountInput({ groups })

    wrapper.getComponent(AutoComplete).vm.$emit('update:modelValue', groups[1]!.items[0])

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('shows the suggestion groups with their titles, badges and notes', async () => {
    vi.useFakeTimers()
    const wrapper = mountInput()

    await wrapper.get('input').trigger('focus')
    // The box asks for suggestions after its delay, and the parent answers with groups.
    vi.advanceTimersByTime(150)
    await wrapper.setProps({ groups })

    const text = document.body.textContent ?? ''
    expect(text).toContain('Popular searches')
    expect(text).toContain('ETFs and shares')
    expect(text).toContain('Vanguard Australian Shares')
    expect(text).toContain('VAS')
    expect(text).toContain('ETF')
  })
})
