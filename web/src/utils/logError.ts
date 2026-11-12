const PREFIX = '[fund-search]'

/**
 * Records an error for developers. Customers see a friendly message instead.
 * The message names what failed and never changes, so the same failure is easy to find and group.
 * Details such as the id or the filters go in `context`.
 * This is the one place to send errors to an error tracker later.
 */
export function logError(
  message: string,
  error: unknown,
  context: Record<string, unknown> = {},
): void {
  console.error(`${PREFIX} ${message}`, { ...context, error })
}
