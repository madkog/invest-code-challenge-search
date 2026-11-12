import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'

import { useDelayedFlag } from '../useDelayedFlag'

describe('useDelayedFlag', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  function setup(initial = false) {
    const source = ref(initial)
    const scope = effectScope()
    const delayed = scope.run(() => useDelayedFlag(() => source.value, 120))!
    return { source, delayed, scope }
  }

  it('is off at first', () => {
    expect(setup().delayed.value).toBe(false)
  })

  it('turns on only after the source has been on for the delay', async () => {
    const { source, delayed } = setup()

    source.value = true
    await nextTick()
    vi.advanceTimersByTime(119)
    expect(delayed.value).toBe(false)

    vi.advanceTimersByTime(1)
    expect(delayed.value).toBe(true)
  })

  it('never turns on if the source turns off first', async () => {
    const { source, delayed } = setup()

    source.value = true
    await nextTick()
    vi.advanceTimersByTime(60)
    source.value = false
    await nextTick()
    vi.advanceTimersByTime(500)

    expect(delayed.value).toBe(false)
  })

  it('turns off straight away', async () => {
    const { source, delayed } = setup()
    source.value = true
    await nextTick()
    vi.advanceTimersByTime(120)
    expect(delayed.value).toBe(true)

    source.value = false
    await nextTick()

    expect(delayed.value).toBe(false)
  })

  it('starts counting at once when the source is already on', () => {
    const { delayed } = setup(true)

    vi.advanceTimersByTime(120)

    expect(delayed.value).toBe(true)
  })

  it('stops waiting when its scope ends', async () => {
    const { source, delayed, scope } = setup()
    source.value = true
    await nextTick()

    scope.stop()
    vi.advanceTimersByTime(500)

    expect(delayed.value).toBe(false)
  })
})
