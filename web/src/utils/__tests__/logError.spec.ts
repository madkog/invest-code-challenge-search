import { afterEach, describe, it, expect, vi } from 'vitest'

import { logError } from '../logError'

describe('logError', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('logs a prefixed message with the error and its context', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const error = new Error('HTTP 502')

    logError('Loading details failed', error, { id: 'A200:AU' })

    expect(consoleError).toHaveBeenCalledWith('[fund-search] Loading details failed', {
      id: 'A200:AU',
      error,
    })
  })

  it('logs the error alone when there is no context', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const error = new Error('HTTP 502')

    logError('Search failed', error)

    expect(consoleError).toHaveBeenCalledWith('[fund-search] Search failed', { error })
  })
})
