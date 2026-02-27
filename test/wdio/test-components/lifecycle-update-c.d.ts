import type { Components, JSX } from "../dist/types/components";

interface LifecycleUpdateC extends Components.LifecycleUpdateC, HTMLElement {}
export const LifecycleUpdateC: {
    prototype: LifecycleUpdateC;
    new (): LifecycleUpdateC;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
