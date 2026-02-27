import type { Components, JSX } from "../dist/types/components";

interface CmpClientScoped extends Components.CmpClientScoped, HTMLElement {}
export const CmpClientScoped: {
    prototype: CmpClientScoped;
    new (): CmpClientScoped;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
