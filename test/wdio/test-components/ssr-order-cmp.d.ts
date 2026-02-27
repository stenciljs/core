import type { Components, JSX } from "../dist/types/components";

interface SsrOrderCmp extends Components.SsrOrderCmp, HTMLElement {}
export const SsrOrderCmp: {
    prototype: SsrOrderCmp;
    new (): SsrOrderCmp;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
