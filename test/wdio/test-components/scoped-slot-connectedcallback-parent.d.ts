import type { Components, JSX } from "../dist/types/components";

interface ScopedSlotConnectedcallbackParent extends Components.ScopedSlotConnectedcallbackParent, HTMLElement {}
export const ScopedSlotConnectedcallbackParent: {
    prototype: ScopedSlotConnectedcallbackParent;
    new (): ScopedSlotConnectedcallbackParent;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
