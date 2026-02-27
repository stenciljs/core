import type { Components, JSX } from "../dist/types/components";

interface ShadowSsrChildCmp extends Components.ShadowSsrChildCmp, HTMLElement {}
export const ShadowSsrChildCmp: {
    prototype: ShadowSsrChildCmp;
    new (): ShadowSsrChildCmp;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
