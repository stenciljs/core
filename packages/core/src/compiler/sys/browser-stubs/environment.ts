/**
 * Browser build-time stand-in for `../environment.ts` (swapped in via `alias`
 * in `tsdown.config.ts`'s `compiler/browser` entry only). The real file reads
 * `process.platform` unconditionally at module scope to detect Windows -
 * there's no Node `process` global in a browser, and case sensitivity there
 * is a property of the OS filesystem underneath, not something to detect;
 * the in-memory fs (`createSystem()`) is case-sensitive.
 */
export const IS_CASE_SENSITIVE_FILE_NAMES = true;
