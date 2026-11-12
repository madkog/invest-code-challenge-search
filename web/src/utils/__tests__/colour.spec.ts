import { describe, it, expect } from 'vitest'

import { contrastRatio, readableTextColour } from '../colour'

describe('readableTextColour', () => {
  it('uses white on a dark background', () => {
    expect(readableTextColour('#1A1A1A')).toBe('#FFFFFF')
    expect(readableTextColour('#003B73')).toBe('#FFFFFF')
  })

  it('uses dark text on a light background', () => {
    expect(readableTextColour('#FFCC00')).toBe('#1C1917')
    expect(readableTextColour('#FFFFFF')).toBe('#1C1917')
  })

  it('uses dark text on the bright brand orange, where white only reaches 3.4:1', () => {
    expect(readableTextColour('#FC4D16')).toBe('#1C1917')
  })

  it('accepts short hex colours and a missing #', () => {
    expect(readableTextColour('#000')).toBe('#FFFFFF')
    expect(readableTextColour('fff')).toBe('#1C1917')
  })

  it('falls back to the dark colour for an invalid background', () => {
    expect(readableTextColour('not a colour')).toBe('#1C1917')
  })

  it('uses the colours it is given', () => {
    expect(readableTextColour('#000000', '#EEEEEE', '#111111')).toBe('#EEEEEE')
  })
})

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
