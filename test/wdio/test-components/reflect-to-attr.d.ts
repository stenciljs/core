import type { Components, JSX } from "../dist/types/components";

interface ReflectToAttr extends Components.ReflectToAttr, HTMLElement {}
export const ReflectToAttr: {
    prototype: ReflectToAttr;
    new (): ReflectToAttr;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
