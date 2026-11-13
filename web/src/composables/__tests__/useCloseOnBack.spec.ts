import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { effectScope, nextTick, ref, type EffectScope } from 'vue'

import { useCloseOnBack } from '../useCloseOnBack'

describe('useCloseOnBack', () => {
  let scope: EffectScope
  let pushState: ReturnType<typeof vi.spyOn>
  let back: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    scope = effectScope()
    pushState = vi.spyOn(history, 'pushState')
    back = vi.spyOn(history, 'back').mockImplementation(() => {})
  })

  afterEach(() => {
    scope.stop()
    vi.restoreAllMocks()
  })

  function setUp() {
    const isOpen = ref(false)
    const close = vi.fn<() => void>(() => {
      isOpen.value = false
    })
    scope.run(() => useCloseOnBack(isOpen, close))
    return { isOpen, close }
  }

  function goBack() {
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  it('adds a history entry when it opens', async () => {
    const { isOpen } = setUp()

    isOpen.value = true
    await nextTick()

    expect(pushState).toHaveBeenCalledTimes(1)
  })

  it('closes when the browser goes back, without going back again', async () => {
    const { isOpen, close } = setUp()
    isOpen.value = true
    await nextTick()

    goBack()
    await nextTick()

    expect(close).toHaveBeenCalledTimes(1)
    expect(back).not.toHaveBeenCalled()
  })

  it('removes its history entry when closed another way', async () => {
    const { isOpen } = setUp()
    isOpen.value = true
    await nextTick()

    isOpen.value = false
    await nextTick()

    expect(back).toHaveBeenCalledTimes(1)
  })

  it('ignores going back while closed', () => {
    const { close } = setUp()

    goBack()

    expect(close).not.toHaveBeenCalled()
  })

  it('stops listening when its component is gone', async () => {
    const { isOpen, close } = setUp()
    isOpen.value = true
    await nextTick()

    scope.stop()
    goBack()

    expect(close).not.toHaveBeenCalled()
  })
})
