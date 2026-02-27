import type { Components, JSX } from "../dist/types/components";

interface ManualSlotFilter extends Components.ManualSlotFilter, HTMLElement {}
export const ManualSlotFilter: {
    prototype: ManualSlotFilter;
    new (): ManualSlotFilter;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
