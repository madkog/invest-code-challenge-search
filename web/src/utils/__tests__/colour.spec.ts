import { describe, it, expect } from 'vitest'

import { readableTextColour } from '../colour'

describe('readableTextColour', () => {
  it('uses white on a dark background', () => {
    expect(readableTextColour('#1A1A1A')).toBe('#FFFFFF')
    expect(readableTextColour('#003B73')).toBe('#FFFFFF')
  })

  it('uses dark text on a light background', () => {
    expect(readableTextColour('#FFCC00')).toBe('#0F172A')
    expect(readableTextColour('#FFFFFF')).toBe('#0F172A')
  })

  it('uses dark text on the bright brand orange, where white only reaches 3.4:1', () => {
    expect(readableTextColour('#FC4D16')).toBe('#0F172A')
  })

  it('accepts short hex colours and a missing #', () => {
    expect(readableTextColour('#000')).toBe('#FFFFFF')
    expect(readableTextColour('fff')).toBe('#0F172A')
  })

  it('falls back to the dark colour for an invalid background', () => {
    expect(readableTextColour('not a colour')).toBe('#0F172A')
  })

  it('uses the colours it is given', () => {
    expect(readableTextColour('#000000', '#EEEEEE', '#111111')).toBe('#EEEEEE')
  })
})
