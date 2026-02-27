import type { Components, JSX } from "../dist/types/components";

interface SsrShadowCmp extends Components.SsrShadowCmp, HTMLElement {}
export const SsrShadowCmp: {
    prototype: SsrShadowCmp;
    new (): SsrShadowCmp;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
