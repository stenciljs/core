import type { Components, JSX } from "../dist/types/components";

interface LifecycleAsyncC extends Components.LifecycleAsyncC, HTMLElement {}
export const LifecycleAsyncC: {
    prototype: LifecycleAsyncC;
    new (): LifecycleAsyncC;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
