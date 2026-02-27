import type { Components, JSX } from "../dist/types/components";

interface ScopedSlotChildInsertAdjacent extends Components.ScopedSlotChildInsertAdjacent, HTMLElement {}
export const ScopedSlotChildInsertAdjacent: {
    prototype: ScopedSlotChildInsertAdjacent;
    new (): ScopedSlotChildInsertAdjacent;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
