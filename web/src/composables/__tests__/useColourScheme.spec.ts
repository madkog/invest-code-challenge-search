import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { nextTick } from 'vue'

import { useColourScheme } from '../useColourScheme'

const STORAGE_KEY = 'fund-search-colour-scheme'

function isDark(): boolean {
  return document.documentElement.classList.contains('app-dark')
}

describe('useColourScheme', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('app-dark')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('starts light', () => {
    const { scheme } = useColourScheme()

    expect(scheme.value).toBe('light')
    expect(isDark()).toBe(false)
  })

  it('starts dark when dark was chosen before', () => {
    localStorage.setItem(STORAGE_KEY, 'dark')

    const { scheme } = useColourScheme()

    expect(scheme.value).toBe('dark')
    expect(isDark()).toBe(true)
  })

  it('switches between light and dark, and remembers the choice', async () => {
    const { scheme, toggle } = useColourScheme()

    toggle()
    await nextTick()
    expect(scheme.value).toBe('dark')
    expect(isDark()).toBe(true)
    expect(localStorage.getItem(STORAGE_KEY)).toBe('dark')

    toggle()
    await nextTick()
    expect(isDark()).toBe(false)
    expect(localStorage.getItem(STORAGE_KEY)).toBe('light')
  })

  it('still works when storage is blocked', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })

    const { scheme, toggle } = useColourScheme()
    toggle()
    await nextTick()

    expect(scheme.value).toBe('dark')
    expect(isDark()).toBe(true)
  })
})
