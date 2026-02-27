import type { Components, JSX } from "../../dist/types/components";

interface ExtendsLifecycleMultilevel extends Components.ExtendsLifecycleMultilevel, HTMLElement {}
export const ExtendsLifecycleMultilevel: {
    prototype: ExtendsLifecycleMultilevel;
    new (): ExtendsLifecycleMultilevel;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
