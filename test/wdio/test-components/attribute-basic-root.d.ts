import type { Components, JSX } from "../dist/types/components";

interface AttributeBasicRoot extends Components.AttributeBasicRoot, HTMLElement {}
export const AttributeBasicRoot: {
    prototype: AttributeBasicRoot;
    new (): AttributeBasicRoot;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
