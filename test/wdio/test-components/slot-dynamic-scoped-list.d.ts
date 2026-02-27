import type { Components, JSX } from "../dist/types/components";

interface SlotDynamicScopedList extends Components.SlotDynamicScopedList, HTMLElement {}
export const SlotDynamicScopedList: {
    prototype: SlotDynamicScopedList;
    new (): SlotDynamicScopedList;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
