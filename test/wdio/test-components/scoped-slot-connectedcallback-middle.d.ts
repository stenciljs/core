import type { Components, JSX } from "../dist/types/components";

interface ScopedSlotConnectedcallbackMiddle extends Components.ScopedSlotConnectedcallbackMiddle, HTMLElement {}
export const ScopedSlotConnectedcallbackMiddle: {
    prototype: ScopedSlotConnectedcallbackMiddle;
    new (): ScopedSlotConnectedcallbackMiddle;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
