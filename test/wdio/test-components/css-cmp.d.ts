import type { Components, JSX } from "../dist/types/components";

interface CssCmp extends Components.CssCmp, HTMLElement {}
export const CssCmp: {
    prototype: CssCmp;
    new (): CssCmp;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
