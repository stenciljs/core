import type { Components, JSX } from "../dist/types/components";

interface AttributeDeserializer extends Components.AttributeDeserializer, HTMLElement {}
export const AttributeDeserializer: {
    prototype: AttributeDeserializer;
    new (): AttributeDeserializer;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
