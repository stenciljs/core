import type { Components, JSX } from "../dist/types/components";

interface LifecycleNestedB extends Components.LifecycleNestedB, HTMLElement {}
export const LifecycleNestedB: {
    prototype: LifecycleNestedB;
    new (): LifecycleNestedB;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
