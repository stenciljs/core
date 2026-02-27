import type { Components, JSX } from "../dist/types/components";

interface ScopedSlotConnectedcallbackChild extends Components.ScopedSlotConnectedcallbackChild, HTMLElement {}
export const ScopedSlotConnectedcallbackChild: {
    prototype: ScopedSlotConnectedcallbackChild;
    new (): ScopedSlotConnectedcallbackChild;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
