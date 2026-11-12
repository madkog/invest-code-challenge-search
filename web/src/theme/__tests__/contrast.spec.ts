import { describe, it, expect } from 'vitest'

import { contrastRatio } from '../../utils/colour'
import { orange } from '../preset'

// Aura's slate scale, which the preset uses for surfaces and text.
const slate = {
  50: '#f8fafc',
  100: '#f1f5f9',
  200: '#e2e8f0',
  300: '#cbd5e1',
  400: '#94a3b8',
  500: '#64748b',
  600: '#475569',
  700: '#334155',
  800: '#1e293b',
  900: '#0f172a',
  950: '#020617',
}
const white = '#ffffff'

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
  { name: 'body text on white', foreground: slate[700], background: white, minimum: TEXT },
  { name: 'muted text on white', foreground: slate[500], background: white, minimum: TEXT },
  {
    name: 'muted text on the page background',
    foreground: slate[500],
    background: slate[50],
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
    background: slate[50],
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
    foreground: slate[600],
    background: slate[100],
    minimum: TEXT,
  },
  {
    name: 'counts on a focused option',
    foreground: slate[600],
    background: slate[200],
    minimum: TEXT,
  },
]

const DARK: Pair[] = [
  { name: 'body text on content', foreground: white, background: slate[900], minimum: TEXT },
  { name: 'muted text on content', foreground: slate[400], background: slate[900], minimum: TEXT },
  {
    name: 'muted text on the page background',
    foreground: slate[400],
    background: slate[950],
    minimum: TEXT,
  },
  {
    name: 'links and primary text on content',
    foreground: orange[400],
    background: slate[900],
    minimum: TEXT,
  },
  {
    name: 'links on the page background',
    foreground: orange[400],
    background: slate[950],
    minimum: TEXT,
  },
  { name: 'button text', foreground: slate[950], background: orange[400], minimum: TEXT },
  {
    name: 'match underline on content',
    foreground: orange[500],
    background: slate[900],
    minimum: GRAPHIC,
  },
  {
    name: 'counts on a dark toggle button',
    foreground: slate[300],
    background: slate[800],
    minimum: TEXT,
  },
  {
    name: 'counts on a focused option',
    foreground: slate[300],
    background: slate[700],
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
