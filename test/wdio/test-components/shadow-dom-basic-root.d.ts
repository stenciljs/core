import type { Components, JSX } from "../dist/types/components";

interface ShadowDomBasicRoot extends Components.ShadowDomBasicRoot, HTMLElement {}
export const ShadowDomBasicRoot: {
    prototype: ShadowDomBasicRoot;
    new (): ShadowDomBasicRoot;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
