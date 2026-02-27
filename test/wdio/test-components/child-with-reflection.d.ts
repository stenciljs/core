import type { Components, JSX } from "../dist/types/components";

interface ChildWithReflection extends Components.ChildWithReflection, HTMLElement {}
export const ChildWithReflection: {
    prototype: ChildWithReflection;
    new (): ChildWithReflection;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
