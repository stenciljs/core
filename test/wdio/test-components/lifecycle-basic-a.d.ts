import type { Components, JSX } from "../dist/types/components";

interface LifecycleBasicA extends Components.LifecycleBasicA, HTMLElement {}
export const LifecycleBasicA: {
    prototype: LifecycleBasicA;
    new (): LifecycleBasicA;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
