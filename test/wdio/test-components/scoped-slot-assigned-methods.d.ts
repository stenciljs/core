import type { Components, JSX } from "../dist/types/components";

interface ScopedSlotAssignedMethods extends Components.ScopedSlotAssignedMethods, HTMLElement {}
export const ScopedSlotAssignedMethods: {
    prototype: ScopedSlotAssignedMethods;
    new (): ScopedSlotAssignedMethods;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
