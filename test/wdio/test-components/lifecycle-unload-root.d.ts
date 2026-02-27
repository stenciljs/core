import type { Components, JSX } from "../dist/types/components";

interface LifecycleUnloadRoot extends Components.LifecycleUnloadRoot, HTMLElement {}
export const LifecycleUnloadRoot: {
    prototype: LifecycleUnloadRoot;
    new (): LifecycleUnloadRoot;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
