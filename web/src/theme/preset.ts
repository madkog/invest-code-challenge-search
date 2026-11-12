// PrimeVue theme preset, from the approved design in docs/search-design/theme-preset.js.
import { definePreset } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'

// Built around the site's brand orange #FC4D16 (500).
// White text on #FC4D16 is only 3.4:1, under WCAG AA's 4.5:1 for normal text,
// so the interactive colour uses 700 (#BF3002, 5.8:1) in light mode and 400 in dark mode.
// Greys are Aura's warm stone scale, to match the Betashares site. Selected and highlighted
// options use these greys, not orange tints.
export const orange = {
  50: '#fff0eb',
  100: '#fee0d7',
  200: '#fec1ae',
  300: '#fd9b7c',
  400: '#fd754a',
  500: '#fc4d16',
  600: '#e83a03',
  700: '#bf3002',
  800: '#972602',
  900: '#6b210a',
  950: '#3d1306',
}
const stone = Object.fromEntries(
  [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((key) => [key, `{stone.${key}}`]),
)

export default definePreset(Aura, {
  semantic: {
    primary: orange,
    colorScheme: {
      light: {
        surface: { 0: '#ffffff', ...stone },
        primary: {
          color: '{primary.700}',
          contrastColor: '#ffffff',
          hoverColor: '{primary.800}',
          activeColor: '{primary.900}',
        },
        highlight: {
          background: '{surface.100}',
          focusBackground: '{surface.200}',
          color: '{surface.900}',
          focusColor: '{surface.950}',
        },
        // Darker than Aura's muted text, so it stays readable (4.5:1) on the warm page background.
        text: {
          mutedColor: '{surface.600}',
        },
      },
      dark: {
        surface: { 0: '#ffffff', ...stone },
        primary: {
          color: '{primary.400}',
          contrastColor: '{surface.950}',
          hoverColor: '{primary.300}',
          activeColor: '{primary.200}',
        },
        highlight: {
          background: '{surface.800}',
          focusBackground: '{surface.700}',
          color: '{surface.0}',
          focusColor: '{surface.0}',
        },
      },
    },
  },
})
