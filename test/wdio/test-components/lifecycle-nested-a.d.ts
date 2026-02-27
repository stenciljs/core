import type { Components, JSX } from "../dist/types/components";

interface LifecycleNestedA extends Components.LifecycleNestedA, HTMLElement {}
export const LifecycleNestedA: {
    prototype: LifecycleNestedA;
    new (): LifecycleNestedA;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
