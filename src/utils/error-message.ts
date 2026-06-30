/**
 * Safely extract a human-readable message from an unknown thrown value.
 *
 * `catch` clauses receive `unknown` (the honest type — anything can be thrown), so reach for this
 * instead of typing the binding as `any`. Returns `undefined` when no message can be derived, so
 * callers can fall back to their own default text: `getErrorMessage(error) || 'Default message'`.
 */
export function getErrorMessage(error: unknown): string | undefined {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    return typeof message === 'string' ? message : undefined;
  }
  if (typeof error === 'string') {
    return error;
  }
  return undefined;
}
