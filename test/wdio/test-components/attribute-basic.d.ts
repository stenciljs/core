import type { Components, JSX } from "../dist/types/components";

interface AttributeBasic extends Components.AttributeBasic, HTMLElement {}
export const AttributeBasic: {
    prototype: AttributeBasic;
    new (): AttributeBasic;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
