import type { Components, JSX } from "../dist/types/components";

interface SlotDynamicShadowList extends Components.SlotDynamicShadowList, HTMLElement {}
export const SlotDynamicShadowList: {
    prototype: SlotDynamicShadowList;
    new (): SlotDynamicShadowList;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
