import type { Components, JSX } from "../dist/types/components";

interface ScopedSsrParentCmp extends Components.ScopedSsrParentCmp, HTMLElement {}
export const ScopedSsrParentCmp: {
    prototype: ScopedSsrParentCmp;
    new (): ScopedSsrParentCmp;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
