import type { Components, JSX } from "../dist/types/components";

interface ChildReflectNanAttribute extends Components.ChildReflectNanAttribute, HTMLElement {}
export const ChildReflectNanAttribute: {
    prototype: ChildReflectNanAttribute;
    new (): ChildReflectNanAttribute;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
