import type { Components, JSX } from "../dist/types/components";

interface LifecycleUnloadB extends Components.LifecycleUnloadB, HTMLElement {}
export const LifecycleUnloadB: {
    prototype: LifecycleUnloadB;
    new (): LifecycleUnloadB;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
