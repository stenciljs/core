import type { Components, JSX } from "../dist/types/components";

interface AttributeBoolean extends Components.AttributeBoolean, HTMLElement {}
export const AttributeBoolean: {
    prototype: AttributeBoolean;
    new (): AttributeBoolean;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
