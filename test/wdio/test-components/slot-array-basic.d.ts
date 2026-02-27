import type { Components, JSX } from "../dist/types/components";

interface SlotArrayBasic extends Components.SlotArrayBasic, HTMLElement {}
export const SlotArrayBasic: {
    prototype: SlotArrayBasic;
    new (): SlotArrayBasic;
};
/**
 * Used to define this component and all nested components recursively.
 */
export const defineCustomElement: () => void;
