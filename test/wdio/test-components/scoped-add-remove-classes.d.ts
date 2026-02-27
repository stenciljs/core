import type { Components, JSX } from "../dist/types/components";

interface ScopedAddRemoveClasses extends Components.ScopedAddRemoveClasses, HTMLElement {}
export const ScopedAddRemoveClasses: {
    prototype: ScopedAddRemoveClasses;
    new (): ScopedAddRemoveClasses;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
