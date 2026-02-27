import type { Components, JSX } from "../dist/types/components";

interface CmpClientShadow extends Components.CmpClientShadow, HTMLElement {}
export const CmpClientShadow: {
    prototype: CmpClientShadow;
    new (): CmpClientShadow;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
