import type { Components, JSX } from "../dist/types/components";

interface WrapSsrShadowCmp extends Components.WrapSsrShadowCmp, HTMLElement {}
export const WrapSsrShadowCmp: {
    prototype: WrapSsrShadowCmp;
    new (): WrapSsrShadowCmp;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
