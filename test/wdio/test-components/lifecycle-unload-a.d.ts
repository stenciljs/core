import type { Components, JSX } from "../dist/types/components";

interface LifecycleUnloadA extends Components.LifecycleUnloadA, HTMLElement {}
export const LifecycleUnloadA: {
    prototype: LifecycleUnloadA;
    new (): LifecycleUnloadA;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
