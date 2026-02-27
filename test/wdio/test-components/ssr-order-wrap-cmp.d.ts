import type { Components, JSX } from "../dist/types/components";

interface SsrOrderWrapCmp extends Components.SsrOrderWrapCmp, HTMLElement {}
export const SsrOrderWrapCmp: {
    prototype: SsrOrderWrapCmp;
    new (): SsrOrderWrapCmp;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
