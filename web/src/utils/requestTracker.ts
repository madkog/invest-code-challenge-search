export interface TrackedRequest {
  signal: AbortSignal
  // False once a newer request with the same name has started, or it was cancelled.
  isCurrent: () => boolean
}

// Keeps one running request per name. Starting a new one cancels the old one, so an old response
// can be ignored when it arrives late.
export function createRequestTracker() {
  const running = new Map<string, AbortController>()

  function start(name: string): TrackedRequest {
    running.get(name)?.abort()
    const controller = new AbortController()
    running.set(name, controller)
    return { signal: controller.signal, isCurrent: () => !controller.signal.aborted }
  }

  function cancel(name: string) {
    running.get(name)?.abort()
  }

  return { start, cancel }
}
