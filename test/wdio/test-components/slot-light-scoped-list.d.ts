import type { Components, JSX } from "../dist/types/components";

interface SlotLightScopedList extends Components.SlotLightScopedList, HTMLElement {}
export const SlotLightScopedList: {
    prototype: SlotLightScopedList;
    new (): SlotLightScopedList;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
