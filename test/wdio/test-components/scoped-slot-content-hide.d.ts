import type { Components, JSX } from "../dist/types/components";

interface ScopedSlotContentHide extends Components.ScopedSlotContentHide, HTMLElement {}
export const ScopedSlotContentHide: {
    prototype: ScopedSlotContentHide;
    new (): ScopedSlotContentHide;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
