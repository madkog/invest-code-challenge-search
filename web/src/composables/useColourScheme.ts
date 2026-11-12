import { ref, watch } from 'vue'

export type ColourScheme = 'light' | 'dark'

const STORAGE_KEY = 'fund-search-colour-scheme'
// The PrimeVue theme and the global styles switch to dark on this class.
const DARK_CLASS = 'app-dark'

// Light unless the visitor chose dark before. Storage can be blocked, and then it is just light.
function loadScheme(): ColourScheme {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

function saveScheme(scheme: ColourScheme) {
  try {
    localStorage.setItem(STORAGE_KEY, scheme)
  } catch {
    // Not being able to save is fine. The choice lasts until the page is reloaded.
  }
}

/**
 * The light or dark theme. It starts light, applies itself to the page and remembers the choice.
 */
export function useColourScheme() {
  const scheme = ref<ColourScheme>(loadScheme())

  watch(
    scheme,
    (value) => {
      document.documentElement.classList.toggle(DARK_CLASS, value === 'dark')
      saveScheme(value)
    },
    { immediate: true },
  )

  function toggle() {
    scheme.value = scheme.value === 'dark' ? 'light' : 'dark'
  }

  return { scheme, toggle }
}
