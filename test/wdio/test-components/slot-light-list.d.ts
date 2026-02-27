import type { Components, JSX } from "../dist/types/components";

interface SlotLightList extends Components.SlotLightList, HTMLElement {}
export const SlotLightList: {
    prototype: SlotLightList;
    new (): SlotLightList;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
