import type { Components, JSX } from "../dist/types/components";

interface LifecycleAsyncB extends Components.LifecycleAsyncB, HTMLElement {}
export const LifecycleAsyncB: {
    prototype: LifecycleAsyncB;
    new (): LifecycleAsyncB;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
