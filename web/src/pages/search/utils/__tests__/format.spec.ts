import { describe, it, expect } from 'vitest'

import { formatUnits, issuerName, kindLabel, kindPluralLabel } from '../format'

describe('issuerName', () => {
  it('uses the display name of a known issuer, by the id the API uses', () => {
    expect(issuerName('blackrock')).toBe('iShares (BlackRock)')
    expect(issuerName('state_street')).toBe('SPDR (State Street)')
    expect(issuerName('globalx')).toBe('Global X')
  })

  it('makes the id of any other issuer readable', () => {
    expect(issuerName('alphinity')).toBe('Alphinity')
    expect(issuerName('alliance_bernstein')).toBe('Alliance Bernstein')
    expect(issuerName('barrow-hanley')).toBe('Barrow Hanley')
  })
})

describe('kind labels', () => {
  it('names a kind in the singular and the plural', () => {
    expect(kindLabel('etf')).toBe('ETF')
    expect(kindLabel('share')).toBe('Share')
    expect(kindPluralLabel('etf')).toBe('ETFs')
    expect(kindPluralLabel('share')).toBe('Shares')
  })
})

describe('formatUnits', () => {
  it('uses billions with up to 2 decimals and no trailing zeros', () => {
    expect(formatUnits(1_673_000_000)).toBe('1.67bn')
    expect(formatUnits(1_500_000_000)).toBe('1.5bn')
    expect(formatUnits(2_000_000_000)).toBe('2bn')
  })

  it('uses whole millions below a billion', () => {
    expect(formatUnits(381_000_000)).toBe('381m')
    expect(formatUnits(197_400_000)).toBe('197m')
  })

  it('shows the plain number below a million', () => {
    expect(formatUnits(250_000)).toBe('250,000')
  })
})
