import { describe, it, expect, beforeEach, vi } from 'vitest'

import { useRecentSearches } from '../useRecentSearches'

const KEY = 'fund-search-recent'

describe('useRecentSearches', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('starts empty', () => {
    expect(useRecentSearches().searches.value).toEqual([])
  })

  it('adds the newest search first and keeps it', () => {
    const recent = useRecentSearches()

    recent.add('bank')
    recent.add('gold')

    expect(recent.searches.value).toEqual(['gold', 'bank'])
    expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual(['gold', 'bank'])
  })

  it('moves a repeated search to the front without repeating it', () => {
    const recent = useRecentSearches()
    recent.add('bank')
    recent.add('gold')

    recent.add('bank')

    expect(recent.searches.value).toEqual(['bank', 'gold'])
  })

  it('keeps only the last 5', () => {
    const recent = useRecentSearches()

    for (const term of ['a', 'b', 'c', 'd', 'e', 'f']) recent.add(term)

    expect(recent.searches.value).toEqual(['f', 'e', 'd', 'c', 'b'])
  })

  it('trims the text and ignores blank searches', () => {
    const recent = useRecentSearches()

    recent.add('  bank  ')
    recent.add('   ')

    expect(recent.searches.value).toEqual(['bank'])
  })

  it('loads what was saved before', () => {
    localStorage.setItem(KEY, JSON.stringify(['bank', 'gold']))

    expect(useRecentSearches().searches.value).toEqual(['bank', 'gold'])
  })

  it('ignores saved data that is not a list of text', () => {
    localStorage.setItem(KEY, '{"not":"a list"}')
    expect(useRecentSearches().searches.value).toEqual([])

    localStorage.setItem(KEY, '["ok", 5, null]')
    expect(useRecentSearches().searches.value).toEqual(['ok'])

    localStorage.setItem(KEY, 'not json')
    expect(useRecentSearches().searches.value).toEqual([])
  })

  it('still works when storage cannot be used', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('full')
    })
    const recent = useRecentSearches()

    recent.add('bank')

    expect(recent.searches.value).toEqual(['bank'])
  })
})
