import { cancel, isCancel } from '@clack/prompts';

/**
 * Exits cleanly if the user cancelled a prompt (Ctrl+C).
 * Narrows the type from `T | symbol` to `T` for callers.
 */
export function cancelIfAborted<T>(value: T | symbol): asserts value is T {
  if (isCancel(value)) {
    cancel('Cancelled.');
    process.exit(0);
  }
}
