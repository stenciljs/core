import type { Components, JSX } from "../dist/types/components";

interface ShadowDomBasic extends Components.ShadowDomBasic, HTMLElement {}
export const ShadowDomBasic: {
    prototype: ShadowDomBasic;
    new (): ShadowDomBasic;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
