import type { Components, JSX } from "../dist/types/components";

interface ManualSlotTabs extends Components.ManualSlotTabs, HTMLElement {}
export const ManualSlotTabs: {
    prototype: ManualSlotTabs;
    new (): ManualSlotTabs;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
