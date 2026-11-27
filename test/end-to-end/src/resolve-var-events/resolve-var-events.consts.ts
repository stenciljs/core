/**
 * Event names that live in a separate module from the component that uses them.
 *
 * `resolveVar()` in `resolve-var-events.tsx` reads from this catalog, which exercises the
 * import-following path of the type checker rather than a same-file declaration.
 */
export const IMPORTED_EVENTS = {
  IMPORTED_EVENT: 'importedEvent',
} as const;
