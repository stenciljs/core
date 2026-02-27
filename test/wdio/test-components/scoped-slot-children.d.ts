import type { Components, JSX } from "../dist/types/components";

interface ScopedSlotChildren extends Components.ScopedSlotChildren, HTMLElement {}
export const ScopedSlotChildren: {
    prototype: ScopedSlotChildren;
    new (): ScopedSlotChildren;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
