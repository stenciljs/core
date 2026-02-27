import type { Components, JSX } from "../dist/types/components";

interface ExtendsLifecycleBasic extends Components.ExtendsLifecycleBasic, HTMLElement {}
export const ExtendsLifecycleBasic: {
    prototype: ExtendsLifecycleBasic;
    new (): ExtendsLifecycleBasic;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
