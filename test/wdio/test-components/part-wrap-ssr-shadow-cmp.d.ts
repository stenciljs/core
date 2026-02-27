import type { Components, JSX } from "../dist/types/components";

interface PartWrapSsrShadowCmp extends Components.PartWrapSsrShadowCmp, HTMLElement {}
export const PartWrapSsrShadowCmp: {
    prototype: PartWrapSsrShadowCmp;
    new (): PartWrapSsrShadowCmp;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
