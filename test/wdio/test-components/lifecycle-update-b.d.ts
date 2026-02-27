import type { Components, JSX } from "../dist/types/components";

interface LifecycleUpdateB extends Components.LifecycleUpdateB, HTMLElement {}
export const LifecycleUpdateB: {
    prototype: LifecycleUpdateB;
    new (): LifecycleUpdateB;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
