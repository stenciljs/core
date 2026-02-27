import type { Components, JSX } from "../dist/types/components";

interface StencilSibling extends Components.StencilSibling, HTMLElement {}
export const StencilSibling: {
    prototype: StencilSibling;
    new (): StencilSibling;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
