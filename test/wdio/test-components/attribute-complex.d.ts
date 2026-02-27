import type { Components, JSX } from "../dist/types/components";

interface AttributeComplex extends Components.AttributeComplex, HTMLElement {}
export const AttributeComplex: {
    prototype: AttributeComplex;
    new (): AttributeComplex;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
