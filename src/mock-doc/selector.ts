import { MockElement } from './node';
import jQuery from './third-party/jquery';

/**
 * Check whether an element of interest matches a given selector.
 *
 * @param selector the selector of interest
 * @param elm an element within which to find matching elements
 * @returns whether the element matches the selector
 */
export function matches(selector: string, elm: MockElement): boolean {
  try {
    const r = jQuery.find(selector, undefined, undefined, [elm]);
    return r.length > 0;
  } catch (e) {
    updateSelectorError(selector, e);
    throw e;
  }
}

/**
 * Select the first element that matches a given selector
 *
 * @param selector the selector of interest
 * @param elm the element within which to find a matching element
 * @returns the first matching element, or null if none is found
 */
export function selectOne(selector: string, elm: MockElement) {
  try {
    const r = jQuery.find(selector, elm, undefined, undefined);
    return r[0] || null;
  } catch (e) {
    updateSelectorError(selector, e);
    throw e;
  }
}

/**
 * Select all elements that match a given selector
 *
 * @param selector the selector of interest
 * @param elm an element within which to find matching elements
 * @returns all matching elements
 */
export function selectAll(selector: string, elm: MockElement): any {
  try {
    return jQuery.find(selector, elm, undefined, undefined);
  } catch (e) {
    updateSelectorError(selector, e);
    throw e;
  }
}

/**
 * A manifest of selectors which are known to be problematic in jQuery. See
 * here to track implementation and support:
 * https://github.com/jquery/jquery/issues/5111
 */
export const PROBLEMATIC_SELECTORS = [':scope', ':where', ':is'] as const;

/**
 * Given a selector and an error object thrown by jQuery, annotate the
 * error's message to add some context as to the probable reason for the error.
 * In particular, if the selector includes a selector which is known to be
 * unsupported in jQuery, then we know that was likely the cause of the
 * error.
 *
 * @param selector our selector of interest
 * @param e an error object that was thrown in the course of using jQuery
 */
function updateSelectorError(selector: string, e: unknown) {
  const selectorsPresent = PROBLEMATIC_SELECTORS.filter((s) => selector.includes(s));

  if (selectorsPresent.length > 0 && (e as Error).message) {
    (e as Error).message =
      `At present jQuery does not support the ${humanReadableList(selectorsPresent)} ${selectorsPresent.length === 1 ? 'selector' : 'selectors'}.
If you need this in your test, consider writing an end-to-end test instead.\n` + (e as Error).message;
  }
}

/**
 * Format a list of strings in a 'human readable' way.
 *
 * - If one string (['string']), return 'string'
 * - If two strings (['a', 'b']), return 'a and b'
 * - If three or more (['a', 'b', 'c']), return 'a, b and c'
 *
 * @param items a list of strings to format
 * @returns a formatted string
 */
function humanReadableList(items: string[]): string {
  if (items.length <= 1) {
    return items.join('');
  }
  return `${items.slice(0, items.length - 1).join(', ')} and ${items[items.length - 1]}`;
}
