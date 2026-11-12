import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'

import HighlightedText from '../HighlightedText.vue'

describe('HighlightedText', () => {
  it('marks the matching words by default', () => {
    const wrapper = mount(HighlightedText, {
      props: { text: 'Vanguard Australian Shares', terms: ['aus'] },
    })

    expect(wrapper.text()).toBe('Vanguard Australian Shares')
    expect(wrapper.findAll('mark').map((mark) => mark.text())).toEqual(['Aus'])
  })

  it('makes the matches bold for the bold variant', () => {
    const wrapper = mount(HighlightedText, {
      props: { text: 'Gold Miners', terms: ['gold'], variant: 'bold' },
    })

    expect(wrapper.find('mark').exists()).toBe(false)
    expect(wrapper.findAll('b.hit').map((bold) => bold.text())).toEqual(['Gold'])
  })

  it('shows plain text when there are no terms', () => {
    const wrapper = mount(HighlightedText, { props: { text: 'Gold Miners', terms: [] } })

    expect(wrapper.text()).toBe('Gold Miners')
    expect(wrapper.find('mark').exists()).toBe(false)
  })

  it('shows markup in the text as text, not as HTML', () => {
    const wrapper = mount(HighlightedText, {
      props: { text: '<img src=x onerror=alert(1)> gold', terms: ['gold'] },
    })

    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.text()).toContain('<img src=x onerror=alert(1)>')
  })
})
