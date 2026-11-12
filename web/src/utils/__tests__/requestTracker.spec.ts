import { describe, it, expect } from 'vitest'

import { createRequestTracker } from '../requestTracker'

describe('createRequestTracker', () => {
  it('treats a new request as current', () => {
    const requests = createRequestTracker()

    const request = requests.start('search')

    expect(request.isCurrent()).toBe(true)
    expect(request.signal.aborted).toBe(false)
  })

  it('cancels the earlier request with the same name', () => {
    const requests = createRequestTracker()
    const first = requests.start('search')

    const second = requests.start('search')

    expect(first.isCurrent()).toBe(false)
    expect(first.signal.aborted).toBe(true)
    expect(second.isCurrent()).toBe(true)
  })

  it('keeps requests with different names apart', () => {
    const requests = createRequestTracker()
    const search = requests.start('search')

    const facet = requests.start('facet:kind')

    expect(search.isCurrent()).toBe(true)
    expect(facet.isCurrent()).toBe(true)
  })

  it('cancels a running request', () => {
    const requests = createRequestTracker()
    const request = requests.start('suggestions')

    requests.cancel('suggestions')

    expect(request.isCurrent()).toBe(false)
  })

  it('does nothing when cancelling a name that is not running', () => {
    const requests = createRequestTracker()

    expect(() => requests.cancel('nothing')).not.toThrow()
  })
})
