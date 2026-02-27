import type { Components, JSX } from "../dist/types/components";

interface ScopedSlotAppendAndPrepend extends Components.ScopedSlotAppendAndPrepend, HTMLElement {}
export const ScopedSlotAppendAndPrepend: {
    prototype: ScopedSlotAppendAndPrepend;
    new (): ScopedSlotAppendAndPrepend;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
