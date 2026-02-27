import type { Components, JSX } from "../dist/types/components";

interface ParentReflectNanAttribute extends Components.ParentReflectNanAttribute, HTMLElement {}
export const ParentReflectNanAttribute: {
    prototype: ParentReflectNanAttribute;
    new (): ParentReflectNanAttribute;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
