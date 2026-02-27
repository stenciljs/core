import type { Components, JSX } from "../dist/types/components";

interface ShadowDomMode extends Components.ShadowDomMode, HTMLElement {}
export const ShadowDomMode: {
    prototype: ShadowDomMode;
    new (): ShadowDomMode;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
