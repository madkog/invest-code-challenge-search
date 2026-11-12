import { describe, it, expect } from 'vitest'

import { searchTerms, splitMatches } from '../text'

describe('splitMatches', () => {
  it('marks the matching parts', () => {
    expect(splitMatches('Vanguard Australian Shares', ['aus'])).toEqual([
      { text: 'Vanguard ', match: false },
      { text: 'Aus', match: true },
      { text: 'tralian Shares', match: false },
    ])
  })

  it('ignores case and keeps the original text', () => {
    expect(splitMatches('BANK', ['bank'])).toEqual([{ text: 'BANK', match: true }])
  })

  it('marks every term wherever it appears', () => {
    expect(splitMatches('Bank of Gold', ['gold', 'bank'])).toEqual([
      { text: 'Bank', match: true },
      { text: ' of ', match: false },
      { text: 'Gold', match: true },
    ])
  })

  it('prefers the longer term when terms overlap', () => {
    expect(splitMatches('Australia', ['aus', 'australia'])).toEqual([
      { text: 'Australia', match: true },
    ])
  })

  it('treats special characters as plain text', () => {
    expect(splitMatches('S&P/ASX (200)', ['(200)'])).toEqual([
      { text: 'S&P/ASX ', match: false },
      { text: '(200)', match: true },
    ])
  })

  it('returns the whole text when there are no usable terms', () => {
    expect(splitMatches('Gold', [])).toEqual([{ text: 'Gold', match: false }])
    expect(splitMatches('Gold', ['', '  '])).toEqual([{ text: 'Gold', match: false }])
  })

  it('returns nothing for empty text', () => {
    expect(splitMatches('', ['gold'])).toEqual([])
  })
})

describe('searchTerms', () => {
  it('splits a search into words', () => {
    expect(searchTerms('australian  shares')).toEqual(['australian', 'shares'])
  })

  it('leaves out the OR between words', () => {
    expect(searchTerms('bank OR mining')).toEqual(['bank', 'mining'])
  })

  it('returns nothing for a blank search', () => {
    expect(searchTerms('   ')).toEqual([])
  })
})
