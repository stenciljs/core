import type { Components, JSX } from "../dist/types/components";

interface ScopedSlotInsertbefore extends Components.ScopedSlotInsertbefore, HTMLElement {}
export const ScopedSlotInsertbefore: {
    prototype: ScopedSlotInsertbefore;
    new (): ScopedSlotInsertbefore;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
