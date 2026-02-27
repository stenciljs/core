import type { Components, JSX } from "../dist/types/components";

interface LifecycleNestedC extends Components.LifecycleNestedC, HTMLElement {}
export const LifecycleNestedC: {
    prototype: LifecycleNestedC;
    new (): LifecycleNestedC;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
