import type { Components, JSX } from "../dist/types/components";

interface ShadowDomArrayRoot extends Components.ShadowDomArrayRoot, HTMLElement {}
export const ShadowDomArrayRoot: {
    prototype: ShadowDomArrayRoot;
    new (): ShadowDomArrayRoot;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
