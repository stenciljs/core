import type { Components, JSX } from "../dist/types/components";

interface LifecycleBasicC extends Components.LifecycleBasicC, HTMLElement {}
export const LifecycleBasicC: {
    prototype: LifecycleBasicC;
    new (): LifecycleBasicC;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
