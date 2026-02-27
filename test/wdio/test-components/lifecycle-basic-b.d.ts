import type { Components, JSX } from "../dist/types/components";

interface LifecycleBasicB extends Components.LifecycleBasicB, HTMLElement {}
export const LifecycleBasicB: {
    prototype: LifecycleBasicB;
    new (): LifecycleBasicB;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
