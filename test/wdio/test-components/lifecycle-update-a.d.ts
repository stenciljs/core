import type { Components, JSX } from "../dist/types/components";

interface LifecycleUpdateA extends Components.LifecycleUpdateA, HTMLElement {}
export const LifecycleUpdateA: {
    prototype: LifecycleUpdateA;
    new (): LifecycleUpdateA;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
