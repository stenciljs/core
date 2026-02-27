import type { Components, JSX } from "../dist/types/components";

interface ReflectNanAttribute extends Components.ReflectNanAttribute, HTMLElement {}
export const ReflectNanAttribute: {
    prototype: ReflectNanAttribute;
    new (): ReflectNanAttribute;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
