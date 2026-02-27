import type { Components, JSX } from "../dist/types/components";

interface PartSsrShadowCmp extends Components.PartSsrShadowCmp, HTMLElement {}
export const PartSsrShadowCmp: {
    prototype: PartSsrShadowCmp;
    new (): PartSsrShadowCmp;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
