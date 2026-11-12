import { describe, it, expect } from 'vitest'

import type { Suggestion } from '../../../../../types/search'
import { buildSuggestionGroups } from '../suggestionGroups'

const VAS: Suggestion = {
  symbol: 'VAS',
  name: 'Vanguard Australian Shares',
  kind: 'etf',
  issuer: 'vanguard',
}
const CBA: Suggestion = { symbol: 'CBA', name: 'Commonwealth Bank', kind: 'share', issuer: null }
const NO_ISSUER_ETF: Suggestion = { symbol: 'XYZ', name: 'Some ETF', kind: 'etf', issuer: null }

function build(overrides: Partial<Parameters<typeof buildSuggestionGroups>[0]> = {}) {
  return buildSuggestionGroups({
    text: '',
    recent: [],
    popular: ['bank', 'gold', 'nasdaq', 'vanguard', 'ethical'],
    flagshipFunds: [],
    instruments: [],
    kinds: [],
    ...overrides,
  })
}

describe('buildSuggestionGroups with nothing typed', () => {
  it('offers the first 4 popular searches', () => {
    const { groups } = build()

    expect(groups.map((group) => group.title)).toEqual(['Popular searches'])
    expect(groups[0]!.items.map((item) => item.label)).toEqual([
      'bank',
      'gold',
      'nasdaq',
      'vanguard',
    ])
  })

  it('puts recent searches first, up to 3', () => {
    const { groups } = build({ recent: ['one', 'two', 'three', 'four'] })

    expect(groups.map((group) => group.title)).toEqual(['Recent searches', 'Popular searches'])
    expect(groups[0]!.items.map((item) => item.label)).toEqual(['one', 'two', 'three'])
    expect(groups[0]!.items[0]!.icon).toBe('recent')
  })

  it('adds flagship funds with their ticker and kind', () => {
    const { groups } = build({ flagshipFunds: [VAS] })

    expect(groups.map((group) => group.title)).toEqual(['Popular searches', 'Flagship funds'])
    expect(groups[1]!.items[0]).toMatchObject({ badge: 'VAS', label: 'Vanguard Australian Shares' })
  })

  it('treats blank text as nothing typed', () => {
    expect(build({ text: '   ' }).groups.map((group) => group.title)).toEqual(['Popular searches'])
  })

  it('searches for the term when a recent or popular search is picked', () => {
    const { groups, actions } = build({ recent: ['bank'] })

    const recentKey = groups[0]!.items[0]!.key
    const popularKey = groups[1]!.items[1]!.key
    expect(actions.get(recentKey)).toEqual({ type: 'search', text: 'bank' })
    expect(actions.get(popularKey)).toEqual({ type: 'search', text: 'gold' })
  })
})

describe('buildSuggestionGroups with text typed', () => {
  const kinds = [
    { value: 'etf', count: 8 },
    { value: 'share', count: 3 },
  ]

  it('offers searching all results, or only ETFs or shares, with counts', () => {
    const { groups } = build({ text: 'bank', kinds })

    const search = groups.find((group) => group.title === 'Search for')!
    expect(search.items.map((item) => [item.label, item.meta])).toEqual([
      ['bank', 'All results · 11'],
      ['bank in ETFs', '8'],
      ['bank in Shares', '3'],
    ])
  })

  it('searches with the chosen kind when a scope is picked', () => {
    const { groups, actions } = build({ text: 'bank', kinds })

    const items = groups.find((group) => group.title === 'Search for')!.items
    expect(actions.get(items[0]!.key)).toEqual({ type: 'search', text: 'bank' })
    expect(actions.get(items[1]!.key)).toEqual({ type: 'search', text: 'bank', kind: 'etf' })
    expect(actions.get(items[2]!.key)).toEqual({ type: 'search', text: 'bank', kind: 'share' })
  })

  it('leaves out the search group when nothing matches', () => {
    const { groups } = build({ text: 'zzz', kinds: [] })

    expect(groups.find((group) => group.title === 'Search for')).toBeUndefined()
  })

  it('lists the matching ETFs and shares with a note on each', () => {
    const { groups } = build({ text: 'a', instruments: [VAS, CBA, NO_ISSUER_ETF] })

    const items = groups.find((group) => group.title === 'ETFs and shares')!.items
    expect(items.map((item) => [item.badge, item.meta])).toEqual([
      ['VAS', 'Vanguard'],
      ['CBA', 'Share'],
      ['XYZ', 'ETF'],
    ])
  })

  it('opens the item when a matching instrument is picked', () => {
    const { groups, actions } = build({ text: 'a', instruments: [VAS] })

    const key = groups.find((group) => group.title === 'ETFs and shares')!.items[0]!.key
    expect(actions.get(key)).toEqual({ type: 'item', symbol: 'VAS' })
  })

  it('offers popular searches that contain the text, except the text itself', () => {
    const { groups } = build({ text: 'go', popular: ['gold', 'go', 'bank', 'mongo'] })

    const popular = groups.find((group) => group.title === 'Popular searches')!
    expect(popular.items.map((item) => item.label)).toEqual(['gold', 'mongo'])
  })

  it('does not offer popular searches when none contain the text', () => {
    const { groups } = build({ text: 'zzz' })

    expect(groups).toEqual([])
  })
})
