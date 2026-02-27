import type { Components, JSX } from "../dist/types/components";

interface ScopedSlotSlotchange extends Components.ScopedSlotSlotchange, HTMLElement {}
export const ScopedSlotSlotchange: {
    prototype: ScopedSlotSlotchange;
    new (): ScopedSlotSlotchange;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
