import type { Components, JSX } from "../dist/types/components";

interface ScopedSsrChildCmp extends Components.ScopedSsrChildCmp, HTMLElement {}
export const ScopedSsrChildCmp: {
    prototype: ScopedSsrChildCmp;
    new (): ScopedSsrChildCmp;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
