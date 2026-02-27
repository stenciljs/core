import type { Components, JSX } from "../dist/types/components";

interface LifecycleAsyncA extends Components.LifecycleAsyncA, HTMLElement {}
export const LifecycleAsyncA: {
    prototype: LifecycleAsyncA;
    new (): LifecycleAsyncA;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
