import { describe, it, expect } from 'vitest'

import { contrastRatio } from '../colour'

describe('contrastRatio', () => {
  it('is 21 for black on white and 1 for a colour on itself', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5)
    expect(contrastRatio('#78716c', '#78716c')).toBeCloseTo(1, 5)
  })

  it('does not depend on which colour is the text', () => {
    expect(contrastRatio('#bf3002', '#ffffff')).toBe(contrastRatio('#ffffff', '#bf3002'))
  })

  it('matches a known value', () => {
    // The brand button colour on white is 5.77:1, as the design notes say.
    expect(contrastRatio('#bf3002', '#ffffff')).toBeCloseTo(5.77, 1)
  })

  it('is null for a colour that is not hex', () => {
    expect(contrastRatio('red', '#ffffff')).toBeNull()
  })
})
