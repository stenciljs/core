import type { Components, JSX } from "../dist/types/components";

interface ShadowSsrParentCmp extends Components.ShadowSsrParentCmp, HTMLElement {}
export const ShadowSsrParentCmp: {
    prototype: ShadowSsrParentCmp;
    new (): ShadowSsrParentCmp;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
