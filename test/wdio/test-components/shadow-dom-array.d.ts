import type { Components, JSX } from "../dist/types/components";

interface ShadowDomArray extends Components.ShadowDomArray, HTMLElement {}
export const ShadowDomArray: {
    prototype: ShadowDomArray;
    new (): ShadowDomArray;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
