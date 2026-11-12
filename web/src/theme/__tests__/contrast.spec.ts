import { describe, it, expect } from 'vitest'

import { contrastRatio } from '../../utils/colour'
import { orange } from '../preset'

// Aura's warm stone scale, which the preset uses for surfaces and text.
const stone = {
  50: '#fafaf9',
  100: '#f5f5f4',
  200: '#e7e5e4',
  300: '#d6d3d1',
  400: '#a8a29e',
  500: '#78716c',
  600: '#57534e',
  700: '#44403c',
  800: '#292524',
  900: '#1c1917',
  950: '#0c0a09',
}
const white = '#ffffff'
// The light page background, from --page-background in global.css.
const pageBackground = '#eeeae6'

// WCAG AA: 4.5:1 for normal text, 3:1 for graphics such as the match underline.
const TEXT = 4.5
const GRAPHIC = 3

interface Pair {
  name: string
  foreground: string
  background: string
  minimum: number
}

const LIGHT: Pair[] = [
  { name: 'body text on white', foreground: stone[700], background: white, minimum: TEXT },
  { name: 'muted text on white', foreground: stone[600], background: white, minimum: TEXT },
  {
    name: 'muted text on the page background',
    foreground: stone[600],
    background: pageBackground,
    minimum: TEXT,
  },
  {
    name: 'links and primary text on white',
    foreground: orange[700],
    background: white,
    minimum: TEXT,
  },
  {
    name: 'links on the page background',
    foreground: orange[700],
    background: pageBackground,
    minimum: TEXT,
  },
  { name: 'button text', foreground: white, background: orange[700], minimum: TEXT },
  { name: 'button text on hover', foreground: white, background: orange[800], minimum: TEXT },
  {
    name: 'match underline on white',
    foreground: orange[500],
    background: white,
    minimum: GRAPHIC,
  },
  // Counts and notes sit on tinted backgrounds: toggle buttons, and hovered or focused options.
  {
    name: 'counts on a toggle button',
    foreground: stone[600],
    background: stone[100],
    minimum: TEXT,
  },
  {
    name: 'counts on a focused option',
    foreground: stone[600],
    background: stone[200],
    minimum: TEXT,
  },
]

const DARK: Pair[] = [
  { name: 'body text on content', foreground: white, background: stone[900], minimum: TEXT },
  { name: 'muted text on content', foreground: stone[400], background: stone[900], minimum: TEXT },
  {
    name: 'muted text on the page background',
    foreground: stone[400],
    background: stone[950],
    minimum: TEXT,
  },
  {
    name: 'links and primary text on content',
    foreground: orange[400],
    background: stone[900],
    minimum: TEXT,
  },
  {
    name: 'links on the page background',
    foreground: orange[400],
    background: stone[950],
    minimum: TEXT,
  },
  { name: 'button text', foreground: stone[950], background: orange[400], minimum: TEXT },
  {
    name: 'match underline on content',
    foreground: orange[500],
    background: stone[900],
    minimum: GRAPHIC,
  },
  {
    name: 'counts on a dark toggle button',
    foreground: stone[300],
    background: stone[800],
    minimum: TEXT,
  },
  {
    name: 'counts on a focused option',
    foreground: stone[300],
    background: stone[700],
    minimum: TEXT,
  },
]

describe.each([
  ['light mode', LIGHT],
  ['dark mode', DARK],
])('%s contrast', (_mode, pairs) => {
  it.each(pairs)('$name is at least $minimum:1', ({ foreground, background, minimum }) => {
    expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(minimum)
  })
})

describe('the bright brand orange', () => {
  it('is too light for white text, which is why buttons use the deeper orange', () => {
    expect(contrastRatio(white, orange[500])).toBeLessThan(TEXT)
  })
})
